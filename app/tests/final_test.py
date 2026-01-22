import sys
import os
from pathlib import Path

# Add parent directory to path for imports to work when running as script
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
from preprocessings.pipeline import PreprocessingPipeline

df = pd.DataFrame({
    "age": [25, None, 35, 100],
    "salary": [30000, 50000, 70000, 1000000],
    "gender": ["Male", "Female", "Male", None],
    "churn": [0, 0, 1, 1]
})

pipeline = PreprocessingPipeline(

    missing_value_steps=[
        {"column": "age", "strategy": "median", "dtype": "numeric"},
        {"column": "gender", "strategy": "mode", "dtype": "categorical"}
    ],

    outlier_steps=[
        {"column": "salary", "strategy": "auto", "dtype": "numeric"}
    ],

    encoding_steps=[
        {"column": "gender", "strategy": "onehot", "dtype": "categorical"}
    ],

    scaling_steps=[
        {"column": "age", "strategy": "standardize", "dtype": "numeric"},
        {"column": "salary", "strategy": "normalize", "dtype": "numeric"}
    ],

    feature_selection_steps=[
        {"strategy": "auto", "target": "churn"}
    ],

    imbalance_steps=[
        {"target": "churn", "strategy": "oversample", "dtype": "categorical"}
    ]
)

df_processed = pipeline.run(df)
print(df_processed)
