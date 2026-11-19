import { IWorkerRepository } from './WorkerRepository';
import { Worker } from '@/types/worker';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class FastApiWorkerRepository implements IWorkerRepository {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  async getAllWorkers(): Promise<Worker[]> {
    const res = await fetch(`${this.baseUrl}/workers`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`FastAPI error: ${res.statusText}`);
    const data = await res.json();
    return data.map(this.mapToWorker);
  }

  async getWorkerById(id: string): Promise<Worker | null> {
    const res = await fetch(`${this.baseUrl}/workers/${id}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`FastAPI error: ${res.statusText}`);
    return this.mapToWorker(await res.json());
  }

  async toggleWorkerStatus(id: string): Promise<Worker> {
    const res = await fetch(`${this.baseUrl}/workers/${id}/toggle`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to toggle worker: ${res.statusText}`);
    return this.mapToWorker(await res.json());
  }

  async updateWorkerCapacity(id: string, concurrency: number): Promise<Worker> {
    const res = await fetch(`${this.baseUrl}/workers/${id}/capacity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concurrency }),
    });
    if (!res.ok) throw new Error(`Failed to update worker capacity: ${res.statusText}`);
    return this.mapToWorker(await res.json());
  }

  async resetToDefault(): Promise<void> {
    await fetch(`${this.baseUrl}/reset-demo`, {
      method: 'POST',
    });
  }

  private mapToWorker(raw: any): Worker {
    return {
      id: raw.id,
      name: raw.name,
      hostname: raw.hostname,
      status: raw.status,
      activeJobId: raw.activeJobId ?? raw.active_job_id,
      activeJobName: raw.activeJobName ?? raw.active_job_name,
      concurrency: raw.concurrency,
      assignedJobsCount: raw.assignedJobsCount ?? raw.assigned_jobs_count ?? 0,
      completedJobsCount: raw.completedJobsCount ?? raw.completed_jobs_count ?? 0,
      failedJobsCount: raw.failedJobsCount ?? raw.failed_jobs_count ?? 0,
      cpuUtilization: raw.cpuUtilization ?? raw.cpu_utilization ?? 0,
      memoryUsageMb: raw.memoryUsageMb ?? raw.memory_usage_mb ?? 128,
      uptimeSeconds: raw.uptimeSeconds ?? raw.uptime_seconds ?? 0,
      heartbeatAt: raw.heartbeatAt ?? raw.heartbeat_at ?? new Date().toISOString(),
      queues: raw.queues || ['default'],
      isSimulated: raw.isSimulated ?? raw.is_simulated ?? false,
    };
  }
}
