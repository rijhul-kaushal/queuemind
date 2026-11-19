import time
import json
import logging
from datetime import datetime, timezone
from sqlalchemy import select, update
from backend.queue.redis_client import get_redis_client
from backend.queue.queue_manager import QueueManager
from backend.database import async_session_factory
from backend.models import WorkerModel, JobModel, ExecutionLogModel
from backend.config import settings

logger = logging.getLogger("queuemind.heartbeat")


class HeartbeatCoordinator:
    """Manages worker heartbeats, health telemetry, and stale worker recovery."""

    @classmethod
    async def record_heartbeat(
        cls,
        worker_id: str,
        hostname: str,
        status: str,
        active_job_id: str = None,
        active_job_name: str = None,
        concurrency: int = 4,
        cpu_utilization: float = 0.0,
        memory_usage_mb: int = 128,
        uptime_seconds: int = 0,
        queues: list = None,
    ) -> None:
        """Records worker heartbeat in Redis with TTL and updates DB worker record."""
        redis = await get_redis_client()
        now = time.time()
        queues = queues or ["default"]

        payload = {
            "worker_id": worker_id,
            "hostname": hostname,
            "status": status,
            "active_job_id": active_job_id or "",
            "active_job_name": active_job_name or "",
            "concurrency": concurrency,
            "cpu_utilization": cpu_utilization,
            "memory_usage_mb": memory_usage_mb,
            "uptime_seconds": uptime_seconds,
            "queues": json.dumps(queues),
            "timestamp": now,
        }

        # Store in Redis with TTL = HEARTBEAT_TIMEOUT_SECONDS
        key = f"worker:heartbeat:{worker_id}"
        await redis.hset(key, mapping=payload)
        await redis.expire(key, settings.HEARTBEAT_TIMEOUT_SECONDS)
        await redis.sadd("workers:registered", worker_id)

        # Update or create WorkerModel in database
        async with async_session_factory() as session:
            stmt = select(WorkerModel).where(WorkerModel.id == worker_id)
            result = await session.execute(stmt)
            worker = result.scalar_one_or_none()

            now_dt = datetime.now(timezone.utc)
            if worker:
                worker.hostname = hostname
                worker.status = status
                worker.active_job_id = active_job_id
                worker.active_job_name = active_job_name
                worker.concurrency = concurrency
                worker.cpu_utilization = cpu_utilization
                worker.memory_usage_mb = memory_usage_mb
                worker.uptime_seconds = uptime_seconds
                worker.heartbeat_at = now_dt
                worker.queues = queues
            else:
                worker = WorkerModel(
                    id=worker_id,
                    name=worker_id,
                    hostname=hostname,
                    status=status,
                    active_job_id=active_job_id,
                    active_job_name=active_job_name,
                    concurrency=concurrency,
                    cpu_utilization=cpu_utilization,
                    memory_usage_mb=memory_usage_mb,
                    uptime_seconds=uptime_seconds,
                    heartbeat_at=now_dt,
                    is_simulated=False,
                )
                worker.queues = queues
                session.add(worker)
            await session.commit()

    @classmethod
    async def sweep_dead_workers(cls) -> int:
        """Finds workers whose Redis heartbeat has expired, marks them OFFLINE,

        and recovers/re-enqueues any orphaned in-flight jobs.
        """
        redis = await get_redis_client()
        registered_workers = await redis.smembers("workers:registered")
        recovered_jobs_count = 0

        async with async_session_factory() as session:
            for worker_id in registered_workers:
                key = f"worker:heartbeat:{worker_id}"
                has_heartbeat = await redis.exists(key)

                if not has_heartbeat:
                    # Worker heartbeat expired!
                    stmt = select(WorkerModel).where(WorkerModel.id == worker_id)
                    result = await session.execute(stmt)
                    worker = result.scalar_one_or_none()

                    if worker and worker.status != "OFFLINE":
                        logger.warning(f"Worker {worker_id} heartbeat expired! Marking OFFLINE.")
                        worker.status = "OFFLINE"
                        orphaned_job_id = worker.active_job_id
                        worker.active_job_id = None
                        worker.active_job_name = None

                        # Check if worker had an active job that was left incomplete
                        if orphaned_job_id:
                            j_stmt = select(JobModel).where(JobModel.id == orphaned_job_id)
                            j_res = await session.execute(j_stmt)
                            job = j_res.scalar_one_or_none()

                            if job and job.status == "PROCESSING":
                                logger.warning(
                                    f"Recovering orphaned job {job.id} from crashed worker {worker_id}"
                                )
                                job.status = "PENDING"
                                job.worker_id = None
                                session.add(
                                    ExecutionLogModel(
                                        job_id=job.id,
                                        worker_id=worker_id,
                                        event="RECOVERED",
                                        message=f"Worker {worker_id} crashed. Task recovered and re-enqueued.",
                                    )
                                )
                                # Re-enqueue to Redis
                                await QueueManager.enqueue_job(
                                    job.id, queue_name=job.queue, priority=job.priority
                                )
                                recovered_jobs_count += 1

                        await session.commit()

        return recovered_jobs_count
