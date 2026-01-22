import pandas as pd

from .missing_values import ColumnWiseMissingValueImputer
from .encoding import EncodingValue
from .scaling import ScalingValues
from .outliers import HandlingOutliers
from .feature_selection import FeatureSelection
from .imbalance import HandlingImbalance


class PreprocessingPipeline:
    def __init__(
        self,
        missing_value_steps: list = None,
        outlier_steps: list = None,
        encoding_steps: list = None,
        scaling_steps: list = None,
        feature_selection_steps: list = None,
        imbalance_steps: list = None,
    ):
        """
        Each argument is a list of transformation dicts
        """

        self.missing_value_steps = missing_value_steps or []
        self.outlier_steps = outlier_steps or []
        self.encoding_steps = encoding_steps or []
        self.scaling_steps = scaling_steps or []
        self.feature_selection_steps = feature_selection_steps or []
        self.imbalance_steps = imbalance_steps or []

    def run(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Apply preprocessing steps in correct order
        """
        df = df.copy()

        # 1️⃣ Missing Value Imputation
        if self.missing_value_steps:
            df = ColumnWiseMissingValueImputer(self.missing_value_steps).apply(df)

        # 2️⃣ Outlier Handling
        if self.outlier_steps:
            df = HandlingOutliers(self.outlier_steps).apply(df)

        # 3️⃣ Encoding
        if self.encoding_steps:
            df = EncodingValue(self.encoding_steps).apply(df)

        # 4️⃣ Scaling
        if self.scaling_steps:
            df = ScalingValues(self.scaling_steps).apply(df)

        # 5️⃣ Feature Selection
        if self.feature_selection_steps:
            df = FeatureSelection(self.feature_selection_steps).apply(df)

        # 6️⃣ Imbalance Handling (TARGET BASED)
        if self.imbalance_steps:
            df = HandlingImbalance(self.imbalance_steps).apply(df)

        return df
