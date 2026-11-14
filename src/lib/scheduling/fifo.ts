import {
  SimulationJobInput,
  ScheduledJobOutput,
  SimulationResult,
  SimulationLogEvent,
} from './types';
import { calculateMetrics } from './metrics';

export function runFifoSimulation(
  rawJobs: SimulationJobInput[],
  workerCount: number
): SimulationResult {
  if (!rawJobs || rawJobs.length === 0 || workerCount <= 0) {
    return {
      algorithm: 'FIFO',
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
      algorithm: 'FIFO',
      workerCount,
      scheduledJobs: [],
      metrics: calculateMetrics([], workerCount, 0),
      timelineLength: 0,
      logs: [],
    };
  }

  // Find earliest arrival time across all jobs
  const earliestArrival = Math.min(...jobs.map((j) => j.arrivalTime));

  // Sort initially by arrival time, then original order
  jobs.sort((a, b) => a.arrivalTime - b.arrivalTime);

  const logs: SimulationLogEvent[] = [];
  const scheduledJobs: ScheduledJobOutput[] = [];

  // Track each worker's available time
  // workerId is 1-indexed: 1, 2, ..., workerCount
  const workerAvailableAt: number[] = new Array(workerCount).fill(0);

  // Unprocessed jobs
  let remainingJobs = [...jobs];
  // Ready queue: jobs that have arrived and are waiting to be dispatched
  const readyQueue: SimulationJobInput[] = [];

  // Simulation time advances event by event
  let currentTime = 0;

  while (remainingJobs.length > 0 || readyQueue.length > 0) {
    // 1. Move all jobs with arrivalTime <= currentTime from remainingJobs to readyQueue
    while (remainingJobs.length > 0 && remainingJobs[0].arrivalTime <= currentTime) {
      const arrivedJob = remainingJobs.shift()!;
      readyQueue.push(arrivedJob);
      logs.push({
        timestamp: arrivedJob.arrivalTime,
        event: `Job "${arrivedJob.name}" arrived in FIFO queue`,
        jobId: arrivedJob.id,
        jobName: arrivedJob.name,
      });
    }

    // 2. Find any workers available at or before currentTime
    let assignedAny = false;
    for (let w = 0; w < workerCount; w++) {
      if (workerAvailableAt[w] <= currentTime && readyQueue.length > 0) {
        // FIFO: pick the first in readyQueue (which is the earliest arrived)
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
          event: `Worker ${w + 1} started "${job.name}" (Wait: ${waitingTime}s, Duration: ${job.duration}s)`,
          jobId: job.id,
          jobName: job.name,
          workerId: w + 1,
        });

        logs.push({
          timestamp: finishTime,
          event: `Worker ${w + 1} completed "${job.name}" (Turnaround: ${completionTime}s)`,
          jobId: job.id,
          jobName: job.name,
          workerId: w + 1,
        });

        assignedAny = true;
      }
    }

    // 3. If no worker could be assigned:
    // Either readyQueue is empty (need to jump to next arrival)
    // Or all workers are busy (need to jump to next worker finish time or arrival time)
    if (!assignedAny) {
      if (readyQueue.length === 0 && remainingJobs.length > 0) {
        // All workers may be idle or busy, but readyQueue is empty
        // Next event could be next job arrival OR an active worker finishing
        const nextArrival = remainingJobs[0].arrivalTime;
        const busyWorkersFinishTimes = workerAvailableAt.filter((t) => t > currentTime);

        if (busyWorkersFinishTimes.length > 0) {
          const earliestFinish = Math.min(...busyWorkersFinishTimes);
          currentTime = Math.min(nextArrival, earliestFinish);
        } else {
          currentTime = nextArrival;
        }
      } else if (readyQueue.length > 0) {
        // Ready queue has jobs, but all workers are busy at currentTime
        const busyWorkersFinishTimes = workerAvailableAt.filter((t) => t > currentTime);
        if (busyWorkersFinishTimes.length > 0) {
          currentTime = Math.min(...busyWorkersFinishTimes);
        } else {
          // Fallback advance if edge case
          currentTime += 1;
        }
      }
    }
  }

  // Sort scheduled jobs by startTime, then worker
  scheduledJobs.sort((a, b) => a.startTime - b.startTime || a.assignedWorkerId - b.assignedWorkerId);

  const metrics = calculateMetrics(scheduledJobs, workerCount, earliestArrival);
  const timelineLength = scheduledJobs.length > 0
    ? Math.max(...scheduledJobs.map((j) => j.finishTime))
    : 0;

  return {
    algorithm: 'FIFO',
    workerCount,
    scheduledJobs,
    metrics,
    timelineLength,
    logs,
  };
}
