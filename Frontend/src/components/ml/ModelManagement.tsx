import { useState, useEffect } from 'react';
import { useMLExperiment } from '../../contexts/MLExperimentContext';
import { trainingService } from '../../services/training.service';

export const ModelManagement = () => {
    const { trainingResults } = useMLExperiment();
    const [downloading, setDownloading] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    if (!trainingResults) return null;

    const { base_models, task_type } = trainingResults;
    const successfulModels = (base_models ?? []).filter((m) => m.status === 'success' || m.status === undefined);

    const handleDownload = async (modelId: number, modelName: string) => {
        setDownloading(modelId);
        setError(null);
        setSuccess(null);

        try {
            await trainingService.downloadModel(modelId);
            setSuccess(`Model "${modelName}" downloaded successfully. Model data has been removed from the system.`);
            
            // Refresh the page after 2 seconds to show updated model list
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to download model');
        } finally {
            setDownloading(null);
        }
    };

    const getMetricValue = (model: any) => {
        const metrics = model.metrics || model;
        if (task_type === 'classification') {
            return metrics.accuracy?.toFixed(4) || 'N/A';
        } else {
            return metrics.r2_score?.toFixed(4) || 'N/A';
        }
    };

    const getMetricLabel = () => {
        return task_type === 'classification' ? 'Accuracy' : 'R² Score';
    };

    return (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    Model Management
                </h2>
                <div className="text-sm text-gray-400">
                    {successfulModels.length} model{successfulModels.length !== 1 ? 's' : ''} available
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                </div>
            )}

            {success && (
                <div className="mb-4 p-4 bg-green-900/20 border border-green-500 rounded-lg text-green-400">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {success}
                    </div>
                </div>
            )}

            {/* Warning Banner */}
            <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <h3 className="text-yellow-500 font-medium mb-1">⚠️ Important: Download & Auto-Delete</h3>
                        <p className="text-sm text-yellow-200/80">
                            When you download a model, it will be automatically removed from the database and storage after successful download. 
                            Make sure to save the downloaded file in a secure location.
                        </p>
                    </div>
                </div>
            </div>

            {/* Models Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="text-left py-3 px-4 font-medium text-gray-300">Model Name</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-300">Type</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-300">{getMetricLabel()}</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-300">Training Time</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {successfulModels.map((model, index) => {
                            const modelId = model.model_id || index;
                            const modelName = model.model_name || model.model || model.name;
                            const isDownloading = downloading === modelId;

                            return (
                                <tr
                                    key={`model-mgmt-${modelId}`}
                                    className="border-b border-gray-800 hover:bg-gray-800/50"
                                >
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-2">
                                            {index === 0 && (
                                                <span className="px-2 py-0.5 bg-yellow-600 text-yellow-100 text-xs rounded-full">
                                                    Best
                                                </span>
                                            )}
                                            <span className="font-medium">{modelName}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            task_type === 'classification'
                                                ? 'bg-blue-900/30 text-blue-400 border border-blue-500'
                                                : 'bg-green-900/30 text-green-400 border border-green-500'
                                        }`}>
                                            {task_type}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right font-mono">
                                        {getMetricValue(model)}
                                    </td>
                                    <td className="py-4 px-4 text-right text-gray-400">
                                        {model.training_time_ms
                                            ? model.training_time_ms >= 1000
                                                ? `${(model.training_time_ms / 1000).toFixed(2)}s`
                                                : `${model.training_time_ms}ms`
                                            : 'N/A'}
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <button
                                            onClick={() => handleDownload(modelId, modelName)}
                                            disabled={isDownloading}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-sm"
                                        >
                                            {isDownloading ? (
                                                <>
                                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Downloading...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Download
                                                </>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {successfulModels.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>No trained models available</p>
                </div>
            )}
        </div>
    );
};
