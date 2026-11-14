'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { JobTrendsChart } from '@/components/dashboard/JobTrendsChart';
import { StatusDistributionChart } from '@/components/dashboard/StatusDistributionChart';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { QueueSummaryTable } from '@/components/dashboard/QueueSummaryTable';
import { WorkerHealthCard } from '@/components/dashboard/WorkerHealthCard';
import { jobService } from '@/lib/services/jobService';
import { workerService } from '@/lib/services/workerService';
import { analyticsService, OverviewMetrics } from '@/lib/services/analyticsService';
import { Job } from '@/types/job';
import { Worker } from '@/types/worker';
import {
  Layers,
  Clock,
  Cpu,
  CheckCircle,
  Zap,
  Info,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import Link from 'next/link';

export default function OverviewPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedJobs, fetchedWorkers] = await Promise.all([
        jobService.getJobs(),
        workerService.getWorkers(),
      ]);
      setJobs(fetchedJobs);
      setWorkers(fetchedWorkers);
      setMetrics(analyticsService.computeOverviewMetrics(fetchedJobs, fetchedWorkers));
    } catch (err) {
      console.error('Failed to load overview data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hourlyThroughput = analyticsService.getHourlyThroughput();

  return (
    <AppShell>
      <Header
        title="System Overview"
        subtitle="Real-time telemetry, queue backpressure, and worker fleet monitoring"
        onDataReset={loadData}
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Phase 1 Notice Banner */}
        <div className="rounded-xl border border-indigo-900/40 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-indigo-950/30 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                Phase 1 Frontend MVP — Local Simulation Engine
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                This dashboard runs a deterministic multi-worker scheduling engine with localStorage persistence.
                FastAPI, Redis, PostgreSQL, and Machine Learning duration forecasting are planned for future phases.
              </p>
            </div>
          </div>
          <Link
            href="/scheduler"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors shrink-0 shadow-sm"
          >
            Launch Scheduler Simulator <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Top Metric Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="Total Jobs"
            value={metrics?.totalJobs ?? '...'}
            subValue={`${metrics?.completedJobs ?? 0} finished`}
            icon={Layers}
            accentColor="indigo"
            trend={{ value: '+14%', isPositive: true, label: 'vs last hr' }}
          />
          <StatCard
            label="Pending Queue"
            value={metrics?.pendingJobs ?? '...'}
            subValue="Backlog"
            icon={Clock}
            accentColor="amber"
            trend={{ value: `${metrics?.processingJobs ?? 0} active`, isPositive: true, label: 'in flight' }}
          />
          <StatCard
            label="Active Workers"
            value={`${metrics?.activeWorkers ?? 0}/${metrics?.totalWorkers ?? 0}`}
            subValue="Online"
            icon={Cpu}
            accentColor="cyan"
            trend={{ value: '100%', isPositive: true, label: 'availability' }}
          />
          <StatCard
            label="Avg Duration"
            value={metrics ? formatDuration(metrics.avgDurationMs) : '...'}
            subValue="P50 Exec"
            icon={TrendingUp}
            accentColor="indigo"
            trend={{ value: '-8.4%', isPositive: true, label: 'faster' }}
          />
          <StatCard
            label="Success Rate"
            value={metrics ? `${metrics.successRate}%` : '...'}
            subValue={`${metrics?.failedJobs ?? 0} failed`}
            icon={CheckCircle}
            accentColor="emerald"
            trend={{ value: '+0.4%', isPositive: true, label: 'stable' }}
          />
          <StatCard
            label="Est. Throughput"
            value={metrics ? `${metrics.estimatedThroughputPerMin}/m` : '...'}
            subValue="Jobs/min"
            icon={Zap}
            accentColor="cyan"
            trend={{ value: 'Peak', isPositive: true, label: 'load' }}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <JobTrendsChart data={hourlyThroughput} />
          </div>
          <div>
            <StatusDistributionChart jobs={jobs} />
          </div>
        </div>

        {/* Tables & Health Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivityFeed jobs={jobs} />
          </div>
          <div>
            <WorkerHealthCard workers={workers} />
          </div>
        </div>

        {/* Queue Backpressure Summary */}
        <div>
          <QueueSummaryTable />
        </div>
      </div>
    </AppShell>
  );
}
