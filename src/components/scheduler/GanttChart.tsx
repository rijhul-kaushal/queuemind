'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { ScheduledJobOutput, SchedulingAlgorithm } from '@/lib/scheduling/types';
import { Badge } from '@/components/ui/Badge';
import { Clock, Cpu, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GanttChartProps {
  algorithm: SchedulingAlgorithm;
  workerCount: number;
  scheduledJobs: ScheduledJobOutput[];
  timelineLength: number;
}

export function GanttChart({
  algorithm,
  workerCount,
  scheduledJobs,
  timelineLength,
}: GanttChartProps) {
  const [hoveredJob, setHoveredJob] = useState<ScheduledJobOutput | null>(null);

  // If empty
  if (scheduledJobs.length === 0 || timelineLength === 0) {
    return (
      <Card className="p-8 text-center text-slate-500 font-mono text-xs">
        No jobs scheduled to display on Gantt timeline.
      </Card>
    );
  }

  // Add 10% padding to total width so last job is never clipped
  const maxTime = Math.max(timelineLength * 1.05, 10);

  // Group jobs by worker (1-indexed)
  const workerLanes: { workerId: number; jobs: ScheduledJobOutput[] }[] = [];
  for (let w = 1; w <= workerCount; w++) {
    workerLanes.push({
      workerId: w,
      jobs: scheduledJobs.filter((j) => j.assignedWorkerId === w),
    });
  }

  // Generate grid tick marks (every 2s, 5s, or 10s depending on scale)
  const step = maxTime <= 20 ? 2 : maxTime <= 50 ? 5 : 10;
  const tickCount = Math.ceil(maxTime / step);
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * step);

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-gradient-to-r from-rose-600 to-rose-500 border-rose-400 text-white shadow-rose-950/50';
      case 'HIGH':
        return 'bg-gradient-to-r from-amber-600 to-amber-500 border-amber-400 text-white shadow-amber-950/50';
      case 'MEDIUM':
        return 'bg-gradient-to-r from-indigo-600 to-indigo-500 border-indigo-400 text-white shadow-indigo-950/50';
      case 'LOW':
      default:
        return 'bg-gradient-to-r from-slate-700 to-slate-600 border-slate-500 text-slate-100 shadow-slate-950/50';
    }
  };

  return (
    <Card className="flex flex-col border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-sm">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Execution Timeline &bull; {algorithm} Scheduling</span>
          </CardTitle>
          <CardDescription>
            Multi-worker Gantt visualization showing task dispatch, start-to-finish blocks, and idle worker gaps
          </CardDescription>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500" />
            <span className="text-slate-300">Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500" />
            <span className="text-slate-300">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
            <span className="text-slate-300">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-600" />
            <span className="text-slate-300">Low</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {/* Timeline Container */}
        <div className="relative border border-slate-800 rounded-xl bg-[#090e1a] p-4 overflow-x-auto min-w-[640px]">
          {/* Time Axis Header */}
          <div className="flex items-center mb-3 pb-2 border-b border-slate-800/80">
            <div className="w-28 shrink-0 text-[11px] font-mono font-medium text-slate-500 uppercase">
              Worker Lane
            </div>
            <div className="flex-1 relative h-5">
              {ticks.map((t) => {
                const leftPercent = (t / maxTime) * 100;
                if (leftPercent > 100) return null;
                return (
                  <div
                    key={t}
                    className="absolute -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${leftPercent}%` }}
                  >
                    <span className="text-[10px] font-mono text-slate-400">{t}s</span>
                    <div className="w-px h-1.5 bg-slate-700 mt-0.5" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Worker Lanes */}
          <div className="space-y-3">
            {workerLanes.map(({ workerId, jobs }) => (
              <div key={workerId} className="flex items-center group">
                {/* Lane Label */}
                <div className="w-28 shrink-0 flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-300">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Worker {workerId}</span>
                </div>

                {/* Lane Track */}
                <div className="flex-1 relative h-10 bg-slate-900/60 rounded-lg border border-slate-800/80 overflow-hidden">
                  {/* Vertical grid lines */}
                  {ticks.map((t) => {
                    const leftPercent = (t / maxTime) * 100;
                    if (leftPercent > 100) return null;
                    return (
                      <div
                        key={t}
                        className="absolute top-0 bottom-0 w-px bg-slate-800/40 pointer-events-none"
                        style={{ left: `${leftPercent}%` }}
                      />
                    );
                  })}

                  {/* Scheduled Job Blocks */}
                  {jobs.map((job) => {
                    const leftPercent = (job.startTime / maxTime) * 100;
                    const widthPercent = (job.duration / maxTime) * 100;

                    return (
                      <div
                        key={job.id}
                        onMouseEnter={() => setHoveredJob(job)}
                        onMouseLeave={() => setHoveredJob(null)}
                        className={cn(
                          'absolute top-1 bottom-1 rounded-md border text-xs px-2 flex items-center justify-between cursor-pointer transition-all duration-150 shadow-md overflow-hidden select-none',
                          getPriorityStyle(job.priority),
                          hoveredJob?.id === job.id ? 'ring-2 ring-white z-20 scale-[1.02]' : 'z-10'
                        )}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${Math.max(widthPercent, 1.5)}%`,
                        }}
                      >
                        <span className="font-mono font-medium truncate text-[11px]">
                          {job.name}
                        </span>
                        <span className="text-[9px] font-mono opacity-80 shrink-0 ml-1">
                          {job.duration}s
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hovered Job Inspector Panel */}
        {hoveredJob ? (
          <div className="p-3.5 rounded-xl bg-slate-900 border border-indigo-500/40 text-xs font-mono flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-100">{hoveredJob.name}</span>
              <Badge priority={hoveredJob.priority} />
              <span className="text-slate-400">Worker {hoveredJob.assignedWorkerId}</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-slate-300">
              <div>
                <span className="text-slate-500">Arrival: </span>
                <span className="text-indigo-300 font-bold">{hoveredJob.arrivalTime}s</span>
              </div>
              <div>
                <span className="text-slate-500">Started: </span>
                <span className="text-slate-200 font-bold">{hoveredJob.startTime}s</span>
              </div>
              <div>
                <span className="text-slate-500">Finished: </span>
                <span className="text-slate-200 font-bold">{hoveredJob.finishTime}s</span>
              </div>
              <div>
                <span className="text-slate-500">Waiting Time: </span>
                <span className="text-amber-400 font-bold">{hoveredJob.waitingTime}s</span>
              </div>
              <div>
                <span className="text-slate-500">Completion Time: </span>
                <span className="text-emerald-400 font-bold">{hoveredJob.completionTime}s</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-slate-900/30 border border-slate-800/60 text-center text-slate-500 text-[11px] font-mono flex items-center justify-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>Hover over any task block on the timeline to inspect its waiting time, turnaround, and worker dispatch window</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
