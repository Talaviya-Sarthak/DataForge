"""
Classification Models
=====================

Defines all classification model instances used by the training pipeline.
Each model is returned with default hyperparameters suitable for baseline training.
"""

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neighbors import KNeighborsClassifier


def get_classification_models() -> dict:
    """
    Return a dictionary of classification model name -> untrained model instance.

    Returns:
        dict: Mapping of model display names to scikit-learn estimator instances.
    """
    return {
        "LogisticRegression": LogisticRegression(
            max_iter=1000,
            random_state=42,
        ),
        "RandomForestClassifier": RandomForestClassifier(
            n_estimators=100,
            random_state=42,
        ),
        "GradientBoostingClassifier": GradientBoostingClassifier(
            n_estimators=100,
            random_state=42,
        ),
        "KNeighborsClassifier": KNeighborsClassifier(),
    }
