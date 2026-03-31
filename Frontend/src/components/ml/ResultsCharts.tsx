import { useMLExperiment } from '../../contexts/MLExperimentContext';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';

const NEON_COLORS = ['#00FFFF', '#00BFFF', '#39FF14', '#9D00FF'];

export const ResultsCharts = () => {
    const { trainingResults, config } = useMLExperiment();

    if (!trainingResults || !trainingResults.chart_data) {
        return null;
    }

    const { chart_data, task_type } = trainingResults;
    const modelNames = chart_data.model_names || [];

    // Prepare data for charts
    const prepareGroupedBarData = () => {
        const data: any[] = [];
        const metrics = task_type === 'classification'
            ? ['accuracy', 'precision', 'recall', 'f1_score']
            : ['r2_score', 'rmse', 'mse'];

        modelNames.forEach((name, index) => {
            const item: any = { name: name.length > 15 ? name.substring(0, 15) + '...' : name };
            metrics.forEach((metric) => {
                const values = chart_data.grouped_bar?.[metric] || [];
                item[metric] = values[index] || 0;
            });
            data.push(item);
        });

        return data;
    };

    const prepareHorizontalBarData = () => {
        const metric = chart_data.horizontal_bar?.metric || 'accuracy';
        const values = chart_data.horizontal_bar?.values || [];

        return modelNames.map((name, index) => ({
            name: name.length > 20 ? name.substring(0, 20) + '...' : name,
            value: values[index] || 0,
            fullName: name,
        })).sort((a, b) => b.value - a.value);
    };

    const groupedBarData = prepareGroupedBarData();
    const horizontalBarData = prepareHorizontalBarData();

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Model Comparison Charts
            </h2>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Horizontal Bar Chart - Model Ranking */}
                <div style={{ background: '#000000' }} className="rounded-xl p-6 border border-cyan-500/20 shadow-[0_0_40px_rgba(0,255,255,0.3)]">
                    <h3 className="text-lg font-normal mb-4 text-gray-400">
                        Model Ranking by {chart_data.horizontal_bar?.metric === 'accuracy' ? 'Accuracy' : 'R² Score'}
                    </h3>
                    <div className="h-[300px]" style={{ background: '#000000' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={horizontalBarData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                            >
                                <XAxis
                                    type="number"
                                    domain={[0, 1]}
                                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                                    stroke="rgba(255,255,255,0.2)"
                                    tick={{ fill: '#888888', fontSize: 12 }}
                                />
                                <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fill: '#888888', fontSize: 11 }} width={90} />
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: '#000', 
                                        border: '1px solid rgba(0,255,255,0.3)', 
                                        boxShadow: '0 0 15px rgba(0,255,255,0.3)',
                                        borderRadius: '10px', 
                                        color: '#ffffff' 
                                    }}
                                    formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, chart_data.horizontal_bar?.metric]}
                                    labelStyle={{ color: '#00FFFF' }}
                                />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                                    {horizontalBarData.map((_, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill="#00FFFF" 
                                            style={{ filter: 'drop-shadow(0 0 12px rgba(0, 255, 255, 0.9)) drop-shadow(0 0 20px rgba(0, 255, 255, 0.6))' }}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Grouped Bar Chart - Metrics Comparison */}
                <div style={{ background: '#000000' }} className="rounded-xl p-6 border border-cyan-500/20 shadow-[0_0_40px_rgba(0,255,255,0.3)]">
                    <h3 className="text-lg font-normal mb-4 text-gray-400">
                        {task_type === 'classification' ? 'Classification Metrics' : 'Regression Metrics'}
                    </h3>
                    <div className="h-[300px]" style={{ background: '#000000' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={groupedBarData} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
                                <XAxis
                                    dataKey="name"
                                    stroke="rgba(255,255,255,0.2)"
                                    tick={{ fill: '#888888', fontSize: 10 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                    interval={0}
                                />
                                <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: '#888888' }} />
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: '#000', 
                                        border: '1px solid rgba(0,255,255,0.3)', 
                                        boxShadow: '0 0 15px rgba(0,255,255,0.3)',
                                        borderRadius: '10px', 
                                        color: '#ffffff' 
                                    }}
                                    formatter={(value: number) => value.toFixed(4)}
                                    labelStyle={{ color: '#00FFFF' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px', color: '#aaaaaa' }} iconType="circle" />
                                {task_type === 'classification' ? (
                                    <>
                                        <Bar dataKey="accuracy" fill="#00FFFF" name="Accuracy" radius={[6, 6, 0, 0]} style={{ filter: 'drop-shadow(0 0 12px rgba(0, 255, 255, 0.9)) drop-shadow(0 0 20px rgba(0, 255, 255, 0.6))' }} />
                                        <Bar dataKey="precision" fill="#00BFFF" name="Precision" radius={[6, 6, 0, 0]} style={{ filter: 'drop-shadow(0 0 10px rgba(0, 191, 255, 0.7)) drop-shadow(0 0 18px rgba(0, 191, 255, 0.4))' }} />
                                        <Bar dataKey="recall" fill="#39FF14" name="Recall" radius={[6, 6, 0, 0]} style={{ filter: 'drop-shadow(0 0 10px rgba(57, 255, 20, 0.7)) drop-shadow(0 0 18px rgba(57, 255, 20, 0.4))' }} />
                                        <Bar dataKey="f1_score" fill="#9D00FF" name="F1 Score" radius={[6, 6, 0, 0]} style={{ filter: 'drop-shadow(0 0 10px rgba(157, 0, 255, 0.7)) drop-shadow(0 0 18px rgba(157, 0, 255, 0.4))' }} />
                                    </>
                                ) : (
                                    <>
                                        <Bar dataKey="r2_score" fill="#00FFFF" name="R² Score" radius={[6, 6, 0, 0]} style={{ filter: 'drop-shadow(0 0 12px rgba(0, 255, 255, 0.9)) drop-shadow(0 0 20px rgba(0, 255, 255, 0.6))' }} />
                                        <Bar dataKey="rmse" fill="#00BFFF" name="RMSE" radius={[6, 6, 0, 0]} style={{ filter: 'drop-shadow(0 0 10px rgba(0, 191, 255, 0.7)) drop-shadow(0 0 18px rgba(0, 191, 255, 0.4))' }} />
                                    </>
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Stacked Bar Chart for Classification */}
            {task_type === 'classification' && chart_data.stacked_bar && (
                <div style={{ background: '#000000' }} className="rounded-xl p-6 border border-cyan-500/20 shadow-[0_0_40px_rgba(0,255,255,0.3)]">
                    <h3 className="text-lg font-normal mb-4 text-gray-400">Stacked Metrics Comparison</h3>
                    <div className="h-[250px]" style={{ background: '#000000' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={groupedBarData} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
                                <XAxis
                                    dataKey="name"
                                    stroke="rgba(255,255,255,0.2)"
                                    tick={{ fill: '#888888', fontSize: 10 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                    interval={0}
                                />
                                <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: '#888888' }} />
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: '#000', 
                                        border: '1px solid rgba(0,255,255,0.3)', 
                                        boxShadow: '0 0 15px rgba(0,255,255,0.3)',
                                        borderRadius: '10px', 
                                        color: '#ffffff' 
                                    }}
                                    formatter={(value: number) => value.toFixed(4)}
                                    labelStyle={{ color: '#00FFFF' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ color: '#aaaaaa' }} />
                                <Bar dataKey="accuracy" stackId="a" fill="#00FFFF" name="Accuracy" radius={[6, 6, 0, 0]} style={{ filter: 'drop-shadow(0 0 12px rgba(0, 255, 255, 0.9)) drop-shadow(0 0 20px rgba(0, 255, 255, 0.6))' }} />
                                <Bar dataKey="precision" stackId="a" fill="#00BFFF" name="Precision" style={{ filter: 'drop-shadow(0 0 10px rgba(0, 191, 255, 0.7)) drop-shadow(0 0 18px rgba(0, 191, 255, 0.4))' }} />
                                <Bar dataKey="recall" stackId="a" fill="#39FF14" name="Recall" style={{ filter: 'drop-shadow(0 0 10px rgba(57, 255, 20, 0.7)) drop-shadow(0 0 18px rgba(57, 255, 20, 0.4))' }} />
                                <Bar dataKey="f1_score" stackId="a" fill="#9D00FF" name="F1 Score" style={{ filter: 'drop-shadow(0 0 10px rgba(157, 0, 255, 0.7)) drop-shadow(0 0 18px rgba(157, 0, 255, 0.4))' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};
