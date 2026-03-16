"""
PCA Dimensionality Reduction
=============================

Automatically reduces feature dimensionality using PCA
when the number of features exceeds a configured threshold.

Preserves 95% of variance by default.
"""

import logging
import pandas as pd
import numpy as np
from sklearn.decomposition import PCA

logger = logging.getLogger(__name__)


def apply_pca(
    df: pd.DataFrame,
    target_column: str = None,
    variance_ratio: float = 0.95,
):
    """Apply PCA to reduce dimensionality while preserving variance.

    Args:
        df: Input DataFrame (features only, or features + target).
        target_column: If provided, this column is excluded from PCA
                       and re-attached after transformation.
        variance_ratio: Fraction of variance to retain (default 0.95).

    Returns:
        tuple: (transformed_df, pca_model)
            - transformed_df: DataFrame with PCA components (and target if provided).
            - pca_model: Fitted PCA instance for later use.
    """
    # Separate target if present
    target_series = None
    if target_column and target_column in df.columns:
        target_series = df[target_column].copy()
        df = df.drop(columns=[target_column])

    # Select only numeric columns for PCA
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    non_numeric_cols = [c for c in df.columns if c not in numeric_cols]

    if len(numeric_cols) < 2:
        logger.info("PCA skipped: fewer than 2 numeric features.")
        if target_series is not None:
            df[target_column] = target_series
        return df, None

    numeric_df = df[numeric_cols].fillna(0)

    # Fit PCA
    pca = PCA(n_components=variance_ratio)
    transformed = pca.fit_transform(numeric_df)

    n_components = transformed.shape[1]
    logger.info(
        f"PCA: {len(numeric_cols)} features → {n_components} components "
        f"(explained variance: {pca.explained_variance_ratio_.sum():.4f})"
    )

    # Build result DataFrame
    pca_columns = [f"PC{i+1}" for i in range(n_components)]
    pca_df = pd.DataFrame(transformed, columns=pca_columns, index=df.index)

    # Re-attach non-numeric columns
    if non_numeric_cols:
        pca_df = pd.concat([df[non_numeric_cols].reset_index(drop=True), pca_df.reset_index(drop=True)], axis=1)

    # Re-attach target
    if target_series is not None:
        pca_df[target_column] = target_series.values

    return pca_df, pca
