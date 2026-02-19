"""
Base Transformer
================

Abstract base class for all feature transformers.

All feature engineering transformers must inherit from this class
and implement the apply() method.
"""

from abc import ABC, abstractmethod
from typing import Dict, List
import pandas as pd


class BaseFeatureTransformer(ABC):
    """
    Abstract base class for feature transformers.

    All transformers must implement the apply() method which returns
    a dictionary containing the transformed dataframe and list of new features.
    """

    def __init__(self):
        """Initialize the transformer with a name."""
        self.name = self.__class__.__name__

    @abstractmethod
    def apply(self, df: pd.DataFrame, target_column: str = None) -> Dict:
        """
        Apply feature transformation to the dataframe.

        Parameters
        ----------
        df : pd.DataFrame
            The input dataframe to transform
        target_column : str, optional
            The target column name (should not be modified)

        Returns
        -------
        Dict
            Dictionary containing:
            - "df": pd.DataFrame - The transformed dataframe
            - "new_features": List[str] - List of newly created feature names

        Notes
        -----
        - Must NOT modify the target column
        - Should only add new features, not replace existing ones
        - Must handle errors gracefully
        - Should be deterministic
        """
        pass

    def get_name(self) -> str:
        """Get the transformer name."""
        return self.name

    def __repr__(self) -> str:
        return f"{self.name}"
