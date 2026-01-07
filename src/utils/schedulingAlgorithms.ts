import { Process, SchedulingAlgorithm, AlgorithmInfo } from '@/types/process';

export const algorithmInfo: Record<SchedulingAlgorithm, AlgorithmInfo> = {
  fcfs: {
    name: 'First Come First Serve (FCFS)',
    description: 'Processes are executed in the order they arrive in the ready queue.',
    concept: 'Non-preemptive scheduling based on arrival time. Uses FIFO queue structure.',
    pseudocode: `function FCFS(processes):
  sort processes by arrival_time
  current_time = 0
  for each process in queue:
    execute process`,
    pros: ['Simple to implement', 'No starvation', 'Fair in order of arrival'],
    cons: ['Convoy effect', 'High average waiting time'],
  },
  sjf: {
    name: 'Shortest Job First (SJF)',
    description: 'Process with the smallest total burst time is selected next. (Non-preemptive)',
    concept: 'Strategies to minimize waiting time by selecting shortest tasks first.',
    pseudocode: `function SJF(processes):
  sort ready_queue by burst_time
  select ready_queue[0]`,
    pros: ['Minimum average waiting time', 'Optimal for batch systems'],
    cons: ['Starvation of long processes', 'Requires knowing burst time'],
  },
  srtf: {
    name: 'Shortest Remaining Time First (SRTF)',
    description: 'Preemptive version of SJF. Process with smallest remaining time runs next.',
    concept: 'Dynamic priority based on remaining execution time.',
    pseudocode: `function SRTF(ready_queue):
  min_remaining = infinity
  selected = null
  for p in ready_queue:
    if p.remaining < min_remaining:
      selected = p
  return selected`,
    pros: ['Lowest average waiting time', 'Responsive for small tasks'],
    cons: ['Frequent context switches', 'Starvation possible', 'Overhead'],
  },
  priority: {
    name: 'Priority Scheduling',
    description: 'Processes with higher priority (lower number) execute first.',
    concept: 'Ranking processes by importance.',
    pseudocode: `function Priority(ready_queue):
  sort by priority (asc)
  select ready_queue[0]`,
    pros: ['Handles important tasks first', 'Good for real-time systems'],
    cons: ['Starvation (solved by aging)', 'Indefinite blocking'],
  },
  'round-robin': {
    name: 'Round Robin (RR)',
    description: 'Each process gets a fixed time quantum. Preemptive time-sharing.',
    concept: 'Fair allocation of CPU using time slices.',
    pseudocode: `function RR(queue, quantum):
  run process for quantum
  if not done, move to end of queue`,
    pros: ['Fair allocation', 'Response time guarantee', 'No starvation'],
    cons: ['Context switch overhead', 'Throughput depends on quantum'],
  },
  edf: {
    name: 'Earliest Deadline First (EDF)',
    description: 'Process with the closest absolute deadline is executed.',
    concept: 'Dynamic priority scheduling for Real-Time Systems.',
    pseudocode: `function EDF(ready_queue):
  sort by deadline (asc)
  select ready_queue[0]`,
    pros: ['Optimal dynamic priority algo', 'Meet deadlines if feasible'],
    cons: ['Complex validation', 'Domino effect on overload'],
  },
  mlq: {
    name: 'Multilevel Queue (MLQ)',
    description: 'Processes stay in fixed queues (System > Interactive > User > Batch).',
    concept: 'Classification of jobs into different queues with different priorities.',
    pseudocode: `function MLQ(queues):
  for q in [System, Interactive, User, Batch]:
    if q is not empty:
      return q.next()`,
    pros: ['Low scheduling overhead', 'Tailored for mix of jobs'],
    cons: ['Inflexible (fixed queues)', 'Starvation of lower queues'],
  },
  mlfq: {
    name: 'Multilevel Feedback Queue (MLFQ)',
    description: 'Dynamic queues. Processes move down if they use too much CPU, up if they wait, or stay for I/O.',
    concept: 'Adaptive scheduling that learns process behavior.',
    pseudocode: `function MLFQ(proc):
  use time slice in Current Q
  if quantum fully used:
    demote to Lower Q
  if yields for I/O:
    stay or promote`,
    pros: ['Flexible', 'Favors I/O bound', 'Prevents starvation (with aging)'],
    cons: ['Complex configuration', 'Gameable'],
  },
};

