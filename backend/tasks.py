import asyncio
import random
import logging
from typing import Dict, Any

logger = logging.getLogger("queuemind.tasks")


class TaskExecutionError(Exception):
    """Raised when an asynchronous task execution fails."""
    def __init__(self, message: str, is_retryable: bool = True):
        super().__init__(message)
        self.is_retryable = is_retryable


async def execute_media_transcoding(job_id: str, duration_sec: float, payload_size_kb: int) -> Dict[str, Any]:
    """Simulates multi-resolution H.264/WebP encoding pipeline."""
    steps = 4
    step_duration = max(0.2, duration_sec / steps)

    for i in range(1, steps + 1):
        await asyncio.sleep(step_duration)
        logger.debug(f"[{job_id}] Transcoding pass {i}/{steps} completed")

    # 5% chance of simulated memory spike failure
    if payload_size_kb > 80000 and random.random() < 0.2:
        raise TaskExecutionError("FFmpeg OOM: Buffer allocation limit of 2048MB reached", is_retryable=False)

    return {"codec": "H.264", "resolution": "1080p", "bitrate_kbps": 4500, "output_files": 4}


async def execute_email_delivery(job_id: str, duration_sec: float, payload_size_kb: int) -> Dict[str, Any]:
    """Simulates transactional SMTP/SES email dispatch."""
    await asyncio.sleep(duration_sec)

    # 10% chance of transient rate limit (HTTP 429) to demonstrate automatic retries
    if random.random() < 0.10:
        raise TaskExecutionError("Upstream SMTP API rate limit (HTTP 429: Too Many Requests)", is_retryable=True)

    return {"delivered": True, "provider": "SES-v2", "message_id": f"msg-{job_id}"}


async def execute_ai_inference(job_id: str, duration_sec: float, payload_size_kb: int) -> Dict[str, Any]:
    """Simulates LLM embedding generation and vector clustering."""
    await asyncio.sleep(duration_sec)
    tokens = payload_size_kb * 25
    return {"tokens_processed": tokens, "embedding_dim": 768, "model": "text-embedding-004"}


async def execute_data_pipeline(job_id: str, duration_sec: float, payload_size_kb: int) -> Dict[str, Any]:
    """Simulates database WAL archive snapshot and ETL batch."""
    await asyncio.sleep(duration_sec)
    return {"records_ingested": 14200, "target_table": "analytics_events_daily", "compressed": True}


async def execute_default_task(job_id: str, duration_sec: float, payload_size_kb: int) -> Dict[str, Any]:
    """Default generic task execution."""
    await asyncio.sleep(duration_sec)
    return {"status": "success", "processed_bytes": payload_size_kb * 1024}


TASK_REGISTRY = {
    "media-transcoding": execute_media_transcoding,
    "email-delivery": execute_email_delivery,
    "ai-inference": execute_ai_inference,
    "data-pipeline": execute_data_pipeline,
    "default": execute_default_task,
}


async def run_task(queue_name: str, job_id: str, duration_sec: float, payload_size_kb: int) -> Dict[str, Any]:
    """Routes task to appropriate handler according to queue name."""
    handler = TASK_REGISTRY.get(queue_name, execute_default_task)
    return await handler(job_id, duration_sec, payload_size_kb)
