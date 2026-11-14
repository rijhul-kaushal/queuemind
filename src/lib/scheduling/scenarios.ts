import { SimulationJobInput } from './types';

export interface WorkloadScenario {
  id: string;
  name: string;
  description: string;
  recommendedWorkers: number;
  expectedInsight: string;
  jobs: SimulationJobInput[];
}

export const WORKLOAD_SCENARIOS: WorkloadScenario[] = [
  {
    id: 'burst-spike',
    name: 'Burst Arrival Spike',
    description: '8 jobs arriving almost simultaneously at t=0 to t=2s with varied priority and duration.',
    recommendedWorkers: 2,
    expectedInsight: 'Priority scheduling significantly reduces wait time for Critical and High jobs while Low jobs queue up.',
    jobs: [
      { id: 'sim-1', name: 'Auth Token Refresh Batch', arrivalTime: 0, duration: 4, priority: 'MEDIUM', queue: 'auth' },
      { id: 'sim-2', name: 'Emergency Payment Reversal', arrivalTime: 0, duration: 3, priority: 'CRITICAL', queue: 'billing' },
      { id: 'sim-3', name: 'Daily Analytics Aggregation', arrivalTime: 1, duration: 8, priority: 'LOW', queue: 'analytics' },
      { id: 'sim-4', name: 'OTP SMS Dispatch', arrivalTime: 1, duration: 2, priority: 'CRITICAL', queue: 'notifications' },
      { id: 'sim-5', name: 'Customer Welcome Email', arrivalTime: 2, duration: 3, priority: 'HIGH', queue: 'email' },
      { id: 'sim-6', name: 'Profile Avatar Thumbnail', arrivalTime: 2, duration: 5, priority: 'MEDIUM', queue: 'media' },
      { id: 'sim-7', name: 'Log Archival Compress', arrivalTime: 2, duration: 7, priority: 'LOW', queue: 'maintenance' },
      { id: 'sim-8', name: 'Security Audit Webhook', arrivalTime: 3, duration: 2, priority: 'HIGH', queue: 'webhooks' },
    ],
  },
  {
    id: 'convoy-effect',
    name: 'Head-of-Line Blocking (Convoy Effect)',
    description: 'A heavy ETL job arrives at t=0, followed by multiple quick high-priority notifications.',
    recommendedWorkers: 1,
    expectedInsight: 'Under a single worker, FIFO delays quick critical jobs behind the heavy job. On multi-workers, Priority re-orders newly arrived tasks.',
    jobs: [
      { id: 'sim-c1', name: 'Massive Video Transcoding', arrivalTime: 0, duration: 14, priority: 'LOW', queue: 'video' },
      { id: 'sim-c2', name: '2FA Verification Push', arrivalTime: 2, duration: 2, priority: 'CRITICAL', queue: 'auth' },
      { id: 'sim-c3', name: 'Fraud Alert Notification', arrivalTime: 3, duration: 2, priority: 'CRITICAL', queue: 'billing' },
      { id: 'sim-c4', name: 'Database Index Maintenance', arrivalTime: 4, duration: 10, priority: 'LOW', queue: 'maintenance' },
      { id: 'sim-c5', name: 'Password Reset Token', arrivalTime: 5, duration: 2, priority: 'HIGH', queue: 'auth' },
      { id: 'sim-c6', name: 'Order Confirmation Webhook', arrivalTime: 6, duration: 3, priority: 'HIGH', queue: 'webhooks' },
    ],
  },
  {
    id: 'staggered-stream',
    name: 'Staggered Distributed Stream',
    description: 'Realistic distributed service traffic arriving gradually between t=0s and t=25s.',
    recommendedWorkers: 3,
    expectedInsight: 'With 3 workers, queue backpressure remains low and both algorithms deliver near-optimal makespan with subtle wait time differences.',
    jobs: [
      { id: 'sim-s1', name: 'PDF Invoice Generation', arrivalTime: 0, duration: 6, priority: 'MEDIUM', queue: 'billing' },
      { id: 'sim-s2', name: 'Sync CRM Contacts', arrivalTime: 2, duration: 4, priority: 'LOW', queue: 'sync' },
      { id: 'sim-s3', name: 'Webhook Dispatch: Stripe Charge', arrivalTime: 5, duration: 3, priority: 'HIGH', queue: 'webhooks' },
      { id: 'sim-s4', name: 'Machine Learning Preprocessing', arrivalTime: 7, duration: 9, priority: 'MEDIUM', queue: 'ml-pipeline' },
      { id: 'sim-s5', name: 'SLA Breach Incident Alert', arrivalTime: 10, duration: 2, priority: 'CRITICAL', queue: 'monitoring' },
      { id: 'sim-s6', name: 'User Profile Cache Invalidation', arrivalTime: 12, duration: 3, priority: 'HIGH', queue: 'cache' },
      { id: 'sim-s7', name: 'Nightly Backup Snapshot', arrivalTime: 16, duration: 8, priority: 'LOW', queue: 'maintenance' },
      { id: 'sim-s8', name: 'Live Chat Transcript Archival', arrivalTime: 19, duration: 4, priority: 'MEDIUM', queue: 'chat' },
      { id: 'sim-s9', name: 'Fraud Sentinel Check', arrivalTime: 22, duration: 2, priority: 'CRITICAL', queue: 'security' },
    ],
  },
  {
    id: 'priority-starvation',
    name: 'Priority Starvation Scenario',
    description: 'Continuous stream of High/Critical jobs overwhelming a long Low-priority batch job.',
    recommendedWorkers: 2,
    expectedInsight: 'Demonstrates low-priority starvation under Priority scheduling vs FIFO fairness.',
    jobs: [
      { id: 'sim-p1', name: 'Big Data Parquet Export', arrivalTime: 0, duration: 12, priority: 'LOW', queue: 'data-lake' },
      { id: 'sim-p2', name: 'Expedited Shipment Notice', arrivalTime: 1, duration: 3, priority: 'HIGH', queue: 'logistics' },
      { id: 'sim-p3', name: 'Payment Settlement Callback', arrivalTime: 3, duration: 3, priority: 'CRITICAL', queue: 'payments' },
      { id: 'sim-p4', name: 'Live Stream Ingestion Segment', arrivalTime: 5, duration: 4, priority: 'HIGH', queue: 'streaming' },
      { id: 'sim-p5', name: 'Urgent System Health Ping', arrivalTime: 7, duration: 2, priority: 'CRITICAL', queue: 'health' },
      { id: 'sim-p6', name: 'Email Newsletter Send (100k)', arrivalTime: 8, duration: 10, priority: 'LOW', queue: 'marketing' },
      { id: 'sim-p7', name: 'Order Status Push Notification', arrivalTime: 10, duration: 2, priority: 'HIGH', queue: 'notifications' },
    ],
  },
];
