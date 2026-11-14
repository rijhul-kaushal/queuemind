import { runFifoSimulation } from '../src/lib/scheduling/fifo';
import { runPrioritySimulation } from '../src/lib/scheduling/priority';
import { compareAlgorithms } from '../src/lib/scheduling/simulator';
import { SimulationJobInput } from '../src/lib/scheduling/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('--- RUNNING QUEUEMIND SCHEDULING ENGINE UNIT TESTS ---\n');

// 1. Empty workload handling
{
  const res = runFifoSimulation([], 2);
  assert(res.scheduledJobs.length === 0, 'Empty workload produces 0 scheduled jobs');
  assert(res.metrics.makespan === 0, 'Empty workload has makespan 0');
  assert(res.metrics.workerUtilization === 0, 'Empty workload has utilization 0');
  assert(res.metrics.averageWaitingTime === 0, 'Empty workload has avg wait 0');
}

// 2. Invalid inputs filtering
{
  const invalidJobs: SimulationJobInput[] = [
    { id: '1', name: 'Zero duration', arrivalTime: 0, duration: 0, priority: 'HIGH' },
    { id: '2', name: 'Negative duration', arrivalTime: 0, duration: -5, priority: 'LOW' },
    { id: '3', name: 'Valid job', arrivalTime: 0, duration: 4, priority: 'MEDIUM' },
  ];
  const res = runFifoSimulation(invalidJobs, 1);
  assert(res.scheduledJobs.length === 1, 'Filters out jobs with duration <= 0');
  assert(res.scheduledJobs[0].name === 'Valid job', 'Keeps valid job');
}

// 3. FIFO single worker arrival order
{
  const jobs: SimulationJobInput[] = [
    { id: 'j1', name: 'Job 1', arrivalTime: 0, duration: 5, priority: 'LOW' },
    { id: 'j2', name: 'Job 2', arrivalTime: 2, duration: 3, priority: 'CRITICAL' },
  ];
  const res = runFifoSimulation(jobs, 1);
  assert(res.scheduledJobs[0].id === 'j1', 'FIFO schedules j1 first (arrived at 0)');
  assert(res.scheduledJobs[0].startTime === 0, 'j1 starts at 0');
  assert(res.scheduledJobs[0].finishTime === 5, 'j1 finishes at 5');
  assert(res.scheduledJobs[0].waitingTime === 0, 'j1 wait time is 0');

  assert(res.scheduledJobs[1].id === 'j2', 'FIFO schedules j2 second (FIFO respects arrival order over priority)');
  assert(res.scheduledJobs[1].startTime === 5, 'j2 starts at 5 when worker 1 finishes j1');
  assert(res.scheduledJobs[1].waitingTime === 3, 'j2 wait time is 5 - 2 = 3s');
  assert(res.scheduledJobs[1].completionTime === 6, 'j2 completion time is 8 - 2 = 6s');
  assert(res.metrics.makespan === 8, 'Makespan is 8s');
}

// 4. Priority scheduling on single worker with queued jobs
{
  // Both jobs arrived before t=5. At t=5, worker picks highest priority.
  const jobs: SimulationJobInput[] = [
    { id: 'j1', name: 'Long job', arrivalTime: 0, duration: 5, priority: 'LOW' },
    { id: 'j2', name: 'Medium job', arrivalTime: 1, duration: 2, priority: 'MEDIUM' },
    { id: 'j3', name: 'Critical job', arrivalTime: 2, duration: 3, priority: 'CRITICAL' },
  ];
  const res = runPrioritySimulation(jobs, 1);
  // j1 starts at 0 (only one available at 0)
  assert(res.scheduledJobs[0].id === 'j1', 'j1 starts at 0 non-preemptively');
  // At t=5, both j2 and j3 are in readyQueue. j3 has CRITICAL priority > j2 MEDIUM.
  assert(res.scheduledJobs[1].id === 'j3', 'j3 (CRITICAL) is scheduled before j2 (MEDIUM)');
  assert(res.scheduledJobs[1].startTime === 5, 'j3 starts at 5');
  assert(res.scheduledJobs[1].waitingTime === 3, 'j3 wait time is 5 - 2 = 3s');
  // Then j2 is scheduled at t=8
  assert(res.scheduledJobs[2].id === 'j2', 'j2 is scheduled last');
  assert(res.scheduledJobs[2].startTime === 8, 'j2 starts at 8');
  assert(res.scheduledJobs[2].waitingTime === 7, 'j2 wait time is 8 - 1 = 7s');
}

