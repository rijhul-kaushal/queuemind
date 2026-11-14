'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import {
  GitBranch,
  Layers,
  Server,
  Database,
  Cpu,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Code2,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PHASES = [
  {
    id: 'phase1',
    name: 'Phase 1: Frontend MVP & Simulator',
    status: 'ACTIVE NOW',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    summary: 'Next.js App Router, TypeScript, Tailwind CSS, LocalStorage persistence, multi-worker discrete-event simulator for FIFO & Priority scheduling.',
    details: [
      'Interactive SaaS dashboard with dark-first developer UI.',
      'Deterministic multi-worker scheduling engine in pure TypeScript.',
      'Visual Gantt chart with worker lanes, idle gaps, and inspection tooltips.',
      'Side-by-side metric calculations (Average Waiting Time, Turnaround, Makespan, Utilization).',
      'Local persistence with repository abstraction boundary ready for FastAPI.',
    ],
  },
  {
    id: 'phase2',
    name: 'Phase 2: FastAPI & Relational Backend',
    status: 'PLANNED',
    badgeClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60',
    summary: 'Python, FastAPI REST endpoints, PostgreSQL persistent store, and Redis queue coordinating real background tasks.',
    details: [
      'FastAPI REST endpoints for job enqueuing, cancellation, and retrieval.',
      'PostgreSQL schema for persistent job lifecycle records and worker nodes.',
      'Redis Streams / Sorted Sets for high-throughput queue ordering.',
      'FastApiJobRepository drop-in replacement for DemoJobRepository.',
    ],
  },
  {
    id: 'phase3',
    name: 'Phase 3: Distributed Worker Fleet',
    status: 'PLANNED',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    summary: 'Multi-node asynchronous Python Celery/RQ/custom workers with health heartbeats, dead-letter queues, and retries.',
    details: [
      'Distributed worker processes polling Redis queues with prefetch limits.',
      'Automatic exponential backoff with jitter on transient network/API failures.',
      'Dead-letter queue (DLQ) for poisoned tasks and unrecoverable exceptions.',
      'Worker heartbeat coordination and dead-worker task re-queueing.',
    ],
  },
  {
    id: 'phase4',
    name: 'Phase 4: ML Duration Forecasting',
    status: 'PLANNED',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
    summary: 'Machine learning regression models (scikit-learn & XGBoost) predicting task execution duration from payload features.',
    details: [
      'Feature extraction: payload size, queue category, customer tier, resource tags.',
      'Historical execution dataset extraction from PostgreSQL logs.',
      'Initial baseline scikit-learn Ridge/RandomForestRegressor.',
      'Gradient boosted regression via XGBoost with MAE & RMSE evaluation.',
      'ML-assisted scheduler using Shortest Remaining Processing Time (SRPT).',
    ],
  },
  {
    id: 'phase5',
    name: 'Phase 5: Empirical Benchmarking',
    status: 'PLANNED',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    summary: 'Rigorous empirical comparison between FIFO, Priority, and ML-assisted scheduling under heavy production workloads.',
    details: [
      'Statistically rigorous benchmark across synthetic and real production traces.',
      'Quantify average wait time reduction vs prediction error tolerance.',
      'Analyze tail latency (P99) and starvation vulnerability.',
      'No claims made without verifiable benchmark evidence.',
    ],
  },
];

