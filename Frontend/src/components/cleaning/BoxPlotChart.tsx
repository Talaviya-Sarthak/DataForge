import {
    CartesianGrid,
    ComposedChart,
    ResponsiveContainer,
    Scatter,
    Tooltip,
    XAxis,
    YAxis,
    Cell,
    Rectangle,
} from "recharts"
import { useMemo } from "react"

type BoxPlotChartProps = {
    values: number[]
    featureName: string
}

type BoxPlotSummary = {
    min: number
    q1: number
    median: number
    q3: number
    max: number
    iqr: number
    lowerWhisker: number
    upperWhisker: number
    outliers: number[]
}

const toPercentile = (sortedValues: number[], percentile: number) => {
    if (!sortedValues.length) return 0
    const index = (sortedValues.length - 1) * percentile
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    if (lower === upper) return sortedValues[lower]
    const weight = index - lower
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight
}

const buildSummary = (inputValues: number[]): BoxPlotSummary | null => {
    const filtered = inputValues.filter((v) => Number.isFinite(v))
    if (filtered.length < 5) return null

    const sorted = [...filtered].sort((a, b) => a - b)
    const q1 = toPercentile(sorted, 0.25)
    const median = toPercentile(sorted, 0.5)
    const q3 = toPercentile(sorted, 0.75)
    const iqr = q3 - q1
    
    const lowerFence = q1 - 1.5 * iqr
    const upperFence = q3 + 1.5 * iqr
    
    const withinWhiskers = sorted.filter((v) => v >= lowerFence && v <= upperFence)
    const lowerWhisker = withinWhiskers.length > 0 ? withinWhiskers[0] : sorted[0]
    const upperWhisker = withinWhiskers.length > 0 ? withinWhiskers[withinWhiskers.length - 1] : sorted[sorted.length - 1]
    
    const outliers = sorted.filter((v) => v < lowerFence || v > upperFence)

    return {
        min: sorted[0],
        q1,
        median,
        q3,
        max: sorted[sorted.length - 1],
        iqr,
        lowerWhisker,
        upperWhisker,
        outliers,
    }
}

const formatValue = (value: number) => {
    if (!Number.isFinite(value)) return "0"
    if (Math.abs(value) >= 1000) return value.toFixed(0)
    if (Math.abs(value) >= 100) return value.toFixed(1)
    return value.toFixed(2)
}

const CustomBoxShape = (props: any) => {
    const { cx, cy, payload, summary, yScale } = props
    
    if (!summary || !yScale) return null

    const boxWidth = 60
    const whiskerWidth = 30

    const q1Y = yScale(summary.q1)
    const q3Y = yScale(summary.q3)
    const medianY = yScale(summary.median)
    const lowerWhiskerY = yScale(summary.lowerWhisker)
    const upperWhiskerY = yScale(summary.upperWhisker)

    return (
        <g>
            {/* Lower whisker line */}
            <line
                x1={cx}
                y1={q1Y}
                x2={cx}
                y2={lowerWhiskerY}
                stroke="#888888"
                strokeWidth={2}
                strokeDasharray="4 4"
            />
            {/* Lower whisker cap */}
            <line
                x1={cx - whiskerWidth / 2}
                y1={lowerWhiskerY}
                x2={cx + whiskerWidth / 2}
                y2={lowerWhiskerY}
                stroke="#888888"
                strokeWidth={2}
            />

            {/* Box (Q1 to Q3) */}
            <rect
                x={cx - boxWidth / 2}
                y={q3Y}
                width={boxWidth}
                height={q1Y - q3Y}
                fill="#8884d8"
                fillOpacity={0.6}
                stroke="#8884d8"
                strokeWidth={2}
                rx={4}
            />

            {/* Median line */}
            <line
                x1={cx - boxWidth / 2}
                y1={medianY}
                x2={cx + boxWidth / 2}
                y2={medianY}
                stroke="#FFFFFF"
                strokeWidth={3}
            />

            {/* Upper whisker line */}
            <line
                x1={cx}
                y1={q3Y}
                x2={cx}
                y2={upperWhiskerY}
                stroke="#888888"
                strokeWidth={2}
                strokeDasharray="4 4"
            />
            {/* Upper whisker cap */}
            <line
                x1={cx - whiskerWidth / 2}
                y1={upperWhiskerY}
                x2={cx + whiskerWidth / 2}
                y2={upperWhiskerY}
                stroke="#888888"
                strokeWidth={2}
            />
        </g>
    )
}

