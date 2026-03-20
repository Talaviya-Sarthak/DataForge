import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { BarChart3, TrendingUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter } from "recharts";
import Header from "@/components/layouts/Header";
import { Footer } from "@/components/layouts/Footer";

interface TrainedModel {
  id: number;
  model: string;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  roc_auc?: number;
  r2_score?: number;
  mse?: number;
  rmse?: number;
  mae?: number;
  training_time_ms?: number;
  rank: number;
  task_type: string;
}

// HARD LOCK - Global guard outside component to prevent race conditions
let trainingLock = false;
let lastTrainingCall = 0;

export default function Models() {
  const [searchParams] = useSearchParams();
  const pipelineId = searchParams.get("pipelineId");
  const startTraining = searchParams.get("startTraining") === "true";
  const [models, setModels] = useState<TrainedModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<TrainedModel | null>(null);
  const [taskType, setTaskType] = useState<string>("");
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
  const [isTraining, setIsTraining] = useState(false);

  // Training configuration dialog state
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [selectedTaskType, setSelectedTaskType] = useState<string>("");
  const [columns, setColumns] = useState<string[]>([]);

  // SINGLE useEffect - only for initial load
  useEffect(() => {
    if (!pipelineId) return;

    // Fetch pipeline info to get columns
    fetchPipelineInfo();

    // If startTraining flag is set, open dialog instead of auto-training
    if (startTraining && !trainingLock) {
      console.log('🎯 Initial training trigger from URL parameter');
      setIsConfigDialogOpen(true);
    } else if (!startTraining) {
      // Only fetch existing results if NOT training
      console.log('📊 Fetching existing results');
      setLoading(true);
      fetchModels();
    }
  }, []); // Empty deps - run ONCE on mount

  const addLog = (message: string) => {
    setTrainingLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const fetchPipelineInfo = async () => {
    if (!pipelineId) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/training/${pipelineId}/info`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setColumns(data.columns || []);
        console.log('✅ Pipeline columns loaded:', data.columns);
      }
    } catch (error) {
      console.error("❌ Failed to fetch pipeline info:", error);
    }
  };

  const handleOpenConfigDialog = () => {
    setIsConfigDialogOpen(true);
    // Reset selections
    setTargetColumn("");
    setSelectedTaskType("");
  };

  const handleTrainSubmit = async () => {
    if (!targetColumn || !selectedTaskType) return;

    // Close dialog
    setIsConfigDialogOpen(false);

    // Start training with selected configuration
    await startModelTraining({
      pipeline_id: pipelineId,
      target_column: targetColumn,
      task_type: selectedTaskType
    });
  };

  const startModelTraining = async (config?: { pipeline_id: string | null, target_column: string, task_type: string }) => {
    // HARD LOCK - Prevent ANY duplicate calls
    const now = Date.now();
    if (trainingLock) {
      console.log('❌ BLOCKED: Training already in progress (hard lock active)');
      return;
    }

    // Debounce - prevent rapid clicks
    if (now - lastTrainingCall < 3000) {
      console.log('❌ BLOCKED: Too soon since last call (debounce)');
      return;
    }

    console.log('\n🚀 ========== TRAIN API CALLED ==========');
    console.log('🕒 Timestamp:', new Date().toISOString());
    console.log('📊 Pipeline ID:', pipelineId);

    // Activate locks
    trainingLock = true;
    lastTrainingCall = now;
    setIsTraining(true);
    setLoading(true);
    setTrainingLogs([]);

    // CRITICAL: Clear old models to prevent showing stale data
    setModels([]);
    setTaskType("");

    addLog("🚀 Initializing training pipeline...");
    addLog("📊 Loading finalized dataset...");

    await new Promise(resolve => setTimeout(resolve, 1000));
    addLog("✅ Dataset loaded successfully");
    addLog("🔍 Analyzing data characteristics...");

    await new Promise(resolve => setTimeout(resolve, 800));
    addLog("📈 Detected task type: Auto-detecting from data");
    addLog("🎯 Preparing feature matrix...");

    await new Promise(resolve => setTimeout(resolve, 1000));
    addLog("✅ Feature engineering completed");
    addLog("🤖 Starting model training from registry...");
    addLog("");

    try {
      const token = localStorage.getItem("token");

      // Simulate training multiple models
      const modelNames = [
        "Logistic Regression",
        "Random Forest",
        "XGBoost",
        "Support Vector Machine",
        "Gradient Boosting",
        "Decision Tree"
      ];

      for (let i = 0; i < modelNames.length; i++) {
        addLog(`📦 Training ${modelNames[i]}...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        addLog(`✅ ${modelNames[i]} completed`);
        addLog("");
      }

      addLog("🔧 Performing hyperparameter tuning...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      addLog("✅ Hyperparameter tuning completed");
      addLog("");
      addLog("📊 Evaluating model performance...");

      console.log('📡 Making API request to /api/training/train');

      // Make actual API call with configuration
      const requestBody = config ? {
        pipeline_id: config.pipeline_id,
        target_column: config.target_column,
        task_type: config.task_type
      } : {
        pipeline_id: pipelineId
      };

      console.log('📦 Request payload:', requestBody);

      const response = await fetch(`http://localhost:5000/api/training/train`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
        body: JSON.stringify(requestBody),
        cache: "no-store"
      });

      console.log('📡 Training API Response Status:', response.status);

      // Handle 429 Too Many Requests
      if (response.status === 429) {
        console.error('❌ 429 Too Many Requests');
        addLog("❌ Too many requests. Please wait 30 seconds and try again.");
        throw new Error("Too many requests. Please wait before trying again.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Training request failed' }));
        console.error('❌ Training API Error:', errorData);
        throw new Error(errorData.detail || errorData.message || errorData.error || `Training failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Training API Response:', data);

      if (data.status === "success") {
        addLog("✅ All models trained successfully!");
        addLog("📊 Generating leaderboard...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        addLog("🎉 Training completed! Loading results...");

        // Use leaderboard if available, otherwise use base_models
        const modelsToSet = data.leaderboard || data.base_models || [];
        console.log('✅ Setting', modelsToSet.length, 'models');

        setModels(modelsToSet);
        setTaskType(data.task_type);

        // Wait a bit before hiding training UI
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log('✅ ========== TRAINING COMPLETE ==========\n');
      } else {
        throw new Error(data.message || "Training failed");
      }
    } catch (error: any) {
      console.error('❌ Training error:', error);
      addLog(`❌ Error: ${error.message}`);

      // Don't try to fetch if it's a rate limit error
      if (!error.message.includes('Too many requests')) {
        addLog("⚠️ Attempting to fetch existing results...");

        try {
          await new Promise(resolve => setTimeout(resolve, 2000));
          await fetchModels();

          if (models.length > 0) {
            addLog("✅ Results loaded successfully!");
          } else {
            addLog("❌ No results found.");
          }
        } catch (fetchError) {
          addLog("❌ Failed to fetch results.");
        }
      }
    } finally {
      setIsTraining(false);
      setLoading(false);

      // Release lock after cooldown period
      setTimeout(() => {
        trainingLock = false;
        console.log('🔓 Training lock released');
      }, 5000);
    }
  };

  const fetchModels = async () => {
    if (!pipelineId) return;

    console.log('🔍 Fetching models for pipelineId:', pipelineId);

    try {
      const token = localStorage.getItem("token");
      const timestamp = new Date().getTime();
      const response = await fetch(`http://localhost:5000/api/training/${pipelineId}/results?t=${timestamp}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
        cache: "no-store"
      });

      console.log('📡 Fetch results status:', response.status);
      const data = await response.json();

      console.log('📦 Raw response data:', data);

      if (data.status === "success") {
        console.log('✅ Loaded', data.leaderboard?.length || 0, 'models');
        console.log('📊 Models data:', data.leaderboard);
        setModels(data.leaderboard || []);
        setTaskType(data.task_type);
      } else {
        console.log('⚠️ No models found');
        setModels([]);
      }
    } catch (error) {
      console.error("❌ Failed to fetch models:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedModels = useMemo(() => {
    console.log('🔄 Sorting models. Total models:', models.length);
    console.log('📋 Models data:', models);
    return [...models].sort((a, b) => {
      const metricA = taskType === "classification" ? (a.accuracy ?? 0) : (a.r2_score ?? 0);
      const metricB = taskType === "classification" ? (b.accuracy ?? 0) : (b.r2_score ?? 0);
      return metricB - metricA;
    });
  }, [models, taskType]);

  const top3Models = sortedModels.slice(0, 3);

  const stackedData = top3Models.map(m => ({
    name: m.model,
    accuracy: m.accuracy ?? 0,
    precision: m.precision ?? 0,
    recall: m.recall ?? 0,
    f1_score: m.f1_score ?? 0
  }));

  const accuracyData = top3Models.map(m => ({
    name: m.model,
    value: taskType === "classification" ? (m.accuracy ?? 0) : (m.r2_score ?? 0)
  }));

  if (loading || isTraining) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="text-white p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 bg-linear-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              {isTraining ? "Training Models..." : "Loading Models..."}
            </h1>

            {isTraining && (
              <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <div>
                    <h2 className="text-xl font-semibold">Training in Progress</h2>
                    <p className="text-sm text-zinc-400">Training all models from registry...</p>
                  </div>
                </div>

                {/* Training Logs */}
                <div className="bg-black rounded-lg p-4 font-mono text-sm max-h-125 overflow-y-auto">
                  {trainingLogs.map((log, idx) => (
                    <div key={idx} className="text-green-400 mb-1">
                      {log}
                    </div>
                  ))}
                  {trainingLogs.length > 0 && (
                    <div className="text-green-400 animate-pulse">▊</div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="w-full bg-zinc-800 rounded-full h-3">
                    <div
                      className="bg-linear-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((trainingLogs.length / 20) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-2 text-center">
                    {trainingLogs.length} / ~20 steps completed
                  </p>
                </div>
              </div>
            )}

            {!isTraining && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-neutral-400">Loading models...</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-linear-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Model Leaderboard
          </h1>

          {/* Train Models Button */}
          <div className="mb-6">
            <Button
              onClick={handleOpenConfigDialog}
              disabled={isTraining || !pipelineId}
              className="bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              🤖 Train Models
            </Button>
          </div>

          {/* Table Section */}
          {sortedModels.length === 0 ? (
            <div className="bg-zinc-900 rounded-lg p-12 text-center mb-12">
              <div className="text-zinc-500 mb-4">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-zinc-400 mb-2">No Models Found</h3>
                <p className="text-sm">No trained models available for this pipeline.</p>
                <p className="text-sm mt-2">Train models first to see the leaderboard.</p>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 rounded-lg overflow-hidden mb-12">
              <table className="w-full">
                <thead className="bg-zinc-800">
                  <tr>
                    <th className="px-6 py-4 text-left">Rank</th>
                    <th className="px-6 py-4 text-left">Model Name</th>
                    {taskType === "classification" ? (
                      <>
                        <th className="px-6 py-4 text-right">Accuracy</th>
                        <th className="px-6 py-4 text-right">Precision</th>
                        <th className="px-6 py-4 text-right">Recall</th>
                        <th className="px-6 py-4 text-right">F1 Score</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-4 text-right">R² Score</th>
                        <th className="px-6 py-4 text-right">MSE</th>
                        <th className="px-6 py-4 text-right">RMSE</th>
                        <th className="px-6 py-4 text-right">MAE</th>
                      </>
                    )}
                    <th className="px-6 py-4 text-right">Training Time (s)</th>
                    <th className="px-6 py-4 text-center">Visualization</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedModels.map((model, idx) => (
                    <tr
                      key={`${model.model}-${idx}-${model.rank || idx}`}
                      className={`border-t border-zinc-800 hover:bg-zinc-800/50 ${idx < 3 ? "bg-blue-900/20" : ""}`}
                    >
                      <td className="px-6 py-4">
                        {idx < 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-linear-to-r from-yellow-400 to-orange-500 text-black">
                            #{idx + 1}
                          </span>
                        )}
                        {idx >= 3 && <span className="text-zinc-500">#{idx + 1}</span>}
                      </td>
                      <td className="px-6 py-4 font-medium">{model.model}</td>
                      {taskType === "classification" ? (
                        <>
                          <td className="px-6 py-4 text-right">{model.accuracy?.toFixed(2) ?? "N/A"}</td>
                          <td className="px-6 py-4 text-right">{model.precision?.toFixed(2) ?? "N/A"}</td>
                          <td className="px-6 py-4 text-right">{model.recall?.toFixed(2) ?? "N/A"}</td>
                          <td className="px-6 py-4 text-right">{model.f1_score?.toFixed(2) ?? "N/A"}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-right">{model.r2_score?.toFixed(2) ?? "N/A"}</td>
                          <td className="px-6 py-4 text-right">{model.mse?.toFixed(2) ?? "N/A"}</td>
                          <td className="px-6 py-4 text-right">{model.rmse?.toFixed(2) ?? "N/A"}</td>
                          <td className="px-6 py-4 text-right">{model.mae?.toFixed(2) ?? "N/A"}</td>
                        </>
                      )}
                      <td className="px-6 py-4 text-right">
                        {model.training_time_ms ? (model.training_time_ms / 1000).toFixed(2) : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedModel(model)}
                          className="hover:bg-blue-600/20"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Top 3 Visualizations */}
          {top3Models.length > 0 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-blue-400" />
                Top 3 Models Analysis
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Stacked Bar Chart */}
                {taskType === "classification" && (
                  <div className="rounded-lg border border-zinc-800 bg-black/90 p-6">
                    <h3 className="mb-4 text-lg font-medium">Metrics Comparison</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stackedData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.16)" />
                        <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fontSize: 11, fontWeight: 400 }} />
                        <YAxis stroke="#cbd5e1" tick={{ fontSize: 11, fontWeight: 400 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#111111", border: "1px solid rgba(148, 163, 184, 0.28)", borderRadius: "10px" }}
                          itemStyle={{ color: "#e2e8f0", fontWeight: 400 }}
                          labelStyle={{ color: "#cbd5e1", fontWeight: 400 }}
                        />
                        <Legend verticalAlign="bottom" align="center" wrapperStyle={{ color: "#cbd5e1", fontSize: "12px", fontWeight: 400, paddingTop: "8px" }} />
                        <Bar dataKey="accuracy" stackId="a" fill="#8884d8" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="precision" stackId="a" fill="#82ca9d" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="recall" stackId="a" fill="#7dd3fc" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="f1_score" stackId="a" fill="#fbbf24" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Horizontal Bar Chart */}
                <div className="rounded-lg border border-zinc-800 bg-black/90 p-6">
                  <h3 className="mb-4 text-lg font-medium">
                    {taskType === "classification" ? "Accuracy" : "R² Score"} Comparison
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={accuracyData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.16)" />
                      <XAxis type="number" stroke="#cbd5e1" tick={{ fontSize: 11, fontWeight: 400 }} />
                      <YAxis dataKey="name" type="category" stroke="#cbd5e1" width={100} tick={{ fontSize: 11, fontWeight: 400 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#111111", border: "1px solid rgba(148, 163, 184, 0.28)", borderRadius: "10px" }}
                        itemStyle={{ color: "#e2e8f0", fontWeight: 400 }}
                        labelStyle={{ color: "#cbd5e1", fontWeight: 400 }}
                      />
                      <Bar dataKey="value" fill="#8884d8" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* ROC-AUC Placeholder */}
                {taskType === "classification" && (
                  <div className="bg-zinc-900 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">ROC-AUC Curve</h3>
                    <div className="h-75 flex items-center justify-center text-zinc-500">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>ROC curve data not available</p>
                        <p className="text-sm">Requires detailed prediction probabilities</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Model Detail Dialog */}
          <Dialog open={!!selectedModel} onOpenChange={() => setSelectedModel(null)}>
            <DialogContent className="max-w-5xl border-zinc-800 bg-zinc-950 text-zinc-100">
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedModel?.model} - Detailed Analysis</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 mt-4">
                {/* Confusion Matrix Placeholder */}
                {taskType === "classification" && (
                  <div className="bg-zinc-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Confusion Matrix</h4>
                    <div className="h-50 flex items-center justify-center text-zinc-500">
                      Not Available for this model
                    </div>
                  </div>
                )}

                {/* Learning Curve Placeholder */}
                <div className="bg-zinc-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Learning Curve</h4>
                  <div className="h-50 flex items-center justify-center text-zinc-500">
                    Not Available for this model
                  </div>
                </div>

                {/* Residual Plot Placeholder */}
                {taskType === "regression" && (
                  <div className="bg-zinc-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Residual Plot</h4>
                    <div className="h-50 flex items-center justify-center text-zinc-500">
                      Not Available for this model
                    </div>
                  </div>
                )}

                {/* Predicted vs Actual Placeholder */}
                <div className="bg-zinc-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Predicted vs Actual</h4>
                  <div className="h-50 flex items-center justify-center text-zinc-500">
                    Not Available for this model
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Training Configuration Dialog */}
          <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
            <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
              <DialogHeader>
                <DialogTitle className="text-2xl">Select Training Configuration</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Choose the target column you want to predict and the type of machine learning task.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Target Column Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">
                    Target Column
                  </label>
                  <Select value={targetColumn} onValueChange={setTargetColumn}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Select target column" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                      {columns.map(col => (
                        <SelectItem key={col} value={col} className="hover:bg-zinc-700">
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-zinc-500">
                    Select the column you want to predict
                  </p>
                </div>

                {/* Task Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">
                    Task Type
                  </label>
                  <Select value={selectedTaskType} onValueChange={setSelectedTaskType}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectItem value="classification" className="hover:bg-zinc-700">
                        🎯 Classification
                      </SelectItem>
                      <SelectItem value="regression" className="hover:bg-zinc-700">
                        📈 Regression
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-zinc-500 space-y-1">
                    <p><strong>Classification:</strong> Predict categories (e.g., Yes/No, 0/1, High/Medium/Low)</p>
                    <p><strong>Regression:</strong> Predict continuous numbers (e.g., price, temperature, age)</p>
                    <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded">
                      <p className="text-yellow-400 font-medium">⚠️ Important:</p>
                      <p className="text-yellow-300">If your target has only 2-10 unique values (like 0/1, True/False), use <strong>Classification</strong>.</p>
                      <p className="text-yellow-300">If your target has many different numbers (like 1.5, 2.7, 3.9), use <strong>Regression</strong>.</p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setIsConfigDialogOpen(false)}
                    variant="outline"
                    className="flex-1 border-zinc-700 hover:bg-zinc-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleTrainSubmit}
                    disabled={!targetColumn || !selectedTaskType}
                    className="flex-1 border border-zinc-700 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start Training
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Footer />
    </div>
  );
}
