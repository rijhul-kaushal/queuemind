import { IWorkerRepository } from '../repositories/WorkerRepository';
import { DemoWorkerRepository } from '../repositories/DemoWorkerRepository';
import { FastApiWorkerRepository } from '../repositories/FastApiWorkerRepository';
import { Worker } from '../../types/worker';

class WorkerService {
  private repository: IWorkerRepository;
  private isFastApiMode: boolean = false;
  private fastApiRepo = new FastApiWorkerRepository();
  private demoRepo = new DemoWorkerRepository();

  constructor() {
    this.repository = this.demoRepo;
  }

  getIsFastApiMode(): boolean {
    return this.isFastApiMode;
  }

  setBackendMode(useFastApi: boolean) {
    this.isFastApiMode = useFastApi;
    this.repository = useFastApi ? this.fastApiRepo : this.demoRepo;
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

export const workerService = new WorkerService();
