'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Worker } from '@/types/worker';
import { BarChart3 } from 'lucide-react';

interface WorkloadBarChartProps {
  workers: Worker[];
}

export function WorkloadBarChart({ workers }: WorkloadBarChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const data = workers.map((w) => ({
    name: w.name.replace('worker-node-', ''),
    completed: w.completedJobsCount,
    failed: w.failedJobsCount,
    cpu: w.cpuUtilization,
  }));

  if (!isMounted) {
    return (
      <Card className="h-[280px] flex items-center justify-center">
        <div className="text-xs text-slate-500 font-mono animate-pulse">Loading worker workload chart...</div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Worker Process Execution Volume
          </CardTitle>
          <CardDescription>
            Cumulative completed vs failed task distribution across simulated nodes
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f1626',
                  borderColor: '#1e293b',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} name="Completed Tasks" />
              <Bar dataKey="failed" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Failed Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
