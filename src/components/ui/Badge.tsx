import React from 'react';
import { cn } from '@/lib/utils';
import { JobPriority, JobStatus } from '@/types/job';
import { WorkerStatus } from '@/types/worker';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'status' | 'priority' | 'worker';
  status?: JobStatus;
  priority?: JobPriority;
  workerStatus?: WorkerStatus;
}

export function Badge({
  className,
  variant = 'default',
  status,
  priority,
  workerStatus,
  children,
  ...props
}: BadgeProps) {
  // Priority styles
  if (priority || variant === 'priority') {
    const p = priority || (children as JobPriority);
    const styles: Record<JobPriority, string> = {
      CRITICAL: 'bg-rose-950/70 text-rose-300 border-rose-800/60 shadow-[0_0_8px_rgba(244,63,94,0.15)]',
      HIGH: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
      MEDIUM: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60',
      LOW: 'bg-slate-800/70 text-slate-300 border-slate-700/60',
    };
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border font-mono tracking-tight',
          styles[p] || 'bg-slate-800 text-slate-300 border-slate-700',
          className
        )}
        {...props}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', {
          'bg-rose-400 animate-pulse': p === 'CRITICAL',
          'bg-amber-400': p === 'HIGH',
          'bg-indigo-400': p === 'MEDIUM',
          'bg-slate-400': p === 'LOW',
        })} />
        {children || p}
      </span>
    );
  }

  // Status styles
  if (status || variant === 'status') {
    const s = status || (children as JobStatus);
    const styles: Record<JobStatus, { bg: string; dot: string }> = {
      COMPLETED: { bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60', dot: 'bg-emerald-400' },
      PROCESSING: { bg: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60', dot: 'bg-indigo-400 animate-spin' },
      PENDING: { bg: 'bg-amber-950/60 text-amber-300 border-amber-800/60', dot: 'bg-amber-400' },
      FAILED: { bg: 'bg-rose-950/60 text-rose-300 border-rose-800/60', dot: 'bg-rose-400' },
      CANCELLED: { bg: 'bg-slate-900/60 text-slate-400 border-slate-700/60', dot: 'bg-slate-500' },
    };
    const current = styles[s] || { bg: 'bg-slate-800 text-slate-300 border-slate-700', dot: 'bg-slate-400' };
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border font-mono tracking-tight',
          current.bg,
          className
        )}
        {...props}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', current.dot)} />
        {children || s}
      </span>
    );
  }

  // Worker status styles
  if (workerStatus || variant === 'worker') {
    const ws = workerStatus || (children as WorkerStatus);
    const styles: Record<WorkerStatus, { bg: string; dot: string }> = {
      BUSY: { bg: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60', dot: 'bg-indigo-400 animate-pulse' },
      IDLE: { bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60', dot: 'bg-emerald-400' },
      PAUSED: { bg: 'bg-amber-950/60 text-amber-300 border-amber-800/60', dot: 'bg-amber-400' },
      OFFLINE: { bg: 'bg-slate-900/60 text-slate-400 border-slate-700/60', dot: 'bg-slate-500' },
    };
    const current = styles[ws] || { bg: 'bg-slate-800 text-slate-300 border-slate-700', dot: 'bg-slate-400' };
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border font-mono',
          current.bg,
          className
        )}
        {...props}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', current.dot)} />
        {children || ws}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
