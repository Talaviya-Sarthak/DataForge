from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import StreamingResponse
import pandas as pd
import json
import io
from typing import Optional

from app.data.loader import load_Data
from app.data.preview import preview_Data
from app.data.stats import dataset_stats
from app.preprocessings.Preprocessing_pipeline import PreprocessingPipeline
from app.feature_engineering.Feature_engineering_pipeline import FeatureEngineeringService

router = APIRouter()

# ─────────────────────────────────────────────
# PER-USER, PER-DATASET IN-MEMORY STORAGE
# Structure: { user_id: { dataset_id: { "raw": DataFrame, "working": DataFrame } } }
# - "raw" is NEVER mutated until finalize
# - "working" is rebuilt from raw + steps on every operation
# - Lost on crash => user must re-upload + rebuild from DB steps
# ─────────────────────────────────────────────
USER_DATASETS: dict[int, dict[int, dict[str, pd.DataFrame]]] = {}

# Default dataset_id for backward-compatible calls (no dataset_id provided)
_DEFAULT_DS_ID = 0


def _ds_key(user_id: int, dataset_id: int | None) -> tuple[int, int]:
    """Resolve user_id + dataset_id with fallback to default."""
    return (user_id, dataset_id if dataset_id is not None else _DEFAULT_DS_ID)


def get_user_dataset(user_id: int, dataset_id: int | None = None) -> pd.DataFrame | None:
    """Get **working** dataset from memory (backward-compatible)."""
    uid, did = _ds_key(user_id, dataset_id)
    user_store = USER_DATASETS.get(uid, {})
    ds = user_store.get(did)
    if ds is not None:
        return ds.get("working")
    return None


def get_user_raw_dataset(user_id: int, dataset_id: int | None = None) -> pd.DataFrame | None:
    """Get **raw** (unmutated) dataset from memory."""
    uid, did = _ds_key(user_id, dataset_id)
    user_store = USER_DATASETS.get(uid, {})
    ds = user_store.get(did)
    if ds is not None:
        return ds.get("raw")
    return None


def set_user_dataset(user_id: int, df: pd.DataFrame, dataset_id: int | None = None):
    """Store both raw and working copies. Used on initial upload."""
    uid, did = _ds_key(user_id, dataset_id)
    if uid not in USER_DATASETS:
        USER_DATASETS[uid] = {}
    USER_DATASETS[uid][did] = {
        "raw": df.copy(),
        "working": df.copy(),
    }


def update_working_dataset(user_id: int, df: pd.DataFrame, dataset_id: int | None = None):
    """Update only the working copy (after rebuild). Raw stays untouched."""
    uid, did = _ds_key(user_id, dataset_id)
    if uid in USER_DATASETS and did in USER_DATASETS[uid]:
        USER_DATASETS[uid][did]["working"] = df
    else:
        # Fallback: store as both if slot missing
        set_user_dataset(user_id, df, dataset_id)


def finalize_dataset_in_memory(user_id: int, dataset_id: int | None = None):
    """On finalize: raw = working.copy(). After this, download returns processed."""
    uid, did = _ds_key(user_id, dataset_id)
    if uid in USER_DATASETS and did in USER_DATASETS[uid]:
        working = USER_DATASETS[uid][did].get("working")
        if working is not None:
            USER_DATASETS[uid][did]["raw"] = working.copy()


def clear_dataset_in_memory(user_id: int, dataset_id: int | None = None):
    """Remove a dataset from in-memory storage (used on failed schema validation)."""
    uid, did = _ds_key(user_id, dataset_id)
    if uid in USER_DATASETS and did in USER_DATASETS[uid]:
        del USER_DATASETS[uid][did]


def _classify_columns(df: pd.DataFrame):
    """Classify columns into numeric and categorical (shared helper)."""
    numeric_cols = []
    categorical_cols = []
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            numeric_cols.append(col)
        else:
            categorical_cols.append(col)
    return numeric_cols, categorical_cols


def normalize_step(step, step_index=0):
    """Defensive normalization of preprocessing step"""
    # If step is string, parse to dict
    if isinstance(step, str):
        try:
            step = json.loads(step)
        except json.JSONDecodeError:
            raise ValueError(f"Step {step_index}: Invalid JSON string")
    
    # Validate step is dict
    if not isinstance(step, dict):
        raise ValueError(f"Step {step_index}: Must be dict, got {type(step)}")
    
    # Ensure params is dict
    if "params" in step and isinstance(step["params"], str):
        try:
            step["params"] = json.loads(step["params"])
        except json.JSONDecodeError:
            raise ValueError(f"Step {step_index}: Invalid params JSON")
    
    return step


