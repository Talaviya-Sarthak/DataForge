import { useMLExperiment } from '../../contexts/MLExperimentContext';

interface TuningSectionProps {
    onTune: () => void;
}

export const TuningSection = ({ onTune }: TuningSectionProps) => {
    const { trainingResults, tuningResults, isTuning, experimentId } = useMLExperiment();

    if (!trainingResults) return null;

    return (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Hyperparameter Tuning
                </h2>

                {!tuningResults && (
                    <button
                        onClick={onTune}
                        disabled={isTuning || !experimentId}
                        className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium rounded-lg hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                        {isTuning ? (
                            <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Tuning...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Run Hyperparameter Tuning
                            </>
                        )}
                    </button>
                )}
            </div>

            {!tuningResults ? (
                <div className="text-center py-8 text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h3 className="text-lg font-medium mb-2">Optimize Your Top Models</h3>
                    <p className="text-sm max-w-md mx-auto">
                        Hyperparameter tuning will automatically optimize the top 2 performing models using RandomizedSearchCV.
                        This may take a few minutes depending on dataset size.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-400">{tuningResults.models_tuned}</div>
                            <div className="text-sm text-gray-400">Models Tuned</div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-gray-400">{tuningResults.models_skipped}</div>
                            <div className="text-sm text-gray-400">Skipped</div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-purple-400">{tuningResults.search_method}</div>
                            <div className="text-sm text-gray-400">Search Method</div>
                        </div>
                    </div>

                    {/* Tuning Results */}
                    {tuningResults.tuning_results.map((result) => (
                        <div
                            key={result.model}
                            className={`rounded-lg border p-4 ${
                                result.tuned
                                    ? 'bg-green-900/20 border-green-700'
                                    : 'bg-gray-800/50 border-gray-700'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        {result.model}
                                        {result.tuned && (
                                            <span className="px-2 py-0.5 bg-green-600 text-green-100 text-xs rounded-full">
                                                Tuned
                                            </span>
                                        )}
                                    </h3>
                                    {result.error && (
                                        <p className="text-sm text-red-400 mt-1">{result.error}</p>
                                    )}
                                </div>
                                {result.tuning_time_ms && (
                                    <span className="text-sm text-gray-400">
                                        {result.tuning_time_ms >= 1000
                                            ? `${(result.tuning_time_ms / 1000).toFixed(1)}s`
                                            : `${result.tuning_time_ms}ms`}
                                    </span>
                                )}
                            </div>

                            {result.tuned && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Best Parameters */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-400 mb-2">Best Parameters</h4>
                                        <div className="bg-gray-900/50 rounded-lg p-3 font-mono text-sm">
                                            {Object.entries(result.best_params || {}).map(([key, value]) => (
                                                <div key={key} className="flex justify-between py-1">
                                                    <span className="text-gray-400">{key}:</span>
                                                    <span className="text-white">{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Improvement */}
                                    {result.improvement && Object.keys(result.improvement).length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-400 mb-2">Improvement</h4>
                                            <div className="space-y-2">
                                                {Object.entries(result.improvement).map(([metric, value]) => (
                                                    <div key={metric} className="flex justify-between items-center">
                                                        <span className="text-gray-400 text-sm">{metric}</span>
                                                        <span
                                                            className={`font-medium ${
                                                                value > 0
                                                                    ? 'text-green-400'
                                                                    : value < 0
                                                                    ? 'text-red-400'
                                                                    : 'text-gray-400'
                                                            }`}
                                                        >
                                                            {value > 0 ? '+' : ''}{value.toFixed(2)}%
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Metrics Comparison */}
                            {result.tuned && result.original_metrics && result.tuned_metrics && (
                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <h4 className="text-sm font-medium text-gray-400 mb-2">Metrics Comparison</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-gray-400">
                                                    <th className="text-left py-2">Metric</th>
                                                    <th className="text-right py-2">Before</th>
                                                    <th className="text-right py-2">After</th>
                                                    <th className="text-right py-2">Change</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(result.tuned_metrics).map(([metric, newVal]) => {
                                                    const oldVal = (result.original_metrics as any)?.[metric];
                                                    if (oldVal === undefined || newVal === undefined) return null;
                                                    const change = ((newVal - oldVal) / oldVal) * 100;

                                                    return (
                                                        <tr key={metric} className="border-t border-gray-800">
                                                            <td className="py-2">{metric}</td>
                                                            <td className="text-right py-2 font-mono">
                                                                {oldVal.toFixed(4)}
                                                            </td>
                                                            <td className="text-right py-2 font-mono">
                                                                {newVal.toFixed(4)}
                                                            </td>
                                                            <td
                                                                className={`text-right py-2 font-mono ${
                                                                    change > 0
                                                                        ? 'text-green-400'
                                                                        : change < 0
                                                                        ? 'text-red-400'
                                                                        : ''
                                                                }`}
                                                            >
                                                                {change > 0 ? '+' : ''}{change.toFixed(2)}%
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
