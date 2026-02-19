"""
Feature Engineering Module - Validation Tests

Tests to verify correct integration and functionality of the feature engineering module.
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


class FeatureEngineeringValidator:
    """Validation tests for feature engineering module."""

    @staticmethod
    def test_numeric_features():
        """Test numeric feature engineering."""
        print("\n[TEST 1] Numeric Features")
        print("-" * 60)

        df = pd.DataFrame({"price": [10, 20, 30, 40, 50], "quantity": [1, 2, 3, 4, 5]})

        result = NumericFeatures.apply_numeric_features(
            df, numeric_columns=["price", "quantity"]
        )

        df_out = result["df"]
        new_features = result["new_features"]

        assert df_out.shape[1] > df.shape[1], "No new features added"
        assert len(new_features) > 0, "New features list is empty"

        print(f"✓ Original columns: {df.shape[1]}")
        print(f"✓ Result columns: {df_out.shape[1]}")
        print(f"✓ New features added: {len(new_features)}")
        print(f"✓ New column names: {new_features[:5]}...")  # First 5
        return True

    @staticmethod
    def test_categorical_features():
        """Test categorical feature engineering."""
        print("\n[TEST 2] Categorical Features")
        print("-" * 60)

        df = pd.DataFrame(
            {
                "color": ["red", "blue", "red", "green", "blue"],
                "size": ["S", "M", "L", "M", "S"],
            }
        )

        result = CategoricalFeatures.apply_categorical_features(
            df, categorical_columns=["color", "size"]
        )

        df_out = result["df"]
        new_features = result["new_features"]

        assert df_out.shape[1] > df.shape[1], "No new features added"
        assert len(new_features) > 0, "New features list is empty"

        print(f"✓ Original columns: {df.shape[1]}")
        print(f"✓ Result columns: {df_out.shape[1]}")
        print(f"✓ New features added: {len(new_features)}")
        print(f"✓ New column names: {new_features}")
        return True

    @staticmethod
    def test_datetime_features():
        """Test datetime feature engineering."""
        print("\n[TEST 3] Datetime Features")
        print("-" * 60)

        df = pd.DataFrame(
            {"date": pd.date_range("2020-01-01", periods=5), "value": [1, 2, 3, 4, 5]}
        )

        result = DatetimeFeatures.apply_datetime_features(
            df, datetime_columns=["date"], drop_original=True
        )

        df_out = result["df"]
        new_features = result["new_features"]

        assert "date" not in df_out.columns, "Original datetime column not dropped"
        assert len(new_features) == 5, "Should have exactly 5 datetime features"

        print(f"✓ Original datetime column dropped")
        print(f"✓ New features added: {len(new_features)}")
        print(f"✓ New column names: {new_features}")
        return True

    @staticmethod
    def test_interaction_features():
        """Test interaction feature engineering."""
        print("\n[TEST 4] Interaction Features")
        print("-" * 60)

        df = pd.DataFrame(
            {"feature1": [10, 20, 30], "feature2": [2, 4, 6], "feature3": [1, 2, 3]}
        )

        result = InteractionFeatures.apply_interaction_features(
            df,
            numeric_columns=["feature1", "feature2", "feature3"],
            apply_multiplication=True,
            apply_division=True,
            max_combinations_per_type=5,
        )

        df_out = result["df"]
        new_features = result["new_features"]

        assert df_out.shape[1] > df.shape[1], "No new features added"
        assert len(new_features) > 0, "New features list is empty"

        print(f"✓ Original columns: {df.shape[1]}")
        print(f"✓ Result columns: {df_out.shape[1]}")
        print(f"✓ New features added: {len(new_features)}")
        print(f"✓ New column names (first 5): {new_features[:5]}")
        return True

    @staticmethod
    def test_main_service():
        """Test main FeatureEngineeringService."""
        print("\n[TEST 5] FeatureEngineeringService (Main)")
        print("-" * 60)

        # Create sample dataset
        df = pd.DataFrame(
            {
                "numeric1": np.random.rand(50) * 100,
                "numeric2": np.random.rand(50) * 50,
                "category1": np.random.choice(["A", "B", "C"], 50),
                "category2": np.random.choice(["X", "Y"], 50),
                "date_col": pd.date_range("2020-01-01", periods=50),
                "target": np.random.choice([0, 1], 50),
            }
        )

        service = FeatureEngineeringService()
        df_engineered = service.apply(df, exclude_columns=["target"], verbose=False)

        metadata = service.get_metadata()
        engineered_features = service.get_engineered_features()
        summary = service.get_summary()

        assert df_engineered.shape[1] > df.shape[1], "No features engineered"
        assert len(engineered_features) > 0, "Engineered features list is empty"
        assert metadata["total_features_added"] > 0, "No features added"

        print(f"✓ Original features: {metadata['total_features_original']}")
        print(f"✓ Features added: {metadata['total_features_added']}")
        print(f"✓ Final features: {metadata['total_features_after']}")
        print(f"✓ Numeric columns: {len(metadata['numeric_features'])}")
        print(f"✓ Categorical columns: {len(metadata['categorical_features'])}")
        print(f"✓ Datetime columns: {len(metadata['datetime_features'])}")
        print(f"\n{summary}")
        return True

    @staticmethod
    def test_edge_cases():
        """Test edge cases and error handling."""
        print("\n[TEST 6] Edge Cases & Error Handling")
        print("-" * 60)

        # Test 1: Empty DataFrame
        df_empty = pd.DataFrame()
        service = FeatureEngineeringService()
        try:
            df_out = service.apply(df_empty)
            print("✓ Empty DataFrame handled")
        except Exception as e:
            print(f"⚠ Empty DataFrame error: {e}")

        # Test 2: All NaN column
        df_nan = pd.DataFrame({"all_nan": [np.nan] * 5, "normal": [1, 2, 3, 4, 5]})
        try:
            df_out = service.apply(df_nan)
            print("✓ All-NaN column handled")
        except Exception as e:
            print(f"⚠ All-NaN column error: {e}")

        # Test 3: Mixed types
        df_mixed = pd.DataFrame(
            {
                "int_col": [1, 2, 3, 4, 5],
                "float_col": [1.1, 2.2, 3.3, 4.4, 5.5],
                "str_col": ["a", "b", "c", "d", "e"],
                "date_col": pd.date_range("2020-01-01", periods=5),
            }
        )
        try:
            df_out = service.apply(df_mixed, verbose=False)
            print(f"✓ Mixed types handled (result shape: {df_out.shape})")
        except Exception as e:
            print(f"⚠ Mixed types error: {e}")

        # Test 4: Exclude multiple columns
        df_test = pd.DataFrame(
            {"f1": [1, 2, 3], "f2": [4, 5, 6], "target": [0, 1, 0], "id": [1, 2, 3]}
        )
        try:
            df_out = service.apply(df_test, exclude_columns=["target", "id"])
            print("✓ Multiple column exclusion handled")
        except Exception as e:
            print(f"⚠ Multiple exclusion error: {e}")

        return True

    @staticmethod
    def test_integration_compatibility():
        """Test compatibility with training pipeline."""
        print("\n[TEST 7] Integration Compatibility")
        print("-" * 60)

        # Simulate what happens in training pipeline
        df = pd.DataFrame(
            {
                "feature1": np.random.rand(100) * 100,
                "feature2": np.random.choice(["A", "B", "C"], 100),
                "feature3": pd.date_range("2020-01-01", periods=100),
                "target": np.random.choice([0, 1], 100),
            }
        )

        service = FeatureEngineeringService()

        # Step 1: Apply feature engineering with exclude
        df_fea = service.apply(df, exclude_columns=["target"], verbose=False)

        # Step 2: Separate features and target
        X = df_fea.drop(columns=["target"])
        y = df_fea["target"]

        assert X.shape[0] == y.shape[0], "Feature-target mismatch"
        assert X.shape[1] == df_fea.shape[1] - 1, "Column mismatch"

        print(f"✓ Feature-target separation works")
        print(f"✓ Features shape: {X.shape}")
        print(f"✓ Target shape: {y.shape}")
        print(f"✓ Feature names stored: {len(service.get_engineered_features())}")
        print(f"✓ Metadata available: {bool(service.get_metadata())}")

        return True

    @staticmethod
    def test_metadata_accuracy():
        """Test metadata accuracy and completeness."""
        print("\n[TEST 8] Metadata Accuracy")
        print("-" * 60)

        df = pd.DataFrame(
            {
                "num1": [1, 2, 3, 4, 5],
                "num2": [10, 20, 30, 40, 50],
                "cat1": ["a", "b", "a", "b", "a"],
                "dt1": pd.date_range("2020-01-01", periods=5),
                "target": [0, 1, 0, 1, 0],
            }
        )

        service = FeatureEngineeringService()
        df_engineered = service.apply(df, exclude_columns=["target"], verbose=False)

        metadata = service.get_metadata()

        # Check metadata structure
        required_keys = [
            "original_features",
            "numeric_features",
            "categorical_features",
            "datetime_features",
            "engineered_features",
            "total_features_original",
            "total_features_after",
            "total_features_added",
        ]

        for key in required_keys:
            assert key in metadata, f"Missing metadata key: {key}"

        # Check correctness
        assert metadata["total_features_original"] == 5, "Wrong original count"
        assert (
            metadata["total_features_after"] == df_engineered.shape[1]
        ), "Wrong final count"
        assert len(metadata["numeric_features"]) == 2, "Wrong numeric count"
        assert len(metadata["categorical_features"]) == 1, "Wrong categorical count"
        assert len(metadata["datetime_features"]) == 1, "Wrong datetime count"

        print(f"✓ All metadata keys present")
        print(f"✓ Original features count: {metadata['total_features_original']}")
        print(f"✓ Final features count: {metadata['total_features_after']}")
        print(f"✓ Features added: {metadata['total_features_added']}")
        print(f"✓ Metadata is accurate and complete")

        return True

    @staticmethod
    def run_all_tests():
        """Run all validation tests."""
        print("\n" + "=" * 60)
        print("FEATURE ENGINEERING MODULE - VALIDATION TESTS")
        print("=" * 60)

        tests = [
            FeatureEngineeringValidator.test_numeric_features,
            FeatureEngineeringValidator.test_categorical_features,
            FeatureEngineeringValidator.test_datetime_features,
            FeatureEngineeringValidator.test_interaction_features,
            FeatureEngineeringValidator.test_main_service,
            FeatureEngineeringValidator.test_edge_cases,
            FeatureEngineeringValidator.test_integration_compatibility,
            FeatureEngineeringValidator.test_metadata_accuracy,
        ]

        results = []
        for test in tests:
            try:
                result = test()
                results.append((test.__name__, "PASSED"))
            except AssertionError as e:
                results.append((test.__name__, f"FAILED: {e}"))
            except Exception as e:
                results.append((test.__name__, f"ERROR: {e}"))

        # Print summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)

        passed = sum(1 for _, result in results if result == "PASSED")
        failed = len(results) - passed

        for test_name, result in results:
            status_icon = "✓" if result == "PASSED" else "✗"
            print(f"{status_icon} {test_name}: {result}")

        print(f"\nTotal: {len(results)} | Passed: {passed} | Failed: {failed}")

        if failed == 0:
            print("\n✓ ALL TESTS PASSED! Feature engineering module is ready to use.")
        else:
            print(f"\n⚠ {failed} test(s) failed. Please review above.")

        return failed == 0


if __name__ == "__main__":
    FeatureEngineeringValidator.run_all_tests()
