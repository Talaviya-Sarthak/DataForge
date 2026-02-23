import pandas as pd

from .value_standardization import ValueStandardization
from .missing_values import ColumnWiseMissingValueImputer
from .outliers import HandlingOutliers
from .encoding import EncodingValue
from .scaling import ScalingValues
from .feature_selection import FeatureSelection
from .imbalance import HandlingImbalance


class PreprocessingPipeline:
    """
    Fully dynamic, stateless, replayable preprocessing pipeline.

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

        # Unwrap { transformations: [...] } → [...]
        # Backend stores params as { transformations: [...] }, but each
        # handler class expects a flat list of transformation dicts.
        if isinstance(params, dict) and "transformations" in params:
            params = params["transformations"]

        if step_type == "value_standardization":
            return ValueStandardization(params).apply(df)

        elif step_type == "missing_values":
            return ColumnWiseMissingValueImputer(params).apply(df)

        elif step_type == "outliers":
            return HandlingOutliers(params).apply(df)

        elif step_type == "encoding":
            return EncodingValue(params).apply(df)

        elif step_type == "scaling":
            return ScalingValues(params).apply(df)

        elif step_type == "feature_selection":
            return FeatureSelection(params).apply(df)

        elif step_type == "imbalance":
            return HandlingImbalance(params).apply(df)

        else:
            raise ValueError(f"Unknown preprocessing step type: {step_type}")

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
