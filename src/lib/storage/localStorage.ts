/**
 * Safe browser localStorage utility for QueueMind with SSR protection and error handling.
 */

export const STORAGE_KEYS = {
  JOBS: 'queuemind_jobs_v1',
  WORKERS: 'queuemind_workers_v1',
  PREFERENCES: 'queuemind_preferences_v1',
  SIMULATION_WORKLOAD: 'queuemind_sim_workload_v1',
} as const;

export class LocalStorageManager {
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  static getItem<T>(key: string, defaultValue: T): T {
    if (!this.isBrowser()) return defaultValue;
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (err) {
      console.warn(`[QueueMind Storage] Error reading key "${key}":`, err);
      return defaultValue;
    }
  }

  static setItem<T>(key: string, value: T): boolean {
    if (!this.isBrowser()) return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`[QueueMind Storage] Error saving key "${key}":`, err);
      return false;
    }
  }

  static removeItem(key: string): boolean {
    if (!this.isBrowser()) return false;
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.warn(`[QueueMind Storage] Error removing key "${key}":`, err);
      return false;
    }
  }

  static clearQueueMindData(): void {
    if (!this.isBrowser()) return;
    try {
      Object.values(STORAGE_KEYS).forEach((k) => window.localStorage.removeItem(k));
    } catch (err) {
      console.warn('[QueueMind Storage] Error clearing local storage:', err);
    }
  }
}
