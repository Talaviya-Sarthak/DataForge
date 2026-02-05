import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder
import json


class EncodingValue:
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
            strategy = t.get("strategy", "auto")
            dtype = t.get("dtype")

            if col not in df.columns:
                continue

            if strategy == "target":
                df = self._target_encode(df, col, t)
            else:
                df = self._encode_column(df, col, strategy, dtype, t)

        return df

    def _encode_column(self, df, col, strategy, dtype, config):
        series = df[col]

        if strategy == "auto":
            if dtype == "boolean":
                df[col] = series.map({True: 1, False: 0}).fillna(0)
                return df

            n_unique = series.nunique(dropna=True)

            if n_unique <= 10:
                return self._onehot(df, col)

            encoder = OrdinalEncoder(
                handle_unknown="use_encoded_value",
                unknown_value=-1
            )
            df[col] = encoder.fit_transform(
                series.astype(str).values.reshape(-1, 1)
            )
            return df

        if strategy == "onehot":
            return self._onehot(df, col)

        if strategy == "ordinal":
            categories = config.get("categories")
            if not categories:
                raise ValueError("Ordinal encoding requires 'categories'")

            encoder = OrdinalEncoder(categories=[categories])
            df[col] = encoder.fit_transform(
                series.values.reshape(-1, 1)
            )
            return df

        raise ValueError(f"Unsupported encoding strategy: {strategy}")

    def _onehot(self, df, col):
        encoder = OneHotEncoder(
            sparse_output=False,
            handle_unknown="ignore"
        )

        encoded = encoder.fit_transform(df[[col]])

        encoded_df = pd.DataFrame(
            encoded,
            columns=[f"{col}_{c}" for c in encoder.categories_[0]],
            index=df.index
        )

        df = df.drop(columns=[col])
        df = pd.concat([df, encoded_df], axis=1)

        return df

    def _target_encode(self, df, col, config):
        target_col = config.get("target")
        smoothing = config.get("smoothing", 10)

        if target_col is None or target_col not in df.columns:
            raise ValueError("Target column must be provided")

        global_mean = df[target_col].mean()

        stats = df.groupby(col)[target_col].agg(["mean", "count"])

        stats["encoded"] = (
            (stats["count"] * stats["mean"] + smoothing * global_mean)
            / (stats["count"] + smoothing)
        )

        df[col] = df[col].map(stats["encoded"])
        df[col] = df[col].fillna(global_mean)

        return df
