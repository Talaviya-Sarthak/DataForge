import numpy as np

def preview_Data(df, n: int | None = None):
    """
    Return dataset preview as JSON-safe output

    Args:
        df (pd.DataFrame): Input dataframe
        n (int, optional): Number of rows to return. If None, return full dataset.
    """

    if n is not None:
        df = df.head(n)

    safe_df = df.replace([np.nan, np.inf, -np.inf], None)

    return {
        "columns": list(df.columns),
        "rows": safe_df.to_dict(orient="records")
    }
