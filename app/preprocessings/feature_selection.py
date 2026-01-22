import pandas as pd
import numpy as np
from sklearn.feature_selection import VarianceThreshold


class FeatureSelection:
    def __init__(self, transformations: list):
        """
        transformations: list of dicts

        Example:
        {
            "operation": "feature_selection",
            "strategy": "auto" | "variance" | "correlation" | "manual",
            "target": "churn",
            "threshold": 0.01,
            "columns": ["id"]
        }
        """
        self.transformations = transformations

    def apply(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        for t in self.transformations:
            strategy = t["strategy"]
            target = t.get("target")

            # AUTO → safe default
            if strategy == "auto":
                df = self._variance_selection(df, target)

            elif strategy == "variance":
                threshold = t.get("threshold", 0.0)
                df = self._variance_selection(df, target, threshold)

            elif strategy == "correlation":
                threshold = t.get("threshold", 0.9)
                df = self._correlation_selection(df, target, threshold)

            elif strategy == "manual":
                columns = t.get("columns", [])
                df = self._manual_drop(df, columns)

            else:
                raise ValueError(f"Unsupported feature selection strategy: {strategy}")

        return df

    # -------------------------------------------------
    # VARIANCE THRESHOLD (AUTO / VARIANCE)
    # -------------------------------------------------

    def _variance_selection(
        self,
        df: pd.DataFrame,
        target: str = None,
        threshold: float = 0.0
    ) -> pd.DataFrame:

        if target and target in df.columns:
            y = df[target]
            X = df.drop(columns=[target])
        else:
            X = df
            y = None

        numeric_cols = X.select_dtypes(include=np.number).columns
        selector = VarianceThreshold(threshold=threshold)

        selected_array = selector.fit_transform(X[numeric_cols])
        selected_cols = numeric_cols[selector.get_support()]

        X_selected = pd.DataFrame(
            selected_array,
            columns=selected_cols,
            index=df.index
        )

        if y is not None:
            X_selected[target] = y.values

        return X_selected

    # -------------------------------------------------
    # CORRELATION-BASED SELECTION
    # -------------------------------------------------

    def _correlation_selection(
        self,
        df: pd.DataFrame,
        target: str,
        threshold: float
    ) -> pd.DataFrame:

        numeric_df = df.select_dtypes(include=np.number)

        corr_matrix = numeric_df.corr().abs()
        upper_triangle = corr_matrix.where(
            np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
        )

        drop_cols = [
            col for col in upper_triangle.columns
            if any(upper_triangle[col] > threshold)
        ]

        return df.drop(columns=drop_cols)

    # -------------------------------------------------
    # MANUAL FEATURE DROP
    # -------------------------------------------------

    def _manual_drop(self, df: pd.DataFrame, columns: list) -> pd.DataFrame:
        return df.drop(columns=columns, errors="ignore")
