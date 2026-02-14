import sys
import os
from pathlib import Path

# Add parent directory to path for imports to work when running as script
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
from preprocessings.encoding import EncodingValue

df = pd.DataFrame({
    "gender": ["Male", "Female", "Male", None],
    "payment": ["UPI", "Card", "UPI", "Cash"],
    "churn": [1, 0, 1, 0]
})

transformations = [
    {"column": "gender", "strategy": "onehot", "dtype": "categorical"},
    {
        "column": "payment",
        "strategy": "target",
        "dtype": "categorical",
        "target": "churn"
    }
]

encoder = EncodingValue(transformations)
df_encoded = encoder.apply(df)

print(df_encoded)