// 5. Equal-priority tie breaking preserves arrival order
{
  const jobs: SimulationJobInput[] = [
    { id: 'h1', name: 'High 1', arrivalTime: 1, duration: 2, priority: 'HIGH' },
    { id: 'h2', name: 'High 2', arrivalTime: 2, duration: 2, priority: 'HIGH' },
  ];
  const res = runPrioritySimulation(jobs, 1);
  assert(res.scheduledJobs[0].id === 'h1', 'Equal priority tie breaks in arrival order (h1 first)');
  assert(res.scheduledJobs[1].id === 'h2', 'h2 scheduled after h1');
}

// 6. Multi-worker load distribution
{
  const jobs: SimulationJobInput[] = [
    { id: 'm1', name: 'Job A', arrivalTime: 0, duration: 4, priority: 'HIGH' },
    { id: 'm2', name: 'Job B', arrivalTime: 0, duration: 4, priority: 'HIGH' },
    { id: 'm3', name: 'Job C', arrivalTime: 0, duration: 4, priority: 'HIGH' },
    { id: 'm4', name: 'Job D', arrivalTime: 0, duration: 4, priority: 'HIGH' },
  ];
  const res = runFifoSimulation(jobs, 2);
  assert(res.scheduledJobs.length === 4, 'All 4 jobs scheduled');
  const w1Jobs = res.scheduledJobs.filter((j) => j.assignedWorkerId === 1);
  const w2Jobs = res.scheduledJobs.filter((j) => j.assignedWorkerId === 2);
  assert(w1Jobs.length === 2 && w2Jobs.length === 2, 'Workload is evenly split across 2 workers');
  assert(res.metrics.makespan === 8, 'Makespan is 8 seconds on 2 workers');
  assert(res.metrics.workerUtilization === 1.0, 'Worker utilization is 100% (1.0)');
}

// 7. Staggered arrivals with idle gaps
{
  const jobs: SimulationJobInput[] = [
    { id: 'gap1', name: 'Job 1', arrivalTime: 0, duration: 2, priority: 'HIGH' },
    { id: 'gap2', name: 'Job 2', arrivalTime: 10, duration: 2, priority: 'HIGH' },
  ];
  const res = runFifoSimulation(jobs, 1);
  assert(res.scheduledJobs[0].finishTime === 2, 'Job 1 finishes at 2');
  assert(res.scheduledJobs[1].startTime === 10, 'Job 2 starts at arrival time 10, not earlier');
  assert(res.scheduledJobs[1].waitingTime === 0, 'Job 2 wait time is 0');
  assert(res.metrics.makespan === 12, 'Makespan spans from arrival 0 to finish 12');
  // Total busy time = 4. Worker count = 1. Capacity = 1 * 12 = 12. Utilization = 4/12 = 0.3333
  assert(Math.abs(res.metrics.workerUtilization - 0.3333) < 0.01, 'Worker utilization accounts for idle gap');
}

// 8. Algorithm Comparison Runner
{
  const jobs: SimulationJobInput[] = [
    { id: 'c1', name: 'ETL Heavy', arrivalTime: 0, duration: 10, priority: 'LOW' },
    { id: 'c2', name: 'Batch Sync', arrivalTime: 1, duration: 8, priority: 'LOW' },
    { id: 'c3', name: 'Alert Critical', arrivalTime: 2, duration: 2, priority: 'CRITICAL' },
  ];
  const comp = compareAlgorithms(jobs, 1, 'Convoy Test');
  assert(comp.fifo.metrics.averageWaitingTime > comp.priority.metrics.averageWaitingTime,
    'Priority achieves lower average waiting time when multiple jobs wait in queue');
  assert(comp.winner.waitingTime === 'PRIORITY', 'Priority wins waiting time on queued convoy workload');
  assert(comp.tradeoffAnalysis.length > 0, 'Generated detailed tradeoff analysis points');
}

console.log('\n🎉 ALL SCHEDULING ENGINE UNIT TESTS PASSED SUCCESSFULLY!\n');
