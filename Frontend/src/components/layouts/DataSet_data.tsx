import { FileUpload } from "@/components/ui/file-upload"
import { Spinner } from "@/components/ui/spinner"
import { useState, useEffect, useRef, Suspense, lazy } from "react"
import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useDataset } from "@/contexts/DatasetContext"
import { getUserDatasets, resumeDataset, DatasetListItem } from "@/services/cleaning.service"
import { useToast } from "@/components/ui/toast/Toast"
import { apiRequest, getAccessToken } from "@/services/api.client"

// Lazy load DataTable since it's only needed when data is uploaded
const DataTable = lazy(() => import("@/components/ui/DataTable"))

// ---- API BASE CONFIG ----
const apiBase = import.meta.env.VITE_NODE_API_URL

if (!apiBase) {
  throw new Error(
    "VITE_NODE_API_URL is not configured. Please set it in your .env file"
  )
}

// ---- UPLOAD FUNCTION ----
const uploadDataset = async (file: File) => {
  const formData = new FormData()
  formData.append("file", file)

  const data = await apiRequest<any>(`${apiBase}/api/datasets/upload`, {
    method: "POST",
    body: formData,
    retryOnUnauthorized: true,
  })

  // Validate successful upload based on ML service response format
  if (!data.data || !Array.isArray(data.data)) {
    throw new Error("Invalid response: missing data")
  }

  if (typeof data.rows !== 'number' || data.rows <= 0) {
    throw new Error("Invalid response: invalid row count")
  }

  if (typeof data.columns !== 'number' || data.columns <= 0) {
    throw new Error("Invalid response: invalid column count")
  }

  return data
}

// ---- CUSTOM HOOK ----
export const useDatasetUpload = () => {
  const [file, setFile] = useState<File | null>(null)
  const [uploadKey, setUploadKey] = useState(0)
  const { setDataset, clearDataset, setRawFile } = useDataset()

  const uploadMutation = useMutation({
    mutationFn: uploadDataset,
    retry: 3,
    retryDelay: 2000,
    onSuccess: (data) => {
      // Validate that we have the expected ML service response structure
      if (data && data.data && data.rows > 0 && data.columns > 0) {
        setDataset(data)
      }
    },
    onError: (error) => {
      clearDataset()
    }
  })

  const handleFileUpload = (files: File[]) => {
    if (!files || files.length === 0) return
    setFile(files[0])
    setRawFile(files[0]) // Keep raw file for potential resume
    uploadMutation.mutate(files[0])
  }

  const resetUpload = () => {
    uploadMutation.reset()
    setFile(null)
    setUploadKey(k => k + 1)
    clearDataset()
  }

  return {
    handleFileUpload,
    uploadMutation,
    file,
    uploadKey,
    resetUpload,
  }
}

// ---- DATASET RETRIEVAL HOOK (REMOVED - NOW USING CONTEXT) ----

// ---------------- UI BELOW ----------------

const fmt = (v: any) => (typeof v === "number" ? v.toFixed(2) : "—")

