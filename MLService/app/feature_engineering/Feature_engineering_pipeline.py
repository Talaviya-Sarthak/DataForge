"""
Feature Engineering Service
===========================

Main orchestrator for the feature engineering pipeline.

This service:
1. Detects column types (numeric, categorical, datetime)
2. Loads appropriate transformers from the registry
3. Executes transformers with fault tolerance
4. Collects comprehensive metadata
5. Returns transformed data with execution details
"""

import logging
import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from sklearn.feature_selection import VarianceThreshold
from .core.feature_registry import FeatureRegistry
from .core.safe_executor import SafeExecutor
from .pca_reduction import apply_pca

logger = logging.getLogger(__name__)

# If the number of features exceeds this threshold after engineering,
# PCA is applied automatically to reduce dimensionality.
FEATURE_THRESHOLD = 50

# Variance threshold for low-variance feature filtering
LOW_VARIANCE_THRESHOLD = 0.01

# Correlation threshold for high-correlation feature filtering
HIGH_CORRELATION_THRESHOLD = 0.95


def _drop_low_variance_features(
    df: pd.DataFrame, target_col: str = None, threshold: float = LOW_VARIANCE_THRESHOLD
) -> pd.DataFrame:
    """
    Remove numeric features with variance below a threshold.

    Parameters
    ----------
    df : pd.DataFrame
        Input dataframe
    target_col : str, optional
        Target column to exclude from filtering
    threshold : float
        Minimum variance to keep a feature

    Returns
    -------
    pd.DataFrame
        Dataframe with low-variance numeric features removed
    """
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    # Exclude target column
    if target_col and target_col in numeric_cols:
        numeric_cols.remove(target_col)

    if len(numeric_cols) == 0:
        logger.debug("Feature Filtering: no numeric columns for variance check, skipping.")
        return df

    numeric_subset = df[numeric_cols].dropna()

    if numeric_subset.empty or numeric_subset.shape[0] < 2:
        logger.debug("Feature Filtering: insufficient rows for variance check, skipping.")
        return df

    try:
        selector = VarianceThreshold(threshold=threshold)
        selector.fit(numeric_subset)
        low_variance_mask = ~selector.get_support()
        cols_to_drop = [numeric_cols[i] for i, drop in enumerate(low_variance_mask) if drop]
    except Exception as e:
        logger.warning(f"Feature Filtering: variance filtering failed: {e}")
        return df

    if cols_to_drop:
        logger.info(
            f"Feature Filtering: dropped {len(cols_to_drop)} low variance features: "
            f"{cols_to_drop}"
        )
        df = df.drop(columns=cols_to_drop)
    else:
        logger.debug("Feature Filtering: no low variance features found.")

    return df


def _drop_high_correlation_features(
    df: pd.DataFrame, target_col: str = None, threshold: float = HIGH_CORRELATION_THRESHOLD
) -> pd.DataFrame:
    """
    Remove one of each pair of highly correlated numeric features.

    Parameters
    ----------
    df : pd.DataFrame
        Input dataframe
    target_col : str, optional
        Target column to exclude from filtering
    threshold : float
        Correlation threshold above which one feature is dropped

    Returns
    -------
    pd.DataFrame
        Dataframe with redundant correlated features removed
    """
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    # Exclude target column
    if target_col and target_col in numeric_cols:
        numeric_cols.remove(target_col)

    if len(numeric_cols) < 2:
        logger.debug("Feature Filtering: fewer than 2 numeric columns, skipping correlation check.")
        return df

    try:
        corr_matrix = df[numeric_cols].corr().abs()
    except Exception as e:
        logger.warning(f"Feature Filtering: correlation computation failed: {e}")
        return df

    if corr_matrix.empty:
        logger.debug("Feature Filtering: empty correlation matrix, skipping.")
        return df

    # Upper triangle mask (excluding diagonal)
    upper_tri = np.triu(np.ones(corr_matrix.shape, dtype=bool), k=1)
    cols_to_drop = set()

    for i in range(corr_matrix.shape[0]):
        for j in range(i + 1, corr_matrix.shape[1]):
            if upper_tri[i, j] and corr_matrix.iloc[i, j] > threshold:
                # Drop the later column (j) to keep earlier features
                col_to_drop = corr_matrix.columns[j]
                cols_to_drop.add(col_to_drop)

    cols_to_drop = list(cols_to_drop)

    if cols_to_drop:
        logger.info(
            f"Feature Filtering: dropped {len(cols_to_drop)} highly correlated features: "
            f"{cols_to_drop}"
        )
        df = df.drop(columns=cols_to_drop)
    else:
        logger.debug("Feature Filtering: no highly correlated features found.")

    return df


