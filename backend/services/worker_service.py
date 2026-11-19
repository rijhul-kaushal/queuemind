from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models import WorkerModel
from backend.queue.redis_client import get_redis_client
import logging

logger = logging.getLogger("queuemind.worker_service")


class WorkerService:

    @classmethod
    async def get_workers(cls, session: AsyncSession) -> List[WorkerModel]:
        """Retrieves all registered worker records and refreshes live status against Redis heartbeats."""
        redis = await get_redis_client()
        stmt = select(WorkerModel).order_by(WorkerModel.id)
        result = await session.execute(stmt)
        workers = list(result.scalars().all())

        for w in workers:
            key = f"worker:heartbeat:{w.id}"
            is_alive = await redis.exists(key)
            if not is_alive and w.status in ["IDLE", "BUSY"] and not w.is_simulated:
                w.status = "OFFLINE"

        return workers

    @classmethod
    async def get_worker_by_id(cls, session: AsyncSession, worker_id: str) -> Optional[WorkerModel]:
        stmt = select(WorkerModel).where(WorkerModel.id == worker_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @classmethod
    async def update_capacity(cls, session: AsyncSession, worker_id: str, concurrency: int) -> Optional[WorkerModel]:
        worker = await cls.get_worker_by_id(session, worker_id)
        if not worker:
            return None

        worker.concurrency = max(1, min(64, concurrency))
        await session.commit()
        await session.refresh(worker)
        return worker

    @classmethod
    async def toggle_status(cls, session: AsyncSession, worker_id: str) -> Optional[WorkerModel]:
        worker = await cls.get_worker_by_id(session, worker_id)
        if not worker:
            return None

        if worker.status in ["BUSY", "IDLE"]:
            worker.status = "PAUSED"
        elif worker.status == "PAUSED":
            worker.status = "OFFLINE"
        else:
            worker.status = "IDLE"

        worker.heartbeat_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(worker)
        return worker
