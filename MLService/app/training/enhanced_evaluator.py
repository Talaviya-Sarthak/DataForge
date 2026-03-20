"""Enhanced model evaluator with plot data generation and exportable artifacts."""

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.metrics import confusion_matrix, roc_curve, auc
from sklearn.model_selection import learning_curve

from app.training.metrics import classification_metrics, regression_metrics


def _extract_feature_importance(model, feature_names: list) -> dict | None:
    """Extract feature importance from model if available.
    
    Returns:
        dict with 'features' and 'importances' keys, or None if not available.
    """
    try:
        # Tree-based models (RandomForest, XGBoost, etc.)
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            # Get top 20 features
            indices = np.argsort(importances)[-20:][::-1]
            return {
                "features": [feature_names[i] for i in indices],
                "importances": [float(importances[i]) for i in indices],
            }
        # Linear models with coefficients
        elif hasattr(model, 'coef_'):
            coef = model.coef_
            if len(coef.shape) > 1:
                coef = np.abs(coef).mean(axis=0)
            else:
                coef = np.abs(coef)
            indices = np.argsort(coef)[-20:][::-1]
            return {
                "features": [feature_names[i] for i in indices],
                "importances": [float(coef[i]) for i in indices],
            }
    except Exception:
        pass
    return None


def evaluate_model_with_plots(
    model,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    task_type: str,
) -> dict:
    """Generate predictions, compute metrics, and generate plot data."""
    y_pred = model.predict(X_test)
    y_true = y_test.to_numpy() if hasattr(y_test, "to_numpy") else np.array(y_test)

    if task_type == "classification":
        y_prob = None
        if hasattr(model, "predict_proba"):
            try:
                y_prob = model.predict_proba(X_test)
            except Exception:
                y_prob = None

        metrics = classification_metrics(y_true, y_pred, y_prob)
        plots = _generate_classification_plots(y_true, y_pred, y_prob)
        artifacts = {
            "actual_values": y_true.tolist(),
            "predicted_values": y_pred.tolist(),
            "probabilities": y_prob.tolist() if y_prob is not None else None,
            "residuals": None,
        }

    else:  # regression
        metrics = regression_metrics(y_true, y_pred)
        plots = _generate_regression_plots(y_true, y_pred, X_test)
        artifacts = {
            "actual_values": y_true.tolist(),
            "predicted_values": y_pred.tolist(),
            "probabilities": None,
            "residuals": (y_true - y_pred).tolist(),
        }

    feature_importance = _extract_feature_importance(model, X_test.columns.tolist())
    plots["learning_curve"] = _generate_learning_curve(model, X_train, y_train, task_type)
    if task_type == "regression":
        plots["feature_vs_target"] = _generate_feature_vs_target_plot(
            X_test=X_test,
            y_true=y_true,
            feature_importance=feature_importance,
        )

    return {
        "metrics": metrics,
        "plots": plots,
        "feature_importance": feature_importance,
        "artifacts": artifacts,
    }


