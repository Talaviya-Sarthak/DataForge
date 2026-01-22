import pandas as pd


class ColumnWiseMissingValueImputer:

    def __init__(self, transformations: list):
        """
        transformations: list of dicts
        """
        self.transformations = transformations

    def apply(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        for t in self.transformations:
            col = t["column"]
            strategy = t["strategy"]
            dtype = t["dtype"]

            if col not in df.columns:
                continue

            if df[col].isnull().sum() == 0:
                continue

            df[col] = self._impute_column(df[col], strategy, dtype, t)

        return df

    def _impute_column(self, series, strategy, dtype, config):
        if strategy == "auto":
            return self._auto(series, dtype)

        if strategy == "mean":
            return series.fillna(series.mean())

        if strategy == "median":
            return series.fillna(series.median())

        if strategy == "mode":
            return series.fillna(series.mode()[0])

        if strategy == "most_frequent":
            return series.fillna(series.mode()[0])

        if strategy == "custom":
            return series.fillna(config.get("value"))

        raise ValueError(f"Invalid strategy: {strategy}")

    def _auto(self, series, dtype):
        if dtype == "numeric":
            return series.fillna(series.median())

        if dtype in ["categorical", "boolean", "datetime"]:
            return series.fillna(series.mode()[0])

        return series
