import { Job, JobFilterOptions, CreateJobInput } from '../../types/job';

export interface IJobRepository {
  getAllJobs(filters?: JobFilterOptions): Promise<Job[]>;
  getJobById(id: string): Promise<Job | null>;
  createJob(input: CreateJobInput): Promise<Job>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job>;
  retryJob(id: string): Promise<Job>;
  cancelJob(id: string): Promise<Job>;
  deleteJob(id: string): Promise<boolean>;
  resetToDefault(): Promise<void>;
}
