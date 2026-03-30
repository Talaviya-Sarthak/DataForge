"""Model exporter — persists trained scikit-learn estimators to disk.

All models are saved under ``MLService/app/artifacts/models/`` using the
naming convention ``{pipeline_id}_{model_name}.pkl``.
"""

import os
import joblib
from pathlib import Path


# Resolve artifacts directory relative to *this* file so it works
# regardless of the current working directory.
_ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts" / "models"


def export_model(model, pipeline_id: str, model_name: str) -> str:
    """Save a trained model to disk using joblib.

    Args:
        model: A fitted scikit-learn estimator.
        pipeline_id: The owning pipeline identifier.
        model_name: Human-readable model name (e.g. ``"RandomForestClassifier"``).

    Returns:
        str: Relative path to the saved ``.pkl`` file
             (relative to the ``artifacts/`` directory).
    """
    _ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    # Normalise name: "RandomForestClassifier" → "random_forest_classifier"
    safe_name = _to_snake_case(model_name)
    filename = f"{pipeline_id}_{safe_name}.pkl"
    filepath = _ARTIFACTS_DIR / filename

    joblib.dump(model, filepath)

    # Return the absolute path so Node can locate the file directly
    return str(filepath.resolve())


def _to_snake_case(name: str) -> str:
    """Convert a PascalCase name to snake_case."""
    result: list[str] = []
    for char in name:
        if char.isupper() and result:
            result.append("_")
        result.append(char.lower())
    return "".join(result)
