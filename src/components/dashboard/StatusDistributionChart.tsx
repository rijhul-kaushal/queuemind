'use client';

import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { PieChart as PieIcon } from 'lucide-react';
import { Job } from '@/types/job';

interface StatusDistributionChartProps {
  jobs: Job[];
}

export function StatusDistributionChart({ jobs }: StatusDistributionChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const counts = {
    COMPLETED: jobs.filter((j) => j.status === 'COMPLETED').length,
    PROCESSING: jobs.filter((j) => j.status === 'PROCESSING').length,
    PENDING: jobs.filter((j) => j.status === 'PENDING').length,
    FAILED: jobs.filter((j) => j.status === 'FAILED').length,
    CANCELLED: jobs.filter((j) => j.status === 'CANCELLED').length,
  };

  const chartData = [
    { name: 'Completed', value: counts.COMPLETED, color: '#10b981' },
    { name: 'Processing', value: counts.PROCESSING, color: '#6366f1' },
    { name: 'Pending', value: counts.PENDING, color: '#f59e0b' },
    { name: 'Failed', value: counts.FAILED, color: '#f43f5e' },
    { name: 'Cancelled', value: counts.CANCELLED, color: '#64748b' },
  ].filter((d) => d.value > 0);

  const total = jobs.length;

  if (!isMounted) {
    return (
      <Card className="h-[360px] flex items-center justify-center">
        <div className="text-xs text-slate-500 font-mono animate-pulse">Loading status breakdown...</div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>
          <PieIcon className="w-4 h-4 text-indigo-400" />
          Job Status Distribution
        </CardTitle>
        <CardDescription>Real-time partition of active & finished jobs</CardDescription>
      </CardHeader>
      <CardContent className="pt-2 flex-1 flex flex-col justify-between">
        <div className="h-[200px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f1626',
                  borderColor: '#1e293b',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <Pie
                data={chartData}
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#0e1424" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold font-mono text-slate-100">{total}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Total Jobs</span>
          </div>
        </div>

        {/* Legend pills */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800/60">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300">{item.name}</span>
              </div>
              <div className="font-mono text-slate-400">
                {item.value} <span className="text-[10px] text-slate-500">({total > 0 ? Math.round((item.value / total) * 100) : 0}%)</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
