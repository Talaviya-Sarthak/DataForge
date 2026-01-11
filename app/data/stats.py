def dataset_stats(df):
    """
    Calculate statistics for numeric columns:
    min, max, Q1, median, Q3
    """

    numeric_df = df.select_dtypes(include=["number"])

    if numeric_df.empty:
        return {"message": "No numeric columns found"}

    stats = {}

    for column in numeric_df.columns:
        col_data = numeric_df[column].dropna()

        if col_data.empty:
            stats[column] = {
                "min": None,
                "q1": None,
                "median": None,
                "q3": None,
                "max": None
            }
        else:
            stats[column] = {
                "min": float(col_data.min()),
                "q1": float(col_data.quantile(0.25)),
                "median": float(col_data.median()),
                "q3": float(col_data.quantile(0.75)),
                "max": float(col_data.max())
            }

    return stats
