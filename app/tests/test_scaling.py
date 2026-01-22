import sys
import os
from pathlib import Path

# Add parent directory to path for imports to work when running as script
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
from preprocessings.scaling import ScalingValues  # adjust import if needed
# ---------------- TEST DATA ----------------
df = pd.DataFrame({
    "age": [20, 30, 40, 50],
    "salary": [30000, 50000, 70000, 90000]
})

# ---------------- TRANSFORMATIONS ----------------
transformations = [
    {
        "column": "age",
        "operation": "scale",
        "strategy": "standardize",
        "dtype": "numeric"
    },
    {
        "column": "salary",
        "operation": "scale",
        "strategy": "normalize",
        "dtype": "numeric"
    }
]

# ---------------- APPLY SCALING ----------------
scaler = ScalingValues(transformations)
df_scaled = scaler.apply(df)

print(df_scaled)
