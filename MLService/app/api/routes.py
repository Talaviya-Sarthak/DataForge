from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Query
from fastapi.responses import StreamingResponse
import pandas as pd
import json
import io

from app.data.loader import load_Data
from app.data.preview import preview_Data
from app.data.stats import dataset_stats
from app.preprocessings.pipeline import PreprocessingPipeline

router = APIRouter()

# ── In-memory RAW dataset storage ─────────────────────────────
# Key: "u{user_id}_d{dataset_id}" → pd.DataFrame
# Stores ONLY the raw (unprocessed) dataset.
# No disk cache, no pickle persistence.
# Lost on restart — user must re-upload.
_RAW_STORE: dict[str, pd.DataFrame] = {}


def _key(user_id: int, dataset_id: int = 0) -> str:
    return f"u{user_id}_d{dataset_id}"


def _get_raw(user_id: int, dataset_id: int = 0) -> pd.DataFrame | None:
    return _RAW_STORE.get(_key(user_id, dataset_id))


def _set_raw(user_id: int, dataset_id: int, df: pd.DataFrame):
    _RAW_STORE[_key(user_id, dataset_id)] = df


def _classify_columns(df: pd.DataFrame):
    numeric_cols, categorical_cols = [], []
    for col in df.columns:
        series = df[col].dropna()
        sample = series.iloc[0] if not series.empty else None
        if isinstance(sample, (int, float)):
            numeric_cols.append(col)
        else:
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