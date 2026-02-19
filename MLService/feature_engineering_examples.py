"""
Feature Engineering Module - Example Usage

Demonstrates how to use the FeatureEngineeringService independently
or as part of the AutoML training pipeline.
"""

import pandas as pd
import numpy as np
from app.feature_engineering.feature_engineering_service import (
    FeatureEngineeringService,
)
from app.feature_engineering.numeric_features import NumericFeatures
from app.feature_engineering.categorical_features import CategoricalFeatures
from app.feature_engineering.datetime_features import DatetimeFeatures
from app.feature_engineering.interaction_features import InteractionFeatures


def example_standalone_feature_engineering():
    """
    Example 1: Using feature engineering standalone
    """
    print("\n" + "=" * 80)
    print("EXAMPLE 1: Standalone Feature Engineering")
    print("=" * 80)

    # Create sample dataset
    df = pd.DataFrame(
        {
            "numeric1": np.random.rand(100) * 100,
            "numeric2": np.random.rand(100) * 50,
            "numeric3": np.random.rand(100) * 200,
            "category1": np.random.choice(["A", "B", "C"], 100),
            "category2": np.random.choice(["X", "Y", "Z", "W"], 100),
            "date_col": pd.date_range("2020-01-01", periods=100, freq="D"),
            "target": np.random.choice([0, 1], 100),
        }
    )

    print(f"\nOriginal DataFrame shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")

    # Apply feature engineering
    service = FeatureEngineeringService(
        apply_numeric=True,
        apply_categorical=True,
        apply_datetime=True,
        apply_interaction=True,
    )

    df_engineered = service.apply(df, exclude_columns=["target"], verbose=True)

    print(f"\nEngineered DataFrame shape: {df_engineered.shape}")
    print(f"Total features added: {service.get_feature_count_increase()}")
    print(f"\nEngineered features: {service.get_engineered_features()}")
    print(f"\n{service.get_summary()}")

    return df_engineered


def example_numeric_features_only():
    """
    Example 2: Using only numeric feature engineering
    """
    print("\n" + "=" * 80)
    print("EXAMPLE 2: Numeric Features Only")
    print("=" * 80)

    df = pd.DataFrame(
        {
            "price": np.random.rand(50) * 1000,
            "quantity": np.random.rand(50) * 100,
            "discount": np.random.rand(50) * 0.5,
        }
    )

    print(f"\nOriginal shape: {df.shape}")
    print(f"Original columns: {list(df.columns)}")

    numeric_cols = ["price", "quantity", "discount"]
    result = NumericFeatures.apply_numeric_features(
        df,
        numeric_cols,
        apply_log=True,
        apply_square=True,
        apply_sqrt=True,
        apply_binning=True,
        apply_agg=True,
    )

    df_engineered = result["df"]
    print(f"\nEngineered shape: {df_engineered.shape}")
    print(f"New features created: {result['new_features']}")

    return df_engineered


def example_categorical_features_only():
    """
    Example 3: Using only categorical feature engineering
    """
    print("\n" + "=" * 80)
    print("EXAMPLE 3: Categorical Features Only")
    print("=" * 80)

    df = pd.DataFrame(
        {
            "product": np.random.choice(["A", "B", "C", "D"], 50),
            "region": np.random.choice(["North", "South", "East", "West"], 50),
            "customer_type": np.random.choice(["Premium", "Standard"], 50),
        }
    )

    print(f"\nOriginal shape: {df.shape}")
    print(f"Original columns: {list(df.columns)}")

    cat_cols = ["product", "region", "customer_type"]
    result = CategoricalFeatures.apply_categorical_features(
        df, cat_cols, apply_frequency=True, apply_count=True, apply_cardinality=True
    )

    df_engineered = result["df"]
    print(f"\nEngineered shape: {df_engineered.shape}")
    print(f"New features created: {result['new_features']}")

    return df_engineered


def example_datetime_features_only():
    """
    Example 4: Using only datetime feature engineering
    """
    print("\n" + "=" * 80)
    print("EXAMPLE 4: Datetime Features Only")
    print("=" * 80)

    df = pd.DataFrame(
        {
            "timestamp": pd.date_range("2020-01-01", periods=50, freq="D"),
            "value": np.random.rand(50) * 100,
        }
    )

    print(f"\nOriginal shape: {df.shape}")
    print(f"Original columns: {list(df.columns)}")

    result = DatetimeFeatures.apply_datetime_features(
        df, ["timestamp"], drop_original=True
    )

    df_engineered = result["df"]
    print(f"\nEngineered shape: {df_engineered.shape}")
    print(f"New features created: {result['new_features']}")

    return df_engineered


def example_interaction_features_only():
    """
    Example 5: Using only interaction feature engineering
    """
    print("\n" + "=" * 80)
    print("EXAMPLE 5: Interaction Features Only")
    print("=" * 80)

    df = pd.DataFrame(
        {
            "feature1": np.random.rand(50) * 100,
            "feature2": np.random.rand(50) * 50,
            "feature3": np.random.rand(50) * 200,
        }
    )

    print(f"\nOriginal shape: {df.shape}")
    print(f"Original columns: {list(df.columns)}")

    result = InteractionFeatures.apply_interaction_features(
        df,
        ["feature1", "feature2", "feature3"],
        apply_multiplication=True,
        apply_division=True,
        max_combinations_per_type=3,
    )

    df_engineered = result["df"]
    print(f"\nEngineered shape: {df_engineered.shape}")
    print(f"New features created: {result['new_features']}")

    return df_engineered


def example_complex_dataset():
    """
    Example 6: Complex dataset with all types of features
    """
    print("\n" + "=" * 80)
    print("EXAMPLE 6: Complex Dataset with Mixed Features")
    print("=" * 80)

    # Create realistic dataset
    n_samples = 200
    df = pd.DataFrame(
        {
            # Numeric features
            "age": np.random.randint(18, 80, n_samples),
            "salary": np.random.randint(30000, 150000, n_samples),
            "experience_years": np.random.randint(0, 40, n_samples),
            "bonus_percentage": np.random.rand(n_samples) * 20,
            # Categorical features
            "department": np.random.choice(
                ["Sales", "Engineering", "HR", "Finance"], n_samples
            ),
            "job_level": np.random.choice(["Junior", "Mid", "Senior"], n_samples),
            "education": np.random.choice(["HS", "BS", "MS", "PhD"], n_samples),
            # Datetime feature
            "hire_date": pd.date_range("2010-01-01", periods=n_samples, freq="D"),
            # Target
            "promotion": np.random.choice([0, 1], n_samples),
        }
    )

    print(f"\nDataset shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print(f"\nData types:\n{df.dtypes}")

    # Apply feature engineering
    service = FeatureEngineeringService(
        apply_numeric=True,
        apply_categorical=True,
        apply_datetime=True,
        apply_interaction=True,
    )

    df_engineered = service.apply(df, exclude_columns=["promotion"], verbose=True)

    print(f"\nFinal dataset shape: {df_engineered.shape}")
    print(f"\n{service.get_summary()}")
    print(f"\nSample of new columns:")
    new_cols = service.get_engineered_features()
    print(df_engineered[new_cols[:5]].head())

    return df_engineered


if __name__ == "__main__":
    # Run all examples
    example_standalone_feature_engineering()
    example_numeric_features_only()
    example_categorical_features_only()
    example_datetime_features_only()
    example_interaction_features_only()
    example_complex_dataset()

    print("\n" + "=" * 80)
    print("All examples completed successfully!")
    print("=" * 80)
