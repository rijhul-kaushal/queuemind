'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { AlgorithmComparison } from '@/lib/scheduling/types';
import { Trophy, TrendingDown, TrendingUp, Clock, Gauge, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricsComparisonCardsProps {
  comparison: AlgorithmComparison;
}

export function MetricsComparisonCards({ comparison }: MetricsComparisonCardsProps) {
  const { fifo, priority, diff, winner } = comparison;

  const cards = [
    {
      title: 'Average Waiting Time',
      description: 'Mean duration from arrival until worker begins execution',
      fifoVal: `${fifo.metrics.averageWaitingTime}s`,
      priorityVal: `${priority.metrics.averageWaitingTime}s`,
      winner: winner.waitingTime,
      diffText:
        diff.avgWaitDiff === 0
          ? 'Equal wait time'
          : `${Math.abs(diff.avgWaitDiff)}s (${Math.abs(diff.avgWaitPercentDiff)}%) ${
              diff.avgWaitDiff < 0 ? 'less wait in Priority' : 'less wait in FIFO'
            }`,
      icon: Clock,
      lowerIsBetter: true,
    },
    {
      title: 'Average Completion Time',
      description: 'Total turnaround from job arrival to finish',
      fifoVal: `${fifo.metrics.averageCompletionTime}s`,
      priorityVal: `${priority.metrics.averageCompletionTime}s`,
      winner: winner.completionTime,
      diffText:
        diff.avgCompletionDiff === 0
          ? 'Identical turnaround'
          : `${Math.abs(diff.avgCompletionDiff)}s ${
              diff.avgCompletionDiff < 0 ? 'faster in Priority' : 'faster in FIFO'
            }`,
      icon: BarChart2,
      lowerIsBetter: true,
    },
    {
      title: 'Makespan (Total Wall Clock)',
      description: 'Time from earliest job arrival to completion of the last job',
      fifoVal: `${fifo.metrics.makespan}s`,
      priorityVal: `${priority.metrics.makespan}s`,
      winner: winner.makespan,
      diffText:
        diff.makespanDiff === 0
          ? 'Equal makespan'
          : `${Math.abs(diff.makespanDiff)}s ${diff.makespanDiff < 0 ? 'tighter in Priority' : 'tighter in FIFO'}`,
      icon: Gauge,
      lowerIsBetter: true,
    },
    {
      title: 'Worker Fleet Utilization',
      description: 'Total busy worker execution time / available capacity window',
      fifoVal: `${(fifo.metrics.workerUtilization * 100).toFixed(1)}%`,
      priorityVal: `${(priority.metrics.workerUtilization * 100).toFixed(1)}%`,
      winner: winner.workerUtilization,
      diffText:
        diff.utilizationDiff === 0
          ? 'Equal utilization'
          : `${Math.abs(diff.utilizationDiff)}% ${diff.utilizationDiff > 0 ? 'higher in Priority' : 'higher in FIFO'}`,
      icon: Trophy,
      lowerIsBetter: false,
    },
  ];

  return (
    <div className="space-y-4">
      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title} className="p-4 flex flex-col justify-between border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">{c.title}</span>
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">{c.description}</p>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-2 gap-2 my-3 p-2 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-center">
                <div
                  className={cn(
                    'p-1.5 rounded',
                    c.winner === 'FIFO' ? 'bg-indigo-950/60 text-indigo-300 font-bold border border-indigo-700/50' : 'text-slate-400'
                  )}
                >
                  <span className="text-[10px] block text-slate-500 uppercase">FIFO</span>
                  <span className="text-base">{c.fifoVal}</span>
                </div>

                <div
                  className={cn(
                    'p-1.5 rounded',
                    c.winner === 'PRIORITY' ? 'bg-indigo-950/60 text-indigo-300 font-bold border border-indigo-700/50' : 'text-slate-400'
                  )}
                >
                  <span className="text-[10px] block text-slate-500 uppercase">Priority</span>
                  <span className="text-base">{c.priorityVal}</span>
                </div>
              </div>

              {/* Winner pill */}
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold border',
                    c.winner === 'TIE'
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                  )}
                >
                  {c.winner === 'TIE' ? '⚖ TIE' : `🏆 ${c.winner} WINS`}
                </span>
                <span className="text-slate-400 text-[10px] truncate ml-1">{c.diffText}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Priority Wait Time Breakdown Comparison Table */}
      <Card className="overflow-hidden border-slate-800">
        <CardHeader className="py-3 px-5 border-b border-slate-800/60 bg-[#0a0f1d]">
          <CardTitle className="text-xs font-mono flex items-center justify-between">
            <span>Priority Level Wait Time Comparison (SLA Urgency vs Starvation)</span>
            <span className="text-slate-500 text-[11px] font-normal">
              Workload Size: {comparison.jobCount} jobs &bull; {comparison.workerCount} workers
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead className="bg-slate-900/60 text-slate-400 text-[11px] border-b border-slate-800/60">
              <tr>
                <th className="px-5 py-2.5 font-medium">Priority Tier</th>
                <th className="px-4 py-2.5 font-medium text-center">Job Count</th>
                <th className="px-4 py-2.5 font-medium text-center">FIFO Avg Wait</th>
                <th className="px-4 py-2.5 font-medium text-center">Priority Avg Wait</th>
                <th className="px-5 py-2.5 font-medium text-right">Delta / Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((tier) => {
                const fTier = fifo.metrics.priorityBreakdown.find((b) => b.priority === tier);
                const pTier = priority.metrics.priorityBreakdown.find((b) => b.priority === tier);
                const count = fTier?.count || 0;
                const fWait = fTier?.avgWaitingTime || 0;
                const pWait = pTier?.avgWaitingTime || 0;
                const delta = Number((pWait - fWait).toFixed(2));

                if (count === 0) return null;

                return (
                  <tr key={tier} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-2.5 font-bold">
                      <span
                        className={cn('px-2 py-0.5 rounded text-[10px]', {
                          'bg-rose-950/60 text-rose-300 border border-rose-800/50': tier === 'CRITICAL',
                          'bg-amber-950/60 text-amber-300 border border-amber-800/50': tier === 'HIGH',
                          'bg-indigo-950/60 text-indigo-300 border border-indigo-800/50': tier === 'MEDIUM',
                          'bg-slate-800 text-slate-300 border border-slate-700': tier === 'LOW',
                        })}
                      >
                        {tier}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-slate-400">{count}</td>
                    <td className="px-4 py-2.5 text-center text-slate-300">{fWait}s</td>
                    <td className="px-4 py-2.5 text-center text-slate-200 font-semibold">{pWait}s</td>
                    <td className="px-5 py-2.5 text-right">
                      {delta < 0 ? (
                        <span className="text-emerald-400 font-semibold">
                          ↓ {Math.abs(delta)}s faster
                        </span>
                      ) : delta > 0 ? (
                        <span className="text-amber-400 font-semibold">
                          ↑ {delta}s delayed
                        </span>
                      ) : (
                        <span className="text-slate-500">Neutral (0s)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
