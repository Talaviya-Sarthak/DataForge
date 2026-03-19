"""
Handles the training loop: iterates over registered models, fits each one,
evaluates it, and collects results.
"""

import logging

import numpy as np
from sklearn.base import BaseEstimator

from app.training.model_registry import get_models_for_task
from app.training.evaluator import evaluate_model
from app.training.exporter import save_model

logger = logging.getLogger(__name__)


def train_all_models(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    task_type: str,
    dataset_id: int | str,
) -> list[dict]:
    """
    Train every registered model for the given task type and return results.

    Each model is:
    1. Fitted on (X_train, y_train).
    2. Evaluated on (X_test, y_test).
    3. Saved to disk as a .pkl artifact.

    Args:
        X_train:    Training feature matrix.
        y_train:    Training target array.
        X_test:     Test feature matrix.
        y_test:     Test target array.
        task_type:  "classification" or "regression".
        dataset_id: Identifier for the dataset (used in artifact filenames).

    Returns:
        list[dict]: One entry per model with keys:
            - model (str): Model class name.
            - model_path (str): Path to saved .pkl file.
            - <metric_name> (float): One key per computed metric.
    """
    models = get_models_for_task(task_type)
    results: list[dict] = []

    for model_name, model in models.items():
        logger.info("Training %s ...", model_name)
        try:
            model.fit(X_train, y_train)

            metrics = evaluate_model(model, X_test, y_test, task_type)
            model_path = save_model(model, dataset_id, model_name)

            entry = {
                "model": model_name,
                **metrics,
                "model_path": model_path,
            }
            results.append(entry)
            logger.info("  %s -> %s", model_name, metrics)

        except Exception as exc:
            logger.error("Failed to train %s: %s", model_name, exc)
            results.append(
                {
                    "model": model_name,
                    "error": str(exc),
                }
            )
"""Model trainer — fits models from the registry on a given dataset split.

Iterates over the model descriptors supplied by the registry, fits each
one on the training data, and returns the trained model alongside its
evaluation metrics.
"""

import time

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
        list[dict]: Each dict has ``name``, ``instance`` (fitted),
        ``metrics``, and ``training_time_ms``.
    """
    results: list[dict] = []

    for descriptor in models:
        name = descriptor["name"]
        model = descriptor["instance"]

        start = time.perf_counter()
        model.fit(X_train, y_train)
        training_time_ms = int((time.perf_counter() - start) * 1000)

        metrics = evaluate_model(model, X_test, y_test, task_type)

        results.append({
            "name": name,
            "instance": model,
            "metrics": metrics,
            "training_time_ms": training_time_ms,
        })

    return results
