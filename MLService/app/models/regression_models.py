"""Regression model definitions for the training system.

Provides factory functions that return fresh, untrained scikit-learn
regression estimators with fixed hyperparameters.
"""

from sklearn.linear_model import (
    LinearRegression,
    Ridge,
    Lasso,
    ElasticNet,
    SGDRegressor,
    BayesianRidge,
    HuberRegressor
)

from sklearn.ensemble import (
    RandomForestRegressor,
    GradientBoostingRegressor,
    AdaBoostRegressor,
    ExtraTreesRegressor
)

from sklearn.neighbors import KNeighborsRegressor
from sklearn.svm import SVR
from sklearn.tree import DecisionTreeRegressor


def get_regression_models() -> list[dict]:
    """Return a list of regression model descriptors.

    Each descriptor contains:
        - name: Human-readable model name.
        - instance: An untrained scikit-learn estimator.

    Returns:
        list[dict]: Regression model descriptors.
    """

    return [

        {
            "name": "LinearRegression",
            "instance": LinearRegression(),
        },

        {
            "name": "Ridge",
            "instance": Ridge(alpha=1.0),
        },

        {
            "name": "Lasso",
            "instance": Lasso(alpha=0.1, max_iter=1000),
        },

        {
            "name": "ElasticNet",
            "instance": ElasticNet(alpha=0.1, l1_ratio=0.5, max_iter=1000),
        },

        {
            "name": "BayesianRidge",
            "instance": BayesianRidge(),
        },

        {
            "name": "HuberRegressor",
            "instance": HuberRegressor(max_iter=100),
        },

        {
            "name": "SGDRegressor",
            "instance": SGDRegressor(max_iter=1000, tol=1e-3),
        },

        {
            "name": "DecisionTreeRegressor",
            "instance": DecisionTreeRegressor(max_depth=10, random_state=42),
        },

        {
            "name": "RandomForestRegressor",
            "instance": RandomForestRegressor(n_estimators=50, max_depth=10, n_jobs=-1, random_state=42),
        },

        {
            "name": "ExtraTreesRegressor",
            "instance": ExtraTreesRegressor(n_estimators=50, max_depth=10, n_jobs=-1, random_state=42),
        },

        {
            "name": "GradientBoostingRegressor",
            "instance": GradientBoostingRegressor(n_estimators=50, max_depth=6, learning_rate=0.1, random_state=42),
        },

        {
            "name": "AdaBoostRegressor",
            "instance": AdaBoostRegressor(n_estimators=50, learning_rate=1.0, random_state=42),
        },

        {
            "name": "KNeighborsRegressor",
            "instance": KNeighborsRegressor(n_neighbors=5, n_jobs=-1),
        },

        {
            "name": "SVR",
            "instance": SVR(kernel="linear", C=1.0, max_iter=1000),
        },

    ]
