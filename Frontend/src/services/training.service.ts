const API_BASE = "http://localhost:5000/api";

export interface TrainModelRequest {
  pipeline_id: string;
  task_type: "classification" | "regression" | "auto";
  target_column: string;
}

export const trainModel = async (request: TrainModelRequest) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE}/training/train`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Training failed");
  }

  return response.json();
};

export const getTrainingResults = async (pipelineId: string) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE}/training/${pipelineId}/results`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch results");
  }

  return response.json();
};

export const getAvailableModels = async (taskType: string) => {
  const token = localStorage.getItem("token");
  const response = await fetch(
    `${API_BASE}/training/models/available?task_type=${taskType}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch available models");
  }

  return response.json();
};


export const experimentTrain = async (config: any) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE}/training/experiment/train`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Training failed");
  }

  return response.json();
};

export const getExperiment = async (experimentId: string) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE}/training/experiment/${experimentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch experiment");
  }

  return response.json();
};

export interface FeatureImportance {
  features: string[];
  importances: number[];
}

export interface ResidualPoint {
  actual: number;
  predicted: number;
  residual: number;
}

export interface ModelPlots {
  confusion_matrix?: number[][] | null;
  roc_curve?: any | null;
  precision_recall_curve?: { precision: number[]; recall: number[] } | null;
  predicted_vs_actual?: { actual: number[]; predicted: number[] } | null;
  residuals?: ResidualPoint[] | null;
  error_distribution?: { label: number; count: number }[] | null;
  feature_importance?: FeatureImportance | null;
}

export interface ModelResult {
  model_id: string;
  model_name: string;
  model: string;
  name: string;
  model_type: 'classification' | 'regression';
  model_path?: string;
  training_time_ms?: number;
  accuracy?: number;
  r2_score?: number;
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    roc_auc?: number;
    r2_score?: number;
    mse?: number;
    rmse?: number;
    mae?: number;
  };
  plots: ModelPlots;
  feature_importance?: FeatureImportance | null;
  status?: string;
}

export interface PreprocessingConfig {
  missing_values: string;
  encoding: string;
  scaling: string | null;
}

export interface TrainResponse {
  status: string;
  experiment_id: string;
  task_type: 'classification' | 'regression';
  models: ModelResult[];
  base_models: ModelResult[];
  best_model: ModelResult | null;
  chart_data?: any;
  results_table?: any[];
}

export interface TuneResponse {
  status: string;
  experiment_id: string;
  model: ModelResult;
}

export const trainingService = {
  trainModel,
  getTrainingResults,
  getAvailableModels,
  experimentTrain,
  getExperiment,
  downloadModel: async (modelId: number): Promise<void> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/training/models/${modelId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Download failed');
    }
    // Stream blob → anchor click
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] ?? `model_${modelId}.pkl`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
  deleteModel: async (modelId: number): Promise<void> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/training/models/${modelId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Delete failed');
    }
  },
};