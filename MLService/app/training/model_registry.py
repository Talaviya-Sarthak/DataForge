"""Model registry mapping task types to their model factories.

Centralises the association between task types (classification / regression)
and the functions that produce fresh, untrained model instances.
"""

from app.models.classification_models import get_classification_models
from app.models.regression_models import get_regression_models


MODEL_REGISTRY: dict[str, callable] = {
    "classification": get_classification_models,
    "regression": get_regression_models,
}


def get_models_for_task(task_type: str) -> list[dict]:
    """Return model descriptors for the requested task type.

    Args:
        task_type: Either ``"classification"`` or ``"regression"``.

    Returns:
        list[dict]: Each dict has ``name`` (str) and ``instance`` (estimator).

    Raises:
        ValueError: If *task_type* is not recognised.
    """
    factory = MODEL_REGISTRY.get(task_type)
    if factory is None:
        raise ValueError(
            f"Unknown task type '{task_type}'. "
            f"Supported: {list(MODEL_REGISTRY.keys())}"
        )
    return factory()
