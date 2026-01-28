import pandas as pd
import numpy as np
from sklearn.feature_selection import VarianceThreshold


class FeatureSelection:
    def __init__(self, transformations: list):
        self.transformations = transformations

    def apply(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        for t in self.transformations:
            strategy = t.get("strategy", "auto")
            target = t.get("target")

            if strategy == "auto":
                df = self._variance_selection(df, target, threshold=0.01)

            elif strategy == "variance":
                threshold = t.get("threshold", 0.01)
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

    def _variance_selection(
        self,
        df: pd.DataFrame,
        target: str = None,
        threshold: float = 0.01
    ) -> pd.DataFrame:

        if target and target in df.columns:
            y = df[target]
            X = df.drop(columns=[target])
        else:
            X = df
            y = None

        numeric_cols = X.select_dtypes(include=np.number).columns
        non_numeric_cols = X.columns.difference(numeric_cols)

        if len(numeric_cols) == 0:
            return df

        selector = VarianceThreshold(threshold=threshold)
        selected_array = selector.fit_transform(X[numeric_cols])
        selected_numeric_cols = numeric_cols[selector.get_support()]

        X_selected = pd.concat(
            [
                pd.DataFrame(
                    selected_array,
                    columns=selected_numeric_cols,
                    index=df.index
                ),
                X[non_numeric_cols]
            ],
            axis=1
        )

        if y is not None:
            X_selected[target] = y.values

        return X_selected

    def _correlation_selection(
        self,
        df: pd.DataFrame,
        target: str,
        threshold: float
    ) -> pd.DataFrame:

        numeric_df = df.select_dtypes(include=np.number)

        if target and target in numeric_df.columns:
            numeric_df = numeric_df.drop(columns=[target])

        corr_matrix = numeric_df.corr().abs()
        upper_triangle = corr_matrix.where(
            np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
        )

        drop_cols = [
            col for col in upper_triangle.columns
            if any(upper_triangle[col] > threshold)
        ]

        return df.drop(columns=drop_cols, errors="ignore")

    def _manual_drop(self, df: pd.DataFrame, columns: list) -> pd.DataFrame:
        return df.drop(columns=columns, errors="ignore")
