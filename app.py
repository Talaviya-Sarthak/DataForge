from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    df = pd.read_csv(file.file)

    rows, cols = df.shape

    numeric_df = df.select_dtypes(include=["int64", "float64"])
    categorical_df = df.select_dtypes(include=["object", "category", "bool"])

    stats = {}
    for col in numeric_df.columns:
        stats[col] = {
            "min": float(numeric_df[col].min()),
            "max": float(numeric_df[col].max()),
            "mean": float(numeric_df[col].mean()),
            "median": float(numeric_df[col].median()),
            "std": float(numeric_df[col].std()),
        }

    return {
        "file_name": file.filename,
        "rows": rows,
        "columns": cols,
        "numerical_columns": numeric_df.columns.tolist(),
        "categorical_columns": categorical_df.columns.tolist(),
        "statistics": stats,
        "data": df.to_dict(orient="records"),
    }
