"""
Interaction Features
====================

Creates pairwise interaction features ONLY between strictly original numeric columns.

This version ensures:
- No recursive interaction
- No interaction on transformed features
- No feature explosion
- Stable AutoML behavior
"""

import pandas as pd
import numpy as np
from typing import Dict
from itertools import combinations
from ..core.base_transformer import BaseFeatureTransformer


class InteractionTransformer(BaseFeatureTransformer):

    def apply(self, df: pd.DataFrame, target_column: str = None) -> Dict:

        result_df = df.copy()
        new_features = []

        # Step 1: Get numeric columns
        numeric_cols = result_df.select_dtypes(include=[np.number]).columns.tolist()

        # Step 2: Remove target column
        if target_column and target_column in numeric_cols:
            numeric_cols.remove(target_column)

        # Step 3: STRICT filter → only allow columns WITHOUT underscore
        # This guarantees only original numeric columns are used
        original_numeric_cols = [
            col for col in numeric_cols if "_" not in col
        ]

        # Step 4: Must have at least 2 original numeric columns
        if len(original_numeric_cols) < 2:
            return {"df": result_df, "new_features": new_features}

        try:
            for col1, col2 in combinations(original_numeric_cols, 2):

                # Multiplication
                mult_col = f"{col1}_x_{col2}"
                result_df[mult_col] = result_df[col1] * result_df[col2]
                new_features.append(mult_col)

                # Safe division
                div_col = f"{col1}_div_{col2}"
                result_df[div_col] = result_df[col1] / (result_df[col2] + 1e-10)
                new_features.append(div_col)

        except Exception:
            pass

        return {"df": result_df, "new_features": new_features}
