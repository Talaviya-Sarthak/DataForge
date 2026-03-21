"""Experiment storage for tracking ML training runs.

Provides in-memory storage for experiment results, enabling:
    - Iterative retraining workflow
    - Experiment comparison and visualization
"""

import uuid
from datetime import datetime
from typing import Any


# ── In-memory experiment storage ────────────────────────────────
# Key: experiment_id (str) → dict with full experiment data
EXPERIMENT_STORE: dict[str, dict] = {}


def generate_experiment_id() -> str:
    """Generate a unique experiment ID."""
    return f"exp_{uuid.uuid4().hex[:12]}"


def store_experiment(
    experiment_id: str,
    pipeline_id: str,
    task_type: str,
    target_column: str,
    preprocessing_config: dict,
    selected_models: list[str] | None,
    results: dict,
) -> dict:
    """Store experiment results for later retrieval.

    Args:
        experiment_id: Unique experiment identifier.
        pipeline_id: Associated pipeline ID.
        task_type: "classification" or "regression".
        target_column: Name of target column.
        preprocessing_config: Runtime preprocessing configuration.
        selected_models: List of model names that were trained (None = all).
        results: Training results including models, metrics, and plots.

    Returns:
        dict: The stored experiment entry.
    """
    experiment = {
        "experiment_id": experiment_id,
        "pipeline_id": pipeline_id,
        "task_type": task_type,
        "target_column": target_column,
        "preprocessing_config": preprocessing_config,
        "selected_models": selected_models,
        "created_at": datetime.utcnow().isoformat(),
        "results": results,
    }

    EXPERIMENT_STORE[experiment_id] = experiment
    return experiment


def get_experiment(experiment_id: str) -> dict | None:
    """Retrieve experiment by ID."""
    return EXPERIMENT_STORE.get(experiment_id)


def get_experiments_for_pipeline(pipeline_id: str) -> list[dict]:
    """Get all experiments for a specific pipeline."""
    return [
        exp for exp in EXPERIMENT_STORE.values()
        if exp["pipeline_id"] == pipeline_id
    ]


def invalidate_experiments_for_pipeline(pipeline_id: str) -> int:
    """Invalidate all experiments for a pipeline (when dataset/config changes).

    Returns:
        int: Number of experiments invalidated.
    """
    count = 0
    for exp_id, exp in list(EXPERIMENT_STORE.items()):
        if exp["pipeline_id"] == pipeline_id:
            exp["invalidated"] = True
            exp["invalidated_at"] = datetime.utcnow().isoformat()
            count += 1
    return count


def delete_experiment(experiment_id: str) -> bool:
    """Delete an experiment by ID."""
    if experiment_id in EXPERIMENT_STORE:
        del EXPERIMENT_STORE[experiment_id]
        return True
    return False
