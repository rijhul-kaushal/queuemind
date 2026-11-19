import { IJobRepository } from './JobRepository';
import { Job, JobFilterOptions, CreateJobInput } from '@/types/job';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class FastApiJobRepository implements IJobRepository {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  async getAllJobs(filters?: JobFilterOptions): Promise<Job[]> {
    const params = new URLSearchParams();
    if (filters?.searchQuery) params.append('search', filters.searchQuery);
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.priority && filters.priority !== 'ALL') params.append('priority', filters.priority);
    if (filters?.queue && filters.queue !== 'ALL') params.append('queue', filters.queue);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const url = `${this.baseUrl}/jobs?${params.toString()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`FastAPI error (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    return data.map(this.mapToJob);
  }

  async getJobById(id: string): Promise<Job | null> {
    const res = await fetch(`${this.baseUrl}/jobs/${id}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`FastAPI error: ${res.statusText}`);
    return this.mapToJob(await res.json());
  }

  async createJob(input: CreateJobInput): Promise<Job> {
    const res = await fetch(`${this.baseUrl}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: input.name,
        queue: input.queue || 'default',
        priority: input.priority || 'MEDIUM',
        duration_ms: input.durationMs || 5000,
        payload_size_kb: input.payloadSizeKb || 25,
        tags: input.tags || [],
      }),
    });
    if (!res.ok) throw new Error(`Failed to create job on FastAPI: ${await res.text()}`);
    return this.mapToJob(await res.json());
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
    throw new Error('Direct update not permitted on FastAPI backend; use retry or cancel actions.');
  }

  async retryJob(id: string): Promise<Job> {
    const res = await fetch(`${this.baseUrl}/jobs/${id}/retry`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to retry job on FastAPI: ${await res.text()}`);
    return this.mapToJob(await res.json());
  }

  async cancelJob(id: string): Promise<Job> {
    const res = await fetch(`${this.baseUrl}/jobs/${id}/cancel`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to cancel job on FastAPI: ${await res.text()}`);
    return this.mapToJob(await res.json());
  }

  async deleteJob(id: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/jobs/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  }

  async resetToDefault(): Promise<void> {
    await fetch(`${this.baseUrl}/reset-demo`, {
      method: 'POST',
    });
  }

  private mapToJob(raw: any): Job {
    return {
      id: raw.id,
      name: raw.name,
      queue: raw.queue,
      priority: raw.priority,
      status: raw.status,
      payloadSizeKb: raw.payloadSizeKb ?? raw.payload_size_kb,
      createdAt: raw.createdAt ?? raw.created_at,
      startedAt: raw.startedAt ?? raw.started_at,
      completedAt: raw.completedAt ?? raw.completed_at,
      durationMs: raw.durationMs ?? raw.duration_ms,
      workerId: raw.workerId ?? raw.worker_id,
      retryCount: raw.retryCount ?? raw.retry_count ?? 0,
      maxRetries: raw.maxRetries ?? raw.max_retries ?? 3,
      errorMessage: raw.errorMessage ?? raw.error_message,
      tags: raw.tags || [],
    };
  }
}
