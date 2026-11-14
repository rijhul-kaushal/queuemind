'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { JobPriority, CreateJobInput } from '@/types/job';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateJobInput) => Promise<void>;
}

export function CreateJobModal({ isOpen, onClose, onSubmit }: CreateJobModalProps) {
  const [name, setName] = useState('');
  const [queue, setQueue] = useState('default');
  const [priority, setPriority] = useState<JobPriority>('MEDIUM');
  const [durationSec, setDurationSec] = useState('5');
  const [payloadSizeKb, setPayloadSizeKb] = useState('50');
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Job name is required.');
      return;
    }

    const duration = parseFloat(durationSec);
    if (isNaN(duration) || duration <= 0) {
      setError('Duration must be a positive number of seconds.');
      return;
    }

    const size = parseFloat(payloadSizeKb);
    if (isNaN(size) || size < 0) {
      setError('Payload size must be a non-negative number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = tagInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      await onSubmit({
        name: name.trim(),
        queue,
        priority,
        durationMs: Math.round(duration * 1000),
        payloadSizeKb: Math.round(size),
        tags: tags.length > 0 ? tags : [queue],
      });

      // Reset form
      setName('');
      setQueue('default');
      setPriority('MEDIUM');
      setDurationSec('5');
      setPayloadSizeKb('50');
      setTagInput('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enqueue New Background Job"
      description="Inject a simulated job into the queue partition for worker execution."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Job Name / Task Identifier *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Invalidate CloudFront Edge Distribution"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Target Queue Partition
            </label>
            <select
              value={queue}
              onChange={(e) => setQueue(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="default">default (General purpose)</option>
              <option value="media-transcoding">media-transcoding (Heavy compute)</option>
              <option value="email-delivery">email-delivery (High throughput)</option>
              <option value="data-pipeline">data-pipeline (ETL & Backups)</option>
              <option value="ai-inference">ai-inference (ML / LLM)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Execution Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as JobPriority)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="CRITICAL">CRITICAL (Priority Level 4)</option>
              <option value="HIGH">HIGH (Priority Level 3)</option>
              <option value="MEDIUM">MEDIUM (Priority Level 2)</option>
              <option value="LOW">LOW (Priority Level 1)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Estimated Duration (seconds) *
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="3600"
              required
              value={durationSec}
              onChange={(e) => setDurationSec(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Payload Size (KB)
            </label>
            <input
              type="number"
              min="1"
              value={payloadSizeKb}
              onChange={(e) => setPayloadSizeKb(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Tags (comma separated)
          </label>
          <input
            type="text"
            placeholder="e.g. auth, security, production"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Enqueue Job
          </Button>
        </div>
      </form>
    </Modal>
  );
}
