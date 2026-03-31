import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface DatasetContextType {
  dataset: any | null
  setDataset: (data: any) => void
  clearDataset: () => void
  datasetExists: boolean
  // ── Pipeline state ──
  datasetId: number | null
  setDatasetId: (id: number | null) => void
  pipelineId: number | null
  setPipelineId: (id: number | null) => void
  totalSteps: number
  setTotalSteps: (count: number) => void
  rawFile: File | null
  setRawFile: (file: File | null) => void
  // ── Finalization state ──
  isFinalized: boolean
  setIsFinalized: (finalized: boolean) => void
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined)

const STORAGE_KEY = 'dataforge_dataset_state';

export const DatasetProvider = ({ children }: { children: ReactNode }) => {
  // Initialize from localStorage
  const [dataset, setDatasetState] = useState<any | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored).dataset : null;
    } catch {
      return null;
    }
  });
  
  const [datasetId, setDatasetIdState] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored).datasetId : null;
    } catch {
      return null;
    }
  });
  
  const [pipelineId, setPipelineIdState] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored).pipelineId : null;
    } catch {
      return null;
    }
  });
  
  const [totalSteps, setTotalStepsState] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored).totalSteps : 0;
    } catch {
      return 0;
    }
  });
  
  const [isFinalized, setIsFinalizedState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored).isFinalized : false;
    } catch {
      return false;
    }
  });
  
  const [rawFile, setRawFile] = useState<File | null>(null);
  
  // Computed value: dataset exists if we have dataset OR datasetId
  const datasetExists = !!(dataset || datasetId);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (datasetExists) {
      const state = {
        dataset,
        datasetId,
        pipelineId,
        totalSteps,
        isFinalized,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [dataset, datasetId, pipelineId, totalSteps, isFinalized, datasetExists]);

  const setDataset = (data: any) => {
    setDatasetState(data)
    // Auto-extract pipeline metadata from response if present
    if (data?.dataset_id !== undefined) {
      setDatasetIdState(data.dataset_id)
    }
    if (data?.pipeline_id !== undefined) {
      setPipelineIdState(data.pipeline_id)
    }
    if (data?.total_steps !== undefined) {
      setTotalStepsState(data.total_steps)
    }
    // Check if response indicates finalization
    if (data?.is_finalized !== undefined) {
      setIsFinalizedState(data.is_finalized)
    }
  }
  
  const setDatasetId = (id: number | null) => {
    setDatasetIdState(id);
  };
  
  const setPipelineId = (id: number | null) => {
    setPipelineIdState(id);
  };
  
  const setTotalSteps = (count: number) => {
    setTotalStepsState(count);
  };
  
  const setIsFinalized = (finalized: boolean) => {
    setIsFinalizedState(finalized);
  };

  const clearDataset = () => {
    setDatasetState(null)
    setDatasetIdState(null)
    setPipelineIdState(null)
    setTotalStepsState(0)
    setRawFile(null)
    setIsFinalizedState(false)
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <DatasetContext.Provider value={{
      dataset, setDataset, clearDataset,
      datasetExists,
      datasetId, setDatasetId,
      pipelineId, setPipelineId,
      totalSteps, setTotalSteps,
      rawFile, setRawFile,
      isFinalized, setIsFinalized,
    }}>
      {children}
    </DatasetContext.Provider>
  )
}

export const useDataset = () => {
  const context = useContext(DatasetContext)
  if (context === undefined) {
    throw new Error('useDataset must be used within a DatasetProvider')
  }
  return context
}