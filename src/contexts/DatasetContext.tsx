import React, { createContext, useContext, useState, ReactNode } from 'react'

interface DatasetContextType {
  dataset: any | null
  setDataset: (data: any) => void
  clearDataset: () => void
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined)

export const DatasetProvider = ({ children }: { children: ReactNode }) => {
  const [dataset, setDatasetState] = useState<any | null>(null)

  const setDataset = (data: any) => {
    setDatasetState(data)
  }

  const clearDataset = () => {
    setDatasetState(null)
  }

  return (
    <DatasetContext.Provider value={{ dataset, setDataset, clearDataset }}>
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