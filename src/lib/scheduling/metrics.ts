import {
  ScheduledJobOutput,
  SimulationMetrics,
  WorkerMetric,
  PriorityMetricBreakdown,
  SchedulePriority,
} from './types';

const PRIORITIES: SchedulePriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export function calculateMetrics(
  scheduledJobs: ScheduledJobOutput[],
  workerCount: number,
  earliestArrival: number
): SimulationMetrics {
  const completedJobs = scheduledJobs.length;

  if (completedJobs === 0) {
    return {
      totalJobs: 0,
      completedJobs: 0,
      averageWaitingTime: 0,
      averageCompletionTime: 0,
      makespan: 0,
      workerUtilization: 0,
      workerMetrics: Array.from({ length: workerCount }, (_, i) => ({
        workerId: i + 1,
        jobsCompleted: 0,
        busyTime: 0,
        utilization: 0,
      })),
      priorityBreakdown: PRIORITIES.map((p) => ({
        priority: p,
        count: 0,
        avgWaitingTime: 0,
        avgCompletionTime: 0,
      })),
    };
  }

  let totalWaitingTime = 0;
  let totalCompletionTime = 0;
  let latestFinish = 0;

  // Initialize worker tracking
  const workerBusyMap = new Map<number, { jobs: number; busyTime: number }>();
  for (let w = 1; w <= workerCount; w++) {
    workerBusyMap.set(w, { jobs: 0, busyTime: 0 });
  }

  // Priority tracking
  const priorityStats = new Map<
    SchedulePriority,
    { count: number; totalWait: number; totalCompletion: number }
  >();
  for (const p of PRIORITIES) {
    priorityStats.set(p, { count: 0, totalWait: 0, totalCompletion: 0 });
  }

  for (const job of scheduledJobs) {
    totalWaitingTime += job.waitingTime;
    totalCompletionTime += job.completionTime;

    if (job.finishTime > latestFinish) {
      latestFinish = job.finishTime;
    }

    // Worker busy time
    const workerStat = workerBusyMap.get(job.assignedWorkerId);
    if (workerStat) {
      workerStat.jobs += 1;
      workerStat.busyTime += job.duration;
    }

    // Priority stat
    const pStat = priorityStats.get(job.priority);
    if (pStat) {
      pStat.count += 1;
      pStat.totalWait += job.waitingTime;
      pStat.totalCompletion += job.completionTime;
    }
  }

  const averageWaitingTime = Number((totalWaitingTime / completedJobs).toFixed(2));
  const averageCompletionTime = Number((totalCompletionTime / completedJobs).toFixed(2));
  const makespan = Number((latestFinish - earliestArrival).toFixed(2));

  // Total available worker time = workerCount * makespan
  const totalBusyTime = Array.from(workerBusyMap.values()).reduce(
    (acc, cur) => acc + cur.busyTime,
    0
  );

  const totalCapacityTime = workerCount * makespan;
  const workerUtilization =
    totalCapacityTime > 0
      ? Number(Math.min(1, Math.max(0, totalBusyTime / totalCapacityTime)).toFixed(4))
      : 0;

  // Per worker metrics
  const workerMetrics: WorkerMetric[] = [];
  for (let w = 1; w <= workerCount; w++) {
    const stat = workerBusyMap.get(w) || { jobs: 0, busyTime: 0 };
    const util =
      makespan > 0
        ? Number(Math.min(1, Math.max(0, stat.busyTime / makespan)).toFixed(4))
        : 0;
    workerMetrics.push({
      workerId: w,
      jobsCompleted: stat.jobs,
      busyTime: Number(stat.busyTime.toFixed(2)),
      utilization: util,
    });
  }

  // Priority breakdown
  const priorityBreakdown: PriorityMetricBreakdown[] = PRIORITIES.map((p) => {
    const stat = priorityStats.get(p) || { count: 0, totalWait: 0, totalCompletion: 0 };
    return {
      priority: p,
      count: stat.count,
      avgWaitingTime: stat.count > 0 ? Number((stat.totalWait / stat.count).toFixed(2)) : 0,
      avgCompletionTime:
        stat.count > 0 ? Number((stat.totalCompletion / stat.count).toFixed(2)) : 0,
    };
  });

  return {
    totalJobs: completedJobs,
    completedJobs,
    averageWaitingTime,
    averageCompletionTime,
    makespan,
    workerUtilization,
    workerMetrics,
    priorityBreakdown,
  };
}
