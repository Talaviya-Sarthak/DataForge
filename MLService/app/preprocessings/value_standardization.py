import pandas as pd
import json


class ValueStandardization:
    def __init__(self, transformations):
        # Normalize transformations to ensure they are dicts
        if isinstance(transformations, str):
            transformations = json.loads(transformations)
        
        if not isinstance(transformations, list):
            transformations = [transformations] if transformations else []
            
        # Normalize each transformation
        normalized_transformations = []
        for t in transformations:
            if isinstance(t, str):
                t = json.loads(t)
            if isinstance(t, dict):
                normalized_transformations.append(t)
        
        self.transformations = normalized_transformations

    def apply(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        for t in self.transformations:
            col = t.get("column")
            mapping = t.get("mapping")

            if col not in df.columns:
                continue

            if not isinstance(mapping, dict):
                continue

            if not pd.api.types.is_object_dtype(df[col]):
                continue

            df[col] = self._standardize_column(df[col], mapping)

        return df

    def _standardize_column(self, series: pd.Series, mapping: dict) -> pd.Series:
        mask = series.notna()

        normalized_series = (
            series[mask]
            .astype(str)
            .str.lower()
            .str.strip()
            .str.replace(r"\s+", " ", regex=True)
        )

        normalized_mapping = {
            str(k).lower().strip().replace(r"\s+", " "): v
            for k, v in mapping.items()
        }

        normalized_series = normalized_series.replace(normalized_mapping)
        series.loc[mask] = normalized_series

        return series
