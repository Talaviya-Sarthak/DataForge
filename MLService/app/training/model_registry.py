"""Model registry mapping task types to their model factories.

Centralises the association between task types (classification / regression)
and the functions that produce fresh, untrained model instances.

Supports selective model training by filtering models by name.
"""

from app.models.classification_models import get_classification_models
from app.models.regression_models import get_regression_models


MODEL_REGISTRY: dict[str, callable] = {
    "classification": get_classification_models,
    "regression": get_regression_models,
}


# Canonical model names per task type (for validation)
AVAILABLE_MODELS: dict[str, list[str]] = {
    "classification": [
        "LogisticRegression",
        "RidgeClassifier",
        "SGDClassifier",
        "PassiveAggressiveClassifier",
        "DecisionTreeClassifier",
        "RandomForestClassifier",
        "ExtraTreesClassifier",
        "GradientBoostingClassifier",
        "AdaBoostClassifier",
        "KNeighborsClassifier",
        "SVC",
        "LinearSVC",
        "GaussianNB",
        "MLPClassifier",
    ],
    "regression": [
        "LinearRegression",
        "Ridge",
        "Lasso",
        "ElasticNet",
        "BayesianRidge",
        "HuberRegressor",
        "SGDRegressor",
        "DecisionTreeRegressor",
        "RandomForestRegressor",
        "ExtraTreesRegressor",
        "GradientBoostingRegressor",
        "AdaBoostRegressor",
        "KNeighborsRegressor",
        "SVR",
    ],
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


def get_selected_models(
    task_type: str,
    selected_models: list[str] | None = None,
) -> list[dict]:
    """Return model descriptors filtered by selection.

    Args:
        task_type: Either ``"classification"`` or ``"regression"``.
        selected_models: List of model names to include. If None or empty,
                        returns all models for the task type.

    Returns:
        list[dict]: Filtered model descriptors.

    Raises:
        ValueError: If task_type is not recognised or selected model
                    names are invalid.
    """
    all_models = get_models_for_task(task_type)

    if not selected_models:
        return all_models

    # Validate selected model names
    available = set(AVAILABLE_MODELS.get(task_type, []))
    invalid = [m for m in selected_models if m not in available]
    if invalid:
        raise ValueError(
            f"Invalid model names for {task_type}: {invalid}. "
            f"Available: {list(available)}"
        )

    # Filter models by name
    selected_set = set(selected_models)
    filtered = [m for m in all_models if m["name"] in selected_set]

    return filtered


def get_available_models(task_type: str) -> list[str]:
    """Return list of available model names for a task type.

    Args:
        task_type: Either ``"classification"`` or ``"regression"``.

    Returns:
        list[str]: Available model names.
    """
    return AVAILABLE_MODELS.get(task_type, [])
