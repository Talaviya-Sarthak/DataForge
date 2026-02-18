import pandas as pd
import json


class ColumnWiseDatetimeFeatureEngineer:

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
            drop_original = t.get("drop_original", True)

            if column not in df.columns:
                continue

            df[column] = pd.to_datetime(df[column], errors="coerce")

            if df[column].isna().all():
                continue

            df = self._extract_datetime_features(df, column, drop_original)

        return df

    def _extract_datetime_features(self, df, column, drop_original):

        df[f"{column}_year"] = df[column].dt.year
        df[f"{column}_month"] = df[column].dt.month
        df[f"{column}_day"] = df[column].dt.day
        df[f"{column}_dayofweek"] = df[column].dt.dayofweek
        df[f"{column}_quarter"] = df[column].dt.quarter

        if drop_original:
            df.drop(columns=[column], inplace=True)

        return df
