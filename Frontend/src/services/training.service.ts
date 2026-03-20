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
