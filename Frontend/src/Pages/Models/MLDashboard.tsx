import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDataset } from '../../contexts/DatasetContext';
import { useMLExperiment, MLExperimentProvider } from '../../contexts/MLExperimentContext';
import { ModelSelectionPanel } from '../../components/ml/ModelSelectionPanel';
import { ResultsCharts } from '../../components/ml/ResultsCharts';
import { ModelAnalysis } from '../../components/ml/ModelAnalysis';
import { ResultsTable } from '../../components/ml/ResultsTable';
import { TrainingStatusPanel } from '../../components/ml/TrainingStatusPanel';
import { experimentTrain, getExperiment } from '../../services/training.service';
import { subscribeToJob } from '../../services/socket.service';
import Header from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast/Toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const MLDashboardContent = () => {
    const navigate = useNavigate();
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
        isResultsLoading,
        setIsResultsLoading,
        trainingProgress,
        setTrainingProgress,
        modelsCompleted,
        setModelsCompleted,
        error,
        setError,
        clearExperiment,
        deleteModel,
    } = useMLExperiment();

    const [activeTab, setActiveTab] = useState<'config' | 'results'>('config');
    const [showWarning, setShowWarning] = useState(true);
    const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const { show } = useToast();

    // CRITICAL: Navigation guard - redirect if no dataset
    useEffect(() => {
        if (!dataset && !datasetId) {
            show({ type: "error", message: "Please upload dataset first" });
            navigate('/DataSet', { replace: true });
        }
    }, [dataset, datasetId, navigate, show]);

    // Handle delete all models by reusing single delete function
    const handleDeleteAllModels = async () => {
        const models = trainingResults?.base_models || [];
        if (models.length === 0) return;
        
        setShowDeleteAllDialog(false);
        setIsDeletingAll(true);
        
        try {
            // Loop through all models and reuse existing delete function
            for (const model of models) {
                if (model.model_id) {
                    await deleteModel(model.model_id as unknown as number);
                }
            }
            show({ type: "success", message: "All models deleted successfully" });
            setActiveTab('config');
        } catch (error: any) {
            show({ type: "error", message: error.message || "Failed to delete all models" });
        } finally {
            setIsDeletingAll(false);
        }
    };

    // Get available columns from dataset
    const columns = dataset?.data?.[0] ? Object.keys(dataset.data[0]) : [];
    const numericalColumns = dataset?.numerical_columns || [];
    const categoricalColumns = dataset?.categorical_columns || [];

    // Actual training logic (DO NOT MODIFY)
    const executeTraining = async () => {
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

            console.log('✅ Training job queued:', expId);

            // Use WebSocket for real-time updates; fall back to polling on completed
            await new Promise<void>((resolve, reject) => {
                let unsubscribed = false;
                const unsubscribe = subscribeToJob(expId, {
                    onProgress: ({ progress, models_completed }) => {
                        console.log('📊 Progress update:', { progress, models_completed });
                        setTrainingProgress(progress);
                        setModelsCompleted(models_completed);
                    },
                    onCompleted: async () => {
                        if (unsubscribed) return;
                        unsubscribed = true;
                        unsubscribe();
                        console.log('✅ Training completed, fetching results...');
                        
                        try {
                            // Add a small delay to ensure DB writes are complete
                            await new Promise(r => setTimeout(r, 1000));
                            
                            // Retry logic for fetching results
                            let retries = 3;
                            let finalResults = null;
                            
                            while (retries > 0 && !finalResults) {
                                try {
                                    finalResults = await getExperiment(expId);
                                    
                                    // Check if results are valid
                                    if (finalResults && (finalResults.base_models?.length > 0 || finalResults.models?.length > 0)) {
                                        break;
                                    }
                                    
                                    // If status is still running, wait and retry
                                    if (finalResults?.status === 'running' || finalResults?.status === 'queued') {
                                        console.log('⏳ Results not ready yet, retrying...', retries);
                                        await new Promise(r => setTimeout(r, 2000));
                                        retries--;
                                        finalResults = null;
                                        continue;
                                    }
                                    
                                    break;
                                } catch (fetchError: any) {
                                    console.error('❌ Error fetching results:', fetchError.message);
                                    if (fetchError.message?.includes('not found') && retries > 1) {
                                        console.log('⏳ Experiment not found yet, retrying...', retries);
                                        await new Promise(r => setTimeout(r, 2000));
                                        retries--;
                                    } else {
                                        throw fetchError;
                                    }
                                }
                            }
                            
                            if (finalResults && (finalResults.base_models?.length > 0 || finalResults.models?.length > 0)) {
                                setTrainingResults(finalResults);
                                setActiveTab('results');
                                resolve();
                            } else {
                                throw new Error('No training results found after completion');
                            }
                        } catch (e: any) {
                            console.error('❌ Failed to fetch results:', e);
                            reject(e);
                        }
                    },
                    onFailed: (error) => {
                        if (unsubscribed) return;
                        unsubscribed = true;
                        unsubscribe();
                        console.error('❌ Training failed:', error);
                        reject(new Error(error));
                    },
                });
            });
        } catch (err: any) {
            console.error('❌ Training error:', err);
            // Handle specific error cases with toast notifications
            if (err.message?.includes('already in progress') || err.message?.includes('Training already')) {
                show({ type: 'error', message: 'Training already in progress. Please wait for the current training to complete.' });
            } else if (err.message?.includes('rate limit')) {
                show({ type: 'error', message: 'Too many requests. Please wait a moment and try again.' });
            } else if (err.message?.includes('not found')) {
                show({ type: 'error', message: 'Training completed but results are not available yet. Please refresh the page.' });
            } else {
                show({ type: 'error', message: err.message || 'Training failed. Please try again.' });
            }
        } finally {
            setIsTraining(false);
            setIsResultsLoading(false);
            setTrainingProgress(0);
            setModelsCompleted(0);
        }
    };

    // Click handler - FORCES IMMEDIATE RENDER
    const handleTrain = () => {
        console.log('🔵 Train clicked');
        
        // Hard guard
        if (isTraining || isResultsLoading) {
            console.log('⚠️ Already training');
            return;
        }

        if (!config.targetColumn) {
            setError('Please select a target column');
            return;
        }
        if (config.selectedModels.length === 0) {
            setError('Please select at least one model');
            return;
        }

        // CRITICAL: Set states FIRST (synchronous)
        console.log('🔵 Setting loader states to TRUE');
        setIsTraining(true);
        setIsResultsLoading(true);
        setError(null);
        setTrainingProgress(0);
        setModelsCompleted(0);
        clearExperiment();

        console.log('🔵 Loader state:', true);

        // CRITICAL: Defer async work to next tick
        setTimeout(() => {
            console.log('🔵 Starting training execution...');
            executeTraining();
        }, 0);

        // Safety timeout
        setTimeout(() => {
            if (isTraining || isResultsLoading) {
                console.log('⚠️ Safety timeout triggered');
                setIsTraining(false);
                setIsResultsLoading(false);
            }
        }, 300000); // 5 minutes
    };

    // Reset when dataset changes
    useEffect(() => {
        clearExperiment();
        setConfig({ targetColumn: '', selectedModels: [] });
    }, [datasetId]);

    // ── No Dataset State ─────────────────────────────────────
    if (!dataset) {
        return (
            <div className="min-h-screen" style={{ backgroundImage: 'radial-gradient(circle farthest-corner at 50% 52.5%, rgba(14,53,92,0.3) 0%, rgba(0,0,0,1) 90%)' }}>
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-[320px] left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#33E6FF]/20 to-blue-500/5 blur-3xl z-10" />
                </div>
                <Header />
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <p className="text-neutral-400 text-lg">Upload a dataset first to start training.</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // ── Dataset Not Finalized Warning ────────────────────────
    const showFinalizeWarning = totalSteps === 0 && !isFinalized;

    return (
        <div className="min-h-screen" style={{ backgroundImage: 'radial-gradient(circle farthest-corner at 50% 52.5%, rgba(14,53,92,0.3) 0%, rgba(0,0,0,1) 90%)' }}>
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-[320px] left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#33E6FF]/20 to-blue-500/5 blur-3xl z-10" />
            </div>
            <Header />

            {/* Page Header */}
            <div className="max-w-7xl mx-auto px-6 pt-8 pb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-white">
                            Model Training
                        </h1>
                        <p className="text-sm text-neutral-400 mt-2 max-w-2xl">
                            Configure preprocessing, select models, and train your dataset
                        </p>
                    </div>
                    {/* Terminate All Button - Always visible */}
                    {trainingResults && (
                        <Button
                            onClick={() => setShowDeleteAllDialog(true)}
                            disabled={isTraining || isDeletingAll}
                            variant="outline"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {isDeletingAll ? (
                                <>
                                    <svg className="h-4 w-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Terminate All
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Finalize Warning Banner */}
            {showFinalizeWarning && showWarning && (
                <div className="max-w-7xl mx-auto px-6 mb-6">
                    <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/20 border border-amber-700/50 px-4 py-3 rounded-xl flex items-center justify-between backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                            <span className="text-amber-200 text-sm">
                                No preprocessing applied. You can train directly or clean your data first.
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                to="/Cleaning"
                                className="px-4 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 rounded-lg text-sm transition"
                            >
                                Go to Cleaning
                            </Link>
                            <button
                                onClick={() => setShowWarning(false)}
                                className="p-1.5 hover:bg-amber-600/30 text-amber-200 rounded-lg transition"
                                title="Dismiss"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Banner - Keep for critical errors that need manual dismissal */}
            {error && (
                <div className="max-w-7xl mx-auto px-6 mb-6">
                    <div className="bg-gradient-to-r from-red-900/50 to-red-800/30 border border-red-700 text-red-200 px-4 py-3 rounded-xl flex justify-between items-center backdrop-blur-sm">
                        <span className="text-sm">{error}</span>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 pb-6">
                {activeTab === 'config' ? (
                    <div className="space-y-6">
                        {/* Top Controls Bar */}
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                            {/* Target Column */}
                            <div className="flex-1 w-full md:w-auto">
                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                    Target Column
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
                                                    <option key={col} value={col} className="bg-neutral-900">{col}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                        {categoricalColumns.length > 0 && (
                                            <optgroup label="Categorical Columns" className="bg-neutral-900">
                                                {categoricalColumns.map((col) => (
                                                    <option key={col} value={col} className="bg-neutral-900">{col}</option>
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
                            </div>

                            {/* Problem Type Toggle */}
                            <div className="flex-1 w-full md:w-auto">
                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                    Problem Type
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setConfig({ taskType: 'classification', selectedModels: [] })}
                                        className={`flex-1 px-4 py-3 rounded-lg border transition-all duration-200 ${
                                            config.taskType === 'classification'
                                                ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                                                : 'bg-neutral-800/40 border-white/10 text-neutral-300 hover:border-white/20'
                                        }`}
                                    >
                                        <div className="text-sm font-medium">Classification</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfig({ taskType: 'regression', selectedModels: [] })}
                                        className={`flex-1 px-4 py-3 rounded-lg border transition-all duration-200 ${
                                            config.taskType === 'regression'
                                                ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                                                : 'bg-neutral-800/40 border-white/10 text-neutral-300 hover:border-white/20'
                                        }`}
                                    >
                                        <div className="text-sm font-medium">Regression</div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Model Selection Table */}
                        <ModelSelectionPanel onTrain={handleTrain} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Charts Section */}
                        <ResultsCharts />

                        {/* Model Analysis Section */}
                        <ModelAnalysis />

                        {/* Results Table with integrated actions */}
                        <ResultsTable />

                        {/* Retrain Button */}
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={() => setActiveTab('config')}
                                className="px-6 py-3 bg-gradient-to-r from-neutral-800/60 to-neutral-900/60 border border-neutral-700 text-white rounded-lg hover:from-neutral-700/60 hover:to-neutral-800/60 transition-all flex items-center gap-2 shadow-lg"
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

            {/* Delete All Confirmation Dialog */}
            <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
                <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Terminate All Models</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Are you sure you want to delete all trained models? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={() => setShowDeleteAllDialog(false)}
                            variant="outline"
                            className="flex-1 border-zinc-700 hover:bg-zinc-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteAllModels}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete All
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Footer />
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