export const BoxPlotChart = ({ values, featureName }: BoxPlotChartProps) => {
    const summary = useMemo(() => buildSummary(values), [values])

    const outlierData = useMemo(() => {
        if (!summary) return []
        return summary.outliers.map((value, idx) => ({ x: 0, y: value, id: idx }))
    }, [summary])

    if (!summary) {
        return (
            <div className="flex h-90 items-center justify-center rounded-lg border border-[#222222] bg-[#0A0A0A]">
                <p className="text-sm text-[#A1A1AA]">Not enough data for box plot (minimum 5 values required).</p>
            </div>
        )
    }

    const dummyData = [{ x: 0, y: summary.median }]

    return (
        <div className="space-y-3">
            <div className="h-[360px] w-full rounded-lg border border-[#222222] bg-[#111111]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dummyData} margin={{ top: 20, right: 40, left: 40, bottom: 40 }}>
                        <CartesianGrid stroke="#222222" strokeDasharray="3 3" />
                        <XAxis
                            type="category"
                            dataKey="x"
                            stroke="#A1A1AA"
                            tickLine={false}
                            axisLine={{ stroke: "#222222" }}
                            tick={{ fontSize: 12, fontWeight: 400 }}
                            ticks={[0]}
                            tickFormatter={() => featureName}
                        />
                        <YAxis
                            type="number"
                            stroke="#A1A1AA"
                            tickLine={false}
                            axisLine={{ stroke: "#222222" }}
                            tick={{ fontSize: 12, fontWeight: 400 }}
                            domain={[summary.min * 0.95, summary.max * 1.05]}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#111111",
                                border: "1px solid #222222",
                                borderRadius: "10px",
                                color: "#FFFFFF",
                            }}
                            itemStyle={{ color: "#FFFFFF", fontWeight: 400 }}
                            labelStyle={{ color: "#A1A1AA", fontWeight: 400 }}
                            formatter={(value: any) => [formatValue(Number(value)), "Value"]}
                        />

                        <Scatter
                            data={dummyData}
                            fill="transparent"
                            shape={(props: any) => {
                                const yScale = props.yAxis?.scale
                                return <CustomBoxShape {...props} summary={summary} yScale={yScale} />
                            }}
                        />

                        <Scatter
                            data={outlierData}
                            fill="#ef4444"
                            shape="circle"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-white sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-lg border border-[#1F1F1F] bg-[#111111] px-3 py-2">
                    <div className="text-gray-400">Min</div>
                    <div className="font-medium">{formatValue(summary.min)}</div>
                </div>
                <div className="rounded-lg border border-[#1F1F1F] bg-[#111111] px-3 py-2">
                    <div className="text-gray-400">Q1</div>
                    <div className="font-medium">{formatValue(summary.q1)}</div>
                </div>
                <div className="rounded-lg border border-[#1F1F1F] bg-[#111111] px-3 py-2">
                    <div className="text-gray-400">Median</div>
                    <div className="font-medium">{formatValue(summary.median)}</div>
                </div>
                <div className="rounded-lg border border-[#1F1F1F] bg-[#111111] px-3 py-2">
                    <div className="text-gray-400">Q3</div>
                    <div className="font-medium">{formatValue(summary.q3)}</div>
                </div>
                <div className="rounded-lg border border-[#1F1F1F] bg-[#111111] px-3 py-2">
                    <div className="text-gray-400">Max</div>
                    <div className="font-medium">{formatValue(summary.max)}</div>
                </div>
                <div className="rounded-lg border border-[#2A2A2A] bg-[#111111] px-3 py-2">
                    <div className="text-gray-400">Outliers</div>
                    <div className="font-medium text-red-400">{summary.outliers.length}</div>
                </div>
            </div>
        </div>
    )
}
