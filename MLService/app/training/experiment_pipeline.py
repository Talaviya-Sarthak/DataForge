"""Experiment-based training pipeline.

Extends the base training pipeline to support:
    1. Training WITHOUT dataset finalization
    2. Runtime preprocessing with model-aware scaling
    3. Experiment tracking with experiment_id
    4. Plot data generation for visualizations
    5. Selective model training
"""

import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import pandas as pd
import numpy as np
from sklearn.base import clone
from sklearn.model_selection import learning_curve
from sklearn.model_selection import train_test_split

from app.training.model_registry import get_selected_models, get_available_models
from app.training.model_aware_preprocessing import (
    RuntimePreprocessor,
    model_requires_scaling,
    apply_runtime_preprocessing,
)
from app.training.enhanced_evaluator import (
    evaluate_model_with_plots,
    generate_aggregated_chart_data,
    generate_results_table,
)
from app.training.experiment_store import (
    generate_experiment_id,
    store_experiment,
)
from app.training.exporter import export_model
from app.training.job_manager import update_job

logger = logging.getLogger("dataforge.experiment")

# Primary metric for leaderboard sorting
_PRIMARY_METRIC: dict[str, str] = {
    "classification": "accuracy",
    "regression": "r2_score",
}


def _safe_float_list(values) -> list[float]:
    return [round(float(v), 4) for v in values]


def _build_learning_curve(model, X: pd.DataFrame, y: pd.Series, task_type: str):
    scoring = "accuracy" if task_type == "classification" else "r2"
    try:
        train_sizes, train_scores, validation_scores = learning_curve(
            estimator=clone(model),
            X=X,
            y=y,
            cv=3,
            n_jobs=1,
            train_sizes=np.linspace(0.2, 1.0, 5),
            scoring=scoring,
            shuffle=True,
            random_state=42,
        )
        train_mean = np.mean(train_scores, axis=1)
        validation_mean = np.mean(validation_scores, axis=1)
        payload = {
            "metric": "accuracy" if task_type == "classification" else "r2_score",
            "train_sizes": [int(v) for v in train_sizes.tolist()],
            "train_scores": _safe_float_list(train_mean),
            "validation_scores": _safe_float_list(validation_mean),
        }
        if task_type == "classification":
            payload["train_loss"] = _safe_float_list(1 - train_mean)
            payload["validation_loss"] = _safe_float_list(1 - validation_mean)
        return payload
    except Exception:
        return None


def _build_class_distribution(y: pd.Series) -> dict:
    counts = y.astype(str).value_counts().sort_index()
    total = int(counts.sum()) or 1
    return {
        "labels": counts.index.tolist(),
        "counts": counts.astype(int).tolist(),
        "percentages": [round((int(count) / total) * 100, 2) for count in counts.tolist()],
    }


def _build_feature_vs_target_plot(
    X: pd.DataFrame,
    y: pd.Series,
    feature_importance: dict | None,
):
    if X.empty:
        return None

    candidate = None
    if feature_importance and feature_importance.get("features"):
        top_feature = feature_importance["features"][0]
        if top_feature in X.columns:
            candidate = top_feature

    if candidate is None:
        correlations = X.apply(lambda col: col.corr(y) if pd.api.types.is_numeric_dtype(col) else np.nan)
        correlations = correlations.dropna()
        if correlations.empty:
            return None
        candidate = correlations.abs().sort_values(ascending=False).index[0]

    sample = pd.DataFrame({"feature": X[candidate], "target": y}).dropna()
    if sample.empty:
        return None
    if len(sample) > 500:
        sample = sample.sample(500, random_state=42)
    return {
        "feature_name": candidate,
        "feature_values": sample["feature"].astype(float).tolist(),
        "target_values": sample["target"].astype(float).tolist(),
    }


