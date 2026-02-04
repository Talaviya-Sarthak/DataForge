from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd

from app.data.loader import load_Data
from app.data.preview import preview_Data
from app.data.stats import dataset_stats
from app.preprocessings.pipeline import PreprocessingPipeline

router = APIRouter()

# ⚠️ TEMP ONLY (dev mode)
CURRENT_DATASET: pd.DataFrame | None = None


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
    Dynamic preprocessing pipeline.
    Response format matches OLD frontend contract.
    """
    global CURRENT_DATASET

    if CURRENT_DATASET is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded")

    try:
        steps = payload.get("steps", [])
        start_index = payload.get("start_index", 0)
        stop_index = payload.get("stop_index")
        preview_rows = payload.get("preview_rows", 20)

        pipeline = PreprocessingPipeline(steps=steps)

        processed_df = pipeline.run(
            df=CURRENT_DATASET,
            start_index=start_index,
            stop_index=stop_index,
            preview_rows=preview_rows,
        )

        preview = preview_Data(processed_df, n=preview_rows)

        # 🔒 RESPONSE SHAPE MATCHES OLD API
        return {
            "data": preview["rows"],
            "rows": len(processed_df),

            # IMPORTANT: list here (same as old behavior)
            "columns": preview["columns"],
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
