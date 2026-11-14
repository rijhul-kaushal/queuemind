# QueueMind: Intelligent Job Queue & Workload Scheduling Platform

> **Developer-focused background job orchestration, multi-worker scheduling simulation, and workload performance intelligence platform.**

![QueueMind Overview](https://raw.githubusercontent.com/queuemind/queuemind/main/public/preview.png)

---

## 1. Executive Summary & Vision

Modern software applications frequently execute asynchronous, resource-intensive background operations:
- Processing images, video streams, and audio waveforms.
- Transacting webhook deliveries, payment reconciliations, and push notifications.
- Generating regulatory compliance PDFs and massive data exports.
- Executing ETL pipelines, batch embeddings, and ML model inference.

Executing every task immediately saturates server resources, creates unpredictable latency spikes, and degrades user experience. Background job queues decouple task requests from execution by buffering jobs and distributing them across worker processes.

**The Main Engineering Challenge:**
*How can we efficiently distribute background jobs across multiple workers while minimizing waiting time, maintaining workload balance, and improving processing efficiency under volatile arrival patterns?*

**QueueMind** addresses this challenge through a multi-phased roadmap exploring deterministic scheduling algorithms, distributed processing architectures, and machine-learning execution-time forecasting.

---

## 2. Phased Development Roadmap

| Phase | Milestone | Status | Key Deliverables |
|---|---|---|---|
| **Phase 1** | **Frontend MVP & Simulator** | **CURRENT (Active)** | Next.js 16 App Router, TypeScript, deterministic multi-worker FIFO & Priority simulator, Gantt timeline, metrics computation, LocalStorage persistence. |
| **Phase 2** | **FastAPI & Relational Backend** | *Planned (Later)* | Python 3.12, FastAPI REST API, PostgreSQL database, Redis Streams/queues, and persistent job lifecycle tracking. |
| **Phase 3** | **Distributed Processing Fleet** | *Planned (Later)* | Celery/custom distributed Python workers, multi-worker concurrency, exponential backoff retries, dead-letter queues (DLQ), and heartbeat health checks. |
| **Phase 4** | **Machine Learning Forecasting** | *Planned (Later)* | scikit-learn & XGBoost regression models predicting execution duration from payload features; ML-assisted Shortest Remaining Processing Time (SRPT) scheduler. |
| **Phase 5** | **Empirical Evaluation** | *Planned (Later)* | Rigorous benchmarking comparing FIFO, Priority, and ML-assisted scheduling on real and synthetic workloads. |

> **Architectural Integrity Notice:** Phase 1 uses seeded demo data and a client-side discrete-event simulation engine. Future backend, distributed processing, and ML systems are architected via clean data boundaries but are **NOT** falsely represented as implemented in this phase.

---

## 3. Technology Stack (Phase 1 Frontend MVP)

- **Framework:** Next.js 16 (App Router, Turbopack/Webpack compilation)
- **Language:** TypeScript 5 (Strict type checking)
- **UI & Styling:** Tailwind CSS 4, Radix UI principles, Lucide React icons
- **Visualizations:** Recharts (Area charts, bar histograms, donut distributions)
- **Persistence:** Safe browser-only `localStorage` abstraction with SSR guards
- **Testing:** Standalone TypeScript test runner (`tsx scripts/test-scheduling.ts`)
- **Deployment:** Vercel / GitHub

---

## 4. System Architecture & Modular Design

```
src/
├── app/                              # Next.js App Router Pages
│   ├── layout.tsx                    # Dark-first root layout & metadata
│   ├── page.tsx                      # Overview Dashboard
│   ├── jobs/page.tsx                 # Job Explorer (Search, Filter, CRUD)
│   ├── workers/page.tsx              # Worker Fleet Monitor & Controls
│   ├── scheduler/page.tsx            # Scheduling Intelligence & Gantt Simulator
│   ├── analytics/page.tsx            # Analytics & Throughput Metrics
│   └── architecture/page.tsx         # System Blueprint & ML Roadmap
│
├── components/                       # Modular UI Components
│   ├── layout/                       # Sidebar, Header, AppShell
│   ├── dashboard/                    # StatCard, JobTrendsChart, QueueSummaryTable
│   ├── jobs/                         # JobFilterBar, CreateJobModal, JobDetailsModal
│   ├── workers/                      # WorkerCard, WorkloadBarChart
│   ├── scheduler/                    # GanttChart, MetricsComparison, TradeoffAnalysis
│   └── ui/                           # Button, Badge, Card, Modal
│
├── lib/                              # Core Domain & Business Logic
│   ├── scheduling/                   # Deterministic Simulation Engine
│   │   ├── types.ts                  # Simulation Job & Metric interfaces
│   │   ├── fifo.ts                   # Multi-worker FIFO algorithm
│   │   ├── priority.ts               # Multi-worker Priority algorithm
│   │   ├── metrics.ts                # Mathematical metric calculations
│   │   ├── scenarios.ts              # Predefined workload benchmark cases
│   │   └── simulator.ts              # Comparison runner & trade-off analyzer
│   ├── storage/                      # Safe browser localStorage manager
│   ├── repositories/                 # Decoupled Repository Pattern
│   │   ├── JobRepository.ts          # IJobRepository data contract
│   │   ├── DemoJobRepository.ts      # LocalStorage-backed implementation
│   │   ├── WorkerRepository.ts       # IWorkerRepository data contract
│   │   └── DemoWorkerRepository.ts   # LocalStorage-backed implementation
│   ├── services/                     # Application Services Layer
│   │   ├── jobService.ts             # Job business operations
│   │   ├── workerService.ts          # Worker telemetry & capacity
│   │   └── analyticsService.ts       # KPI aggregation & telemetry
│   └── utils.ts                      # Formatters, class merge, date helpers
│
├── data/                             # Seeded Realistic Demo Data
│   ├── demoJobs.ts                   # 14 initial diverse workload jobs
│   ├── demoWorkers.ts                # 5 worker process nodes with telemetry
│   └── demoAnalytics.ts              # 24h hourly throughput & failure stats
│
└── scripts/                          # Automated Verification
    └── test-scheduling.ts            # Unit test suite for scheduling engine
```

### Future API Compatibility (Repository Pattern)
The application accesses all job and worker data exclusively through service boundaries (`jobService` and `workerService`) that depend on the `IJobRepository` and `IWorkerRepository` interfaces.

In Phase 2, a `FastApiJobRepository` communicating with Python/FastAPI will be swapped in without modifying any UI component code.

---

## 5. Scheduling Intelligence: Core Algorithms & Metrics

The Scheduling Intelligence module (`/scheduler`) implements a deterministic discrete-event simulation engine in TypeScript.

### 5.1 FIFO Scheduling (First-In, First-Out)
- Available jobs are queued strictly in order of arrival time ($t_{\text{arrival}}$).
- When a worker becomes idle, it is assigned the earliest-arrived waiting job.
- Equal-arrival jobs preserve insertion order.
- Guarantees fairness and prevents starvation, but exposes high-priority tasks to head-of-line blocking (convoy effect).

### 5.2 Priority Scheduling (Non-Preemptive)
- Jobs are assigned priority ranks: $\text{CRITICAL (4)} > \text{HIGH (3)} > \text{MEDIUM (2)} > \text{LOW (1)}$.
- When a worker becomes available at time $t$, the ready queue (all jobs with $t_{\text{arrival}} \le t$) is sorted by priority descending.
- For identical priority tiers, arrival order is preserved (stable tie-breaking).
- **Non-preemptive:** Once a worker starts executing a task, it runs to completion without interruption.
- Dramatically accelerates urgent tasks at the risk of low-priority task starvation under heavy queue backpressure.

### 5.3 Performance Metric Mathematical Formulations

1. **Waiting Time ($W_i$):**
   $$W_i = T_{\text{start}, i} - T_{\text{arrival}, i}$$
2. **Average Waiting Time ($\bar{W}$):**
   $$\bar{W} = \frac{1}{N} \sum_{i=1}^{N} W_i$$
3. **Completion Time / Turnaround Time ($C_i$):**
   $$C_i = T_{\text{finish}, i} - T_{\text{arrival}, i} = W_i + D_i$$
4. **Average Completion Time ($\bar{C}$):**
   $$\bar{C} = \frac{1}{N} \sum_{i=1}^{N} C_i$$
5. **Makespan ($M$):**
   $$M = \max_{i} (T_{\text{finish}, i}) - \min_{i} (T_{\text{arrival}, i})$$
6. **Worker Fleet Utilization ($U$):**
   $$U = \frac{\sum_{i=1}^{N} D_i}{K \times M}$$
   *(where $K$ is the worker count and $D_i$ is task duration)*

---

## 6. Predefined Benchmark Workloads

QueueMind includes four realistic workload scenarios out of the box:

1. **Burst Arrival Spike:** 8 heterogeneous jobs arriving simultaneously ($t=0$ to $t=2s$). Demonstrates how Priority scheduling isolates Critical/High tasks while Low tasks buffer.
2. **Head-of-Line Blocking (Convoy Effect):** A heavy 14s transcoding job arrives at $t=0$, followed by rapid 2s authentication pushes. Demonstrates single-worker starvation under FIFO vs parallel worker mitigation.
3. **Staggered Distributed Stream:** Realistic microservice traffic arriving across a 25-second window on 3 worker nodes.
4. **Priority Starvation Scenario:** Continuous stream of Critical/High jobs completely starving a long Low-priority analytical query.

---

## 7. Future Backend Architecture (Phase 2 & 3 - Design Blueprint)

```
[ Next.js 16 Client ]
          |
          | HTTPS / REST (JSON)
          v
[ FastAPI Backend (Python 3.12) ]
          |
    +-----+--------------------+
    |                          |
    v                          v
[ PostgreSQL 16 ]       [ Redis 7 Cluster ]
- Job history           - Priority Queues (ZSET)
- Execution logs        - Stream coordination
- Worker state          - Heartbeat tracking
                               |
                               | BRPOP / XREADGROUP
                               v
                     [ Distributed Worker Nodes ]
                     - Worker Node Alpha (EC2)
                     - Worker Node Beta (GKE)
                     - Exponential Backoff & DLQ
```

### FastAPI API Endpoints (Planned)
- `POST /api/v1/jobs` — Enqueue a new background job with queue name and priority.
- `GET /api/v1/jobs` — List jobs with pagination, status, and queue filters.
- `GET /api/v1/jobs/{id}` — Retrieve detailed job execution state and logs.
- `POST /api/v1/jobs/{id}/retry` — Re-queue a failed job with updated retry budget.
- `POST /api/v1/jobs/{id}/cancel` — Cancel an in-flight or pending job.
- `GET /api/v1/workers` — Worker fleet telemetry, CPU, memory, and heartbeats.
- `GET /api/v1/analytics/throughput` — Time-series execution volume and failure metrics.

---

## 8. Future Machine Learning Architecture (Phase 4 - Design Blueprint)

### The Theoretical Problem
In scheduling theory, the optimal algorithm to minimize average waiting time is **Shortest Remaining Processing Time (SRPT)**. However, in distributed systems, true execution durations are unknown at arrival time.

### The Solution: Duration Regression Forecasting
QueueMind Phase 4 will introduce an ML regression pipeline:
1. **Feature Extraction:**
   - Payload size in bytes.
   - Queue partition category (`media`, `email`, `ai`, `data`).
   - Customer account tier and metadata tags.
   - Historical $P_{50} / P_{90}$ duration for this job type.
   - Fleet concurrency level at arrival time.
2. **Model Training:**
   - Baseline: Scikit-learn `RidgeRegression` & `RandomForestRegressor`.
   - Advanced: `XGBoost` gradient-boosted decision trees.
   - Loss Function: Huber Loss (robust to outlier long-running jobs).
3. **ML-Assisted Scheduler:**
   - Jobs are assigned dynamic priorities proportional to predicted duration: $\text{Rank} = f(\hat{D}_i, \text{SLA})$.
   - Approximates SRPT without requiring manual developer priority guessing.
   - Anti-starvation aging factor prevents long tasks from indefinite postponement.

---

## 9. Verification & Unit Testing

The core scheduling engine is verified through comprehensive automated unit tests covering 18 discrete assertions:

```bash
# Run the scheduling unit test suite
npm run test:scheduling
```

**Test Coverage Checklist:**
- [x] Empty workload handling ($M=0, U=0, \bar{W}=0$).
- [x] Filtering invalid non-positive durations and arrival times.
- [x] Single-worker FIFO strict arrival ordering.
- [x] Single-worker Priority non-preemptive ordering.
- [x] Equal-priority stable tie-breaking.
- [x] Multi-worker workload balance across parallel lanes.
- [x] Idle gaps and arrival latency accounting.
- [x] Side-by-side comparison winner calculation.
- [x] Automated engineering trade-off analysis generation.

---

## 10. Local Setup & Installation

### Prerequisites
- Node.js 18.x or 20.x or 22+ (tested on Node v24.11.1)
- npm 10+ or pnpm 9+

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/queuemind/queuemind.git
cd queuemind

# 2. Install dependencies
npm install

# 3. Run scheduling engine tests
npm run test:scheduling

# 4. Start local development server
npm run dev

# 5. Open browser
# Navigate to http://localhost:3000
```

### Production Build

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

---

## 11. License

This project is licensed under the Apache 2.0 License.
