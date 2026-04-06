const apiBase = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000';
import { apiRequest, getAccessToken } from './api.client';

// ── Types ───────────────────────────────────────────────

export interface CleaningRequest {
    action: string;
    strategy: string;
    columns: string[];
    dataset_id?: number;
}

export interface DatasetListItem {
    id: number;
    original_filename: string;
    status: string;
    is_active: boolean;
    total_rows: number;
    pipeline_id: number | null;
    pipeline_status: string | null;
    total_steps: number | null;
    created_at: string;
}

// ── 1. CLEAN (existing, backward-compatible) ────────────

export const applyCleaningAction = async (request: CleaningRequest) => {
    return apiRequest(`${apiBase}/api/datasets/clean`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        retryOnUnauthorized: true,
    });
};

// ── 2. UNDO LAST STEP ──────────────────────────────────

export const undoLastStep = async (datasetId: number) => {
    return apiRequest(`${apiBase}/api/datasets/${datasetId}/undo`, {
        method: 'POST',
        retryOnUnauthorized: true,
    });
};

// ── 3. FINALIZE DATASET ────────────────────────────────

export const finalizeDataset = async (datasetId: number) => {
    return apiRequest(`${apiBase}/api/datasets/${datasetId}/finalize`, {
        method: 'POST',
        retryOnUnauthorized: true,
    });
};

// ── 4. DOWNLOAD DATASET (CSV) ──────────────────────────

export const downloadDataset = async (datasetId: number, filename?: string) => {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');

    let res: Response;
    try {
        res = await fetch(`${apiBase}/api/datasets/${datasetId}/download`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    } catch (networkErr: any) {
        throw new Error('Cannot reach server. Please check if the backend is running.');
    }

    if (!res.ok) {
        // Try to parse error as JSON, fall back to status text
        let errorMsg = `Download failed (${res.status})`;
        try {
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const err = await res.json();
                errorMsg = err.message || err.error || err.detail || errorMsg;
            } else {
                const text = await res.text();
                // Try parsing as JSON anyway (some servers don't set content-type)
                try {
                    const parsed = JSON.parse(text);
                    errorMsg = parsed.message || parsed.error || parsed.detail || errorMsg;
                } catch { /* use default errorMsg */ }
            }
        } catch { /* use default errorMsg */ }
        throw new Error(errorMsg);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `dataset_${datasetId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
};

// ── 5. LIST USER DATASETS ──────────────────────────────

export const getUserDatasets = async (): Promise<DatasetListItem[]> => {
    const json = await apiRequest<{ datasets?: DatasetListItem[] }>(`${apiBase}/api/datasets/list`, {
        retryOnUnauthorized: true,
    });
    return json.datasets || [];
};

// ── 6. RESUME DATASET (re-upload + rebuild) ─────────────

export const resumeDataset = async (datasetId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        return await apiRequest(`${apiBase}/api/datasets/${datasetId}/resume`, {
            method: 'POST',
            body: formData,
            retryOnUnauthorized: true,
        });
    } catch (err: any) {
        const errorMsg = err?.message || 'Resume failed';
        throw new Error(errorMsg);
    }
};

// ── 7. GET PIPELINE STEPS ────────────────────────────────

export interface PipelineStep {
    step_index: number;
    type: string;
    strategy: string;
    columns: string[];
    created_at: string;
}

export const getPipelineSteps = async (datasetId: number): Promise<PipelineStep[]> => {
    const json = await apiRequest<{ steps?: PipelineStep[] }>(`${apiBase}/api/datasets/${datasetId}/steps`, {
        retryOnUnauthorized: true,
    });
    return json.steps || [];
};

// ── 8. ACTIVATE DATASET ────────────────────────────────

export const activateDataset = async (datasetId: number) => {
    return apiRequest(`${apiBase}/api/datasets/${datasetId}/activate`, {
        method: 'POST',
        retryOnUnauthorized: true,
    });
};
