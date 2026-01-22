import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler


class ScalingValues:
    def __init__(self, transformations: list):
        """
        transformations: list of dicts

        Example:
        {
            "column": "age",
            "operation": "scale",
            "strategy": "auto" | "standardize" | "normalize",
            "dtype": "numeric"
        }
        """
        self.transformations = transformations
        self.scalers = {}

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

            if strategy == "auto":
                # Auto → Standardize (safe default)
                df[col] = self._standardize(df[col], col)

            elif strategy == "standardize":
                df[col] = self._standardize(df[col], col)

            elif strategy == "normalize":
                df[col] = self._normalize(df[col], col)

            else:
                raise ValueError(f"Unsupported scaling strategy: {strategy}")

        return df

    # -------------------------------------------------
    # STANDARDIZATION
    # -------------------------------------------------

    def _standardize(self, series: pd.Series, col: str) -> pd.Series:
        scaler = StandardScaler()

        scaled = scaler.fit_transform(
            series.values.reshape(-1, 1)
        ).flatten()

        self.scalers[col] = scaler
        return scaled

    # -------------------------------------------------
    # NORMALIZATION
    # -------------------------------------------------

    def _normalize(self, series: pd.Series, col: str) -> pd.Series:
        scaler = MinMaxScaler()

        scaled = scaler.fit_transform(
            series.values.reshape(-1, 1)
        ).flatten()

        self.scalers[col] = scaler
        return scaled
