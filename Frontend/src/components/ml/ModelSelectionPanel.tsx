import { useEffect, useState } from 'react';
import { useMLExperiment } from '../../contexts/MLExperimentContext';
import { getAvailableModels } from '../../services/training.service';

interface ModelSelectionPanelProps {
    onTrain: () => void;
}

export const ModelSelectionPanel = ({ onTrain }: ModelSelectionPanelProps) => {
    const { config, setConfig, isTraining } = useMLExperiment();
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch available models when task type changes
    useEffect(() => {
        const fetchModels = async () => {
            setLoading(true);
            try {
                const response = await getAvailableModels(config.taskType);
                setAvailableModels(response.models || []);
            } catch (err) {
                // Fallback models
                setAvailableModels(
                    config.taskType === 'classification'
                        ? [
                            'LogisticRegression',
                            'RandomForestClassifier',
                            'GradientBoostingClassifier',
                            'SVC',
                            'KNeighborsClassifier',
                            'GaussianNB',
                        ]
                        : [
                            'LinearRegression',
                            'RandomForestRegressor',
                            'GradientBoostingRegressor',
                            'SVR',
                            'KNeighborsRegressor',
                        ]
                );
            } finally {
                setLoading(false);
            }
        };

        fetchModels();
    }, [config.taskType]);

    const toggleModel = (model: string) => {
        const current = config.selectedModels;
        if (current.includes(model)) {
            setConfig({ selectedModels: current.filter((m) => m !== model) });
        } else {
            setConfig({ selectedModels: [...current, model] });
        }
    };

    const selectAll = () => {
        setConfig({ selectedModels: [...availableModels] });
    };

    const deselectAll = () => {
        setConfig({ selectedModels: [] });
    };

    // Model descriptions
    const modelDescriptions: Record<string, string> = {
        LogisticRegression: 'Linear model for classification',
        RandomForestClassifier: 'Ensemble of decision trees',
        GradientBoostingClassifier: 'Boosted decision trees',
        SVC: 'Support Vector Machine',
        KNeighborsClassifier: 'K-Nearest Neighbors',
        GaussianNB: 'Naive Bayes classifier',
        DecisionTreeClassifier: 'Single decision tree',
        LinearRegression: 'Linear model for regression',
        RandomForestRegressor: 'Ensemble of decision trees',
        GradientBoostingRegressor: 'Boosted decision trees',
        SVR: 'Support Vector Regression',
        KNeighborsRegressor: 'K-Nearest Neighbors',
        Ridge: 'L2 regularized linear regression',
        Lasso: 'L1 regularized linear regression',
    };

    return (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    Model Selection
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={selectAll}
                        className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                    >
                        Select All
                    </button>
                    <button
                        onClick={deselectAll}
                        className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Models Grid */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {loading ? (
                    <div className="text-center py-8 text-gray-400">Loading models...</div>
                ) : (
                    availableModels.map((model) => (
                        <label
                            key={model}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                                config.selectedModels.includes(model)
                                    ? 'bg-purple-900/30 border-purple-500'
                                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={config.selectedModels.includes(model)}
                                onChange={() => toggleModel(model)}
                                className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-900"
                            />
                            <div className="flex-1">
                                <div className="font-medium text-sm">{model}</div>
                                {modelDescriptions[model] && (
                                    <div className="text-xs text-gray-500">{modelDescriptions[model]}</div>
                                )}
                            </div>
                            {/* Scaling indicator */}
                            {['LogisticRegression', 'SVC', 'SVR', 'KNeighborsClassifier', 'KNeighborsRegressor', 'LinearRegression', 'Ridge', 'Lasso'].includes(model) && (
                                <span className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-400 rounded">
                                    Scaled
                                </span>
                            )}
                        </label>
                    ))
                )}
            </div>

            {/* Selected Count */}
            <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-400">
                        {config.selectedModels.length} of {availableModels.length} models selected
                    </span>
                </div>

                {/* Train Button */}
                <button
                    onClick={onTrain}
                    disabled={isTraining || config.selectedModels.length === 0 || !config.targetColumn}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                    {isTraining ? (
                        <>
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Training...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Train Models
                        </>
                    )}
                </button>

                {!config.targetColumn && (
                    <p className="text-xs text-yellow-500 mt-2 text-center">
                        Please select a target column first
                    </p>
                )}
            </div>
        </div>
    );
};
