
"use client"

import Header from "@/components/layouts/Header"
import { Footer } from "@/components/layouts/Footer"
import { useState, useEffect, useCallback, Suspense, lazy, useRef } from "react"
import {
  BarChart3,
  Eye,
  Trash2,
  X,
  Columns,
  Database,
  AlertTriangle,
  Target,
  Hash,
  Type,
  Shuffle,
  Filter,
  Scale,
  LineChart,
  PieChart,
  ChartArea,
  TriangleAlert,
  ChevronUp,
  ChevronDown,
  Info,
  Loader2,
  Copy,
  RefreshCw,
} from "lucide-react"
import { useDataset } from "@/contexts/DatasetContext"
import { applyCleaningAction, undoLastStep, finalizeDataset, downloadDataset, getPipelineSteps, type PipelineStep } from "@/services/cleaning.service"
import { Undo2, Download, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/toast/Toast"
import { BarChart, Bar, LineChart as RechartsLine, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { StepsStepper } from "@/components/cleaning/StepsStepper"

const DataTable = lazy(() => import("@/components/ui/DataTable"))

// Strategy options based on ML service implementations
const STRATEGIES = {
  drop_duplicates: ["auto"],
  replace_values: ["auto", "custom"],
  missing: ["auto", "mean", "median", "mode", "custom"],
  imbalance: ["auto", "undersample", "oversample", "smote"],
  outliers: ["auto", "cap", "remove"],
  encoding: ["auto", "onehot", "ordinal", "target"],
  scaling: ["auto", "standardize", "normalize", "robust", "log"],
  feature_selection: ["auto", "variance", "correlation", "manual"]
}

// Map UI dialog keys to MLService operation types
const ACTION_TYPE_MAP: Record<string, string> = {
  drop_duplicates: "drop_duplicates",
  replace_values: "replace_values",
  missing: "missing_values",
  imbalance: "imbalance",
  outliers: "outliers",
  encoding: "encoding",
  scaling: "scaling",
  feature_selection: "feature_selection"
}

const Cleaning = () => {
  const { dataset, setDataset, datasetId, totalSteps } = useDataset()
  const { show } = useToast()
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null)
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState<boolean>(false)
  const [showGraphDialog, setShowGraphDialog] = useState<boolean>(false)
  const [showColumnInfo, setShowColumnInfo] = useState<boolean>(false)
  const [showValueCounts, setShowValueCounts] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [selectedXColumn, setSelectedXColumn] = useState<string | null>(null)
  const [selectedYColumn, setSelectedYColumn] = useState<string | null>(null)
  const [showChart, setShowChart] = useState<boolean>(false)
  const [chartType, setChartType] = useState<string | null>(null)
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([])
  const columnListRef = useRef<HTMLDivElement | null>(null)

  const scrollColumns = (direction: "up" | "down") => {
    if (!columnListRef.current) return
    columnListRef.current.scrollBy({
      top: direction === "up" ? -160 : 160,
      behavior: "smooth",
    })
  }

  // Fetch pipeline steps whenever datasetId or totalSteps changes
  const fetchSteps = useCallback(async () => {
    if (!datasetId) {
      setPipelineSteps([])
      return
    }
    try {
      const steps = await getPipelineSteps(datasetId)
      setPipelineSteps(steps)
    } catch {
      // silently ignore fetch errors
    }
  }, [datasetId])

  useEffect(() => {
    fetchSteps()
  }, [fetchSteps, totalSteps])

  const handleDropColumn = async () => {
    if (!selectedColumn) return;

    setIsProcessing(true);

    try {
      const result = await applyCleaningAction({
        action: "feature_selection",
        strategy: "manual",
        columns: [selectedColumn],
        dataset_id: datasetId || undefined,
      });

      setDataset(result);
      setSelectedColumn(null);
      show({ type: "success", message: `Column "${selectedColumn}" dropped successfully` });
    } catch (error: any) {
      show({ type: "error", message: error.message || "Failed to drop column" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCleaning = async (dialogKey: string, strategy: string) => {
    const action = ACTION_TYPE_MAP[dialogKey]
    if (!action) return

    // Determine which columns to apply the action to
    let targetColumns: string[] = []
    if (selectedColumn) {
      targetColumns = [selectedColumn]
    } else {
      // Apply to all applicable columns based on action type
      if (action === "missing_values" || action === "scaling" || action === "outliers") {
        targetColumns = dataset?.numerical_columns || []
      } else if (action === "encoding") {
        targetColumns = dataset?.categorical_columns || []
      } else if (action === "drop_duplicates") {
        // Drop duplicates works on all rows, send all columns
        const allCols = dataset?.data?.[0] ? Object.keys(dataset.data[0]) : []
        targetColumns = allCols
      } else if (action === "replace_values") {
        // Replace values can work on any column type
        const allCols = dataset?.data?.[0] ? Object.keys(dataset.data[0]) : []
        targetColumns = allCols
      } else {
        // For feature_selection, imbalance — use all columns
        const allCols = dataset?.data?.[0] ? Object.keys(dataset.data[0]) : []
        targetColumns = allCols
      }
    }

    if (targetColumns.length === 0) {
      show({ type: "error", message: "No applicable columns found for this action" })
      return
    }

    setIsProcessing(true)
    setActiveDialog(null)

    try {
      const result = await applyCleaningAction({
        action,
        strategy,
        columns: targetColumns,
        dataset_id: datasetId || undefined,
      })

      // Update dataset context with full refreshed data
      setDataset(result)
      show({ type: "success", message: `${strategy.replace("_", " ")} applied successfully` })
    } catch (error: any) {
      show({ type: "error", message: error.message || "Cleaning failed" })
    } finally {
      setIsProcessing(false)
    }
  }

  // ── Pipeline action handlers ────────────────────────

  const handleUndo = async () => {
    if (!datasetId) {
      show({ type: "error", message: "No active dataset" })
      return
    }
    setIsProcessing(true)
    try {
      const result = await undoLastStep(datasetId)
      setDataset(result)
      show({ type: "success", message: result.message || "Step undone" })
    } catch (error: any) {
      show({ type: "error", message: error.message || "Undo failed" })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFinalize = async () => {
    if (!datasetId) {
      show({ type: "error", message: "No active dataset" })
      return
    }
    setIsProcessing(true)
    try {
      const result = await finalizeDataset(datasetId)
      setDataset(result)
      show({ type: "success", message: "Dataset finalized successfully!" })
    } catch (error: any) {
      show({ type: "error", message: error.message || "Finalize failed" })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = async () => {
    if (!datasetId) {
      show({ type: "error", message: "No active dataset" })
      return
    }
    try {
      await downloadDataset(datasetId)
      show({ type: "success", message: "Download started" })
    } catch (error: any) {
      show({ type: "error", message: error.message || "Download failed" })
    }
  }

  const getColumnStats = (columnName: string) => {
    const stats = dataset?.statistics?.[columnName]
    return {
      missing: stats?.missing_count || 0,
      outliers: stats?.outliers || 0,
      unique: stats?.unique_values || 0,
      valueCounts: stats?.value_counts || {}
    }
  }

  const getColumnType = (columnName: string) => {
    if (dataset?.numerical_columns?.includes(columnName)) return "numeric"

    const sampleValues = (dataset?.data || [])
      .map((row: any) => row?.[columnName])
      .filter((v: any) => v !== null && v !== undefined && String(v).trim() !== "")
      .slice(0, 300)

    if (sampleValues.length === 0) {
      if (dataset?.categorical_columns?.includes(columnName)) return "categorical"
      return "text"
    }

    const lower = sampleValues.map((v: any) => String(v).trim().toLowerCase())
    const booleanTokens = new Set(["true", "false", "yes", "no", "y", "n", "t", "f", "0", "1"])
    const booleanRatio = lower.filter((v: string) => booleanTokens.has(v)).length / sampleValues.length
    if (booleanRatio >= 0.8) return "boolean"

    const datetimeRatio = sampleValues.filter((v: any) => !Number.isNaN(new Date(v as any).getTime())).length / sampleValues.length
    if (datetimeRatio >= 0.8) return "datetime"

    const numericRatio = sampleValues.filter((v: any) => {
      const cleaned = String(v).replaceAll(",", "")
      return cleaned !== "" && !Number.isNaN(Number(cleaned))
    }).length / sampleValues.length
    if (numericRatio >= 0.8) return "numeric"

    if (dataset?.categorical_columns?.includes(columnName)) return "categorical"
    return "text"
  }

  const columns = dataset?.data && dataset.data.length > 0
    ? Object.keys(dataset.data[0]).map(name => ({
      name,
      type: getColumnType(name),
      ...getColumnStats(name)
    }))
    : []

  const totalMissing = columns.reduce((sum, col) => sum + col.missing, 0)
  const totalOutliers = columns.reduce((sum, col) => sum + col.outliers, 0)

  const ColumnInfoDialog = ({ onClose }: { onClose: () => void }) => {
    const selectedColumnData = columns.find(col => col.name === selectedColumn)

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
        <div className="relative bg-neutral-900 rounded-xl p-6 w-96 max-w-[90vw] border border-neutral-800 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_40px_rgba(0,0,0,0.6)]" onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Column Information
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Detailed statistics for selected column
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">

            {/* Column Name */}
            <div className="flex items-center gap-3 rounded-lg border border-neutral-800 px-3 py-2.5 bg-neutral-900/60">
              <Type className="h-5 w-5 text-blue-400" />
              <div>
                <div className="text-xs text-neutral-500">Column Name</div>
                <div className="text-white font-medium tracking-wide">
                  {selectedColumn}
                </div>
              </div>
            </div>

            {/* Data Type */}
            <div className="flex items-center gap-3 rounded-lg border border-neutral-800 px-3 py-2.5 bg-neutral-900/60">
              <Hash className="h-5 w-5 text-green-400" />
              <div>
                <div className="text-xs text-neutral-500">Data Type</div>
                <div className="text-white font-medium capitalize">
                  {selectedColumnData?.type}
                </div>
              </div>
            </div>

            {/* Total Values */}
            <div className="flex items-center gap-3 rounded-lg border border-neutral-800 px-3 py-2.5 bg-neutral-900/60">
              <Database className="h-5 w-5 text-neutral-400" />
              <div>
                <div className="text-xs text-neutral-500">Total Values</div>
                <div className="text-white font-medium">
                  {dataset.rows || 0}
                </div>
              </div>
            </div>

            {/* Missing Values */}
            <div className="flex items-center gap-3 rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <div>
                <div className="text-xs text-amber-300/80">Missing Values</div>
                <div className="text-white font-medium">
                  {selectedColumnData?.missing || 0}
                </div>
              </div>
            </div>

            {/* Outliers */}
            <div className="flex items-center gap-3 rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2.5">
              <Target className="h-5 w-5 text-red-400" />
              <div>
                <div className="text-xs text-red-300/80">Outliers</div>
                <div className="text-white font-medium">
                  {selectedColumnData?.outliers || 0}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    )
  }

  const ValueCountsDialog = ({ onClose }: { onClose: () => void }) => {
    const selectedColumnData = columns.find(col => col.name === selectedColumn)
    const valueCountsEntries = Object.entries((selectedColumnData?.valueCounts || {}) as Record<string, number>)
    const totalRows = valueCountsEntries.reduce((sum, [, count]) => sum + Number(count || 0), 0)
    const isNumericColumn = selectedColumnData?.type === "numeric"

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
        <div className="relative bg-neutral-900 rounded-xl p-6 w-96 max-w-[90vw] border border-neutral-800 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_40px_rgba(0,0,0,0.6)]" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Value Counts — {selectedColumn}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Unique values and their frequencies
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="rounded-lg border border-neutral-800 px-3 py-3 bg-neutral-900/60">
            {valueCountsEntries.length === 0 ? (
              <div className="text-xs text-neutral-500 italic">
                {isNumericColumn ? "Value counts are not available for numeric columns" : "No value counts available"}
              </div>
            ) : (
              <>
                <div className="mb-2 px-1 grid grid-cols-[1fr_auto] text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  <span>Value</span>
                  <span>Count</span>
                </div>
                <div className="max-h-64 overflow-y-auto pr-1 divide-y divide-neutral-800">
                  {valueCountsEntries.map(([value, count]) => (
                    <div
                      key={`${value}-${count}`}
                      className="grid grid-cols-[1fr_auto] items-center gap-3 px-1 py-2 text-sm"
                    >
                      <span className="text-neutral-200 truncate">{value}</span>
                      <span className="text-neutral-300 tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-3 pt-2 border-t border-neutral-800 text-sm text-neutral-300">
              Total Rows: <span className="font-medium text-white tabular-nums">{totalRows}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }


  const GraphDialog = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-neutral-900 rounded-xl p-6 w-[500px] max-w-[90vw] border border-neutral-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            Select Columns & Chart Type
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Column Selection */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm text-neutral-400 mb-2 block">X-Axis Column</label>
            <select
              value={selectedXColumn || ''}
              onChange={(e) => setSelectedXColumn(e.target.value)}
              className="w-full bg-neutral-800 text-white rounded-lg px-3 py-2 border border-neutral-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select column...</option>
              {columns.map(col => (
                <option key={col.name} value={col.name}>{col.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-400 mb-2 block">Y-Axis Column</label>
            <select
              value={selectedYColumn || ''}
              onChange={(e) => setSelectedYColumn(e.target.value)}
              className="w-full bg-neutral-800 text-white rounded-lg px-3 py-2 border border-neutral-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select column...</option>
              {columns.map(col => (
                <option key={col.name} value={col.name}>{col.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Chart Types */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { title: "Bar Chart", type: "bar", icon: BarChart3, color: "text-blue-400", bg: "bg-blue-500/10" },
            { title: "Line Chart", type: "line", icon: LineChart, color: "text-orange-400", bg: "bg-orange-500/10" },
            { title: "Scatter Plot", type: "scatter", icon: BarChart3, color: "text-green-400", bg: "bg-green-500/10" },
          ].map(({ title, type, icon: Icon, color, bg }) => (
            <button
              key={type}
              onClick={() => {
                console.log('Chart button clicked:', { selectedXColumn, selectedYColumn, type });
                if (!selectedXColumn || !selectedYColumn) {
                  show({ type: "error", message: "Please select both X and Y columns" });
                  return;
                }
                console.log('Setting chart type and showing chart');
                setChartType(type);
                setShowChart(true);
                setShowGraphDialog(false);
              }}
              disabled={!selectedXColumn || !selectedYColumn}
              className="
                group relative rounded-xl p-4 text-left
                bg-neutral-900
                ring-1 ring-neutral-800
                hover:ring-neutral-600
                hover:bg-neutral-800/70
                transition-all duration-200
                hover:-translate-y-[1px]
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="text-sm font-medium text-white">{title}</div>
              <div className="text-xs text-neutral-400 mt-0.5">Visualize data</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )


  const PreviewDialog = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-neutral-900 rounded-xl p-6 w-[90vw] max-w-6xl max-h-[80vh] border border-neutral-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-xl font-semibold text-white tracking-tight">
              Dataset Preview
            </h3>
            <p className="text-sm text-neutral-400 mt-1">
              First {Math.min(dataset?.data?.length || 0, 100)} rows of your dataset
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Table Container */}
        <div className="bg-neutral-950/50 rounded-lg border border-neutral-800 overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="overflow-x-auto">
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="text-neutral-400">Loading dataset...</div>
                </div>
              }>
                <DataTable data={dataset?.data?.slice(0, 100) || []} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const Dialog = ({
    title,
    dialogKey,
    strategies,
    onClose,
    onSelect,
  }: {
    title: string
    dialogKey: string
    strategies: string[]
    onClose: () => void
    onSelect: (dialogKey: string, strategy: string) => void
  }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-[26rem] max-w-[92vw] rounded-xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Choose a strategy to apply
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Strategies */}
        <div className="space-y-2">
          {strategies.map((strategy) => (
            <button
              key={strategy}
              onClick={() => onSelect(dialogKey, strategy)}
              className="
              group w-full rounded-lg border border-neutral-800
              bg-neutral-900/60 px-4 py-3 text-left
              text-sm font-medium capitalize text-neutral-200
              transition-all
              hover:border-neutral-600
              hover:bg-neutral-800/70
              hover:shadow-[0_0_0_1px_rgba(255,255,255,0.04)]
              active:scale-[0.98]
              focus:outline-none focus:ring-2 focus:ring-blue-500/40
            "
            >
              <div className="flex items-center justify-between">
                <span>{strategy.replace("_", " ")}</span>
                <span className="text-xs text-neutral-500 opacity-0 transition group-hover:opacity-100">
                  Apply
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )


  if (!dataset) {
    return (
      <div className="min-h-screen" style={{ backgroundImage: 'radial-gradient(circle farthest-corner at 50% 52.5%, rgba(14,53,92,0.3) 0%, rgba(0,0,0,1) 90%)' }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-[320px] left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#33E6FF]/20 to-blue-500/5 blur-3xl z-10" />
        </div>
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-neutral-400 text-lg">Upload a dataset first to start cleaning.</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundImage: 'radial-gradient(circle farthest-corner at 50% 52.5%, rgba(14,53,92,0.3) 0%, rgba(0,0,0,1) 90%)' }}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[320px] left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#33E6FF]/20 to-blue-500/5 blur-3xl z-10" />
      </div>
      <Header />

      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Data Cleaning
        </h1>
        <p className="text-sm text-neutral-400 mt-2 max-w-2xl">
          Inspect, clean, and prepare your dataset by handling missing values,
          outliers, and improving feature quality before further processing.
        </p>
      </div>

      {/* Stepper Component */}
      {pipelineSteps.length > 0 && (
        <div className="max-w-7xl mx-auto px-6">
          <StepsStepper steps={pipelineSteps} />
        </div>
      )}



      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Dataset Summary - Full Width */}
        <div className="bg-neutral-900/80 rounded-lg border border-neutral-800 p-4 mb-6">
          <h3 className="font-medium text-white mb-4">Dataset Summary</h3>
          <div className="grid grid-cols-6 gap-4 text-sm">
            {[
              { label: "Columns", value: columns.length, icon: Columns },
              { label: "Total Values", value: dataset.rows || 0, icon: Database },
              { label: "Missing Values", value: totalMissing, icon: AlertTriangle, color: "text-amber-400" },
              { label: "Outliers", value: totalOutliers, icon: Target, color: "text-red-400" },
              { label: "Numeric", value: dataset.numerical_columns?.length || 0, icon: Hash, color: "text-blue-400" },
              { label: "Categorical", value: dataset.categorical_columns?.length || 0, icon: Type, color: "text-emerald-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="
                  flex items-center gap-3
                  rounded-lg px-3 py-2
                  border border-neutral-800/70
                  bg-gradient-to-b from-neutral-900/60 to-neutral-950
                  shadow-[0_6px_20px_rgba(0,0,0,0.35)]
                  hover:border-neutral-700
                  transition-all duration-200
                "
              >
                {/* Icon badge */}
                <div className="p-2 rounded-md bg-neutral-800/60">
                  <Icon className={`h-3.5 w-3.5 ${color ?? "text-neutral-300"}`} />
                </div>

                {/* Text */}
                <div className="leading-tight">
                  <div className="text-[11px] text-neutral-500 tracking-wide">
                    {label}
                  </div>
                  <div className="text-base font-semibold text-white">
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-12 gap-6">

          {/* Left Panel - Column List */}
          <div className="col-span-4">
            <div className="relative bg-gradient-to-b from-neutral-900/80 to-neutral-950/80 rounded-lg border border-neutral-800/70 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-shadow duration-300 h-[630px] flex flex-col">
              <h3 className="font-medium text-white mb-3">Columns</h3>
              <button
                type="button"
                onClick={() => scrollColumns("up")}
                className="absolute right-2 top-2 z-10 rounded-md border border-neutral-700/70 bg-neutral-900/80 p-1 text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
                aria-label="Scroll column list up"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollColumns("down")}
                className="absolute right-2 bottom-2 z-10 rounded-md border border-neutral-700/70 bg-neutral-900/80 p-1 text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
                aria-label="Scroll column list down"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <div ref={columnListRef} className="space-y-4 overflow-y-auto hide-scrollbar h-[544px] min-h-0 pr-2">
                {columns.map(column => {
                  const isActive = selectedColumn === column.name
                  const isNumeric = column.type === "numeric"

                  return (
                    <div
                      key={column.name}
                      onClick={() => {
                        setSelectedColumn(column.name)
                      }}
                      className={`
                        group relative w-full rounded-lg h-15.5 px-3 py-2 text-left overflow-hidden
                        border transition-all duration-300 cursor-pointer
                        backdrop-blur-sm
                        ${isActive
                          ? "bg-gradient-to-r from-blue-500/15 to-transparent border-blue-500/50 shadow-[0_0_0_1px_rgba(59,130,246,0.45),0_8px_30px_rgba(59,130,246,0.15)]"
                          : "bg-neutral-900/40 border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800/60"
                        }
                      `}
                    >
                      {/* Accent rail */}
                      <span
                        className={`
                          absolute left-0 top-0 h-full w-[3px] rounded-l-xl transition-all
                          ${isActive
                            ? "bg-gradient-to-b from-blue-400 to-blue-600 opacity-100"
                            : "opacity-0 group-hover:opacity-40 bg-neutral-500"
                          }
                        `}
                      />

                      {/* Inner glow */}
                      {isActive && (
                        <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/10 via-transparent to-transparent" />
                      )}

                      <div className="relative flex items-center justify-between gap-3">
                        {/* Left content */}
                        <div className="min-w-0 flex-1">
                          {/* Column name */}
                          <div
                            className={`
                              truncate text-sm font-semibold
                              ${isActive ? "text-blue-200" : "text-neutral-100"}
                            `}
                          >
                            {column.name}
                          </div>

                          {/* Meta row */}
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-400 truncate">
                            <span className={isNumeric ? "text-blue-400" : "text-emerald-400"}>
                              {isNumeric ? "#" : "Aa"} {column.type}
                            </span>
                            {column.missing > 0 && (
                              <span className="inline-flex items-center gap-1 text-amber-400">
                                <TriangleAlert className="h-3 w-3" /> {column.missing}
                              </span>
                            )}
                            {column.outliers > 0 && (
                              <span className="inline-flex items-center gap-1 text-red-400">
                                <Target className="h-3 w-3" /> {column.outliers}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Info Button - ONLY this opens the dialog */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedColumn(column.name)
                              setShowColumnInfo(true)
                            }}
                            className="p-1 rounded-full text-neutral-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <Info className="h-4 w-4" />
                          </button>

                          {/* Value Counts Button */}
                          {(column.type === "categorical" || column.type === "boolean") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedColumn(column.name)
                                setShowValueCounts(true)
                              }}
                              className="p-1 rounded-full text-neutral-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                            >
                              <BarChart3 className="h-4 w-4" />
                            </button>
                          )}

                          {/* Chevron */}
                          <span
                            className={`
                              text-neutral-500 transition-all
                              ${isActive ? "text-blue-400" : "group-hover:text-neutral-300 group-hover:translate-x-0.5"}
                            `}
                          >
                            →
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Middle Panel - Cleaning Actions */}
          <div className="col-span-5">
            <div className="bg-gradient-to-b from-neutral-900/80 to-neutral-950/80 rounded-lg border border-neutral-800/70 p-4 h-[630px] flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-shadow duration-300">
              <h3 className="font-medium text-white mb-3">Cleaning Actions</h3>
              <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
                {/* 1. Drop Duplicates */}
                <button
                  onClick={() => setActiveDialog('drop_duplicates')}
                  className="w-full p-3 border border-neutral-700/70 rounded-lg bg-gradient-to-r from-neutral-900/40 to-neutral-950/40 hover:from-neutral-800/60 hover:to-neutral-900/60 hover:border-neutral-600/70 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] text-left flex items-center gap-3 transition-all duration-200"
                >
                  <Copy className="h-4 w-4 text-indigo-400" />
                  <div>
                    <div className="font-medium text-white text-sm">Drop Duplicates</div>
                    <div className="text-xs text-neutral-400">Remove duplicate rows from dataset</div>
                  </div>
                </button>

                {/* 2. Replace Values */}
                <button
                  onClick={() => setActiveDialog('replace_values')}
                  className="w-full p-3 border border-neutral-700/70 rounded-lg bg-gradient-to-r from-neutral-900/40 to-neutral-950/40 hover:from-neutral-800/60 hover:to-neutral-900/60 hover:border-neutral-600/70 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] text-left flex items-center gap-3 transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4 text-teal-400" />
                  <div>
                    <div className="font-medium text-white text-sm">Replace Values</div>
                    <div className="text-xs text-neutral-400">Replace selected values in columns</div>
                  </div>
                </button>

                {/* 3. Handle Missing Values */}
                <button
                  onClick={() => setActiveDialog('missing')}
                  className="w-full p-3 border border-neutral-700/70 rounded-lg bg-gradient-to-r from-neutral-900/40 to-neutral-950/40 hover:from-neutral-800/60 hover:to-neutral-900/60 hover:border-neutral-600/70 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] text-left flex items-center gap-3 transition-all duration-200"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <div>
                    <div className="font-medium text-white text-sm">Handle Missing Values</div>
                    <div className="text-xs text-neutral-400">Fill or remove missing data</div>
                  </div>
                </button>

                {/* 4. Handle Imbalance */}
                <button
                  onClick={() => setActiveDialog('imbalance')}
                  className="w-full p-3 border border-neutral-700/70 rounded-lg bg-gradient-to-r from-neutral-900/40 to-neutral-950/40 hover:from-neutral-800/60 hover:to-neutral-900/60 hover:border-neutral-600/70 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] text-left flex items-center gap-3 transition-all duration-200"
                >
                  <Scale className="h-4 w-4 text-purple-400" />
                  <div>
                    <div className="font-medium text-white text-sm">Handle Imbalance</div>
                    <div className="text-xs text-neutral-400">Balance target classes</div>
                  </div>
                </button>

                {/* 5. Handle Outliers */}
                <button
                  onClick={() => setActiveDialog('outliers')}
                  className="w-full p-3 border border-neutral-700/70 rounded-lg bg-gradient-to-r from-neutral-900/40 to-neutral-950/40 hover:from-neutral-800/60 hover:to-neutral-900/60 hover:border-neutral-600/70 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] text-left flex items-center gap-3 transition-all duration-200"
                >
                  <Target className="h-4 w-4 text-red-400" />
                  <div>
                    <div className="font-medium text-white text-sm">Handle Outliers</div>
                    <div className="text-xs text-neutral-400">Detect and handle outliers</div>
                  </div>
                </button>

                {/* 6. Encoding */}
                <button
                  onClick={() => setActiveDialog('encoding')}
                  className="w-full p-3 border border-neutral-700/70 rounded-lg bg-gradient-to-r from-neutral-900/40 to-neutral-950/40 hover:from-neutral-800/60 hover:to-neutral-900/60 hover:border-neutral-600/70 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] text-left flex items-center gap-3 transition-all duration-200"
                >
                  <Shuffle className="h-4 w-4 text-green-400" />
                  <div>
                    <div className="font-medium text-white text-sm">Encoding</div>
                    <div className="text-xs text-neutral-400">Convert categorical to numeric</div>
                  </div>
                </button>

                {/* 7. Feature Scaling */}
                <button
                  onClick={() => setActiveDialog('scaling')}
                  className="w-full p-3 border border-neutral-700/70 rounded-lg bg-gradient-to-r from-neutral-900/40 to-neutral-950/40 hover:from-neutral-800/60 hover:to-neutral-900/60 hover:border-neutral-600/70 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] text-left flex items-center gap-3 transition-all duration-200"
                >
                  <Filter className="h-4 w-4 text-blue-400" />
                  <div>
                    <div className="font-medium text-white text-sm">Feature Scaling</div>
                    <div className="text-xs text-neutral-400">Scale numerical features</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Utility Actions */}
          <div className="col-span-3">
            <div className="bg-gradient-to-b from-neutral-900/80 to-neutral-950/80 rounded-lg border border-neutral-800/70 p-4 h-[630px] flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-shadow duration-300">
              <h3 className="font-medium text-white mb-3">Utility Actions</h3>
              <div className="space-y-3">
                {/* Drop Column */}
                <div className="rounded-lg border border-neutral-800/50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 className="h-4 w-4 text-red-400" />
                    <span className="font-medium text-white text-sm">Drop Column</span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-2">Remove selected column</p>
                  <button
                    onClick={handleDropColumn}
                    disabled={!selectedColumn}
                    className="w-full px-3 py-2 bg-red-600/20 text-red-300 rounded border border-red-500/50 hover:bg-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Drop {selectedColumn || 'Column'}
                  </button>
                </div>

                {/* Preview Data */}
                <div className="rounded-lg border border-neutral-800/50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-4 w-4 text-blue-400" />
                    <span className="font-medium text-white text-sm">Preview Data</span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-2">View processed data</p>
                  <button
                    onClick={() => setShowPreviewDialog(true)}
                    className="w-full px-3 py-2 bg-neutral-800/60 text-neutral-300 rounded border border-neutral-700 hover:bg-neutral-700/60 text-sm"
                  >
                    Preview
                  </button>
                </div>

                {/* Visualization */}
                <div className="rounded-lg border border-neutral-800/50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ChartArea className="h-4 w-4 text-green-400" />
                    <span className="font-medium text-white text-sm">Visualization</span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-2">View visual representation</p>
                  <button
                    onClick={() => setShowGraphDialog(true)}
                    className="w-full px-3 py-2 bg-neutral-800/60 text-neutral-300 rounded border border-neutral-700 hover:bg-neutral-700/60 text-sm flex items-center justify-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Generate Graph
                  </button>
                </div>

                {/* Dataset Controls */}
                <div className="rounded-lg border border-neutral-800/50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-neutral-400" />
                    <span className="font-medium text-white text-sm">Dataset Controls</span>
                    {totalSteps > 0 && (
                      <span className="ml-auto text-[10px] font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/40 rounded-full px-2 py-0.5">
                        {totalSteps} step{totalSteps !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={handleUndo}
                      disabled={!totalSteps || totalSteps === 0}
                      className="w-full px-3 py-2 bg-orange-600/20 text-orange-300 rounded border border-orange-500/50 hover:bg-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      Undo Last Step
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={!datasetId}
                      className="w-full px-3 py-2 bg-cyan-600/20 text-cyan-300 rounded border border-cyan-500/50 hover:bg-cyan-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download CSV
                    </button>
                    <button
                      onClick={handleFinalize}
                      disabled={!totalSteps || totalSteps === 0}
                      className="w-full px-3 py-2 bg-emerald-600/20 text-emerald-300 rounded border border-emerald-500/50 hover:bg-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Finalize Dataset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Column Info Dialog */}
      {showColumnInfo && selectedColumn && (
        <ColumnInfoDialog onClose={() => setShowColumnInfo(false)} />
      )}

      {/* Value Counts Dialog */}
      {showValueCounts && selectedColumn && (
        <ValueCountsDialog onClose={() => setShowValueCounts(false)} />
      )}

      {/* Preview Dialog */}
      {showPreviewDialog && (
        <PreviewDialog onClose={() => setShowPreviewDialog(false)} />
      )}

      {/* Strategy Dialogs */}
      {activeDialog && (
        <Dialog
          title={`${activeDialog.replace('_', ' ')} Strategies`}
          dialogKey={activeDialog}
          strategies={STRATEGIES[activeDialog as keyof typeof STRATEGIES] || []}
          onClose={() => setActiveDialog(null)}
          onSelect={handleCleaning}
        />
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/95 px-8 py-6 shadow-2xl">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            <p className="text-sm text-neutral-300 font-medium">Applying cleaning action...</p>
          </div>
        </div>
      )}

      {/* Graph Selection Dialog */}
      {showGraphDialog && (
        <GraphDialog onClose={() => setShowGraphDialog(false)} />
      )}

      {/* Chart Display Dialog */}
      {showChart && chartType && selectedXColumn && selectedYColumn && (() => {
        // AGGREGATE DATA FOR CHART
        const rawData = dataset?.data?.slice(0, 100) || [];
        console.log('🔍 Raw data:', rawData);
        console.log('🔍 Selected columns:', { selectedXColumn, selectedYColumn });

        // Group by X column and aggregate Y values
        const aggregated = rawData.reduce((acc: any, row: any) => {
          const xValue = String(row[selectedXColumn]);
          const yValue = Number(row[selectedYColumn]);

          if (!acc[xValue]) {
            acc[xValue] = { count: 0, sum: 0 };
          }
          acc[xValue].count += 1;
          acc[xValue].sum += isNaN(yValue) ? 0 : yValue;

          return acc;
        }, {});

        // Transform to chart format
        const chartData = Object.entries(aggregated).map(([key, value]: [string, any]) => ({
          [selectedXColumn]: key,
          count: value.count,
          sum: value.sum,
          average: value.sum / value.count
        }));

        console.log('📊 Chart data:', chartData);

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70]" onClick={() => setShowChart(false)}>
            <div className="bg-neutral-900 rounded-xl p-6 w-[800px] max-w-[90vw] border border-neutral-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-xl font-semibold text-white tracking-tight">
                    {chartType === 'bar' ? 'Bar Chart' : chartType === 'line' ? 'Line Chart' : 'Scatter Plot'}
                  </h3>
                  <p className="text-sm text-neutral-400 mt-1">
                    {selectedXColumn} (Count)
                  </p>
                </div>
                <button onClick={() => setShowChart(false)} className="text-neutral-400 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="bg-neutral-950/50 rounded-lg border border-neutral-800 p-4">
                <ResponsiveContainer width="100%" height={400}>
                  {chartType === 'bar' ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey={selectedXColumn} stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="count" fill="#3B82F6" name="Count" />
                    </BarChart>
                  ) : chartType === 'line' ? (
                    <RechartsLine data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey={selectedXColumn} stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#F97316" strokeWidth={2} name="Count" />
                    </RechartsLine>
                  ) : (
                    <ScatterChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey={selectedXColumn} stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                      <Legend />
                      <Scatter name="Count" dataKey="count" fill="#10B981" />
                    </ScatterChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })()}

      <Footer />
    </div>
  )
}

export default Cleaning