export default function ArchitecturePage() {
  const [activeTab, setActiveTab] = useState<'blueprint' | 'contracts' | 'ml'>('blueprint');

  return (
    <AppShell>
      <Header
        title="System Architecture & Blueprint"
        subtitle="Multi-phase architectural design, future FastAPI + Redis + Postgres backend, and ML forecasting roadmap"
      />

      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Architecture Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 font-mono text-xs">
          <button
            onClick={() => setActiveTab('blueprint')}
            className={cn(
              'px-4 py-2 rounded-lg font-semibold transition-all',
              activeTab === 'blueprint'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            )}
          >
            System Blueprint &amp; Multi-Phase Roadmap
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={cn(
              'px-4 py-2 rounded-lg font-semibold transition-all',
              activeTab === 'contracts'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            )}
          >
            Data Contracts &amp; API Boundary
          </button>
          <button
            onClick={() => setActiveTab('ml')}
            className={cn(
              'px-4 py-2 rounded-lg font-semibold transition-all',
              activeTab === 'ml'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            )}
          >
            Future Machine Learning Pipeline
          </button>
        </div>

        {activeTab === 'blueprint' && (
          <div className="space-y-6">
            {/* System Topology Diagram Card */}
            <Card className="border-slate-800 bg-[#0e1424]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  <Server className="w-4 h-4 text-indigo-400" />
                  Target Distributed Architecture Topology (Phase 2 &amp; 3)
                </CardTitle>
                <CardDescription>
                  Separation of client presentation, REST orchestration, queue coordination, and background execution
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 font-mono text-xs">
                <div className="p-5 rounded-xl bg-black/60 border border-slate-800 text-slate-300 overflow-x-auto leading-relaxed">
                  <pre className="text-indigo-300 font-bold mb-2">QueueMind Distributed System Topology:</pre>
                  {`
+---------------------------------------------------------------------------------+
|                                 CLIENT TIER                                     |
|  Next.js 16 (App Router) + Tailwind CSS + Recharts + Deterministic Simulator    |
+---------------------------------------------------------------------------------+
                                       |
                                       | HTTP / REST (JSON)
                                       v
+---------------------------------------------------------------------------------+
|                             API ORCHESTRATION TIER                              |
|  FastAPI (Python 3.12) - Job Enqueue, Retry, Status Queries, Telemetry Stream  |
+---------------------------------------------------------------------------------+
                    |                                           |
                    | Async Writes                              | Redis Streams /
                    | (Job History, Worker Records)             | Sorted Sets
                    v                                           v
+---------------------------------------+   +-------------------------------------+
|           PERSISTENCE TIER            |   |          COORDINATION TIER          |
|  PostgreSQL 16                        |   |  Redis 7 Cluster                    |
|  - jobs table (lifecycle, duration)   |   |  - queue:default                    |
|  - workers table (health, uptime)     |   |  - queue:media-transcoding          |
|  - execution_logs table (DLQ history) |   |  - worker:heartbeats                |
+---------------------------------------+   +-------------------------------------+
                                                                |
                                                                | Task Pop (Prefetch: N)
                                                                v
+---------------------------------------------------------------------------------+
|                            DISTRIBUTED WORKER FLEET                             |
|  Worker Node Alpha (EC2)      Worker Node Beta (GKE)       Worker Node Gamma    |
|  - Concurrency: 8             - Concurrency: 4             - Concurrency: 4     |
|  - FFmpeg Transcoding         - Webhook Dispatch           - Vector Embedding   |
+---------------------------------------------------------------------------------+
                                       |
                                       | Duration Metrics Logged
                                       v
+---------------------------------------------------------------------------------+
|                             MACHINE LEARNING TIER                               |
|  scikit-learn / XGBoost Regression Engine -> Predicts Job Execution Duration    |
|  Scheduler Uses Predictions to Implement SRPT (Shortest Remaining Time First)   |
+---------------------------------------------------------------------------------+
`}
                </div>
              </CardContent>
            </Card>

            {/* Phased Roadmap Timeline */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                Evolutionary Engineering Roadmap
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {PHASES.map((phase, idx) => (
                  <Card key={phase.id} className="p-5 border-slate-800/80 bg-[#0c1220]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-100">{phase.name}</h4>
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border self-start sm:self-auto',
                          phase.badgeClass
                        )}
                      >
                        {phase.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mb-3">{phase.summary}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
                      {phase.details.map((d, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="space-y-6">
            <Card className="border-slate-800 bg-[#0e1424]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  Service Boundary &amp; TypeScript Data Contracts
                </CardTitle>
                <CardDescription>
                  Decoupled contracts enabling seamless transition from DemoJobRepository to FastApiJobRepository
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-black/60 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                  <pre className="text-indigo-400 font-bold mb-2">// 1. Core Job Data Contract</pre>
                  {`export interface Job {
  id: string;               // UUID or unique string: 'job-9841'
  name: string;             // Task identifier: 'Transcode Video H.264'
  queue: string;            // 'default' | 'media-transcoding' | 'email-delivery'
  priority: JobPriority;    // 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: JobStatus;        // 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  payloadSizeKb?: number;   // Serialized payload weight
  createdAt: string;        // ISO 8601 timestamp
  startedAt?: string;       // Execution start timestamp
  completedAt?: string;     // Completion timestamp
  durationMs: number;       // Execution duration in milliseconds
  workerId?: string;        // Assigned worker node ID
  retryCount: number;       // Number of retry attempts made
  maxRetries: number;       // Ceiling before DLQ routing
  errorMessage?: string;    // Exception string if failed
  tags?: string[];          // Arbitrary metadata tags
}`}
                </div>

                <div className="p-4 rounded-xl bg-black/60 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                  <pre className="text-indigo-400 font-bold mb-2">// 2. Repository Interface Contract</pre>
                  {`export interface IJobRepository {
  getAllJobs(filters?: JobFilterOptions): Promise<Job[]>;
  getJobById(id: string): Promise<Job | null>;
  createJob(input: CreateJobInput): Promise<Job>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job>;
  retryJob(id: string): Promise<Job>;
  cancelJob(id: string): Promise<Job>;
  deleteJob(id: string): Promise<boolean>;
  resetToDefault(): Promise<void>;
}`}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'ml' && (
          <div className="space-y-6">
            <Card className="border-slate-800 bg-[#0e1424]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Machine Learning Execution-Duration Forecasting Architecture
                </CardTitle>
                <CardDescription>
                  Theoretical foundation for Phase 4: Feature engineering, model evaluation, and SRPT scheduling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2 text-xs leading-relaxed">
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 text-purple-200">
                  <h4 className="font-semibold text-sm mb-1 text-purple-100">
                    Why ML for Workload Scheduling?
                  </h4>
                  <p className="text-purple-300 text-[11px] leading-relaxed">
                    Standard schedulers rely on static priority labels assigned by developers. However,
                    in optimal scheduling theory, the algorithm that minimizes average waiting time is
                    <strong> Shortest Remaining Processing Time (SRPT)</strong>. The barrier to SRPT in production
                    is that job durations are unknown prior to execution. By predicting duration accurately with
                    regression models, QueueMind can approximate SRPT scheduling automatically.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="font-bold text-indigo-400 block">1. Feature Engineering</span>
                    <ul className="text-slate-400 space-y-1 text-[11px]">
                      <li>&bull; Payload size (bytes)</li>
                      <li>&bull; Queue partition category</li>
                      <li>&bull; Historical task duration P50/P90</li>
                      <li>&bull; Hour of day / traffic volume</li>
                      <li>&bull; Worker hardware tier</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="font-bold text-indigo-400 block">2. Candidate Models</span>
                    <ul className="text-slate-400 space-y-1 text-[11px]">
                      <li>&bull; Ridge Regression (baseline)</li>
                      <li>&bull; Random Forest Regressor</li>
                      <li>&bull; XGBoost / LightGBM Regressor</li>
                      <li>&bull; Metrics: RMSE, MAE, R² score</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="font-bold text-indigo-400 block">3. Evaluative Guardrails</span>
                    <ul className="text-slate-400 space-y-1 text-[11px]">
                      <li>&bull; Fallback to FIFO if error &gt; 25%</li>
                      <li>&bull; Anti-starvation aging factor</li>
                      <li>&bull; Strict empirical benchmarking</li>
                      <li>&bull; Phase 5 evaluation required</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
