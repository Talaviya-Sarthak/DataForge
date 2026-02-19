from fastapi import APIRouter, UploadFile, File, HTTPException, Form
import pandas as pd
import json
import pickle
import os
from pathlib import Path

from app.data.loader import load_Data
from app.data.preview import preview_Data
from app.data.stats import dataset_stats
from app.preprocessings.pipeline import PreprocessingPipeline
from app.feature_engineering.feature_engineering_service import FeatureEngineeringService

router = APIRouter()

# Cache directory
CACHE_DIR = Path("cache")
CACHE_DIR.mkdir(exist_ok=True)

# Per-user dataset storage
USER_DATASETS: dict[int, pd.DataFrame] = {}

def get_cache_file(user_id: int) -> Path:
    """Get cache file path for specific user"""
    return CACHE_DIR / f"dataset_user_{user_id}.pkl"

def save_dataset_cache(user_id: int, df: pd.DataFrame):
    """Save dataset to disk cache for specific user"""
    cache_file = get_cache_file(user_id)
    with open(cache_file, 'wb') as f:
        pickle.dump(df, f)

def load_dataset_cache(user_id: int) -> pd.DataFrame | None:
    """Load dataset from disk cache for specific user"""
    cache_file = get_cache_file(user_id)
    if cache_file.exists():
        try:
            with open(cache_file, 'rb') as f:
                return pickle.load(f)
        except:
            return None
    return None

def get_user_dataset(user_id: int) -> pd.DataFrame | None:
    """Get dataset for user from memory or cache"""
    if user_id in USER_DATASETS:
        return USER_DATASETS[user_id]
    
    # Try loading from cache
    cached = load_dataset_cache(user_id)
    if cached is not None:
        USER_DATASETS[user_id] = cached
    return cached

def set_user_dataset(user_id: int, df: pd.DataFrame):
    """Set dataset for user in memory and cache"""
    USER_DATASETS[user_id] = df
    save_dataset_cache(user_id, df)


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
async def upload_dataset(file: UploadFile = File(...), user_id: int = Form(...)):
    """
    Upload dataset for preview + metadata.
    Response format matches OLD frontend contract.
    """
    print(f"📥 Upload for user_id: {user_id}")
    
    try:
        df = load_Data(file)
        df = df.replace([float("inf"), float("-inf")], None)

        set_user_dataset(user_id, df)
        print(f"✅ Dataset saved for user {user_id}")

        preview = preview_Data(df, n=20)
        stats = dataset_stats(df)

        # Column names (internal)
        column_names = preview["columns"]

        # Lightweight type inference (UI only)
        numeric_cols = []
        categorical_cols = []

        for col in column_names:
            series = df[col].dropna()
            sample = series.iloc[0] if not series.empty else None

            if isinstance(sample, (int, float)):
                numeric_cols.append(col)
            else:
                categorical_cols.append(col)

        # 🔒 RESPONSE SHAPE MATCHES OLD API
        return {
            "data": preview["rows"],
            "rows": len(df),

            # IMPORTANT: number, not list
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
    """
    user_id = payload.get("user_id", 0)
    print(f"🧹 Preprocess for user_id: {user_id}")
    
    # Get user's dataset
    df = get_user_dataset(user_id)
    
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

        pipeline = PreprocessingPipeline(steps=steps)
        
        processed_df = pipeline.run(
            df=df,
            start_index=start_index,
            stop_index=stop_index
        )

        # Persist cleaned data so future operations build on it
        set_user_dataset(user_id, processed_df)

        preview = preview_Data(processed_df, n=preview_rows)
        stats = dataset_stats(processed_df)

        # Column type inference (same logic as upload)
        column_names = list(processed_df.columns)
        numeric_cols = []
        categorical_cols = []
        for col in column_names:
            series = processed_df[col].dropna()
            sample = series.iloc[0] if not series.empty else None
            if isinstance(sample, (int, float)):
                numeric_cols.append(col)
            else:
                categorical_cols.append(col)

        return {
            "data": preview["rows"],
            "rows": len(processed_df),
            "columns": len(column_names),
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
    print(f"🔧 Feature Engineering for user_id: {user_id}")
    
    # Get user's dataset
    df = get_user_dataset(user_id)
    
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

        # pipeline = FeatureEngineeringService(steps=steps)
        pipeline = FeatureEngineeringService()
        
        # processed_df = pipeline.run(
        #     df=df,
        #     start_index=start_index,
        #     stop_index=stop_index
        # )
        processed_df = pipeline.apply(df)
        # processed_df = fe_result["df"]


        # Persist engineered data
        set_user_dataset(user_id, processed_df)

        preview = preview_Data(processed_df, n=preview_rows)
        stats = dataset_stats(processed_df)

        # Column type inference
        column_names = list(processed_df.columns)
        numeric_cols = []
        categorical_cols = []
        for col in column_names:
            # series = processed_df[col].dropna()
            # sample = series.iloc[0] if not series.empty else None
            # if isinstance(sample, (int, float)):
            #     numeric_cols.append(col)
            # else:
            #     categorical_cols.append(col)
            if pd.api.types.is_numeric_dtype(processed_df[col]):
                numeric_cols.append(col)
            else:
                categorical_cols.append(col)

        return {
            "data": preview["rows"],
            "rows": len(processed_df),
            "columns": len(column_names),
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