class FeatureEngineeringService:
    """
    Production-grade feature engineering service.

    Automatically applies feature engineering transformations with:
    - Full fault tolerance
    - Modular architecture
    - Comprehensive metadata tracking
    - Deterministic behavior
    """

    def __init__(self):
        """Initialize the feature engineering service."""
        self.registry = FeatureRegistry()
        self._last_metadata = None

    def _detect_column_types(
        self, df: pd.DataFrame, target_column: str = None
    ) -> Dict[str, List[str]]:
        """
        Detect column types in the dataframe.

        Parameters
        ----------
        df : pd.DataFrame
            Input dataframe
        target_column : str, optional
            Target column to exclude

        Returns
        -------
        Dict[str, List[str]]
            Dictionary mapping column types to column names
        """
        columns = {"numeric": [], "categorical": [], "datetime": [], "other": []}

        for col in df.columns:
            # Skip target column
            if target_column and col == target_column:
                continue

            # Check if numeric
            if pd.api.types.is_numeric_dtype(df[col]):
                columns["numeric"].append(col)
            # Check if datetime
            elif pd.api.types.is_datetime64_any_dtype(df[col]):
                columns["datetime"].append(col)
            # Check if categorical (object or category dtype)
            elif df[col].dtype in ["object", "category"]:
                # Also check if column name suggests datetime
                if "date" in col.lower() or "time" in col.lower():
                    columns["datetime"].append(col)
                else:
                    columns["categorical"].append(col)
            else:
                columns["other"].append(col)

        return columns

    def apply(
        self,
        df: pd.DataFrame,
        exclude_columns: List[str] = None,
        target_column: str = None,
        enable_numeric: bool = True,
        enable_categorical: bool = True,
        enable_datetime: bool = True,
        verbose: bool = True,
    ) -> pd.DataFrame:
        """
        Apply feature engineering to the dataframe.

        Parameters
        ----------
        df : pd.DataFrame
            Input dataframe
        exclude_columns : List[str], optional
            Columns to exclude from transformation (includes target)
        target_column : str, optional
            Target column name (will not be transformed)
        enable_numeric : bool, default=True
            Enable numeric transformers
        enable_categorical : bool, default=True
            Enable categorical transformers
        enable_datetime : bool, default=True
            Enable datetime transformers
        verbose : bool, default=True
            Print progress messages

        Returns
        -------
        pd.DataFrame
            Transformed dataframe with new features
        """
        # Remove index-like columns
        df = df.loc[:, ~df.columns.str.contains("^Unnamed")]

        # Determine which column to use as target
        target_col = target_column
        if exclude_columns and len(exclude_columns) > 0:
            target_col = exclude_columns[0]

        if verbose:
            logger.info("=" * 60)
            logger.info("Starting Feature Engineering Pipeline")
            logger.info("=" * 60)

        # Record original feature count
        original_feature_count = len(df.columns)
        if target_col and target_col in df.columns:
            original_feature_count -= 1

        if verbose:
            logger.info(f"Original feature count: {original_feature_count}")

        # Detect column types
        column_types = self._detect_column_types(df, target_col)
        if verbose:
            logger.info(f"Detected column types:")
            logger.info(f"  - Numeric: {len(column_types['numeric'])} columns")
            logger.info(f"  - Categorical: {len(column_types['categorical'])} columns")
            logger.info(f"  - Datetime: {len(column_types['datetime'])} columns")

        # Collect all transformers to execute
        transformers = []

        if enable_numeric and len(column_types["numeric"]) > 0:
            transformers.extend(self.registry.get_numeric_transformers())

        if enable_categorical and len(column_types["categorical"]) > 0:
            transformers.extend(self.registry.get_categorical_transformers())

        if enable_datetime and len(column_types["datetime"]) > 0:
            transformers.extend(self.registry.get_datetime_transformers())

        if verbose:
            logger.info(f"Total transformers to execute: {len(transformers)}")

        # Execute all transformers with fault tolerance
        result = SafeExecutor.execute_batch(
            transformers=transformers, df=df, target_column=target_col
        )

        # ── Automatic feature filtering (post-engineering, pre-PCA) ──
        pre_filter_count = len(result["df"].columns)
        if target_col and target_col in result["df"].columns:
            pre_filter_count -= 1

        result["df"] = _drop_low_variance_features(result["df"], target_col)
        result["df"] = _drop_high_correlation_features(result["df"], target_col)

        post_filter_count = len(result["df"].columns)
        if target_col and target_col in result["df"].columns:
            post_filter_count -= 1

        total_filtered = pre_filter_count - post_filter_count
        if verbose and total_filtered > 0:
            logger.info(
                f"Feature Filtering: {total_filtered} features removed "
                f"({pre_filter_count} → {post_filter_count})"
            )

        # ── Automatic PCA if feature count exceeds threshold ─────
        pca_applied = False
        pca_model = None
        pre_pca_feature_count = len(result["df"].columns)
        if target_col and target_col in result["df"].columns:
            pre_pca_feature_count -= 1

        if pre_pca_feature_count > FEATURE_THRESHOLD:
            if verbose:
                logger.info(
                    f"Feature count ({pre_pca_feature_count}) exceeds threshold "
                    f"({FEATURE_THRESHOLD}). Applying PCA..."
                )
            result["df"], pca_model = apply_pca(
                result["df"], target_column=target_col
            )
            if pca_model is not None:
                pca_applied = True
                if verbose:
                    logger.info(
                        f"PCA reduced features to {pca_model.n_components_} components "
                        f"(variance retained: {pca_model.explained_variance_ratio_.sum():.4f})"
                    )
        else:
            if verbose:
                logger.info(
                    f"Feature count ({pre_pca_feature_count}) within threshold "
                    f"({FEATURE_THRESHOLD}). PCA skipped."
                )

        # Calculate final feature count
        final_feature_count = len(result["df"].columns)
        if target_col and target_col in result["df"].columns:
            final_feature_count -= 1

        engineered_feature_count = len(result["all_new_features"])

        # Store metadata for later retrieval
        self._last_metadata = {
            "feature_engineering_enabled": True,
            "original_feature_count": original_feature_count,
            "engineered_feature_count": engineered_feature_count,
            "final_feature_count": final_feature_count,
            "new_features": result["all_new_features"],
            "successful_transformations": result["successful_transformations"],
            "failed_transformations": result["failed_transformations"],
            "column_types": column_types,
            "execution_details": result["execution_details"],
            "pca_applied": pca_applied,
            "pre_pca_feature_count": pre_pca_feature_count,
        }

        # Log summary
        if verbose:
            logger.info("=" * 60)
            logger.info("Feature Engineering Pipeline Complete")
            logger.info("=" * 60)
            logger.info(f"Original features: {original_feature_count}")
            logger.info(f"New features created: {engineered_feature_count}")
            logger.info(f"Final feature count: {final_feature_count}")
            logger.info(
                f"Successful transformations: {len(result['successful_transformations'])}"
            )
            logger.info(
                f"Failed transformations: {len(result['failed_transformations'])}"
            )

            if result["failed_transformations"]:
                logger.warning(
                    f"Failed transformers: {', '.join(result['failed_transformations'])}"
                )

            logger.info("=" * 60)

        # Return transformed dataframe
        return result["df"]

    def get_metadata(self) -> Dict:
        """
        Get metadata from the last apply() call.

        Returns
        -------
        Dict
            Metadata from feature engineering execution
        """
        if self._last_metadata is None:
            return {
                "feature_engineering_enabled": False,
                "original_feature_count": 0,
                "engineered_feature_count": 0,
                "final_feature_count": 0,
                "new_features": [],
                "successful_transformations": [],
                "failed_transformations": [],
            }
        return self._last_metadata

    def get_feature_metadata(self, result: Dict = None) -> Dict:
        """
        Extract feature engineering metadata for model storage.
        Kept for backward compatibility.

        Parameters
        ----------
        result : Dict, optional
            Result from apply() method (if None, uses last metadata)

        Returns
        -------
        Dict
            Metadata for model storage
        """
        if result is None:
            return self.get_metadata()

        return {
            "feature_engineering_enabled": True,
            "engineered_features": result.get("new_features", []),
            "original_feature_count": result.get("original_feature_count", 0),
            "engineered_feature_count": result.get("engineered_feature_count", 0),
            "final_feature_count": result.get("final_feature_count", 0),
            "successful_transformations": result.get("successful_transformations", []),
            "failed_transformations": result.get("failed_transformations", []),
        }
