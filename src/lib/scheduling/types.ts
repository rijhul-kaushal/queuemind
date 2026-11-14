export type SchedulePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface SimulationJobInput {
  id: string;
  name: string;
  arrivalTime: number; // in seconds
  duration: number; // in seconds
  priority: SchedulePriority;
  queue?: string;
  color?: string;
}

export interface ScheduledJobOutput extends SimulationJobInput {
  assignedWorkerId: number; // 1-indexed: 1, 2, ...
  startTime: number;
  finishTime: number;
  waitingTime: number; // startTime - arrivalTime
  completionTime: number; // finishTime - arrivalTime (turnaround time)
}

export interface WorkerMetric {
  workerId: number;
  jobsCompleted: number;
  busyTime: number;
  utilization: number; // busyTime / makespan
}

export interface PriorityMetricBreakdown {
  priority: SchedulePriority;
  count: number;
  avgWaitingTime: number;
  avgCompletionTime: number;
}

export interface SimulationMetrics {
  totalJobs: number;
  completedJobs: number;
  averageWaitingTime: number;
  averageCompletionTime: number;
  makespan: number; // max(finishTime) - min(arrivalTime)
  workerUtilization: number; // total busy time / (workerCount * makespan)
  workerMetrics: WorkerMetric[];
  priorityBreakdown: PriorityMetricBreakdown[];
}

export type SchedulingAlgorithm = 'FIFO' | 'PRIORITY';

export interface SimulationLogEvent {
  timestamp: number;
  event: string;
  jobId: string;
  jobName: string;
  workerId?: number;
}

export interface SimulationResult {
  algorithm: SchedulingAlgorithm;
  workerCount: number;
  scheduledJobs: ScheduledJobOutput[];
  metrics: SimulationMetrics;
  timelineLength: number;
  logs: SimulationLogEvent[];
}

export interface AlgorithmComparison {
  workloadName: string;
  workerCount: number;
  jobCount: number;
  fifo: SimulationResult;
  priority: SimulationResult;
  diff: {
    avgWaitDiff: number; // priority - fifo (negative means priority waited less)
    avgWaitPercentDiff: number;
    avgCompletionDiff: number;
    makespanDiff: number;
    utilizationDiff: number;
  };
  winner: {
    waitingTime: 'FIFO' | 'PRIORITY' | 'TIE';
    completionTime: 'FIFO' | 'PRIORITY' | 'TIE';
    makespan: 'FIFO' | 'PRIORITY' | 'TIE';
    workerUtilization: 'FIFO' | 'PRIORITY' | 'TIE';
  };
  tradeoffAnalysis: string[];
}
