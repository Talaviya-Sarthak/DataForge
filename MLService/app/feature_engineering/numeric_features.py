import pandas as pd
import numpy as np
import json


class ColumnWiseNumericFeatureEngineer:

    def __init__(self, transformations):

        if isinstance(transformations, str):
            transformations = json.loads(transformations)

        if not isinstance(transformations, list):
            transformations = [transformations] if transformations else []

        normalized = []
        for t in transformations:
            if isinstance(t, str):
                t = json.loads(t)
            if isinstance(t, dict):
                normalized.append(t)

        self.transformations = normalized

    def apply(self, df: pd.DataFrame) -> pd.DataFrame:

        df = df.copy()
        numeric_columns_for_aggregation = []

        for t in self.transformations:

            column = t.get("column")
            operations = t.get("operations", [])
            bins = t.get("bins", 5)

            if column not in df.columns:
                continue

            if not pd.api.types.is_numeric_dtype(df[column]):
                continue

            if df[column].isna().all():
                continue

            numeric_columns_for_aggregation.append(column)

            for op in operations:

                if op == "log":
                    df = self._apply_log(df, column)

                elif op == "square":
                    df = self._apply_square(df, column)

                elif op == "sqrt":
                    df = self._apply_sqrt(df, column)

                elif op == "binning":
                    df = self._apply_binning(df, column, bins)

        if len(numeric_columns_for_aggregation) >= 2:
            df = self._apply_aggregations(df, numeric_columns_for_aggregation)

        return df

    def _apply_log(self, df, column):
        if (df[column] > 0).all():
            df[f"{column}_log"] = np.log1p(df[column])
        return df

    def _apply_square(self, df, column):
        df[f"{column}_squared"] = df[column] ** 2
        return df

    def _apply_sqrt(self, df, column):
        if (df[column] >= 0).all():
            df[f"{column}_sqrt"] = np.sqrt(df[column])
        return df

    def _apply_binning(self, df, column, bins):
        try:
            df[f"{column}_binned"] = pd.qcut(
                df[column], q=bins, labels=False, duplicates="drop"
            )
        except:
            pass
        return df

    def _apply_aggregations(self, df, numeric_columns):
        df["numeric_mean"] = df[numeric_columns].mean(axis=1)
        df["numeric_std"] = df[numeric_columns].std(axis=1)
        df["numeric_min"] = df[numeric_columns].min(axis=1)
        df["numeric_max"] = df[numeric_columns].max(axis=1)
        df["numeric_range"] = df["numeric_max"] - df["numeric_min"]
        return df
