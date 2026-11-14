export type WorkerStatus = 'IDLE' | 'BUSY' | 'PAUSED' | 'OFFLINE';

export interface Worker {
  id: string;
  name: string;
  hostname: string;
  status: WorkerStatus;
  activeJobId?: string;
  activeJobName?: string;
  concurrency: number;
  assignedJobsCount: number;
  completedJobsCount: number;
  failedJobsCount: number;
  cpuUtilization: number;
  memoryUsageMb: number;
  uptimeSeconds: number;
  heartbeatAt: string;
  queues: string[];
  isSimulated: boolean;
}