def _generate_classification_plots(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: np.ndarray | None,
) -> dict:
    from sklearn.metrics import precision_recall_curve
    plots = {}

    cm = confusion_matrix(y_true, y_pred)
    plots["confusion_matrix"] = cm.tolist()

    if y_prob is not None:
        n_classes = len(np.unique(y_true))
        if n_classes == 2:
            try:
                fpr, tpr, thresholds = roc_curve(y_true, y_prob[:, 1])
                roc_auc = auc(fpr, tpr)
                plots["roc_curve"] = {
                    "fpr": fpr.tolist(),
                    "tpr": tpr.tolist(),
                    "thresholds": thresholds.tolist(),
                    "auc": round(float(roc_auc), 4),
                }

                precision, recall, pr_thresholds = precision_recall_curve(y_true, y_prob[:, 1])
                plots["precision_recall_curve"] = {
                    "precision": precision.tolist(),
                    "recall": recall.tolist(),
                    "thresholds": pr_thresholds.tolist(),
                }
            except (ValueError, IndexError):
                plots["roc_curve"] = None
                plots["precision_recall_curve"] = None
        else:
            try:
                from sklearn.preprocessing import label_binarize

                classes = np.unique(y_true)
                y_true_bin = label_binarize(y_true, classes=classes)

                roc_curves = {}
                for i, cls in enumerate(classes):
                    fpr, tpr, _ = roc_curve(y_true_bin[:, i], y_prob[:, i])
                    roc_auc = auc(fpr, tpr)
                    roc_curves[str(cls)] = {
                        "fpr": fpr.tolist(),
                        "tpr": tpr.tolist(),
                        "auc": round(float(roc_auc), 4),
                    }
                plots["roc_curve"] = roc_curves
                plots["precision_recall_curve"] = None
            except Exception:
                plots["roc_curve"] = None
                plots["precision_recall_curve"] = None
    else:
        plots["roc_curve"] = None
        plots["precision_recall_curve"] = None

    classes, counts = np.unique(y_true, return_counts=True)
    plots["class_labels"] = [str(c) for c in classes]
    plots["class_distribution"] = {
        "labels": [str(c) for c in classes],
        "counts": counts.astype(int).tolist(),
    }

    return plots


def _generate_regression_plots(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    X_test: pd.DataFrame,
) -> dict:
    residuals = (y_true - y_pred)
    errors = np.abs(residuals)

    max_points = 1000
    if len(y_true) > max_points:
        indices = np.random.choice(len(y_true), max_points, replace=False)
        actual_sample = y_true[indices]
        predicted_sample = y_pred[indices]
        residuals_sample = residuals[indices]
        errors_sample = errors[indices]
    else:
        actual_sample = y_true
        predicted_sample = y_pred
        residuals_sample = residuals
        errors_sample = errors

    sorted_indices = np.argsort(actual_sample)
    sorted_actual = actual_sample[sorted_indices]
    sorted_predicted = predicted_sample[sorted_indices]

    return {
        "predicted_vs_actual": {
            "actual": actual_sample.tolist(),
            "predicted": predicted_sample.tolist(),
        },
        "residual_vs_predicted": {
            "predicted": predicted_sample.tolist(),
            "residuals": residuals_sample.tolist(),
        },
        "regression_line": {
            "actual": sorted_actual.tolist(),
            "predicted": sorted_predicted.tolist(),
        },
        "error_distribution": errors_sample.tolist(),
        "residuals": residuals_sample.tolist(),
    }


