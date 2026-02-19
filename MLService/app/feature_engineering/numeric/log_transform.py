"""
Log Transform
=============

Applies logarithmic transformation to skewed numeric features.

Rules:
- Only applies if all values > 0
- Only applies if |skewness| > 1
- Creates new features (does not replace original)
"""

import pandas as pd
import numpy as np
from typing import Dict, List
from ..core.base_transformer import BaseFeatureTransformer


class LogTransformer(BaseFeatureTransformer):
    """
    Apply log transformation to highly skewed numeric features.

    Creates new log-transformed features for numeric columns that:
    1. Have all positive values (min > 0)
    2. Have absolute skewness > 1
    """

    def __init__(self, skew_threshold: float = 1.0):
        """
        Initialize the log transformer.

        Parameters
        ----------
        skew_threshold : float, default=1.0
            Minimum absolute skewness to apply transformation
        """
        super().__init__()
        self.skew_threshold = skew_threshold

    def apply(self, df: pd.DataFrame, target_column: str = None) -> Dict:
        """
        Apply log transformation to eligible numeric features.

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
                # Check if all values are positive
                if result_df[col].min() <= 0:
                    continue

                # Calculate skewness
                skewness = result_df[col].skew()

                # Apply log transform if highly skewed
                if abs(skewness) > self.skew_threshold:
                    new_col_name = f"{col}_log"
                    result_df[new_col_name] = np.log1p(result_df[col])
                    new_features.append(new_col_name)

            except Exception:
                # Skip this column if any error occurs
                continue

        return {"df": result_df, "new_features": new_features}
