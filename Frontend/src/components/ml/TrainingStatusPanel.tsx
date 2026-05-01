import { useMLExperiment } from '../../contexts/MLExperimentContext';

interface TrainingStatusPanelProps {
    /** Called when user wants to cancel / go back to config */
    onCancel?: () => void;
}

const statusColor: Record<string, string> = {
    running:   'text-blue-400 bg-blue-900/30 border-blue-700',
    pending:   'text-yellow-400 bg-yellow-900/30 border-yellow-700',
    completed: 'text-green-400 bg-green-900/30 border-green-700',
    failed:    'text-red-400 bg-red-900/30 border-red-700',
};

const statusDot: Record<string, string> = {
    running:   'bg-blue-400 animate-pulse',
    pending:   'bg-yellow-400',
    completed: 'bg-green-400',
    failed:    'bg-red-400',
};

export const TrainingStatusPanel = ({ onCancel }: TrainingStatusPanelProps) => {
    const {
        isTraining,
        trainingProgress,
        modelsCompleted,
        config,
        error,
        setError,
    } = useMLExperiment();

    if (!isTraining) return null;

    const total = config.selectedModels.length;
    const completed = modelsCompleted;
    const running = Math.min(1, total - completed); // at least 1 running while training
    const pending = Math.max(0, total - completed - running);

    return (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                    <span className="font-semibold text-white text-sm">
                        Training in Progress
                    </span>
                </div>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="text-gray-500 hover:text-gray-300 text-xs transition"
                    >
                        minimize
                    </button>
                )}
            </div>

            {/* Progress bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{completed}/{total} models</span>
                    <span>{trainingProgress}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${trainingProgress}%` }}
                    />
                </div>
            </div>

            {/* Model status breakdown */}
            <div className="space-y-1.5">
                    {[
                        { label: 'Completed', count: completed, state: 'completed' },
                        { label: 'Running',   count: running,   state: 'running'   },
                        { label: 'Pending',   count: pending,   state: 'pending'   },
                    ].map(({ label, count, state }) => (
                        <div
                            key={state}
                            className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs ${statusColor[state]}`}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${statusDot[state]}`} />
                                <span>{label}</span>
                            </div>
                            <span className="font-mono font-semibold">{count}</span>
                        </div>
                    ))}
                </div>

            {/* Error inline */}
            {error && (
                <div className="mt-3 text-xs text-red-300 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 flex justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-white">×</button>
                </div>
            )}
        </div>
    );
};
