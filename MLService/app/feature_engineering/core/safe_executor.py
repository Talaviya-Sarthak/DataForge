"""
Safe Executor
=============

Fault-tolerant execution wrapper for feature transformers.

This module ensures that individual transformer failures do NOT crash
the entire pipeline. Each transformer is executed in isolation with
comprehensive error handling.
"""

import logging
from typing import Dict, List
import pandas as pd
from .base_transformer import BaseFeatureTransformer

logger = logging.getLogger(__name__)


class SafeExecutor:
    """
    Executes feature transformers with fault tolerance.

    If a transformer fails, the error is logged and the pipeline continues
    with the next transformer. The original dataframe is returned unchanged
    for failed transformations.
    """

    @staticmethod
    def execute(
        transformer: BaseFeatureTransformer, df: pd.DataFrame, target_column: str = None
    ) -> Dict:
        """
        Safely execute a feature transformer.

        Parameters
        ----------
        transformer : BaseFeatureTransformer
            The transformer to execute
        df : pd.DataFrame
            The input dataframe
        target_column : str, optional
            The target column name

        Returns
        -------
        Dict
            Dictionary containing:
            - "df": pd.DataFrame - Transformed dataframe (or original if failed)
            - "new_features": List[str] - New feature names (empty if failed)
            - "status": str - "success" or "failed"
            - "error": str or None - Error message if failed
            - "transformer_name": str - Name of the transformer
        """
        transformer_name = transformer.get_name()

        try:
            # Execute the transformer
            result = transformer.apply(df, target_column=target_column)

            # Validate result structure
            if not isinstance(result, dict):
                raise ValueError(
                    f"Transformer {transformer_name} must return a dictionary"
                )

            if "df" not in result:
                raise ValueError(
                    f"Transformer {transformer_name} result must contain 'df' key"
                )

            if "new_features" not in result:
                raise ValueError(
                    f"Transformer {transformer_name} result must contain 'new_features' key"
                )

            transformed_df = result["df"]
            new_features = result["new_features"]

            # Validate dataframe
            if not isinstance(transformed_df, pd.DataFrame):
                raise ValueError(
                    f"Transformer {transformer_name} must return a DataFrame in 'df' key"
                )

            # Validate new_features
            if not isinstance(new_features, list):
                raise ValueError(
                    f"Transformer {transformer_name} must return a list in 'new_features' key"
                )

            # Check that all new features exist in the dataframe
            for feature in new_features:
                if feature not in transformed_df.columns:
                    logger.warning(
                        f"Transformer {transformer_name} claimed to create feature '{feature}' "
                        f"but it's not in the dataframe"
                    )

            logger.info(
                f"✓ {transformer_name} succeeded: created {len(new_features)} new features"
            )

            return {
                "df": transformed_df,
                "new_features": new_features,
                "status": "success",
                "error": None,
                "transformer_name": transformer_name,
            }

        except Exception as e:
            # Log the failure but don't crash the pipeline
            error_msg = str(e)
            logger.warning(f"✗ {transformer_name} failed: {error_msg}")

            # Return original dataframe unchanged
            return {
                "df": df,
                "new_features": [],
                "status": "failed",
                "error": error_msg,
                "transformer_name": transformer_name,
            }

    @staticmethod
    def execute_batch(
        transformers: List[BaseFeatureTransformer],
        df: pd.DataFrame,
        target_column: str = None,
    ) -> Dict:
        """
        Execute multiple transformers sequentially with fault tolerance.

        Parameters
        ----------
        transformers : List[BaseFeatureTransformer]
            List of transformers to execute
        df : pd.DataFrame
            The input dataframe
        target_column : str, optional
            The target column name

        Returns
        -------
        Dict
            Dictionary containing:
            - "df": pd.DataFrame - Final transformed dataframe
            - "all_new_features": List[str] - All new features created
            - "successful_transformations": List[str] - Names of successful transformers
            - "failed_transformations": List[str] - Names of failed transformers
            - "execution_details": List[Dict] - Detailed results for each transformer
        """
        current_df = df.copy()
        all_new_features = []
        successful_transformations = []
        failed_transformations = []
        execution_details = []

        for transformer in transformers:
            result = SafeExecutor.execute(transformer, current_df, target_column)

            # Update dataframe with result (either transformed or original)
            current_df = result["df"]

            # Track new features
            all_new_features.extend(result["new_features"])

            # Track success/failure
            if result["status"] == "success":
                successful_transformations.append(result["transformer_name"])
            else:
                failed_transformations.append(result["transformer_name"])

            # Store execution details
            execution_details.append(
                {
                    "transformer": result["transformer_name"],
                    "status": result["status"],
                    "new_features_count": len(result["new_features"]),
                    "error": result["error"],
                }
            )

        return {
            "df": current_df,
            "all_new_features": all_new_features,
            "successful_transformations": successful_transformations,
            "failed_transformations": failed_transformations,
            "execution_details": execution_details,
        }
