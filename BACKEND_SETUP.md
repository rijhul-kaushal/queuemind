# QueueMind: Phase 2 & Phase 3 Backend Engineering Guide

This guide explains how the **FastAPI REST API**, **Redis Priority Queue Broker**, **PostgreSQL / SQLite Database**, and **Distributed Worker Daemons** operate, and provides step-by-step instructions for connecting Redis, running the backend server, and spawning distributed worker nodes.

---

## 1. System Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                            NEXT.JS 16 FRONTEND                                    |
|   Dashboard, Job Explorer, Worker Monitor, Gantt Simulator (Port 3000)            |
+-----------------------------------------------------------------------------------+
                                      |
                                      | REST API (JSON)
                                      v
+-----------------------------------------------------------------------------------+
|                         FASTAPI REST API SERVER (Port 8000)                       |
|   Job CRUD, Queue Metrics, Worker Telemetry, DLQ Replay, Health Endpoints          |
+-----------------------------------------------------------------------------------+
                   |                                             |
                   | Async SQLAlchemy                            | Redis Sorted Sets
                   v                                             v
+---------------------------------------+     +-------------------------------------+
|          DATABASE STORE               |     |       REDIS QUEUE COORDINATOR       |
|  - SQLite (default: queuemind.db)     |     |  - Priority Queues: queue:{name}    |
|  - PostgreSQL (optional production)   |     |  - Delayed Retries: queue:delayed   |
|  - Job records & execution logs       |     |  - Dead Letter Queue: queue:dlq     |
|  - Worker registry & history          |     |  - Worker Heartbeats: worker:heartbeat |
+---------------------------------------+     +-------------------------------------+
                                                                 |
                                        +------------------------+------------------------+
                                        | Pop Tasks (Atomic ZPOPMIN)                      |
                                        v                                                 v
                       +----------------------------------+             +----------------------------------+
                       |    DISTRIBUTED WORKER 1          |             |    DISTRIBUTED WORKER 2          |
                       |    ID: worker-alpha              |             |    ID: worker-beta               |
                       |    Concurrency: 4 slots          |             |    Concurrency: 6 slots          |
                       |    Queues: [media, default]      |             |    Queues: [email, ai, data]     |
                       |    Heartbeat every 5s            |             |    Heartbeat every 5s            |
                       +----------------------------------+             +----------------------------------+
```

---

## 2. Connecting Redis

QueueMind uses Redis for **atomic priority queueing**, **delayed retries**, **Dead Letter Queues**, and **worker heartbeats**.

### Option A: Built-in In-Memory Redis Engine (Zero Installation Required)
QueueMind includes an automatic in-memory Redis-compatible engine (`fakeredis`).
- If no live Redis server is detected on your machine, QueueMind **automatically falls back to in-memory Redis**.
- All priority sorting, atomic popping, delayed retries, and heartbeats work locally without installing any software!
- To verify this mode, start the backend and check the terminal:
  ```
  [QueueMind Redis] Active in-memory Redis engine (fakeredis) enabled.
  ```

### Option B: Docker Compose (Recommended if Docker is installed)
Run Redis 7 in a detached container:
```bash
docker compose up -d redis
```
To verify Redis is responding:
```bash
docker exec -it queuemind-redis redis-cli ping
# Expected output: PONG
```

### Option C: Free Cloud Redis (Upstash) — Zero Local Setup
If you want real Redis without installing Docker or local binaries:
1. Go to [Upstash.com](https://upstash.com) and create a free Redis database (takes 30 seconds).
2. Copy the **Redis Connect URL** (starts with `rediss://default:...@...upstash.io:6379`).
3. In your `backend/config.py` or `.env` file, set:
   ```env
   REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
   ```
4. Restart FastAPI. QueueMind will connect to the cloud Redis cluster automatically!

---

## 3. Connecting the Database

QueueMind uses SQLAlchemy 2.0 with asynchronous drivers for persistent storage.

### Option A: SQLite (Default — Ready Out of the Box)
- Default configuration: `DATABASE_URL=sqlite+aiosqlite:///./queuemind.db`.
- Requires **zero setup**. The database file `queuemind.db` is created automatically on startup.

### Option B: PostgreSQL with Docker Compose
If you want production PostgreSQL:
```bash
docker compose up -d postgres
```
Then set in `.env`:
```env
DATABASE_URL=postgresql+asyncpg://queuemind:queuemind_password@localhost:5432/queuemind
```

