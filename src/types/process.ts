export type ProcessState = 'new' | 'ready' | 'running' | 'waiting' | 'terminated';

export type SchedulingAlgorithm = 'fcfs' | 'sjf' | 'priority' | 'round-robin';

export interface Process {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  remainingTime: number;
  priority: number;
  state: ProcessState;
  waitingTime: number;
  turnaroundTime: number;
  responseTime: number;
  startTime: number | null;
  completionTime: number | null;
}

export interface GanttChartEntry {
  processId: string;
  processName: string;
  startTime: number;
  endTime: number;
}

export interface CPUStats {
  cpuUtilization: number;
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  avgResponseTime: number;
  throughput: number;
  currentTime: number;
}

export interface AlgorithmInfo {
  name: string;
  description: string;
  concept: string;
  pseudocode: string;
  pros: string[];
  cons: string[];
}
