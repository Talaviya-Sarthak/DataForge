import pandas as pd

from .value_standardization import ValueStandardization
from .missing_values import ColumnWiseMissingValueImputer
from .outliers import HandlingOutliers
from .encoding import EncodingValue
from .scaling import ScalingValues
from .feature_selection import FeatureSelection
from .imbalance import HandlingImbalance


class PreprocessingPipeline:
    def __init__(
        self,
        value_standardization_steps=None,
        missing_value_steps=None,
        outlier_steps=None,
        encoding_steps=None,
        scaling_steps=None,
        feature_selection_steps=None,
        imbalance_steps=None,
    ):
        self.value_standardization_steps = value_standardization_steps or []
        self.missing_value_steps = missing_value_steps or []
        self.outlier_steps = outlier_steps or []
        self.encoding_steps = encoding_steps or []
        self.scaling_steps = scaling_steps or []
        self.feature_selection_steps = feature_selection_steps or []
        self.imbalance_steps = imbalance_steps or []

    def run(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        if self.value_standardization_steps:
            df = ValueStandardization(
                self.value_standardization_steps
            ).apply(df)

        if self.missing_value_steps:
            df = ColumnWiseMissingValueImputer(
                self.missing_value_steps
            ).apply(df)

        if self.outlier_steps:
            df = HandlingOutliers(
                self.outlier_steps
            ).apply(df)

        if self.encoding_steps:
            df = EncodingValue(
                self.encoding_steps
            ).apply(df)

        if self.scaling_steps:
            df = ScalingValues(
                self.scaling_steps
            ).apply(df)

        if self.feature_selection_steps:
            df = FeatureSelection(
                self.feature_selection_steps
            ).apply(df)

        if self.imbalance_steps:
            df = HandlingImbalance(
                self.imbalance_steps
            ).apply(df)

        return df