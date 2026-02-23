import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface DatasetContextType {
  /** Current dataset preview / metadata (same shape as ML response) */
  dataset: any | null
  setDataset: (data: any) => void
  clearDataset: () => void

  /** Active dataset_id from backend DB */
  datasetId: number | null
  setDatasetId: (id: number | null) => void

  /** Count of pipeline steps applied */
  stepCount: number
  setStepCount: (n: number) => void

  /** Dataset status: new | in_progress | completed */
  datasetStatus: string
  setDatasetStatus: (s: string) => void

  /** Original uploaded file (kept for re-upload on resume / download) */
  rawFile: File | null
  setRawFile: (f: File | null) => void
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined)

export const DatasetProvider = ({ children }: { children: ReactNode }) => {
  const [dataset, setDatasetState] = useState<any | null>(null)
  const [datasetId, setDatasetId] = useState<number | null>(null)
  const [stepCount, setStepCount] = useState<number>(0)
  const [datasetStatus, setDatasetStatus] = useState<string>('new')
  const [rawFile, setRawFile] = useState<File | null>(null)

  const setDataset = useCallback((data: any) => {
    setDatasetState(data)
    // Auto-extract dataset_id & step_count if present in response
    if (data?.dataset_id !== undefined) {
      setDatasetId(data.dataset_id)
    }
    if (data?.step_count !== undefined) {
      setStepCount(data.step_count)
    }
  }, [])

  const clearDataset = useCallback(() => {
    setDatasetState(null)
    setDatasetId(null)
    setStepCount(0)
    setDatasetStatus('new')
    setRawFile(null)
  }, [])

  return (
    <DatasetContext.Provider
      value={{
        dataset,
        setDataset,
        clearDataset,
        datasetId,
        setDatasetId,
        stepCount,
        setStepCount,
        datasetStatus,
        setDatasetStatus,
        rawFile,
        setRawFile,
      }}
    >
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