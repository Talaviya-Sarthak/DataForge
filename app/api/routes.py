from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd

from app.data.loader import load_Data
from app.data.preview import preview_Data
from app.data.stats import dataset_stats
from app.preprocessings.pipeline import PreprocessingPipeline

router = APIRouter()

CURRENT_DATASET = None


# -----------------------------------------
# DATA UPLOAD & INSPECTION
# -----------------------------------------
@router.post("/data/upload")
async def upload_dataset(file: UploadFile = File(...)):
    global CURRENT_DATASET

    try:
        df = load_Data(file)

        df = df.replace([float("inf"), float("-inf")], None)

        CURRENT_DATASET = df

        preview = preview_Data(df)
        stats = dataset_stats(df)

        numeric_cols = []
        categorical_cols = []

        for col in df.columns:
            sample = df[col].dropna().iloc[0] if not df[col].dropna().empty else None
            if isinstance(sample, (int, float)):
                numeric_cols.append(col)
            else:
                categorical_cols.append(col)

        return {
            "data": preview["rows"],
            "rows": len(df),
            "columns": len(df.columns),
            "numerical_columns": numeric_cols,
            "categorical_columns": categorical_cols,
            "statistics": stats
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# -----------------------------------------
# PREPROCESSING PIPELINE
# -----------------------------------------
@router.post("/data/preprocess")
def preprocess_dataset(payload: dict):
    global CURRENT_DATASET

    if CURRENT_DATASET is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded")

    try:
        pipeline = PreprocessingPipeline(
            value_standardization_steps=payload.get("value_standardization"),
            missing_value_steps=payload.get("missing"),
            outlier_steps=payload.get("outliers"),
            encoding_steps=payload.get("encoding"),
            scaling_steps=payload.get("scaling"),
            feature_selection_steps=payload.get("feature_selection"),
            imbalance_steps=payload.get("imbalance"),
        )

        processed_df = pipeline.run(CURRENT_DATASET)

        return {
            "rows": len(processed_df),
            "columns": list(processed_df.columns),
            "data": processed_df.head(20).to_dict(orient="records")
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
