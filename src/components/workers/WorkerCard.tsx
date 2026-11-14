'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Worker } from '@/types/worker';
import { Cpu, Server, Activity, Power, Layers, HardDrive } from 'lucide-react';

interface WorkerCardProps {
  worker: Worker;
  onToggleStatus: (id: string) => Promise<void>;
  onCapacityChange: (id: string, concurrency: number) => Promise<void>;
}

export function WorkerCard({ worker, onToggleStatus, onCapacityChange }: WorkerCardProps) {
  const isOnline = worker.status !== 'OFFLINE';
  const errorRate =
    worker.assignedJobsCount > 0
      ? ((worker.failedJobsCount / worker.assignedJobsCount) * 100).toFixed(1)
      : '0.0';

  return (
    <Card className="flex flex-col border-slate-800/80 hover:border-slate-700/80 transition-all duration-200">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <CardTitle className="text-sm font-mono text-slate-100">
              {worker.name}
            </CardTitle>
          </div>
          <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
            <Server className="w-3 h-3 text-slate-500" />
            {worker.hostname}
          </p>
        </div>
        <Badge workerStatus={worker.status} />
      </CardHeader>

      <CardContent className="space-y-4 pt-1 flex-1 flex flex-col justify-between">
        {/* Active Job Callout */}
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-indigo-400" />
              Active Job
            </span>
            <span className="text-slate-500">{worker.activeJobId || 'idle'}</span>
          </div>
          <p className="text-xs font-mono font-medium text-slate-200 truncate">
            {worker.activeJobName || 'Waiting for scheduled task dispatch...'}
          </p>
        </div>

        {/* Telemetry metrics */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60">
            <div className="flex justify-between items-center text-slate-400 mb-1">
              <span>CPU Usage</span>
              <span className={worker.cpuUtilization > 70 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                {worker.cpuUtilization}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  worker.cpuUtilization > 70
                    ? 'bg-amber-500'
                    : worker.cpuUtilization > 40
                    ? 'bg-indigo-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${worker.cpuUtilization}%` }}
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60">
            <div className="flex justify-between items-center text-slate-400 mb-1">
              <span>RAM</span>
              <span className="text-slate-300">{worker.memoryUsageMb} MB</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-500"
                style={{ width: `${Math.min(100, (worker.memoryUsageMb / 2048) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stat badges */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono py-1">
          <div className="p-2 rounded bg-slate-900/50 border border-slate-800/50">
            <span className="text-slate-500 text-[10px] block">Completed</span>
            <span className="text-emerald-400 font-semibold">{worker.completedJobsCount}</span>
          </div>
          <div className="p-2 rounded bg-slate-900/50 border border-slate-800/50">
            <span className="text-slate-500 text-[10px] block">Failures</span>
            <span className="text-rose-400 font-semibold">{worker.failedJobsCount}</span>
          </div>
          <div className="p-2 rounded bg-slate-900/50 border border-slate-800/50">
            <span className="text-slate-500 text-[10px] block">Error Rate</span>
            <span className="text-slate-300 font-semibold">{errorRate}%</span>
          </div>
        </div>

        {/* Queues subscribed */}
        <div className="space-y-1">
          <span className="text-slate-500 text-[11px] font-mono">Bound Queues:</span>
          <div className="flex flex-wrap gap-1.5">
            {worker.queues.map((q) => (
              <span
                key={q}
                className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[10px] font-mono"
              >
                {q}
              </span>
            ))}
          </div>
        </div>

        {/* Actions & Concurrency */}
        <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-500 text-[11px]">Concurrency:</span>
            <button
              onClick={() => onCapacityChange(worker.id, worker.concurrency - 1)}
              disabled={worker.concurrency <= 1}
              className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
            >
              -
            </button>
            <span className="text-slate-200 font-bold px-1">{worker.concurrency}</span>
            <button
              onClick={() => onCapacityChange(worker.id, worker.concurrency + 1)}
              disabled={worker.concurrency >= 16}
              className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
            >
              +
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleStatus(worker.id)}
            className="text-xs font-mono gap-1.5"
          >
            <Power className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {worker.status === 'PAUSED' ? 'Resume' : worker.status === 'OFFLINE' ? 'Start' : 'Pause'}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
