'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, ShieldAlert, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { jobService } from '@/lib/services/jobService';
import { workerService } from '@/lib/services/workerService';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onDataReset?: () => void;
}

export function Header({ title, subtitle, onDataReset }: HeaderProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await jobService.resetDemoData();
      await workerService.resetDemoData();
      setResetSuccess(true);
      if (onDataReset) {
        onDataReset();
      }
      setTimeout(() => setResetSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to reset demo data', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#090e1a]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-400 font-normal">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Demo Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-700/40 text-xs text-indigo-300 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
          <span>Demo Engine &bull; Local Client Mode</span>
        </div>

        {/* Reset Demo Data */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          isLoading={isResetting}
          className="text-xs text-slate-300 border-slate-700/80 hover:bg-slate-800/80 gap-1.5"
          title="Reset seeded demo jobs and workers to default state"
        >
          {resetSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Data Reset</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Demo State</span>
            </>
          )}
        </Button>

        {/* System Blueprint Link */}
        <Link href="/architecture">
          <Button variant="secondary" size="sm" className="text-xs gap-1.5 border-slate-700">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Architecture</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
