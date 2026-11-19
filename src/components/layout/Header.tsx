'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, BookOpen, Server, Radio } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { jobService } from '@/lib/services/jobService';
import { workerService } from '@/lib/services/workerService';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onDataReset?: () => void;
}

export function Header({ title, subtitle, onDataReset }: HeaderProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [backendStatus, setBackendStatus] = useState<{ online: boolean; redisLive?: boolean }>({
    online: false,
  });
  const [isLiveMode, setIsLiveMode] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      const res = await jobService.checkBackendHealth();
      if (isMounted) {
        setBackendStatus(res);
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleToggleMode = () => {
    const next = !isLiveMode;
    setIsLiveMode(next);
    jobService.setBackendMode(next);
    workerService.setBackendMode(next);
    if (onDataReset) onDataReset();
  };

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
        {/* Live Backend Connection Indicator / Toggle */}
        {backendStatus.online ? (
          <button
            onClick={handleToggleMode}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border transition-all cursor-pointer',
              isLiveMode
                ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300 shadow-sm shadow-emerald-900/30'
                : 'bg-indigo-950/40 border-indigo-700/40 text-indigo-300 hover:border-emerald-500/60'
            )}
            title="Click to toggle between Live FastAPI Backend and Local Client Simulator"
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                isLiveMode ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'
              )}
            />
            <span>
              {isLiveMode
                ? `Live Backend: FastAPI + ${backendStatus.redisLive ? 'Redis' : 'In-Memory Queue'}`
                : 'FastAPI Online (Click to connect)'}
            </span>
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Simulator Mode &bull; Phase 1</span>
          </div>
        )}

        {/* Reset Demo Data */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          isLoading={isResetting}
          className="text-xs text-slate-300 border-slate-700/80 hover:bg-slate-800/80 gap-1.5"
          title="Reset database or demo state"
        >
          {resetSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">State Reset</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset State</span>
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
