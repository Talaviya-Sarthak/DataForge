import { useMLExperiment } from '../../contexts/MLExperimentContext';

// Helper function defined before use
const formatTime = (ms: number | undefined): string => {
    if (!ms) return 'N/A';
    return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
};

export const ResultsTable = () => {
    const { trainingResults } = useMLExperiment();

    if (!trainingResults) return null;

    const { base_models, task_type, results_table } = trainingResults;
    const successfulModels = (base_models ?? []).filter((m) => m.status === 'success' || m.status === undefined);

    // Use results_table if available, otherwise format from base_models
    const tableData = results_table || successfulModels.map((m) => {
        // Access metrics from nested structure or directly
        const metrics = m.metrics || m;
        
        if (task_type === 'classification') {
            return {
                model: m.model_name || m.model || m.name,
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
                r2: metrics.r2_score?.toFixed(4) || 'N/A',
                rmse: metrics.rmse?.toFixed(4) || 'N/A',
                mse: metrics.mse?.toFixed(4) || 'N/A',
                mae: metrics.mae?.toFixed(4) || 'N/A',
                training_time: formatTime(m.training_time_ms),
            };
        }
    });

    return (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Model Results
            </h2>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="text-left py-3 px-4 font-medium text-gray-300">Model</th>
                            {task_type === 'classification' ? (
                                <>
                                    <th className="text-right py-3 px-4 font-medium text-gray-300">Accuracy</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-300">Precision</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-300">Recall</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-300">F1 Score</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-300">ROC AUC</th>
                                </>
                            ) : (
                                <>
                                    <th className="text-right py-3 px-4 font-medium text-gray-300">R² Score</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-300">RMSE</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-300">MSE</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-300">MAE</th>
                                </>
                            )}
                            <th className="text-right py-3 px-4 font-medium text-gray-300">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row: any, index: number) => (
                            <tr
                                key={`model-${index}-${row.model}`}
                                className={`border-b border-gray-800 ${
                                    index === 0 ? 'bg-purple-900/20' : 'hover:bg-gray-800/50'
                                }`}
                            >
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        {index === 0 && (
                                            <span className="px-2 py-0.5 bg-yellow-600 text-yellow-100 text-xs rounded-full">
                                                Best
                                            </span>
                                        )}
                                        <span className="font-medium">{row.model}</span>
                                    </div>
                                </td>
                                {task_type === 'classification' ? (
                                    <>
                                        <td className="text-right py-3 px-4 font-mono">{row.accuracy}</td>
                                        <td className="text-right py-3 px-4 font-mono">{row.precision}</td>
                                        <td className="text-right py-3 px-4 font-mono">{row.recall}</td>
                                        <td className="text-right py-3 px-4 font-mono">{row.f1}</td>
                                        <td className="text-right py-3 px-4 font-mono">{row.roc_auc}</td>
                                    </>
                                ) : (
                                    <>
                                        <td className="text-right py-3 px-4 font-mono">{row.r2}</td>
                                        <td className="text-right py-3 px-4 font-mono">{row.rmse}</td>
                                        <td className="text-right py-3 px-4 font-mono">{row.mse}</td>
                                        <td className="text-right py-3 px-4 font-mono">{row.mae}</td>
                                    </>
                                )}
                                <td className="text-right py-3 px-4 text-gray-400">{row.training_time}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between text-sm text-gray-400">
                <span>
                    {trainingResults.summary?.successful ?? base_models.length} successful / {trainingResults.summary?.failed ?? 0} failed
                </span>
                <span>
                    Target: <span className="text-white">{trainingResults.target_column}</span>
                </span>
            </div>
        </div>
    );
};
