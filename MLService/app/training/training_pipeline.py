"""Training pipeline orchestrator.

Coordinates the full training workflow:
    1. Retrieve the finalized DataFrame by pipeline_id.
    2. Separate features and target.
    3. Split into train / test sets.
    4. Train all models for the chosen task type.
    5. Export trained models to disk.
    6. Build and return a sorted leaderboard JSON.
"""

import logging

import pandas as pd
from sklearn.model_selection import train_test_split

from app.training.model_registry import get_models_for_task
from app.training.trainer import train_models
from app.training.exporter import export_model

logger = logging.getLogger("dataforge.training")

# ── Primary metric used for leaderboard sorting ──────────────
_PRIMARY_METRIC: dict[str, str] = {
    "classification": "accuracy",
    "regression": "r2_score",
}


def run_training_pipeline(
    df: pd.DataFrame,
    pipeline_id: str,
    task_type: str,
    target_column: str,
) -> dict:
    """Execute the full training pipeline for a single preprocessing pipeline.

    Args:
        df: The finalized DataFrame (already preprocessed).
        pipeline_id: Unique pipeline identifier.
        task_type: ``"classification"`` or ``"regression"``.
        target_column: Name of the target column in *df*.

    Returns:
        dict: JSON with base_models and best_model.

    Raises:
        ValueError: If *target_column* is not present in *df*, or
                     *task_type* is unsupported.
    """
    # ── 1. Validate inputs ────────────────────────────────────
    if target_column not in df.columns:
        raise ValueError(
            f"Target column '{target_column}' not found in dataset. "
            f"Available columns: {list(df.columns)}"
        )

    if task_type not in _PRIMARY_METRIC:
        raise ValueError(
            f"Unsupported task type '{task_type}'. "
            f"Use 'classification' or 'regression'."
        )

    primary = _PRIMARY_METRIC[task_type]

    # ── 2. Separate features and target ───────────────────────
    X = df.drop(columns=[target_column])
    y = df[target_column]

    # ── 3. Train / test split ─────────────────────────────────
    split_kwargs: dict = {
        "test_size": 0.2,
        "random_state": 42,
    }
    if task_type == "classification":
        split_kwargs["stratify"] = y

    X_train, X_test, y_train, y_test = train_test_split(X, y, **split_kwargs)

    # ── 4. Fetch models and train ─────────────────────────────
    logger.info("[INFO] Training started for pipeline '%s' (%s)", pipeline_id, task_type)

    models = get_models_for_task(task_type)
    results = train_models(models, X_train, y_train, X_test, y_test, task_type)

    logger.info("[INFO] Models evaluated — %d models trained", len(results))

    # ── 5. Export models and build leaderboard ────────────────
    base_models: list[dict] = []
    for result in results:
        model_path = export_model(result["instance"], pipeline_id, result["name"])
        entry = {
            "model": result["name"],
            **result["metrics"],
            "model_path": model_path,
            "training_time_ms": result.get("training_time_ms"),
        }
        base_models.append(entry)

    base_models.sort(key=lambda m: m.get(primary, 0), reverse=True)

    # ── 6. Determine best model ───────────────────────────────
    best_model = base_models[0] if base_models else None

    return {
        "pipeline_id": pipeline_id,
        "task_type": task_type,
        "target_column": target_column,
        "models": base_models,
        "base_models": base_models,
        "best_model": best_model,
    }
