import { Worker } from '../../types/worker';

export interface IWorkerRepository {
  getAllWorkers(): Promise<Worker[]>;
  getWorkerById(id: string): Promise<Worker | null>;
  toggleWorkerStatus(id: string): Promise<Worker>;
  updateWorkerCapacity(id: string, concurrency: number): Promise<Worker>;
  resetToDefault(): Promise<void>;
}
