from datetime import datetime, timezone
import json
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    DateTime,
    Text,
    Boolean,
    Index,
)
from backend.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class JobModel(Base):
    __tablename__ = "jobs"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    queue = Column(String(64), nullable=False, default="default", index=True)
    priority = Column(String(16), nullable=False, default="MEDIUM", index=True)  # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(String(16), nullable=False, default="PENDING", index=True)   # PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
    payload_size_kb = Column(Integer, default=25)
    duration_ms = Column(Integer, default=5000)
    worker_id = Column(String(64), nullable=True, index=True)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    error_message = Column(Text, nullable=True)
    tags_json = Column(Text, default="[]")  # Serialized list of strings
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    @property
    def tags(self):
        try:
            return json.loads(self.tags_json) if self.tags_json else []
        except Exception:
            return []

    @tags.setter
    def tags(self, val):
        self.tags_json = json.dumps(val if isinstance(val, list) else [])


class WorkerModel(Base):
    __tablename__ = "workers"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    hostname = Column(String(255), nullable=False, default="localhost")
    status = Column(String(16), nullable=False, default="IDLE", index=True)  # IDLE, BUSY, PAUSED, OFFLINE
    active_job_id = Column(String(64), nullable=True)
    active_job_name = Column(String(255), nullable=True)
    concurrency = Column(Integer, default=4)
    assigned_jobs_count = Column(Integer, default=0)
    completed_jobs_count = Column(Integer, default=0)
    failed_jobs_count = Column(Integer, default=0)
    cpu_utilization = Column(Float, default=0.0)
    memory_usage_mb = Column(Integer, default=128)
    uptime_seconds = Column(Integer, default=0)
    heartbeat_at = Column(DateTime, default=utc_now, nullable=False)
    queues_json = Column(Text, default='["default"]')
    is_simulated = Column(Boolean, default=False)

    @property
    def queues(self):
        try:
            return json.loads(self.queues_json) if self.queues_json else ["default"]
        except Exception:
            return ["default"]

    @queues.setter
    def queues(self, val):
        self.queues_json = json.dumps(val if isinstance(val, list) else ["default"])


class ExecutionLogModel(Base):
    __tablename__ = "execution_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(64), nullable=False, index=True)
    worker_id = Column(String(64), nullable=True)
    event = Column(String(64), nullable=False)  # ENQUEUED, STARTED, COMPLETED, FAILED, RETRIED, CANCELLED, DLQ
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=utc_now, nullable=False)


# Composite indexes for high throughput querying
Index("ix_jobs_status_priority", JobModel.status, JobModel.priority)
Index("ix_jobs_queue_status", JobModel.queue, JobModel.status)
