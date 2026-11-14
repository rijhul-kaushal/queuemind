import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Layers } from 'lucide-react';
import { QUEUE_STATS } from '@/data/demoAnalytics';
import { formatDuration } from '@/lib/utils';

export function QueueSummaryTable() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle>
          <Layers className="w-4 h-4 text-indigo-400" />
          Queue Backpressure & Latency
        </CardTitle>
        <CardDescription>Active queue partitions and processing performance</CardDescription>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#0a0f1d] text-slate-400 font-mono text-[11px] border-b border-slate-800">
            <tr>
              <th className="px-5 py-3 font-medium">Queue Name</th>
              <th className="px-4 py-3 font-medium text-center">Pending</th>
              <th className="px-4 py-3 font-medium text-center">Processing</th>
              <th className="px-4 py-3 font-medium text-center">Completed</th>
              <th className="px-5 py-3 font-medium text-right">Avg Latency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {QUEUE_STATS.map((q) => (
              <tr key={q.name} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  {q.name}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40">
                    {q.pending}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-0.5 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-800/40">
                    {q.processing}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-slate-300">
                  {q.completed.toLocaleString()}
                </td>
                <td className="px-5 py-3 text-right text-slate-400">
                  {formatDuration(q.avgLatencyMs)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
