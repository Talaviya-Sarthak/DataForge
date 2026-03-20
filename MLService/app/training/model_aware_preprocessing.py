"""Model-aware preprocessing for ML training.

Implements per-model preprocessing pipelines that apply scaling
only to models that require it (linear models, SVM, KNN).

CRITICAL RULE: Tree-based models (RandomForest, GradientBoosting, etc.)
do NOT need scaling and should receive unscaled data.
"""

import pandas as pd
import numpy as np
from copy import deepcopy
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from sklearn.impute import SimpleImputer


# Models that REQUIRE scaling for optimal performance
SCALING_REQUIRED_MODELS = frozenset({
    # Classification
    "LogisticRegression",
    "RidgeClassifier",
    "SGDClassifier",
    "PassiveAggressiveClassifier",
    "KNeighborsClassifier",
    "SVC",
    "LinearSVC",
    "MLPClassifier",
    # Regression
    "LinearRegression",
    "Ridge",
    "Lasso",
    "ElasticNet",
    "BayesianRidge",
    "HuberRegressor",
    "SGDRegressor",
    "KNeighborsRegressor",
    "SVR",
})

# Models that do NOT need scaling (tree-based, boosting)
NO_SCALING_MODELS = frozenset({
    # Classification
    "DecisionTreeClassifier",
    "RandomForestClassifier",
    "ExtraTreesClassifier",
    "GradientBoostingClassifier",
    "AdaBoostClassifier",
    "GaussianNB",
    "XGBClassifier",
    # Regression
    "DecisionTreeRegressor",
    "RandomForestRegressor",
    "ExtraTreesRegressor",
    "GradientBoostingRegressor",
    "AdaBoostRegressor",
    "XGBRegressor",
})


def model_requires_scaling(model_name: str) -> bool:
    """Check if a model requires scaled features."""
    return model_name in SCALING_REQUIRED_MODELS


