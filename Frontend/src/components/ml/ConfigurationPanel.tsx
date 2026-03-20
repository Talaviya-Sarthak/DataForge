import { useMLExperiment } from '../../contexts/MLExperimentContext';

interface ConfigurationPanelProps {
    columns: string[];
    numericalColumns: string[];
    categoricalColumns: string[];
}

export const ConfigurationPanel = ({
    columns,
    numericalColumns,
    categoricalColumns,
}: ConfigurationPanelProps) => {
    const { config, setConfig } = useMLExperiment();

    return (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Training Configuration
            </h2>

            {/* Target Column */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Column
                </label>
                <select
                    value={config.targetColumn}
                    onChange={(e) => setConfig({ targetColumn: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="">Select target column...</option>
                    <optgroup label="Numerical Columns">
                        {numericalColumns.map((col) => (
                            <option key={col} value={col}>{col}</option>
                        ))}
                    </optgroup>
                    <optgroup label="Categorical Columns">
                        {categoricalColumns.map((col) => (
                            <option key={col} value={col}>{col}</option>
                        ))}
                    </optgroup>
                </select>
            </div>

            {/* Problem Type */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Problem Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setConfig({ taskType: 'classification', selectedModels: [] })}
                        className={`px-4 py-3 rounded-lg border transition ${
                            config.taskType === 'classification'
                                ? 'bg-purple-600 border-purple-500 text-white'
                                : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                        }`}
                    >
                        <div className="font-medium">Classification</div>
                        <div className="text-xs opacity-70 mt-1">Predict categories</div>
                    </button>
                    <button
                        onClick={() => setConfig({ taskType: 'regression', selectedModels: [] })}
                        className={`px-4 py-3 rounded-lg border transition ${
                            config.taskType === 'regression'
                                ? 'bg-purple-600 border-purple-500 text-white'
                                : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                        }`}
                    >
                        <div className="font-medium">Regression</div>
                        <div className="text-xs opacity-70 mt-1">Predict numbers</div>
                    </button>
                </div>
            </div>

            {/* Preprocessing Options */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-300">Preprocessing Options</h3>

                {/* Missing Values */}
                <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Missing Values</label>
                    <select
                        value={config.preprocessingConfig.missing_values}
                        onChange={(e) =>
                            setConfig({
                                preprocessingConfig: {
                                    ...config.preprocessingConfig,
                                    missing_values: e.target.value as any,
                                },
                            })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="mean">Mean (numeric)</option>
                        <option value="median">Median (numeric)</option>
                        <option value="mode">Mode (most frequent)</option>
                        <option value="drop">Drop rows</option>
                    </select>
                </div>

                {/* Encoding */}
                <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Categorical Encoding</label>
                    <select
                        value={config.preprocessingConfig.encoding}
                        onChange={(e) =>
                            setConfig({
                                preprocessingConfig: {
                                    ...config.preprocessingConfig,
                                    encoding: e.target.value as any,
                                },
                            })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="label">Label Encoding</option>
                        <option value="one-hot">One-Hot Encoding</option>
                    </select>
                </div>

                {/* Scaling */}
                <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                        Feature Scaling
                        <span className="text-purple-400 ml-1">(auto per model)</span>
                    </label>
                    <select
                        value={config.preprocessingConfig.scaling || ''}
                        onChange={(e) =>
                            setConfig({
                                preprocessingConfig: {
                                    ...config.preprocessingConfig,
                                    scaling: e.target.value ? (e.target.value as any) : null,
                                },
                            })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="standard">Standard Scaler</option>
                        <option value="minmax">MinMax Scaler</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Scaling is automatically applied only to models that need it (Linear, SVM, KNN)
                    </p>
                </div>
            </div>
        </div>
    );
};
