'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { SimulationLogEvent } from '@/lib/scheduling/types';
import { Terminal, ChevronDown, ChevronUp } from 'lucide-react';

interface SimulationLogsViewProps {
  logs: SimulationLogEvent[];
}

export function SimulationLogsView({ logs }: SimulationLogsViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-slate-800">
      <CardHeader
        className="py-3 px-5 flex flex-row items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <CardTitle className="text-xs font-mono">
            Discrete-Event Simulation Step Logs ({logs.length} events)
          </CardTitle>
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-slate-200 text-xs font-mono flex items-center gap-1"
        >
          <span>{isExpanded ? 'Collapse' : 'Expand Logs'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0 border-t border-slate-800 font-mono text-xs">
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 p-3 bg-black/40">
            {logs.map((log, index) => (
              <div key={index} className="py-1.5 flex items-start gap-3 hover:bg-slate-900/40">
                <span className="text-indigo-400 font-bold shrink-0 w-14">
                  t={log.timestamp}s
                </span>
                <span className="text-slate-300 flex-1">{log.event}</span>
                {log.workerId && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    W{log.workerId}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
