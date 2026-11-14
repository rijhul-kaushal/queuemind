import { Job } from '../../types/job';
import { Worker } from '../../types/worker';
import {
  HOURLY_THROUGHPUT,
  DURATION_DISTRIBUTION,
  QUEUE_STATS,
  FAILURE_REASONS,
  ThroughputDataPoint,
  DurationDistributionPoint,
  QueueStatPoint,
} from '../../data/demoAnalytics';

export interface OverviewMetrics {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  cancelledJobs: number;
  activeWorkers: number;
  totalWorkers: number;
  avgDurationMs: number;
  successRate: number;
  estimatedThroughputPerMin: number;
}

export class AnalyticsService {
  computeOverviewMetrics(jobs: Job[], workers: Worker[]): OverviewMetrics {
    const totalJobs = jobs.length;
    let pendingJobs = 0;
    let processingJobs = 0;
    let completedJobs = 0;
    let failedJobs = 0;
    let cancelledJobs = 0;
    let totalDurationMs = 0;
    let durationCount = 0;

    for (const job of jobs) {
      if (job.status === 'PENDING') pendingJobs++;
      else if (job.status === 'PROCESSING') processingJobs++;
      else if (job.status === 'COMPLETED') {
        completedJobs++;
        if (job.durationMs) {
          totalDurationMs += job.durationMs;
          durationCount++;
        }
      } else if (job.status === 'FAILED') {
        failedJobs++;
        if (job.durationMs) {
          totalDurationMs += job.durationMs;
          durationCount++;
        }
      } else if (job.status === 'CANCELLED') cancelledJobs++;
    }

    const activeWorkers = workers.filter((w) => w.status === 'BUSY' || w.status === 'IDLE').length;
    const avgDurationMs = durationCount > 0 ? Math.round(totalDurationMs / durationCount) : 0;
    const finishedCount = completedJobs + failedJobs;
    const successRate = finishedCount > 0 ? Number(((completedJobs / finishedCount) * 100).toFixed(1)) : 100;

    // Approximated simulated throughput
    const estimatedThroughputPerMin = Math.round(activeWorkers * 12.5);

    return {
      totalJobs,
      pendingJobs,
      processingJobs,
      completedJobs,
      failedJobs,
      cancelledJobs,
      activeWorkers,
      totalWorkers: workers.length,
      avgDurationMs,
      successRate,
      estimatedThroughputPerMin,
    };
  }

  getHourlyThroughput(): ThroughputDataPoint[] {
    return HOURLY_THROUGHPUT;
  }

  getDurationDistribution(): DurationDistributionPoint[] {
    return DURATION_DISTRIBUTION;
  }

  getQueueStats(): QueueStatPoint[] {
    return QUEUE_STATS;
  }

  getFailureReasons() {
    return FAILURE_REASONS;
  }
}

export const analyticsService = new AnalyticsService();
