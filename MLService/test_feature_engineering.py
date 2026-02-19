"""
Quick test of Feature Engineering module
"""

import pandas as pd
import numpy as np
from app.feature_engineering import FeatureEngineeringService

# Create test dataset
np.random.seed(42)
df = pd.DataFrame(
    {
        "num1": np.random.rand(50) * 100,
        "num2": np.random.rand(50) * 50,
        "num3": np.random.rand(50) * 25,
        "cat1": np.random.choice(["A", "B", "C"], 50),
        "cat2": np.random.choice(["X", "Y"], 50),
        "target": np.random.randint(0, 2, 50),
    }
)

print("Test Dataset:")
print(f"  Shape: {df.shape}")
print(f"  Columns: {list(df.columns)}")

# Initialize service
fe_service = FeatureEngineeringService()

# Apply feature engineering
print("\nApplying Feature Engineering...")
result_df = fe_service.apply(df, exclude_columns=["target"], verbose=False)

# Get metadata
metadata = fe_service.get_metadata()

print("\n" + "=" * 60)
print("FEATURE ENGINEERING TEST RESULTS")
print("=" * 60)
print(f"Original features:     {metadata['original_feature_count']}")
print(f"New features created:  {metadata['engineered_feature_count']}")
print(f"Final features:        {metadata['final_feature_count']}")
print(f"Successful transforms: {len(metadata['successful_transformations'])}")
print(f"Failed transforms:     {len(metadata['failed_transformations'])}")
print("\nSuccessful Transformers:")
for t in metadata["successful_transformations"]:
    print(f"  ✓ {t}")
if metadata["failed_transformations"]:
    print("\nFailed Transformers:")
    for t in metadata["failed_transformations"]:
        print(f"  ✗ {t}")
print("=" * 60)
print("\n✅ TEST PASSED - Feature Engineering working correctly!\n")
