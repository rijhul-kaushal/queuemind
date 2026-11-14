import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Worker } from '@/types/worker';
import { Cpu, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface WorkerHealthCardProps {
  workers: Worker[];
}

export function WorkerHealthCard({ workers }: WorkerHealthCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>
            <Cpu className="w-4 h-4 text-indigo-400" />
            Worker Fleet Health
          </CardTitle>
          <CardDescription>Simulated worker nodes and resource utilization</CardDescription>
        </div>
        <Link
          href="/workers"
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
        >
          Manage workers <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-800/60">
          {workers.map((worker) => (
            <div
              key={worker.id}
              className="px-5 py-3 hover:bg-slate-800/30 transition-colors flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-200 truncate">
                    {worker.name}
                  </span>
                  <Badge workerStatus={worker.status} />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                  <span>Host: {worker.hostname}</span>
                  <span>&bull;</span>
                  <span>Cap: {worker.concurrency} jobs</span>
                </div>
              </div>

              <div className="w-36 shrink-0 space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">CPU</span>
                  <span
                    className={
                      worker.cpuUtilization > 70
                        ? 'text-amber-400 font-bold'
                        : 'text-slate-300'
                    }
                  >
                    {worker.cpuUtilization}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      worker.cpuUtilization > 75
                        ? 'bg-amber-500'
                        : worker.cpuUtilization > 40
                        ? 'bg-indigo-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${worker.cpuUtilization}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
