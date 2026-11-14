'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { analyticsService } from '@/lib/services/analyticsService';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Layers,
  Clock,
  PieChart as PieIcon,
  CheckCircle,
} from 'lucide-react';
import { formatDuration } from '@/lib/utils';

export default function AnalyticsPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const throughputData = analyticsService.getHourlyThroughput();
  const durationData = analyticsService.getDurationDistribution();
  const queueData = analyticsService.getQueueStats();
  const failureReasons = analyticsService.getFailureReasons();

  if (!isMounted) {
    return (
      <AppShell>
        <Header title="Analytics & Performance" subtitle="Loading telemetry..." />
        <div className="p-8 max-w-7xl mx-auto w-full text-center text-slate-500 font-mono text-xs">
          Loading analytics visualizations...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header
        title="Analytics & Workload Performance"
        subtitle="Historical throughput, duration histograms, queue backpressure, and failure analysis"
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-mono">24h Task Volume</span>
            <div className="text-2xl font-bold font-mono text-slate-100">6,104 jobs</div>
            <span className="text-[11px] text-emerald-400 font-mono">+12.4% vs previous 24h</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-mono">Global Success Rate</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">98.9%</div>
            <span className="text-[11px] text-slate-500 font-mono">68 failures handled</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-mono">P95 Queue Latency</span>
            <div className="text-2xl font-bold font-mono text-indigo-400">1.82s</div>
            <span className="text-[11px] text-slate-500 font-mono">Across high-priority queues</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-mono">Total Execution Time</span>
            <div className="text-2xl font-bold font-mono text-slate-100">42.8 hours</div>
            <span className="text-[11px] text-slate-500 font-mono">Distributed across fleet</span>
          </div>
        </div>

        {/* 24-Hour Throughput & Duration Histograms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Throughput Area Chart */}
          <Card className="flex flex-col border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Hourly Job Processing Throughput
              </CardTitle>
              <CardDescription>
                Enqueued vs successfully processed background jobs over 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={throughputData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="anCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
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
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#anCompleted)"
                      name="Processed Jobs"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Duration Distribution Histogram */}
          <Card className="flex flex-col border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                <Clock className="w-4 h-4 text-indigo-400" />
                Execution Duration Distribution (Histogram)
              </CardTitle>
              <CardDescription>
                Binned frequency of job execution times from sub-second to heavy compute
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={durationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="range" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
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
                    <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} name="Job Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue Latency & Failure Diagnostics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queue Latencies */}
          <Card className="flex flex-col border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                <Layers className="w-4 h-4 text-indigo-400" />
                Queue Partition Volume &amp; Latency
              </CardTitle>
              <CardDescription>
                Completed tasks vs average queue latency by partition
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={queueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
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
                    <Bar dataKey="completed" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Completed" />
                    <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending Backlog" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Failure Reasons Breakdown */}
          <Card className="flex flex-col border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Failure Root-Cause Classification
              </CardTitle>
              <CardDescription>
                Analysis of failed task executions and error categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-1 flex-1 flex flex-col justify-between">
              <div className="space-y-2.5">
                {failureReasons.map((item) => (
                  <div key={item.reason} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300 truncate max-w-[70%]">{item.reason}</span>
                      <span className="text-rose-400 font-semibold">
                        {item.count} errors ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rose-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 font-mono">
                <span className="text-indigo-400 font-semibold">Self-Healing Policy: </span>
                Exponential backoff with jitter applied to 429 and network timeouts (max 3 retries). OOM errors routed to dead-letter queue (DLQ).
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
