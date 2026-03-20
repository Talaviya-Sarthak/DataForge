import {
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

type ScatterPoint = {
    x: number
    y: number
}

type ScatterPlotChartProps = {
    data: ScatterPoint[]
    xFeature: string
    yFeature: string
}

export const ScatterPlotChart = ({ data, xFeature, yFeature }: ScatterPlotChartProps) => {
    if (!data.length) {
        return (
            <div className="flex h-90 items-center justify-center rounded-lg border border-[#222222] bg-[#0A0A0A]">
                <p className="text-sm text-[#A1A1AA]">Not enough paired numeric rows to render this chart.</p>
            </div>
        )
    }

    return (
        <div className="h-100 w-full rounded-lg border border-[#222222] bg-[#111111]">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 16, right: 20, left: 0, bottom: 18 }}>
                    <CartesianGrid stroke="#222222" strokeDasharray="3 3" />
                    <XAxis
                        dataKey="x"
                        name={xFeature}
                        stroke="#A1A1AA"
                        tickLine={false}
                        axisLine={{ stroke: "#222222" }}
                        tick={{ fontSize: 11, fontWeight: 400 }}
                    />
                    <YAxis
                        dataKey="y"
                        name={yFeature}
                        stroke="#A1A1AA"
                        tickLine={false}
                        axisLine={{ stroke: "#222222" }}
                        tick={{ fontSize: 11, fontWeight: 400 }}
                    />
                    <Tooltip
                        cursor={{ strokeDasharray: "3 3", stroke: "#222222" }}
                        contentStyle={{
                            backgroundColor: "#111111",
                            border: "1px solid #222222",
                            borderRadius: "10px",
                            color: "#FFFFFF",
                        }}
                        itemStyle={{ color: "#FFFFFF", fontWeight: 400 }}
                        labelStyle={{ color: "#A1A1AA", fontWeight: 400 }}
                        formatter={(value, name) => [Number(value ?? 0).toFixed(3), name]}
                    />
                    <Legend verticalAlign="bottom" align="center" wrapperStyle={{ color: "#A1A1AA", fontSize: "12px", fontWeight: 400, paddingTop: "8px" }} />
                    <Scatter
                        name={`${xFeature} vs ${yFeature}`}
                        data={data}
                        fill="#8884d8"
                        animationDuration={900}
                        animationEasing="ease-out"
                    />
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    )
}
