import pandas as pd
import json


class ColumnWiseMissingValueImputer:
    
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
            column = t.get("column")
            strategy = t.get("strategy", "auto")
            dtype = t.get("dtype")

            if column not in df.columns:
                continue

            if df[column].isna().sum() == 0:
                continue

            df[column] = self._impute_column(
                series=df[column],
                strategy=strategy,
                dtype=dtype,
                config=t
            )

        return df

    def _impute_column(self, series: pd.Series, strategy: str, dtype: str, config: dict) -> pd.Series:
  
        if strategy == "auto":
            return self._auto_impute(series, dtype)

        if strategy == "mean":
            return series.fillna(series.mean())

        if strategy == "median":
            return series.fillna(series.median())

        if strategy in ("mode", "most_frequent"):
            return series.fillna(self._safe_mode(series))

        if strategy == "custom":
            if "value" not in config:
                raise ValueError("Custom strategy requires 'value'")
            return series.fillna(config["value"])

        raise ValueError(f"Invalid missing value strategy: {strategy}")

    def _auto_impute(self, series: pd.Series, dtype: str) -> pd.Series:

        if dtype == "numeric" or pd.api.types.is_numeric_dtype(series):
            return series.fillna(series.median())

        if dtype == "datetime" or pd.api.types.is_datetime64_any_dtype(series):
            return series.fillna(method="ffill").fillna(method="bfill")

        if dtype == "boolean" or pd.api.types.is_bool_dtype(series):
            return series.fillna(self._safe_mode(series))

        return series.fillna(self._safe_mode(series))

    def _safe_mode(self, series: pd.Series):
        
        mode = series.mode(dropna=True)
        return mode.iloc[0] if not mode.empty else None
