import os
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "QueueMind Backend"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"

    # Database: Defaults to SQLite for immediate out-of-the-box local execution.
    # Set DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/queuemind in .env for PostgreSQL.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./queuemind.db")

    # Redis: Defaults to local Redis. If unreachable, our RedisClient automatically
    # uses an in-memory Redis-compatible engine so development is never blocked.
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Distributed Worker & Queue Parameters
    HEARTBEAT_INTERVAL_SECONDS: int = 5
    HEARTBEAT_TIMEOUT_SECONDS: int = 15
    MAX_JOB_RETRIES: int = 3
    BASE_RETRY_DELAY_SECONDS: float = 2.0
    DLQ_QUEUE_NAME: str = "dlq"

    # CORS configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"


settings = Settings()
