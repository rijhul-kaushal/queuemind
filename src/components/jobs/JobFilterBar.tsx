'use client';

import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { JobFilterOptions, JobPriority, JobStatus } from '@/types/job';

interface JobFilterBarProps {
  filters: JobFilterOptions;
  onChange: (updated: Partial<JobFilterOptions>) => void;
  totalCount: number;
  filteredCount: number;
}

export function JobFilterBar({
  filters,
  onChange,
  totalCount,
  filteredCount,
}: JobFilterBarProps) {
  return (
    <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800/80 space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by job name, ID, queue or tags..."
            value={filters.searchQuery || ''}
            onChange={(e) => onChange({ searchQuery: e.target.value })}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* Counts */}
        <div className="text-xs font-mono text-slate-400 shrink-0 self-center">
          Showing <span className="text-indigo-400 font-semibold">{filteredCount}</span> of {totalCount} jobs
        </div>
      </div>

      {/* Filter selectors row */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-800/60 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] uppercase tracking-wider">Filters:</span>
        </div>

        {/* Status */}
        <select
          value={filters.status || 'ALL'}
          onChange={(e) => onChange({ status: e.target.value as JobStatus | 'ALL' })}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">Status: All</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {/* Priority */}
        <select
          value={filters.priority || 'ALL'}
          onChange={(e) => onChange({ priority: e.target.value as JobPriority | 'ALL' })}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">Priority: All</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {/* Queue */}
        <select
          value={filters.queue || 'ALL'}
          onChange={(e) => onChange({ queue: e.target.value })}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">Queue: All</option>
          <option value="default">default</option>
          <option value="media-transcoding">media-transcoding</option>
          <option value="email-delivery">email-delivery</option>
          <option value="data-pipeline">data-pipeline</option>
          <option value="ai-inference">ai-inference</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={filters.sortBy || 'createdAt'}
            onChange={(e) => onChange({ sortBy: e.target.value as JobFilterOptions['sortBy'] })}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="createdAt">Sort: Created Date</option>
            <option value="durationMs">Sort: Duration</option>
            <option value="priority">Sort: Priority</option>
            <option value="name">Sort: Name</option>
          </select>

          <button
            type="button"
            onClick={() => onChange({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono"
            title="Toggle sort direction"
          >
            {filters.sortOrder === 'asc' ? 'ASC ↑' : 'DESC ↓'}
          </button>
        </div>
      </div>
    </div>
  );
}
