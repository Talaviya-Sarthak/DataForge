"""Classification model definitions for the training system.

Provides factory functions that return fresh, untrained scikit-learn
classification estimators with fixed hyperparameters.
"""

from sklearn.linear_model import (
    LogisticRegression,
    SGDClassifier,
    RidgeClassifier,
    PassiveAggressiveClassifier
)

from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    AdaBoostClassifier,
    ExtraTreesClassifier
)

from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC, LinearSVC
from sklearn.naive_bayes import GaussianNB
from sklearn.neural_network import MLPClassifier


def get_classification_models() -> list[dict]:
    """Return a list of classification model descriptors.

    Each descriptor contains:
        - name: Human-readable model name.
        - instance: An untrained scikit-learn estimator.

    Returns:
        list[dict]: Classification model descriptors.
    """

    return [

        {
            "name": "LogisticRegression",
            "instance": LogisticRegression(max_iter=1000, random_state=42),
        },

        {
            "name": "RidgeClassifier",
            "instance": RidgeClassifier(),
        },

        {
            "name": "SGDClassifier",
            "instance": SGDClassifier(max_iter=1000, tol=1e-3, random_state=42),
        },

        {
            "name": "PassiveAggressiveClassifier",
            "instance": PassiveAggressiveClassifier(max_iter=1000, random_state=42),
        },

        {
            "name": "DecisionTreeClassifier",
            "instance": DecisionTreeClassifier(random_state=42),
        },

        {
            "name": "RandomForestClassifier",
            "instance": RandomForestClassifier(n_estimators=100, random_state=42),
        },

        {
            "name": "ExtraTreesClassifier",
            "instance": ExtraTreesClassifier(n_estimators=100, random_state=42),
        },

        {
            "name": "GradientBoostingClassifier",
            "instance": GradientBoostingClassifier(n_estimators=100, random_state=42),
        },

        {
            "name": "AdaBoostClassifier",
            "instance": AdaBoostClassifier(n_estimators=100, random_state=42),
        },

        {
            "name": "KNeighborsClassifier",
            "instance": KNeighborsClassifier(),
        },

        {
            "name": "SVC",
            "instance": SVC(kernel="rbf", probability=True),
        },

        {
            "name": "LinearSVC",
            "instance": LinearSVC(),
        },

        {
            "name": "GaussianNB",
            "instance": GaussianNB(),
        },

        {
            "name": "MLPClassifier",
            "instance": MLPClassifier(max_iter=500, random_state=42),
        },

    ]
