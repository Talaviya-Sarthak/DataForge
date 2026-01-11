def preview_Data(df, n: int = 10):
    """
    Return first N rows as JSON-safe preview
    """
    preview_df = df.head(n)

    return {
        "columns": list(preview_df.columns),
        "rows": preview_df.to_dict(orient="records")
    }
