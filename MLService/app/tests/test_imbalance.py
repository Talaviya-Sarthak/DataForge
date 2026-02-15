import sys
import os
from pathlib import Path

# Add parent directory to path for imports to work when running as script
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
from preprocessings.imbalance import HandlingImbalance

df = pd.DataFrame({
    "age": [20, 22, 25, 30, 35, 40],
    "salary": [30000, 32000, 31000, 50000, 60000, 70000],
    "churn": [0, 0, 0, 0, 1, 1]  # imbalanced
})

transformations = [
    {
        "target": "churn",
        "operation": "imbalance",
        "strategy": "oversample",
        "dtype": "categorical"
    }
]

handler = HandlingImbalance(transformations)
df_balanced = handler.apply(df)

print(df_balanced["churn"].value_counts())