### Option C: Cloud PostgreSQL (Supabase / Neon)
1. Create a free PostgreSQL instance on [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
2. Set the connection string in `.env`:
   ```env
   DATABASE_URL=postgresql+asyncpg://user:password@host/database
   ```

---

## 4. How to Run the Backend (Step-by-Step)

### Step 1: Start the FastAPI Server
Open a terminal in the project directory `d:\jobs`:
```powershell
python -m uvicorn backend.main:app --reload --port 8000
```
- Interactive Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### Step 2: Seed Initial Workload Data
You can seed realistic initial jobs, workers, and queues by running:
```powershell
curl -X POST http://localhost:8000/api/v1/reset-demo
```
*(Or click the "Reset State" button in the frontend header.)*

---

## 5. How to Run Distributed Background Workers (Phase 3)

QueueMind background workers are autonomous daemon processes that poll Redis, pop tasks by priority, execute them up to their concurrency limit, and report health heartbeats.

### Starting a Single Worker
Open a new terminal tab:
```powershell
python -m backend.worker --worker-id worker-alpha --concurrency 4
```

### Simulating a Multi-Node Distributed Cluster
Open multiple terminal tabs to demonstrate distributed load balancing across multiple worker processes:

**Terminal 1 (Transcoding & General Worker):**
```powershell
python -m backend.worker --worker-id worker-node-us-east --queues media-transcoding default --concurrency 4
```

**Terminal 2 (Email & Notification Worker):**
```powershell
python -m backend.worker --worker-id worker-node-us-west --queues email-delivery default --concurrency 6
```

**Terminal 3 (AI Inference & Data Pipeline Worker):**
```powershell
python -m backend.worker --worker-id worker-node-eu-fra --queues ai-inference data-pipeline --concurrency 4
```

Watch how jobs enqueued through the API or frontend UI are instantly distributed across these workers based on queue binding and priority!

---

## 6. How Distributed Mechanics Work Under the Hood

### 1. Priority Scheduling in Redis
Jobs are stored in Redis **Sorted Sets** (`queue:{queue_name}`). The score is computed as:
$$\text{Score} = -(\text{Priority Weight} \times 10^{10}) + t_{\text{arrival}}$$
- `CRITICAL` (weight 4000) $\rightarrow$ Lowest score $\rightarrow$ Popped first!
- `HIGH` (weight 3000) $\rightarrow$ Popped second!
- `MEDIUM` (weight 2000) $\rightarrow$ Popped third!
- `LOW` (weight 1000) $\rightarrow$ Popped last!
- For identical priorities, the smaller arrival timestamp ($t_{\text{arrival}}$) breaks ties in strict **FIFO order**.
- Workers pop tasks atomically using `ZPOPMIN`, ensuring **zero race conditions** even with dozens of parallel workers.

### 2. Exponential Backoff Retries
When a job fails with a transient error (e.g., HTTP 429 upstream rate limit):
1. The worker calculates exponential backoff with jitter:
   $$\text{Delay} = \text{Base Delay} \times 2^{\text{Retry Count}} + \text{Jitter}$$
2. The job is scheduled in Redis Sorted Set `queue:delayed` with execution score equal to $t_{\text{current}} + \text{Delay}$.
3. When the delay elapses, the job is promoted back to its active queue for another attempt.

### 3. Dead Letter Queue (DLQ)
If a job exceeds its maximum retry budget (`max_retries=3`) or experiences a fatal non-retryable error (e.g., OOM or corrupted payload):
1. The job is moved to `queue:dlq`.
2. The database updates the job status to `FAILED`.
3. You can inspect all dead-lettered jobs via `GET /api/v1/queues/dlq`.
4. You can replay dead-lettered tasks back into active queues via `POST /api/v1/queues/dlq/{id}/replay`.

### 4. Worker Heartbeats & Node Crash Recovery
1. Every 5 seconds, active workers send a heartbeat hash to Redis `worker:heartbeat:{worker_id}` with a 15-second TTL.
2. If a worker process crashes or the machine loses power, its Redis heartbeat expires.
3. The heartbeat sweep detects the dead worker, marks it `OFFLINE` in the database, and **re-enqueues any uncompleted in-flight job** back into Redis so other live workers can pick it up!

---

## 7. Connecting the Next.js Frontend to FastAPI

1. Start the Next.js dev server:
   ```powershell
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000).
3. The frontend periodically polls `http://localhost:8000/health`.
4. When FastAPI is running, a green badge appears in the top header:
   ```
   [●] FastAPI Online (Click to connect)
   ```
5. Click the badge to toggle **Live Mode**!
   - All jobs created in the UI will now be saved in SQLite/PostgreSQL and pushed to Redis.
   - You can watch your terminal workers pick them up and execute them in real time!
