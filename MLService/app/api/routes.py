from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Query
from fastapi.responses import StreamingResponse
import pandas as pd
import json
import io
from pandas.api.types import is_bool_dtype, is_datetime64_any_dtype, is_numeric_dtype

from app.data.loader import load_Data
from app.data.preview import preview_Data
from app.data.stats import dataset_stats
from app.data.persistence import (
    save_raw_to_disk,
    load_raw_from_disk,
    save_pipeline_to_disk,
    load_pipeline_from_disk,
)
from app.preprocessings.Preprocessing_pipeline import PreprocessingPipeline
from app.training.training_pipeline import run_training_pipeline
from app.feature_engineering.Feature_engineering_pipeline import FeatureEngineeringService
from app.tuning.hyperparameter_tuning import tune_top_models

router = APIRouter()

# ── In-memory RAW dataset storage ─────────────────────────────
# Key: "u{user_id}_d{dataset_id}" → pd.DataFrame
# Stores ONLY the raw (unprocessed) dataset.
# No disk cache, no pickle persistence.
# Lost on restart — user must re-upload.
_RAW_STORE: dict[str, pd.DataFrame] = {}

# ── In-memory PIPELINE dataset storage ────────────────────────
# Key: pipeline_id (str) → pd.DataFrame
# Stores finalized (preprocessed) datasets ready for ML training.
# Populated by the /pipeline/finalize endpoint.
PIPELINE_DATASETS: dict[str, pd.DataFrame] = {}


def _key(user_id: int, dataset_id: int = 0) -> str:
    return f"u{user_id}_d{dataset_id}"


def _get_raw(user_id: int, dataset_id: int = 0) -> pd.DataFrame | None:
    key = _key(user_id, dataset_id)
    df = _RAW_STORE.get(key)
    if df is None:
        # Fallback: try loading from disk
        df = load_raw_from_disk(key)
        if df is not None:
            _RAW_STORE[key] = df  # Re-populate memory
    return df


def _set_raw(user_id: int, dataset_id: int, df: pd.DataFrame):
    key = _key(user_id, dataset_id)
    _RAW_STORE[key] = df
    save_raw_to_disk(key, df)  # Persist to disk as fallback


def _detect_column_kind(series: pd.Series) -> str:
    """
    Detect a column kind using robust coercion rules.

    Returns one of: numeric | datetime | boolean | categorical
    """
    non_null = series.dropna()
    if non_null.empty:
        return "categorical"

    # Native pandas dtypes first.
    if is_bool_dtype(series):
        return "boolean"
    if is_datetime64_any_dtype(series):
        return "datetime"
    if is_numeric_dtype(series):
        return "numeric"

    as_text = non_null.astype(str).str.strip()
    if as_text.empty:
        return "categorical"

    lowered = as_text.str.lower()

    # Boolean-like text or binary values.
    boolean_tokens = {"true", "false", "yes", "no", "y", "n", "t", "f", "0", "1"}
    if lowered.isin(boolean_tokens).mean() >= 0.8:
        return "boolean"

    # Datetime-like strings.
    dt_coerced = pd.to_datetime(as_text, errors="coerce")
    if dt_coerced.notna().mean() >= 0.8:
        return "datetime"

    # Numeric-like strings (handles values like "1,234.5").
    numeric_coerced = pd.to_numeric(
        as_text.str.replace(",", "", regex=False), errors="coerce"
    )
    if numeric_coerced.notna().mean() >= 0.8:
        return "numeric"

    return "categorical"


def _classify_columns(df: pd.DataFrame):
    numeric_cols, categorical_cols = [], []

    for col in df.columns:
        kind = _detect_column_kind(df[col])
        if kind == "numeric":
            numeric_cols.append(col)
        else:
            # Keep response structure unchanged: non-numeric columns remain categorical bucket.
            categorical_cols.append(col)

    return numeric_cols, categorical_cols


