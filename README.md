# QueueMind: Intelligent Job Queue & Workload Scheduling Platform

> **Developer-focused background job orchestration, multi-worker scheduling simulation, and workload performance intelligence platform.**

<!-- Add a screenshot of the project when available. -->
<img width="1916" height="948" alt="image" src="https://github.com/user-attachments/assets/3f4d7e21-d007-4436-b58f-9aa2554e25c9" />

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

## 2. Development Roadmap

| Phase | Status | What exists |
|---|---|---|
| **1 — Frontend MVP** | **Implemented** | Next.js 16, TypeScript, FIFO/Priority discrete-event simulator, Gantt chart, metrics, browser demo data. |
| **2 — FastAPI + persistence** | **Implemented; local verification performed** | FastAPI REST endpoints, async SQLAlchemy, PostgreSQL 16, Redis 7 sorted-set queues, job history, frontend Live Mode. |
| **3 — Worker execution** | **Implemented; further validation needed** | Independent Python worker process, asyncio concurrency, Redis job consumption, heartbeat, retry/backoff, DLQ and orphan-recovery logic. |
| **4 — ML duration prediction** | **Planned** | Train regression models and evaluate predicted-duration scheduling. |
| **5 — Benchmarking** | **Planned** | Reproducible comparative experiments for FIFO, Priority and ML scheduling. |

**What is real vs simulated:** The API, database, Redis queue coordination and worker processes are real local software components. Task handlers in `backend/tasks.py` **simulate** email, media, inference and data-pipeline operations rather than integrating external providers. Multi-machine deployment and rigorous failure-injection testing are not yet demonstrated. No ML model or 1,000+ workload benchmark is claimed as implemented.

**Local status:** Redis and PostgreSQL Docker containers were observed healthy during setup. The repository contains the Phase 2/3 commits; passing all end-to-end scenarios still requires explicit testing.

---

## 3. Technology Stack

- **Framework:** Next.js 16 (App Router, Turbopack/Webpack compilation)
- **Language:** TypeScript 5 (Strict type checking)
- **UI & Styling:** Tailwind CSS 4, Radix UI principles, Lucide React icons
- **Visualizations:** Recharts (Area charts, bar histograms, donut distributions)
- **Persistence:** Safe browser-only `localStorage` abstraction with SSR guards
- **Testing:** Standalone TypeScript test runner (`tsx scripts/test-scheduling.ts`)
- **Backend:** Python, FastAPI, SQLAlchemy async, Pydantic Settings, PostgreSQL 16 / SQLite fallback
- **Queue broker:** Redis 7 sorted sets; fakeredis development fallback
- **Workers:** Python asyncio, retries with backoff, dead-letter queue and heartbeat monitoring
- **Infrastructure:** Docker Compose for PostgreSQL and Redis
- **Deployment:** Next.js frontend supports Vercel; full backend/worker stack is currently local

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

### Implemented API Integration (Repository Pattern)
The application accesses all job and worker data exclusively through service boundaries (`jobService` and `workerService`) that depend on the `IJobRepository` and `IWorkerRepository` interfaces.

Phase 2 added `FastApiJobRepository.ts` and `FastApiWorkerRepository.ts` for Live Mode. The original demo repositories remain available.

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

## 7. Backend and Worker Architecture (Phases 2 & 3)

```text
Next.js frontend (localhost:3000)
    | Live Mode / REST
    v
FastAPI (localhost:8000)
    |                  |
    v                  v
PostgreSQL 16       Redis 7 (sorted-set queues)
job records         priority, delayed retries, DLQ
worker records           |
execution logs           v
                    Python worker process(es)
                    task execution + heartbeats
```

The backend code lives under `backend/`: `main.py` registers API routes; `models.py` and `database.py` handle persistence; `api/` and `services/` manage jobs, workers, queues and analytics; `queue/` coordinates Redis queues and heartbeats; `worker.py` runs independent workers; `tasks.py` provides simulated task handlers.

**Implemented APIs:** `GET /health`, `GET /docs`, `GET/POST /api/v1/jobs`, job detail/logs/retry/cancel/delete, `GET /api/v1/workers`, `GET /api/v1/queues`, `GET /api/v1/queues/dlq`, DLQ replay, analytics overview/throughput and `POST /api/v1/reset-demo`.

**Queue policy:** Redis `ZPOPMIN` atomically removes jobs from each sorted-set queue. Priority order is CRITICAL, HIGH, MEDIUM, LOW, with arrival-time tie breaking. Across multiple named queues, workers check subscribed queues in order; this is not a globally optimal multi-queue scheduler.

**Reliability paths in code:** Exponential-backoff delayed retries, dead-letter routing, heartbeat TTL and stale-worker recovery. Their presence in code is not proof that every crash or concurrent-worker edge case has been tested.

**Important:** `POST /api/v1/reset-demo` and the frontend reset action **delete existing jobs, execution logs and worker records** before reseeding. Do not run them on data you want to keep.

For further details, see [BACKEND_SETUP.md](BACKEND_SETUP.md).

---

## 8. Future Machine Learning Architecture (Phase 4 - Design Blueprint)

### The Theoretical Problem
Shortest-job-first scheduling can minimize mean waiting time under idealized assumptions when durations are known. Preemptive SRPT is related; real workloads have unknown durations, fairness constraints and prediction error.

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
   - Explores predicted-duration-aware scheduling, to be evaluated against FIFO and Priority.
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

### Requirements
- Node.js and npm
- Python with FastAPI, Uvicorn, SQLAlchemy, Pydantic Settings, Redis client and async database drivers installed
- Docker Desktop and Docker Compose for the PostgreSQL 16 + Redis 7 local setup

### First-time frontend setup

```cmd
git clone https://github.com/rijhul-kaushal/queuemind.git
cd queuemind
npm install
npm run test:scheduling
```

### Start local infrastructure

```cmd
docker compose up -d
docker compose ps
```

Create a local `.env` (ignored by Git). The PostgreSQL password must match your `docker-compose.yml`:

```dotenv
DATABASE_URL=postgresql+asyncpg://queuemind:YOUR_LOCAL_POSTGRES_PASSWORD@localhost:5432/queuemind
REDIS_URL=redis://localhost:6379/0
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

**Terminal 1 — FastAPI:**
```cmd
python -m uvicorn backend.main:app --reload --port 8000
```
Open [http://localhost:8000/health](http://localhost:8000/health) and [http://localhost:8000/docs](http://localhost:8000/docs). Confirm `redis_live` is `true` when testing cross-process workers.

**Terminal 2 — worker:**
```cmd
python -m backend.worker --worker-id worker-alpha --concurrency 4
```

**Terminal 3 — frontend:**
```cmd
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and switch to Live Mode for backend-backed data. The simulator also works in Demo Mode.

**Stop safely:** Use Ctrl+C in each Python/Node terminal. Then `docker compose stop` to stop Redis and PostgreSQL without removing their containers or named volumes. Later use `docker compose start` to resume. **Do not run `docker compose down -v`** unless you intend to delete the database and Redis volumes.

**Frontend production build:** `npm run build` then `npm start`. This does not deploy the Python API, database, Redis or workers.

**Security:** The included Compose file has development credentials and publishes ports on the host. Do not expose this configuration directly to the public internet.

---

## 11. License

This project is licensed under the Apache 2.0 License.
