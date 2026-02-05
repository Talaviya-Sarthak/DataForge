import pandas as pd
import numpy as np
import json


class HandlingOutliers:

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
        removal_masks = []

        for t in self.transformations:
            col = t.get("column")
            strategy = t.get("strategy", "auto")
            dtype = t.get("dtype")

            if col not in df.columns:
                continue

 
            if not pd.api.types.is_numeric_dtype(df[col]):
                continue

            if strategy in ("auto", "cap"):
                df[col] = self._iqr_cap(df[col])

            elif strategy == "remove":
                mask = self._iqr_mask(df[col])
                removal_masks.append(mask)

            else:
                raise ValueError(f"Unsupported outlier strategy: {strategy}")

    
        if removal_masks:
            combined_mask = np.logical_and.reduce(removal_masks)
            df = df.loc[combined_mask].reset_index(drop=True)

        return df


    def _iqr_bounds(self, series: pd.Series):
        clean = series.dropna()

        if clean.empty:
            return None, None

        q1 = clean.quantile(0.25)
        q3 = clean.quantile(0.75)
        iqr = q3 - q1

        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr

        return lower, upper

    def _iqr_mask(self, series: pd.Series) -> pd.Series:
        lower, upper = self._iqr_bounds(series)

        if lower is None:
            return pd.Series(True, index=series.index)

        return (series >= lower) & (series <= upper)


    def _iqr_cap(self, series: pd.Series) -> pd.Series:
        lower, upper = self._iqr_bounds(series)

        if lower is None:
            return series

        return series.clip(lower=lower, upper=upper)
