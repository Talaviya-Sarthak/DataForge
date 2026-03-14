"""
Regression Models
=================

Defines all regression model instances used by the training pipeline.
Each model is returned with default hyperparameters suitable for baseline training.
"""

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.neighbors import KNeighborsRegressor


def get_regression_models() -> dict:
    """
    Return a dictionary of regression model name -> untrained model instance.

    Returns:
        dict: Mapping of model display names to scikit-learn estimator instances.
    """
    return {
        "LinearRegression": LinearRegression(),
        "RandomForestRegressor": RandomForestRegressor(
            n_estimators=100,
            random_state=42,
        ),
        "GradientBoostingRegressor": GradientBoostingRegressor(
            n_estimators=100,
            random_state=42,
        ),
        "KNeighborsRegressor": KNeighborsRegressor(),
    }
