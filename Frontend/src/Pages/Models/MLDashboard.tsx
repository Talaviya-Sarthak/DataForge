import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDataset } from '../../contexts/DatasetContext';
import { useMLExperiment, MLExperimentProvider } from '../../contexts/MLExperimentContext';
import { ConfigurationPanel } from '../../components/ml/ConfigurationPanel';
import { ModelSelectionPanel } from '../../components/ml/ModelSelectionPanel';
import { ResultsCharts } from '../../components/ml/ResultsCharts';
import { ModelAnalysis } from '../../components/ml/ModelAnalysis';
import { ResultsTable } from '../../components/ml/ResultsTable';
import { TrainingStatusPanel } from '../../components/ml/TrainingStatusPanel';
import { ModelManagement } from '../../components/ml/ModelManagement';
import { experimentTrain, getExperiment } from '../../services/training.service';
import { subscribeToJob } from '../../services/socket.service';

const MLDashboardContent = () => {
    const { dataset, datasetId, pipelineId, totalSteps, isFinalized } = useDataset();
    const {
        config,
        setConfig,
        experimentId,
        setExperimentId,
        trainingResults,
        setTrainingResults,
        isTraining,
        setIsTraining,
        trainingProgress,
        setTrainingProgress,
        modelsCompleted,
        setModelsCompleted,
        error,
        setError,
        clearExperiment,
    } = useMLExperiment();

    const [activeTab, setActiveTab] = useState<'config' | 'results'>('config');

    // Get available columns from dataset
    const columns = dataset?.data?.[0] ? Object.keys(dataset.data[0]) : [];
    const numericalColumns = dataset?.numerical_columns || [];
    const categoricalColumns = dataset?.categorical_columns || [];

    // Handle training with async polling
    const handleTrain = async () => {
        // Hard guard — prevents duplicate submission even if button state lags
        if (isTraining) return;

        if (!config.targetColumn) {
            setError('Please select a target column');
            return;
        }
        if (config.selectedModels.length === 0) {
            setError('Please select at least one model');
            return;
        }

        setIsTraining(true);
        setError(null);
        setTrainingProgress(0);
        setModelsCompleted(0);
        clearExperiment();

        try {
            const startResponse = await experimentTrain({
                pipeline_id: pipelineId ? String(pipelineId) : undefined,
                dataset_id: datasetId || 0,
                task_type: config.taskType,
                target_column: config.targetColumn,
                preprocessing_config: config.preprocessingConfig,
                selected_models: config.selectedModels,
            });

            const expId = startResponse.experiment_id;
            setExperimentId(expId);

            // Use WebSocket for real-time updates; fall back to one-time fetch on completed
            await new Promise<void>((resolve, reject) => {
                const unsubscribe = subscribeToJob(expId, {
                    onProgress: ({ progress, models_completed }) => {
                        setTrainingProgress(progress);
                        setModelsCompleted(models_completed);
                    },
                    onCompleted: async () => {
                        unsubscribe();
                        try {
                            const finalResults = await getExperiment(expId);
                            setTrainingResults(finalResults);
                            setActiveTab('results');
                            resolve();
                        } catch (e: any) { reject(e); }
                    },
                    onFailed: (error) => { unsubscribe(); reject(new Error(error)); },
                });
            });
        } catch (err: any) {
            // Handle specific error cases
            if (err.message?.includes('already in progress') || err.message?.includes('Training already')) {
                setError('Training already in progress. Please wait for the current training to complete.');
            } else if (err.message?.includes('rate limit')) {
                setError('Too many requests. Please wait a moment and try again.');
            } else {
                setError(err.message || 'Training failed');
            }
        } finally {
            setIsTraining(false);
            setTrainingProgress(0);
            setModelsCompleted(0);
        }
    };

    // Reset when dataset changes
    useEffect(() => {
        clearExperiment();
        setConfig({ targetColumn: '', selectedModels: [] });
    }, [datasetId]);

    // ── No Dataset State ─────────────────────────────────────
    if (!dataset) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="max-w-md text-center p-8">
                    {/* Workflow Steps */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center text-sm font-medium">
                                1
                            </div>
                            <span className="ml-2 text-gray-400 text-sm">Upload</span>
                        </div>
                        <div className="w-8 h-px bg-gray-700"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center text-sm font-medium">
                                2
                            </div>
                            <span className="ml-2 text-gray-400 text-sm">Clean</span>
                        </div>
                        <div className="w-8 h-px bg-gray-700"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-medium animate-pulse">
                                3
                            </div>
                            <span className="ml-2 text-white text-sm font-medium">Train</span>
                        </div>
                    </div>

                    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-3">No Dataset Loaded</h2>
                    <p className="text-gray-400 mb-6 leading-relaxed">
                        To start training ML models, you need to first upload and preprocess your dataset.
                    </p>

                    <div className="flex flex-col gap-3">
                        <Link
                            to="/DataSet"
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Upload Dataset
                        </Link>
                        <Link
                            to="/Cleaning"
                            className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition font-medium"
                        >
                            Go to Data Cleaning
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Dataset Not Finalized Warning ────────────────────────
    const showFinalizeWarning = totalSteps === 0 && !isFinalized;

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <div className="border-b border-gray-800 bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">ML Training Dashboard</h1>
                            <p className="text-gray-400 text-sm mt-1">
                                Configure preprocessing, select models, and train
                            </p>
                        </div>
                        {/* Dataset Status Badge */}
                        <div className="flex items-center gap-3">
                            {datasetId && (
                                <span className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-300">
                                    Dataset #{datasetId}
                                </span>
                            )}
                            {isFinalized ? (
                                <span className="px-3 py-1 bg-green-900/50 border border-green-700 rounded-full text-sm text-green-300 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Finalized
                                </span>
                            ) : totalSteps > 0 ? (
                                <span className="px-3 py-1 bg-amber-900/50 border border-amber-700 rounded-full text-sm text-amber-300">
                                    {totalSteps} preprocessing step{totalSteps > 1 ? 's' : ''} applied
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-blue-900/50 border border-blue-700 rounded-full text-sm text-blue-300">
                                    Raw Dataset
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Finalize Warning Banner */}
            {showFinalizeWarning && (
                <div className="max-w-7xl mx-auto px-6 mt-4">
                    <div className="bg-amber-900/30 border border-amber-700/50 px-4 py-3 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-amber-200">
                                No preprocessing applied. You can train directly or clean your data first.
                            </span>
                        </div>
                        <Link
                            to="/Cleaning"
                            className="px-4 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 rounded text-sm transition"
                        >
                            Go to Cleaning
                        </Link>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`py-3 px-4 font-medium border-b-2 transition ${
                                activeTab === 'config'
                                    ? 'border-purple-500 text-purple-400'
                                    : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                        >
                            Configuration
                        </button>
                        <button
                            onClick={() => setActiveTab('results')}
                            disabled={!trainingResults}
                            className={`py-3 px-4 font-medium border-b-2 transition ${
                                activeTab === 'results'
                                    ? 'border-purple-500 text-purple-400'
                                    : 'border-transparent text-gray-400 hover:text-white'
                            } ${!trainingResults ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Results
                            {trainingResults && (
                                <span className="ml-2 px-2 py-0.5 bg-green-600 text-xs rounded-full">
                                    {trainingResults.summary?.successful ?? trainingResults.base_models?.length ?? 0}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="max-w-7xl mx-auto px-6 mt-4">
                    <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg flex justify-between items-center">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
                            &times;
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                {activeTab === 'config' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column: Configuration */}
                        <ConfigurationPanel
                            columns={columns}
                            numericalColumns={numericalColumns}
                            categoricalColumns={categoricalColumns}
                        />

                        {/* Right Column: Model Selection */}
                        <ModelSelectionPanel onTrain={handleTrain} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Charts Section */}
                        <ResultsCharts />

                        {/* Model Analysis Section */}
                        <ModelAnalysis />

                        {/* Results Table */}
                        <ResultsTable />

                        {/* Model Management — download & terminate */}
                        <ModelManagement />

                        {/* Retrain Button */}
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={() => setActiveTab('config')}
                                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Modify Configuration & Retrain
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Real-time training status panel (non-blocking) */}
            <TrainingStatusPanel />
        </div>
    );
};

// Wrap with provider
const MLDashboard = () => {
    return (
        <MLExperimentProvider>
            <MLDashboardContent />
        </MLExperimentProvider>
    );
};

export default MLDashboard;
