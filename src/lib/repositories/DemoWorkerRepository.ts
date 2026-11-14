import { Worker } from '../../types/worker';
import { IWorkerRepository } from './WorkerRepository';
import { LocalStorageManager, STORAGE_KEYS } from '../storage/localStorage';
import { INITIAL_DEMO_WORKERS } from '../../data/demoWorkers';

export class DemoWorkerRepository implements IWorkerRepository {
  private getStoredWorkers(): Worker[] {
    const workers = LocalStorageManager.getItem<Worker[]>(STORAGE_KEYS.WORKERS, []);
    if (!workers || workers.length === 0) {
      LocalStorageManager.setItem(STORAGE_KEYS.WORKERS, INITIAL_DEMO_WORKERS);
      return [...INITIAL_DEMO_WORKERS];
    }
    return workers;
  }

  private saveWorkers(workers: Worker[]): void {
    LocalStorageManager.setItem(STORAGE_KEYS.WORKERS, workers);
  }

  async getAllWorkers(): Promise<Worker[]> {
    return this.getStoredWorkers();
  }

  async getWorkerById(id: string): Promise<Worker | null> {
    const workers = this.getStoredWorkers();
    return workers.find((w) => w.id === id) || null;
  }

  async toggleWorkerStatus(id: string): Promise<Worker> {
    const workers = this.getStoredWorkers();
    const index = workers.findIndex((w) => w.id === id);
    if (index === -1) throw new Error(`Worker not found: ${id}`);

    const current = workers[index];
    let nextStatus: Worker['status'] = 'IDLE';
    if (current.status === 'BUSY' || current.status === 'IDLE') {
      nextStatus = 'PAUSED';
    } else if (current.status === 'PAUSED') {
      nextStatus = 'OFFLINE';
    } else {
      nextStatus = 'IDLE';
    }

    const updated: Worker = {
      ...current,
      status: nextStatus,
      activeJobId: nextStatus === 'PAUSED' || nextStatus === 'OFFLINE' ? undefined : current.activeJobId,
      activeJobName: nextStatus === 'PAUSED' || nextStatus === 'OFFLINE' ? undefined : current.activeJobName,
      heartbeatAt: new Date().toISOString(),
    };

    workers[index] = updated;
    this.saveWorkers(workers);
    return updated;
  }

  async updateWorkerCapacity(id: string, concurrency: number): Promise<Worker> {
    const workers = this.getStoredWorkers();
    const index = workers.findIndex((w) => w.id === id);
    if (index === -1) throw new Error(`Worker not found: ${id}`);

    const safeConcurrency = Math.max(1, Math.min(32, concurrency));
    const updated: Worker = {
      ...workers[index],
      concurrency: safeConcurrency,
    };

    workers[index] = updated;
    this.saveWorkers(workers);
    return updated;
  }

  async resetToDefault(): Promise<void> {
    this.saveWorkers([...INITIAL_DEMO_WORKERS]);
  }
}
