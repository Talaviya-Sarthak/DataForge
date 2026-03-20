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

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#84cc16'];

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
            <h2 className="text-xl font-semibold flex items-center gap-2">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Model Comparison Charts
            </h2>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Horizontal Bar Chart - Model Ranking */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                    <h3 className="text-lg font-medium mb-4">
                        Model Ranking by {chart_data.horizontal_bar?.metric === 'accuracy' ? 'Accuracy' : 'R² Score'}
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={horizontalBarData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    type="number"
                                    domain={[0, 1]}
                                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                                    stroke="#9ca3af"
                                />
                                <YAxis type="category" dataKey="name" stroke="#9ca3af" width={90} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                    formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, chart_data.horizontal_bar?.metric]}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {horizontalBarData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Grouped Bar Chart - Metrics Comparison */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                    <h3 className="text-lg font-medium mb-4">
                        {task_type === 'classification' ? 'Classification Metrics' : 'Regression Metrics'}
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={groupedBarData} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#9ca3af"
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                    interval={0}
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                    formatter={(value: number) => value.toFixed(4)}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                {task_type === 'classification' ? (
                                    <>
                                        <Bar dataKey="accuracy" fill="#8b5cf6" name="Accuracy" />
                                        <Bar dataKey="precision" fill="#ec4899" name="Precision" />
                                        <Bar dataKey="recall" fill="#06b6d4" name="Recall" />
                                        <Bar dataKey="f1_score" fill="#10b981" name="F1 Score" />
                                    </>
                                ) : (
                                    <>
                                        <Bar dataKey="r2_score" fill="#8b5cf6" name="R² Score" />
                                        <Bar dataKey="rmse" fill="#ec4899" name="RMSE" />
                                    </>
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Stacked Bar Chart for Classification */}
            {task_type === 'classification' && chart_data.stacked_bar && (
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                    <h3 className="text-lg font-medium mb-4">Stacked Metrics Comparison</h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={groupedBarData} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#9ca3af"
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                    interval={0}
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                    formatter={(value: number) => value.toFixed(4)}
                                />
                                <Legend />
                                <Bar dataKey="accuracy" stackId="a" fill="#8b5cf6" name="Accuracy" />
                                <Bar dataKey="precision" stackId="a" fill="#ec4899" name="Precision" />
                                <Bar dataKey="recall" stackId="a" fill="#06b6d4" name="Recall" />
                                <Bar dataKey="f1_score" stackId="a" fill="#10b981" name="F1 Score" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};
