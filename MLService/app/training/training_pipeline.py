"""Training pipeline orchestrator.

Coordinates the full training workflow:
    1. Retrieve the finalized DataFrame by pipeline_id.
    2. Separate features and target.
    3. Split into train / test sets.
    4. Train all models for the chosen task type.
    5. Export trained models to disk.
    6. Build and return a sorted leaderboard JSON.
"""

import pandas as pd
from sklearn.model_selection import train_test_split

from app.training.model_registry import get_models_for_task
from app.training.trainer import train_models
from app.training.exporter import export_model


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
        dict: Leaderboard JSON with pipeline metadata and per-model metrics.

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
    models = get_models_for_task(task_type)
    results = train_models(models, X_train, y_train, X_test, y_test, task_type)

    # ── 5. Export models and build leaderboard entries ────────
    leaderboard: list[dict] = []
    for result in results:
        model_path = export_model(result["instance"], pipeline_id, result["name"])

        entry = {"model": result["name"], **result["metrics"], "model_path": model_path}
        leaderboard.append(entry)

    # ── 6. Sort by primary metric (descending) ────────────────
    primary = _PRIMARY_METRIC[task_type]
    leaderboard.sort(key=lambda m: m.get(primary, 0), reverse=True)

    return {
        "pipeline_id": pipeline_id,
        "task_type": task_type,
        "target_column": target_column,
        "models": leaderboard,
    }
