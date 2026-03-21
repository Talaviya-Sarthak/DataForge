import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
    TrainResponse,
    TuneResponse,
    PreprocessingConfig,
    ModelResult,
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

    // Tuning results
    tuningResults: TuneResponse | null;
    setTuningResults: (results: TuneResponse | null) => void;

    // Selected model for analysis
    selectedModel: string | null;
    setSelectedModel: (model: string | null) => void;

    // UI state
    isTraining: boolean;
    setIsTraining: (loading: boolean) => void;
    isTuning: boolean;
    setIsTuning: (loading: boolean) => void;
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
    const [tuningResults, setTuningResults] = useState<TuneResponse | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);

    // UI state
    const [isTraining, setIsTraining] = useState(false);
    const [isTuning, setIsTuning] = useState(false);
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
        setTuningResults(null);
        setSelectedModel(null);
        setError(null);
        setIsTraining(false);
        setIsTuning(false);
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
                tuningResults,
                setTuningResults,
                selectedModel,
                setSelectedModel,
                isTraining,
                setIsTraining,
                isTuning,
                setIsTuning,
                error,
                setError,
                trainingProgress,
                setTrainingProgress,
                modelsCompleted,
                setModelsCompleted,
                clearExperiment,
                getModelByName,
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
