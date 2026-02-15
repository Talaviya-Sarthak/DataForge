import sys
import os
from pathlib import Path

# Add parent directory to path for imports to work when running as script
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
from preprocessings.outliers import HandlingOutliers

df = pd.DataFrame({
    "age": [20, 22, 25, 100, 24, 23],
    "salary": [30000, 32000, 31000, 1000000, 33000, 34000]
})

transformations = [
    {"column": "age", "strategy": "auto", "dtype": "numeric"},
    {"column": "salary", "strategy": "cap", "dtype": "numeric"}
]

handler = HandlingOutliers(transformations)
df_clean = handler.apply(df)

print(df_clean)
