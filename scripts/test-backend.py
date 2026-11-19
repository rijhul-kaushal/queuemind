import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import init_db, async_session_factory
from backend.models import JobModel
from backend.schemas import JobCreate
from backend.services.job_service import JobService
from backend.services.worker_service import WorkerService
from backend.services.analytics_service import AnalyticsService
from backend.queue.queue_manager import QueueManager
from backend.queue.heartbeat import HeartbeatCoordinator
from backend.tasks import run_task

def assert_true(cond, msg):
    if not cond:
        print(f"❌ TEST FAILED: {msg}")
        sys.exit(1)
    print(f"✅ {msg}")

async def run_all_tests():
    print("--- RUNNING QUEUEMIND BACKEND & DISTRIBUTED QUEUE TESTS ---\n")

    # 1. Initialize Database Schema
    await init_db()
    assert_true(True, "Database schema initialized successfully")

    # 2. Redis Priority Queueing & Atomic Pop
    # Enqueue a LOW job, then a HIGH job, then a CRITICAL job
    await QueueManager.enqueue_job("job-low-1", queue_name="test-queue", priority="LOW")
    await QueueManager.enqueue_job("job-high-1", queue_name="test-queue", priority="HIGH")
    await QueueManager.enqueue_job("job-crit-1", queue_name="test-queue", priority="CRITICAL")

    # Pop: CRITICAL must come out first!
    p1 = await QueueManager.pop_job("test-queue")
    assert_true(p1 == "job-crit-1", f"First popped is CRITICAL job (got {p1})")

    # Second: HIGH must come out second!
    p2 = await QueueManager.pop_job("test-queue")
    assert_true(p2 == "job-high-1", f"Second popped is HIGH job (got {p2})")

    # Third: LOW must come out last!
    p3 = await QueueManager.pop_job("test-queue")
    assert_true(p3 == "job-low-1", f"Third popped is LOW job (got {p3})")

    # Queue should now be empty
    p_empty = await QueueManager.pop_job("test-queue")
    assert_true(p_empty is None, "Queue is empty after popping all jobs")

    # 3. FIFO Tie-breaking for Equal Priority
    await QueueManager.enqueue_job("job-med-a", queue_name="test-fifo", priority="MEDIUM")
    await asyncio.sleep(0.01) # Small delay to ensure timestamp progression
    await QueueManager.enqueue_job("job-med-b", queue_name="test-fifo", priority="MEDIUM")

    pop_a = await QueueManager.pop_job("test-fifo")
    pop_b = await QueueManager.pop_job("test-fifo")
    assert_true(pop_a == "job-med-a", "First arrived medium job popped first")
    assert_true(pop_b == "job-med-b", "Second arrived medium job popped second (FIFO stability)")

    # 4. Job Service CRUD and DB Persistence
    async with async_session_factory() as session:
        created = await JobService.create_job(
            session=session,
            job_in=JobCreate(
                name="Test Transcode 1080p",
                queue="media-transcoding",
                priority="HIGH",
                duration_ms=1000,
                payload_size_kb=500,
                tags=["test", "video"]
            )
        )
        assert_true(created.id.startswith("job-"), f"Job created with valid ID: {created.id}")
        assert_true(created.status == "PENDING", "Initial status is PENDING")

        # Check job in DB
        fetched = await JobService.get_job_by_id(session, created.id)
        assert_true(fetched is not None and fetched.name == "Test Transcode 1080p", "Job fetched from DB")

        # Test retry
        retried = await JobService.retry_job(session, created.id)
        assert_true(retried.retry_count == 1, "Job retry increments count")

        # Test cancel
        cancelled = await JobService.cancel_job(session, created.id)
        assert_true(cancelled.status == "CANCELLED", "Job cancelled successfully")

    # 5. Dead Letter Queue & Exponential Backoff
    delay = await QueueManager.schedule_retry("job-fail-1", "default", "HIGH", retry_count=1)
    assert_true(delay > 2.0, f"Calculated exponential backoff delay: {delay:.2f}s")

    await QueueManager.send_to_dlq("job-poison-1", "default", "Unrecoverable serialization error")
    dlq_size = await QueueManager.get_dlq_size()
    assert_true(dlq_size >= 1, f"Dead Letter Queue holds poisoned job (size: {dlq_size})")

    # 6. Worker Heartbeat & Vitality
    await HeartbeatCoordinator.record_heartbeat(
        worker_id="test-worker-alpha",
        hostname="node-1.test.lan",
        status="IDLE",
        concurrency=4,
        cpu_utilization=12.5,
        memory_usage_mb=256,
        queues=["default", "media-transcoding"]
    )
    async with async_session_factory() as session:
        workers = await WorkerService.get_workers(session)
        assert_true(any(w.id == "test-worker-alpha" for w in workers), "Worker heartbeat saved and retrievable")

    # 7. Real Task Execution Handler
    res = await run_task("email-delivery", "job-test-email", duration_sec=0.2, payload_size_kb=50)
    assert_true("delivered" in res or "status" in res, "Email task execution returned structured output")

    # 8. Analytics Overview Aggregation
    async with async_session_factory() as session:
        metrics = await AnalyticsService.get_overview_metrics(session)
        assert_true(metrics.totalJobs >= 1, "Overview metrics aggregated active jobs")
        assert_true(metrics.databaseConnected, "Database reported connected")

    print("\n🎉 ALL BACKEND, REDIS QUEUE, AND DISTRIBUTED WORKER TESTS PASSED SUCCESSFULLY!\n")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
