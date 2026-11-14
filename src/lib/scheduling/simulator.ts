import {
  SimulationJobInput,
  SimulationResult,
  SchedulingAlgorithm,
  AlgorithmComparison,
} from './types';
import { runFifoSimulation } from './fifo';
import { runPrioritySimulation } from './priority';

export function simulate(
  algorithm: SchedulingAlgorithm,
  jobs: SimulationJobInput[],
  workerCount: number
): SimulationResult {
  if (algorithm === 'FIFO') {
    return runFifoSimulation(jobs, workerCount);
  }
  return runPrioritySimulation(jobs, workerCount);
}

export function compareAlgorithms(
  jobs: SimulationJobInput[],
  workerCount: number,
  workloadName: string = 'Current Workload'
): AlgorithmComparison {
  const fifo = runFifoSimulation(jobs, workerCount);
  const priority = runPrioritySimulation(jobs, workerCount);

  const avgWaitDiff = Number((priority.metrics.averageWaitingTime - fifo.metrics.averageWaitingTime).toFixed(2));
  const avgWaitPercentDiff =
    fifo.metrics.averageWaitingTime > 0
      ? Number(((avgWaitDiff / fifo.metrics.averageWaitingTime) * 100).toFixed(1))
      : 0;

  const avgCompletionDiff = Number(
    (priority.metrics.averageCompletionTime - fifo.metrics.averageCompletionTime).toFixed(2)
  );
  const makespanDiff = Number((priority.metrics.makespan - fifo.metrics.makespan).toFixed(2));
  const utilizationDiff = Number(
    ((priority.metrics.workerUtilization - fifo.metrics.workerUtilization) * 100).toFixed(1)
  );

  const determineWinner = (
    fifoVal: number,
    priorityVal: number,
    lowerIsBetter = true
  ): 'FIFO' | 'PRIORITY' | 'TIE' => {
    const delta = Math.abs(fifoVal - priorityVal);
    if (delta < 0.001) return 'TIE';
    if (lowerIsBetter) {
      return fifoVal < priorityVal ? 'FIFO' : 'PRIORITY';
    }
    return fifoVal > priorityVal ? 'FIFO' : 'PRIORITY';
  };

  const winner = {
    waitingTime: determineWinner(
      fifo.metrics.averageWaitingTime,
      priority.metrics.averageWaitingTime,
      true
    ),
    completionTime: determineWinner(
      fifo.metrics.averageCompletionTime,
      priority.metrics.averageCompletionTime,
      true
    ),
    makespan: determineWinner(
      fifo.metrics.makespan,
      priority.metrics.makespan,
      true
    ),
    workerUtilization: determineWinner(
      fifo.metrics.workerUtilization,
      priority.metrics.workerUtilization,
      false
    ),
  };

  const tradeoffAnalysis = generateTradeoffAnalysis(fifo, priority);

  return {
    workloadName,
    workerCount,
    jobCount: jobs.length,
    fifo,
    priority,
    diff: {
      avgWaitDiff,
      avgWaitPercentDiff,
      avgCompletionDiff,
      makespanDiff,
      utilizationDiff,
    },
    winner,
    tradeoffAnalysis,
  };
}

function generateTradeoffAnalysis(
  fifo: SimulationResult,
  priority: SimulationResult
): string[] {
  const notes: string[] = [];

  const fWait = fifo.metrics.averageWaitingTime;
  const pWait = priority.metrics.averageWaitingTime;
  const fMake = fifo.metrics.makespan;
  const pMake = priority.metrics.makespan;

  // 1. High Priority vs Low Priority Impact
  const fCrit = fifo.metrics.priorityBreakdown.find((b) => b.priority === 'CRITICAL');
  const pCrit = priority.metrics.priorityBreakdown.find((b) => b.priority === 'CRITICAL');
  const fLow = fifo.metrics.priorityBreakdown.find((b) => b.priority === 'LOW');
  const pLow = priority.metrics.priorityBreakdown.find((b) => b.priority === 'LOW');

  if (pCrit && fCrit && pCrit.count > 0) {
    if (pCrit.avgWaitingTime < fCrit.avgWaitingTime) {
      const saved = (fCrit.avgWaitingTime - pCrit.avgWaitingTime).toFixed(1);
      notes.push(
        `Critical Job Acceleration: Priority scheduling reduced CRITICAL job wait time by ${saved}s (${pCrit.avgWaitingTime}s vs ${fCrit.avgWaitingTime}s in FIFO), fulfilling SLA requirements for urgent tasks.`
      );
    } else if (pCrit.avgWaitingTime === fCrit.avgWaitingTime) {
      notes.push(
        `Critical Jobs Handled Promptly: Both schedulers granted immediate or near-zero wait to CRITICAL jobs due to available worker concurrency.`
      );
    }
  }

  // 2. Starvation / Tail Latency analysis
  if (pLow && fLow && pLow.count > 0) {
    if (pLow.avgWaitingTime > fLow.avgWaitingTime) {
      const extra = (pLow.avgWaitingTime - fLow.avgWaitingTime).toFixed(1);
      notes.push(
        `Low-Priority Deprioritization: Under Priority scheduling, LOW priority jobs waited ${extra}s longer on average (${pLow.avgWaitingTime}s vs ${fLow.avgWaitingTime}s in FIFO). This exhibits classic priority starvation when queues remain saturated.`
      );
    }
  }

  // 3. Makespan and Throughput analysis
  if (Math.abs(fMake - pMake) < 0.05) {
    notes.push(
      `Equivalent Total Makespan: Both algorithms required identical total span (${fMake}s) to complete all jobs because total work volume and worker count remained constant without preemption overhead.`
    );
  } else if (pMake < fMake) {
    notes.push(
      `Makespan Efficiency: Priority finished ${ (fMake - pMake).toFixed(1) }s earlier (${pMake}s vs ${fMake}s), optimizing worker packing based on order of dispatched tasks.`
    );
  } else {
    notes.push(
      `Worker Packing Variation: FIFO achieved a tighter makespan (${fMake}s vs ${pMake}s) by dispatching tasks strictly as workers became free without waiting for higher priority queue insertions.`
    );
  }

  // 4. Fairness vs Urgency trade-off
  if (pWait < fWait) {
    notes.push(
      `Overall Latency Win for Priority: Average waiting time across all jobs decreased by ${(fWait - pWait).toFixed(1)}s under Priority scheduling.`
    );
  } else if (fWait < pWait) {
    notes.push(
      `Fairness Advantage of FIFO: FIFO produced lower overall mean waiting time (${fWait}s vs ${pWait}s) and avoided artificial delay of early-arriving low/medium tasks.`
    );
  } else {
    notes.push(
      `Identical Wait Latency: Both algorithms exhibited equivalent average waiting times (${fWait}s), indicating worker capacity easily handled the arrival rate without heavy queue backpressure.`
    );
  }

  // 5. Architectural Recommendation
  notes.push(
    `Distributed Architecture Recommendation: For mixed production workloads, a Hybrid Priority Queue with Aging (aging jobs over time to prevent starvation) or Weighted Fair Queuing (WFQ) offers the optimal balance between SLA urgency and fairness.`
  );

  return notes;
}
