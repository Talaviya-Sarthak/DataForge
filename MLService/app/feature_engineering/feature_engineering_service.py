import pandas as pd
from typing import Dict, List, Any, Optional

from .numeric_features import ColumnWiseNumericFeatureEngineer
from .categorical_features import ColumnWiseCategoricalFeatureEngineer
from .datetime_features import ColumnWiseDatetimeFeatureEngineer
from .interaction_features import InteractionFeatureEngineer


class FeatureEngineeringService:

    def __init__(
        self,
        numeric_config: Optional[List[Dict]] = None,
        categorical_config: Optional[List[Dict]] = None,
        datetime_config: Optional[List[Dict]] = None,
        interaction_config: Optional[Dict] = None,
    ):

        self.numeric_engineer = ColumnWiseNumericFeatureEngineer(numeric_config or [])
        self.categorical_engineer = ColumnWiseCategoricalFeatureEngineer(categorical_config or [])
        self.datetime_engineer = ColumnWiseDatetimeFeatureEngineer(datetime_config or [])
        self.interaction_engineer = InteractionFeatureEngineer(interaction_config or {})

        self.metadata = {
            "original_features": [],
            "engineered_features": [],
            "total_features_original": 0,
            "total_features_after": 0,
            "total_features_added": 0,
        }

    def apply(
        self,
        df: pd.DataFrame,
        exclude_columns: Optional[List[str]] = None,
    ) -> pd.DataFrame:

        df = df.copy()
        exclude_columns = exclude_columns or []

        self.metadata["original_features"] = list(df.columns)
        self.metadata["total_features_original"] = len(df.columns)

        # Apply numeric features
        df = self.numeric_engineer.apply(df)

        # Apply categorical features
        df = self.categorical_engineer.apply(df)

        # Apply datetime features
        df = self.datetime_engineer.apply(df)

        # Apply interaction features
        df = self.interaction_engineer.apply(df)

        # Update metadata
        self.metadata["total_features_after"] = len(df.columns)
        self.metadata["total_features_added"] = (
            self.metadata["total_features_after"]
            - self.metadata["total_features_original"]
        )

        self.metadata["engineered_features"] = list(
            set(df.columns) - set(self.metadata["original_features"])
        )

        return df

    def get_metadata(self) -> Dict[str, Any]:
        return self.metadata.copy()

    def get_engineered_features(self) -> List[str]:
        return self.metadata["engineered_features"].copy()

    def get_feature_count_increase(self) -> int:
        return self.metadata["total_features_added"]
