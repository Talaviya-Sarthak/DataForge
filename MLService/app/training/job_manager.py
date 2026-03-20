"""Background job manager for async training."""

import threading
import time
from typing import Callable, Any
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Job storage
JOBS = {}
_executor = ThreadPoolExecutor(max_workers=4)

# User training locks (prevent duplicate training per user)
USER_TRAINING_LOCKS = {}


def create_job(job_id: str, job_type: str = "training", user_id: int = None) -> dict:
    """Create a new job entry."""
    job = {
        "job_id": job_id,
        "type": job_type,
        "status": "pending",
        "progress": 0,
        "user_id": user_id,
        "created_at": datetime.utcnow().isoformat(),
        "started_at": None,
        "completed_at": None,
        "result": None,
        "error": None,
    }
    JOBS[job_id] = job
    return job


def get_job(job_id: str) -> dict | None:
    """Get job status."""
    return JOBS.get(job_id)


def has_running_training(user_id: int) -> bool:
    """Check if user has any running training jobs."""
    for job in JOBS.values():
        if (
            job.get("user_id") == user_id
            and job.get("type") == "training"
            and job.get("status") == "running"
        ):
            return True
    return False


def update_job(job_id: str, **updates):
    """Update job fields."""
    if job_id in JOBS:
        JOBS[job_id].update(updates)


def run_job_async(job_id: str, func: Callable, *args, **kwargs):
    """Run a job in background thread."""
    def wrapper():
        try:
            update_job(job_id, status="running", started_at=datetime.utcnow().isoformat())
            result = func(*args, **kwargs)
            update_job(
                job_id,
                status="completed",
                progress=100,
                result=result,
                completed_at=datetime.utcnow().isoformat()
            )
        except Exception as e:
            update_job(
                job_id,
                status="failed",
                error=str(e),
                completed_at=datetime.utcnow().isoformat()
            )
    
    thread = threading.Thread(target=wrapper, daemon=True)
    thread.start()


def train_models_parallel(models, train_func, max_workers=3):
    """Train multiple models in parallel."""
    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(train_func, model): model for model in models}
        for future in as_completed(futures):
            try:
                result = future.result(timeout=30)  # 30s per model
                results.append(result)
            except Exception as e:
                model = futures[future]
                results.append({
                    "model": model.get("name", "unknown"),
                    "status": "failed",
                    "error": str(e)
                })
    return results
