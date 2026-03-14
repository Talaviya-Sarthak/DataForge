"""
Metrics
=======

Computes evaluation metrics for classification and regression tasks.
All functions accept numpy arrays and return plain Python floats.
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


def compute_classification_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_proba: np.ndarray | None = None,
) -> dict[str, float]:
    """
    Compute classification metrics.

    Args:
        y_true:  Ground truth labels.
        y_pred:  Predicted labels.
        y_proba: Predicted probabilities (used for ROC-AUC). May be None if
                 the model does not support predict_proba.

    Returns:
        dict with keys: accuracy, precision, recall, f1_score, roc_auc.
    """
    metrics: dict[str, float] = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(
            precision_score(y_true, y_pred, average="weighted", zero_division=0)
        ),
        "recall": float(
            recall_score(y_true, y_pred, average="weighted", zero_division=0)
        ),
        "f1_score": float(
            f1_score(y_true, y_pred, average="weighted", zero_division=0)
        ),
    }

    # ROC-AUC requires probability estimates
    if y_proba is not None:
        try:
            n_classes = len(np.unique(y_true))
            if n_classes == 2:
                # Binary: use probability of the positive class
                auc = roc_auc_score(y_true, y_proba[:, 1])
            else:
                # Multiclass: one-vs-rest
                auc = roc_auc_score(
                    y_true, y_proba, multi_class="ovr", average="weighted"
                )
            metrics["roc_auc"] = float(auc)
        except (ValueError, IndexError):
            metrics["roc_auc"] = None
    else:
        metrics["roc_auc"] = None

    return metrics


def compute_regression_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
) -> dict[str, float]:
    """
    Compute regression metrics.

    Args:
        y_true: Ground truth values.
        y_pred: Predicted values.

    Returns:
        dict with keys: r2_score, mse, rmse, mae.
    """
    mse = float(mean_squared_error(y_true, y_pred))
    return {
        "r2_score": float(r2_score(y_true, y_pred)),
        "mse": mse,
        "rmse": float(np.sqrt(mse)),
        "mae": float(mean_absolute_error(y_true, y_pred)),
    }
