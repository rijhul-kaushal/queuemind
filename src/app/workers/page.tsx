'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Header } from '@/components/layout/Header';
import { WorkerCard } from '@/components/workers/WorkerCard';
import { WorkloadBarChart } from '@/components/workers/WorkloadBarChart';
import { workerService } from '@/lib/services/workerService';
import { Worker } from '@/types/worker';
import { Cpu, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await workerService.getWorkers();
      setWorkers(data);
    } catch (err) {
      console.error('Failed to load workers', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleToggleStatus = async (id: string) => {
    await workerService.toggleWorkerStatus(id);
    await fetchWorkers();
  };

  const handleCapacityChange = async (id: string, concurrency: number) => {
    await workerService.updateCapacity(id, concurrency);
    await fetchWorkers();
  };

  const activeCount = workers.filter((w) => w.status === 'BUSY' || w.status === 'IDLE').length;
  const totalCapacity = workers.reduce((acc, w) => acc + (w.status !== 'OFFLINE' ? w.concurrency : 0), 0);
  const avgCpu = workers.length > 0
    ? (workers.reduce((acc, w) => acc + w.cpuUtilization, 0) / workers.length).toFixed(1)
    : '0.0';

  return (
    <AppShell>
      <Header
        title="Worker Fleet Monitor"
        subtitle="Inspect simulated distributed worker processes, health metrics, and concurrency limits"
        onDataReset={fetchWorkers}
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Phase 1 Architecture Banner */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-indigo-400 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Simulated Fleet Telemetry (Phase 1):</span>
            <span className="text-slate-300">
              Worker state and heartbeats are simulated in-browser. In Phase 2, this will consume real process telemetry via FastAPI & Redis worker heartbeats.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWorkers}
            className="text-xs font-mono gap-1.5 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            Refresh Heartbeats
          </Button>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-mono">Active Nodes</span>
            <div className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              {activeCount} / {workers.length}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Processes Online</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-mono">Aggregate Concurrency</span>
            <div className="text-2xl font-bold font-mono text-indigo-400">
              {totalCapacity} slots
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Parallel Execution Capacity</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-mono">Mean Fleet CPU</span>
            <div className="text-2xl font-bold font-mono text-slate-100">
              {avgCpu}%
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Core Load Balance</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-mono">Total Completed Tasks</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {workers.reduce((acc, w) => acc + w.completedJobsCount, 0).toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Across All Worker Nodes</span>
          </div>
        </div>

        {/* Workload Execution Chart */}
        <WorkloadBarChart workers={workers} />

        {/* Workers Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Worker Process Instances
            </h3>
            <span className="text-xs font-mono text-slate-500">{workers.length} registered nodes</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workers.map((worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                onToggleStatus={handleToggleStatus}
                onCapacityChange={handleCapacityChange}
              />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
