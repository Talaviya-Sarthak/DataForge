import { useState } from 'react';
import { useMLExperiment } from '../../contexts/MLExperimentContext';
import { trainingService } from '../../services/training.service';
import { Download, Trash2 } from 'lucide-react';

// Helper function defined before use
const formatTime = (ms: number | undefined): string => {
    if (!ms) return 'N/A';
    return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
};

export const ResultsTable = () => {
    const { trainingResults, deleteModel } = useMLExperiment();
    const [downloading, setDownloading] = useState<number | null>(null);
    const [terminating, setTerminating] = useState<number | null>(null);
    const [confirmTarget, setConfirmTarget] = useState<{ id: number; name: string } | null>(null);

    if (!trainingResults) return null;

    const { base_models, task_type, results_table } = trainingResults;
    const successfulModels = (base_models ?? []).filter((m) => m.status === 'success' || m.status === undefined);

    // Use results_table if available, otherwise format from base_models
    const tableData = results_table || successfulModels.map((m) => {
        // Access metrics from nested structure or directly
        const metrics = (m.metrics || m) as any;
        
        if (task_type === 'classification') {
            return {
                model: m.model_name || m.model || m.name,
                model_id: m.model_id,
                accuracy: metrics.accuracy?.toFixed(4) || 'N/A',
                precision: metrics.precision?.toFixed(4) || 'N/A',
                recall: metrics.recall?.toFixed(4) || 'N/A',
                f1: metrics.f1_score?.toFixed(4) || 'N/A',
                roc_auc: metrics.roc_auc?.toFixed(4) || 'N/A',
                training_time: formatTime(m.training_time_ms),
            };
        } else {
            return {
                model: m.model_name || m.model || m.name,
                model_id: m.model_id,
                r2: metrics.r2_score?.toFixed(4) || 'N/A',
                rmse: metrics.rmse?.toFixed(4) || 'N/A',
                mse: metrics.mse?.toFixed(4) || 'N/A',
                mae: metrics.mae?.toFixed(4) || 'N/A',
                training_time: formatTime(m.training_time_ms),
            };
        }
    });

    const handleDownload = async (modelId: number, modelName: string) => {
        setDownloading(modelId);
        try {
            await trainingService.downloadModel(modelId);
        } catch (err: any) {
            console.error('Download failed:', err);
        } finally {
            setDownloading(null);
        }
    };

    const handleTerminate = async (modelId: number) => {
        setTerminating(modelId);
        try {
            await deleteModel(modelId);
        } catch (err: any) {
            console.error('Delete failed:', err);
        } finally {
            setTerminating(null);
            setConfirmTarget(null);
        }
    };

    return (
        <>
            {/* Confirmation Dialog */}
            {confirmTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
                        <h3 className="mb-2 text-lg font-semibold text-white">Delete Model</h3>
                        <p className="mb-1 text-sm text-neutral-300">
                            Are you sure you want to delete <span className="font-medium text-white">"{confirmTarget.name}"</span>?
                        </p>
                        <p className="mb-6 text-sm text-red-400">This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmTarget(null)}
                                className="rounded-lg border border-neutral-600 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleTerminate(confirmTarget.id)}
                                className="rounded-lg bg-red-600/20 border border-red-500/50 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-600/30 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-gradient-to-b from-neutral-900/80 to-neutral-950/80 rounded-xl p-6 border border-neutral-800/70 shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-shadow duration-300">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Model Results
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm">
                            <tr className="border-b border-white/5">
                                <th className="text-left py-4 px-4 font-medium text-neutral-300">Model</th>
                                {task_type === 'classification' ? (
                                    <>
                                        <th className="text-right py-4 px-4 font-medium text-neutral-300">Accuracy</th>
                                        <th className="text-right py-4 px-4 font-medium text-neutral-300">Precision</th>
                                        <th className="text-right py-4 px-4 font-medium text-neutral-300">Recall</th>
                                        <th className="text-right py-4 px-4 font-medium text-neutral-300">F1 Score</th>
                                        <th className="text-right py-4 px-4 font-medium text-neutral-300">ROC AUC</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="text-right py-4 px-4 font-medium text-neutral-300">R² Score</th>
                                        <th className="text-right py-4 px-4 font-medium text-neutral-300">RMSE</th>
                                        <th className="text-right py-4 px-4 font-medium text-neutral-300">MSE</th>
                                        <th className="text-right py-4 px-4 font-medium text-neutral-300">MAE</th>
                                    </>
                                )}
                                <th className="text-right py-4 px-4 font-medium text-neutral-300">Time</th>
                                <th className="text-center py-4 px-4 font-medium text-neutral-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((row: any, index: number) => {
                                const modelId = Number(row.model_id || index);
                                const isBusy = downloading === modelId || terminating === modelId;
                                
                                return (
                                    <tr
                                        key={`model-${index}-${row.model}`}
                                        className="border-b border-white/5 hover:bg-neutral-800/30 transition-colors duration-200"
                                    >
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                {index === 0 && (
                                                    <span className="px-2 py-0.5 bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 text-xs rounded-full">
                                                        Best
                                                    </span>
                                                )}
                                                <span className="font-medium text-white">{row.model}</span>
                                            </div>
                                        </td>
                                        {task_type === 'classification' ? (
                                            <>
                                                <td className="text-right py-4 px-4 font-mono text-neutral-200">{row.accuracy}</td>
                                                <td className="text-right py-4 px-4 font-mono text-neutral-200">{row.precision}</td>
                                                <td className="text-right py-4 px-4 font-mono text-neutral-200">{row.recall}</td>
                                                <td className="text-right py-4 px-4 font-mono text-neutral-200">{row.f1}</td>
                                                <td className="text-right py-4 px-4 font-mono text-neutral-200">{row.roc_auc}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="text-right py-4 px-4 font-mono text-neutral-200">{row.r2}</td>
                                                <td className="text-right py-4 px-4 font-mono text-neutral-200">{row.rmse}</td>
                                                <td className="text-right py-4 px-4 font-mono text-neutral-200">{row.mse}</td>
                                                <td className="text-right py-4 px-4 font-mono text-neutral-200">{row.mae}</td>
                                            </>
                                        )}
                                        <td className="text-right py-4 px-4 text-neutral-400">{row.training_time}</td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Download Button */}
                                                <button
                                                    onClick={() => handleDownload(modelId, row.model)}
                                                    disabled={isBusy}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600/20 border border-cyan-500/30 px-3 py-1.5 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-600/30 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] disabled:cursor-not-allowed disabled:opacity-40"
                                                    title="Download model"
                                                >
                                                    {downloading === modelId ? (
                                                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                    ) : (
                                                        <Download className="h-4 w-4" />
                                                    )}
                                                </button>

                                                {/* Terminate Button */}
                                                <button
                                                    onClick={() => setConfirmTarget({ id: modelId, name: row.model })}
                                                    disabled={isBusy}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-sm font-medium text-red-400 transition-all hover:bg-red-900/20 hover:border-red-500/50 disabled:cursor-not-allowed disabled:opacity-40"
                                                    title="Delete model"
                                                >
                                                    {terminating === modelId ? (
                                                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
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

                {/* Summary */}
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-sm text-neutral-400">
                    <span>
                        {(trainingResults as any).summary?.successful ?? base_models.length} successful / {(trainingResults as any).summary?.failed ?? 0} failed
                    </span>
                    
                </div>
            </div>
        </>
    );
};
