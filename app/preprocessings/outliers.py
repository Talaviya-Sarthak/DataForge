import pandas as pd
import numpy as np


class HandlingOutliers:
    def __init__(self, transformations: list):
        """
        transformations: list of dicts

        Example:
        {
            "column": "salary",
            "operation": "outlier",
            "strategy": "auto" | "cap" | "remove",
            "dtype": "numeric"
        }
        """
        self.transformations = transformations

    def apply(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        for t in self.transformations:
            col = t["column"]
            strategy = t["strategy"]
            dtype = t["dtype"]

            # Defensive checks
            if col not in df.columns:
                continue

            if dtype != "numeric":
                continue

            # AUTO → safe default (IQR capping)
            if strategy == "auto":
                df[col] = self._iqr_cap(df[col])

            elif strategy == "cap":
                df[col] = self._iqr_cap(df[col])

            elif strategy == "remove":
                df = self._iqr_remove(df, col)

            else:
                raise ValueError(f"Unsupported outlier strategy: {strategy}")

        return df

    # -------------------------------------------------
    # IQR DETECTION
    # -------------------------------------------------

    def _iqr_bounds(self, series: pd.Series):
        """
        Calculate IQR bounds
        """
        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1

        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        return lower_bound, upper_bound

    # -------------------------------------------------
    # IQR CAPPING (SAFE)
    # -------------------------------------------------

    def _iqr_cap(self, series: pd.Series) -> pd.Series:
        lower, upper = self._iqr_bounds(series)

        return series.clip(lower=lower, upper=upper)

    # -------------------------------------------------
    # IQR ROW REMOVAL (DANGEROUS)
    # -------------------------------------------------

    def _iqr_remove(self, df: pd.DataFrame, col: str) -> pd.DataFrame:
        lower, upper = self._iqr_bounds(df[col])

        # keep only non-outlier rows
        mask = (df[col] >= lower) & (df[col] <= upper)
        return df.loc[mask].reset_index(drop=True)
