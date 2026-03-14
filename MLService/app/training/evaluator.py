"""
Evaluator
=========

Evaluates trained models by generating predictions and computing metrics.
Delegates metric computation to the metrics module.
"""

import numpy as np
from sklearn.base import BaseEstimator

from app.training.metrics import (
    compute_classification_metrics,
    compute_regression_metrics,
)


def evaluate_model(
    model: BaseEstimator,
    X_test: np.ndarray,
    y_test: np.ndarray,
    task_type: str,
) -> dict[str, float]:
    """
    Evaluate a trained model on the test set.

    Args:
        model:     Trained scikit-learn estimator.
        X_test:    Test feature matrix.
        y_test:    Test target array.
        task_type: "classification" or "regression".

    Returns:
        dict of metric name -> value.

    Raises:
        ValueError: If task_type is not supported.
    """
    y_pred = model.predict(X_test)

    if task_type == "classification":
        # Attempt to get probability estimates for ROC-AUC
        y_proba = None
        if hasattr(model, "predict_proba"):
            try:
                y_proba = model.predict_proba(X_test)
            except Exception:
                y_proba = None

        return compute_classification_metrics(y_test, y_pred, y_proba)

    if task_type == "regression":
        return compute_regression_metrics(y_test, y_pred)

    raise ValueError(f"Unsupported task_type '{task_type}'")
