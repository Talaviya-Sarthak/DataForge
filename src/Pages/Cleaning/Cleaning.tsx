"use client"

import Header from "@/components/layouts/Header"
import { Footer } from "@/components/layouts/Footer"
import { LampDemo } from "@/components/layouts/BgLamp"
import { useState, Suspense, lazy } from "react"
import { Trash2, AlertTriangle, Info, Hash, Type, TriangleAlert } from "lucide-react"
import { useStoredDataset } from "@/components/layouts/DataSet_data"

const DataTable = lazy(() => import("@/components/ui/DataTable"))

const getColumnTypeIcon = (type: string) => {
  switch (type) {
    case "numeric":
      return <Hash className="h-3 w-3" />
    case "categorical":
      return <Type className="h-3 w-3" />
    case "text":
      return <Type className="h-3 w-3" />
    default:
      return <Hash className="h-3 w-3" />
  }
}

const getColumnTypeBadge = (type: string) => {
  const colors = {
    numeric: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    categorical: "bg-green-500/20 text-green-300 border-green-500/30",
    text: "bg-purple-500/20 text-purple-300 border-purple-500/30"
  }
  return colors[type as keyof typeof colors] || colors.numeric
}

const getColumnType = (columnName: string, dataset: any) => {
  if (dataset?.numerical_columns?.includes(columnName)) return "numeric"
  if (dataset?.categorical_columns?.includes(columnName)) return "categorical"
  return "text"
}

const getColumnStats = (columnName: string, dataset: any) => {
  const stats = dataset?.statistics?.[columnName]
  return {
    missing: stats?.missing_count || 0,
    outliers: stats?.outliers || 0
  }
}

