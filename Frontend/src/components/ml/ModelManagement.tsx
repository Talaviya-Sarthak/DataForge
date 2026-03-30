import { useState, useEffect } from 'react';
import { useMLExperiment } from '../../contexts/MLExperimentContext';
import { trainingService } from '../../services/training.service';
import type { ModelResult } from '../../services/training.service';

// ── Confirmation dialog ───────────────────────────────────────────────────────
const ConfirmDialog = ({
  modelName,
  onConfirm,
  onCancel,
}: {
  modelName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
      <h3 className="mb-2 text-lg font-semibold text-white">Delete Model</h3>
      <p className="mb-1 text-sm text-gray-300">
        Are you sure you want to delete <span className="font-medium text-white">"{modelName}"</span>?
      </p>
      <p className="mb-6 text-sm text-red-400">This action cannot be undone.</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export const ModelManagement = () => {
  const { trainingResults } = useMLExperiment();

  const [models, setModels] = useState<ModelResult[]>([]);

  // Sync whenever trainingResults changes (covers the case where results
  // arrive after this component first mounts)
  useEffect(() => {
    setModels(
      (trainingResults?.base_models ?? []).filter(
        (m) => m.status === 'success' || m.status === undefined,
      ),
    );
  }, [trainingResults]);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [terminating, setTerminating] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ id: number; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!trainingResults) return null;

  const { task_type } = trainingResults;

  const removeModel = (modelId: number) =>
    setModels((prev) => prev.filter((m) => Number(m.model_id) !== modelId));

  // ── Download ────────────────────────────────────────────────────────────────
  const handleDownload = async (modelId: number, modelName: string) => {
    setDownloading(modelId);
    setError(null);
    setSuccess(null);
    try {
      await trainingService.downloadModel(modelId);
      setSuccess(`"${modelName}" downloaded. Model removed from system.`);
      removeModel(modelId);
    } catch (err: any) {
      setError(err.message || 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  // ── Terminate (delete without download) ─────────────────────────────────────
  const handleTerminateConfirmed = async () => {
    if (!confirmTarget) return;
    const { id, name } = confirmTarget;
    setConfirmTarget(null);
    setTerminating(id);
    setError(null);
    setSuccess(null);
    try {
      await trainingService.deleteModel(id);
      setSuccess(`"${name}" has been deleted.`);
      removeModel(id);
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    } finally {
      setTerminating(null);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getMetricValue = (model: ModelResult) => {
    const m = model.metrics || {};
    return task_type === 'classification'
      ? (m.accuracy?.toFixed(4) ?? 'N/A')
      : (m.r2_score?.toFixed(4) ?? 'N/A');
  };

  const formatTime = (ms?: number) =>
    !ms ? 'N/A' : ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;

  const isBusy = (id: number) => downloading === id || terminating === id;

  return (
    <>
      {/* Confirmation dialog rendered outside table flow */}
      {confirmTarget && (
        <ConfirmDialog
          modelName={confirmTarget.name}
          onConfirm={handleTerminateConfirmed}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Model Management
          </h2>
          <span className="text-sm text-gray-400">
            {models.length} model{models.length !== 1 ? 's' : ''} available
          </span>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500 bg-red-900/20 p-4 text-sm text-red-400">
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500 bg-green-900/20 p-4 text-sm text-green-400">
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}

        {/* Warning banner */}
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-yellow-600 bg-yellow-900/20 p-4">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="mb-1 font-medium text-yellow-500">⚠️ Download &amp; Auto-Delete</p>
            <p className="text-sm text-yellow-200/80">
              Downloading a model removes it from storage automatically. Save the file securely.
              Use <span className="font-medium text-red-400">Terminate</span> to delete without downloading.
            </p>
          </div>
        </div>

        {/* Table */}
        {models.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-left font-medium text-gray-300">Model Name</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-300">Type</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-300">
                    {task_type === 'classification' ? 'Accuracy' : 'R² Score'}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-300">Time</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model, index) => {
                  const modelId = Number(model.model_id);
                  const modelName = model.model_name || model.model || model.name || 'Unknown';
                  const busy = isBusy(modelId);

                  return (
                    <tr key={`mgmt-${modelId}`} className="border-b border-gray-800 hover:bg-gray-800/40">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <span className="rounded-full bg-yellow-600 px-2 py-0.5 text-xs text-yellow-100">
                              Best
                            </span>
                          )}
                          <span className="font-medium">{modelName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${
                          task_type === 'classification'
                            ? 'border-blue-500 bg-blue-900/30 text-blue-400'
                            : 'border-green-500 bg-green-900/30 text-green-400'
                        }`}>
                          {task_type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-mono">{getMetricValue(model)}</td>
                      <td className="px-4 py-4 text-right text-gray-400">{formatTime(model.training_time_ms)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Download */}
                          <button
                            onClick={() => handleDownload(modelId, modelName)}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-700"
                          >
                            {downloading === modelId ? (
                              <>
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Downloading…
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                              </>
                            )}
                          </button>

                          {/* Terminate */}
                          <button
                            onClick={() => setConfirmTarget({ id: modelId, name: modelName })}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-600 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/30 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {terminating === modelId ? (
                              <>
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Deleting…
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Terminate
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <svg className="mx-auto mb-4 h-16 w-16 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>No trained models available</p>
          </div>
        )}
      </div>
    </>
  );
};
