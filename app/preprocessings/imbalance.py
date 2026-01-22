import pandas as pd
from sklearn.utils import resample


class HandlingImbalance:
    def __init__(self, transformations: list):
        """
        transformations: list of dicts

        Example:
        {
            "target": "churn",
            "operation": "imbalance",
            "strategy": "auto" | "undersample" | "oversample",
            "dtype": "categorical"
        }
        """
        self.transformations = transformations

    def apply(self, df: pd.DataFrame):
        df = df.copy()

        for t in self.transformations:
            target = t["target"]
            strategy = t["strategy"]
            dtype = t["dtype"]

            # Defensive checks
            if target not in df.columns:
                continue

            if dtype != "categorical":
                continue

            # AUTO → safe default (no resampling)
            if strategy == "auto":
                return df

            elif strategy == "undersample":
                return self._undersample(df, target)

            elif strategy == "oversample":
                return self._oversample(df, target)

            else:
                raise ValueError(f"Unsupported imbalance strategy: {strategy}")

        return df

    # -------------------------------------------------
    # UNDERSAMPLING (REMOVE MAJORITY)
    # -------------------------------------------------

    def _undersample(self, df: pd.DataFrame, target: str) -> pd.DataFrame:
        class_counts = df[target].value_counts()
        minority_class = class_counts.idxmin()
        majority_class = class_counts.idxmax()

        df_minority = df[df[target] == minority_class]
        df_majority = df[df[target] == majority_class]

        df_majority_downsampled = resample(
            df_majority,
            replace=False,
            n_samples=len(df_minority),
            random_state=42
        )

        df_balanced = pd.concat(
            [df_minority, df_majority_downsampled]
        ).sample(frac=1, random_state=42).reset_index(drop=True)

        return df_balanced

    # -------------------------------------------------
    # OVERSAMPLING (DUPLICATE MINORITY)
    # -------------------------------------------------

    def _oversample(self, df: pd.DataFrame, target: str) -> pd.DataFrame:
        class_counts = df[target].value_counts()
        minority_class = class_counts.idxmin()
        majority_class = class_counts.idxmax()

        df_minority = df[df[target] == minority_class]
        df_majority = df[df[target] == majority_class]

        df_minority_oversampled = resample(
            df_minority,
            replace=True,
            n_samples=len(df_majority),
            random_state=42
        )

        df_balanced = pd.concat(
            [df_majority, df_minority_oversampled]
        ).sample(frac=1, random_state=42).reset_index(drop=True)

        return df_balanced
