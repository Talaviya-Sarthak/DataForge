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
    Calculate statistics for ALL columns:
    - Numeric: min, mean, median, std, max, outliers (IQR)
    - Categorical: top values
    - Both: missing values, unique values
    - Categorical: value counts (all)
    """
    stats = {}

    numeric_df = df.select_dtypes(include=["number"])
    categorical_df = df.select_dtypes(exclude=["number"])

    # ── Numeric columns ──────────────────────────
    for column in numeric_df.columns:
        col_series = numeric_df[column]
        col_data = col_series.dropna()

        outlier_count = 0
        if not col_data.empty:
            q1 = col_data.quantile(0.25)
            q3 = col_data.quantile(0.75)
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            outlier_count = int(((col_data < lower) | (col_data > upper)).sum())

        stats[column] = {
            "missing_count": int(col_series.isna().sum()),
            "missing_percentage": round(col_series.isna().mean() * 100, 2),
            "unique_values": int(col_series.nunique(dropna=True)),
            "outliers": outlier_count,
            # Numeric value counts are intentionally omitted.
            "value_counts": {},
        }

        if col_data.empty:
            stats[column].update(
                {"min": None, "mean": None, "median": None, "std": None, "max": None}
            )
        else:
            stats[column].update(
                {
                    "min": _safe_number(col_data.min()),
                    "mean": _safe_number(col_data.mean()),
                    "median": _safe_number(col_data.median()),
                    "std": _safe_number(col_data.std()),
                    "max": _safe_number(col_data.max()),
                }
            )

    # ── Categorical columns ──────────────────────
    for column in categorical_df.columns:
        col_series = categorical_df[column]

        stats[column] = {
            "missing_count": int(col_series.isna().sum()),
            "missing_percentage": round(col_series.isna().mean() * 100, 2),
            "unique_values": int(col_series.nunique(dropna=True)),
            "outliers": 0,
            "value_counts": {
                str(k): int(v) for k, v in col_series.value_counts(dropna=True).items()
            },
            "min": None,
            "mean": None,
            "median": None,
            "std": None,
            "max": None,
        }

    return stats
