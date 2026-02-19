"""
Binning
=======

Creates binned versions of numeric features using quantile-based binning.

Rules:
- Uses quantile binning (5 bins by default)
- Handles duplicates safely
- Creates new features (does not replace original)
"""

import pandas as pd
import numpy as np
from typing import Dict, List
from ..core.base_transformer import BaseFeatureTransformer


class BinningTransformer(BaseFeatureTransformer):
    """
    Create binned versions of numeric features.

    Uses quantile-based binning to create categorical bins from numeric features.
    """

    def __init__(self, n_bins: int = 5):
        """
        Initialize the binning transformer.

        Parameters
        ----------
        n_bins : int, default=5
            Number of bins to create
        """
        super().__init__()
        self.n_bins = n_bins

    def apply(self, df: pd.DataFrame, target_column: str = None) -> Dict:
        """
        Apply binning to numeric features.

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
                # Check if column has enough unique values for binning
                if result_df[col].nunique() < self.n_bins:
                    continue

                # Apply quantile-based binning with duplicate handling
                new_col_name = f"{col}_binned"
                result_df[new_col_name] = pd.qcut(
                    result_df[col], q=self.n_bins, labels=False, duplicates="drop"
                )
                new_features.append(new_col_name)

            except Exception:
                # Skip this column if any error occurs
                continue

        return {"df": result_df, "new_features": new_features}
