from fastapi import APIRouter
from app.data.loader import load_Data
from app.data.preview import preview_Data
from app.data.stats import dataset_stats


router = APIRouter(tags=["ML Pipeline"])


@router.post("/data")
def load_data_route(file_path: str):
    df = load_Data(file_path)

    preview = preview_Data(df)
    stats = dataset_stats(df)

    return {
        "preview": preview,
        "stats": stats
    }
