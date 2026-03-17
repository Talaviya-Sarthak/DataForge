"""Hyperparameter tuning engine using RandomizedSearchCV.

Provides ``tune_model`` for tuning a single model and ``tune_top_models``
for selecting and tuning the top-N models from a training run.
"""

import logging
import time
from copy import deepcopy

import pandas as pd
from sklearn.model_selection import RandomizedSearchCV

from app.tuning.param_spaces import PARAM_SPACES

logger = logging.getLogger("dataforge.tuning")


def tune_model(
    model_name: str,
    model,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    scoring: str | None = None,
) -> dict:
    """Run RandomizedSearchCV on a single model.

    Args:
        model_name: Name matching a key in ``PARAM_SPACES``.
        model: A fitted or unfitted scikit-learn estimator.
        X_train: Training feature matrix.
        y_train: Training target vector.
        scoring: Sklearn-compatible scoring string.  Defaults to ``None``
                 (uses the estimator's default scorer).

    Returns:
        dict with keys ``best_model``, ``best_params``, ``best_score``.
        On failure the original *model* is returned unchanged.
    """
    param_space = PARAM_SPACES.get(model_name)

    if param_space is None:
        logger.info(
            "No param space defined for '%s' — skipping tuning", model_name
        )
        return {
            "best_model": model,
            "best_params": {},
            "best_score": None,
            "tuned": False,
            "tuning_time_ms": None,
            "tuning_iterations": None,
        }

    try:
        # Create a fresh (unfitted) clone so RandomizedSearchCV starts clean
        fresh_model = deepcopy(model)

        # Cap n_iter to the actual number of combinations if small
        n_combinations = 1
        for values in param_space.values():
            n_combinations *= len(values) if hasattr(values, "__len__") else 10
        n_iter = min(10, n_combinations)

        search = RandomizedSearchCV(
            estimator=fresh_model,
            param_distributions=param_space,
            n_iter=n_iter,
            cv=3,
            n_jobs=-1,
            scoring=scoring,
            random_state=42,
            error_score="raise",
        )

        start = time.perf_counter()
        search.fit(X_train, y_train)
        tuning_time_ms = int((time.perf_counter() - start) * 1000)

        logger.info(
            "Tuning complete for '%s' — best score: %.4f, params: %s",
            model_name,
            search.best_score_,
            search.best_params_,
        )

        return {
            "best_model": search.best_estimator_,
            "best_params": search.best_params_,
            "best_score": round(float(search.best_score_), 4),
            "tuned": True,
            "tuning_time_ms": tuning_time_ms,
            "tuning_iterations": n_iter,
        }

    except Exception as exc:
        logger.warning(
            "Tuning failed for '%s': %s — returning original model",
            model_name,
            exc,
        )
        return {
            "best_model": model,
            "best_params": {},
            "best_score": None,
            "tuned": False,
            "tuning_time_ms": None,
            "tuning_iterations": None,
        }


def tune_top_models(
    results: list[dict],
    X_train: pd.DataFrame,
    y_train: pd.Series,
    task_type: str,
    top_n: int = 2,
) -> list[dict]:
    """Select the top-N models by primary metric and tune them.

    Args:
        results: Output of ``train_models`` — list of
                 ``{"name", "instance", "metrics"}`` dicts.
        X_train: Training feature matrix.
        y_train: Training target vector.
        task_type: ``"classification"`` or ``"regression"``.
        top_n: How many top models to tune (default 2).

    Returns:
        list[dict]: One entry per tuned model with keys
        ``model_name``, ``best_model``, ``best_params``,
        ``best_score``, ``tuned``.
    """
    primary_metric = "accuracy" if task_type == "classification" else "r2_score"
    scoring = "accuracy" if task_type == "classification" else "r2"

    # Sort by primary metric descending
    sorted_results = sorted(
        results,
        key=lambda r: r["metrics"].get(primary_metric, 0),
        reverse=True,
    )

    top_models = sorted_results[:top_n]

    logger.info(
        "Top %d models selected for tuning: %s",
        len(top_models),
        [m["name"] for m in top_models],
    )

    tuned_results = []
    for entry in top_models:
        logger.info("Hyperparameter tuning started for '%s'", entry["name"])

        tune_result = tune_model(
            model_name=entry["name"],
            model=entry["instance"],
            X_train=X_train,
            y_train=y_train,
            scoring=scoring,
        )

        tuned_results.append({
            "model_name": entry["name"],
            **tune_result,
        })

    return tuned_results
