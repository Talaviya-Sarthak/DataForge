"""Enhanced model evaluator — metrics + required plots only."""

import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix, roc_curve, auc

from app.training.metrics import classification_metrics, regression_metrics

_MAX_SCATTER_POINTS = 500


def _extract_feature_importance(model, feature_names: list) -> dict | None:
    """Return top-20 feature importances, or None if unavailable."""
    try:
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
        elif hasattr(model, "coef_"):
            coef = model.coef_
            importances = np.abs(coef).mean(axis=0) if coef.ndim > 1 else np.abs(coef)
        else:
            return None

        indices = np.argsort(importances)[-20:][::-1]
        return {
            "features": [feature_names[i] for i in indices],
            "importances": [float(importances[i]) for i in indices],
        }
    except Exception:
        return None


def _sample_indices(n: int) -> np.ndarray:
    if n <= _MAX_SCATTER_POINTS:
        return np.arange(n)
    return np.random.choice(n, _MAX_SCATTER_POINTS, replace=False)


def evaluate_model_with_plots(
    model,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    task_type: str,
) -> dict:
    """Compute metrics and generate required plots. Returns clean dict."""
    y_pred = model.predict(X_test)
    y_true = y_test.to_numpy() if hasattr(y_test, "to_numpy") else np.array(y_test)

    feature_importance = _extract_feature_importance(model, X_test.columns.tolist())

    if task_type == "classification":
        y_prob = None
        if hasattr(model, "predict_proba"):
            try:
                y_prob = model.predict_proba(X_test)
            except Exception:
                pass

        metrics = classification_metrics(y_true, y_pred, y_prob)
        plots = _classification_plots(y_true, y_pred, y_prob)

    else:
        metrics = regression_metrics(y_true, y_pred)
        plots = _regression_plots(y_true, y_pred)

    # Residuals are mandatory for both task types
    plots["residuals"] = _build_residuals(y_true, y_pred)
    plots["feature_importance"] = feature_importance

    return {"metrics": metrics, "plots": plots}


# ── Classification ────────────────────────────────────────────────────────────

def _classification_plots(y_true: np.ndarray, y_pred: np.ndarray, y_prob) -> dict:
    plots = {}

    # Confusion matrix
    plots["confusion_matrix"] = confusion_matrix(y_true, y_pred).tolist()

    # ROC curve + Precision-Recall curve (binary; multiclass ROC handled gracefully)
    plots["roc_curve"] = None
    plots["precision_recall_curve"] = None
    if y_prob is not None:
        n_classes = len(np.unique(y_true))
        try:
            if n_classes == 2:
                from sklearn.metrics import precision_recall_curve as prc
                fpr, tpr, _ = roc_curve(y_true, y_prob[:, 1])
                plots["roc_curve"] = {
                    "fpr": fpr.tolist(),
                    "tpr": tpr.tolist(),
                    "auc": round(float(auc(fpr, tpr)), 4),
                }
                precision, recall, _ = prc(y_true, y_prob[:, 1])
                plots["precision_recall_curve"] = {
                    "precision": precision.tolist(),
                    "recall": recall.tolist(),
                }
            else:
                from sklearn.preprocessing import label_binarize
                classes = np.unique(y_true)
                y_bin = label_binarize(y_true, classes=classes)
                roc_curves = {}
                for i, cls in enumerate(classes):
                    fpr, tpr, _ = roc_curve(y_bin[:, i], y_prob[:, i])
                    roc_curves[str(cls)] = {
                        "fpr": fpr.tolist(),
                        "tpr": tpr.tolist(),
                        "auc": round(float(auc(fpr, tpr)), 4),
                    }
                plots["roc_curve"] = roc_curves
        except Exception:
            plots["roc_curve"] = None
            plots["precision_recall_curve"] = None

    # Regression plots not applicable
    plots["predicted_vs_actual"] = None
    plots["error_distribution"] = None
    return plots


