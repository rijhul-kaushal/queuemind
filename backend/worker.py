import sys
import os
import time
import socket
import asyncio
import argparse
import signal
import logging
from datetime import datetime, timezone
from typing import List, Set
from sqlalchemy import select

from backend.database import async_session_factory, init_db
from backend.models import JobModel, WorkerModel, ExecutionLogModel
from backend.queue.queue_manager import QueueManager
from backend.queue.heartbeat import HeartbeatCoordinator
from backend.tasks import run_task, TaskExecutionError
from backend.config import settings

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [Worker %(name)s]: %(message)s",
)
logger = logging.getLogger("queuemind.worker")


class DistributedWorker:
    """Distributed Background Worker Daemon for QueueMind.

    Retrieves prioritized tasks from Redis queues, executes them concurrently
    up to configured concurrency slots, manages heartbeats, retries with backoff,
    and handles dead-letter routing.
    """

    def __init__(self, worker_id: str, queues: List[str], concurrency: int = 4):
        self.worker_id = worker_id
        self.queues = queues
        self.concurrency = concurrency
        self.hostname = socket.gethostname()
        self.semaphore = asyncio.Semaphore(concurrency)
        self.active_tasks: Set[asyncio.Task] = set()
        self.is_running = True
        self.start_time = time.time()
        self.current_active_job_id = None
        self.current_active_job_name = None

    async def _heartbeat_loop(self):
        """Background loop broadcasting worker vitality, resource telemetry, and current active task."""
        while self.is_running:
            try:
                uptime = int(time.time() - self.start_time)
                # Approximate resource telemetry without heavy psutil dependency
                cpu = 15.0 + (len(self.active_tasks) * 18.5)
                ram = 180 + (len(self.active_tasks) * 85)
                status = "BUSY" if len(self.active_tasks) > 0 else "IDLE"

                await HeartbeatCoordinator.record_heartbeat(
                    worker_id=self.worker_id,
                    hostname=self.hostname,
                    status=status,
                    active_job_id=self.current_active_job_id,
                    active_job_name=self.current_active_job_name,
                    concurrency=self.concurrency,
                    cpu_utilization=round(cpu, 1),
                    memory_usage_mb=int(ram),
                    uptime_seconds=uptime,
                    queues=self.queues,
                )

                # Also run stale worker sweep and promote delayed retries
                await HeartbeatCoordinator.sweep_dead_workers()
                await QueueManager.promote_delayed_jobs()

            except Exception as e:
                logger.error(f"Heartbeat error: {e}")

            await asyncio.sleep(settings.HEARTBEAT_INTERVAL_SECONDS)

    async def _execute_job(self, queue_name: str, job_id: str):
        """Executes a single popped job with full lifecycle, retry, and DLQ handling."""
        async with self.semaphore:
            self.current_active_job_id = job_id

            async with async_session_factory() as session:
                # 1. Fetch Job from DB
                stmt = select(JobModel).where(JobModel.id == job_id)
                res = await session.execute(stmt)
                job = res.scalar_one_or_none()

                if not job:
                    logger.warning(f"Job {job_id} popped from Redis but not found in DB.")
                    self.current_active_job_id = None
                    return

                if job.status == "CANCELLED":
                    logger.info(f"Skipping cancelled job {job_id}")
                    self.current_active_job_id = None
                    return

                # 2. Transition to PROCESSING
                self.current_active_job_name = job.name
                now = datetime.now(timezone.utc)
                job.status = "PROCESSING"
                job.worker_id = self.worker_id
                job.started_at = now

                session.add(
                    ExecutionLogModel(
                        job_id=job.id,
                        worker_id=self.worker_id,
                        event="STARTED",
                        message=f"Execution started on worker {self.worker_id}",
                        timestamp=now,
                    )
                )

                # Increment worker assigned count
                w_stmt = select(WorkerModel).where(WorkerModel.id == self.worker_id)
                w_res = await session.execute(w_stmt)
                worker_model = w_res.scalar_one_or_none()
                if worker_model:
                    worker_model.assigned_jobs_count += 1
                    worker_model.status = "BUSY"

                await session.commit()

            # 3. Perform Actual Task Execution
            duration_sec = max(0.5, (job.duration_ms or 5000) / 1000.0)
            logger.info(f"▶ Executing {job.id} [{job.priority}] '{job.name}' (approx {duration_sec}s)")

            try:
                result = await run_task(
                    queue_name=job.queue,
                    job_id=job.id,
                    duration_sec=duration_sec,
                    payload_size_kb=job.payload_size_kb or 25,
                )

                # 4. Success Completion
                now = datetime.now(timezone.utc)
                async with async_session_factory() as session:
                    stmt = select(JobModel).where(JobModel.id == job_id)
                    res = await session.execute(stmt)
                    db_job = res.scalar_one_or_none()

                    if db_job and db_job.status != "CANCELLED":
                        db_job.status = "COMPLETED"
                        db_job.completed_at = now
                        session.add(
                            ExecutionLogModel(
                                job_id=db_job.id,
                                worker_id=self.worker_id,
                                event="COMPLETED",
                                message=f"Task executed successfully. Result: {result}",
                                timestamp=now,
                            )
                        )

                    w_stmt = select(WorkerModel).where(WorkerModel.id == self.worker_id)
                    w_res = await session.execute(w_stmt)
                    w_model = w_res.scalar_one_or_none()
                    if w_model:
                        w_model.completed_jobs_count += 1
                        if len(self.active_tasks) <= 1:
                            w_model.status = "IDLE"

                    await session.commit()
                logger.info(f"✔ Completed {job.id} '{job.name}'")

            except Exception as exc:
                # 5. Failure and Retry Handling
                error_msg = str(exc)
                is_retryable = getattr(exc, "is_retryable", True)
                logger.error(f"✖ Failed {job.id}: {error_msg}")

                now = datetime.now(timezone.utc)
                async with async_session_factory() as session:
                    stmt = select(JobModel).where(JobModel.id == job_id)
                    res = await session.execute(stmt)
                    db_job = res.scalar_one_or_none()

                    w_stmt = select(WorkerModel).where(WorkerModel.id == self.worker_id)
                    w_res = await session.execute(w_stmt)
                    w_model = w_res.scalar_one_or_none()
                    if w_model:
                        w_model.failed_jobs_count += 1

                    if db_job and db_job.status != "CANCELLED":
                        db_job.error_message = error_msg

                        # Check retry eligibility
                        if is_retryable and db_job.retry_count < db_job.max_retries:
                            db_job.retry_count += 1
                            db_job.status = "PENDING"
                            db_job.worker_id = None

                            # Schedule delayed retry with exponential backoff
                            delay = await QueueManager.schedule_retry(
                                job_id=db_job.id,
                                queue_name=db_job.queue,
                                priority=db_job.priority,
                                retry_count=db_job.retry_count,
                            )

                            session.add(
                                ExecutionLogModel(
                                    job_id=db_job.id,
                                    worker_id=self.worker_id,
                                    event="RETRYING",
                                    message=f"Scheduled retry in {delay:.1f}s (attempt #{db_job.retry_count}): {error_msg}",
                                    timestamp=now,
                                )
                            )
                        else:
                            # Exceeded retries or non-retryable -> Dead Letter Queue
                            db_job.status = "FAILED"
                            db_job.completed_at = now
                            await QueueManager.send_to_dlq(
                                job_id=db_job.id,
                                queue_name=db_job.queue,
                                reason=f"Max retries exceeded: {error_msg}",
                            )

                            session.add(
                                ExecutionLogModel(
                                    job_id=db_job.id,
                                    worker_id=self.worker_id,
                                    event="DLQ",
                                    message=f"Job routed to Dead Letter Queue (DLQ). Reason: {error_msg}",
                                    timestamp=now,
                                )
                            )

                    await session.commit()

            finally:
                self.current_active_job_id = None
                self.current_active_job_name = None

    async def start(self):
        """Starts the worker daemon event loop."""
        logger.info(
            f"Starting QueueMind Worker '{self.worker_id}' on {self.hostname} "
            f"[Concurrency: {self.concurrency}, Queues: {', '.join(self.queues)}]"
        )

        await init_db()

        # Start background heartbeat task
        heartbeat_task = asyncio.create_task(self._heartbeat_loop())

        try:
            while self.is_running:
                # Check if we have capacity in our concurrency semaphore
                # Pop next highest priority job from bound queues
                popped = await QueueManager.pop_any_queue(self.queues)

                if popped:
                    queue_name, job_id = popped
                    task = asyncio.create_task(self._execute_job(queue_name, job_id))
                    self.active_tasks.add(task)
                    task.add_done_callback(self.active_tasks.discard)
                else:
                    # Idle poll sleep
                    await asyncio.sleep(0.5)

        except asyncio.CancelledError:
            logger.info("Worker run loop cancelled.")
        finally:
            self.is_running = False
            heartbeat_task.cancel()

            # Wait for currently in-flight jobs to conclude
            if self.active_tasks:
                logger.info(f"Waiting for {len(self.active_tasks)} in-flight tasks to finish...")
                await asyncio.gather(*self.active_tasks, return_exceptions=True)

            # Record OFFLINE in DB
            async with async_session_factory() as session:
                w_stmt = select(WorkerModel).where(WorkerModel.id == self.worker_id)
                w_res = await session.execute(w_stmt)
                w_model = w_res.scalar_one_or_none()
                if w_model:
                    w_model.status = "OFFLINE"
                    w_model.active_job_id = None
                    await session.commit()

            logger.info(f"Worker {self.worker_id} shutdown complete.")


