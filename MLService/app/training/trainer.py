"""Model trainer — fits models from the registry on a given dataset split."""

<<<<<<< Updated upstream
=======
import logging
import time

>>>>>>> Stashed changes
import pandas as pd

from app.training.evaluator import evaluate_model

logger = logging.getLogger("dataforge.trainer")


def train_models(
    models: list[dict],
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    task_type: str,
) -> list[dict]:
<<<<<<< Updated upstream
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
=======
>>>>>>> Stashed changes
    results: list[dict] = []

    logger.info("[ML] Training started | models=%d | dataset_size=%d", len(models), len(X_train))

    for descriptor in models:
        name = descriptor["name"]
        model = descriptor["instance"]

<<<<<<< Updated upstream
=======
        logger.info("[ML] Training model: %s", name)
        start = time.perf_counter()
>>>>>>> Stashed changes
        model.fit(X_train, y_train)

        metrics = evaluate_model(model, X_test, y_test, task_type)
        logger.info("[ML] Completed: %s | time=%dms", name, training_time_ms)

        results.append({
            "name": name,
            "instance": model,
            "metrics": metrics,
        })

    return results
