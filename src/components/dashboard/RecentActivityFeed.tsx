import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Job } from '@/types/job';
import { Clock, ArrowUpRight, Cpu } from 'lucide-react';
import { formatDuration, timeAgo } from '@/lib/utils';
import Link from 'next/link';

interface RecentActivityFeedProps {
  jobs: Job[];
}

export function RecentActivityFeed({ jobs }: RecentActivityFeedProps) {
  const recentJobs = jobs.slice(0, 6);

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>
            <Clock className="w-4 h-4 text-indigo-400" />
            Recent Job Activity
          </CardTitle>
          <CardDescription>Live timeline of recent state transitions</CardDescription>
        </div>
        <Link
          href="/jobs"
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
        >
          View all jobs <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="divide-y divide-slate-800/60">
          {recentJobs.map((job) => (
            <div
              key={job.id}
              className="px-5 py-3 hover:bg-slate-800/30 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Badge status={job.status} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-200 truncate">
                      {job.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{job.id}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                    <span className="font-mono text-slate-500">queue: {job.queue}</span>
                    <span>&bull;</span>
                    <span>{timeAgo(job.createdAt)}</span>
                    {job.workerId && (
                      <>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 font-mono text-slate-400">
                          <Cpu className="w-3 h-3 text-slate-500" />
                          {job.workerId}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Badge priority={job.priority} />
                <span className="text-xs font-mono text-slate-400 w-16 text-right">
                  {formatDuration(job.durationMs)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
