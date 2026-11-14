import { Job, JobFilterOptions, CreateJobInput } from '../../types/job';
import { IJobRepository } from './JobRepository';
import { LocalStorageManager, STORAGE_KEYS } from '../storage/localStorage';
import { INITIAL_DEMO_JOBS } from '../../data/demoJobs';

export class DemoJobRepository implements IJobRepository {
  private getStoredJobs(): Job[] {
    const jobs = LocalStorageManager.getItem<Job[]>(STORAGE_KEYS.JOBS, []);
    if (!jobs || jobs.length === 0) {
      LocalStorageManager.setItem(STORAGE_KEYS.JOBS, INITIAL_DEMO_JOBS);
      return [...INITIAL_DEMO_JOBS];
    }
    return jobs;
  }

  private saveJobs(jobs: Job[]): void {
    LocalStorageManager.setItem(STORAGE_KEYS.JOBS, jobs);
  }

  async getAllJobs(filters?: JobFilterOptions): Promise<Job[]> {
    let jobs = this.getStoredJobs();

    if (!filters) return jobs;

    // Search query filter (matches ID, name, queue, or tags)
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase().trim();
      jobs = jobs.filter(
        (j) =>
          j.name.toLowerCase().includes(q) ||
          j.id.toLowerCase().includes(q) ||
          j.queue.toLowerCase().includes(q) ||
          (j.tags && j.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Status filter
    if (filters.status && filters.status !== 'ALL') {
      jobs = jobs.filter((j) => j.status === filters.status);
    }

    // Priority filter
    if (filters.priority && filters.priority !== 'ALL') {
      jobs = jobs.filter((j) => j.priority === filters.priority);
    }

    // Queue filter
    if (filters.queue && filters.queue !== 'ALL') {
      jobs = jobs.filter((j) => j.queue === filters.queue);
    }

    // Sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    jobs.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'createdAt') {
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'durationMs') {
        comparison = (b.durationMs || 0) - (a.durationMs || 0);
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'priority') {
        const rank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        comparison = rank[b.priority] - rank[a.priority];
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return jobs;
  }

  async getJobById(id: string): Promise<Job | null> {
    const jobs = this.getStoredJobs();
    return jobs.find((j) => j.id === id) || null;
  }

  async createJob(input: CreateJobInput): Promise<Job> {
    const jobs = this.getStoredJobs();
    const newId = `job-${Math.floor(1000 + Math.random() * 9000)}`;

    const newJob: Job = {
      id: newId,
      name: input.name,
      queue: input.queue || 'default',
      priority: input.priority || 'MEDIUM',
      status: 'PENDING',
      durationMs: input.durationMs || 5000,
      payloadSizeKb: input.payloadSizeKb || 25,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
      tags: input.tags || ['custom', input.queue || 'default'],
    };

    const updated = [newJob, ...jobs];
    this.saveJobs(updated);
    return newJob;
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
    const jobs = this.getStoredJobs();
    const index = jobs.findIndex((j) => j.id === id);
    if (index === -1) {
      throw new Error(`Job not found with id: ${id}`);
    }

    const updatedJob = { ...jobs[index], ...updates };
    jobs[index] = updatedJob;
    this.saveJobs(jobs);
    return updatedJob;
  }

  async retryJob(id: string): Promise<Job> {
    const jobs = this.getStoredJobs();
    const index = jobs.findIndex((j) => j.id === id);
    if (index === -1) throw new Error(`Job not found: ${id}`);

    const existing = jobs[index];
    const retried: Job = {
      ...existing,
      status: 'PENDING',
      retryCount: existing.retryCount + 1,
      errorMessage: undefined,
      startedAt: undefined,
      completedAt: undefined,
      createdAt: new Date().toISOString(),
    };

    jobs[index] = retried;
    this.saveJobs(jobs);
    return retried;
  }

  async cancelJob(id: string): Promise<Job> {
    const jobs = this.getStoredJobs();
    const index = jobs.findIndex((j) => j.id === id);
    if (index === -1) throw new Error(`Job not found: ${id}`);

    const existing = jobs[index];
    if (existing.status === 'COMPLETED') {
      throw new Error('Cannot cancel a completed job');
    }

    const cancelled: Job = {
      ...existing,
      status: 'CANCELLED',
      completedAt: new Date().toISOString(),
    };

    jobs[index] = cancelled;
    this.saveJobs(jobs);
    return cancelled;
  }

  async deleteJob(id: string): Promise<boolean> {
    const jobs = this.getStoredJobs();
    const filtered = jobs.filter((j) => j.id !== id);
    if (filtered.length === jobs.length) return false;
    this.saveJobs(filtered);
    return true;
  }

  async resetToDefault(): Promise<void> {
    this.saveJobs([...INITIAL_DEMO_JOBS]);
  }
}