def _build_response(df: pd.DataFrame, preview_rows: int = 20) -> dict:
    preview = preview_Data(df, n=preview_rows)
    stats = dataset_stats(df)
    numeric_cols, categorical_cols = _classify_columns(df)
    return {
        "data": preview["rows"],
        "rows": len(df),
        "columns": len(df.columns),
        "numerical_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "statistics": stats,
    }


def normalize_step(step, step_index=0):
    if isinstance(step, str):
        try:
            step = json.loads(step)
        except json.JSONDecodeError:
            raise ValueError(f"Step {step_index}: Invalid JSON string")
    if not isinstance(step, dict):
        raise ValueError(f"Step {step_index}: Must be dict")
    if "params" in step and isinstance(step["params"], str):
        try:
            step["params"] = json.loads(step["params"])
        except json.JSONDecodeError:
            raise ValueError(f"Step {step_index}: Invalid params JSON")
    return step


# ─────────────────────────────────────────────
# DATA UPLOAD
# ─────────────────────────────────────────────
@router.post("/data/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    user_id: int = Form(...),
    dataset_id: int = Form(0),
):
    try:
        df = load_Data(file)
        df = df.replace([float("inf"), float("-inf")], None)

        _set_raw(user_id, dataset_id, df)

        resp = _build_response(df)
        resp["dataset_id"] = dataset_id
        return resp

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─────────────────────────────────────────────
# DATA PREPROCESS (REBUILD-BASED)
# ─────────────────────────────────────────────
@router.post("/data/preprocess")
async def preprocess_dataset(payload: dict):
    user_id = payload.get("user_id", 0)
    dataset_id = payload.get("dataset_id", 0)

    raw_df = _get_raw(user_id, dataset_id)
    if raw_df is None:
        raise HTTPException(
            status_code=400,
            detail="No dataset uploaded. Please upload a dataset first.",
        )

    try:
        if "steps" in payload and isinstance(payload["steps"], list):
            payload["steps"] = [
                normalize_step(s, i) for i, s in enumerate(payload["steps"])
            ]

        steps = payload.get("steps", [])
        start_index = payload.get("start_index", 0)
        stop_index = payload.get("stop_index")
        preview_rows = payload.get("preview_rows", 20)

        pipeline = PreprocessingPipeline(steps=steps)
        processed = pipeline.run(
            df=raw_df.copy(),
            start_index=start_index,
            stop_index=stop_index,
        )

        return _build_response(processed, preview_rows)

    except Exception as e:
        print(f"Data Preprocessing error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ─────────────────────────────────────────────
# FINALIZE
# ─────────────────────────────────────────────
@router.post("/data/finalize")
async def finalize_dataset(payload: dict):
    user_id = payload.get("user_id", 0)
    dataset_id = payload.get("dataset_id", 0)

    raw_df = _get_raw(user_id, dataset_id)
    if raw_df is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded.")

    try:
        steps = payload.get("steps", [])
        if steps:
            steps = [normalize_step(s, i) for i, s in enumerate(steps)]
            pipeline = PreprocessingPipeline(steps=steps)
            processed = pipeline.run(df=raw_df.copy(), start_index=0)
        else:
            processed = raw_df.copy()

        _set_raw(user_id, dataset_id, processed)
        return _build_response(processed)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# DOWNLOAD
# ─────────────────────────────────────────────
@router.get("/data/download")
async def download_dataset(
    user_id: int = Query(...),
    dataset_id: int = Query(0),
):
    df = _get_raw(user_id, dataset_id)
    if df is None:
        raise HTTPException(status_code=400, detail="No dataset found.")

    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)

    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="dataset_{dataset_id}.csv"'
        },
    )


