from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import json

from app.data.loader import load_Data
from app.data.preview import preview_Data
from app.data.stats import dataset_stats
from app.preprocessings.pipeline import PreprocessingPipeline

router = APIRouter()

# ⚠️ TEMP ONLY (dev mode)
CURRENT_DATASET: pd.DataFrame | None = None


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
async def upload_dataset(file: UploadFile = File(...)):
    """
    Upload dataset for preview + metadata.
    Response format matches OLD frontend contract.
    """
    global CURRENT_DATASET

    try:
        df = load_Data(file)
        df = df.replace([float("inf"), float("-inf")], None)

        CURRENT_DATASET = df

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
    global CURRENT_DATASET
    
    if CURRENT_DATASET is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded. Please upload a dataset first.")

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
            df=CURRENT_DATASET,
            start_index=start_index,
            stop_index=stop_index
        )

        # Persist cleaned data so future operations build on it
        CURRENT_DATASET = processed_df

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
        print(f"ML Service Error: {str(e)}")
        print(f"Payload: {payload}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
