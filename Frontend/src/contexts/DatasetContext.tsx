import React, { createContext, useContext, useState, ReactNode } from 'react'

interface DatasetContextType {
  dataset: any | null
  setDataset: (data: any) => void
  clearDataset: () => void
  // ── Pipeline state ──
  datasetId: number | null
  setDatasetId: (id: number | null) => void
  pipelineId: number | null
  setPipelineId: (id: number | null) => void
  totalSteps: number
  setTotalSteps: (count: number) => void
  rawFile: File | null
  setRawFile: (file: File | null) => void
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined)

export const DatasetProvider = ({ children }: { children: ReactNode }) => {
  const [dataset, setDatasetState] = useState<any | null>(null)
  const [datasetId, setDatasetId] = useState<number | null>(null)
  const [pipelineId, setPipelineId] = useState<number | null>(null)
  const [totalSteps, setTotalSteps] = useState<number>(0)
  const [rawFile, setRawFile] = useState<File | null>(null)

  const setDataset = (data: any) => {
    setDatasetState(data)
    // Auto-extract pipeline metadata from response if present
    if (data?.dataset_id !== undefined) {
      setDatasetId(data.dataset_id)
    }
    if (data?.pipeline_id !== undefined) {
      setPipelineId(data.pipeline_id)
    }
    if (data?.total_steps !== undefined) {
      setTotalSteps(data.total_steps)
    }
  }

  const clearDataset = () => {
    setDatasetState(null)
    setDatasetId(null)
    setPipelineId(null)
    setTotalSteps(0)
    setRawFile(null)
  }

  return (
    <DatasetContext.Provider value={{
      dataset, setDataset, clearDataset,
      datasetId, setDatasetId,
      pipelineId, setPipelineId,
      totalSteps, setTotalSteps,
      rawFile, setRawFile,
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