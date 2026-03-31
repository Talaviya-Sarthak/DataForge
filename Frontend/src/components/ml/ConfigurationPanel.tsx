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
        <div className="bg-neutral-900/80 backdrop-blur-sm rounded-xl p-6 border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.4)] h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Training Configuration
            </h2>

            {/* Target Column */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Target Column
                    <span className="text-xs text-neutral-500 ml-2">(Column to predict)</span>
                </label>
                <div className="relative">
                    <select
                        value={config.targetColumn}
                        onChange={(e) => setConfig({ targetColumn: e.target.value })}
                        className="w-full bg-neutral-800/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                    >
                        <option value="" className="bg-neutral-900">Select target column...</option>
                        {numericalColumns.length > 0 && (
                            <optgroup label="Numerical Columns" className="bg-neutral-900">
                                {numericalColumns.map((col) => (
                                    <option key={col} value={col} className="bg-neutral-900 py-2">{col}</option>
                                ))}
                            </optgroup>
                        )}
                        {categoricalColumns.length > 0 && (
                            <optgroup label="Categorical Columns" className="bg-neutral-900">
                                {categoricalColumns.map((col) => (
                                    <option key={col} value={col} className="bg-neutral-900 py-2">{col}</option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
                {config.targetColumn && (
                    <p className="text-xs text-cyan-400 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Selected: {config.targetColumn}
                    </p>
                )}
            </div>

            {/* Problem Type */}
            <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-300 mb-3">
                    Problem Type
                    <span className="text-xs text-neutral-500 ml-2">(Choose task type)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setConfig({ taskType: 'classification', selectedModels: [] })}
                        className={`px-4 py-4 rounded-lg border transition-all duration-200 ${
                            config.taskType === 'classification'
                                ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                                : 'bg-neutral-800/40 border-white/10 text-neutral-300 hover:border-white/20 hover:bg-neutral-800/60'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                                config.taskType === 'classification'
                                    ? 'bg-cyan-500/20 text-cyan-400'
                                    : 'bg-neutral-700/50 text-neutral-400'
                            }`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-sm">Classification</div>
                                <div className="text-xs text-neutral-400 mt-0.5">Predict categories</div>
                            </div>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfig({ taskType: 'regression', selectedModels: [] })}
                        className={`px-4 py-4 rounded-lg border transition-all duration-200 ${
                            config.taskType === 'regression'
                                ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                                : 'bg-neutral-800/40 border-white/10 text-neutral-300 hover:border-white/20 hover:bg-neutral-800/60'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                                config.taskType === 'regression'
                                    ? 'bg-cyan-500/20 text-cyan-400'
                                    : 'bg-neutral-700/50 text-neutral-400'
                            }`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-sm">Regression</div>
                                <div className="text-xs text-neutral-400 mt-0.5">Predict numbers</div>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};
