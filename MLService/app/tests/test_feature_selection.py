import sys
import os
from pathlib import Path

# Add parent directory to path for imports to work when running as script
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
from preprocessings.feature_selection import FeatureSelection

df = pd.DataFrame({
    "age": [20, 22, 25, 30, 35, 40],
    "salary": [30000, 32000, 31000, 50000, 60000, 70000],
    "constant": [1, 1, 1, 1, 1, 1],
    "churn": [0, 0, 0, 0, 1, 1]
})

transformations = [
    {
        "operation": "feature_selection",
        "strategy": "auto",
        "target": "churn"
    }
]

selector = FeatureSelection(transformations)
df_selected = selector.apply(df)

print(df_selected.columns)
