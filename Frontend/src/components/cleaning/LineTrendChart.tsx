import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

type LineTrendPoint = {
    rowIndex: number
    primary: number
    secondary?: number
}

type LineTrendChartProps = {
    data: LineTrendPoint[]
    primaryFeature: string
    secondaryFeature?: string | null
}

export const LineTrendChart = ({ data, primaryFeature, secondaryFeature }: LineTrendChartProps) => {
    if (!data.length) {
        return (
            <div className="flex h-90 items-center justify-center rounded-lg border border-[#222222] bg-[#0A0A0A]">
                <p className="text-sm text-[#A1A1AA]">Not enough numeric rows to render this chart.</p>
            </div>
        )
    }

    return (
        <div className="h-100 w-full rounded-lg border border-[#222222] bg-[#111111]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 16, right: 20, left: 6, bottom: 24 }}>
                    <CartesianGrid stroke="#222222" strokeDasharray="3 3" />
                    <XAxis
                        dataKey="rowIndex"
                        stroke="#A1A1AA"
                        tickLine={false}
                        axisLine={{ stroke: "#222222" }}
                        tick={{ fontSize: 11, fontWeight: 400 }}
                        label={{ value: "Row Index", position: "insideBottom", offset: -10, fill: "#A1A1AA" }}
                    />
                    <YAxis
                        stroke="#A1A1AA"
                        tickLine={false}
                        axisLine={{ stroke: "#222222" }}
                        tick={{ fontSize: 12, fontWeight: 400 }}
                    />
                    <Tooltip
                        cursor={{ stroke: "#222222" }}
                        contentStyle={{
                            backgroundColor: "#111111",
                            border: "1px solid #222222",
                            borderRadius: "10px",
                            color: "#FFFFFF",
                        }}
                        itemStyle={{ color: "#FFFFFF", fontWeight: 400 }}
                        labelStyle={{ color: "#A1A1AA", fontWeight: 400 }}
                    />
                    <Legend verticalAlign="bottom" align="center" wrapperStyle={{ color: "#A1A1AA", fontSize: "12px", fontWeight: 400, paddingTop: "8px" }} />
                    <Line
                        type="monotone"
                        dataKey="primary"
                        name={primaryFeature}
                        stroke="#8884d8"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, stroke: "#111111" }}
                        animationDuration={850}
                        animationEasing="ease-out"
                    />
                    {secondaryFeature && (
                        <Line
                            type="monotone"
                            dataKey="secondary"
                            name={secondaryFeature}
                            stroke="#82ca9d"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5, stroke: "#111111" }}
                            animationDuration={900}
                            animationEasing="ease-out"
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
