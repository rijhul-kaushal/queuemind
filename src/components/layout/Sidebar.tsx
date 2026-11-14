'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  Cpu,
  CpuIcon,
  BarChart3,
  GitBranch,
  Activity,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  {
    name: 'Overview',
    href: '/',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: 'Job Explorer',
    href: '/jobs',
    icon: Layers,
    badge: '14 jobs',
  },
  {
    name: 'Worker Monitor',
    href: '/workers',
    icon: Cpu,
    badge: '5 nodes',
  },
  {
    name: 'Scheduling Intelligence',
    href: '/scheduler',
    icon: CpuIcon,
    badge: 'Simulator',
    highlight: true,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    badge: null,
  },
  {
    name: 'System Architecture',
    href: '/architecture',
    icon: GitBranch,
    badge: 'Phases 1-5',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-[#090e1a]/95 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-indigo-400/30">
          <Activity className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base text-slate-100 tracking-tight font-sans">
              Queue<span className="text-indigo-400">Mind</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 rounded font-mono font-medium">
              v1.0 MVP
            </span>
          </div>
          <span className="text-[11px] text-slate-400 tracking-tight">Workload Orchestrator</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
          Platform Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150',
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                  )}
                />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    'text-[10px] px-2 py-0.5 rounded-md font-mono font-medium',
                    item.highlight
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Architecture Roadmap Callout */}
      <div className="p-3.5 m-3 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/40 border border-indigo-500/20 shadow-md">
        <div className="flex items-center gap-2 mb-1.5 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Multi-Phase Roadmap</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
          Phase 1 frontend simulator active. Future FastAPI backend & ML duration prediction documented in blueprint.
        </p>
        <Link
          href="/architecture"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View System Architecture &rarr;
        </Link>
      </div>

      {/* Footer telemetry */}
      <div className="p-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 bg-[#070b14]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono text-slate-300">Simulator Engine Active</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">React 19 / Next.js</span>
      </div>
    </aside>
  );
}