@router.post("/data/download")
async def download_dataset_with_steps(payload: dict):
    user_id = payload.get("user_id", 0)
    dataset_id = payload.get("dataset_id", 0)

    raw_df = _get_raw(user_id, dataset_id)
    if raw_df is None:
        raise HTTPException(status_code=400, detail="No dataset found.")

    try:
        steps = payload.get("steps", [])
        if steps:
            steps = [normalize_step(s, i) for i, s in enumerate(steps)]
            pipeline = PreprocessingPipeline(steps=steps)
            df = pipeline.run(df=raw_df.copy(), start_index=0)
        else:
            df = raw_df.copy()

        buf = io.StringIO()
        df.to_csv(buf, index=False)
        buf.seek(0)

        return StreamingResponse(
            iter([buf.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="dataset_{dataset_id}.csv"'
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# PIPELINE FINALIZE (for training)
# ─────────────────────────────────────────────
@router.post("/pipeline/finalize")
async def finalize_pipeline(payload: dict):
    """Finalize a preprocessing pipeline and store its dataset for training.

    Expects:
        pipeline_id (str): Unique pipeline identifier.
        user_id (int): Owner of the source dataset.
        dataset_id (int, optional): Defaults to 0.
        steps (list, optional): Preprocessing steps to replay.

    The resulting DataFrame is stored in ``PIPELINE_DATASETS[pipeline_id]``
    and is ready for the ``/train`` endpoint.
    """
    pipeline_id = payload.get("pipeline_id")
    if not pipeline_id:
        raise HTTPException(status_code=400, detail="pipeline_id is required.")

    user_id = payload.get("user_id", 0)
    dataset_id = payload.get("dataset_id", 0)

    raw_df = _get_raw(user_id, dataset_id)
    if raw_df is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded.")

    try:
        steps = payload.get("steps", [])
        if steps:
            steps = [normalize_step(s, i) for i, s in enumerate(steps)]
            pipeline = PreprocessingPipeline(steps=steps)
            processed = pipeline.run(df=raw_df.copy(), start_index=0)
        else:
            processed = raw_df.copy()

        PIPELINE_DATASETS[pipeline_id] = processed
        save_pipeline_to_disk(pipeline_id, processed)  # Persist to disk as fallback

        resp = _build_response(processed)
        resp["pipeline_id"] = pipeline_id
        return resp

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# ML TRAINING
# ─────────────────────────────────────────────
@router.post("/train")
async def train(payload: dict):
    """Train models on a finalized pipeline dataset.

    Expects:
        pipeline_id (str): Must already exist in ``PIPELINE_DATASETS``.
        task_type (str): ``"classification"`` or ``"regression"``.
        target_column (str): Name of the target column.

    Returns:
        dict: Leaderboard JSON sorted by primary metric.
    """
    pipeline_id = payload.get("pipeline_id")
    task_type = payload.get("task_type")
    target_column = payload.get("target_column")

    if not pipeline_id:
        raise HTTPException(status_code=400, detail="pipeline_id is required.")
    if not task_type:
        raise HTTPException(status_code=400, detail="task_type is required.")
    if not target_column:
        raise HTTPException(status_code=400, detail="target_column is required.")

    df = PIPELINE_DATASETS.get(pipeline_id)
    if df is None:
        # Fallback: try loading from disk
        df = load_pipeline_from_disk(pipeline_id)
        if df is not None:
            PIPELINE_DATASETS[pipeline_id] = df  # Re-populate memory
    if df is None:
        raise HTTPException(
            status_code=400,
            detail=f"No finalized dataset for pipeline '{pipeline_id}'. "
            f"Finalize the pipeline first via /pipeline/finalize.",
        )

    try:
        # ── Run feature engineering automatically ──────────
        fe_service = FeatureEngineeringService()
        engineered_df = fe_service.apply(
            df=df.copy(),
            target_column=target_column,
        )
        fe_metadata = fe_service.get_metadata()

        # ── Train models on engineered data ────────────────
        result = run_training_pipeline(
            df=engineered_df,
            pipeline_id=pipeline_id,
            task_type=task_type,
            target_column=target_column,
        )
        result["feature_engineering"] = fe_metadata
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Training error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
