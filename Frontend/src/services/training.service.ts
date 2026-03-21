const apiBase = import.meta.env.VITE_NODE_API_URL || "http://localhost:5000";

export interface PreprocessingConfig {
  missing_values: "mean" | "median" | "mode" | "drop";
  encoding: "label" | "one-hot";
  scaling: "standard" | "minmax" | null;
}

export interface TrainRequest {
  pipeline_id?: string;
  dataset_id?: number;
  task_type: "classification" | "regression";
  target_column: string;
  preprocessing_config?: PreprocessingConfig;
  selected_models?: string[];
  preprocessing_steps?: unknown[];
}

export interface ModelMetrics {
  accuracy?: number | null;
  precision?: number | null;
  recall?: number | null;
  f1_score?: number | null;
  roc_auc?: number | null;
  r2_score?: number | null;
  rmse?: number | null;
  mae?: number | null;
}

export interface LearningCurve {
  metric: string;
  train_sizes: number[];
  train_scores: number[];
  validation_scores: number[];
  train_loss?: number[];
  validation_loss?: number[];
}

export interface ModelPlots {
  confusion_matrix?: number[][];
  roc_curve?: { fpr: number[]; tpr: number[]; auc?: number } | Record<string, { fpr: number[]; tpr: number[]; auc?: number }>;
  precision_recall_curve?: { precision: number[]; recall: number[]; thresholds?: number[] };
  residuals?: number[];
  predicted_vs_actual?: { actual: number[]; predicted: number[] };
  error_distribution?: number[];
  residual_vs_predicted?: { predicted: number[]; residuals: number[] };
  regression_line?: { actual: number[]; predicted: number[] };
  class_labels?: string[];
  class_distribution?: { labels: string[]; counts: number[]; percentages: number[] };
  learning_curve?: LearningCurve | null;
  feature_vs_target?: { feature_name: string; feature_values: number[]; target_values: number[] } | null;
}

export interface FeatureImportance {
  features: string[];
  importances: number[];
}

export interface ModelArtifacts {
  actual_values?: number[] | string[] | null;
  predicted_values?: number[] | string[] | null;
  residuals?: number[] | null;
  probabilities?: number[][] | null;
}

export interface ModelResult {
  model_id: number;
  model_name: string;
  model: string;
  name: string;
  model_type: "classification" | "regression";
  target_column?: string | null;
  training_time_ms?: number | null;
  created_at?: string;
  model_path?: string;
  metrics: ModelMetrics;
  plots: ModelPlots;
  feature_importance?: FeatureImportance | null;
  artifacts?: ModelArtifacts;
  status?: "success" | "failed";
  error?: string;
}

export interface TrainResponse {
  status: string;
  experiment_id: string;
  task_type: "classification" | "regression";
  target_column?: string | null;
  models: ModelResult[];
  base_models: ModelResult[];
  failed_models: ModelResult[];
  best_model: ModelResult | null;
  summary: {
    total_models: number;
    successful: number;
    failed: number;
  };
}

export interface AvailableModelsResponse {
  task_type: string;
  models: string[];
  count: number;
}

export interface PaginatedModelsResponse {
  status: string;
  models: ModelResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

const getAuthHeaders = (includeContentType = true): Record<string, string> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");
  return {
    ...(includeContentType ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  };
};

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || err.error || err.detail || "Request failed");
  }
  return res.json() as Promise<T>;
};

export const getAvailableModels = async (
  taskType: "classification" | "regression"
): Promise<AvailableModelsResponse> => {
  const res = await fetch(`${apiBase}/api/training/models/available?task_type=${taskType}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<AvailableModelsResponse>(res);
};

export const experimentTrain = async (
  request: TrainRequest
): Promise<{ experiment_id: string; status: string; progress?: number; message: string }> => {
  const res = await fetch(`${apiBase}/api/training/experiment/train`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });
  return handleResponse(res);
};

export const getExperiment = async (experimentId: string): Promise<TrainResponse & { progress?: number; models_completed?: number; retry_after?: number; error?: string }> => {
  const res = await fetch(`${apiBase}/api/training/experiment/${experimentId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const getResults = async (experimentId: string): Promise<TrainResponse> => {
  const res = await fetch(`${apiBase}/api/training/results/${experimentId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const getModelDetails = async (modelId: number): Promise<{ status: string; model: ModelResult }> => {
  const res = await fetch(`${apiBase}/api/training/models/${modelId}/details`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const listModels = async (params: {
  page?: number;
  limit?: number;
  modelType?: "classification" | "regression" | "";
} = {}): Promise<PaginatedModelsResponse> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.modelType) searchParams.set("model_type", params.modelType);

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const res = await fetch(`${apiBase}/api/training/models${suffix}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const downloadModel = async (modelId: number): Promise<void> => {
  const res = await fetch(`${apiBase}/api/training/models/${modelId}/download`, {
    headers: getAuthHeaders(false),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Download failed" }));
    throw new Error(err.message || "Failed to download model");
  }

  const contentDisposition = res.headers.get("Content-Disposition");
  let filename = `model_${modelId}.pkl`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match?.[1]) filename = match[1];
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const deleteModel = async (modelId: number): Promise<{ status: string; message: string }> => {
  const res = await fetch(`${apiBase}/api/training/models/${modelId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const compareModels = async (modelIds: number[]): Promise<{ status: string; comparison: unknown }> => {
  const res = await fetch(`${apiBase}/api/training/models/compare`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ model_ids: modelIds }),
  });
  return handleResponse(res);
};

export const trainingService = {
  getAvailableModels,
  experimentTrain,
  getExperiment,
  getResults,
  getModelDetails,
  listModels,
  downloadModel,
  deleteModel,
  compareModels,
};
