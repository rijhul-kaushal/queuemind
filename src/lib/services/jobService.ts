import { IJobRepository } from '../repositories/JobRepository';
import { DemoJobRepository } from '../repositories/DemoJobRepository';
import { FastApiJobRepository } from '../repositories/FastApiJobRepository';
import { Job, JobFilterOptions, CreateJobInput } from '../../types/job';
import { LocalStorageManager } from '../storage/localStorage';

const PREF_BACKEND_KEY = 'queuemind_backend_mode_v2';

class JobService {
  private repository: IJobRepository;
  private isFastApiMode: boolean = false;
  private fastApiRepo = new FastApiJobRepository();
  private demoRepo = new DemoJobRepository();

  constructor() {
    this.repository = this.demoRepo;
  }

  getIsFastApiMode(): boolean {
    return this.isFastApiMode;
  }

  setBackendMode(useFastApi: boolean) {
    this.isFastApiMode = useFastApi;
    this.repository = useFastApi ? this.fastApiRepo : this.demoRepo;
    LocalStorageManager.setItem(PREF_BACKEND_KEY, useFastApi);
  }

  async checkBackendHealth(): Promise<{ online: boolean; redisLive?: boolean }> {
    try {
      const res = await fetch('http://localhost:8000/health', {
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const data = await res.json();
        return { online: true, redisLive: data.redis_live };
      }
      return { online: false };
    } catch {
      return { online: false };
    }
  }

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

export const jobService = new JobService();
