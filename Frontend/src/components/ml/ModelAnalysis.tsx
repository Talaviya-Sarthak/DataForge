import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useMLExperiment } from '../../contexts/MLExperimentContext';
import type { FeatureImportance, ModelPlots, ModelResult, ResidualPoint } from '../../services/training.service';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const ChartCard = ({
  title,
  subtitle,
  isEmpty,
  emptyMessage,
  children,
}: {
  title: string;
  subtitle?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  children?: ReactNode;
}) => (
  <div className="rounded-xl border border-neutral-800/70 bg-gradient-to-b from-neutral-900/60 to-neutral-950/60 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
    <div className="mb-4">
      <h3 className="text-lg font-medium text-white">{title}</h3>
      {subtitle ? <p className="text-xs text-neutral-400">{subtitle}</p> : null}
    </div>
    {isEmpty ? (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-neutral-700/50 text-sm text-neutral-400">
        {emptyMessage || 'No data available for this chart.'}
      </div>
    ) : (
      <div className="h-[280px]">{children}</div>
    )}
  </div>
);

const MetricsStrip = ({ model }: { model: ModelResult }) => {
  const metrics = model.metrics || {};
  const cards = model.model_type === 'classification'
    ? [
        ['Accuracy', metrics.accuracy],
        ['Precision', metrics.precision],
        ['Recall', metrics.recall],
        ['F1 Score', metrics.f1_score],
        ['AUC', metrics.roc_auc],
      ]
    : [
        ['MAE', metrics.mae],
        ['RMSE', metrics.rmse],
        ['R² Score', metrics.r2_score],
      ];

  return (
    <div className={`grid gap-3 ${model.model_type === 'classification' ? 'md:grid-cols-5' : 'md:grid-cols-3'}`}>
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-neutral-800/70 bg-gradient-to-b from-neutral-900/60 to-neutral-950/60 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="text-xs uppercase tracking-wide text-neutral-400">{label}</div>
          <div className="mt-2 font-mono text-xl text-white">{formatMetric(value as number | null | undefined)}</div>
        </div>
      ))}
    </div>
  );
};

export const ModelAnalysis = () => {
  const { trainingResults, selectedModel, setSelectedModel } = useMLExperiment();

  const successfulModels = useMemo(
    () => (trainingResults?.base_models ?? []).filter((model) => model.status !== 'failed'),
    [trainingResults],
  );

  const modelData = useMemo(() => {
    if (!successfulModels.length) return null;
    return successfulModels.find((model) => model.model_name === selectedModel) ?? successfulModels[0];
  }, [selectedModel, successfulModels]);

  if (!trainingResults || !modelData) {
    return null;
  }

  const modelType = modelData.model_type;

  return (
    <div className="space-y-6 rounded-xl border border-neutral-800/70 bg-gradient-to-b from-neutral-900/80 to-neutral-950/80 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-shadow duration-300">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Model Analysis</h2>
          <p className="text-sm text-neutral-400">
            Detailed charts for <span className="text-white">{modelData.model_name}</span> ({modelType}).
          </p>
        </div>

        <select
          value={modelData.model_name}
          onChange={(event) => setSelectedModel(event.target.value)}
          className="rounded-lg border border-neutral-700 bg-neutral-800/60 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
        >
          {successfulModels.map((model) => (
            <option key={model.model_id} value={model.model_name}>
              {model.model_name}
            </option>
          ))}
        </select>
      </div>

      <MetricsStrip model={modelData} />

      <div className="grid gap-6 xl:grid-cols-2">
        {modelType === 'classification' ? (
          <>
            <ConfusionMatrixChart plots={modelData.plots} />
            <RocCurveChart plots={modelData.plots} />
            <FeatureImportanceChart featureImportance={modelData.feature_importance} />
            <PrecisionRecallChart plots={modelData.plots} />
            <ResidualPlotChart plots={modelData.plots} />
          </>
        ) : (
          <>
            <ActualVsPredictedChart plots={modelData.plots} />
            <ResidualPlotChart plots={modelData.plots} />
            <ErrorDistributionChart plots={modelData.plots} />
            <FeatureImportanceChart featureImportance={modelData.feature_importance} />
          </>
        )}
      </div>
    </div>
  );
};

