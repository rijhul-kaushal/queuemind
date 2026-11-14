'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { GanttChart } from '@/components/scheduler/GanttChart';
import { MetricsComparisonCards } from '@/components/scheduler/MetricsComparisonCards';
import { EngineeringTradeoffAnalysis } from '@/components/scheduler/EngineeringTradeoffAnalysis';
import { SimulationLogsView } from '@/components/scheduler/SimulationLogsView';
import { AddSimulationJobModal } from '@/components/scheduler/AddSimulationJobModal';
import { WORKLOAD_SCENARIOS, WorkloadScenario } from '@/lib/scheduling/scenarios';
import { simulate, compareAlgorithms } from '@/lib/scheduling/simulator';
import { SimulationJobInput, SchedulingAlgorithm } from '@/lib/scheduling/types';
import {
  CpuIcon,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
  Layers,
  BookOpen,
} from 'lucide-react';

export default function SchedulerPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('burst-spike');
  const [workerCount, setWorkerCount] = useState<number>(2);
  const [activeAlgorithm, setActiveAlgorithm] = useState<SchedulingAlgorithm | 'COMPARE'>('COMPARE');
  const [workloadJobs, setWorkloadJobs] = useState<SimulationJobInput[]>(
    WORKLOAD_SCENARIOS[0].jobs
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Active scenario metadata
  const currentScenario = useMemo(
    () => WORKLOAD_SCENARIOS.find((s) => s.id === selectedScenarioId),
    [selectedScenarioId]
  );

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    const scen = WORKLOAD_SCENARIOS.find((s) => s.id === scenarioId);
    if (scen) {
      setWorkloadJobs([...scen.jobs]);
      setWorkerCount(scen.recommendedWorkers);
    }
  };

  const handleAddJob = (newJob: SimulationJobInput) => {
    setWorkloadJobs((prev) => [...prev, newJob]);
  };

  const handleRemoveJob = (id: string) => {
    setWorkloadJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const handleResetCurrentScenario = () => {
    if (currentScenario) {
      setWorkloadJobs([...currentScenario.jobs]);
      setWorkerCount(currentScenario.recommendedWorkers);
    }
  };

  // Run simulation calculations
  const comparison = useMemo(() => {
    return compareAlgorithms(
      workloadJobs,
      workerCount,
      currentScenario?.name || 'Custom Workload'
    );
  }, [workloadJobs, workerCount, currentScenario]);

  const fifoResult = comparison.fifo;
  const priorityResult = comparison.priority;

  return (
    <AppShell>
      <Header
        title="Scheduling Intelligence & Simulator"
        subtitle="Multi-worker discrete-event simulation engine comparing FIFO vs Priority algorithms"
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Scenario and Controls Bar */}
        <Card className="p-5 border-slate-800 bg-[#0e1424]">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Simulation Workload & Fleet Parameters
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select predefined real-world scenarios or construct a custom distributed job stream
                </p>
              </div>

              {/* Mode switch */}
              <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActiveAlgorithm('COMPARE')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeAlgorithm === 'COMPARE'
                      ? 'bg-indigo-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Side-by-Side Comparison
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAlgorithm('FIFO')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeAlgorithm === 'FIFO'
                      ? 'bg-indigo-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  FIFO Only
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAlgorithm('PRIORITY')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeAlgorithm === 'PRIORITY'
                      ? 'bg-indigo-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Priority Only
                </button>
              </div>
            </div>

            {/* Scenario Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {WORKLOAD_SCENARIOS.map((scen) => {
                const isSelected = scen.id === selectedScenarioId;
                return (
                  <button
                    key={scen.id}
                    onClick={() => handleScenarioChange(scen.id)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md shadow-indigo-950/30'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200">{scen.name}</span>
                      <span className="text-[10px] font-mono text-indigo-400">
                        {scen.recommendedWorkers}w
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {scen.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Workers count slider & Action controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Worker Instances:</span>
                  <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                    {[1, 2, 3, 4, 6, 8].map((num) => (
                      <button
                        key={num}
                        onClick={() => setWorkerCount(num)}
                        className={`w-7 h-7 rounded text-xs font-mono font-bold transition-all ${
                          workerCount === num
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                  {workloadJobs.length} jobs in workload queue
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetCurrentScenario}
                  className="text-xs gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Workload
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  className="text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom Job
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Workload Jobs Preview Strip */}
        <Card className="p-4 border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Active Workload Queue (Arrival Times &amp; Durations)
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Deterministic Input Vector
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {workloadJobs.map((job) => (
              <div
                key={job.id}
                className="shrink-0 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono min-w-[150px] relative group"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold text-slate-200 truncate">{job.name}</span>
                  <button
                    onClick={() => handleRemoveJob(job.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity"
                    title="Remove job"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>arr: {job.arrivalTime}s</span>
                  <span>dur: {job.duration}s</span>
                </div>
                <div className="mt-1">
                  <Badge priority={job.priority} className="text-[9px] px-1.5 py-0" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Side-by-Side Metrics Cards */}
        <div>
          <MetricsComparisonCards comparison={comparison} />
        </div>

        {/* Gantt Timelines */}
        <div className="space-y-6">
          {(activeAlgorithm === 'COMPARE' || activeAlgorithm === 'PRIORITY') && (
            <GanttChart
              algorithm="PRIORITY"
              workerCount={workerCount}
              scheduledJobs={priorityResult.scheduledJobs}
              timelineLength={priorityResult.timelineLength}
            />
          )}

          {(activeAlgorithm === 'COMPARE' || activeAlgorithm === 'FIFO') && (
            <GanttChart
              algorithm="FIFO"
              workerCount={workerCount}
              scheduledJobs={fifoResult.scheduledJobs}
              timelineLength={fifoResult.timelineLength}
            />
          )}
        </div>

        {/* Engineering Trade-off Analysis */}
        <EngineeringTradeoffAnalysis tradeoffPoints={comparison.tradeoffAnalysis} />

        {/* Discrete-Event Simulation Event Logs */}
        <SimulationLogsView
          logs={activeAlgorithm === 'FIFO' ? fifoResult.logs : priorityResult.logs}
        />
      </div>

      <AddSimulationJobModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddJob}
        nextIndex={workloadJobs.length + 1}
      />
    </AppShell>
  );
}