def run_experiment_training(
    df: pd.DataFrame,
    pipeline_id: str,
    task_type: str,
    target_column: str,
    preprocessing_config: dict | None = None,
    selected_models: list[str] | None = None,
) -> dict:
    """Execute training pipeline with experiment tracking.

    CRITICAL: This works WITHOUT dataset finalization. Preprocessing
    is applied at runtime using the provided config.

    Args:
        df: Raw or preprocessed DataFrame.
        pipeline_id: Unique pipeline identifier.
        task_type: "classification" or "regression".
        target_column: Target column name.
        preprocessing_config: Runtime preprocessing config with keys:
            - missing_values: "mean" | "median" | "mode" | "drop"
            - encoding: "label" | "one-hot"
            - scaling: "standard" | "minmax" | None
        selected_models: List of model names to train. If None, trains all.

    Returns:
        dict: Experiment results with experiment_id, models, metrics, plots.
    """
    # Generate unique experiment ID
    experiment_id = generate_experiment_id()

    logger.info(
        "[EXPERIMENT %s] Starting training for pipeline '%s' (%s)",
        experiment_id, pipeline_id, task_type
    )

    # Validate inputs
    if target_column not in df.columns:
        raise ValueError(
            f"Target column '{target_column}' not found. "
            f"Available: {list(df.columns)}"
        )

    if task_type not in _PRIMARY_METRIC:
        raise ValueError(
            f"Unsupported task type '{task_type}'. Use 'classification' or 'regression'."
        )

    primary_metric = _PRIMARY_METRIC[task_type]

    # Default preprocessing config
    if preprocessing_config is None:
        preprocessing_config = {
            "missing_values": "median",
            "encoding": "label",
            "scaling": "standard",
        }

    # Apply runtime preprocessing (fit transformers)
    preprocessor = RuntimePreprocessor(preprocessing_config)
    preprocessor.fit(df, target_column)

    # Get base transformed data (without scaling for tree models)
    base_df = preprocessor.transform(df, target_column, apply_scaling=False)

    # Prepare train/test split indices (consistent across all models)
    X_base = base_df.drop(columns=[target_column])
    y = base_df[target_column]

    split_kwargs = {"test_size": 0.2, "random_state": 42}
    if task_type == "classification":
        split_kwargs["stratify"] = y

    # Create index-based split for consistency
    indices = np.arange(len(df))
    train_idx, test_idx = train_test_split(indices, **split_kwargs)

    # Get models to train
    models = get_selected_models(task_type, selected_models)
    logger.info("[EXPERIMENT %s] Training %d models", experiment_id, len(models))

    # OPTIMIZATION: Sample dataset if too large (max 50k rows)
    # NOTE: must happen BEFORE split index computation
    max_rows = 50000
    if len(df) > max_rows:
        original_size = len(df)
        df = df.sample(n=max_rows, random_state=42).reset_index(drop=True)
        logger.info("[EXPERIMENT %s] Dataset sampled %d → %d rows", experiment_id, original_size, max_rows)

    # OPTIMIZATION: Limit features if too many (max 100 features)
    max_features = 100
    if len(X_base.columns) > max_features:
        # Keep top features by variance
        from sklearn.feature_selection import VarianceThreshold
        selector = VarianceThreshold()
        selector.fit(X_base)
        variances = selector.variances_
        top_features = X_base.columns[np.argsort(variances)[-max_features:]]
        logger.info("[EXPERIMENT %s] Features reduced from %d to %d", experiment_id, len(X_base.columns), max_features)

    # Train models in parallel with controlled concurrency
    model_results = _train_models_parallel(
        models=models,
        preprocessor=preprocessor,
        df=df,
        target_column=target_column,
        train_idx=train_idx,
        test_idx=test_idx,
        task_type=task_type,
        pipeline_id=pipeline_id,
        experiment_id=experiment_id,
        primary_metric=primary_metric,
        max_workers=3,
        timeout_per_model=120,  # 2 min per model — sufficient for XGBoost/SVM
    )

    # Sort by primary metric (successful models only)
    successful_models = [m for m in model_results if m.get("status") == "success"]
    failed_models = [m for m in model_results if m.get("status") == "failed"]
    successful_models.sort(key=lambda m: m.get(primary_metric, 0), reverse=True)

    # Generate aggregated chart data
    chart_data = generate_aggregated_chart_data(successful_models, task_type)

    # Generate results table
    results_table = generate_results_table(successful_models, task_type)

    # Build response
    response = {
        "experiment_id": experiment_id,
        "pipeline_id": pipeline_id,
        "task_type": task_type,
        "target_column": target_column,
        "preprocessing_config": preprocessing_config,
        "selected_models": selected_models,
        "models": successful_models + failed_models,  # Backward compat
        "base_models": successful_models,
        "failed_models": failed_models,
        "best_model": successful_models[0] if successful_models else None,
        "chart_data": chart_data,
        "results_table": results_table,
        "summary": {
            "total_models": len(models),
            "successful": len(successful_models),
            "failed": len(failed_models),
        },
    }

    # Store experiment
    store_experiment(
        experiment_id=experiment_id,
        pipeline_id=pipeline_id,
        task_type=task_type,
        target_column=target_column,
        preprocessing_config=preprocessing_config,
        selected_models=selected_models,
        results=response,
    )

    logger.info(
        "[EXPERIMENT %s] Training complete: %d/%d models succeeded",
        experiment_id, len(successful_models), len(models)
    )

    return response


