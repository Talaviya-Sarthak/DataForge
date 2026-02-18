import pandas as pd

from .numeric_features import ColumnWiseNumericFeatureEngineer
from .datetime_features import ColumnWiseDatetimeFeatureEngineer
from .categorical_features import ColumnWiseCategoricalFeatureEngineer
from .interaction_features import InteractionFeatureEngineer


class FeatureEngineeringPipeline:
    """
    Fully dynamic, stateless, replayable feature engineering pipeline.

    - Supports undo / redo
    - Supports resume after logout / crash
    - Supports preview at any step
    """

    def __init__(self, steps: list[dict]):
        """
        steps: list of step definitions

        Each step:
        {
            "step_index": int,
            "type": str,
            "params": dict | list
        }
        """
        self.steps = sorted(steps, key=lambda x: x["step_index"])

    # ─────────────────────────────────────────────
    # INTERNAL STEP DISPATCHER
    # ─────────────────────────────────────────────
    def _apply_step(self, df: pd.DataFrame, step: dict) -> pd.DataFrame:
        step_type = step["type"]
        params = step.get("params", [])

        if step_type == "numeric_features":
            return ColumnWiseNumericFeatureEngineer(params).apply(df)

        elif step_type == "datetime_features":
            return ColumnWiseDatetimeFeatureEngineer(params).apply(df)

        elif step_type == "categorical_features":
            return ColumnWiseCategoricalFeatureEngineer(params).apply(df)

        elif step_type == "interaction_features":
            return InteractionFeatureEngineer(params).apply(df)

        else:
            raise ValueError(f"Unknown feature engineering step type: {step_type}")

    # ─────────────────────────────────────────────
    # PIPELINE EXECUTION
    # ─────────────────────────────────────────────
    def run(
        self,
        df: pd.DataFrame,
        *,
        start_index: int = 0,
        stop_index: int | None = None,
        preview_rows: int | None = None,
    ) -> pd.DataFrame:
        """
        Execute pipeline dynamically.

        start_index  → resume / redo
        stop_index   → undo / preview
        preview_rows → return head(n) rows only
        """

        # Always work on a copy of raw dataset
        df = df.copy()

        for step in self.steps:
            idx = step["step_index"]

            if idx < start_index:
                continue

            df = self._apply_step(df, step)

            if stop_index is not None and idx == stop_index:
                break

        if preview_rows is not None:
            return df.head(preview_rows)

        return df
