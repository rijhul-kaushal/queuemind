'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { JobFilterBar } from '@/components/jobs/JobFilterBar';
import { CreateJobModal } from '@/components/jobs/CreateJobModal';
import { JobDetailsModal } from '@/components/jobs/JobDetailsModal';
import { jobService } from '@/lib/services/jobService';
import { Job, JobFilterOptions, CreateJobInput } from '@/types/job';
import { formatDuration, timeAgo } from '@/lib/utils';
import {
  Plus,
  RotateCw,
  XCircle,
  Eye,
  Inbox,
  Cpu,
  Layers,
} from 'lucide-react';

export default function JobsPage() {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState<JobFilterOptions>({
    searchQuery: '',
    status: 'ALL',
    priority: 'ALL',
    queue: 'ALL',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await jobService.getJobs();
      const filtered = await jobService.getJobs(filters);
      setAllJobs(all);
      setFilteredJobs(filtered);
    } catch (err) {
      console.error('Failed to load jobs', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleFilterChange = (updates: Partial<JobFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleCreateJob = async (input: CreateJobInput) => {
    await jobService.createJob(input);
    await fetchJobs();
  };

  const handleRetryJob = async (id: string) => {
    await jobService.retryJob(id);
    await fetchJobs();
  };

  const handleCancelJob = async (id: string) => {
    await jobService.cancelJob(id);
    await fetchJobs();
  };

  const handleDeleteJob = async (id: string) => {
    await jobService.deleteJob(id);
    await fetchJobs();
  };

  const openJobDetails = (job: Job) => {
    setSelectedJob(job);
    setIsDetailsOpen(true);
  };

  return (
    <AppShell>
      <Header
        title="Job Explorer"
        subtitle="Manage background jobs, inspect state transitions, and monitor retries"
        onDataReset={fetchJobs}
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top actions bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Queued & Executed Workload
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live job records with queue partitions and retry execution controls
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            className="text-xs gap-2 shrink-0 shadow-md shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            Enqueue New Job
          </Button>
        </div>

        {/* Filter bar */}
        <JobFilterBar
          filters={filters}
          onChange={handleFilterChange}
          totalCount={allJobs.length}
          filteredCount={filteredJobs.length}
        />

        {/* Jobs Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0a0f1d] text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Job Identifier</th>
                  <th className="px-4 py-3.5 font-medium">Queue</th>
                  <th className="px-4 py-3.5 font-medium">Priority</th>
                  <th className="px-4 py-3.5 font-medium">Status</th>
                  <th className="px-4 py-3.5 font-medium text-right">Duration</th>
                  <th className="px-4 py-3.5 font-medium">Worker</th>
                  <th className="px-4 py-3.5 font-medium">Created</th>
                  <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                      Loading job workload records...
                    </td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Inbox className="w-8 h-8 text-slate-600" />
                        <span className="text-sm font-semibold text-slate-400">No matching jobs found</span>
                        <p className="text-xs text-slate-500 max-w-sm">
                          Try adjusting search filters or click &ldquo;Enqueue New Job&rdquo; to add a new task.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr
                      key={job.id}
                      onClick={() => openJobDetails(job)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                            {job.name}
                          </span>
                          <span className="text-[10px] text-slate-500">{job.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
                          {job.queue}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge priority={job.priority} />
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge status={job.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-300">
                        {formatDuration(job.durationMs)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {job.workerId ? (
                          <span className="flex items-center gap-1.5 text-[11px]">
                            <Cpu className="w-3 h-3 text-indigo-400" />
                            {job.workerId}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                        {timeAgo(job.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openJobDetails(job)}
                            className="p-1 h-7 w-7 text-slate-400 hover:text-indigo-300"
                            title="Inspect Job"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          {job.status === 'PENDING' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelJob(job.id)}
                              className="p-1 h-7 w-7 text-amber-400 hover:bg-amber-950/40"
                              title="Cancel Pending Job"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {(job.status === 'FAILED' || job.status === 'CANCELLED') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetryJob(job.id)}
                              className="p-1 h-7 w-7 text-indigo-400 hover:bg-indigo-950/40"
                              title="Retry Job"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <CreateJobModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateJob}
      />

      <JobDetailsModal
        job={selectedJob}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onRetry={handleRetryJob}
        onCancel={handleCancelJob}
        onDelete={handleDeleteJob}
      />
    </AppShell>
  );
}
