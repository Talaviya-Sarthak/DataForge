"""
Aggregation Features
===================

Creates row-wise aggregation features from numeric columns.

Rules:
- Only applies if >= 3 original numeric columns exist
- Creates mean, std, min, max across rows
- Uses ONLY original numeric columns (no engineered features)
- Creates new features (does not replace original)
"""

import pandas as pd
import numpy as np
from typing import Dict, List
from ..core.base_transformer import BaseFeatureTransformer


class AggregationTransformer(BaseFeatureTransformer):
    """
    Create row-wise aggregation features.

    Creates statistical aggregations (mean, std, min, max) across
    ORIGINAL numeric columns only (prevents feature leakage).
    """

    def apply(self, df: pd.DataFrame, target_column: str = None) -> Dict:
        """
        Apply row-wise aggregation safely.

        Parameters
        ----------
        df : pd.DataFrame
            Input dataframe
        target_column : str, optional
            Target column to exclude from transformation

        Returns
        -------
        Dict
            {
                "df": transformed_dataframe,
                "new_features": list_of_new_features
            }
        """

        result_df = df.copy()
        new_features = []

        # Step 1: Get numeric columns
        numeric_cols = result_df.select_dtypes(include=[np.number]).columns.tolist()

        # Step 2: Exclude target column if present
        if target_column and target_column in numeric_cols:
            numeric_cols.remove(target_column)

        # Step 3: Exclude engineered columns (prevent leakage)
        engineered_suffixes = [
            "_log",
            "_sqrt",
            "_mean",
            "_std",
            "_min",
            "_max",
            "_count",
            "_freq",
            "_cardinality",
        ]

        original_numeric_cols = [
            col for col in numeric_cols
            if not any(col.endswith(suffix) for suffix in engineered_suffixes)
        ]

        # Step 4: Only proceed if >= 3 original numeric columns
        if len(original_numeric_cols) < 3:
            return {"df": result_df, "new_features": new_features}

        try:
            numeric_subset = result_df[original_numeric_cols]

            # Row-wise mean
            result_df["numeric_mean"] = numeric_subset.mean(axis=1)
            new_features.append("numeric_mean")

            # Row-wise std
            result_df["numeric_std"] = numeric_subset.std(axis=1)
            new_features.append("numeric_std")

            # Row-wise min
            result_df["numeric_min"] = numeric_subset.min(axis=1)
            new_features.append("numeric_min")

            # Row-wise max
            result_df["numeric_max"] = numeric_subset.max(axis=1)
            new_features.append("numeric_max")

        except Exception:
            # Fail silently (SafeExecutor handles logging)
            pass

        return {"df": result_df, "new_features": new_features}