const Dataset_tabledata = ({
  handleFileUpload,
  uploadMutation,
  uploadKey,
  resetUpload,
}: {
  handleFileUpload: (files: File[]) => void
  uploadMutation: any
  uploadKey: number
  resetUpload: () => void
}) => {
  const { dataset, setDataset } = useDataset()
  const toast = useToast()
  const currentDataset = uploadMutation.data || dataset
  const loading = uploadMutation.isPending
  const error = uploadMutation.isError

  // ── Resume previous datasets ──
  const [previousDatasets, setPreviousDatasets] = useState<DatasetListItem[]>([])
  const [resumingId, setResumingId] = useState<number | null>(null)
  const resumeFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!currentDataset) {
      const token = getAccessToken()
      if (token) {
        getUserDatasets()
          .then(ds => setPreviousDatasets(ds.filter(d => d.status === 'in_progress' && (d.total_steps ?? 0) > 0)))
          .catch(() => { })
      }
    }
  }, [currentDataset])

  const handleResumeClick = (id: number) => {
    setResumingId(id)
    resumeFileRef.current?.click()
  }

  const handleResumeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !resumingId) return
    try {
      const result = await resumeDataset(resumingId, file)
      setDataset(result)
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to resume dataset'
      toast.show({ message: errorMsg, type: 'error', duration: 5000 })
    } finally {
      setResumingId(null)
      if (resumeFileRef.current) resumeFileRef.current.value = ''
    }
  }

  return (
    <div className="relative bg-transeperent pb-10">
      <div className="mt-8">
        {!currentDataset && (
          <>
            <h1 className="text-4xl mb-2 text-center font-bold text-white">
              Add Your Files
            </h1>
            <p className="mt-2 text-center mb-10 text-neutral-400">
              Choose files and upload them below
            </p>

            <div className="w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto min-h-80 rounded-lg">
              <FileUpload key={uploadKey} onChange={handleFileUpload} />
            </div>

            {/* Hidden file input for resume */}
            <input
              ref={resumeFileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleResumeFile}
            />

            {/* Previous datasets (resume) */}
            {previousDatasets.length > 0 && (
              <div className="w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto mt-10">
                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                  Resume a previous dataset
                </h3>
                <div className="space-y-2">
                  {previousDatasets.map(ds => (
                    <div
                      key={ds.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3 hover:border-neutral-700 transition-colors"
                    >
                      <div>
                        <div className="text-sm text-white font-medium">{ds.original_filename}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">
                          {ds.total_rows} rows &middot; {ds.total_steps ?? 0} step{(ds.total_steps ?? 0) !== 1 ? 's' : ''} applied
                        </div>
                      </div>
                      <button
                        onClick={() => handleResumeClick(ds.id)}
                        disabled={resumingId === ds.id}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-blue-600/30 disabled:opacity-50"
                      >
                        {resumingId === ds.id ? 'Resuming…' : 'Resume'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mb-12 mt-6">
        {loading && (
          <div className="flex justify-center mt-15">
            <Spinner variant="bars" size={40} className="text-white" />
          </div>
        )}

        {error && (
          <div className="flex justify-end mt-16 mr-52">
            <button
              onClick={resetUpload}
              className="px-3 py-2 text-sm rounded-md bg-red-700 text-white hover:bg-red-900"
            >
              Remove
            </button>
          </div>
        )}

        {currentDataset && (
          <Suspense
            fallback={
              <div className="flex justify-center mt-16">
                <Spinner variant="bars" size={40} className="text-white" />
              </div>
            }
          >
            <DataTable data={currentDataset.data ?? []} />
          </Suspense>
        )}

        {currentDataset && (
          <div className="mt-4 flex justify-end max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto">
            <button
              onClick={resetUpload}
              className="px-3 py-2 text-sm rounded-md bg-red-700 text-white hover:bg-red-900"
            >
              Remove Dataset
            </button>
          </div>
        )}

        {currentDataset && (
          <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 border border-neutral-800/70 bg-gradient-to-b from-neutral-900/60 to-neutral-950 shadow-[0_6px_20px_rgba(0,0,0,0.35)] hover:border-neutral-700 transition-all duration-200">
              <div className="p-2 rounded-md bg-neutral-800/60">
                <svg className="h-3.5 w-3.5 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="leading-tight">
                <div className="text-[11px] text-neutral-500 tracking-wide">Total Rows</div>
                <div className="text-base font-semibold text-white">{currentDataset.rows ?? 0}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 border border-neutral-800/70 bg-gradient-to-b from-neutral-900/60 to-neutral-950 shadow-[0_6px_20px_rgba(0,0,0,0.35)] hover:border-neutral-700 transition-all duration-200">
              <div className="p-2 rounded-md bg-neutral-800/60">
                <svg className="h-3.5 w-3.5 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H9z" />
                </svg>
              </div>
              <div className="leading-tight">
                <div className="text-[11px] text-neutral-500 tracking-wide">Total Columns</div>
                <div className="text-base font-semibold text-white">{currentDataset.columns ?? 0}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 border border-neutral-800/70 bg-gradient-to-b from-neutral-900/60 to-neutral-950 shadow-[0_6px_20px_rgba(0,0,0,0.35)] hover:border-neutral-700 transition-all duration-200">
              <div className="p-2 rounded-md bg-neutral-800/60">
                <svg className="h-3.5 w-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <div className="leading-tight">
                <div className="text-[11px] text-neutral-500 tracking-wide">Numeric Columns</div>
                <div className="text-base font-semibold text-white">{currentDataset.numerical_columns?.length ?? 0}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 border border-neutral-800/70 bg-gradient-to-b from-neutral-900/60 to-neutral-950 shadow-[0_6px_20px_rgba(0,0,0,0.35)] hover:border-neutral-700 transition-all duration-200">
              <div className="p-2 rounded-md bg-neutral-800/60">
                <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <div className="leading-tight">
                <div className="text-[11px] text-neutral-500 tracking-wide">Categorical Columns</div>
                <div className="text-base font-semibold text-white">{currentDataset.categorical_columns?.length ?? 0}</div>
              </div>
            </div>
          </div>
        )}

        {currentDataset && (
          <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-b from-neutral-900/80 to-neutral-950/80 rounded-lg border border-neutral-800/70 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-shadow duration-300">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                Numeric Columns
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {(currentDataset.numerical_columns ?? []).length > 0 ? (
                  (currentDataset.numerical_columns ?? []).map((c: string) => (
                    <div key={c} className="flex items-center gap-2 text-sm text-neutral-300 bg-neutral-800/40 rounded px-2 py-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      {c}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-500 italic">N/A</p>
                )}
              </div>
            </div>
            <div className="bg-gradient-to-b from-neutral-900/80 to-neutral-950/80 rounded-lg border border-neutral-800/70 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-shadow duration-300">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Categorical Columns
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {(currentDataset.categorical_columns ?? []).length > 0 ? (
                  (currentDataset.categorical_columns ?? []).map((c: string) => (
                    <div key={c} className="flex items-center gap-2 text-sm text-neutral-300 bg-neutral-800/40 rounded px-2 py-1">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                      {c}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-500 italic">N/A</p>
                )}
              </div>
            </div>
          </div>
        )}



        {currentDataset?.statistics && (
          <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto mt-10">
            <h3 className="text-lg font-semibold text-white mb-4">
              Statistical Summary
            </h3>

            <div className="bg-gradient-to-b from-neutral-900/80 to-neutral-950/80 rounded-lg border border-neutral-800/70 shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-shadow duration-300 overflow-hidden">
              <table className="w-full text-sm text-neutral-300">
                <thead className="bg-neutral-900/70">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-300">Column</th>
                    <th className="px-4 py-3 text-right font-semibold text-neutral-300">Min</th>
                    <th className="px-4 py-3 text-right font-semibold text-neutral-300">Max</th>
                    <th className="px-4 py-3 text-right font-semibold text-neutral-300">Mean</th>
                    <th className="px-4 py-3 text-right font-semibold text-neutral-300">Median</th>
                    <th className="px-4 py-3 text-right font-semibold text-neutral-300">Std</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(currentDataset.statistics).map(
                    ([col, stats]: any) => (
                      <tr
                        key={col}
                        className="border-t border-neutral-800 hover:bg-neutral-800/40 transition"
                      >
                        <td className="px-4 py-3 text-neutral-200">{col}</td>
                        <td className="px-4 py-3 text-right text-neutral-200">{fmt(stats.min)}</td>
                        <td className="px-4 py-3 text-right text-neutral-200">{fmt(stats.max)}</td>
                        <td className="px-4 py-3 text-right text-neutral-200">{fmt(stats.mean)}</td>
                        <td className="px-4 py-3 text-right text-neutral-200">
                          {fmt(stats.median)}
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-200">{fmt(stats.std)}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {currentDataset && (
          <div className="flex justify-center mt-10 mb-16">
            <Link to="/Cleaning">
              <button className="group relative px-8 py-3 rounded-lg text-white text-sm font-medium bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/50 overflow-hidden transition-all duration-300 hover:shadow-[0_0_25px_#33E6FF55] hover:border-[#33E6FF] hover:from-blue-600/30 hover:to-cyan-600/30">
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Cleaning
                </span>
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dataset_tabledata