export function getNextProcess(
  processes: Process[],
  algorithm: SchedulingAlgorithm,
  currentTime: number
): Process | null {
  const readyProcesses = processes.filter(
    (p) => p.state === 'ready' && p.arrivalTime <= currentTime
  );

  if (readyProcesses.length === 0) {
    // Check for upcoming processes
    const upcomingProcesses = processes.filter(
      (p) => p.state === 'new' || p.state === 'ready'
    );
    return upcomingProcesses.length > 0 ? null : null;
  }

  // Helper for stable sort (Arrival time tie-breaker)
  const tieBreaker = (a: Process, b: Process) => {
    return a.arrivalTime - b.arrivalTime;
  };

  switch (algorithm) {
    case 'fcfs':
      return readyProcesses.reduce((prev, curr) =>
        prev.arrivalTime <= curr.arrivalTime ? prev : curr
      );

    case 'sjf':
      // Non-preemptive in standard SJF usually, but if 'ready', we pick shortest BURST, not remaining.
      // But user often conflates. Let's stick to standard SJF (Total Burst).
      // Actually, if we want TRUE SJF (Non-preemptive), we only select if CPU is idle.
      // But this function is usually called when CPU is free or preempting.
      // We will select based on Burst Time.
      return readyProcesses.reduce((prev, curr) =>
        prev.burstTime < curr.burstTime ? prev :
          (prev.burstTime === curr.burstTime ? (prev.arrivalTime < curr.arrivalTime ? prev : curr) : curr)
      );

    case 'srtf':
      // Shortest Remaining Time First
      return readyProcesses.reduce((prev, curr) =>
        prev.remainingTime < curr.remainingTime ? prev :
          (prev.remainingTime === curr.remainingTime ? (prev.arrivalTime < curr.arrivalTime ? prev : curr) : curr)
      );

    case 'priority':
      return readyProcesses.reduce((prev, curr) =>
        prev.priority < curr.priority ? prev :
          (prev.priority === curr.priority ? (prev.arrivalTime < curr.arrivalTime ? prev : curr) : curr)
      );

    case 'edf':
      // Earliest Deadline First
      // Assume deadline is absolute. If undefined, treat as infinity (lowest priority)
      return readyProcesses.reduce((prev, curr) => {
        const d1 = prev.deadline ?? Number.MAX_SAFE_INTEGER;
        const d2 = curr.deadline ?? Number.MAX_SAFE_INTEGER;
        return d1 < d2 ? prev : (d1 === d2 ? (prev.arrivalTime < curr.arrivalTime ? prev : curr) : curr);
      });

    case 'mlq':
      // System (1) > Interactive (2) > User (3) > Batch (4)
      // We use 'ProcessType' or 'Priority' map?
      // Let's assume we map Type to a queue index strictly.
      // System=0, Interactive=1, User=2, Batch=3.
      // We find the process in the highest priority non-empty 'queue'.
      // Within same queue: FCFS.
      const priorityOrder: Record<string, number> = { system: 0, interactive: 1, user: 2, batch: 3 };

      // Sort by mapped priority, then arrival
      return readyProcesses.reduce((prev, curr) => {
        const p1 = priorityOrder[prev.type] ?? 4;
        const p2 = priorityOrder[curr.type] ?? 4;
        if (p1 < p2) return prev;
        if (p1 > p2) return curr;
        return prev.arrivalTime <= curr.arrivalTime ? prev : curr;
      });

    case 'mlfq':
      // Processes have a 'queueLevel' (0, 1, 2).
      // Pick from Queue 0, then 1, then 2.
      // Within Queue: Queue 0 & 1 are usually RR (handled by logic/quantum checks), but SELECTION is essentially head of line.
      // But here we might just pick the highest priority available.
      // The Queue rotation logic (for RR within queue) is handled by 'readyQueueRef' in useScheduler usually?
      // Actually, MLFQ is complex for stateless selection. UseScheduler needs to manage the queues orders.
      // BUT for "next process" selection:
      // We pick the ready process with Lowest queueLevel.
      // If Tie: Arrival Time (FCFS) or we rely on the specific queue array order if passed (but we get 'processes').
      return readyProcesses.reduce((prev, curr) => {
        const q1 = prev.queueLevel ?? 0;
        const q2 = curr.queueLevel ?? 0;
        if (q1 < q2) return prev;
        if (q1 > q2) return curr;
        // Same queue level -> Arrival or RR logic needs stable queue. FCFS fallback here.
        return prev.arrivalTime <= curr.arrivalTime ? prev : curr;
      });

    case 'round-robin':
      // Round robin selection is handled by the queue rotation in the hook
      return readyProcesses[0];

    default:
      return readyProcesses[0];
  }
}

export function calculateStats(processes: Process[], currentTime: number) {
  const completed = processes.filter((p) => p.state === 'terminated');

  if (completed.length === 0) {
    return {
      cpuUtilization: 0,
      avgWaitingTime: 0,
      avgTurnaroundTime: 0,
      avgResponseTime: 0,
      throughput: 0,
      currentTime,
    };
  }

  const totalBurstTime = completed.reduce((sum, p) => sum + p.burstTime, 0);
  const avgWaitingTime = completed.reduce((sum, p) => sum + p.waitingTime, 0) / completed.length;
  const avgTurnaroundTime = completed.reduce((sum, p) => sum + p.turnaroundTime, 0) / completed.length;
  const avgResponseTime = completed.reduce((sum, p) => sum + p.responseTime, 0) / completed.length;
  const cpuUtilization = currentTime > 0 ? (totalBurstTime / currentTime) * 100 : 0;
  const throughput = currentTime > 0 ? completed.length / currentTime : 0;

  return {
    cpuUtilization: Math.min(cpuUtilization, 100),
    avgWaitingTime,
    avgTurnaroundTime,
    avgResponseTime,
    throughput,
    currentTime,
  };
}
