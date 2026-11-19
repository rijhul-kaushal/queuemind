import asyncio
import logging
import redis.asyncio as aioredis
from backend.config import settings

logger = logging.getLogger("queuemind.redis")

_redis_instance = None
_is_real_redis = False


async def get_redis_client():
    """Returns the active async Redis client (Real Redis or In-Memory fallback)."""
    global _redis_instance, _is_real_redis
    if _redis_instance is not None:
        return _redis_instance

    # Try connecting to the configured REDIS_URL first with strict 0.8s timeout
    try:
        real_client = aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_timeout=1.0,
            socket_connect_timeout=1.0,
        )
        await asyncio.wait_for(real_client.ping(), timeout=0.8)
        _redis_instance = real_client
        _is_real_redis = True
        logger.info(f"Connected to live Redis server at {settings.REDIS_URL}")
        return _redis_instance
    except Exception as e:
        logger.info(
            f"No live Redis reachable at {settings.REDIS_URL} ({type(e).__name__}). "
            "Active in-memory Redis engine (fakeredis) enabled."
        )

    # In-memory Redis fallback using fakeredis
    try:
        import fakeredis.aioredis as fake_aioredis
        _redis_instance = fake_aioredis.FakeRedis(decode_responses=True)
        _is_real_redis = False
        return _redis_instance
    except Exception as fake_err:
        logger.error(f"Failed to initialize in-memory redis: {fake_err}")
        raise


def is_using_real_redis() -> bool:
    """Returns True if connected to an external Redis instance, False if using in-memory engine."""
    return _is_real_redis


async def close_redis_client():
    """Gracefully closes Redis connection pool on shutdown."""
    global _redis_instance
    if _redis_instance is not None:
        try:
            await _redis_instance.close()
        except Exception:
            pass
        _redis_instance = None
