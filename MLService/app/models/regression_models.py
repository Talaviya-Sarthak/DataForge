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
            "instance": Lasso(alpha=0.1),
        },

        {
            "name": "ElasticNet",
            "instance": ElasticNet(alpha=0.1, l1_ratio=0.5),
        },

        {
            "name": "BayesianRidge",
            "instance": BayesianRidge(),
        },

        {
            "name": "HuberRegressor",
            "instance": HuberRegressor(),
        },

        {
            "name": "SGDRegressor",
            "instance": SGDRegressor(max_iter=1000, tol=1e-3),
        },

        {
            "name": "DecisionTreeRegressor",
            "instance": DecisionTreeRegressor(random_state=42),
        },

        {
            "name": "RandomForestRegressor",
            "instance": RandomForestRegressor(n_estimators=100, random_state=42),
        },

        {
            "name": "ExtraTreesRegressor",
            "instance": ExtraTreesRegressor(n_estimators=100, random_state=42),
        },

        {
            "name": "GradientBoostingRegressor",
            "instance": GradientBoostingRegressor(n_estimators=100, random_state=42),
        },

        {
            "name": "AdaBoostRegressor",
            "instance": AdaBoostRegressor(n_estimators=100, random_state=42),
        },

        {
            "name": "KNeighborsRegressor",
            "instance": KNeighborsRegressor(),
        },

        {
            "name": "SVR",
            "instance": SVR(kernel="rbf", C=1.0, epsilon=0.1),
        },

    ]