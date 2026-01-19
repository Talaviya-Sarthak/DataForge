import numpy as np


def preview_Data(df, n: int = 10):
    """
    Return first N rows as JSON-safe preview
    """
    preview_df = df.head(n)

    # Convert problematic values (NaN/inf) to None so JSON serializer is happy
    safe_preview = preview_df.replace([np.nan, np.inf, -np.inf], None)

    return {
        "columns": list(preview_df.columns),
        "rows": safe_preview.to_dict(orient="records")
    } 