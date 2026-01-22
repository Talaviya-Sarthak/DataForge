import pandas as pd
from sklearn.preprocessing import OneHotEncoder, LabelEncoder, OrdinalEncoder


class EncodingValue:
    def __init__(self, transformations: list):
        """
        transformations: list of dicts
        Example:
        {
            "column": "gender",
            "strategy": "onehot",
            "dtype": "categorical"
        }

        For target encoding:
        {
            "column": "payment_method",
            "strategy": "target",
            "dtype": "categorical",
            "target": "churn"
        }
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

            # Target encoding needs full dataframe
            if strategy == "target":
                df = self._target_encode(df, col, t)
            else:
                df = self._encode_column(df, col, strategy, dtype)

        return df

    # -------------------------------------------------
    # ENCODING METHODS
    # -------------------------------------------------

    def _encode_column(self, df, col, strategy, dtype):

        series = df[col]

        # ---------- AUTO ----------
        if strategy == "auto":
            if dtype == "boolean":
                df[col] = series.astype(int)
                return df

            n_unique = series.nunique(dropna=True)

            if n_unique <= 10:
                return self._onehot(df, col)
            else:
                df[col] = LabelEncoder().fit_transform(series.astype(str))
                return df

        # ---------- ONE HOT ----------
        if strategy == "onehot":
            return self._onehot(df, col)

        # ---------- LABEL ----------
        if strategy == "label":
            df[col] = LabelEncoder().fit_transform(series.astype(str))
            return df

        # ---------- ORDINAL ----------
        if strategy == "ordinal":
            encoder = OrdinalEncoder()
            df[col] = encoder.fit_transform(series.values.reshape(-1, 1))
            return df

        raise ValueError(f"Unsupported encoding strategy: {strategy}")

    # -------------------------------------------------
    # ONE HOT ENCODER (EXPANDS COLUMNS)
    # -------------------------------------------------

    def _onehot(self, df, col):
        encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
        encoded = encoder.fit_transform(df[[col]])

        encoded_df = pd.DataFrame(
            encoded,
            columns=[f"{col}_{cat}" for cat in encoder.categories_[0]],
            index=df.index
        )

        df = df.drop(columns=[col])
        df = pd.concat([df, encoded_df], axis=1)

        return df

    # -------------------------------------------------
    # TARGET ENCODING (SUPERVISED)
    # -------------------------------------------------

    def _target_encode(self, df, col, config):

        target_col = config.get("target")

        if target_col is None or target_col not in df.columns:
            raise ValueError("Target column must be provided for target encoding")

        # Compute mean target per category
        mapping = df.groupby(col)[target_col].mean()

        global_mean = df[target_col].mean()

        # Replace categories with mean target
        df[col] = df[col].map(mapping)

        # Handle unseen / missing categories
        df[col] = df[col].fillna(global_mean)

        return df
