import { IJobRepository } from '../repositories/JobRepository';
import { DemoJobRepository } from '../repositories/DemoJobRepository';
import { Job, JobFilterOptions, CreateJobInput } from '../../types/job';

class JobService {
  private repository: IJobRepository;

  constructor(repository: IJobRepository) {
    this.repository = repository;
  }

  // Allows switching implementation dynamically (e.g. FastAPIJobRepository in Phase 2)
  setRepository(newRepo: IJobRepository) {
    this.repository = newRepo;
  }

  async getJobs(filters?: JobFilterOptions): Promise<Job[]> {
    return this.repository.getAllJobs(filters);
  }

  async getJob(id: string): Promise<Job | null> {
    return this.repository.getJobById(id);
  }

  async createJob(input: CreateJobInput): Promise<Job> {
    return this.repository.createJob(input);
  }

  async retryJob(id: string): Promise<Job> {
    return this.repository.retryJob(id);
  }

  async cancelJob(id: string): Promise<Job> {
    return this.repository.cancelJob(id);
  }

  async deleteJob(id: string): Promise<boolean> {
    return this.repository.deleteJob(id);
  }

  async resetDemoData(): Promise<void> {
    return this.repository.resetToDefault();
  }
}

export const jobService = new JobService(new DemoJobRepository());
