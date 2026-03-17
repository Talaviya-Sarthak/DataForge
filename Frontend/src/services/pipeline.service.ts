/**
 * Pipeline Service – frontend API calls for the new pipeline system.
 * All endpoints are under /api/datasets/...
 */

const apiBase = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function authHeadersMultipart(): Record<string, string> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || err.error || 'Request failed');
  }
  return res.json();
}

// ─────────────────────────────────────────────
// UNDO last pipeline step
// ─────────────────────────────────────────────
export const undoLastStep = async (datasetId: number) => {
  const res = await fetch(`${apiBase}/api/datasets/${datasetId}/undo`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────
// FINALIZE dataset
// ─────────────────────────────────────────────
export const finalizeDataset = async (datasetId: number) => {
  const res = await fetch(`${apiBase}/api/datasets/${datasetId}/finalize`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────
// DOWNLOAD dataset (returns blob)
// ─────────────────────────────────────────────
export const downloadDataset = async (datasetId: number): Promise<Blob> => {
  const token = localStorage.getItem('token');
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
  const res = await fetch(`${apiBase}/api/datasets/list`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────
// GET resumable datasets (in_progress)
// ─────────────────────────────────────────────
export const getResumableDatasets = async () => {
  const res = await fetch(`${apiBase}/api/datasets/list`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await handleResponse(res);
  return { datasets: data.datasets?.filter((d: any) => d.status === 'in_progress') || [] };
};

// ─────────────────────────────────────────────
// GET steps for a dataset
// ─────────────────────────────────────────────
export const getDatasetSteps = async (datasetId: number) => {
  const res = await fetch(`${apiBase}/api/datasets/${datasetId}/steps`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────
// RESUME dataset (re-upload + replay)
// ─────────────────────────────────────────────
export const resumeDataset = async (datasetId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${apiBase}/api/datasets/${datasetId}/resume`, {
    method: 'POST',
    headers: authHeadersMultipart(),
    body: formData,
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────
// SWITCH active dataset
// ─────────────────────────────────────────────
export const switchDataset = async (datasetId: number) => {
  const res = await fetch(`${apiBase}/api/datasets/${datasetId}/activate`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(res);
};
