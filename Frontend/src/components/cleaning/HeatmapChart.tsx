import { useMemo } from "react"

type HeatmapChartProps = {
    data: any[]
    numericColumns: string[]
}

type CorrelationCell = {
    x: string
    y: string
    value: number
}

const calculateCorrelation = (arr1: number[], arr2: number[]): number => {
    const n = arr1.length
    if (n === 0 || n !== arr2.length) return 0

    const mean1 = arr1.reduce((sum, val) => sum + val, 0) / n
    const mean2 = arr2.reduce((sum, val) => sum + val, 0) / n

    let numerator = 0
    let sum1 = 0
    let sum2 = 0

    for (let i = 0; i < n; i++) {
        const diff1 = arr1[i] - mean1
        const diff2 = arr2[i] - mean2
        numerator += diff1 * diff2
        sum1 += diff1 * diff1
        sum2 += diff2 * diff2
    }

    const denominator = Math.sqrt(sum1 * sum2)
    return denominator === 0 ? 0 : numerator / denominator
}

const getCorrelationColor = (value: number): string => {
    if (value > 0.7) return "#10b981"
    if (value > 0.3) return "#22c55e"
    if (value > -0.3) return "#6b7280"
    if (value > -0.7) return "#f59e0b"
    return "#ef4444"
}

export const HeatmapChart = ({ data, numericColumns }: HeatmapChartProps) => {
    const correlationMatrix = useMemo<CorrelationCell[]>(() => {
        if (!data.length || numericColumns.length < 2) return []

        const matrix: CorrelationCell[] = []

        const columnData: Record<string, number[]> = {}
        numericColumns.forEach((col) => {
            columnData[col] = data
                .map((row) => {
                    const val = row?.[col]
                    if (val === null || val === undefined || val === "") return null
                    const parsed = Number(String(val).replaceAll(",", ""))
                    return Number.isFinite(parsed) ? parsed : null
                })
                .filter((v): v is number => v !== null)
        })

        for (let i = 0; i < numericColumns.length; i++) {
            for (let j = 0; j < numericColumns.length; j++) {
                const col1 = numericColumns[i]
                const col2 = numericColumns[j]
                const arr1 = columnData[col1]
                const arr2 = columnData[col2]

                const minLength = Math.min(arr1.length, arr2.length)
                const correlation = calculateCorrelation(arr1.slice(0, minLength), arr2.slice(0, minLength))

                matrix.push({
                    x: col1,
                    y: col2,
                    value: correlation,
                })
            }
        }

        return matrix
    }, [data, numericColumns])

    if (!correlationMatrix.length) {
        return (
            <div className="flex h-90 items-center justify-center rounded-lg border border-[#222222] bg-[#0A0A0A]">
                <p className="text-sm text-[#A1A1AA]">Not enough numeric columns to compute correlation matrix.</p>
            </div>
        )
    }

    const uniqueColumns = Array.from(new Set(correlationMatrix.map((c) => c.x)))

    return (
        <div className="h-100 w-full rounded-lg border border-[#222222] bg-[#111111] p-4 overflow-auto">
            <h4 className="text-sm font-medium text-white mb-4">Correlation Matrix</h4>
            <div className="inline-block min-w-full">
                <table className="border-collapse">
                    <thead>
                        <tr>
                            <th className="border border-[#222222] bg-[#0A0A0A] px-3 py-2 text-xs text-gray-400"></th>
                            {uniqueColumns.map((col) => (
                                <th
                                    key={col}
                                    className="border border-[#222222] bg-[#0A0A0A] px-3 py-2 text-xs text-gray-400 font-medium"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {uniqueColumns.map((rowCol) => (
                            <tr key={rowCol}>
                                <td className="border border-[#222222] bg-[#0A0A0A] px-3 py-2 text-xs text-gray-400 font-medium">
                                    {rowCol}
                                </td>
                                {uniqueColumns.map((colCol) => {
                                    const cell = correlationMatrix.find((c) => c.x === rowCol && c.y === colCol)
                                    const value = cell?.value ?? 0
                                    const color = getCorrelationColor(value)

                                    return (
                                        <td
                                            key={colCol}
                                            className="border border-[#222222] px-3 py-2 text-center text-xs font-medium text-white cursor-pointer hover:opacity-80 transition-opacity"
                                            style={{ backgroundColor: color }}
                                            title={`${rowCol} vs ${colCol}: ${value.toFixed(3)}`}
                                        >
                                            {value.toFixed(2)}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: "#ef4444" }}></div>
                    <span>Strong Negative</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: "#6b7280" }}></div>
                    <span>Weak</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: "#10b981" }}></div>
                    <span>Strong Positive</span>
                </div>
            </div>
        </div>
    )
}
