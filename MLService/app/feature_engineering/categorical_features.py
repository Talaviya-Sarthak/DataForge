import pandas as pd
import json


class ColumnWiseCategoricalFeatureEngineer:

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

        for t in self.transformations:

            column = t.get("column")
            operations = t.get("operations", [])

            if column not in df.columns:
                continue

            if df[column].isna().all():
                continue

            if "frequency" in operations:
                df = self._apply_frequency(df, column)

            if "count" in operations:
                df = self._apply_count(df, column)

            if "cardinality" in operations:
                df = self._apply_cardinality(df, column)

        return df

    def _apply_frequency(self, df, column):
        freq_map = df[column].value_counts(normalize=True).to_dict()
        df[f"{column}_freq"] = df[column].map(freq_map)
        return df

    def _apply_count(self, df, column):
        count_map = df[column].value_counts().to_dict()
        df[f"{column}_count"] = df[column].map(count_map)
        return df

    def _apply_cardinality(self, df, column):
        df[f"{column}_cardinality"] = df[column].nunique(dropna=True)
        return df
