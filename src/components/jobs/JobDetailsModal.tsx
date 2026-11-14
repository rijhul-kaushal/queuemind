'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Job } from '@/types/job';
import { formatDuration, formatBytes } from '@/lib/utils';
import {
  Clock,
  Cpu,
  AlertTriangle,
  RotateCw,
  XCircle,
  Trash2,
  Code2,
  CheckCircle,
} from 'lucide-react';

interface JobDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onRetry: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function JobDetailsModal({
  job,
  isOpen,
  onClose,
  onRetry,
  onCancel,
  onDelete,
}: JobDetailsModalProps) {
  const [showJson, setShowJson] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!job) return null;

  const handleAction = async (action: () => Promise<void>) => {
    setIsProcessing(true);
    try {
      await action();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={job.name}
      description={`Job Identifier: ${job.id}`}
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Status bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-3">
            <Badge status={job.status} />
            <Badge priority={job.priority} />
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Retries: {job.retryCount}/{job.maxRetries}</span>
            {job.payloadSizeKb && <span>&bull; {formatBytes(job.payloadSizeKb)}</span>}
          </div>
        </div>

        {/* Error Callout if Failed */}
        {job.errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Failure Reason / Exception</span>
            </div>
            <p className="text-xs font-mono text-rose-300 leading-relaxed bg-black/30 p-2.5 rounded-lg border border-rose-900/40">
              {job.errorMessage}
            </p>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-1 p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
            <span className="text-slate-500 text-[11px] block">Queue Partition</span>
            <span className="text-slate-200 font-semibold">{job.queue}</span>
          </div>

          <div className="space-y-1 p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
            <span className="text-slate-500 text-[11px] block">Execution Duration</span>
            <span className="text-slate-200 font-semibold">{formatDuration(job.durationMs)}</span>
          </div>

          <div className="space-y-1 p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
            <span className="text-slate-500 text-[11px] block">Created / Enqueued</span>
            <span className="text-slate-300">{new Date(job.createdAt).toLocaleString()}</span>
          </div>

          <div className="space-y-1 p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
            <span className="text-slate-500 text-[11px] block">Worker Node</span>
            <span className="text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              {job.workerId || 'Unassigned / In Queue'}
            </span>
          </div>

          {job.startedAt && (
            <div className="space-y-1 p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
              <span className="text-slate-500 text-[11px] block">Execution Started</span>
              <span className="text-slate-300">{new Date(job.startedAt).toLocaleString()}</span>
            </div>
          )}

          {job.completedAt && (
            <div className="space-y-1 p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
              <span className="text-slate-500 text-[11px] block">Execution Concluded</span>
              <span className="text-slate-300">{new Date(job.completedAt).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {job.tags && job.tags.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-slate-500 text-[11px] font-mono block">Metadata Tags:</span>
            <div className="flex flex-wrap gap-1.5">
              {job.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700/60 text-slate-300 text-[11px] font-mono"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* JSON toggle */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowJson(!showJson)}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-mono"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showJson ? 'Hide Raw Job JSON' : 'View Raw Job JSON'}</span>
          </button>
          {showJson && (
            <pre className="mt-2.5 p-3 rounded-lg bg-black/60 border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto max-h-48">
              {JSON.stringify(job, null, 2)}
            </pre>
          )}
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleAction(() => onDelete(job.id))}
            isLoading={isProcessing}
            className="text-xs gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>

          <div className="flex items-center gap-2">
            {job.status === 'PENDING' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction(() => onCancel(job.id))}
                isLoading={isProcessing}
                className="text-xs text-amber-300 border-amber-800/60 hover:bg-amber-950/40 gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel Job
              </Button>
            )}

            {(job.status === 'FAILED' || job.status === 'CANCELLED') && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAction(() => onRetry(job.id))}
                isLoading={isProcessing}
                className="text-xs gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Retry Job
              </Button>
            )}

            <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
