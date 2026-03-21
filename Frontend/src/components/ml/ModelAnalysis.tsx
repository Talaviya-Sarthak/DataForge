import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useMLExperiment } from '../../contexts/MLExperimentContext';
import type { FeatureImportance, LearningCurveData, ModelPlots, ModelResult } from '../../services/training.service';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

const COLORS = ['#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#f97316'];

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
  <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4">
    <div className="mb-4">
      <h3 className="text-lg font-medium text-white">{title}</h3>
      {subtitle ? <p className="text-xs text-gray-400">{subtitle}</p> : null}
    </div>
    {isEmpty ? (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-400">
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
        <div key={label} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
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
    <div className="space-y-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Model Results</h2>
          <p className="text-sm text-gray-400">
            Rendering {modelType} charts only for <span className="text-white">{modelData.model_name}</span>.
          </p>
        </div>

        <select
          value={modelData.model_name}
          onChange={(event) => setSelectedModel(event.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            <PrecisionRecallChart plots={modelData.plots} />
            <FeatureImportanceChart featureImportance={modelData.feature_importance} />
          </>
        ) : (
          <>
            <ActualVsPredictedChart plots={modelData.plots} />
            <FeatureImportanceChart featureImportance={modelData.feature_importance} />
          </>
        )}
      </div>
    </div>
  );
};

