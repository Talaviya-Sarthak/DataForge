"""
Model Exporter
==============

Handles saving trained model artifacts to disk using joblib.
"""

import os
from pathlib import Path

import joblib

# Base directory for all model artifacts
_ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts" / "models"


def _sanitize_model_name(model_name: str) -> str:
    """Convert model class name to a filesystem-safe snake_case string."""
    sanitized = ""
    for i, ch in enumerate(model_name):
        if ch.isupper() and i > 0:
            sanitized += "_"
        sanitized += ch.lower()
    return sanitized


def save_model(model, dataset_id: int | str, model_name: str) -> str:
    """
    Save a trained model to disk as a .pkl file.

    Args:
        model:      Trained scikit-learn estimator.
        dataset_id: Identifier for the dataset (used in filename).
        model_name: Display name of the model (e.g. "RandomForestClassifier").

    Returns:
        str: Relative path to the saved model file
             (e.g. "artifacts/models/123_random_forest_classifier.pkl").
    """
    _ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    safe_name = _sanitize_model_name(model_name)
    filename = f"{dataset_id}_{safe_name}.pkl"
    filepath = _ARTIFACTS_DIR / filename

    joblib.dump(model, filepath)

    # Return a portable relative path from MLService/app/
    return f"artifacts/models/{filename}"


def load_model(model_path: str):
    """
    Load a previously saved model from disk.

    Args:
        model_path: Relative path as returned by save_model().

    Returns:
        The deserialized scikit-learn estimator.

    Raises:
        FileNotFoundError: If the model file does not exist.
    """
    base = Path(__file__).resolve().parent.parent
    filepath = base / model_path
    if not filepath.exists():
        raise FileNotFoundError(f"Model not found at {filepath}")
    return joblib.load(filepath)
