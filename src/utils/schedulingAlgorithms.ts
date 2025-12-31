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
    if current_time < process.arrival:
      current_time = process.arrival
    
    process.start = current_time
    process.waiting = current_time - process.arrival
    current_time += process.burst_time
    process.completion = current_time
    process.turnaround = completion - arrival`,
    pros: ['Simple to implement', 'No starvation', 'Fair in order of arrival'],
    cons: ['Convoy effect', 'High average waiting time', 'Not optimal for time-sharing'],
  },
  sjf: {
    name: 'Shortest Job First (SJF)',
    description: 'Process with the smallest total burst time is selected next.',
    concept: 'Non-preemptive algorithm by default. Selects the process with the shortest execution time from the ready queue.',
    pseudocode: `function SJF(processes):
  // Sort by Burst Time, then Arrival Time
  ready_queue.sort((a, b) => {
    if (a.burst != b.burst) return a.burst - b.burst
    return a.arrival - b.arrival
  })

  // Select first process
  next_process = ready_queue[0]
  execute_until_completion(next_process)`,
    pros: ['Minimum average waiting time', 'Optimal for batch systems'],
    cons: ['Starvation of long processes', 'Requires knowing burst time in advance'],
  },
  priority: {
    name: 'Priority Scheduling',
    description: 'Processes with higher priority (lower number) execute first.',
    concept: 'Selects the highest priority process from the ready queue. Be careful of starvation!',
    pseudocode: `function Priority(processes):
  // Sort by Priority (Ascending), then Arrival
  ready_queue.sort((a, b) => {
    if (a.priority != b.priority) 
      return a.priority - b.priority
    return a.arrival - b.arrival
  })

  next_process = ready_queue[0]
  execute(next_process)`,
    pros: ['Handles important tasks first', 'Good for real-time systems'],
    cons: ['Starvation of low-pri processes (solved by aging)', 'Indefinite blocking'],
  },
  'round-robin': {
    name: 'Round Robin (RR)',
    description: 'Each process gets a fixed time quantum. Preemptive time-sharing algorithm.',
    concept: 'Preemptive scheduling designed for time-sharing. Uses circular queue with context switching.',
    pseudocode: `function RoundRobin(processes, quantum):
  queue = processes sorted by arrival
  current_time = 0
  
  while queue not empty:
    process = queue.dequeue()
    
    if process.remaining <= quantum:
      current_time += process.remaining
      process.remaining = 0
      mark as completed
    else:
      current_time += quantum
      process.remaining -= quantum
      queue.enqueue(process)  // Re-add to end
    
    // Context switch overhead`,
    pros: ['Fair CPU allocation', 'Good response time', 'No starvation'],
    cons: ['Context switch overhead', 'Performance depends on quantum', 'Higher average waiting time'],
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

  switch (algorithm) {
    case 'fcfs':
      return readyProcesses.reduce((prev, curr) =>
        prev.arrivalTime <= curr.arrivalTime ? prev : curr
      );

    case 'sjf':
      // Non-preemptive SJF: Select process with shortest initial burst time
      // Note: In non-preemptive, we typically don't interrupt, but this function is called
      // when CPU is free.
      return readyProcesses.reduce((prev, curr) =>
        prev.burstTime < curr.burstTime ? prev :
          // Tie-breaker: Arrival time
          (prev.burstTime === curr.burstTime && prev.arrivalTime < curr.arrivalTime) ? prev : curr
      );

    case 'priority':
      return readyProcesses.reduce((prev, curr) =>
        // Lower number = Top priority
        prev.priority < curr.priority ? prev :
          // Tie-breaker: Arrival time
          (prev.priority === curr.priority && prev.arrivalTime < curr.arrivalTime) ? prev : curr
      );

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
