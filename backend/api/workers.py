from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.schemas import WorkerRead, WorkerCapacityUpdate
from backend.services.worker_service import WorkerService

router = APIRouter(prefix="/workers", tags=["Workers"])


@router.get("", response_model=List[WorkerRead])
async def list_workers(
    db: AsyncSession = Depends(get_db),
):
    """Lists all registered worker nodes with live heartbeat status from Redis."""
    return await WorkerService.get_workers(session=db)


@router.get("/{worker_id}", response_model=WorkerRead)
async def get_worker(
    worker_id: str,
    db: AsyncSession = Depends(get_db),
):
    worker = await WorkerService.get_worker_by_id(session=db, worker_id=worker_id)
    if not worker:
        raise HTTPException(status_code=404, detail=f"Worker {worker_id} not found")
    return worker


@router.post("/{worker_id}/toggle", response_model=WorkerRead)
async def toggle_worker(
    worker_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Toggles worker status between IDLE/BUSY, PAUSED, and OFFLINE."""
    worker = await WorkerService.toggle_status(session=db, worker_id=worker_id)
    if not worker:
        raise HTTPException(status_code=404, detail=f"Worker {worker_id} not found")
    return worker


@router.post("/{worker_id}/capacity", response_model=WorkerRead)
async def update_worker_capacity(
    worker_id: str,
    update_in: WorkerCapacityUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Updates maximum concurrent tasks a worker instance can process."""
    worker = await WorkerService.update_capacity(
        session=db, worker_id=worker_id, concurrency=update_in.concurrency
    )
    if not worker:
        raise HTTPException(status_code=404, detail=f"Worker {worker_id} not found")
    return worker