class RuntimePreprocessor:
    """Applies preprocessing transformations at training time.

    Supports:
        - Missing value imputation (mean, median, mode, drop)
        - Categorical encoding (label, one-hot)
        - Scaling (standard, minmax) - applied per-model
    """

    def __init__(self, config: dict):
        """
        Args:
            config: Preprocessing configuration dict with keys:
                - missing_values: "mean" | "median" | "mode" | "drop"
                - encoding: "label" | "one-hot"
                - scaling: "standard" | "minmax" | None
        """
        self.config = config
        self.missing_strategy = config.get("missing_values", "median")
        self.encoding_strategy = config.get("encoding", "label")
        self.scaling_strategy = config.get("scaling", "standard")

        # Fitted transformers (populated during fit)
        self._numeric_imputer = None
        self._categorical_imputer = None
        self._label_encoders: dict[str, LabelEncoder] = {}
        self._scaler = None
        self._numeric_cols: list[str] = []
        self._categorical_cols: list[str] = []
        self._onehot_cols: list[str] = []
        self._fitted = False

    def fit(self, df: pd.DataFrame, target_column: str) -> "RuntimePreprocessor":
        """Fit transformers on the dataset (excluding target column).

        Args:
            df: Input DataFrame.
            target_column: Target column to exclude from preprocessing.

        Returns:
            self
        """
        # Separate features from target
        feature_cols = [c for c in df.columns if c != target_column]
        X = df[feature_cols].copy()

        # Identify column types
        self._numeric_cols = X.select_dtypes(include=["number"]).columns.tolist()
        self._categorical_cols = X.select_dtypes(
            include=["object", "category", "bool"]
        ).columns.tolist()

        # Fit numeric imputer
        if self._numeric_cols and self.missing_strategy != "drop":
            strategy = self.missing_strategy if self.missing_strategy != "mode" else "most_frequent"
            if self.missing_strategy == "mode":
                strategy = "most_frequent"
            self._numeric_imputer = SimpleImputer(strategy=strategy)
            self._numeric_imputer.fit(X[self._numeric_cols])

        # Fit categorical imputer (always mode)
        if self._categorical_cols:
            self._categorical_imputer = SimpleImputer(
                strategy="most_frequent", fill_value="missing"
            )
            # Convert to string for imputation
            cat_data = X[self._categorical_cols].astype(str)
            self._categorical_imputer.fit(cat_data)

        # Fit label encoders for categorical columns
        if self.encoding_strategy == "label" and self._categorical_cols:
            for col in self._categorical_cols:
                le = LabelEncoder()
                # Include 'missing' to handle NaN values
                values = X[col].fillna("__missing__").astype(str).unique().tolist()
                le.fit(values + ["__missing__"])
                self._label_encoders[col] = le

        # Fit scaler if needed
        if self.scaling_strategy and self._numeric_cols:
            if self.scaling_strategy == "standard":
                self._scaler = StandardScaler()
            elif self.scaling_strategy == "minmax":
                self._scaler = MinMaxScaler()

            # Fit on imputed numeric data
            imputed_numeric = self._numeric_imputer.transform(X[self._numeric_cols])
            self._scaler.fit(imputed_numeric)

        self._fitted = True
        return self

    def transform(
        self,
        df: pd.DataFrame,
        target_column: str,
        apply_scaling: bool = True,
    ) -> pd.DataFrame:
        """Transform the dataset using fitted transformers.

        Args:
            df: Input DataFrame.
            target_column: Target column to preserve unchanged.
            apply_scaling: Whether to apply scaling (model-aware).

        Returns:
            Transformed DataFrame.
        """
        if not self._fitted:
            raise ValueError("Preprocessor must be fitted before transforming.")

        df = df.copy()
        feature_cols = [c for c in df.columns if c != target_column]

        # Handle missing values
        if self.missing_strategy == "drop":
            df = df.dropna(subset=feature_cols).reset_index(drop=True)
        else:
            # Impute numeric columns
            if self._numeric_cols and self._numeric_imputer:
                existing_numeric = [c for c in self._numeric_cols if c in df.columns]
                if existing_numeric:
                    df[existing_numeric] = self._numeric_imputer.transform(
                        df[existing_numeric]
                    )

            # Impute categorical columns
            if self._categorical_cols and self._categorical_imputer:
                existing_cat = [c for c in self._categorical_cols if c in df.columns]
                if existing_cat:
                    cat_data = df[existing_cat].astype(str)
                    df[existing_cat] = self._categorical_imputer.transform(cat_data)

        # Encode categorical columns
        if self.encoding_strategy == "label":
            for col, le in self._label_encoders.items():
                if col in df.columns:
                    df[col] = df[col].fillna("__missing__").astype(str)
                    # Handle unseen labels
                    df[col] = df[col].apply(
                        lambda x: x if x in le.classes_ else "__missing__"
                    )
                    df[col] = le.transform(df[col])

        elif self.encoding_strategy == "one-hot":
            existing_cat = [c for c in self._categorical_cols if c in df.columns]
            if existing_cat:
                df = pd.get_dummies(df, columns=existing_cat, drop_first=True)

        # Apply scaling (model-aware)
        if apply_scaling and self._scaler and self._numeric_cols:
            existing_numeric = [c for c in self._numeric_cols if c in df.columns]
            if existing_numeric:
                df[existing_numeric] = self._scaler.transform(df[existing_numeric])

        return df

    def fit_transform(
        self,
        df: pd.DataFrame,
        target_column: str,
        apply_scaling: bool = True,
    ) -> pd.DataFrame:
        """Fit and transform in one step."""
        self.fit(df, target_column)
        return self.transform(df, target_column, apply_scaling)


def prepare_data_for_model(
    df: pd.DataFrame,
    target_column: str,
    model_name: str,
    preprocessor: RuntimePreprocessor,
) -> tuple[pd.DataFrame, pd.Series]:
    """Prepare dataset for a specific model with model-aware scaling.

    Args:
        df: Input DataFrame.
        target_column: Target column name.
        model_name: Name of the model to prepare data for.
        preprocessor: Fitted RuntimePreprocessor instance.

    Returns:
        Tuple of (X, y) ready for training.
    """
    apply_scaling = model_requires_scaling(model_name)

    transformed = preprocessor.transform(
        df, target_column, apply_scaling=apply_scaling
    )

    X = transformed.drop(columns=[target_column])
    y = transformed[target_column]

    return X, y


def apply_runtime_preprocessing(
    df: pd.DataFrame,
    target_column: str,
    config: dict,
) -> tuple[pd.DataFrame, RuntimePreprocessor]:
    """Apply runtime preprocessing and return fitted preprocessor.

    Args:
        df: Input DataFrame.
        target_column: Target column name.
        config: Preprocessing configuration.

    Returns:
        Tuple of (base_transformed_df, preprocessor).
        Note: base_transformed_df is WITHOUT scaling (for tree models).
    """
    preprocessor = RuntimePreprocessor(config)
    preprocessor.fit(df, target_column)

    # Transform without scaling (base data)
    base_df = preprocessor.transform(df, target_column, apply_scaling=False)

    return base_df, preprocessor
