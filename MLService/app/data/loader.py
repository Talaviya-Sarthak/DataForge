import pandas as pd
from fastapi import UploadFile

def load_Data(file: UploadFile):
    """
    Load uploaded file into a pandas DataFrame
    """

    filename = file.filename.lower()

    if filename.endswith(".csv"):
        df = pd.read_csv(file.file)

    elif filename.endswith((".xls", ".xlsx")):
        df = pd.read_excel(file.file)

    else:
        raise ValueError("Unsupported file format")

    return df
