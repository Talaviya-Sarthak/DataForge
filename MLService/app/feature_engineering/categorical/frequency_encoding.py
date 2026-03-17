"""
Frequency Encoding
==================

Creates frequency encoding features for categorical columns.

Rules:
- Encodes each category with its relative frequency
- Creates new features (does not replace original)
- Applies to object and categorical dtypes
"""

import pandas as pd
import numpy as np
from typing import Dict, List
from ..core.base_transformer import BaseFeatureTransformer


class FrequencyEncodingTransformer(BaseFeatureTransformer):
    """
    Create frequency encoding features for categorical columns.

    For each categorical column, creates a new column where each value
    is replaced with its relative frequency in the dataset.
    """

    def apply(self, df: pd.DataFrame, target_column: str = None) -> Dict:
        """
        Apply frequency encoding to categorical features.

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

        # Get categorical columns
        categorical_cols = result_df.select_dtypes(
            include=["object", "category"]
        ).columns.tolist()

        # Exclude target column
        if target_column and target_column in categorical_cols:
            categorical_cols.remove(target_column)

        for col in categorical_cols:
            try:
                # Calculate frequency encoding
                freq_encoding = result_df[col].value_counts(normalize=True).to_dict()

                # Create new feature
                new_col_name = f"{col}_freq"
                result_df[new_col_name] = result_df[col].map(freq_encoding)
                new_features.append(new_col_name)

            except Exception:
                # Skip this column if any error occurs
                continue

        return {"df": result_df, "new_features": new_features}
