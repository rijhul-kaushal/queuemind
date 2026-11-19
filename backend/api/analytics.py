from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from backend.database import get_db
from backend.schemas import AnalyticsOverview, ThroughputPoint
from backend.services.analytics_service import AnalyticsService
from backend.models import JobModel, WorkerModel, ExecutionLogModel
from backend.queue.queue_manager import QueueManager
from backend.queue.redis_client import get_redis_client
from datetime import datetime, timezone, timedelta
import random

router = APIRouter(prefix="", tags=["Analytics & System"])


@router.get("/analytics/overview", response_model=AnalyticsOverview)
async def get_overview(
    db: AsyncSession = Depends(get_db),
):
    """Retrieves real-time system metrics, fleet health, and Redis/DB connection status."""
    return await AnalyticsService.get_overview_metrics(session=db)


@router.get("/analytics/throughput", response_model=List[ThroughputPoint])
async def get_throughput(
    db: AsyncSession = Depends(get_db),
):
    """Retrieves 24-hour job throughput time-series data."""
    return await AnalyticsService.get_hourly_throughput(session=db)


@router.post("/reset-demo")
async def reset_demo_database(
    db: AsyncSession = Depends(get_db),
):
    """Clears and re-seeds database and Redis queues with realistic initial workload data."""
    # 1. Clear existing tables
    await db.execute(delete(ExecutionLogModel))
    await db.execute(delete(JobModel))
    await db.execute(delete(WorkerModel))
    await db.commit()

    # 2. Clear Redis queues
    redis = await get_redis_client()
    try:
        keys = await redis.keys("queue:*")
        if keys:
            await redis.delete(*keys)
        w_keys = await redis.keys("worker:*")
        if w_keys:
            await redis.delete(*w_keys)
    except Exception:
        pass

    now = datetime.now(timezone.utc)

    # 3. Seed Realistic Workers
    demo_workers = [
        WorkerModel(
            id="worker-us-east-1",
            name="worker-node-alpha-us-east",
            hostname="i-0a8bf34190c1.ec2.internal",
            status="BUSY",
            concurrency=8,
            assigned_jobs_count=428,
            completed_jobs_count=416,
            failed_jobs_count=12,
            cpu_utilization=78.4,
            memory_usage_mb=1420,
            uptime_seconds=864200,
            heartbeat_at=now,
            is_simulated=True,
        ),
        WorkerModel(
            id="worker-us-west-2",
            name="worker-node-beta-us-west",
            hostname="i-0b29c1184a44.ec2.internal",
            status="BUSY",
            concurrency=6,
            assigned_jobs_count=894,
            completed_jobs_count=889,
            failed_jobs_count=5,
            cpu_utilization=64.2,
            memory_usage_mb=890,
            uptime_seconds=1248000,
            heartbeat_at=now,
            is_simulated=True,
        ),
        WorkerModel(
            id="worker-eu-central-1",
            name="worker-node-gamma-eu-fra",
            hostname="fra-node-03.internal.lan",
            status="BUSY",
            concurrency=4,
            assigned_jobs_count=612,
            completed_jobs_count=604,
            failed_jobs_count=8,
            cpu_utilization=48.9,
            memory_usage_mb=1120,
            uptime_seconds=432000,
            heartbeat_at=now,
            is_simulated=True,
        ),
        WorkerModel(
            id="worker-ap-southeast-1",
            name="worker-node-delta-ap-sin",
            hostname="sin-edge-01.internal.lan",
            status="IDLE",
            concurrency=4,
            assigned_jobs_count=231,
            completed_jobs_count=230,
            failed_jobs_count=1,
            cpu_utilization=8.5,
            memory_usage_mb=240,
            uptime_seconds=198000,
            heartbeat_at=now,
            is_simulated=True,
        ),
        WorkerModel(
            id="worker-latam-1",
            name="worker-node-epsilon-sa-br",
            hostname="gru-baremetal-05.internal.lan",
            status="PAUSED",
            concurrency=2,
            assigned_jobs_count=94,
            completed_jobs_count=92,
            failed_jobs_count=2,
            cpu_utilization=2.1,
            memory_usage_mb=180,
            uptime_seconds=72000,
            heartbeat_at=now,
            is_simulated=True,
        ),
    ]

    demo_workers[0].queues = ["media-transcoding", "default"]
    demo_workers[1].queues = ["email-delivery", "default", "data-pipeline"]
    demo_workers[2].queues = ["ai-inference", "data-pipeline"]
    demo_workers[3].queues = ["default", "email-delivery"]
    demo_workers[4].queues = ["default"]

    for w in demo_workers:
        db.add(w)

    # 4. Seed Realistic Jobs
    demo_jobs = [
        JobModel(
            id="job-9841",
            name="Transcode Video H.264 4K Master",
            queue="media-transcoding",
            priority="HIGH",
            status="PROCESSING",
            payload_size_kb=45200,
            duration_ms=25000,
            worker_id="worker-us-east-1",
            created_at=now - timedelta(minutes=12),
            started_at=now - timedelta(minutes=8),
        ),
        JobModel(
            id="job-9842",
            name="Payment Webhook Reconciliation",
            queue="default",
            priority="CRITICAL",
            status="COMPLETED",
            payload_size_kb=142,
            duration_ms=3200,
            worker_id="worker-us-west-2",
            created_at=now - timedelta(minutes=25),
            started_at=now - timedelta(minutes=24),
            completed_at=now - timedelta(minutes=23),
        ),
        JobModel(
            id="job-9843",
            name="Batch Vector Embedding Generation",
            queue="ai-inference",
            priority="MEDIUM",
            status="PROCESSING",
            payload_size_kb=8900,
            duration_ms=18000,
            worker_id="worker-eu-central-1",
            created_at=now - timedelta(minutes=18),
            started_at=now - timedelta(minutes=10),
        ),
        JobModel(
            id="job-9844",
            name="Transactional Email Digest Dispatch",
            queue="email-delivery",
            priority="HIGH",
            status="COMPLETED",
            payload_size_kb=1240,
            duration_ms=8400,
            worker_id="worker-eu-central-1",
            created_at=now - timedelta(minutes=45),
            started_at=now - timedelta(minutes=44),
            completed_at=now - timedelta(minutes=42),
        ),
        JobModel(
            id="job-9845",
            name="PostgreSQL WAL Archive Snapshot",
            queue="data-pipeline",
            priority="CRITICAL",
            status="COMPLETED",
            payload_size_kb=128400,
            duration_ms=42000,
            worker_id="worker-us-west-2",
            created_at=now - timedelta(hours=2),
            started_at=now - timedelta(minutes=118),
            completed_at=now - timedelta(minutes=112),
        ),
        JobModel(
            id="job-9846",
            name="S3 Asset Sync & CDN Invalidation",
            queue="default",
            priority="LOW",
            status="PENDING",
            payload_size_kb=420,
            duration_ms=15400,
            created_at=now - timedelta(minutes=4),
        ),
        JobModel(
            id="job-9847",
            name="Daily Compliance PDF Report Export",
            queue="data-pipeline",
            priority="MEDIUM",
            status="PENDING",
            payload_size_kb=2840,
            duration_ms=28000,
            created_at=now - timedelta(minutes=6),
        ),
        JobModel(
            id="job-9848",
            name="Customer Fraud Detection Scan",
            queue="ai-inference",
            priority="CRITICAL",
            status="PENDING",
            payload_size_kb=65,
            duration_ms=4500,
            created_at=now - timedelta(minutes=1),
        ),
        JobModel(
            id="job-9849",
            name="Shopify Webhook Sync Batch #401",
            queue="default",
            priority="HIGH",
            status="FAILED",
            payload_size_kb=890,
            duration_ms=12000,
            worker_id="worker-us-east-1",
            retry_count=3,
            max_retries=3,
            error_message="Upstream HTTP 429 Too Many Requests: Shopify API rate limit exceeded",
            created_at=now - timedelta(minutes=55),
            started_at=now - timedelta(minutes=53),
            completed_at=now - timedelta(minutes=51),
        ),
    ]

    demo_jobs[0].tags = ["ffmpeg", "video", "gpu"]
    demo_jobs[1].tags = ["stripe", "payments"]
    demo_jobs[2].tags = ["embeddings", "vector"]
    demo_jobs[3].tags = ["smtp", "bulk"]
    demo_jobs[4].tags = ["postgres", "backup"]
    demo_jobs[5].tags = ["cdn", "cache"]
    demo_jobs[6].tags = ["pdf", "export"]
    demo_jobs[7].tags = ["security", "fraud"]
    demo_jobs[8].tags = ["shopify", "webhook"]

    for j in demo_jobs:
        db.add(j)

    await db.commit()

    # Enqueue pending jobs to Redis
    for j in demo_jobs:
        if j.status == "PENDING":
            await QueueManager.enqueue_job(
                job_id=j.id,
                queue_name=j.queue,
                priority=j.priority,
                arrival_time=j.created_at.timestamp(),
            )
        elif j.status == "FAILED":
            await QueueManager.send_to_dlq(
                job_id=j.id,
                queue_name=j.queue,
                reason=j.error_message or "Max retries exceeded",
            )

    return {"status": "success", "message": "Demo data seeded to database and Redis successfully"}
