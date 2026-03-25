import { Suspense, lazy, useMemo, useState } from 'react';
import { useMLExperiment } from '../../contexts/MLExperimentContext';

type TabType = 'results' | 'comparison' | 'management';

const ModelAnalysis = lazy(() => import('./ModelAnalysis').then((module) => ({ default: module.ModelAnalysis })));
const ModelComparison = lazy(() => import('./ModelAnalysis').then((module) => ({ default: module.ModelAnalysis })));
const ModelManagement = lazy(() => import('./ModelManagement').then((module) => ({ default: module.ModelManagement })));

const TabSkeleton = () => (
  <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
    <div className="h-6 w-40 animate-pulse rounded bg-gray-800" />
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <div className="h-64 animate-pulse rounded-lg bg-gray-800/70" />
      <div className="h-64 animate-pulse rounded-lg bg-gray-800/70" />
    </div>
  </div>
);

export const MLDashboard = () => {
  const { trainingResults } = useMLExperiment();
  const [activeTab, setActiveTab] = useState<TabType>('results');

  const modelCount = useMemo(
    () => trainingResults?.base_models?.length ?? 0,
    [trainingResults],
  );

  if (!trainingResults) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-gray-400">No training results available.</div>
      </div>
    );
  }

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'results', label: 'Model Results' },
    { id: 'comparison', label: 'Comparison' },
    { id: 'management', label: 'Model Management' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800/60 text-gray-300 hover:bg-gray-800'
              }`}
            >
              {tab.label}
              {tab.id === 'results' && modelCount > 0 && (
                <span className="ml-2 rounded-full bg-black/20 px-2 py-0.5 text-xs">
                  {String(modelCount)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <Suspense fallback={<TabSkeleton />}>
        {activeTab === 'results' ? <ModelAnalysis /> : null}
        {activeTab === 'comparison' ? <ModelComparison /> : null}
        {activeTab === 'management' ? <ModelManagement /> : null}
      </Suspense>
    </div>
  );
};
