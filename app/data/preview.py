def preview_Data(df):
    """
    Return first N rows as JSON-safe preview
    """
    preview_df = df

    return {
        "columns": list(preview_df.columns),
        "rows": preview_df.to_dict(orient="records")
    }
