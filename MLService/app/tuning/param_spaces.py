"""Hyperparameter search spaces for RandomizedSearchCV.

Each key maps a model name (matching the ``name`` field from the model
registry) to a dictionary of parameter distributions.  Only the most
impactful hyperparameters are included to keep tuning fast.

If a model name is not present here, it will be silently skipped during
tuning and the base model will be kept as-is.
"""

import numpy as np

PARAM_SPACES: dict[str, dict] = {

    # ── Classification ─────────────────────────────────────────

    "LogisticRegression": {
        "C": [0.01, 0.1, 1, 10, 100],
        "solver": ["lbfgs", "liblinear", "saga"],
        "penalty": ["l2"],
    },

    "RandomForestClassifier": {
        "n_estimators": [50, 100, 200, 300],
        "max_depth": [None, 5, 10, 20, 30],
        "min_samples_split": [2, 5, 10],
        "min_samples_leaf": [1, 2, 4],
    },

    "DecisionTreeClassifier": {
        "max_depth": [None, 5, 10, 20, 30],
        "min_samples_split": [2, 5, 10, 20],
        "min_samples_leaf": [1, 2, 4, 8],
        "criterion": ["gini", "entropy"],
    },

    "KNeighborsClassifier": {
        "n_neighbors": [3, 5, 7, 9, 11, 15],
        "weights": ["uniform", "distance"],
        "metric": ["euclidean", "manhattan", "minkowski"],
    },

    "SVC": {
        "C": [0.1, 1, 10, 100],
        "kernel": ["rbf", "poly", "sigmoid"],
        "gamma": ["scale", "auto"],
    },

    "GradientBoostingClassifier": {
        "n_estimators": [50, 100, 200, 300],
        "learning_rate": [0.01, 0.05, 0.1, 0.2],
        "max_depth": [3, 5, 7, 10],
        "min_samples_split": [2, 5, 10],
    },

    "ExtraTreesClassifier": {
        "n_estimators": [50, 100, 200, 300],
        "max_depth": [None, 5, 10, 20],
        "min_samples_split": [2, 5, 10],
        "min_samples_leaf": [1, 2, 4],
    },

    "AdaBoostClassifier": {
        "n_estimators": [50, 100, 200, 300],
        "learning_rate": [0.01, 0.05, 0.1, 0.5, 1.0],
    },

    "MLPClassifier": {
        "hidden_layer_sizes": [(50,), (100,), (100, 50), (128, 64)],
        "learning_rate_init": [0.001, 0.01, 0.1],
        "alpha": [0.0001, 0.001, 0.01],
    },

    "SGDClassifier": {
        "alpha": [0.0001, 0.001, 0.01, 0.1],
        "loss": ["hinge", "modified_huber", "log_loss"],
        "penalty": ["l2", "l1", "elasticnet"],
    },

    "GaussianNB": {
        "var_smoothing": np.logspace(-12, -6, 7).tolist(),
    },

    # ── Regression ─────────────────────────────────────────────

    "RandomForestRegressor": {
        "n_estimators": [50, 100, 200, 300],
        "max_depth": [None, 5, 10, 20, 30],
        "min_samples_split": [2, 5, 10],
        "min_samples_leaf": [1, 2, 4],
    },

    "GradientBoostingRegressor": {
        "n_estimators": [50, 100, 200, 300],
        "learning_rate": [0.01, 0.05, 0.1, 0.2],
        "max_depth": [3, 5, 7, 10],
        "min_samples_split": [2, 5, 10],
    },

    "DecisionTreeRegressor": {
        "max_depth": [None, 5, 10, 20, 30],
        "min_samples_split": [2, 5, 10, 20],
        "min_samples_leaf": [1, 2, 4, 8],
    },

    "KNeighborsRegressor": {
        "n_neighbors": [3, 5, 7, 9, 11, 15],
        "weights": ["uniform", "distance"],
        "metric": ["euclidean", "manhattan", "minkowski"],
    },

    "SVR": {
        "C": [0.1, 1, 10, 100],
        "kernel": ["rbf", "poly", "sigmoid"],
        "gamma": ["scale", "auto"],
        "epsilon": [0.01, 0.1, 0.2, 0.5],
    },

    "ExtraTreesRegressor": {
        "n_estimators": [50, 100, 200, 300],
        "max_depth": [None, 5, 10, 20],
        "min_samples_split": [2, 5, 10],
        "min_samples_leaf": [1, 2, 4],
    },

    "AdaBoostRegressor": {
        "n_estimators": [50, 100, 200, 300],
        "learning_rate": [0.01, 0.05, 0.1, 0.5, 1.0],
    },

    "Ridge": {
        "alpha": [0.01, 0.1, 1.0, 10.0, 100.0],
    },

    "Lasso": {
        "alpha": [0.001, 0.01, 0.1, 1.0, 10.0],
    },

    "ElasticNet": {
        "alpha": [0.001, 0.01, 0.1, 1.0],
        "l1_ratio": [0.1, 0.3, 0.5, 0.7, 0.9],
    },
}
