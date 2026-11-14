import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Sparkles, Scale, AlertOctagon, Lightbulb, GitBranch } from 'lucide-react';

interface EngineeringTradeoffAnalysisProps {
  tradeoffPoints: string[];
}

export function EngineeringTradeoffAnalysis({ tradeoffPoints }: EngineeringTradeoffAnalysisProps) {
  return (
    <Card className="border-indigo-950/60 bg-gradient-to-br from-[#0e1424] via-[#0b101c] to-[#0d1322]">
      <CardHeader className="pb-3 border-b border-slate-800/60">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-300">
              <Scale className="w-4 h-4 text-indigo-400" />
              Scheduling Architecture Trade-off Analysis
            </CardTitle>
            <CardDescription>
              Distributed systems evaluation: FIFO Fairness vs Priority SLA Guarantees
            </CardDescription>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50">
            Automated Insights
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3.5">
        <div className="space-y-2.5">
          {tradeoffPoints.map((point, index) => {
            const isCritical = point.includes('Critical') || point.includes('Win');
            const isStarvation = point.includes('Starvation') || point.includes('Deprioritization');
            const isArch = point.includes('Recommendation') || point.includes('Distributed');

            return (
              <div
                key={index}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3 text-xs leading-relaxed"
              >
                <div className="mt-0.5 shrink-0">
                  {isStarvation ? (
                    <AlertOctagon className="w-4 h-4 text-amber-400" />
                  ) : isCritical ? (
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  ) : isArch ? (
                    <GitBranch className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Lightbulb className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <p className="text-slate-300 font-sans">{point}</p>
              </div>
            );
          })}
        </div>

        {/* Future ML Bridge callout */}
        <div className="mt-4 p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-700/30 text-xs">
          <div className="flex items-center gap-2 font-semibold text-indigo-300 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Phase 4 ML-Assisted Scheduling Connection</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            In Phase 4, QueueMind will train regression models (scikit-learn &amp; XGBoost) on historical job payloads
            to predict execution duration before scheduling. This allows transitioning from static priority heuristics
            to dynamic Shortest Remaining Processing Time (SRPT) scheduling, minimizing waiting times mathematically.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
