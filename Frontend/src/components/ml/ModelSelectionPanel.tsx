import { useEffect, useState } from 'react';
import { useMLExperiment } from '../../contexts/MLExperimentContext';
import { getAvailableModels } from '../../services/training.service';

interface ModelSelectionPanelProps {
    onTrain: () => void;
}

export const ModelSelectionPanel = ({ onTrain }: ModelSelectionPanelProps) => {
    const { config, setConfig, isTraining, isResultsLoading } = useMLExperiment();
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
        <div className="bg-neutral-900/80 backdrop-blur-sm rounded-xl border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col" style={{ height: '65vh' }}>
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-white">
                        Select Models
                    </h2>
                    <span className="text-sm text-neutral-400">
                        {config.selectedModels.length} of {availableModels.length} selected
                    </span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={selectAll}
                        className="text-xs px-3 py-1.5 bg-neutral-800/60 hover:bg-neutral-700/80 border border-white/10 rounded-lg transition-all text-neutral-300 hover:text-white"
                    >
                        Select All
                    </button>
                    <button
                        onClick={deselectAll}
                        className="text-xs px-3 py-1.5 bg-neutral-800/60 hover:bg-neutral-700/80 border border-white/10 rounded-lg transition-all text-neutral-300 hover:text-white"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Scrollable Table */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-neutral-400">
                        <div className="text-center">
                            <svg className="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading models...
                        </div>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm z-10">
                            <tr className="border-b border-white/5">
                                <th className="text-left py-4 px-6 font-medium text-neutral-300 w-12"></th>
                                <th className="text-left py-4 px-6 font-medium text-neutral-300">Model Name</th>
                                <th className="text-left py-4 px-6 font-medium text-neutral-300">Description</th>
                                <th className="text-center py-4 px-6 font-medium text-neutral-300 w-24">Info</th>
                            </tr>
                        </thead>
                        <tbody>
                            {availableModels.map((model) => {
                                const isSelected = config.selectedModels.includes(model);
                                const needsScaling = ['LogisticRegression', 'SVC', 'SVR', 'KNeighborsClassifier', 'KNeighborsRegressor', 'LinearRegression', 'Ridge', 'Lasso'].includes(model);
                                
                                return (
                                    <tr
                                        key={model}
                                        onClick={() => toggleModel(model)}
                                        className={`border-b border-white/5 cursor-pointer transition-all duration-200 ${
                                            isSelected
                                                ? 'bg-cyan-500/10 hover:bg-cyan-500/15'
                                                : 'hover:bg-neutral-800/40'
                                        }`}
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-center">
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                                    isSelected
                                                        ? 'bg-cyan-500 border-cyan-500'
                                                        : 'bg-transparent border-neutral-600'
                                                }`}>
                                                    {isSelected && (
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className={`font-medium text-sm ${
                                                isSelected ? 'text-white' : 'text-neutral-200'
                                            }`}>
                                                {model}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-xs text-neutral-500">
                                                {modelDescriptions[model] || 'Machine learning model'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {needsScaling && (
                                                <span className="inline-block text-xs px-2 py-0.5 bg-neutral-700/50 text-neutral-400 rounded border border-white/10">
                                                    Scaled
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer with Train Button */}
            <div className="p-6 border-t border-white/5 bg-neutral-900/50">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                        {!config.targetColumn ? (
                            <p className="text-xs text-amber-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Select a target column first
                            </p>
                        ) : config.selectedModels.length === 0 ? (
                            <p className="text-xs text-amber-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Select at least one model
                            </p>
                        ) : (
                            <p className="text-xs text-cyan-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Ready to train {config.selectedModels.length} model{config.selectedModels.length > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onTrain}
                        disabled={isTraining || isResultsLoading || config.selectedModels.length === 0 || !config.targetColumn}
                        className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-medium rounded-lg border border-cyan-500/50 hover:border-cyan-400 disabled:border-white/5 transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-100"
                    >
                        {(isTraining || isResultsLoading) ? (
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
                </div>
            </div>
        </div>
    );
};
