import { useState, useRef, useCallback } from 'react';
import { Process, SchedulingAlgorithm, GanttChartEntry, CPUStats } from '@/types/process';
import { getNextProcess, calculateStats } from '@/utils/schedulingAlgorithms';

export function useScheduler() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [algorithm, setAlgorithm] = useState<SchedulingAlgorithm>('fcfs');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [ganttChart, setGanttChart] = useState<GanttChartEntry[]>([]);
  const [speed, setSpeed] = useState(1);
  const [timeQuantum, setTimeQuantum] = useState(2);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentProcessRef = useRef<Process | null>(null);
  const quantumCounterRef = useRef(0);
  const readyQueueRef = useRef<string[]>([]);

  const addProcess = useCallback((name: string, arrivalTime: number, burstTime: number, priority: number) => {
    const newProcess: Process = {
      id: crypto.randomUUID(),
      name,
      arrivalTime,
      burstTime,
      remainingTime: burstTime,
      priority,
      state: 'new',
      waitingTime: 0,
      turnaroundTime: 0,
      responseTime: -1,
      startTime: null,
      completionTime: null,
    };
    setProcesses((prev) => [...prev, newProcess]);
  }, []);

  const removeProcess = useCallback((id: string) => {
    setProcesses((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const runSimulationStep = useCallback(() => {
    setProcesses((prev) => {
      const updated = prev.map((p) => ({ ...p }));
      const time = currentTime;

      // Move new processes to ready state if they've arrived
      updated.forEach((p) => {
        if (p.state === 'new' && p.arrivalTime <= time) {
          p.state = 'ready';
          if (algorithm === 'round-robin' && !readyQueueRef.current.includes(p.id)) {
            readyQueueRef.current.push(p.id);
          }
        }
      });

      // Get current running process
      const runningProcess = updated.find((p) => p.state === 'running');

      // Handle Round Robin preemption
      if (algorithm === 'round-robin' && runningProcess) {
        quantumCounterRef.current++;
        
        if (quantumCounterRef.current >= timeQuantum) {
          // Time quantum expired - preempt
          if (runningProcess.remainingTime > 0) {
            runningProcess.state = 'ready';
            readyQueueRef.current.push(runningProcess.id);
          }
          quantumCounterRef.current = 0;
          currentProcessRef.current = null;
        }
      }

      // If no running process, select next one
      if (!updated.some((p) => p.state === 'running')) {
        let nextProcess: Process | null = null;

        if (algorithm === 'round-robin') {
          // Get next from ready queue
          while (readyQueueRef.current.length > 0) {
            const nextId = readyQueueRef.current.shift();
            const candidate = updated.find((p) => p.id === nextId && p.state === 'ready');
            if (candidate) {
              nextProcess = candidate;
              break;
            }
          }
        } else {
          nextProcess = getNextProcess(updated, algorithm, time);
        }

        if (nextProcess) {
          const process = updated.find((p) => p.id === nextProcess!.id)!;
          process.state = 'running';
          
          if (process.startTime === null) {
            process.startTime = time;
            process.responseTime = time - process.arrivalTime;
          }
          
          currentProcessRef.current = process;
          quantumCounterRef.current = 0;

          // Add Gantt chart entry
          setGanttChart((prev) => {
            const lastEntry = prev[prev.length - 1];
            if (lastEntry && lastEntry.processId === process.id && lastEntry.endTime === time) {
              // Extend the last entry
              return [
                ...prev.slice(0, -1),
                { ...lastEntry, endTime: time + 1 },
              ];
            }
            return [
              ...prev,
              {
                processId: process.id,
                processName: process.name,
                startTime: time,
                endTime: time + 1,
              },
            ];
          });
        }
      } else {
        // Update Gantt chart for continuing process
        setGanttChart((prev) => {
          const lastEntry = prev[prev.length - 1];
          if (lastEntry && lastEntry.processId === runningProcess?.id) {
            return [
              ...prev.slice(0, -1),
              { ...lastEntry, endTime: time + 1 },
            ];
          }
          return prev;
        });
      }

      // Execute the running process
      const currentRunning = updated.find((p) => p.state === 'running');
      if (currentRunning) {
        currentRunning.remainingTime--;
        
        if (currentRunning.remainingTime <= 0) {
          currentRunning.state = 'terminated';
          currentRunning.completionTime = time + 1;
          currentRunning.turnaroundTime = currentRunning.completionTime - currentRunning.arrivalTime;
          currentRunning.waitingTime = currentRunning.turnaroundTime - currentRunning.burstTime;
          currentProcessRef.current = null;
          quantumCounterRef.current = 0;
        }
      }

      // Update waiting time for ready processes
      updated.forEach((p) => {
        if (p.state === 'ready') {
          p.waitingTime++;
        }
      });

      return updated;
    });

    setCurrentTime((prev) => prev + 1);
  }, [currentTime, algorithm, timeQuantum]);

  const startSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsRunning(true);
    setIsPaused(false);

    intervalRef.current = setInterval(() => {
      runSimulationStep();
    }, 1000 / speed);
  }, [runSimulationStep, speed]);

  const pauseSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPaused(true);
  }, []);

  const stepSimulation = useCallback(() => {
    runSimulationStep();
  }, [runSimulationStep]);

  const resetSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setProcesses((prev) =>
      prev.map((p) => ({
        ...p,
        state: 'new' as const,
        remainingTime: p.burstTime,
        waitingTime: 0,
        turnaroundTime: 0,
        responseTime: -1,
        startTime: null,
        completionTime: null,
      }))
    );
    setCurrentTime(0);
    setGanttChart([]);
    setIsRunning(false);
    setIsPaused(false);
    currentProcessRef.current = null;
    quantumCounterRef.current = 0;
    readyQueueRef.current = [];
  }, []);

  // Check if simulation is complete
  const allCompleted = processes.length > 0 && processes.every((p) => p.state === 'terminated');

  // Auto-stop when complete
  if (allCompleted && isRunning) {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
  }

  const stats: CPUStats = calculateStats(processes, currentTime);

  const runningProcess = processes.find((p) => p.state === 'running') || null;

  return {
    processes,
    algorithm,
    setAlgorithm,
    isRunning,
    isPaused,
    currentTime,
    ganttChart,
    speed,
    setSpeed,
    timeQuantum,
    setTimeQuantum,
    stats,
    runningProcess,
    addProcess,
    removeProcess,
    startSimulation,
    pauseSimulation,
    stepSimulation,
    resetSimulation,
    allCompleted,
  };
}
