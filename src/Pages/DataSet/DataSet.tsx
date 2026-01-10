"use client"

import Header from "@/components/layouts/Header"
import { Footer } from "@/components/layouts/Footer"
import { FileUpload } from "@/components/ui/file-upload"
import { useState } from "react"
import DataTable from "@/components/ui/DataTable"
import { MdError, MdRefresh } from "react-icons/md"
import { Button } from "@/components/ui/button"
import Aurora from "@/components/Aurora"
import { useMutation } from "@tanstack/react-query"
import { Link } from "react-router-dom"

const uploadDataset = async (file: File) => {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch("http://localhost:8000/upload", {
    method: "POST",
    body: formData,
  })

  if (!res.ok) throw new Error("Upload failed")
  return res.json()
}

const Dataset = () => {
  const [file, setFile] = useState<File | null>(null)

  const uploadMutation = useMutation({
    mutationFn: uploadDataset,
    retry: 3,
    retryDelay: 2000,
  })

  const handleFileUpload = (files: File[]) => {
    if (!files || files.length === 0) return
    setFile(files[0])
    uploadMutation.mutate(files[0])
  }

  const dataset = uploadMutation.data
  const loading = uploadMutation.isPending
  const Error = uploadMutation.isError

  return (
    <div className="min-h-screen relative">

      <div className="relative overflow-hidden flex flex-col">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Aurora
            colorStops={["#0B2FFF", "#33E6FF", "#1B8CFF"]}
            blend={0.5}
            amplitude={1.0}
            speed={0.5}
          />
        </div>

        <div className="relative z-10 py-24">
          <div className="-mt-24">
            <Header />
          </div>

          <div className="mt-8">
            <h1 className="text-4xl mb-2 text-center font-bold text-white">
              Add Your Files
            </h1>
            <p className="mt-2 text-center mb-10 text-neutral-400">
              Choose files and upload them below
            </p>

            <div className="w-full max-w-4xl mx-auto min-h-80 rounded-lg">
              <FileUpload onChange={handleFileUpload} />
            </div>
          </div>
        </div>

        <div className="mb-12 -mt-16">

          {loading && (
            <div className="flex justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            </div>
          )}

          {Error && (
            <div className="flex justify-center">
              <div className="text-red-600 flex justify-center font-bold">
                <span className="text-white text-2xl pr-1">
                  <MdError />
                </span>
                <p>Upload Failed, Check Network connection.</p>
              </div>
              <div>
                <Button
                  onClick={() => file && uploadMutation.mutate(file)}
                  className="text-s rounded-xl px-5 ml-15 cursor-pointer bg-white text-black hover:bg-gray-300"
                >
                  <span className="text-xl pr-1">
                    <MdRefresh />
                  </span>
                  Refresh
                </Button>
              </div>
            </div>
          )}

          {dataset && <DataTable data={dataset.data} />}

          {dataset && (
            <div className="mt-4 flex justify-end max-w-6xl mx-auto">
              <button
                onClick={() => {
                  uploadMutation.reset()
                  setFile(null)
                }}
                className="px-3 py-2 text-sm rounded-md bg-red-700 text-white hover:bg-red-900"
              >
                Remove Dataset
              </button>
            </div>
          )}

          {dataset && (
            <div className="max-w-6xl mx-auto mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Total Rows" value={dataset.rows} />
              <Stat label="Total Columns" value={dataset.columns} />
              <Stat label="Numeric Columns" value={dataset.numerical_columns.length} />
              <Stat label="Categorical Columns" value={dataset.categorical_columns.length} />
            </div>
          )}

          {dataset && (
            <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <ColumnBox title="Numeric Columns" data={dataset.numerical_columns} />
              <ColumnBox title="Categorical Columns" data={dataset.categorical_columns} />
            </div>
          )}

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
        <div className="ml-[45%] mb-16">
          <Link to="/Cleaning">
            <button className="group relative w-35 h-10 mt-5 rounded-lg text-white text-sm font-medium bg-[#0f0f10] border border-white/15 overflow-hidden cursor-pointer  transition-all duration-300 hover:shadow-[0_0_25px_#33E6FF55] hover:border-[#33E6FF]">
              <span className="relative z-10">
                Start Processing
              </span>

              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#33E6FF]/70 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full duration-[1600ms] ease-[cubic-bezier(0.45,0,0.2,1)] transition blur-sm" />

            </button>
          </Link>
        </div>
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
