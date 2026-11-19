from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.schemas import QueueMetric
from backend.services.analytics_service import AnalyticsService
from backend.queue.queue_manager import QueueManager
from backend.queue.redis_client import get_redis_client
from backend.config import settings

router = APIRouter(prefix="/queues", tags=["Queues & DLQ"])


@router.get("", response_model=List[QueueMetric])
async def list_queues(
    db: AsyncSession = Depends(get_db),
):
    """Retrieves live backpressure, processing stats, and latencies for all queues."""
    return await AnalyticsService.get_queue_metrics(session=db)


@router.get("/dlq")
async def list_dlq_jobs():
    """Inspects all poisoned or unrecoverable jobs currently in the Dead Letter Queue."""
    redis = await get_redis_client()
    dlq_key = f"queue:{settings.DLQ_QUEUE_NAME}"
    items = await redis.zrevrange(dlq_key, start=0, num=100, withscores=True)

    results: List[Dict[str, Any]] = []
    for payload, timestamp in items:
        parts = payload.split("|")
        job_id = parts[0] if len(parts) > 0 else "unknown"
        queue_name = parts[1] if len(parts) > 1 else "default"
        reason = parts[2] if len(parts) > 2 else "Fatal exception"

        results.append({
            "jobId": job_id,
            "originQueue": queue_name,
            "reason": reason,
            "timestamp": timestamp,
        })

    return {"total": len(results), "dlqName": settings.DLQ_QUEUE_NAME, "jobs": results}


@router.post("/dlq/{job_id}/replay")
async def replay_dlq_job(
    job_id: str,
    target_queue: str = "default",
    priority: str = "HIGH",
):
    """Re-enqueues a job from the Dead Letter Queue back into active execution."""
    redis = await get_redis_client()
    dlq_key = f"queue:{settings.DLQ_QUEUE_NAME}"

    # Search and remove from DLQ
    items = await redis.zrange(dlq_key, start=0, stop=-1)
    matched = None
    for item in items:
        if item.startswith(f"{job_id}|"):
            matched = item
            break

    if matched:
        await redis.zrem(dlq_key, matched)

    await QueueManager.enqueue_job(job_id=job_id, queue_name=target_queue, priority=priority)
    return {"success": True, "replayedJobId": job_id, "targetQueue": target_queue}