def _generate_learning_curve(
    model,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    task_type: str,
) -> dict | None:
    try:
        if len(X_train) < 10:
            return None

        cv_folds = min(5, max(2, len(X_train) // 10))
        scoring = "accuracy" if task_type == "classification" else "r2"
        train_sizes, train_scores, validation_scores = learning_curve(
            estimator=clone(model),
            X=X_train,
            y=y_train,
            train_sizes=np.linspace(0.2, 1.0, 5),
            cv=cv_folds,
            scoring=scoring,
            n_jobs=1,
            shuffle=True,
            random_state=42,
        )

        train_mean = np.nanmean(train_scores, axis=1)
        validation_mean = np.nanmean(validation_scores, axis=1)
        return {
            "train_sizes": train_sizes.astype(int).tolist(),
            "train_score": train_mean.astype(float).tolist(),
            "validation_score": validation_mean.astype(float).tolist(),
            "train_loss": (1 - train_mean).astype(float).tolist(),
            "validation_loss": (1 - validation_mean).astype(float).tolist(),
            "score_label": "accuracy" if task_type == "classification" else "r2_score",
        }
    except Exception:
        return None


def _generate_feature_vs_target_plot(
    X_test: pd.DataFrame,
    y_true: np.ndarray,
    feature_importance: dict | None,
) -> dict | None:
    try:
        feature_name = None
        if feature_importance and feature_importance.get("features"):
            feature_name = feature_importance["features"][0]
        elif len(X_test.columns) > 0:
            feature_name = X_test.columns[0]

        if not feature_name or feature_name not in X_test.columns:
            return None

        feature_values = X_test[feature_name].to_numpy()
        target_values = y_true
        max_points = 1000
        if len(feature_values) > max_points:
            indices = np.random.choice(len(feature_values), max_points, replace=False)
            feature_values = feature_values[indices]
            target_values = target_values[indices]

        return {
            "feature_name": str(feature_name),
            "feature_values": feature_values.astype(float).tolist(),
            "target_values": target_values.astype(float).tolist(),
        }
    except Exception:
        return None


def generate_aggregated_chart_data(
    models: list[dict],
    task_type: str,
) -> dict:
    """Generate aggregated chart data for frontend visualization.

    Args:
        models: List of model result dicts with 'model' and metrics.
        task_type: "classification" or "regression".

    Returns:
        dict with chart data:
            - grouped_bar: Data for grouped bar chart
            - horizontal_bar: Data for horizontal bar chart
            - stacked_bar: Data for stacked bar chart (classification only)
    """
    chart_data = {
        "model_names": [m.get("model", m.get("name", "Unknown")) for m in models],
    }

    if task_type == "classification":
        # Stacked bar chart: accuracy, precision, recall, f1
        chart_data["stacked_bar"] = {
            "accuracy": [m.get("accuracy", 0) for m in models],
            "precision": [m.get("precision", 0) for m in models],
            "recall": [m.get("recall", 0) for m in models],
            "f1_score": [m.get("f1_score", 0) for m in models],
        }

        # Horizontal bar chart: accuracy
        chart_data["horizontal_bar"] = {
            "metric": "accuracy",
            "values": [m.get("accuracy", 0) for m in models],
        }

        # Grouped bar chart (same as stacked for classification)
        chart_data["grouped_bar"] = chart_data["stacked_bar"]

    else:  # regression
        # Grouped bar chart: rmse, mse, r2
        chart_data["grouped_bar"] = {
            "rmse": [m.get("rmse", 0) for m in models],
            "mse": [m.get("mse", 0) for m in models],
            "r2_score": [m.get("r2_score", 0) for m in models],
        }

        # Horizontal bar chart: r2_score
        chart_data["horizontal_bar"] = {
            "metric": "r2_score",
            "values": [m.get("r2_score", 0) for m in models],
        }

        # Stacked bar not applicable for regression
        chart_data["stacked_bar"] = None

    return chart_data


def generate_results_table(
    models: list[dict],
    task_type: str,
) -> list[dict]:
    """Generate formatted results table for frontend.

    Args:
        models: List of model result dicts.
        task_type: "classification" or "regression".

    Returns:
        list of formatted table rows.
    """
    table = []

    for m in models:
        model_name = m.get("model", m.get("name", "Unknown"))
        training_time = m.get("training_time_ms", 0)

        # Format training time
        if training_time >= 1000:
            time_str = f"{training_time / 1000:.2f}s"
        else:
            time_str = f"{training_time}ms"

        if task_type == "classification":
            row = {
                "model": model_name,
                "accuracy": f"{m.get('accuracy', 0):.4f}",
                "precision": f"{m.get('precision', 0):.4f}",
                "recall": f"{m.get('recall', 0):.4f}",
                "f1": f"{m.get('f1_score', 0):.4f}",
                "roc_auc": f"{m.get('roc_auc', 0):.4f}" if m.get('roc_auc') else "N/A",
                "training_time": time_str,
            }
        else:  # regression
            row = {
                "model": model_name,
                "rmse": f"{m.get('rmse', 0):.4f}",
                "mse": f"{m.get('mse', 0):.4f}",
                "r2": f"{m.get('r2_score', 0):.4f}",
                "mae": f"{m.get('mae', 0):.4f}",
                "training_time": time_str,
            }

        table.append(row)

    return table
