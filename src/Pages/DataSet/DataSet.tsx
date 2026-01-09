"use client"

import Header from "@/components/layouts/Header"
import { Footer } from "@/components/layouts/Footer"
import { FileUpload } from "@/components/ui/file-upload"
import { useState } from "react"
import DataTable from "@/components/ui/DataTable"

const Dataset = () => {
  const [dataset, setDataset] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadKey, setUploadKey] = useState(0)

  const handleFileUpload = async (files: File[]) => {
    if (!files || files.length === 0) return

    setLoading(true)
    setDataset(null)

    const formData = new FormData()
    formData.append("file", files[0])

    try {
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      })

      const json = await res.json()
      setDataset(json)
    } catch (err) {
      console.error("Upload failed", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative transition-colors bg-black">

      {/* Background light rays (only till upload box) */}
      <div className="pointer-events-none absolute top-0 left-0 w-full h-[520px] overflow-hidden">
        <div className="absolute -top-[30%] -left-[20%] h-[140%] w-[60%] bg-gradient-to-br from-cyan-400/20 via-cyan-300/8 to-transparent skew-x-[-18deg] blur-[40px]" />
        <div className="absolute -top-[30%] -right-[20%] h-[140%] w-[60%] bg-gradient-to-bl from-cyan-400/20 via-cyan-300/8 to-transparent skew-x-[18deg] blur-[40px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[60%] w-[70%] bg-gradient-to-b from-cyan-300/10 to-transparent blur-[60px]" />
      </div>

      <div className="ml-10">
        <Header />
      </div>

      <div className="mt-8 mb-40">
        <h1 className="text-4xl mb-2 text-center font-bold text-white">
          Add Your Files
        </h1>
        <p className="mt-2 text-center mb-10 text-neutral-400">
          Choose files and upload them below
        </p>

        {/* Upload box */}
        <div className="w-full max-w-4xl mx-auto min-h-80 rounded-lg">
          <FileUpload key={uploadKey} onChange={handleFileUpload} />
        </div>

        {/* Loader */}
        {loading && (
          <div className="mt-12 flex justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          </div>
        )}
         {/* Table */}
        {dataset && <DataTable data={dataset.data} />}
        {/* Remove dataset */}
        {dataset && (
          <div className="mt-4 flex justify-end max-w-6xl mx-auto">
            <button
              onClick={() => {
                setDataset(null)
                setUploadKey(prev => prev + 1)
              }}
              className="px-3 py-2 text-sm rounded-md bg-red-700 text-white hover:bg-red-900"
            >
              Remove Dataset
            </button>
          </div>
        )}

        {/* Key metrics */}
        {dataset && (
          <div className="max-w-6xl mx-auto mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Total Rows" value={dataset.rows} />
            <Stat label="Total Columns" value={dataset.columns} />
            <Stat label="Numeric Columns" value={dataset.numerical_columns.length} />
            <Stat label="Categorical Columns" value={dataset.categorical_columns.length} />
          </div>
        )}

        {/* Dataset column preview */}
        {dataset && (
          <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <ColumnBox title="Numeric Columns" data={dataset.numerical_columns} />
            <ColumnBox title="Categorical Columns" data={dataset.categorical_columns} />
          </div>
        )}

        {/* Statistics */}
        {dataset?.statistics && (
          <div className="max-w-6xl mx-auto mt-10">
            <h3 className="text-lg font-semibold text-white mb-4">
              Statistical Summary
            </h3>

            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60">
              <table className="w-full text-sm text-neutral-300">
                <thead className="bg-neutral-900/80">
                  <tr>
                    <th className="px-4 py-3 text-left">Column</th>
                    <th className="px-4 py-3 text-right">Min</th>
                    <th className="px-4 py-3 text-right">Max</th>
                    <th className="px-4 py-3 text-right">Mean</th>
                    <th className="px-4 py-3 text-right">Median</th>
                    <th className="px-4 py-3 text-right">Std</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(dataset.statistics).map(([col, stats]: any) => (
                    <tr key={col} className="border-t border-neutral-800 hover:bg-neutral-800/40">
                      <td className="px-4 py-2">{col}</td>
                      <td className="px-4 py-2 text-right">{stats.min.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{stats.max.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{stats.mean.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{stats.median.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{stats.std.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      <Footer />
    </div>
  )
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/60">
    <p className="text-sm text-neutral-400">{label}</p>
    <p className="text-2xl font-semibold text-white">{value}</p>
  </div>
)

const ColumnBox = ({ title, data }: { title: string; data: string[] }) => (
  <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/60">
    <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
    {data.length > 0 ? (
      data.map(c => (
        <p key={c} className="text-sm text-neutral-400">• {c}</p>
      ))
    ) : (
      <p className="text-sm text-neutral-500 italic">N/A</p>
    )}
  </div>
)

export default Dataset
