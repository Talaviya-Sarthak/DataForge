import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
import json


class ScalingValues:
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
        self.scalers = {}

    def apply(self, df: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
        df = df.copy()

        for t in self.transformations:
            col = t.get("column")
            strategy = t.get("strategy", "auto")

            if col not in df.columns:
                continue

            if not pd.api.types.is_numeric_dtype(df[col]):
                continue

            if strategy == "auto":
                df[col] = self._standardize(df[col], col, fit)

            elif strategy == "standardize":
                df[col] = self._standardize(df[col], col, fit)

            elif strategy == "normalize":
                df[col] = self._normalize(df[col], col, fit)

            elif strategy == "robust":
                df[col] = self._robust(df[col], col, fit)

            elif strategy == "log":
                df[col] = self._log_transform(df[col])

            else:
                raise ValueError(f"Unsupported scaling strategy: {strategy}")

        return df

    def _standardize(self, series: pd.Series, col: str, fit: bool) -> pd.Series:
        values = series.values.reshape(-1, 1)

        if fit:
            scaler = StandardScaler()
            scaled = scaler.fit_transform(values)
            self.scalers[col] = scaler
        else:
            scaler = self.scalers.get(col)
            if scaler is None:
                raise ValueError(f"No fitted scaler for column: {col}")
            scaled = scaler.transform(values)

        return pd.Series(scaled.flatten(), index=series.index)

    def _normalize(self, series: pd.Series, col: str, fit: bool) -> pd.Series:
        values = series.values.reshape(-1, 1)

        if fit:
            scaler = MinMaxScaler()
            scaled = scaler.fit_transform(values)
            self.scalers[col] = scaler
        else:
            scaler = self.scalers.get(col)
            if scaler is None:
                raise ValueError(f"No fitted scaler for column: {col}")
            scaled = scaler.transform(values)

        return pd.Series(scaled.flatten(), index=series.index)

    def _robust(self, series: pd.Series, col: str, fit: bool) -> pd.Series:
        values = series.values.reshape(-1, 1)

        if fit:
            scaler = RobustScaler()
            scaled = scaler.fit_transform(values)
            self.scalers[col] = scaler
        else:
            scaler = self.scalers.get(col)
            if scaler is None:
                raise ValueError(f"No fitted scaler for column: {col}")
            scaled = scaler.transform(values)

        return pd.Series(scaled.flatten(), index=series.index)

    def _log_transform(self, series: pd.Series) -> pd.Series:
        min_val = series.min()
        if min_val <= 0:
            series = series - min_val + 1

        return pd.Series(np.log1p(series), index=series.index)
