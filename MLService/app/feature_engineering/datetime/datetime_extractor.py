"""
Datetime Feature Extractor
==========================

Extracts datetime components from datetime columns.

Rules:
- Detects datetime columns by dtype or column name
- Extracts year, month, day, day_of_week, quarter
- Creates new features (does not replace original)
"""

import pandas as pd
import numpy as np
from typing import Dict, List
from ..core.base_transformer import BaseFeatureTransformer


class DatetimeExtractor(BaseFeatureTransformer):
    """
    Extract datetime features from datetime columns.

    Automatically detects datetime columns by:
    1. Checking if dtype is datetime
    2. Checking if column name contains 'date' or 'time'

    Extracts: year, month, day, day_of_week, quarter
    """

    def _is_datetime_column(self, series: pd.Series, col_name: str) -> bool:
        """
        Check if a column is or can be converted to datetime.

        Parameters
        ----------
        series : pd.Series
            The series to check
        col_name : str
            The column name

        Returns
        -------
        bool
            True if column is datetime-like
        """
        # Check dtype
        if pd.api.types.is_datetime64_any_dtype(series):
            return True

        # Check column name
        col_name_lower = col_name.lower()
        if "date" in col_name_lower or "time" in col_name_lower:
            return True

        return False

    def _try_convert_to_datetime(self, series: pd.Series) -> pd.Series:
        """
        Try to convert a series to datetime.

        Parameters
        ----------
        series : pd.Series
            The series to convert

        Returns
        -------
        pd.Series
            Converted datetime series or None if conversion fails
        """
        try:
            return pd.to_datetime(series, errors="coerce")
        except Exception:
            return None

    def apply(self, df: pd.DataFrame, target_column: str = None) -> Dict:
        """
        Extract datetime features.

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

        # Iterate through all columns
        for col in result_df.columns:
            # Skip target column
            if target_column and col == target_column:
                continue

            # Check if column is datetime-like
            if not self._is_datetime_column(result_df[col], col):
                continue

            try:
                # Convert to datetime if needed
                if not pd.api.types.is_datetime64_any_dtype(result_df[col]):
                    dt_series = self._try_convert_to_datetime(result_df[col])
                    if dt_series is None:
                        continue
                else:
                    dt_series = result_df[col]

                # Extract features
                # Year
                year_col = f"{col}_year"
                result_df[year_col] = dt_series.dt.year
                new_features.append(year_col)

                # Month
                month_col = f"{col}_month"
                result_df[month_col] = dt_series.dt.month
                new_features.append(month_col)

                # Day
                day_col = f"{col}_day"
                result_df[day_col] = dt_series.dt.day
                new_features.append(day_col)

                # Day of week
                dow_col = f"{col}_dayofweek"
                result_df[dow_col] = dt_series.dt.dayofweek
                new_features.append(dow_col)

                # Quarter
                quarter_col = f"{col}_quarter"
                result_df[quarter_col] = dt_series.dt.quarter
                new_features.append(quarter_col)

            except Exception:
                # Skip this column if any error occurs
                continue

        return {"df": result_df, "new_features": new_features}