const ConfusionMatrixChart = ({ plots }: { plots: ModelPlots }) => {
  const matrix = plots.confusion_matrix;
  const labels = plots.class_labels || matrix?.map((_, index) => `Class ${index}`) || [];
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
    ? binaryCurve.fpr.map((fpr, index) => ({ x: fpr, y: binaryCurve.tpr[index] }))
    : [];

  return (
    <ChartCard title="ROC Curve" subtitle="Receiver operating characteristic across thresholds." isEmpty={!binaryCurve && multiClassCurves.length === 0} emptyMessage="ROC data is unavailable for this model.">
      {binaryCurve ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
            <XAxis dataKey="x" type="number" domain={[0, 1]} stroke="#9ca3af" />
            <YAxis dataKey="y" type="number" domain={[0, 1]} stroke="#9ca3af" />
            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => value.toFixed(4)} />
            <Line data={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} dataKey="y" stroke="#6b7280" dot={false} strokeDasharray="5 5" />
            <Line dataKey="y" stroke="#8b5cf6" dot={false} strokeWidth={2} name={`ROC (${formatMetric(binaryCurve.auc)})`} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="grid h-full gap-3 overflow-auto md:grid-cols-2">
          {multiClassCurves.map(([label, curve], index) => (
            <div key={label} className="rounded-lg border border-gray-700 p-3">
              <div className="mb-2 text-sm text-white">{label}</div>
              <div className="text-xs text-gray-400">AUC: {formatMetric(curve.auc)}</div>
              <div className="mt-3 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={curve.fpr.map((fpr, pointIndex) => ({ x: fpr, y: curve.tpr[pointIndex] }))}>
                    <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                    <XAxis dataKey="x" type="number" domain={[0, 1]} stroke="#9ca3af" hide />
                    <YAxis dataKey="y" type="number" domain={[0, 1]} stroke="#9ca3af" hide />
                    <Line dataKey="y" stroke={COLORS[index % COLORS.length]} dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
};

const PrecisionRecallChart = ({ plots }: { plots: ModelPlots }) => {
  const curve = plots.precision_recall_curve;
  const chartData = curve?.recall.map((recall, index) => ({ x: recall, y: curve.precision[index] })) || [];

  return (
    <ChartCard title="Precision-Recall Curve" subtitle="Higher curves indicate stronger positive-class ranking." isEmpty={!chartData.length} emptyMessage="Precision-recall data is unavailable for this model.">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
          <XAxis dataKey="x" type="number" domain={[0, 1]} stroke="#9ca3af" />
          <YAxis dataKey="y" type="number" domain={[0, 1]} stroke="#9ca3af" />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => value.toFixed(4)} />
          <Line dataKey="y" stroke="#22c55e" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

const ClassDistributionChart = ({ plots }: { plots: ModelPlots }) => {
  const distribution = plots.class_distribution;
  const data = distribution?.labels.map((label, index) => ({
    label,
    count: distribution.counts[index],
  })) || [];

  return (
    <ChartCard title="Class Distribution" subtitle="Observed class counts for the trained dataset slice." isEmpty={!data.length} emptyMessage="Class distribution data is missing.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

const LearningCurveChart = ({
  learningCurve,
  modelType,
}: {
  learningCurve?: LearningCurveData;
  modelType: ModelResult['model_type'];
}) => {
  const trainScore = learningCurve?.train_score || learningCurve?.train_scores || [];
  const validationScore = learningCurve?.validation_score || learningCurve?.validation_scores || [];
  const trainLoss = learningCurve?.train_loss || [];
  const validationLoss = learningCurve?.validation_loss || [];
  const data = learningCurve?.train_sizes.map((size, index) => ({
    size,
    trainScore: trainScore[index],
    validationScore: validationScore[index],
    trainLoss: trainLoss[index],
    validationLoss: validationLoss[index],
  })) || [];

  return (
    <ChartCard
      title="Learning Curve"
      subtitle={modelType === 'classification' ? 'Accuracy and derived loss across increasing train sizes.' : 'Train vs validation fit across increasing train sizes.'}
      isEmpty={!data.length}
      emptyMessage="Learning curve data is unavailable for this model."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
          <XAxis dataKey="size" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => value?.toFixed?.(4) ?? value} />
          <Line dataKey="trainScore" stroke="#8b5cf6" dot={false} strokeWidth={2} name="Train Score" />
          <Line dataKey="validationScore" stroke="#22c55e" dot={false} strokeWidth={2} name="Validation Score" />
          {modelType === 'classification' ? (
            <>
              <Line dataKey="trainLoss" stroke="#f59e0b" dot={false} strokeDasharray="4 4" name="Train Loss" />
              <Line dataKey="validationLoss" stroke="#ef4444" dot={false} strokeDasharray="4 4" name="Validation Loss" />
            </>
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

const FeatureImportanceChart = ({ featureImportance }: { featureImportance?: FeatureImportance | null }) => {
  const data = featureImportance?.features.map((feature, index) => ({
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
  const data = plots.residuals?.map((residual, index) => ({ index, residual })) || [];

  return (
    <ChartCard title="Residual Plot" subtitle="Residuals should be centered around zero." isEmpty={!data.length} emptyMessage="Residual values are unavailable for this model.">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
          <XAxis dataKey="index" stroke="#9ca3af" />
          <YAxis dataKey="residual" stroke="#9ca3af" />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => value.toFixed(4)} />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
          <Scatter data={data} fill="#22c55e" />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

const ErrorDistributionChart = ({ plots }: { plots: ModelPlots }) => {
  const errors = plots.error_distribution || [];
  const data = buildHistogram(errors, 18);

  return (
    <ChartCard title="Error Distribution" subtitle="Histogram of absolute errors." isEmpty={!data.length} emptyMessage="Error distribution data is unavailable for this model.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

const FeatureVsTargetChart = ({ plots }: { plots: ModelPlots }) => {
  const data = plots.feature_vs_target?.feature_values.map((featureValue, index) => ({
    featureValue,
    targetValue: plots.feature_vs_target?.target_values[index],
  })) || [];

  return (
    <ChartCard
      title="Feature vs Target"
      subtitle={plots.feature_vs_target?.feature_name ? `Using ${plots.feature_vs_target.feature_name}.` : 'Strongest numeric feature against the target.'}
      isEmpty={!data.length}
      emptyMessage="Feature-vs-target data is unavailable for this model."
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
          <XAxis dataKey="featureValue" type="number" stroke="#9ca3af" />
          <YAxis dataKey="targetValue" type="number" stroke="#9ca3af" />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => value.toFixed(4)} />
          <Scatter data={data} fill="#06b6d4" />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

const ResidualVsPredictedChart = ({ plots }: { plots: ModelPlots }) => {
  const data = plots.residual_vs_predicted?.predicted.map((predicted, index) => ({
    predicted,
    residual: plots.residual_vs_predicted?.residuals[index],
  })) || [];

  return (
    <ChartCard title="Residual vs Predicted" subtitle="Useful for spotting heteroscedasticity and bias." isEmpty={!data.length} emptyMessage="Residual-vs-predicted data is unavailable for this model.">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
          <XAxis dataKey="predicted" type="number" stroke="#9ca3af" />
          <YAxis dataKey="residual" type="number" stroke="#9ca3af" />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => value.toFixed(4)} />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
          <Scatter data={data} fill="#8b5cf6" />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

const tooltipStyle = {
  backgroundColor: '#111827',
  border: '1px solid #374151',
  borderRadius: '8px',
};

const buildHistogram = (values: number[], bins: number) => {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return [{ label: min.toFixed(2), count: values.length }];
  }

  const width = (max - min) / bins;
  const counts = Array.from({ length: bins }, () => 0);

  values.forEach((value) => {
    const index = Math.min(Math.floor((value - min) / width), bins - 1);
    counts[index] += 1;
  });

  return counts.map((count, index) => ({
    label: `${(min + width * index).toFixed(2)}`,
    count,
  }));
};

const formatMetric = (value: number | null | undefined) => (
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(4) : 'N/A'
);
