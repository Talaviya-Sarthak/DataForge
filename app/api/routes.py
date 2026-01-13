from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import math

from app.data.loader import load_Data
from app.data.preview import preview_Data
from app.data.stats import dataset_stats

router = APIRouter()

CURRENT_DATASET = None


@router.post("/data/upload")
async def upload_dataset(file: UploadFile = File(...)):
    global CURRENT_DATASET

    try:
        df = load_Data(file)

        # Clean NaN & inf for JSON safety
        df = df.replace([float("inf"), float("-inf")], None)

        CURRENT_DATASET = df

        # Preview
        preview = preview_Data(df)

        # Stats
        stats = dataset_stats(df)

        # Infer numeric vs categorical
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