# ─────────────────────────────────────────────
# DATA UPLOAD (BACKWARD-COMPATIBLE RESPONSE)
# ─────────────────────────────────────────────
@router.post("/data/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    user_id: int = Form(...),
    dataset_id: Optional[int] = Form(None),
):
    """
    Upload dataset for preview + metadata.
    Stores raw + working copies in memory.
    Response format matches OLD frontend contract.
    """
    print(f"📥 Upload for user_id={user_id}, dataset_id={dataset_id}")
    
    try:
        df = load_Data(file)
        df = df.replace([float("inf"), float("-inf")], None)

        # Store both raw and working copies
        set_user_dataset(user_id, df, dataset_id)
        print(f"✅ Dataset saved for user {user_id} (dataset_id={dataset_id})")

        preview = preview_Data(df, n=20)
        stats = dataset_stats(df)

        column_names = preview["columns"]
        numeric_cols, categorical_cols = _classify_columns(df)

        # 🔒 RESPONSE SHAPE MATCHES OLD API
        return {
            "data": preview["rows"],
            "rows": len(df),
            "columns": len(column_names),
            "numerical_columns": numeric_cols,
            "categorical_columns": categorical_cols,
            "statistics": stats,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─────────────────────────────────────────────
# DATA PREPROCESS (DYNAMIC PIPELINE)
# ─────────────────────────────────────────────
@router.post("/data/preprocess")
async def preprocess_dataset(payload: dict):
    """
    Execute preprocessing pipeline on uploaded dataset.

    When `rebuild_from_raw` is True:
      - Always starts from the raw (unmutated) dataset copy.
      - Applies ALL supplied steps deterministically.
      - Updates only the working copy.
    When False (default / backward-compat):
      - Works on the current working dataset (legacy behavior).
    """
    user_id = payload.get("user_id", 0)
    dataset_id = payload.get("dataset_id", None)
    rebuild_from_raw = payload.get("rebuild_from_raw", False)

    print(f"🧹 Preprocess for user_id={user_id}, dataset_id={dataset_id}, rebuild={rebuild_from_raw}")

    # Choose source dataframe
    if rebuild_from_raw:
        df = get_user_raw_dataset(user_id, dataset_id)
        source_label = "raw"
    else:
        df = get_user_dataset(user_id, dataset_id)
        source_label = "working"

    if df is None:
        print(f"❌ No {source_label} dataset found for user {user_id}")
        raise HTTPException(
            status_code=400,
            detail="No dataset uploaded. Please upload a dataset first.",
        )

    print(f"✅ Using {source_label} dataset for user {user_id} with {len(df)} rows")

    try:
        # Defensive normalization of steps
        if "steps" in payload and isinstance(payload["steps"], list):
            normalized_steps = []
            for i, step in enumerate(payload["steps"]):
                try:
                    normalized_steps.append(normalize_step(step, i))
                except ValueError as e:
                    raise HTTPException(status_code=400, detail=str(e))
            payload["steps"] = normalized_steps

        steps = payload.get("steps", [])
        start_index = payload.get("start_index", 0)
        stop_index = payload.get("stop_index")
        preview_rows = payload.get("preview_rows", 20)

        pipeline = PreprocessingPipeline(steps=steps)

        # Pipeline.run() always works on a copy internally
        processed_df = pipeline.run(
            df=df,
            start_index=start_index,
            stop_index=stop_index,
        )

        # Update working copy only (raw stays untouched)
        update_working_dataset(user_id, processed_df, dataset_id)

        preview = preview_Data(processed_df, n=preview_rows)
        stats = dataset_stats(processed_df)

        numeric_cols, categorical_cols = _classify_columns(processed_df)

        return {
            "data": preview["rows"],
            "rows": len(processed_df),
            "columns": len(list(processed_df.columns)),
            "numerical_columns": numeric_cols,
            "categorical_columns": categorical_cols,
            "statistics": stats,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Data Preprocessing error: {str(e)}")
        print(f"Payload: {payload}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ─────────────────────────────────────────────
# FEATURE ENGINEERING (DYNAMIC PIPELINE)
# ─────────────────────────────────────────────
@router.post("/data/feature-engineering")
async def feature_engineering_dataset(payload: dict):
    """
    Execute feature engineering pipeline on uploaded dataset.
    """
    user_id = payload.get("user_id", 0)
    dataset_id = payload.get("dataset_id", None)
    print(f"🔧 Feature Engineering for user_id={user_id}, dataset_id={dataset_id}")
    
    # Get user's working dataset
    df = get_user_dataset(user_id, dataset_id)
    
    if df is None:
        print(f"❌ No dataset found for user {user_id}")
        raise HTTPException(status_code=400, detail="No dataset uploaded. Please upload a dataset first.")
    
    print(f"✅ Found dataset for user {user_id} with {len(df)} rows")

    try:
        # Defensive normalization of steps
        if "steps" in payload and isinstance(payload["steps"], list):
            normalized_steps = []
            for i, step in enumerate(payload["steps"]):
                try:
                    normalized_steps.append(normalize_step(step, i))
                except ValueError as e:
                    raise HTTPException(status_code=400, detail=str(e))
            payload["steps"] = normalized_steps

        steps = payload.get("steps", [])
        start_index = payload.get("start_index", 0)
        stop_index = payload.get("stop_index")
        preview_rows = payload.get("preview_rows", 20)

        pipeline = FeatureEngineeringService()
        processed_df = pipeline.apply(df)

        # Update working only
        update_working_dataset(user_id, processed_df, dataset_id)

        preview = preview_Data(processed_df, n=preview_rows)
        stats = dataset_stats(processed_df)

        numeric_cols, categorical_cols = _classify_columns(processed_df)

        return {
            "data": preview["rows"],
            "rows": len(processed_df),
            "columns": len(list(processed_df.columns)),
            "numerical_columns": numeric_cols,
            "categorical_columns": categorical_cols,
            "statistics": stats,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Feature Engineering Error: {str(e)}")
        print(f"Payload: {payload}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ─────────────────────────────────────────────
# FINALIZE – raw = working
# ─────────────────────────────────────────────
@router.post("/data/finalize")
async def finalize(payload: dict):
    """Mark dataset as finalized: raw ← working copy."""
    user_id = payload.get("user_id", 0)
    dataset_id = payload.get("dataset_id", None)

    working = get_user_dataset(user_id, dataset_id)
    if working is None:
        raise HTTPException(status_code=400, detail="No dataset in memory to finalize.")

    finalize_dataset_in_memory(user_id, dataset_id)
    return {"success": True, "message": "Dataset finalized. Raw now equals processed."}


# ─────────────────────────────────────────────
# CLEAR – remove dataset from memory
# ─────────────────────────────────────────────
@router.post("/data/clear")
async def clear_dataset(payload: dict):
    """Remove a dataset from in-memory storage (e.g. on failed schema validation)."""
    user_id = payload.get("user_id", 0)
    dataset_id = payload.get("dataset_id", None)
    clear_dataset_in_memory(user_id, dataset_id)
    return {"success": True, "message": "Dataset cleared from memory."}


# ─────────────────────────────────────────────
# DOWNLOAD – stream CSV of raw or working
# ─────────────────────────────────────────────
@router.post("/data/download")
async def download_dataset(payload: dict):
    """
    Return the full dataset as CSV.
    If finalized=True  → returns raw (which IS the processed data post-finalize).
    If finalized=False → returns working dataset (current in-progress state).
    """
    user_id = payload.get("user_id", 0)
    dataset_id = payload.get("dataset_id", None)
    finalized = payload.get("finalized", False)

    if finalized:
        df = get_user_raw_dataset(user_id, dataset_id)  # post-finalize raw == processed
    else:
        df = get_user_dataset(user_id, dataset_id)       # working (in-progress) dataset

    if df is None:
        raise HTTPException(status_code=400, detail="No dataset in memory. Please upload first.")

    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)

    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=dataset.csv"},
    )


# ─────────────────────────────────────────────
# SCHEMA VALIDATE – check if re-uploaded file
# is compatible with existing pipeline steps
# ─────────────────────────────────────────────
@router.post("/data/validate-schema")
async def validate_schema(payload: dict):
    """
    Validate that the dataset in memory has the required columns.
    Used during resume flow before replaying steps.
    """
    user_id = payload.get("user_id", 0)
    dataset_id = payload.get("dataset_id", None)
    required_columns = payload.get("required_columns", [])

    df = get_user_raw_dataset(user_id, dataset_id)
    if df is None:
        raise HTTPException(status_code=400, detail="No dataset in memory.")

    actual_columns = list(df.columns)
    missing = [c for c in required_columns if c not in actual_columns]

    if missing:
        return {
            "valid": False,
            "missing_columns": missing,
            "message": f"Schema mismatch: columns {missing} not found in uploaded dataset.",
        }

    return {"valid": True, "missing_columns": [], "message": "Schema compatible."}