from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.schemas import JobCreate, JobRead, ExecutionLogRead
from backend.services.job_service import JobService

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", response_model=List[JobRead])
async def list_jobs(
    search: Optional[str] = Query(None, description="Search term for name, ID, queue, or tags"),
    status: Optional[str] = Query(None, description="Filter by status (PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED, ALL)"),
    priority: Optional[str] = Query(None, description="Filter by priority (CRITICAL, HIGH, MEDIUM, LOW, ALL)"),
    queue: Optional[str] = Query(None, description="Filter by queue partition"),
    sortBy: str = Query("created_at", description="Field to sort by (created_at, duration_ms, priority, name)"),
    sortOrder: str = Query("desc", description="asc or desc"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves jobs with filtering, pagination, and sorting."""
    # Map frontend field name to DB column name
    sort_mapping = {
        "createdAt": "created_at",
        "created_at": "created_at",
        "durationMs": "duration_ms",
        "duration_ms": "duration_ms",
        "priority": "priority",
        "name": "name",
    }
    db_sort = sort_mapping.get(sortBy, "created_at")

    jobs = await JobService.get_jobs(
        session=db,
        search=search,
        status=status,
        priority=priority,
        queue=queue,
        sort_by=db_sort,
        sort_order=sortOrder,
        limit=limit,
        offset=offset,
    )
    return jobs


@router.post("", response_model=JobRead, status_code=201)
async def create_job(
    job_in: JobCreate,
    db: AsyncSession = Depends(get_db),
):
    """Enqueues a new background job into the Redis priority queue and registers it in the DB."""
    return await JobService.create_job(session=db, job_in=job_in)


@router.get("/{job_id}", response_model=JobRead)
async def get_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieves a single job by its ID."""
    job = await JobService.get_job_by_id(session=db, job_id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return job


@router.get("/{job_id}/logs", response_model=List[ExecutionLogRead])
async def get_job_logs(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieves lifecycle execution logs and transition events for a job."""
    return await JobService.get_job_logs(session=db, job_id=job_id)


@router.post("/{job_id}/retry", response_model=JobRead)
async def retry_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Manually re-enqueues a failed or cancelled job into the active queue."""
    job = await JobService.retry_job(session=db, job_id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return job


@router.post("/{job_id}/cancel", response_model=JobRead)
async def cancel_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Cancels a pending or processing job."""
    job = await JobService.cancel_job(session=db, job_id=job_id)
    if not job:
        raise HTTPException(status_code=400, detail=f"Job {job_id} cannot be cancelled or not found")
    return job


@router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Deletes a job from the database and queue."""
    deleted = await JobService.delete_job(session=db, job_id=job_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return {"success": True, "deleted_id": job_id}