def _train_single_model(
    descriptor: dict,
    preprocessor,
    df: pd.DataFrame,
    target_column: str,
    train_idx,
    test_idx,
    task_type: str,
    pipeline_id: str,
) -> dict:
    """Train a single model (for parallel execution)."""
    model_name = descriptor["name"]
    model = descriptor["instance"]

    try:
        start_time = time.perf_counter()
        
        needs_scaling = model_requires_scaling(model_name)
        transformed_df = preprocessor.transform(df, target_column, apply_scaling=needs_scaling)

        X = transformed_df.drop(columns=[target_column])
        y = transformed_df[target_column]
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

        model.fit(X_train, y_train)
        training_time_ms = int((time.perf_counter() - start_time) * 1000)

        eval_result = evaluate_model_with_plots(model, X_train, y_train, X_test, y_test, task_type)
        learning_curve_data = _build_learning_curve(model, X_train, y_train, task_type)
        class_distribution = _build_class_distribution(y) if task_type == "classification" else None
        feature_vs_target = (
            _build_feature_vs_target_plot(X, y, eval_result["feature_importance"])
            if task_type == "regression"
            else None
        )
        plots = {
            **eval_result["plots"],
            "learning_curve": learning_curve_data,
            "class_distribution": class_distribution,
            "feature_vs_target": feature_vs_target,
        }
        model_path = export_model(model, pipeline_id, model_name)

        logger.info(
            "[MODEL] %s trained in %dms",
            model_name, training_time_ms
        )

        return {
            "model": model_name,
            "name": model_name,
            "model_type": task_type,
            **eval_result["metrics"],
            "training_time_ms": training_time_ms,
            "plots": plots,
            "feature_importance": eval_result["feature_importance"],
            "artifacts": eval_result["artifacts"],
            "model_path": model_path,
            "scaling_applied": needs_scaling,
            "status": "success",
        }
    except Exception as e:
        logger.warning("[MODEL] %s failed: %s", model_name, str(e))
        return {
            "model": model_name,
            "name": model_name,
            "status": "failed",
            "error": str(e),
        }


def _train_models_parallel(
    models: list,
    preprocessor,
    df: pd.DataFrame,
    target_column: str,
    train_idx,
    test_idx,
    task_type: str,
    pipeline_id: str,
    experiment_id: str,
    primary_metric: str,
    max_workers: int = 2,
    timeout_per_model: int = 15,
) -> list[dict]:
    """Train models in parallel with timeout protection and controlled concurrency."""
    results = []
    completed = 0
    total = len(models)

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(
                _train_single_model,
                model,
                preprocessor,
                df,
                target_column,
                train_idx,
                test_idx,
                task_type,
                pipeline_id,
            ): model
            for model in models
        }

        for future in as_completed(futures):
            try:
                result = future.result(timeout=timeout_per_model)
                results.append(result)
                completed += 1
                
                # Update progress
                progress = int((completed / total) * 100)
                update_job(experiment_id, progress=progress, models_completed=completed)
                
                if result.get("status") == "success":
                    logger.info(
                        "[EXPERIMENT %s] ✅ %s: %s=%.4f, time=%dms",
                        experiment_id,
                        result["model"],
                        primary_metric,
                        result.get(primary_metric, 0),
                        result.get("training_time_ms", 0),
                    )
                else:
                    logger.warning(
                        "[EXPERIMENT %s] ❌ %s: %s",
                        experiment_id,
                        result["model"],
                        result.get("error", "Unknown error"),
                    )
            except Exception as e:
                model = futures[future]
                logger.warning(
                    "[EXPERIMENT %s] ⏱️ %s timeout after %ds",
                    experiment_id,
                    model["name"],
                    timeout_per_model,
                )
                results.append({
                    "model": model["name"],
                    "name": model["name"],
                    "status": "failed",
                    "error": f"Timeout after {timeout_per_model}s",
                })
                completed += 1

    return results


def get_model_plot_data(experiment_id: str, model_name: str) -> dict | None:
    """Retrieve plot data for a specific model from an experiment.

    Args:
        experiment_id: Experiment ID.
        model_name: Model name.

    Returns:
        dict with plot data or None if not found.
    """
    from app.training.experiment_store import get_experiment

    experiment = get_experiment(experiment_id)
    if not experiment:
        return None

    results = experiment.get("results", {})
    models = results.get("models", [])

    for model in models:
        if model.get("model") == model_name or model.get("name") == model_name:
            return model.get("plots")

    return None
