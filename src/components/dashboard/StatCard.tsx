import React from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    label: string;
  };
  accentColor?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan';
}

export function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  trend,
  accentColor = 'indigo',
}: StatCardProps) {
  const iconBgs = {
    indigo: 'bg-indigo-950/60 text-indigo-400 border-indigo-700/40',
    emerald: 'bg-emerald-950/60 text-emerald-400 border-emerald-700/40',
    amber: 'bg-amber-950/60 text-amber-400 border-amber-700/40',
    rose: 'bg-rose-950/60 text-rose-400 border-rose-700/40',
    cyan: 'bg-cyan-950/60 text-cyan-400 border-cyan-700/40',
  };

  return (
    <Card className="p-5 relative overflow-hidden border-slate-800/80 hover:border-slate-700/80 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 tracking-tight">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-100">
              {value}
            </span>
            {subValue && (
              <span className="text-xs text-slate-400 font-mono">{subValue}</span>
            )}
          </div>
        </div>
        <div className={cn('p-2.5 rounded-xl border', iconBgs[accentColor])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3.5 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'font-medium font-mono text-[11px] px-1.5 py-0.5 rounded',
              trend.isPositive
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
            )}
          >
            {trend.value}
          </span>
          <span className="text-slate-400 text-[11px]">{trend.label}</span>
        </div>
      )}
    </Card>
  );
}
