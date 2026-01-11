from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional
import pandas as pd

from app.data.loader import load_Data
from app.data.preview import preview_Data
from app.data.stats import dataset_stats

router = APIRouter()

# Global variable to store ONLY ONE dataset
CURRENT_DATASET: Optional[pd.DataFrame] = None


@router.post("/api/data/load")
async def load_dataset(file: UploadFile = File(...)):
    """
    Upload dataset once and store it in memory
    """
    global CURRENT_DATASET

    try:
        df = load_Data(file)
        CURRENT_DATASET = df

        return {
            "message": "Dataset loaded successfully",
            "rows": df.shape[0],
            "columns": df.shape[1]
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/data/preview")
def dataset_preview():
    """
    Preview the currently loaded dataset
    """
    if CURRENT_DATASET is None:
        raise HTTPException(status_code=404, detail="No dataset loaded")

    return preview_Data(CURRENT_DATASET)


@router.get("/api/data/stats")
def dataset_statistics():
    """
    Get statistics of the currently loaded dataset
    """
    if CURRENT_DATASET is None:
        raise HTTPException(status_code=404, detail="No dataset loaded")

    return dataset_stats(CURRENT_DATASET)
