"""
Model Registry
==============

Central registry that maps task types to their available models.
Acts as the single source of truth for which models are trained per task.
"""

from app.models.classification_models import get_classification_models
from app.models.regression_models import get_regression_models


_TASK_REGISTRY = {
    "classification": get_classification_models,
    "regression": get_regression_models,
}


def get_models_for_task(task_type: str) -> dict:
    """
    Retrieve all model instances for the given task type.

    Args:
        task_type: Either "classification" or "regression".

    Returns:
        dict: Mapping of model name -> untrained sklearn estimator.

    Raises:
        ValueError: If task_type is not supported.
    """
    factory = _TASK_REGISTRY.get(task_type)
    if factory is None:
        supported = ", ".join(_TASK_REGISTRY.keys())
        raise ValueError(f"Unsupported task_type '{task_type}'. Supported: {supported}")
    return factory()


def get_supported_task_types() -> list[str]:
    """Return the list of supported task types."""
    return list(_TASK_REGISTRY.keys())
