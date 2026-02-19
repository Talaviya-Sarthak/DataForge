"""
Feature Engineering Module
===========================

Production-grade, fault-tolerant feature engineering system.

This module provides automatic feature engineering capabilities with:
- Full fault tolerance (individual transformer failures don't crash pipeline)
- Modular architecture (each transformer isolated)
- Deterministic behavior
- Backend-only execution (no frontend control)
- Training/prediction compatibility
"""

from .feature_engineering_service import FeatureEngineeringService

__all__ = ["FeatureEngineeringService"]
