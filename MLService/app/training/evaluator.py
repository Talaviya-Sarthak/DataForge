"""Model evaluator — computes metrics for trained models.

Separates prediction from metric calculation so that each concern
lives in a single, testable module.
"""

import numpy as np
import pandas as pd
from sklearn.base import ClassifierMixin

from app.training.metrics import classification_metrics, regression_metrics


def evaluate_model(model, X_test: pd.DataFrame, y_test: pd.Series,
                   task_type: str) -> dict:
    """Generate predictions and compute metrics for a single trained model.

    Args:
        model: A fitted scikit-learn estimator.
        X_test: Test feature matrix.
        y_test: Test target vector.
        task_type: ``"classification"`` or ``"regression"``.

    Returns:
        dict: Metric name → value mapping.
    """
    y_pred = model.predict(X_test)

    if task_type == "classification":
        # Attempt to get probability estimates for ROC-AUC
        y_prob = None
        if hasattr(model, "predict_proba"):
            try:
                y_prob = model.predict_proba(X_test)
            except Exception:
                y_prob = None
        return classification_metrics(y_test.to_numpy(), y_pred, y_prob)

    return regression_metrics(y_test.to_numpy(), y_pred)
