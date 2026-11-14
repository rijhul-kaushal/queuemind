export interface ThroughputDataPoint {
  time: string;
  completed: number;
  failed: number;
  enqueued: number;
}

export interface DurationDistributionPoint {
  range: string;
  count: number;
  label: string;
}

export interface QueueStatPoint {
  name: string;
  pending: number;
  processing: number;
  completed: number;
  avgLatencyMs: number;
}

export const HOURLY_THROUGHPUT: ThroughputDataPoint[] = [
  { time: '00:00', completed: 184, failed: 2, enqueued: 190 },
  { time: '02:00', completed: 120, failed: 1, enqueued: 125 },
  { time: '04:00', completed: 95, failed: 0, enqueued: 92 },
  { time: '06:00', completed: 210, failed: 3, enqueued: 220 },
  { time: '08:00', completed: 480, failed: 7, enqueued: 510 },
  { time: '10:00', completed: 690, failed: 12, enqueued: 720 },
  { time: '12:00', completed: 840, failed: 9, enqueued: 835 },
  { time: '14:00', completed: 920, failed: 14, enqueued: 960 },
  { time: '16:00', completed: 860, failed: 11, enqueued: 850 },
  { time: '18:00', completed: 640, failed: 6, enqueued: 630 },
  { time: '20:00', completed: 430, failed: 4, enqueued: 440 },
  { time: '22:00', completed: 280, failed: 2, enqueued: 275 },
];

export const DURATION_DISTRIBUTION: DurationDistributionPoint[] = [
  { range: '< 1s', count: 1420, label: 'Sub-second Notifications' },
  { range: '1s - 5s', count: 2180, label: 'Fast Webhooks & API' },
  { range: '5s - 15s', count: 960, label: 'Standard Database I/O' },
  { range: '15s - 60s', count: 480, label: 'PDF Reports & Exports' },
  { range: '1m - 5m', count: 185, label: 'Batch Vector Embeddings' },
  { range: '> 5m', count: 42, label: 'Heavy Video Transcoding' },
];

export const QUEUE_STATS: QueueStatPoint[] = [
  { name: 'default', pending: 8, processing: 4, completed: 3200, avgLatencyMs: 420 },
  { name: 'email-delivery', pending: 42, processing: 8, completed: 4820, avgLatencyMs: 850 },
  { name: 'media-transcoding', pending: 6, processing: 2, completed: 412, avgLatencyMs: 145000 },
  { name: 'ai-inference', pending: 12, processing: 4, completed: 980, avgLatencyMs: 48000 },
  { name: 'data-pipeline', pending: 15, processing: 3, completed: 1420, avgLatencyMs: 32000 },
];

export const FAILURE_REASONS = [
  { reason: 'Upstream Rate Limit (HTTP 429)', count: 28, percentage: 45.2 },
  { reason: 'Timeout / Deadline Exceeded', count: 16, percentage: 25.8 },
  { reason: 'Process Out of Memory (OOM)', count: 11, percentage: 17.7 },
  { reason: 'Database Connection Pool Exhausted', count: 5, percentage: 8.1 },
  { reason: 'Invalid JSON / Schema Mismatch', count: 2, percentage: 3.2 },
];
