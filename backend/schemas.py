from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime

JobPriority = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
JobStatus = Literal["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]
WorkerStatus = Literal["IDLE", "BUSY", "PAUSED", "OFFLINE"]


class JobCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name or task identifier")
    queue: str = Field("default", max_length=64, description="Target queue partition")
    priority: JobPriority = Field("MEDIUM", description="Task scheduling priority")
    duration_ms: int = Field(5000, ge=100, le=3600000, description="Estimated duration in milliseconds")
    payload_size_kb: Optional[int] = Field(25, ge=0, description="Payload weight in KB")
    tags: Optional[List[str]] = Field(default_factory=list)


class JobUpdate(BaseModel):
    status: Optional[JobStatus] = None
    priority: Optional[JobPriority] = None
    worker_id: Optional[str] = None
    error_message: Optional[str] = None


class JobRead(BaseModel):
    id: str
    name: str
    queue: str
    priority: JobPriority
    status: JobStatus
    payloadSizeKb: Optional[int] = Field(default=25, alias="payload_size_kb")
    durationMs: int = Field(..., alias="duration_ms")
    workerId: Optional[str] = Field(default=None, alias="worker_id")
    retryCount: int = Field(default=0, alias="retry_count")
    maxRetries: int = Field(default=3, alias="max_retries")
    errorMessage: Optional[str] = Field(default=None, alias="error_message")
    tags: List[str] = Field(default_factory=list)
    createdAt: datetime = Field(..., alias="created_at")
    startedAt: Optional[datetime] = Field(default=None, alias="started_at")
    completedAt: Optional[datetime] = Field(default=None, alias="completed_at")

    class Config:
        populate_by_name = True
        from_attributes = True


class ExecutionLogRead(BaseModel):
    id: int
    jobId: str = Field(..., alias="job_id")
    workerId: Optional[str] = Field(default=None, alias="worker_id")
    event: str
    message: str
    timestamp: datetime

    class Config:
        populate_by_name = True
        from_attributes = True


class WorkerHeartbeat(BaseModel):
    worker_id: str
    hostname: str
    status: WorkerStatus
    active_job_id: Optional[str] = None
    active_job_name: Optional[str] = None
    concurrency: int = 4
    cpu_utilization: float = 0.0
    memory_usage_mb: int = 128
    uptime_seconds: int = 0
    queues: List[str] = Field(default_factory=lambda: ["default"])


class WorkerCapacityUpdate(BaseModel):
    concurrency: int = Field(..., ge=1, le=64)


class WorkerRead(BaseModel):
    id: str
    name: str
    hostname: str
    status: WorkerStatus
    activeJobId: Optional[str] = Field(default=None, alias="active_job_id")
    activeJobName: Optional[str] = Field(default=None, alias="active_job_name")
    concurrency: int
    assignedJobsCount: int = Field(default=0, alias="assigned_jobs_count")
    completedJobsCount: int = Field(default=0, alias="completed_jobs_count")
    failedJobsCount: int = Field(default=0, alias="failed_jobs_count")
    cpuUtilization: float = Field(default=0.0, alias="cpu_utilization")
    memoryUsageMb: int = Field(default=128, alias="memory_usage_mb")
    uptimeSeconds: int = Field(default=0, alias="uptime_seconds")
    heartbeatAt: datetime = Field(..., alias="heartbeat_at")
    queues: List[str]
    isSimulated: bool = Field(default=False, alias="is_simulated")

    class Config:
        populate_by_name = True
        from_attributes = True


class QueueMetric(BaseModel):
    name: str
    pending: int
    processing: int
    completed: int
    failed: int
    avgLatencyMs: int
    dlqCount: int = 0


class AnalyticsOverview(BaseModel):
    totalJobs: int
    pendingJobs: int
    processingJobs: int
    completedJobs: int
    failedJobs: int
    cancelledJobs: int
    activeWorkers: int
    totalWorkers: int
    avgDurationMs: int
    successRate: float
    estimatedThroughputPerMin: int
    redisConnected: bool
    databaseConnected: bool


class ThroughputPoint(BaseModel):
    time: str
    completed: int
    failed: int
    enqueued: int
