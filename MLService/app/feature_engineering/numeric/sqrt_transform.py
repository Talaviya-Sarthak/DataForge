"""
Square Root Transform
====================

Applies square root transformation to numeric features.

Rules:
- Only applies if all values >= 0
- Creates new features (does not replace original)
"""

import pandas as pd
import numpy as np
from typing import Dict, List
from ..core.base_transformer import BaseFeatureTransformer


class SqrtTransformer(BaseFeatureTransformer):
    """
    Apply square root transformation to numeric features.

    Creates new sqrt-transformed features for numeric columns that:
    - Have all non-negative values (min >= 0)
    """

    def apply(self, df: pd.DataFrame, target_column: str = None) -> Dict:
        """
        Apply square root transformation to eligible numeric features.

        Parameters
        ----------
        df : pd.DataFrame
            Input dataframe
        target_column : str, optional
            Target column to exclude from transformation

        Returns
        -------
        Dict
            Dictionary with transformed dataframe and new feature names
        """
        result_df = df.copy()
        new_features = []

        # Get numeric columns
        numeric_cols = result_df.select_dtypes(include=[np.number]).columns.tolist()

        # Exclude target column
        if target_column and target_column in numeric_cols:
            numeric_cols.remove(target_column)

        for col in numeric_cols:
            try:
                # Check if all values are non-negative
                if result_df[col].min() < 0:
                    continue

                # Apply square root transform
                new_col_name = f"{col}_sqrt"
                result_df[new_col_name] = np.sqrt(result_df[col])
                new_features.append(new_col_name)

            except Exception:
                # Skip this column if any error occurs
                continue

        return {"df": result_df, "new_features": new_features}
