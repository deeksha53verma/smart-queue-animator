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
    description: 'Process with the smallest burst time is selected next from the ready queue.',
    concept: 'Non-preemptive scheduling that minimizes average waiting time. Optimal for batch systems.',
    pseudocode: `function SJF(processes):
  current_time = 0
  completed = []
  
  while processes not empty:
    available = filter(p => p.arrival <= current_time)
    if available is empty:
      current_time = min(process.arrival)
      continue
    
    shortest = min(available, by burst_time)
    execute(shortest)
    shortest.waiting = current_time - shortest.arrival
    current_time += shortest.burst_time
    completed.push(shortest)`,
    pros: ['Minimum average waiting time', 'Good for batch systems', 'Efficient CPU utilization'],
    cons: ['Starvation of long processes', 'Requires burst time prediction', 'Not suitable for interactive'],
  },
  priority: {
    name: 'Priority Scheduling',
    description: 'Each process is assigned a priority. Higher priority processes execute first.',
    concept: 'Can be preemptive or non-preemptive. Lower number = higher priority in this simulation.',
    pseudocode: `function Priority(processes):
  current_time = 0
  
  while processes not empty:
    available = filter(p => p.arrival <= current_time)
    if available is empty:
      current_time = min(process.arrival)
      continue
    
    highest = min(available, by priority_number)
    // Lower priority number = higher priority
    execute(highest)
    highest.waiting = current_time - highest.arrival
    current_time += highest.burst_time
    mark as completed`,
    pros: ['Important tasks run first', 'Flexible prioritization', 'Good for real-time systems'],
    cons: ['Starvation possible', 'Priority inversion problem', 'Subjective priority assignment'],
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
      return readyProcesses.reduce((prev, curr) =>
        prev.remainingTime <= curr.remainingTime ? prev : curr
      );

    case 'priority':
      return readyProcesses.reduce((prev, curr) =>
        prev.priority <= curr.priority ? prev : curr
      );

    case 'round-robin':
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
