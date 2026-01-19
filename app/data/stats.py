import math


def _safe_number(value):
    """Return None for NaN/inf; otherwise a Python float."""
    if value is None or isinstance(value, str):
        return None
    try:
        if math.isnan(value) or math.isinf(value):
            return None
    except TypeError:
        return None
    return float(value)


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
                "min": _safe_number(col_data.min()),
                "q1": _safe_number(col_data.quantile(0.25)),
                "median": _safe_number(col_data.median()),
                "q3": _safe_number(col_data.quantile(0.75)),
                "max": _safe_number(col_data.max())
            }

    return stats