# ── Regression ────────────────────────────────────────────────────────────────

def _regression_plots(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    idx = _sample_indices(len(y_true))
    actual = y_true[idx]
    predicted = y_pred[idx]
    errors = np.abs(actual - predicted)
    return {
        "predicted_vs_actual": {
            "actual": actual.tolist(),
            "predicted": predicted.tolist(),
        },
        "error_distribution": _build_error_distribution(errors),
        "confusion_matrix": None,
        "roc_curve": None,
        "precision_recall_curve": None,
    }


# ── Error distribution histogram (regression) ─────────────────────────────────

def _build_error_distribution(errors: np.ndarray, bins: int = 20) -> list[dict]:
    """Return histogram bins [{label, count}] for absolute errors."""
    if len(errors) == 0:
        return []
    counts, edges = np.histogram(errors, bins=bins)
    return [
        {"label": round(float(edges[i]), 4), "count": int(counts[i])}
        for i in range(len(counts))
    ]


# ── Residuals (both task types) ───────────────────────────────────────────────

def _build_residuals(y_true: np.ndarray, y_pred: np.ndarray) -> list[dict]:
    """Return [{actual, predicted, residual}] sampled to ≤500 points."""
    idx = _sample_indices(len(y_true))
    return [
        {
            "actual": float(y_true[i]),
            "predicted": float(y_pred[i]),
            "residual": float(y_true[i] - y_pred[i]),
        }
        for i in idx
    ]


# ── Aggregated chart data (used by experiment_pipeline) ──────────────────────

def generate_aggregated_chart_data(models: list[dict], task_type: str) -> dict:
    chart_data = {
        "model_names": [m.get("model", m.get("name", "Unknown")) for m in models],
    }

    if task_type == "classification":
        chart_data["grouped_bar"] = {
            "accuracy":  [m.get("accuracy", 0) for m in models],
            "precision": [m.get("precision", 0) for m in models],
            "recall":    [m.get("recall", 0) for m in models],
            "f1_score":  [m.get("f1_score", 0) for m in models],
        }
        chart_data["horizontal_bar"] = {
            "metric": "accuracy",
            "values": [m.get("accuracy", 0) for m in models],
        }
        chart_data["stacked_bar"] = chart_data["grouped_bar"]
    else:
        chart_data["grouped_bar"] = {
            "r2_score": [m.get("r2_score", 0) for m in models],
            "rmse":     [m.get("rmse", 0) for m in models],
            "mse":      [m.get("mse", 0) for m in models],
        }
        chart_data["horizontal_bar"] = {
            "metric": "r2_score",
            "values": [m.get("r2_score", 0) for m in models],
        }
        chart_data["stacked_bar"] = None

    return chart_data


def generate_results_table(models: list[dict], task_type: str) -> list[dict]:
    table = []
    for m in models:
        t = m.get("training_time_ms", 0)
        time_str = f"{t / 1000:.2f}s" if t >= 1000 else f"{t}ms"
        if task_type == "classification":
            row = {
                "model":    m.get("model", m.get("name", "Unknown")),
                "accuracy": f"{m.get('accuracy', 0):.4f}",
                "precision":f"{m.get('precision', 0):.4f}",
                "recall":   f"{m.get('recall', 0):.4f}",
                "f1":       f"{m.get('f1_score', 0):.4f}",
                "roc_auc":  f"{m.get('roc_auc', 0):.4f}" if m.get("roc_auc") else "N/A",
                "training_time": time_str,
            }
        else:
            row = {
                "model":   m.get("model", m.get("name", "Unknown")),
                "rmse":    f"{m.get('rmse', 0):.4f}",
                "mse":     f"{m.get('mse', 0):.4f}",
                "r2":      f"{m.get('r2_score', 0):.4f}",
                "mae":     f"{m.get('mae', 0):.4f}",
                "training_time": time_str,
            }
        table.append(row)
    return table
