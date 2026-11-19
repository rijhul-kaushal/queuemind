import time
import random
import logging
from typing import Optional, List, Tuple
from backend.queue.redis_client import get_redis_client
from backend.config import settings

logger = logging.getLogger("queuemind.queue_manager")

PRIORITY_WEIGHTS = {
    "CRITICAL": 4000,
    "HIGH": 3000,
    "MEDIUM": 2000,
    "LOW": 1000,
}


class QueueManager:
    """Coordinates priority queuing, atomic popping, delayed retries, and dead-letter queues in Redis."""

    @staticmethod
    def _calculate_score(priority: str, arrival_timestamp: float) -> float:
        """Calculates Redis Sorted Set score: higher priority yields lower score,

        with arrival timestamp breaking ties in strict FIFO order.
        """
        weight = PRIORITY_WEIGHTS.get(priority.upper(), 2000)
        # Using negative weight so that higher priority has lower score for ZPOPMIN
        # Arrival timestamp (in milliseconds) ensures FIFO tie-breaking for equal priority
        base = -(weight * 10_000_000_000)
        return float(base + int(arrival_timestamp * 1000))

    @classmethod
    async def enqueue_job(
        cls,
        job_id: str,
        queue_name: str = "default",
        priority: str = "MEDIUM",
        arrival_time: Optional[float] = None,
    ) -> bool:
        """Enqueues a job into the Redis sorted set for the target queue partition."""
        redis = await get_redis_client()
        t = arrival_time or time.time()
        score = cls._calculate_score(priority, t)
        queue_key = f"queue:{queue_name}"

        await redis.zadd(queue_key, {job_id: score})
        # Track queue registry
        await redis.sadd("queues:registry", queue_name)
        logger.debug(f"Job {job_id} [{priority}] enqueued in {queue_key} with score {score}")
        return True

    @classmethod
    async def pop_job(cls, queue_name: str) -> Optional[str]:
        """Atomically pops the highest priority job from the queue (ZPOPMIN).

        Returns job_id or None if queue is empty.
        """
        redis = await get_redis_client()
        queue_key = f"queue:{queue_name}"
        result = await redis.zpopmin(queue_key, count=1)

        if not result:
            return None

        # Result is list of tuples [(member, score)]
        job_id = result[0][0]
        logger.debug(f"Popped job {job_id} from {queue_key}")
        return job_id

    @classmethod
    async def pop_any_queue(cls, queue_names: List[str]) -> Optional[Tuple[str, str]]:
        """Checks multiple queues in order and pops the highest priority job available.

        Returns (queue_name, job_id) or None.
        """
        for q in queue_names:
            job_id = await cls.pop_job(q)
            if job_id:
                return q, job_id
        return None

    @classmethod
    async def schedule_retry(
        cls,
        job_id: str,
        queue_name: str,
        priority: str,
        retry_count: int,
    ) -> float:
        """Schedules a job for delayed retry using exponential backoff with jitter."""
        redis = await get_redis_client()
        base = settings.BASE_RETRY_DELAY_SECONDS
        jitter = random.uniform(0.1, 0.8)
        delay = (base * (2 ** retry_count)) + jitter
        execution_time = time.time() + delay

        # Stored in delayed set: member format is "job_id|queue_name|priority"
        delayed_payload = f"{job_id}|{queue_name}|{priority}"
        await redis.zadd("queue:delayed", {delayed_payload: execution_time})
        logger.info(f"Job {job_id} scheduled for retry in {delay:.2f}s (attempt #{retry_count})")
        return delay

    @classmethod
    async def promote_delayed_jobs(cls) -> int:
        """Promotes matured jobs from queue:delayed back to their active queue partitions."""
        redis = await get_redis_client()
        now = time.time()
        # Find all matured jobs (score <= now)
        matured = await redis.zrangebyscore("queue:delayed", min=0, max=now)

        promoted_count = 0
        for item in matured:
            # Atomically remove from delayed queue to avoid duplicate promotion
            removed = await redis.zrem("queue:delayed", item)
            if removed:
                parts = item.split("|")
                if len(parts) == 3:
                    job_id, q_name, priority = parts
                    await cls.enqueue_job(job_id, queue_name=q_name, priority=priority)
                    promoted_count += 1

        return promoted_count

    @classmethod
    async def send_to_dlq(cls, job_id: str, queue_name: str, reason: str) -> None:
        """Pushes a dead/poisoned job to the Dead Letter Queue (DLQ)."""
        redis = await get_redis_client()
        dlq_key = f"queue:{settings.DLQ_QUEUE_NAME}"
        timestamp = time.time()

        # Push to DLQ list with timestamp
        payload = f"{job_id}|{queue_name}|{reason}"
        await redis.zadd(dlq_key, {payload: timestamp})
        logger.warning(f"Job {job_id} from {queue_name} moved to DLQ: {reason}")

    @classmethod
    async def get_queue_size(cls, queue_name: str) -> int:
        """Returns the number of waiting jobs in a specific queue."""
        redis = await get_redis_client()
        return await redis.zcard(f"queue:{queue_name}")

    @classmethod
    async def get_dlq_size(cls) -> int:
        """Returns the number of jobs currently in the Dead Letter Queue."""
        redis = await get_redis_client()
        return await redis.zcard(f"queue:{settings.DLQ_QUEUE_NAME}")

    @classmethod
    async def get_all_queues(cls) -> List[str]:
        """Returns list of all active queue names registered in Redis."""
        redis = await get_redis_client()
        registered = await redis.smembers("queues:registry")
        defaults = ["default", "media-transcoding", "email-delivery", "data-pipeline", "ai-inference"]
        all_q = set(defaults).union(registered)
        return sorted(list(all_q))

    @classmethod
    async def remove_job_from_queue(cls, job_id: str, queue_name: str) -> bool:
        """Removes a job from the queue (e.g. if cancelled)."""
        redis = await get_redis_client()
        removed = await redis.zrem(f"queue:{queue_name}", job_id)
        return bool(removed)
