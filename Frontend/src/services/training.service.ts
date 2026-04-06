const API_BASE = "http://localhost:5000/api";
import { apiRequest, getAccessToken } from "./api.client";

export interface TrainModelRequest {
  pipeline_id: string;
  task_type: "classification" | "regression" | "auto";
  target_column: string;
}

export const trainModel = async (request: TrainModelRequest) => {
  return apiRequest(`${API_BASE}/training/train`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    retryOnUnauthorized: true,
  });
};

export const getTrainingResults = async (pipelineId: string) => {
  return apiRequest(`${API_BASE}/training/${pipelineId}/results`, {
    retryOnUnauthorized: true,
  });
};

export const getAvailableModels = async (taskType: string) => {
  return apiRequest(
    `${API_BASE}/training/models/available?task_type=${taskType}`,
    {
      retryOnUnauthorized: true,
    }
  );
};


export const experimentTrain = async (config: any) => {
  try {
    const result = await apiRequest(`${API_BASE}/training/experiment/train`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
      retryOnUnauthorized: true,
    });
    return result;
  } catch (error: any) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to backend server. Please ensure the server is running on http://localhost:5000');
    }
    throw error;
  }
};

export const getExperiment = async (experimentId: string) => {
  return apiRequest(`${API_BASE}/training/experiment/${experimentId}`, {
    retryOnUnauthorized: true,
  });
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

export const trainingService = {
  trainModel,
  getTrainingResults,
  getAvailableModels,
  experimentTrain,
  getExperiment,
  downloadModel: async (modelId: number): Promise<void> => {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
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
    await apiRequest(`${API_BASE}/training/models/${modelId}`, {
      method: 'DELETE',
      retryOnUnauthorized: true,
    });
  },
  deleteAllModels: async (pipelineId: string): Promise<void> => {
    await apiRequest(`${API_BASE}/training/${pipelineId}/models`, {
      method: 'DELETE',
      retryOnUnauthorized: true,
    });
  },
};
