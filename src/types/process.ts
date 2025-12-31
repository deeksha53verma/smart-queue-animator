export type ProcessState = 'new' | 'ready' | 'running' | 'waiting' | 'terminated';

export type SchedulingAlgorithm = 'fcfs' | 'sjf' | 'priority' | 'round-robin';

export type ProcessType = 'system' | 'user' | 'interactive' | 'batch';

export interface Process {
  id: string;
  name: string;
  type: ProcessType;
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

  // I/O Support
  ioStartTime?: number; // Relative to burst start (e.g., at 2ms of execution)
  ioDuration?: number;
  remainingIOTime?: number;

  // Stats
  totalIOTime?: number;
}

export const PROCESS_TYPE_CONFIG: Record<ProcessType, { label: string; color: string; defaultPriority: number; defaultBurst: number }> = {
  system: { label: 'System Update', color: 'bg-red-500', defaultPriority: 1, defaultBurst: 10 },
  interactive: { label: 'Interactive (Browser)', color: 'bg-blue-500', defaultPriority: 2, defaultBurst: 4 },
  user: { label: 'User App', color: 'bg-green-500', defaultPriority: 3, defaultBurst: 6 },
  batch: { label: 'Batch Job', color: 'bg-purple-500', defaultPriority: 4, defaultBurst: 15 },
};

export const PROCESS_OPERATIONS: Record<ProcessType, string[]> = {
  system: ['Kernel Update', 'Memory Alloc', 'Sec Check', 'Driver Init', 'Sys Call', 'Registry Scan'],
  user: ['Open File', 'Save Data', 'Calc Sheet', 'Draw UI', 'Sort List', 'Filter Data'],
  interactive: ['Render HTML', 'Handle Click', 'Req API', 'Parse DOM', 'Anim Frame', 'Load Image'],
  batch: ['Compiling', 'Link Object', 'Compress', 'Encrypt', 'Write Log', 'Batch Job']
};

export interface GanttChartEntry {
  processId: string;
  processName: string;
  startTime: number;
  endTime: number;
  isContextSwitch?: boolean; // New for CS visualization
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
