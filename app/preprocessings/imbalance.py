import pandas as pd
from sklearn.utils import resample
from imblearn.over_sampling import SMOTE


class HandlingImbalance:
    def __init__(self, transformations: list):
        self.transformations = transformations

    def apply(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        for t in self.transformations:
            target = t.get("target")
            strategy = t.get("strategy", "auto")

            if target not in df.columns:
                continue

            if strategy == "auto":
                continue

            elif strategy == "undersample":
                df = self._undersample(df, target)

            elif strategy == "oversample":
                df = self._oversample(df, target)

            elif strategy == "smote":
                df = self._smote(df, target, t)

            else:
                raise ValueError(f"Unsupported imbalance strategy: {strategy}")

        return df

    def _undersample(self, df: pd.DataFrame, target: str) -> pd.DataFrame:
        class_counts = df[target].value_counts()

        if len(class_counts) < 2:
            return df

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

        return pd.concat(
            [df_minority, df_majority_downsampled]
        ).sample(frac=1, random_state=42).reset_index(drop=True)

    def _oversample(self, df: pd.DataFrame, target: str) -> pd.DataFrame:
        class_counts = df[target].value_counts()

        if len(class_counts) < 2:
            return df

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

        return pd.concat(
            [df_majority, df_minority_oversampled]
        ).sample(frac=1, random_state=42).reset_index(drop=True)

    def _smote(self, df: pd.DataFrame, target: str, config: dict) -> pd.DataFrame:
        X = df.drop(columns=[target])
        y = df[target]

        if y.nunique() < 2:
            return df

        k_neighbors = config.get("k_neighbors", 5)

        smote = SMOTE(
            random_state=42,
            k_neighbors=min(k_neighbors, y.value_counts().min() - 1)
        )

        X_resampled, y_resampled = smote.fit_resample(X, y)

        df_resampled = X_resampled.copy()
        df_resampled[target] = y_resampled

        return df_resampled.reset_index(drop=True)
