'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SchedulePriority, SimulationJobInput } from '@/lib/scheduling/types';

interface AddSimulationJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (job: SimulationJobInput) => void;
  nextIndex: number;
}

export function AddSimulationJobModal({
  isOpen,
  onClose,
  onAdd,
  nextIndex,
}: AddSimulationJobModalProps) {
  const [name, setName] = useState(`Job #${nextIndex}`);
  const [arrivalTime, setArrivalTime] = useState('0');
  const [duration, setDuration] = useState('4');
  const [priority, setPriority] = useState<SchedulePriority>('MEDIUM');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const arr = parseFloat(arrivalTime);
    const dur = parseFloat(duration);

    if (isNaN(arr) || arr < 0) {
      setError('Arrival time must be a non-negative number of seconds.');
      return;
    }

    if (isNaN(dur) || dur <= 0) {
      setError('Duration must be greater than 0 seconds.');
      return;
    }

    onAdd({
      id: `custom-sim-${Date.now().toString().slice(-4)}`,
      name: name.trim() || `Job #${nextIndex}`,
      arrivalTime: Number(arr.toFixed(1)),
      duration: Number(dur.toFixed(1)),
      priority,
      queue: 'custom',
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Job to Simulation Workload"
      description="Define job arrival timing, execution duration, and scheduling priority."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Job Label / Task Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Arrival Time (t in seconds)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              required
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Duration (seconds)
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="120"
              required
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Scheduling Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as SchedulePriority)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="CRITICAL">CRITICAL (Top Priority)</option>
            <option value="HIGH">HIGH Priority</option>
            <option value="MEDIUM">MEDIUM Priority</option>
            <option value="LOW">LOW Priority</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Add to Workload
          </Button>
        </div>
      </form>
    </Modal>
  );
}
