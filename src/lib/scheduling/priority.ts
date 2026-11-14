import {
  SimulationJobInput,
  ScheduledJobOutput,
  SimulationResult,
  SimulationLogEvent,
  SchedulePriority,
} from './types';
import { calculateMetrics } from './metrics';

const PRIORITY_RANK: Record<SchedulePriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export function runPrioritySimulation(
  rawJobs: SimulationJobInput[],
  workerCount: number
): SimulationResult {
  if (!rawJobs || rawJobs.length === 0 || workerCount <= 0) {
    return {
      algorithm: 'PRIORITY',
      workerCount: Math.max(1, workerCount),
      scheduledJobs: [],
      metrics: calculateMetrics([], Math.max(1, workerCount), 0),
      timelineLength: 0,
      logs: [],
    };
  }

  // Filter valid jobs: duration > 0 and arrivalTime >= 0
  const jobs: SimulationJobInput[] = rawJobs
    .filter((j) => j.duration > 0 && j.arrivalTime >= 0)
    .map((j) => ({ ...j }));

  if (jobs.length === 0) {
    return {
      algorithm: 'PRIORITY',
      workerCount,
      scheduledJobs: [],
      metrics: calculateMetrics([], workerCount, 0),
      timelineLength: 0,
      logs: [],
    };
  }

  const earliestArrival = Math.min(...jobs.map((j) => j.arrivalTime));

  // Sort initially by arrival time, then by priority descending
  jobs.sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) {
      return a.arrivalTime - b.arrivalTime;
    }
    return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
  });

  const logs: SimulationLogEvent[] = [];
  const scheduledJobs: ScheduledJobOutput[] = [];

  // Track each worker's available time
  const workerAvailableAt: number[] = new Array(workerCount).fill(0);

  let remainingJobs = [...jobs];
  const readyQueue: SimulationJobInput[] = [];

  let currentTime = 0;

  while (remainingJobs.length > 0 || readyQueue.length > 0) {
    // 1. Move all jobs with arrivalTime <= currentTime to readyQueue
    while (remainingJobs.length > 0 && remainingJobs[0].arrivalTime <= currentTime) {
      const arrivedJob = remainingJobs.shift()!;
      readyQueue.push(arrivedJob);
      logs.push({
        timestamp: arrivedJob.arrivalTime,
        event: `Job "${arrivedJob.name}" [${arrivedJob.priority}] arrived in priority queue`,
        jobId: arrivedJob.id,
        jobName: arrivedJob.name,
      });
    }

    // 2. Sort ready queue: highest priority first, then earliest arrival (stable FIFO tie-break)
    readyQueue.sort((a, b) => {
      const rankDiff = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      if (rankDiff !== 0) return rankDiff;
      return a.arrivalTime - b.arrivalTime;
    });

    // 3. Dispatch to available workers
    let assignedAny = false;
    for (let w = 0; w < workerCount; w++) {
      if (workerAvailableAt[w] <= currentTime && readyQueue.length > 0) {
        const job = readyQueue.shift()!;
        const startTime = currentTime;
        const finishTime = Number((startTime + job.duration).toFixed(2));
        const waitingTime = Number((startTime - job.arrivalTime).toFixed(2));
        const completionTime = Number((finishTime - job.arrivalTime).toFixed(2));

        workerAvailableAt[w] = finishTime;

        scheduledJobs.push({
          ...job,
          assignedWorkerId: w + 1,
          startTime,
          finishTime,
          waitingTime,
          completionTime,
        });

        logs.push({
          timestamp: startTime,
          event: `Worker ${w + 1} scheduled "${job.name}" [${job.priority}] (Wait: ${waitingTime}s, Duration: ${job.duration}s)`,
          jobId: job.id,
          jobName: job.name,
          workerId: w + 1,
        });

        logs.push({
          timestamp: finishTime,
          event: `Worker ${w + 1} finished "${job.name}" [${job.priority}] (Turnaround: ${completionTime}s)`,
          jobId: job.id,
          jobName: job.name,
          workerId: w + 1,
        });

        assignedAny = true;
      }
    }

    // 4. Time progression if no worker took a job
    if (!assignedAny) {
      if (readyQueue.length === 0 && remainingJobs.length > 0) {
        const nextArrival = remainingJobs[0].arrivalTime;
        const busyWorkersFinishTimes = workerAvailableAt.filter((t) => t > currentTime);

        if (busyWorkersFinishTimes.length > 0) {
          const earliestFinish = Math.min(...busyWorkersFinishTimes);
          currentTime = Math.min(nextArrival, earliestFinish);
        } else {
          currentTime = nextArrival;
        }
      } else if (readyQueue.length > 0) {
        const busyWorkersFinishTimes = workerAvailableAt.filter((t) => t > currentTime);
        if (busyWorkersFinishTimes.length > 0) {
          currentTime = Math.min(...busyWorkersFinishTimes);
        } else {
          currentTime += 1;
        }
      }
    }
  }

  scheduledJobs.sort((a, b) => a.startTime - b.startTime || a.assignedWorkerId - b.assignedWorkerId);

  const metrics = calculateMetrics(scheduledJobs, workerCount, earliestArrival);
  const timelineLength = scheduledJobs.length > 0
    ? Math.max(...scheduledJobs.map((j) => j.finishTime))
    : 0;

  return {
    algorithm: 'PRIORITY',
    workerCount,
    scheduledJobs,
    metrics,
    timelineLength,
    logs,
  };
}
