import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import { useMemo } from "react"

type HistogramChartProps = {
    values: number[]
    featureName: string
}

type HistogramBin = {
    label: string
    min: number
    max: number
    pv: number
    uv: number
}

const CHART_COLORS = {
    grid: "#222222",
    axis: "#A1A1AA",
    tooltipBg: "#111111",
    tooltipBorder: "#222222",
    primaryBar: "#8884d8",
    secondaryBar: "#82ca9d",
}

const toFixedLabel = (value: number) => {
    if (!Number.isFinite(value)) return "0"
    if (Math.abs(value) >= 1000) return value.toFixed(0)
    if (Math.abs(value) >= 100) return value.toFixed(1)
    return value.toFixed(2)
}

export const HistogramChart = ({ values, featureName }: HistogramChartProps) => {
    const histogramData = useMemo<HistogramBin[]>(() => {
        if (!values.length) return []

        const minValue = Math.min(...values)
        const maxValue = Math.max(...values)

        if (minValue === maxValue) {
            return [
                {
                    label: toFixedLabel(minValue),
                    min: minValue,
                    max: maxValue,
                    pv: values.length,
                    uv: values.length,
                },
            ]
        }

        const numberOfBins = Math.max(8, Math.min(18, Math.ceil(Math.sqrt(values.length))))
        const binSize = (maxValue - minValue) / numberOfBins

        const bins = Array.from({ length: numberOfBins }, (_, index) => {
            const binStart = minValue + index * binSize
            const binEnd = index === numberOfBins - 1 ? maxValue : binStart + binSize

            return {
                label: `${toFixedLabel(binStart)} - ${toFixedLabel(binEnd)}`,
                min: binStart,
                max: binEnd,
                pv: 0,
                uv: 0,
            }
        })

        values.forEach((value) => {
            const rawBinIndex = Math.floor((value - minValue) / binSize)
            const safeIndex = Math.max(0, Math.min(numberOfBins - 1, rawBinIndex))
            bins[safeIndex].pv += 1
        })

        const totalCount = values.length
        bins.forEach((bin) => {
            bin.uv = Number(((bin.pv / totalCount) * 100).toFixed(2))
        })

        return bins
    }, [values])

    const legendStyle = useMemo(
        () => ({
            color: "#A1A1AA",
            fontSize: "12px",
            fontWeight: 400,
            paddingTop: "8px",
        }),
        [],
    )

    if (!histogramData.length) {
        return (
            <div className="flex h-90 items-center justify-center rounded-lg border border-[#222222] bg-[#0A0A0A]">
                <p className="text-sm text-[#A1A1AA]">No numeric values available for this feature.</p>
            </div>
        )
    }

    return (
        <div className="h-100 w-full rounded-lg border border-[#222222] bg-[#111111]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 16, right: 20, left: 0, bottom: 36 }} barGap={6} barCategoryGap="22%">
                    <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                    <XAxis
                        dataKey="label"
                        stroke={CHART_COLORS.axis}
                        tickLine={false}
                        axisLine={{ stroke: CHART_COLORS.grid }}
                        minTickGap={16}
                        angle={-20}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 11, fontWeight: 400 }}
                    />
                    <YAxis
                        stroke={CHART_COLORS.axis}
                        tickLine={false}
                        axisLine={{ stroke: CHART_COLORS.grid }}
                        tick={{ fontSize: 12, fontWeight: 400 }}
                    />
                    <Tooltip
                        cursor={{ fill: "rgba(136, 132, 216, 0.1)" }}
                        contentStyle={{
                            backgroundColor: CHART_COLORS.tooltipBg,
                            border: `1px solid ${CHART_COLORS.tooltipBorder}`,
                            borderRadius: "10px",
                            color: "#FFFFFF",
                        }}
                        itemStyle={{ color: "#FFFFFF", fontWeight: 400 }}
                        labelStyle={{ color: "#A1A1AA", fontWeight: 400 }}
                        formatter={(value, name) => {
                            if (name === "uv") {
                                return [`${Number(value ?? 0).toFixed(2)}%`, "Share"]
                            }
                            return [Number(value ?? 0), "Frequency"]
                        }}
                        labelFormatter={(label) => `Range: ${label}`}
                    />
                    <Legend verticalAlign="bottom" align="center" wrapperStyle={legendStyle} />
                    <Bar
                        dataKey="pv"
                        name={`${featureName} frequency`}
                        fill={CHART_COLORS.primaryBar}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={40}
                        animationDuration={700}
                        animationEasing="ease-out"
                    />
                    <Bar
                        dataKey="uv"
                        name="Share (%)"
                        fill={CHART_COLORS.secondaryBar}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={40}
                        animationDuration={700}
                        animationEasing="ease-out"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
