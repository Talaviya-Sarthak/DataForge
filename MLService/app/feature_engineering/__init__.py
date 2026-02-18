"""
Feature Engineering Module

Provides automatic feature engineering transformations for numeric, categorical,
datetime, and interaction features.

Exports:
    - FeatureEngineeringService: Main controller for all feature engineering operations
"""

from .feature_engineering_service import FeatureEngineeringService
from .pipeline import FeatureEngineeringPipeline

__all__ = ["FeatureEngineeringService", "FeatureEngineeringPipeline"]
