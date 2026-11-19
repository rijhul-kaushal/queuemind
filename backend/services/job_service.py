import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import select, func, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models import JobModel, ExecutionLogModel, WorkerModel
from backend.schemas import JobCreate
from backend.queue.queue_manager import QueueManager
from backend.config import settings
import logging

logger = logging.getLogger("queuemind.job_service")


class JobService:

    @classmethod
    async def create_job(cls, session: AsyncSession, job_in: JobCreate) -> JobModel:
        """Creates a new job in the database and enqueues it to the Redis priority queue."""
        job_id = f"job-{uuid.uuid4().hex[:6]}"
        now = datetime.now(timezone.utc)

        job = JobModel(
            id=job_id,
            name=job_in.name,
            queue=job_in.queue or "default",
            priority=job_in.priority or "MEDIUM",
            status="PENDING",
            payload_size_kb=job_in.payload_size_kb or 25,
            duration_ms=job_in.duration_ms or 5000,
            retry_count=0,
            max_retries=settings.MAX_JOB_RETRIES,
            created_at=now,
        )
        job.tags = job_in.tags or [job_in.queue or "default"]

        session.add(job)
        session.add(
            ExecutionLogModel(
                job_id=job_id,
                event="ENQUEUED",
                message=f"Job enqueued to {job.queue} with priority {job.priority}",
                timestamp=now,
            )
        )
        await session.commit()
        await session.refresh(job)

        # Enqueue in Redis
        await QueueManager.enqueue_job(
            job_id=job.id,
            queue_name=job.queue,
            priority=job.priority,
            arrival_time=now.timestamp(),
        )

        logger.info(f"Created and enqueued {job.id} ({job.name})")
        return job

    @classmethod
    async def get_jobs(
        cls,
        session: AsyncSession,
        search: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        queue: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        limit: int = 100,
        offset: int = 0,
    ) -> List[JobModel]:
        """Queries jobs with filtering, full-text search, and sorting."""
        stmt = select(JobModel)

        if search and search.strip():
            q = f"%{search.strip().lower()}%"
            stmt = stmt.where(
                (func.lower(JobModel.name).like(q))
                | (func.lower(JobModel.id).like(q))
                | (func.lower(JobModel.queue).like(q))
                | (func.lower(JobModel.tags_json).like(q))
            )

        if status and status != "ALL":
            stmt = stmt.where(JobModel.status == status)

        if priority and priority != "ALL":
            stmt = stmt.where(JobModel.priority == priority)

        if queue and queue != "ALL":
            stmt = stmt.where(JobModel.queue == queue)

        # Sorting
        sort_col = getattr(JobModel, sort_by, JobModel.created_at)
        order_fn = desc if sort_order.lower() == "desc" else asc
        stmt = stmt.order_by(order_fn(sort_col)).limit(limit).offset(offset)

        result = await session.execute(stmt)
        return list(result.scalars().all())

    @classmethod
    async def get_job_by_id(cls, session: AsyncSession, job_id: str) -> Optional[JobModel]:
        """Retrieves a single job by its ID."""
        stmt = select(JobModel).where(JobModel.id == job_id)
        res = await session.execute(stmt)
        return res.scalar_one_or_none()

    @classmethod
    async def get_job_logs(cls, session: AsyncSession, job_id: str) -> List[ExecutionLogModel]:
        """Retrieves chronological execution logs for a job."""
        stmt = (
            select(ExecutionLogModel)
            .where(ExecutionLogModel.job_id == job_id)
            .order_by(asc(ExecutionLogModel.timestamp))
        )
        res = await session.execute(stmt)
        return list(res.scalars().all())

    @classmethod
    async def retry_job(cls, session: AsyncSession, job_id: str) -> Optional[JobModel]:
        """Re-enqueues a failed or cancelled job."""
        job = await cls.get_job_by_id(session, job_id)
        if not job:
            return None

        now = datetime.now(timezone.utc)
        job.status = "PENDING"
        job.retry_count += 1
        job.error_message = None
        job.started_at = None
        job.completed_at = None
        job.worker_id = None

        session.add(
            ExecutionLogModel(
                job_id=job.id,
                event="RETRIED",
                message=f"Manual retry initiated (attempt #{job.retry_count})",
                timestamp=now,
            )
        )
        await session.commit()
        await session.refresh(job)

        await QueueManager.enqueue_job(
            job.id, queue_name=job.queue, priority=job.priority, arrival_time=now.timestamp()
        )
        return job

    @classmethod
    async def cancel_job(cls, session: AsyncSession, job_id: str) -> Optional[JobModel]:
        """Cancels a pending or processing job."""
        job = await cls.get_job_by_id(session, job_id)
        if not job or job.status == "COMPLETED":
            return None

        now = datetime.now(timezone.utc)
        old_status = job.status
        job.status = "CANCELLED"
        job.completed_at = now

        session.add(
            ExecutionLogModel(
                job_id=job.id,
                event="CANCELLED",
                message=f"Job cancelled from state {old_status}",
                timestamp=now,
            )
        )
        await session.commit()
        await session.refresh(job)

        # Remove from queue if it was pending
        if old_status == "PENDING":
            await QueueManager.remove_job_from_queue(job.id, job.queue)

        return job

    @classmethod
    async def delete_job(cls, session: AsyncSession, job_id: str) -> bool:
        """Deletes a job from the database and queue."""
        job = await cls.get_job_by_id(session, job_id)
        if not job:
            return False

        await QueueManager.remove_job_from_queue(job.id, job.queue)
        await session.delete(job)
        await session.commit()
        return True
