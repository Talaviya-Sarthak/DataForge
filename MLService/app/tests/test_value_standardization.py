import sys
import os
from pathlib import Path

# Add parent directory to path for imports to work when running as script
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
from preprocessings.value_standardization import ValueStandardization

df = pd.DataFrame({
    "gender": ["M", "Male", "F", "Female", "Fe Male", None]
})

steps = [
    {
        "column": "gender",
        "mapping": {
            "m": "Male",
            "male": "Male",
            "f": "Female",
            "female": "Female",
            "fe male": "Female"
        }
    }
]

df_clean = ValueStandardization(steps).apply(df)
print(df_clean)
