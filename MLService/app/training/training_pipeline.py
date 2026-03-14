"""
Training Pipeline
=================

Top-level orchestrator for the full ML training workflow:

    DataFrame -> split -> train all models -> evaluate -> export -> leaderboard JSON

This is the single entry point called by the API layer.
"""

import logging

import pandas as pd
from sklearn.model_selection import train_test_split

from app.training.trainer import train_all_models

logger = logging.getLogger(__name__)

# ── defaults ────────────────────────────────────────────────────────────────
_TEST_SIZE = 0.2
_RANDOM_STATE = 42


def run_training(
    df: pd.DataFrame,
    target_column: str,
    task_type: str,
    dataset_id: int | str,
    test_size: float = _TEST_SIZE,
    random_state: int = _RANDOM_STATE,
) -> dict:
    """
    Execute the full training pipeline on a finalized DataFrame.

    Steps:
        1. Separate features / target.
        2. Split into train / test sets.
        3. Train all registered models for the given task type.
        4. Build and return the leaderboard JSON.

    Args:
        df:            Finalized pandas DataFrame (post-preprocessing).
        target_column: Name of the target column.
        task_type:     "classification" or "regression".
        dataset_id:    Unique identifier for the dataset (used in filenames).
        test_size:     Fraction of data reserved for testing (default 0.2).
        random_state:  Seed for reproducibility (default 42).

    Returns:
        dict matching the leaderboard schema:
        {
            "task_type": str,
            "target_column": str,
            "models": [ { "model": ..., <metrics>, "model_path": ... }, ... ]
        }

    Raises:
        ValueError: If target_column is missing or task_type is invalid.
    """
    # ── validate inputs ─────────────────────────────────────────────────────
    if target_column not in df.columns:
        raise ValueError(
            f"Target column '{target_column}' not found in DataFrame. "
            f"Available columns: {list(df.columns)}"
        )

    if task_type not in ("classification", "regression"):
        raise ValueError(
            f"Invalid task_type '{task_type}'. Must be 'classification' or 'regression'."
        )

    # ── separate features and target ────────────────────────────────────────
    X = df.drop(columns=[target_column])
    y = df[target_column]

    logger.info(
        "Starting training — task=%s, target=%s, rows=%d, features=%d",
        task_type,
        target_column,
        len(df),
        X.shape[1],
    )

    # ── train / test split ──────────────────────────────────────────────────
    split_kwargs = dict(
        test_size=test_size,
        random_state=random_state,
    )
    if task_type == "classification":
        split_kwargs["stratify"] = y

    X_train, X_test, y_train, y_test = train_test_split(X, y, **split_kwargs)

    logger.info("Split — train=%d, test=%d", len(X_train), len(X_test))

    # ── train models ────────────────────────────────────────────────────────
    model_results = train_all_models(
        X_train,
        y_train,
        X_test,
        y_test,
        task_type=task_type,
        dataset_id=dataset_id,
    )

    # ── build leaderboard (sort by primary metric, descending) ──────────────
    primary_metric = "accuracy" if task_type == "classification" else "r2_score"
    successful = [r for r in model_results if "error" not in r]
    failed = [r for r in model_results if "error" in r]

    successful.sort(key=lambda r: r.get(primary_metric, 0), reverse=True)

    leaderboard = {
        "task_type": task_type,
        "target_column": target_column,
        "models": successful + failed,
    }

    logger.info(
        "Training complete — %d models succeeded, %d failed",
        len(successful),
        len(failed),
    )

    return leaderboard
