/**
 * Pipeline Service – frontend API calls for the new pipeline system.
 * All endpoints are under /api/datasets/...
 */

const apiBase = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000';
import { apiRequest, getAccessToken } from './api.client';

// ─────────────────────────────────────────────
// UNDO last pipeline step
// ─────────────────────────────────────────────
export const undoLastStep = async (datasetId: number) => {
  return apiRequest(`${apiBase}/api/datasets/${datasetId}/undo`, {
    method: 'POST',
    retryOnUnauthorized: true,
  });
};

// ─────────────────────────────────────────────
// FINALIZE dataset
// ─────────────────────────────────────────────
export const finalizeDataset = async (datasetId: number) => {
  return apiRequest(`${apiBase}/api/datasets/${datasetId}/finalize`, {
    method: 'POST',
    retryOnUnauthorized: true,
  });
};

// ─────────────────────────────────────────────
// DOWNLOAD dataset (returns blob)
// ─────────────────────────────────────────────
export const downloadDataset = async (datasetId: number): Promise<Blob> => {
  const token = getAccessToken();
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`${apiBase}/api/datasets/${datasetId}/download`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Download failed' }));
    throw new Error(err.message || 'Download failed');
  }
  return res.blob();
};

// ─────────────────────────────────────────────
// LIST all user datasets
// ─────────────────────────────────────────────
export const getUserDatasets = async () => {
  return apiRequest(`${apiBase}/api/datasets/list`, {
    method: 'GET',
    retryOnUnauthorized: true,
  });
};

// ─────────────────────────────────────────────
// GET resumable datasets (in_progress)
// ─────────────────────────────────────────────
export const getResumableDatasets = async () => {
  const data = await apiRequest<any>(`${apiBase}/api/datasets/list`, {
    method: 'GET',
    retryOnUnauthorized: true,
  });
  return { datasets: data.datasets?.filter((d: any) => d.status === 'in_progress') || [] };
};

// ─────────────────────────────────────────────
// GET steps for a dataset
// ─────────────────────────────────────────────
export const getDatasetSteps = async (datasetId: number) => {
  return apiRequest(`${apiBase}/api/datasets/${datasetId}/steps`, {
    method: 'GET',
    retryOnUnauthorized: true,
  });
};

// ─────────────────────────────────────────────
// RESUME dataset (re-upload + replay)
// ─────────────────────────────────────────────
export const resumeDataset = async (datasetId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest(`${apiBase}/api/datasets/${datasetId}/resume`, {
    method: 'POST',
    body: formData,
    retryOnUnauthorized: true,
  });
};

// ─────────────────────────────────────────────
// SWITCH active dataset
// ─────────────────────────────────────────────
export const switchDataset = async (datasetId: number) => {
  return apiRequest(`${apiBase}/api/datasets/${datasetId}/activate`, {
    method: 'POST',
    retryOnUnauthorized: true,
  });
};
