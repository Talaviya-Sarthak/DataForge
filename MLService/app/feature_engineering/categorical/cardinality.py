"""
Cardinality Feature
==================

Creates cardinality features for categorical columns.

Rules:
- Creates a feature indicating the number of unique values in each categorical column
- Creates new features (does not replace original)
- Applies to object and categorical dtypes
"""

import pandas as pd
import numpy as np
from typing import Dict, List
from ..core.base_transformer import BaseFeatureTransformer


class CardinalityTransformer(BaseFeatureTransformer):
    """
    Create cardinality features for categorical columns.

    For each categorical column, creates a new column with a constant value
    representing the cardinality (number of unique values) of that column.
    This can help models understand the complexity of categorical features.
    """

    def apply(self, df: pd.DataFrame, target_column: str = None) -> Dict:
        """
        Apply cardinality feature creation to categorical features.

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
                # Calculate cardinality
                cardinality = result_df[col].nunique()

                # Create new feature
                new_col_name = f"{col}_cardinality"
                result_df[new_col_name] = cardinality
                new_features.append(new_col_name)

            except Exception:
                # Skip this column if any error occurs
                continue

        return {"df": result_df, "new_features": new_features}
