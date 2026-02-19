"""
Feature Registry
================

Central registry for all feature transformers.

This module maintains lists of all available transformers organized by type.
Transformers are registered here for automatic discovery and execution.
"""

from typing import List
from .base_transformer import BaseFeatureTransformer


class FeatureRegistry:
    """
    Registry for feature transformers.

    Maintains separate lists for numeric, categorical, and datetime transformers.
    Transformers are loaded lazily to avoid circular imports.
    """

    _numeric_transformers = None
    _categorical_transformers = None
    _datetime_transformers = None

    @classmethod
    def get_numeric_transformers(cls) -> List[BaseFeatureTransformer]:

        if cls._numeric_transformers is None:

            from ..numeric.interaction import InteractionTransformer
            from ..numeric.log_transform import LogTransformer
            from ..numeric.sqrt_transform import SqrtTransformer
            from ..numeric.binning import BinningTransformer
            from ..numeric.aggregation import AggregationTransformer

            cls._numeric_transformers = [
                InteractionTransformer(),  # 🔥 FIRST
                LogTransformer(),
                SqrtTransformer(),
                BinningTransformer(),
                AggregationTransformer(),  # 🔥 LAST
            ]

        return cls._numeric_transformers

    @classmethod
    def get_categorical_transformers(cls) -> List[BaseFeatureTransformer]:
        """
        Get all categorical feature transformers.

        Returns
        -------
        List[BaseFeatureTransformer]
            List of categorical transformers
        """
        if cls._categorical_transformers is None:
            # Import here to avoid circular dependencies
            from ..categorical.frequency_encoding import FrequencyEncodingTransformer
            from ..categorical.count_encoding import CountEncodingTransformer
            from ..categorical.cardinality import CardinalityTransformer

            cls._categorical_transformers = [
                FrequencyEncodingTransformer(),
                CountEncodingTransformer(),
                CardinalityTransformer(),
            ]

        return cls._categorical_transformers

    @classmethod
    def get_datetime_transformers(cls) -> List[BaseFeatureTransformer]:
        """
        Get all datetime feature transformers.

        Returns
        -------
        List[BaseFeatureTransformer]
            List of datetime transformers
        """
        if cls._datetime_transformers is None:
            # Import here to avoid circular dependencies
            from ..datetime.datetime_extractor import DatetimeExtractor

            cls._datetime_transformers = [DatetimeExtractor()]

        return cls._datetime_transformers

    @classmethod
    def get_all_transformers(cls) -> List[BaseFeatureTransformer]:
        """
        Get all transformers.

        Returns
        -------
        List[BaseFeatureTransformer]
            List of all transformers
        """
        return (
            cls.get_numeric_transformers()
            + cls.get_categorical_transformers()
            + cls.get_datetime_transformers()
        )

    @classmethod
    def reset(cls):
        """Reset the registry (useful for testing)."""
        cls._numeric_transformers = None
        cls._categorical_transformers = None
        cls._datetime_transformers = None