const Cleaning = () => {
  const dataset = useStoredDataset()
  const [selectedColumn, setSelectedColumn] = useState<any>(null)

  const handleColumnSelect = (column: any) => {
    setSelectedColumn(column)
  }

  // Create columns array from dataset
  const columns = dataset?.data && dataset.data.length > 0 
    ? Object.keys(dataset.data[0]).map(columnName => {
        const stats = getColumnStats(columnName, dataset)
        return {
          name: columnName,
          type: getColumnType(columnName, dataset),
          missing: stats.missing,
          outliers: stats.outliers
        }
      })
    : []

  return (
    <div className="relative flex flex-col min-h-screen bg-slate-950 overflow-hidden">
      <div className="absolute inset-x-0 top-[-16vh] lg:top-[-16vh] xl:top-[-10vh] 2xl:top-[-8vh] h-screen lg:h-[120vh] xl:h-[140vh] 2xl:h-[160vh] z-0 pointer-events-none">
        <LampDemo />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <div className="min-h-screen relative bg-transparent">
          {/* Page Header */}
          <div className="mt-8 mb-12">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                Feature Engineering
              </h1>
              <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
                Transform and prepare your data columns for machine learning workflows
              </p>
            </div>
          </div>

          {/* Dataset Preview */}
          {dataset && (
            <div className="max-w-7xl mx-auto px-6 mb-12">
              <Suspense
                fallback={
                  <div className="flex justify-center mt-16">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                  </div>
                }
              >
                <DataTable data={dataset.data ?? []} />
              </Suspense>
            </div>
          )}

          {/* Main Layout */}
          {dataset ? (
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-12 gap-8">
              
              {/* LEFT PANEL - Column Selector */}
              <div className="col-span-3">
                <div className="sticky top-8">
                  <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/50 rounded-2xl p-6 shadow-2xl">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      Select Column
                    </h3>
                    
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                      {columns.map((column) => (
                        <button
                          key={column.name}
                          onClick={() => handleColumnSelect(column)}
                          className={`w-full text-left p-4 rounded-xl transition-all duration-300 group ${
                            selectedColumn?.name === column.name
                              ? "bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/50 shadow-lg shadow-blue-500/10"
                              : "bg-neutral-800/40 border border-neutral-700/50 hover:bg-neutral-800/60 hover:border-neutral-600/50 hover:shadow-lg"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`font-medium ${
                              selectedColumn?.name === column.name ? "text-blue-300" : "text-white group-hover:text-blue-200"
                            }`}>
                              {column.name}
                            </span>
                            {column.missing > 0 && (
                              <div className="flex items-center gap-1 text-amber-400">
                                <TriangleAlert className="h-3 w-3" />
                                <span className="text-xs font-medium">{column.missing}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${
                              getColumnTypeBadge(column.type)
                            }`}>
                              {getColumnTypeIcon(column.type)}
                              {column.type}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT PANEL - Column Actions & Info */}
              <div className="col-span-9">
                {selectedColumn ? (
                  <div className="space-y-6">
                    
                    {/* Selected Column Header Card */}
                    <div className="bg-gradient-to-r from-neutral-900/90 to-neutral-800/90 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-2xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-2">{selectedColumn.name}</h2>
                          <div className="flex items-center gap-4 text-sm text-neutral-400">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg border ${
                              getColumnTypeBadge(selectedColumn.type)
                            }`}>
                              {getColumnTypeIcon(selectedColumn.type)}
                              {selectedColumn.type}
                            </span>
                            <span>{selectedColumn.missing} missing • {dataset.rows || 0} total values</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">100%</div>
                          <div className="text-sm text-neutral-400">Data Quality</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Cards Grid */}
                    <div className="grid grid-cols-2 gap-6">
                      
                      {/* Card 1: Drop Column */}
                      <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/50 rounded-2xl p-6 shadow-2xl hover:border-red-500/30 hover:shadow-red-500/10 transition-all duration-300 group">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 rounded-xl bg-red-500/20 group-hover:bg-red-500/30 transition-colors">
                            <Trash2 className="h-6 w-6 text-red-400" />
                          </div>
                          <h4 className="text-xl font-semibold text-white">Drop Column</h4>
                        </div>
                        <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
                          Permanently remove the "{selectedColumn.name}" column from your dataset. This action cannot be undone.
                        </p>
                        <button className="w-full px-6 py-3 bg-gradient-to-r from-red-600/20 to-red-500/20 border border-red-500/50 text-red-300 rounded-xl hover:from-red-600/30 hover:to-red-500/30 hover:border-red-400/60 transition-all duration-300 font-medium">
                          Drop "{selectedColumn.name}"
                        </button>
                      </div>

                      {/* Card 2: Missing Values & Outliers */}
                      <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/50 rounded-2xl p-6 shadow-2xl hover:border-amber-500/30 hover:shadow-amber-500/10 transition-all duration-300 group">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 rounded-xl bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
                            <AlertTriangle className="h-6 w-6 text-amber-400" />
                          </div>
                          <h4 className="text-xl font-semibold text-white">Missing Values & Outliers</h4>
                        </div>
                        <div className="space-y-4 mb-6">
                          <div className="flex justify-between items-center p-3 bg-neutral-800/50 rounded-lg">
                            <span className="text-neutral-300 font-medium">Missing Values:</span>
                            <span className="text-amber-300 font-bold text-lg">{selectedColumn.missing}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-neutral-800/50 rounded-lg">
                            <span className="text-neutral-300 font-medium">Outliers Detected:</span>
                            <span className="text-amber-300 font-bold text-lg">{selectedColumn.outliers || 0}</span>
                          </div>
                        </div>
                        <button className="w-full px-6 py-3 bg-gradient-to-r from-amber-600/20 to-amber-500/20 border border-amber-500/50 text-amber-300 rounded-xl hover:from-amber-600/30 hover:to-amber-500/30 hover:border-amber-400/60 transition-all duration-300 font-medium">
                          Handle Data Issues
                        </button>
                      </div>

                      {/* Card 3: Column Insights */}
                      <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/50 rounded-2xl p-6 shadow-2xl hover:border-blue-500/30 hover:shadow-blue-500/10 transition-all duration-300 group">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                            <Info className="h-6 w-6 text-blue-400" />
                          </div>
                          <h4 className="text-xl font-semibold text-white">Column Insights</h4>
                        </div>
                        <p className="text-neutral-400 text-sm leading-relaxed">
                          Advanced statistical analysis and data profiling insights will appear here. 
                          This includes distribution patterns, correlation analysis, and data quality metrics.
                        </p>
                      </div>

                      {/* Card 4: Transformations */}
                      <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/50 rounded-2xl p-6 shadow-2xl hover:border-emerald-500/30 hover:shadow-emerald-500/10 transition-all duration-300 group">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                            <Info className="h-6 w-6 text-emerald-400" />
                          </div>
                          <h4 className="text-xl font-semibold text-white">Feature Transformations</h4>
                        </div>
                        <p className="text-neutral-400 text-sm leading-relaxed">
                          Available feature engineering transformations for "{selectedColumn.name}" will be displayed here. 
                          Including encoding methods, scaling options, and advanced feature creation tools.
                        </p>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 bg-neutral-900/60 backdrop-blur-xl border border-neutral-800/50 rounded-2xl shadow-2xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-neutral-800/50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                        <Info className="h-8 w-8 text-neutral-500" />
                      </div>
                      <p className="text-neutral-400 text-lg font-medium">Select a column to view cleaning options</p>
                      <p className="text-neutral-500 text-sm mt-2">Choose a column from the left panel to get started</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex items-center justify-center h-96 max-w-7xl mx-auto px-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-neutral-800/50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <Info className="h-8 w-8 text-neutral-500" />
                </div>
                <p className="text-neutral-400 text-lg font-medium">No dataset loaded</p>
                <p className="text-neutral-500 text-sm mt-2">Please upload a dataset first from the Dataset page</p>
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  )
}

export default Cleaning