import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
    TrainResponse,
    PreprocessingConfig,
    ModelResult,
    trainingService,
} from '../services/training.service';

// ── Types ───────────────────────────────────────────────

export interface ExperimentConfig {
    targetColumn: string;
    taskType: 'classification' | 'regression';
    preprocessingConfig: PreprocessingConfig;
    selectedModels: string[];
}

interface MLExperimentContextType {
    // Configuration state
    config: ExperimentConfig;
    setConfig: (config: Partial<ExperimentConfig>) => void;
    resetConfig: () => void;

    // Experiment state
    experimentId: string | null;
    setExperimentId: (id: string | null) => void;

    // Training results
    trainingResults: TrainResponse | null;
    setTrainingResults: (results: TrainResponse | null) => void;

    // Selected model for analysis
    selectedModel: string | null;
    setSelectedModel: (model: string | null) => void;

    // UI state
    isTraining: boolean;
    setIsTraining: (loading: boolean) => void;
    isResultsLoading: boolean;
    setIsResultsLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;

    // Training progress
    trainingProgress: number;
    setTrainingProgress: (progress: number) => void;
    modelsCompleted: number;
    setModelsCompleted: (count: number) => void;

    // Actions
    clearExperiment: () => void;
    getModelByName: (name: string) => ModelResult | undefined;
    deleteModel: (modelId: number) => Promise<void>;
}

// ── Default Values ──────────────────────────────────────

const defaultConfig: ExperimentConfig = {
    targetColumn: '',
    taskType: 'classification',
    preprocessingConfig: {
        missing_values: 'median',
        encoding: 'label',
        scaling: 'standard',
    },
    selectedModels: [],
};

// ── Context ─────────────────────────────────────────────

const MLExperimentContext = createContext<MLExperimentContextType | undefined>(undefined);

// ── Provider ────────────────────────────────────────────

export const MLExperimentProvider = ({ children }: { children: ReactNode }) => {
    // Configuration
    const [config, setConfigState] = useState<ExperimentConfig>(defaultConfig);

    // Experiment state
    const [experimentId, setExperimentId] = useState<string | null>(null);
    const [trainingResults, setTrainingResults] = useState<TrainResponse | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);

    // UI state
    const [isTraining, setIsTraining] = useState(false);
    const [isResultsLoading, setIsResultsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Training progress state
    const [trainingProgress, setTrainingProgress] = useState(0);
    const [modelsCompleted, setModelsCompleted] = useState(0);

    // Partial config update
    const setConfig = useCallback((partialConfig: Partial<ExperimentConfig>) => {
        setConfigState((prev) => ({ ...prev, ...partialConfig }));
    }, []);

    // Reset config to defaults
    const resetConfig = useCallback(() => {
        setConfigState(defaultConfig);
    }, []);

    // Clear entire experiment state
    const clearExperiment = useCallback(() => {
        setExperimentId(null);
        setTrainingResults(null);
        setSelectedModel(null);
        setError(null);
        setIsTraining(false);
        setIsResultsLoading(false);
        setTrainingProgress(0);
        setModelsCompleted(0);
    }, []);

    // Get model by name from results
    const getModelByName = useCallback(
        (name: string): ModelResult | undefined => {
            if (!trainingResults) return undefined;
            return trainingResults.base_models.find(
                (m) => m.model === name || m.name === name
            );
        },
        [trainingResults]
    );

    // Delete a single model and update results
    const deleteModel = useCallback(async (modelId: number) => {
        await trainingService.deleteModel(modelId);
        // Update training results by removing the deleted model
        setTrainingResults((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                base_models: prev.base_models.filter((m) => m.model_id !== modelId),
            };
        });
    }, []);

    return (
        <MLExperimentContext.Provider
            value={{
                config,
                setConfig,
                resetConfig,
                experimentId,
                setExperimentId,
                trainingResults,
                setTrainingResults,
                selectedModel,
                setSelectedModel,
                isTraining,
                setIsTraining,
                isResultsLoading,
                setIsResultsLoading,
                error,
                setError,
                trainingProgress,
                setTrainingProgress,
                modelsCompleted,
                setModelsCompleted,
                clearExperiment,
                getModelByName,
                deleteModel,
            }}
        >
            {children}
        </MLExperimentContext.Provider>
    );
};

// ── Hook ────────────────────────────────────────────────

export const useMLExperiment = () => {
    const context = useContext(MLExperimentContext);
    if (context === undefined) {
        throw new Error('useMLExperiment must be used within a MLExperimentProvider');
    }
    return context;
};
