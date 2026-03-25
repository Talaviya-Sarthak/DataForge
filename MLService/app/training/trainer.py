"""Model trainer — fits models from the registry on a given dataset split."""

import logging
import time

import pandas as pd

from app.training.evaluator import evaluate_model
from app.training.exporter import export_model as save_model

logger = logging.getLogger("dataforge.trainer")


def train_models(
    models: list[dict],
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    task_type: str,
) -> list[dict]:
    results: list[dict] = []

    logger.info("[ML] Training started | models=%d | dataset_size=%d", len(models), len(X_train))

    for descriptor in models:
        name = descriptor["name"]
        model = descriptor["instance"]

        logger.info("[ML] Training model: %s", name)
        start = time.perf_counter()
        model.fit(X_train, y_train)
        training_time_ms = int((time.perf_counter() - start) * 1000)

        metrics = evaluate_model(model, X_test, y_test, task_type)
        logger.info("[ML] Completed: %s | time=%dms", name, training_time_ms)

        results.append({
            "name": name,
            "instance": model,
            "metrics": metrics,
            "training_time_ms": training_time_ms,
        })

    return results
