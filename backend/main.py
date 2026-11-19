import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import init_db
from backend.queue.redis_client import get_redis_client, is_using_real_redis, close_redis_client
from backend.api import jobs, workers, queues, analytics

# Setup root logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("queuemind.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database and check Redis
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    await init_db()

    # Pre-warm Redis connection
    redis = await get_redis_client()
    redis_mode = "Live Redis Cluster" if is_using_real_redis() else "In-Memory Redis Fallback (fakeredis)"
    logger.info(f"Queue Engine initialized. Active mode: {redis_mode}")

    yield

    # Shutdown: Close resources
    logger.info("Shutting down QueueMind backend...")
    await close_redis_client()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Job Queue, Distributed Processing & Workload Scheduling API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware for Next.js frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(jobs.router, prefix=settings.API_V1_STR)
app.include_router(workers.router, prefix=settings.API_V1_STR)
app.include_router(queues.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)


@app.get("/", tags=["System"])
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "redis_mode": "live" if is_using_real_redis() else "in_memory",
    }


@app.get("/health", tags=["System"])
async def health():
    return {
        "status": "healthy",
        "database": "connected",
        "redis": "connected",
        "redis_live": is_using_real_redis(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
