"use client"

import * as React from "react"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"

type Row = Record<string, any>

export default function DataTable({ data }: { data: Row[] }) {
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(5)
  const PAGE_WINDOW = 3

  if (!data || data.length === 0) return null

  React.useEffect(() => {
    setPage(0)
  }, [data])

  const columns = Object.keys(data[0])
  const start = page * rowsPerPage
  const paginated = data.slice(start, start + rowsPerPage)
  const totalPages = Math.ceil(data.length / rowsPerPage)
  const total = data.length
  const end = Math.min(start + rowsPerPage, total)
  const startPage = Math.max(0, Math.min(page, totalPages - PAGE_WINDOW))

  const visiblePages = Array.from(
    { length: Math.min(PAGE_WINDOW, totalPages) },
    (_, i) => startPage + i
  )

  return (
    <div className="mt-35 max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto text-white">
      <div className="overflow-x-auto">
        <div className="overflow-auto rounded-xl border border-neutral-800 bg-gradient-to-b from-neutral-900/80 to-black">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr className="bg-neutral-900/70">
                {columns.map(col => (
                  <th
                    key={col}
                    className="px-6 py-4 text-left text-sm font-semibold text-neutral-300 whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginated.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-neutral-800 transition hover:bg-neutral-800/40"
                >
                  {columns.map(col => (
                    <td
                      key={col}
                      className="px-6 py-4 text-sm text-neutral-200 whitespace-nowrap"
                    >
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-neutral-400">
        <div className="flex items-center gap-2">
          Rows per page
          <select
            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1"
            value={rowsPerPage}
            onChange={e => {
              setRowsPerPage(Number(e.target.value))
              setPage(0)
            }}
          >
            {[5, 10, 15].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Pagination Controls */}
        <div className="mt-6 flex items-center justify-end gap-6 text-sm text-neutral-400">
          {/* Range text */}
          <span>
            {start + 1} – {end} of {total}
          </span>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Left arrow */}
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="text-neutral-500 cursor-pointer hover:text-white disabled:opacity-30"
            >
              <FaChevronLeft />
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-2 font-bold">
              {visiblePages.map(i => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`px-3 py-1 rounded-md transition ${page === i
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:text-white"
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Right arrow */}
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="cursor-pointer text-neutral-500 hover:text-white disabled:opacity-30"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}