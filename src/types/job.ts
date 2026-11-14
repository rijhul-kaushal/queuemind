export type JobPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Job {
  id: string;
  name: string;
  queue: string;
  priority: JobPriority;
  status: JobStatus;
  payloadSizeKb?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs: number;
  workerId?: string;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  tags?: string[];
}

export interface JobFilterOptions {
  searchQuery?: string;
  status?: JobStatus | 'ALL';
  priority?: JobPriority | 'ALL';
  queue?: string | 'ALL';
  sortBy?: 'createdAt' | 'durationMs' | 'priority' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateJobInput {
  name: string;
  queue: string;
  priority: JobPriority;
  durationMs: number;
  payloadSizeKb?: number;
  tags?: string[];
}
