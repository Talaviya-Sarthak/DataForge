"""Model trainer — fits models from the registry on a given dataset split.

Iterates over the model descriptors supplied by the registry, fits each
one on the training data, and returns the trained model alongside its
evaluation metrics.
"""

import pandas as pd

from app.training.evaluator import evaluate_model


def train_models(
    models: list[dict],
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    task_type: str,
) -> list[dict]:
    """Train and evaluate every model in *models*.

    Args:
        models: List of ``{"name": str, "instance": estimator}`` dicts.
        X_train: Training feature matrix.
        y_train: Training target vector.
        X_test: Test feature matrix.
        y_test: Test target vector.
        task_type: ``"classification"`` or ``"regression"``.

    Returns:
        list[dict]: Each dict has ``name``, ``instance`` (fitted), and
        ``metrics``.
    """
    results: list[dict] = []

    for descriptor in models:
        name = descriptor["name"]
        model = descriptor["instance"]

        model.fit(X_train, y_train)

        metrics = evaluate_model(model, X_test, y_test, task_type)

        results.append({
            "name": name,
            "instance": model,
            "metrics": metrics,
        })

    return results
