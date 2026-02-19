"""
Example usage of the ML Training Pipeline.

This script demonstrates how to use the TrainingService to:
1. Load dataset
2. Apply preprocessing pipeline
3. Detect problem type
4. Split dataset
5. Train all models
6. Evaluate all models
7. Select best models
8. Tune best models
9. Generate plots
10. Save models
11. Return results
"""

import pandas as pd
from app.training.training_service import TrainingService


def example_classification():
    """
    Example: Training pipeline for classification problem.
    """
    print("=" * 80)
    print("EXAMPLE: Classification Pipeline")
    print("=" * 80)

    # Create sample dataset (Iris-like data)
    from sklearn.datasets import load_iris

    iris = load_iris()
    df = pd.DataFrame(iris.data, columns=iris.feature_names)
    df["target"] = iris.target

    # Define preprocessing steps (optional)
    preprocessing_steps = [
        {
            "step_index": 0,
            "type": "scaling",
            "params": [
                {"column": col, "method": "standard"} for col in iris.feature_names
            ],
        }
    ]

    # Initialize training service
    service = TrainingService(
        target_column="target",
        test_size=0.2,
        top_n_models=3,
        tune_models=True,
        random_state=42,
    )

    # Run complete pipeline
    results = service.run_complete_pipeline(
        df=df, preprocessing_steps=preprocessing_steps, verbose=True
    )

    print("\n" + "=" * 80)
    print("RESULTS SUMMARY")
    print("=" * 80)
    print(f"Problem Type: {results['problem_type']}")
    print(f"Best Model: {results['best_model']}")
    print(f"Models Trained: {results['models_trained']}")
    print(f"Best Model Path: {results['best_model_path']}")

    return results


def example_regression():
    """
    Example: Training pipeline for regression problem.
    """
    print("=" * 80)
    print("EXAMPLE: Regression Pipeline")
    print("=" * 80)

    # Create sample dataset (Boston housing-like data)
    from sklearn.datasets import fetch_california_housing

    housing = fetch_california_housing()
    df = pd.DataFrame(housing.data, columns=housing.feature_names)
    df["target"] = housing.target

    # No preprocessing in this example
    preprocessing_steps = None

    # Initialize training service
    service = TrainingService(
        target_column="target",
        test_size=0.2,
        top_n_models=3,
        tune_models=True,
        random_state=42,
    )

    # Run complete pipeline
    results = service.run_complete_pipeline(
        df=df, preprocessing_steps=preprocessing_steps, verbose=True
    )

    print("\n" + "=" * 80)
    print("RESULTS SUMMARY")
    print("=" * 80)
    print(f"Problem Type: {results['problem_type']}")
    print(f"Best Model: {results['best_model']}")
    print(f"Models Trained: {results['models_trained']}")
    print(f"Best Model Path: {results['best_model_path']}")

    return results


def example_from_csv():
    """
    Example: Training pipeline from CSV file.
    """
    print("=" * 80)
    print("EXAMPLE: Training from CSV File")
    print("=" * 80)

    # Assumes you have a CSV file named 'data.csv' with a target column
    # For FastAPI UploadFile, use: service.train_from_file(file, ...)

    # Load CSV
    df = pd.read_csv("your_data.csv")

    # Initialize training service
    service = TrainingService(
        target_column="your_target_column",
        test_size=0.2,
        top_n_models=3,
        tune_models=True,
        random_state=42,
    )

    # Run pipeline
    results = service.run_complete_pipeline(df, verbose=True)

    return results


if __name__ == "__main__":
    # Run classification example
    print("\n\n")
    classification_results = example_classification()

    print("\n\n")

    # Run regression example
    regression_results = example_regression()

    print("\n\nExamples completed successfully!")
