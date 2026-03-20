"""Post-training hyperparameter tuning service.

Provides manual hyperparameter tuning triggered AFTER initial training.
Automatically selects top models and runs GridSearch or RandomSearch.
"""

import logging
import time
from copy import deepcopy

import pandas as pd
import numpy as np
from sklearn.model_selection import RandomizedSearchCV, GridSearchCV

from app.tuning.param_spaces import PARAM_SPACES
from app.training.enhanced_evaluator import evaluate_model_with_plots
from app.training.exporter import export_model
from app.training.experiment_store import get_experiment, update_experiment_tuning
from app.training.model_aware_preprocessing import RuntimePreprocessor, model_requires_scaling

logger = logging.getLogger("dataforge.tuning")


def tune_experiment_models(
    experiment_id: str,
    df: pd.DataFrame,
    top_n: int = 2,
    search_method: str = "random",
    n_iter: int = 10,
    cv: int = 3,
) -> dict:
    """Run hyperparameter tuning on top models from an experiment.

    Args:
        experiment_id: Experiment ID to tune.
        df: Original dataset (needed for retraining).
        top_n: Number of top models to tune (default 2).
        search_method: "random" or "grid" (default "random").
        n_iter: Number of iterations for RandomizedSearchCV.
        cv: Number of cross-validation folds.

    Returns:
        dict: Tuning results with best_params and improvements.
    """
    # Retrieve experiment
    experiment = get_experiment(experiment_id)
    if not experiment:
        raise ValueError(f"Experiment '{experiment_id}' not found.")

    task_type = experiment["task_type"]
    target_column = experiment["target_column"]
    preprocessing_config = experiment["preprocessing_config"]
    results = experiment["results"]

    # Get successful models sorted by primary metric
    primary_metric = "accuracy" if task_type == "classification" else "r2_score"
    base_models = results.get("base_models", [])

    if not base_models:
        raise ValueError("No successful models to tune in this experiment.")

    # Select top N models for tuning
    models_to_tune = base_models[:top_n]
    logger.info(
        "[TUNING %s] Starting tuning for top %d models: %s",
        experiment_id, len(models_to_tune),
        [m["model"] for m in models_to_tune]
    )

    # Recreate preprocessing
    preprocessor = RuntimePreprocessor(preprocessing_config)
    preprocessor.fit(df, target_column)

    # Prepare train/test split
    split_kwargs = {"test_size": 0.2, "random_state": 42}
    if task_type == "classification":
        y_temp = df[target_column]
        split_kwargs["stratify"] = y_temp

    indices = np.arange(len(df))
    from sklearn.model_selection import train_test_split
    train_idx, test_idx = train_test_split(indices, **split_kwargs)

    # Tune each selected model
    tuning_results = []
    scoring = "accuracy" if task_type == "classification" else "r2"

    for model_info in models_to_tune:
        model_name = model_info["model"]
        original_metrics = {
            k: model_info.get(k, 0)
            for k in ["accuracy", "precision", "recall", "f1_score", "roc_auc",
                     "r2_score", "mse", "rmse", "mae"]
            if k in model_info
        }

        # Get param space
        param_space = PARAM_SPACES.get(model_name)
        if not param_space:
            logger.info(
                "[TUNING %s] No param space for '%s', skipping",
                experiment_id, model_name
            )
            tuning_results.append({
                "model": model_name,
                "tuned": False,
                "reason": "No hyperparameter space defined",
            })
            continue

        try:
            # Prepare data with model-aware scaling
            needs_scaling = model_requires_scaling(model_name)
            transformed_df = preprocessor.transform(
                df, target_column, apply_scaling=needs_scaling
            )

            X = transformed_df.drop(columns=[target_column])
            y = transformed_df[target_column]

            X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
            y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

            # Create fresh model instance
            from app.training.model_registry import get_selected_models
            model_desc = get_selected_models(task_type, [model_name])
            if not model_desc:
                raise ValueError(f"Model '{model_name}' not found in registry")

            fresh_model = deepcopy(model_desc[0]["instance"])

            # Run hyperparameter search
            start_time = time.perf_counter()

            if search_method == "grid":
                search = GridSearchCV(
                    estimator=fresh_model,
                    param_grid=param_space,
                    cv=cv,
                    n_jobs=-1,
                    scoring=scoring,
                )
            else:
                # Cap n_iter
                n_combinations = 1
                for vals in param_space.values():
                    n_combinations *= len(vals) if hasattr(vals, "__len__") else 10
                actual_n_iter = min(n_iter, n_combinations)

                search = RandomizedSearchCV(
                    estimator=fresh_model,
                    param_distributions=param_space,
                    n_iter=actual_n_iter,
                    cv=cv,
                    n_jobs=-1,
                    scoring=scoring,
                    random_state=42,
                )

            search.fit(X_train, y_train)
            tuning_time_ms = int((time.perf_counter() - start_time) * 1000)

            # Evaluate tuned model
            tuned_model = search.best_estimator_
            eval_result = evaluate_model_with_plots(tuned_model, X_test, y_test, task_type)

            # Export tuned model
            tuned_path = export_model(
                tuned_model,
                experiment.get("pipeline_id", "unknown"),
                f"{model_name}_tuned"
            )

            # Calculate improvement
            improvement = {}
            for metric, old_val in original_metrics.items():
                new_val = eval_result["metrics"].get(metric, 0)
                if old_val and new_val:
                    if metric in ["mse", "rmse", "mae"]:  # Lower is better
                        imp = ((old_val - new_val) / old_val) * 100
                    else:  # Higher is better
                        imp = ((new_val - old_val) / old_val) * 100
                    improvement[metric] = round(imp, 2)

            tuning_results.append({
                "model": model_name,
                "tuned": True,
                "best_params": search.best_params_,
                "best_cv_score": round(float(search.best_score_), 4),
                "original_metrics": original_metrics,
                "tuned_metrics": eval_result["metrics"],
                "improvement": improvement,
                "tuning_time_ms": tuning_time_ms,
                "model_path": tuned_path,
                "plots": eval_result["plots"],
            })

            logger.info(
                "[TUNING %s] %s: %s improved %.2f%% (best_params=%s)",
                experiment_id, model_name, primary_metric,
                improvement.get(primary_metric, 0), search.best_params_
            )

        except Exception as e:
            logger.warning(
                "[TUNING %s] %s failed: %s",
                experiment_id, model_name, str(e)
            )
            tuning_results.append({
                "model": model_name,
                "tuned": False,
                "error": str(e),
            })

    # Build response
    response = {
        "experiment_id": experiment_id,
        "models_tuned": len([r for r in tuning_results if r.get("tuned")]),
        "models_skipped": len([r for r in tuning_results if not r.get("tuned")]),
        "tuning_results": tuning_results,
        "search_method": search_method,
    }

    # Find best tuned model
    tuned_models = [r for r in tuning_results if r.get("tuned")]
    if tuned_models:
        best_tuned = max(
            tuned_models,
            key=lambda m: m["tuned_metrics"].get(primary_metric, 0)
        )
        response["best_tuned_model"] = best_tuned

    # Update experiment with tuning results
    update_experiment_tuning(experiment_id, response)

    logger.info(
        "[TUNING %s] Complete: %d models tuned, %d skipped",
        experiment_id, response["models_tuned"], response["models_skipped"]
    )

    return response
