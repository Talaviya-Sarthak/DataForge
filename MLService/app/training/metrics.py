"""Reusable metric calculation functions.

Provides separate helpers for classification and regression metrics so
that callers never need to import sklearn.metrics directly.
"""

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    r2_score,
    mean_squared_error,
    mean_absolute_error,
)


def classification_metrics(y_true: np.ndarray, y_pred: np.ndarray,
                           y_prob: np.ndarray | None = None) -> dict:
    """Compute standard classification metrics.

    Args:
        y_true: Ground-truth labels.
        y_pred: Predicted labels.
        y_prob: Predicted probabilities (used for ROC-AUC).
                Pass ``None`` if the model does not support ``predict_proba``.

    Returns:
        dict: Keys — accuracy, precision, recall, f1_score, roc_auc.
    """
    metrics = {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
    }

    # ROC-AUC requires probability estimates
    if y_prob is not None:
        try:
            n_classes = len(np.unique(y_true))
            if n_classes == 2:
                # Binary: use probability of positive class
                auc = roc_auc_score(y_true, y_prob[:, 1])
            else:
                # Multiclass: one-vs-rest
                auc = roc_auc_score(y_true, y_prob, multi_class="ovr", average="weighted")
            metrics["roc_auc"] = round(float(auc), 4)
        except (ValueError, IndexError):
            metrics["roc_auc"] = None
    else:
        metrics["roc_auc"] = None

    return metrics


def regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """Compute standard regression metrics.

    Args:
        y_true: Ground-truth target values.
        y_pred: Predicted target values.

    Returns:
        dict: Keys — r2_score, mse, rmse, mae.
    """
    mse = float(mean_squared_error(y_true, y_pred))
    return {
        "r2_score": round(float(r2_score(y_true, y_pred)), 4),
        "mse": round(mse, 4),
        "rmse": round(float(np.sqrt(mse)), 4),
        "mae": round(float(mean_absolute_error(y_true, y_pred)), 4),
    }