const ConfusionMatrixChart = ({ plots }: { plots: ModelPlots }) => {
  const matrix = plots.confusion_matrix;
  const labels = matrix?.map((_, index) => `Class ${index}`) || [];
  const maxValue = matrix ? Math.max(...matrix.flat()) : 0;

  return (
    <ChartCard title="Confusion Matrix" subtitle="Heatmap of true vs predicted labels." isEmpty={!matrix?.length} emptyMessage="Confusion matrix data is missing.">
      <div className="flex h-full items-center justify-center overflow-auto">
        <table className="border-collapse text-center text-sm">
          <thead>
            <tr>
              <th className="p-2" />
              {labels.map((label, index) => (
                <th key={label + index} className="p-2 text-xs text-gray-400">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix?.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                <td className="p-2 text-xs text-gray-400">{labels[rowIndex]}</td>
                {row.map((value, columnIndex) => {
                  const intensity = maxValue ? value / maxValue : 0;
                  return (
                    <td
                      key={`cell-${rowIndex}-${columnIndex}`}
                      className="min-w-14 border border-gray-700 p-3 font-mono"
                      style={{ backgroundColor: `rgba(139, 92, 246, ${0.2 + intensity * 0.8})` }}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
};

const RocCurveChart = ({ plots }: { plots: ModelPlots }) => {
  const rocCurve = plots.roc_curve;
  const binaryCurve = rocCurve && !Array.isArray(rocCurve) && 'fpr' in rocCurve ? rocCurve : null;
  const multiClassCurves = rocCurve && !binaryCurve ? Object.entries(rocCurve) : [];
  const chartData = binaryCurve
    ? binaryCurve.fpr.map((fpr: number, index: number) => ({ x: fpr, y: binaryCurve.tpr[index] }))
    : [];

  return (
    <ChartCard title="ROC Curve" subtitle="Receiver operating characteristic across thresholds." isEmpty={!binaryCurve && multiClassCurves.length === 0} emptyMessage="ROC data is unavailable for this model.">
      {binaryCurve ? (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
            <XAxis dataKey="x" type="number" domain={[0, 1]} stroke="#9ca3af" />
            <YAxis dataKey="y" type="number" domain={[0, 1]} stroke="#9ca3af" />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => v.toFixed(4)} />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="#6b7280" strokeDasharray="4 4" />
            <Scatter data={chartData} fill="#8b5cf6" line={{ stroke: '#8b5cf6', strokeWidth: 2 }} name={`ROC (AUC ${formatMetric(binaryCurve.auc)})`} />
          </ScatterChart>
        </ResponsiveContainer>
      ) : (
        <div className="grid h-full gap-3 overflow-auto md:grid-cols-2">
          {multiClassCurves.map(([label, curve]: [string, any]) => (
            <div key={label} className="rounded-lg border border-gray-700 p-3">
              <div className="mb-1 text-sm text-white">{label}</div>
              <div className="text-xs text-gray-400">AUC: {formatMetric(curve.auc)}</div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
};

const FeatureImportanceChart = ({ featureImportance }: { featureImportance?: FeatureImportance | null }) => {
  const data = featureImportance?.features?.map((feature, index) => ({
    feature,
    importance: featureImportance.importances[index],
  })) || [];

  return (
    <ChartCard title="Feature Importance" subtitle="Top weighted features for this model." isEmpty={!data.length} emptyMessage="Feature importance is unavailable for this model.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ left: 30 }}>
          <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
          <XAxis type="number" stroke="#9ca3af" />
          <YAxis type="category" dataKey="feature" stroke="#9ca3af" width={120} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => value.toFixed(4)} />
          <Bar dataKey="importance" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

const ActualVsPredictedChart = ({ plots }: { plots: ModelPlots }) => {
  const data = plots.predicted_vs_actual?.actual.map((actual, index) => ({
    actual,
    predicted: plots.predicted_vs_actual?.predicted[index],
  })) || [];
  const values = data.flatMap((point) => [point.actual, point.predicted]).filter((value) => Number.isFinite(value));
  const domain = values.length ? [Math.min(...values), Math.max(...values)] : [0, 1];

  return (
    <ChartCard title="Actual vs Predicted" subtitle="Scatter should concentrate near the diagonal." isEmpty={!data.length} emptyMessage="Prediction points are unavailable for this model.">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
          <XAxis dataKey="actual" type="number" stroke="#9ca3af" domain={domain} />
          <YAxis dataKey="predicted" type="number" stroke="#9ca3af" domain={domain} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => value.toFixed(4)} />
          <ReferenceLine segment={[{ x: domain[0], y: domain[0] }, { x: domain[1], y: domain[1] }]} stroke="#6b7280" strokeDasharray="4 4" />
          <Scatter data={data} fill="#8b5cf6" />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

const ResidualPlotChart = ({ plots }: { plots: ModelPlots }) => {
  const residuals = plots.residuals;
  // Support both [{actual, predicted, residual}] (new) and legacy number[] format
  const data: { predicted: number; residual: number }[] = Array.isArray(residuals)
    ? (residuals as ResidualPoint[]).map((r) =>
        typeof r === 'object' && r !== null
          ? { predicted: r.predicted, residual: r.residual }
          : { predicted: 0, residual: r as unknown as number }
      )
    : [];

  return (
    <ChartCard
      title="Residual Plot"
      subtitle="Predicted value vs residual — should scatter around zero."
      isEmpty={!data.length}
      emptyMessage="Residual data is unavailable for this model."
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
          <XAxis dataKey="predicted" type="number" stroke="#9ca3af" name="Predicted" />
          <YAxis dataKey="residual" type="number" stroke="#9ca3af" name="Residual" />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => v.toFixed(4)} />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
          <Scatter data={data} fill="#8b5cf6" opacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

const PrecisionRecallChart = ({ plots }: { plots: ModelPlots }) => {
  const curve = plots.precision_recall_curve;
  const data = curve?.recall.map((r, i) => ({ x: r, y: curve.precision[i] })) ?? [];

  return (
    <ChartCard
      title="Precision-Recall Curve"
      subtitle="Higher area under curve indicates stronger positive-class ranking."
      isEmpty={!data.length}
      emptyMessage="Precision-recall data unavailable (multiclass or no probabilities)."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
          <XAxis dataKey="x" type="number" domain={[0, 1]} stroke="#9ca3af" label={{ value: 'Recall', position: 'insideBottom', offset: -2, fill: '#9ca3af', fontSize: 11 }} />
          <YAxis dataKey="y" type="number" domain={[0, 1]} stroke="#9ca3af" label={{ value: 'Precision', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => v.toFixed(4)} />
          <Line dataKey="y" stroke="#22c55e" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

const ErrorDistributionChart = ({ plots }: { plots: ModelPlots }) => {
  const data = plots.error_distribution ?? [];

  return (
    <ChartCard
      title="Error Distribution"
      subtitle="Histogram of absolute prediction errors."
      isEmpty={!data.length}
      emptyMessage="Error distribution data is unavailable for this model."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8 }}>
          <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke="#9ca3af" tick={{ fontSize: 10 }} tickFormatter={(v: number) => v.toFixed(2)} />
          <YAxis stroke="#9ca3af" />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => v} labelFormatter={(l: number) => `Error ≥ ${Number(l).toFixed(3)}`} />
          <Bar dataKey="count" fill="#f59e0b" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

const tooltipStyle = {
  backgroundColor: '#171717',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
};

const formatMetric = (value: number | null | undefined) => (
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(4) : 'N/A'
);