def parse_args():
    parser = argparse.ArgumentParser(description="QueueMind Distributed Worker Process")
    parser.add_argument(
        "--worker-id",
        type=str,
        default=f"worker-{uuid_suffix()}",
        help="Unique worker identifier",
    )
    parser.add_argument(
        "--queues",
        nargs="+",
        default=["default", "media-transcoding", "email-delivery", "data-pipeline", "ai-inference"],
        help="List of queues this worker consumes from (priority ordered)",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=4,
        help="Maximum concurrent jobs processed simultaneously",
    )
    return parser.parse_args()


def uuid_suffix():
    import uuid
    return uuid.uuid4().hex[:6]


def main():
    args = parse_args()
    worker = DistributedWorker(
        worker_id=args.worker_id,
        queues=args.queues,
        concurrency=args.concurrency,
    )

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    # Handle graceful exit signals
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, lambda: asyncio.create_task(shutdown(worker)))
        except (NotImplementedError, AttributeError):
            # Windows compatibility for signal handlers
            pass

    try:
        loop.run_until_complete(worker.start())
    except KeyboardInterrupt:
        logger.info("Interrupted by user. Shutting down...")
        loop.run_until_complete(shutdown(worker))
    finally:
        loop.close()


async def shutdown(worker: DistributedWorker):
    worker.is_running = False


if __name__ == "__main__":
    main()
