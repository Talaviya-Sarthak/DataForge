import sys
import os
from pathlib import Path

# Add parent directory to path for imports to work when running as script
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
from preprocessings.missing_values import ColumnWiseMissingValueImputer

# Sample dataset
df = pd.DataFrame(
    {
        "age": [25, None, 30, None],
        "gender": ["Male", None, "Female", None],
        "signup_date": ["2023-01-01", None, "2023-01-03", None],
        "is_active": [True, None, False, None],
    }
)

# Convert datatypes
df["signup_date"] = pd.to_datetime(df["signup_date"])
df["is_active"] = df["is_active"].astype("boolean")

print("BEFORE IMPUTATION\n", df)

transformations = [
    {"column": "age", "strategy": "median", "dtype": "numeric"},
    {"column": "gender", "strategy": "mode", "dtype": "categorical"},
    {"column": "signup_date", "strategy": "most_frequent", "dtype": "datetime"},
    {"column": "is_active", "strategy": "mode", "dtype": "boolean"},
]

imputer = ColumnWiseMissingValueImputer(transformations)
df_clean = imputer.apply(df)

print("\nAFTER IMPUTATION\n", df_clean)
