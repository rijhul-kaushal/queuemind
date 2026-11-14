import { IWorkerRepository } from '../repositories/WorkerRepository';
import { DemoWorkerRepository } from '../repositories/DemoWorkerRepository';
import { Worker } from '../../types/worker';

class WorkerService {
  private repository: IWorkerRepository;

  constructor(repository: IWorkerRepository) {
    this.repository = repository;
  }

  setRepository(newRepo: IWorkerRepository) {
    this.repository = newRepo;
  }

  async getWorkers(): Promise<Worker[]> {
    return this.repository.getAllWorkers();
  }

  async getWorker(id: string): Promise<Worker | null> {
    return this.repository.getWorkerById(id);
  }

  async toggleWorkerStatus(id: string): Promise<Worker> {
    return this.repository.toggleWorkerStatus(id);
  }

  async updateCapacity(id: string, concurrency: number): Promise<Worker> {
    return this.repository.updateWorkerCapacity(id, concurrency);
  }

  async resetDemoData(): Promise<void> {
    return this.repository.resetToDefault();
  }
}

export const workerService = new WorkerService(new DemoWorkerRepository());
