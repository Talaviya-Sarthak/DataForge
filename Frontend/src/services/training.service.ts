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

// Type definitions
export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface LearningCurveData {
  train: number[];
  validation: number[];
}

export interface ModelPlots {
  confusion_matrix?: any;
  roc_curve?: any;
  precision_recall_curve?: any;
  learning_curve?: LearningCurveData;
  residual_vs_predicted?: any;
}

export interface ModelResult {
  model_id: string;
  model_name: string;
  accuracy?: number;
  r2_score?: number;
  metrics: any;
  plots: ModelPlots;
  feature_importance: FeatureImportance[];
}

export const trainingService = {
  trainModel,
  getTrainingResults,
  getAvailableModels,
  experimentTrain,
  getExperiment,
};