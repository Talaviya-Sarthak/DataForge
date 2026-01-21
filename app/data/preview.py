import numpy as np

def preview_Data(df):
    """
    Return full dataset as JSON-safe preview
    """

    safe_df = df.replace([np.nan, np.inf, -np.inf], None)

    return {
        "columns": list(df.columns),
        "rows": safe_df.to_dict(orient="records")
    }
