import { useState, useRef, useCallback, useEffect } from 'react';
import { Process, SchedulingAlgorithm, GanttChartEntry, CPUStats } from '@/types/process';
import { getNextProcess, calculateStats } from '@/utils/schedulingAlgorithms';
import { LogEntry } from '@/components/DecisionLog';

export function useScheduler() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [algorithm, setAlgorithm] = useState<SchedulingAlgorithm>('fcfs');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [ganttChart, setGanttChart] = useState<GanttChartEntry[]>([]);
  const [speed, setSpeed] = useState(0.5);
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Refs for logic state
  const currentProcessRef = useRef<Process | null>(null);
  const quantumCounterRef = useRef(0);
  const readyQueueRef = useRef<string[]>([]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info', time?: number) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      time: time !== undefined ? time : currentTime, // Use provided time or current state time (closure warning: might be stale if not careful, but okay for manual adds)
      message,
      type
    }]);
  }, [currentTime]); // Depend on currentTime if we use it default

  // We need a ref for addLog to be used inside intervals/callbacks without staleness if it used state, 
  // but here it only uses setLogs (safe) and currentTime (might be stale in interval).
  // However, in runSimulationStep, we have the 'time' variable local to the step.
  // Let's allow passing time explicitly.

  const addProcess = useCallback((name: string, arrivalTime: number, burstTime: number, priority: number, type: Process['type'] = 'user', ioStartTime?: number, ioDuration?: number, deadline?: number) => {
    const newProcess: Process = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      arrivalTime,
      burstTime,
      remainingTime: burstTime,
      priority,
      state: 'new',
      queueLevel: 0, // Default to highest queue for MLFQ
      deadline,
      waitingTime: 0,
      turnaroundTime: 0,
      responseTime: -1,
      startTime: null,
      completionTime: null,
      ioStartTime,
      ioDuration,
      remainingIOTime: ioDuration || 0,
      totalIOTime: 0
    };
    setProcesses((prev) => [...prev, newProcess]);

    // We can't easily access the *latest* currentTime here inside standard callback without ref, 
    // but for 'addProcess', it usually happens when simulation is 0 or running.
    // Let's just log with current arrival time.
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      time: arrivalTime,
      message: `Process ${name} added (Burst: ${burstTime}, Priority: ${priority})`,
      type: 'info'
    }]);
  }, []);

  const removeProcess = useCallback((id: string) => {
    setProcesses((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const runSimulationStep = useCallback(() => {
    setProcesses((prev) => {
      const updated = prev.map((p) => ({ ...p }));
      // We need the current time from state to be consistent
      // But inside setProcesses setter, we don't have access to the *pending* new time.
      // However, 'currentTime' in outer scope is the *start* of this step.
      const time = currentTime;

      // Helper to add log inside this reducer-like logic
      // Note: We can't call setLogs here because we are in another setter.
      // We should probably decouple logging or use a ref for logs, but to keep it simple:
      // We will queue logs to be added.
      // ACTUALLY: Calling setLogs inside setProcesses is bad practice (side effect).
      // But for this simple app, we might get away with it if we wrap it in setTimeout or use a separate effect.
      // BETTER APPROACH: Return updated processes AND updated logs? No, useScheduler returns them separately.

      // ALTERNATIVE: Calculate the logs we want to add and call setLogs AFTER the map updates.
      // But we are inside the callback.

      // Let's use a temporary array for logs this tick
      const newLogs: LogEntry[] = [];
      const log = (msg: string, type: LogEntry['type'] = 'info') => {
        newLogs.push({
          id: Math.random().toString(36).substr(2, 9),
          time,
          message: msg,
          type
        });
      };

      // Handle Context Switching state
      // (Removed Context Switching Logic)

      // Move new processes to ready state if they've arrived
      updated.forEach((p) => {
        if (p.state === 'new' && p.arrivalTime <= time) {
          p.state = 'ready';
          // Initialize queueLevel if undefined
          if (p.queueLevel === undefined) p.queueLevel = 0;

          if ((algorithm === 'round-robin' || algorithm === 'mlfq') && !readyQueueRef.current.includes(p.id)) {
            // For MLFQ, we might want separate queues, but for simplicity we manage one ID list 
            // and filter by queueLevel in getNextProcess. 
            // However, RR rotation needs explicit queue.
            // Let's rely on 'readyQueue' for RR/MLFQ rotation order.
            readyQueueRef.current.push(p.id);
          }
        }
      });

      // Handle I/O Waiting Processes
      updated.forEach((p) => {
        if (p.state === 'waiting') {
          p.remainingIOTime = (p.remainingIOTime || 0) - 1;
          p.totalIOTime = (p.totalIOTime || 0) + 1;

          if ((p.remainingIOTime || 0) <= 0) {
            p.state = 'ready';
            p.remainingIOTime = p.ioDuration || 0; // Reset for next I/O if recursive? Or just one off? Plan said one off usually, or we reset. Let's assume one-off for now or loop?

            // For MLFQ: I/O usually keeps priority or promotes?
            // Standard Rule: If process gives up CPU before quantum expires, it stays at same priority.
            // Some variations promote. Let's start with STAY.
            // p.queueLevel remains same.

            if (algorithm === 'round-robin' || algorithm === 'mlfq') {
              readyQueueRef.current.push(p.id);
            }
            log(`Process ${p.name} completed I/O and moved to Ready.`, 'info');
          }
        }
      });

      // Get current running process
      const runningProcess = updated.find((p) => p.state === 'running');

      // Handle Round Robin & MLFQ preemption/quantum
      if ((algorithm === 'round-robin' || algorithm === 'mlfq') && runningProcess) {
        quantumCounterRef.current++;

        // Determine effective quantum for MLFQ
        let effectiveQuantum = timeQuantum;
        if (algorithm === 'mlfq') {
          // Rule: Q0 = 4, Q1 = 8, Q2 = FCFS (Infinity)
          // We can use base 'timeQuantum' as multiplier or fixed 4.
          const q = runningProcess.queueLevel || 0;
          if (q === 0) effectiveQuantum = 4;
          else if (q === 1) effectiveQuantum = 8;
          else effectiveQuantum = 999999; // FCFS
        }

        if (quantumCounterRef.current >= effectiveQuantum) {
          // Time quantum expired - preempt
          if (runningProcess.remainingTime > 0) {
            runningProcess.state = 'ready';

            // MLFQ Rule: If used full quantum, demote
            if (algorithm === 'mlfq') {
              const currentQ = runningProcess.queueLevel || 0;
              if (currentQ < 2) {
                runningProcess.queueLevel = currentQ + 1;
                log(`${runningProcess.name} demoted to Queue ${runningProcess.queueLevel}`, 'warning');
              }
            }

            readyQueueRef.current.push(runningProcess.id);
            log(`Time Quantum expired for ${runningProcess.name}. Moved to ready queue.`, 'info');

            // Trigger Context Switch
            // (Removed CS Trigger)
          }
          quantumCounterRef.current = 0;
          currentProcessRef.current = null;
        }
      }

      // Check for I/O Interrupt
      if (runningProcess && runningProcess.ioStartTime !== undefined && runningProcess.ioDuration) {
        const elapsedTime = runningProcess.burstTime - runningProcess.remainingTime;
        // Check if we hit the I/O start time AND we haven't already finished this I/O (checked by remainingIOTime > 0 if we assume resetting, but complex)
        // Simplified: If elapsedTime == ioStartTime && state is running
        if (Math.abs(elapsedTime - runningProcess.ioStartTime) < 0.1 && runningProcess.remainingIOTime && runningProcess.remainingIOTime > 0) {
          runningProcess.state = 'waiting';
          currentProcessRef.current = null;
          quantumCounterRef.current = 0;
          log(`Process ${runningProcess.name} started I/O wait.`, 'warning');

          // Trigger Context Switch? Usually yes, CPU is free.
          // (Removed CS Trigger)
        }
      }

      // Preemption Check for SJF (SRTF), Priority, and EDF
      const preemptiveAlgos = ['sjf', 'srtf', 'priority', 'edf', 'mlq', 'mlfq'];
      // Note: MLFQ is preemptive if higher prio arrives. MLQ also.

      if (runningProcess && preemptiveAlgos.includes(algorithm)) {
        const potentialBetter = getNextProcess(updated, algorithm, time);

        if (potentialBetter && potentialBetter.id !== runningProcess.id) {
          // Check if we should preempt
          let shouldPreempt = false;

          // MLFQ/MLQ Preemption: Higher Queue (Lower Index) preempts Lower Queue
          if (algorithm === 'mlfq' || algorithm === 'mlq') {
            const runningQ = algorithm === 'mlfq'
              ? (runningProcess.queueLevel || 0)
              : ({ system: 0, interactive: 1, user: 2, batch: 3 }[runningProcess.type] ?? 4);

            const betterQ = algorithm === 'mlfq'
              ? (potentialBetter.queueLevel || 0)
              : ({ system: 0, interactive: 1, user: 2, batch: 3 }[potentialBetter.type] ?? 4);

            if (betterQ < runningQ) {
              shouldPreempt = true;
            }
          }
          // SRTF Preemption
          else if (algorithm === 'srtf' || algorithm === 'sjf') {
            // For SRTF: Preempt if candidate has shorter remaining time
            if (potentialBetter.remainingTime < runningProcess.remainingTime) {
              shouldPreempt = true;
            }
          }
          // Priority Preemption
          else if (algorithm === 'priority') {
            if (potentialBetter.priority < runningProcess.priority) {
              shouldPreempt = true;
            }
          }
          // EDF Preemption
          else if (algorithm === 'edf') {
            // Preempt if new process has earlier deadline
            const d1 = runningProcess.deadline ?? Number.MAX_SAFE_INTEGER;
            const d2 = potentialBetter.deadline ?? Number.MAX_SAFE_INTEGER;
            if (d2 < d1) {
              shouldPreempt = true;
            }
          }

          if (shouldPreempt) {
            runningProcess.state = 'ready';
            currentProcessRef.current = null;
            // Add back to ready queue logic for RR/MLFQ if needed
            if (algorithm === 'mlfq') {
              // Preempted by higher priority -> put at HEAD of its queue or Tail? 
              // Usually Tail of its level.
              readyQueueRef.current.push(runningProcess.id);
            }

            // Ensure it's available for selection immediately
            // The selection logic below will pick 'potentialBetter'
            log(`Preempting ${runningProcess.name} for ${potentialBetter.name}`, 'warning');
          }
        }
      }

      // If no running process (and not switching), select next one
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
        }
        else if (algorithm === 'mlfq') {
          // For MLFQ, we need to pick from Highest Priority Queue (0) first.
          // We can reuse 'getNextProcess' to find the *Best* candidate.
          // But if it's RR within queue, we need to respect the rotation.
          // Simplified MLFQ: Just use getNextProcess which picks Lowest QueueLevel.
          // We don't implement full Queue Rotation within levels for this complexity yet.
          // It defaults to FCFS within levels unless we implement multiple readyQueues.
          // Let's stick to getNextProcess which is FCFS per level.
          nextProcess = getNextProcess(updated, algorithm, time);

          // If we picked one, and there are others same level, FCFS does head of line.
          // To do RR within levels, we'd need multiple refs. 
          // Let's accept FCFS within levels for now, or just RR globally?
          // getNextProcess uses FCFS for tie-breaking.
        }
        else {
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

          log(`Selected ${process.name} for execution.`, 'success');

          // Add Gantt chart entry
          setGanttChart((prevGantt) => {
            const lastEntry = prevGantt[prevGantt.length - 1];
            if (lastEntry && lastEntry.processId === process.id && lastEntry.endTime === time && !lastEntry.isContextSwitch) {
              return [
                ...prevGantt.slice(0, -1),
                { ...lastEntry, endTime: time + 1 },
              ];
            }
            return [
              ...prevGantt,
              {
                processId: process.id,
                processName: process.name,
                startTime: time,
                endTime: time + 1,
              },
            ];
          });
        } else {
          // No next process found -> CPU IDLE or I/O Wait
          const hasWaiting = updated.some(p => p.state === 'waiting');
          const typeId = hasWaiting ? 'io-wait' : 'idle';
          const typeName = hasWaiting ? 'I/O Wait' : 'Idle';

          setGanttChart((prevGantt) => {
            const lastEntry = prevGantt[prevGantt.length - 1];
            if (lastEntry && lastEntry.processId === typeId && lastEntry.endTime === time) {
              return [
                ...prevGantt.slice(0, -1),
                { ...lastEntry, endTime: time + 1 },
              ];
            }
            return [
              ...prevGantt,
              {
                processId: typeId,
                processName: typeName,
                startTime: time,
                endTime: time + 1,
              },
            ];
          });
        }
      } else if (runningProcess) {
        // Update Gantt chart for continuing process
        setGanttChart((prevGantt) => {
          const lastEntry = prevGantt[prevGantt.length - 1];
          if (lastEntry && lastEntry.processId === runningProcess?.id && !lastEntry.isContextSwitch) {
            return [
              ...prevGantt.slice(0, -1),
              { ...lastEntry, endTime: time + 1 },
            ];
          }
          // Fallback if gap (shouldn't happen)
          return prevGantt;
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
          currentRunning.waitingTime = currentRunning.turnaroundTime - currentRunning.burstTime - (currentRunning.totalIOTime || 0);
          currentProcessRef.current = null;
          quantumCounterRef.current = 0;
          log(`Process ${currentRunning.name} completed!`, 'success');

          // Trigger CS on termination as well? Usually scheduler runs.
          // (Removed CS Trigger on Termination)
        }
      }

      // Update waiting time for ready processes
      updated.forEach((p) => {
        if (p.state === 'ready') {
          p.waitingTime++;
        }
      });

      // Commit logs
      if (newLogs.length > 0) {
        setLogs(prevLog => [...prevLog, ...newLogs]);
      }

      return updated;
    });

    // Check if we should stop (if empty)
    if (processes.length === 0) {
      setIsRunning(false);
      setIsPaused(false);
      return;
    }

    // Removing the explicit useEffect for stopping here because we do it in the loop state update usually
    // But since we are in callback, we can't stop the effect *from here* directly other than state.
    // The previous useEffect implementation for auto-stop is good.

    setCurrentTime((prev) => prev + 1);
  }, [currentTime, algorithm, timeQuantum, processes.length]);

  // Use a ref to hold the latest runSimulationStep without triggering effect
  const runSimulationStepRef = useRef(runSimulationStep);

  useEffect(() => {
    runSimulationStepRef.current = runSimulationStep;
  }, [runSimulationStep]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const loop = () => {
      if (isRunning && !isPaused) {
        runSimulationStepRef.current();
        timeoutId = setTimeout(loop, 1000 / speed);
      }
    };

    if (isRunning && !isPaused) {
      timeoutId = setTimeout(loop, 1000 / speed);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isRunning, isPaused, speed]);

  const startSimulation = useCallback(() => {
    if (processes.length === 0) {
      addLog("Cannot start simulation: No processes added.", "error");
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
  }, [processes.length, addLog]);

  const pauseSimulation = useCallback(() => {
    setIsPaused(true);
  }, []);

  const stepSimulation = useCallback(() => {
    runSimulationStep();
  }, [runSimulationStep]);

  // Lint cleanups: removed intervalRef references from previous step that might have remained in other functions?
  // (We fixed start/pause/reset in previous step but let's ensure reset is clean)
  const resetSimulation = useCallback(() => {
    setProcesses((prev) =>
      prev.map((p) => ({
        ...p,
        state: 'new' as const,
        remainingTime: p.burstTime,
        queueLevel: 0, // Reset MLFQ level
        waitingTime: 0,
        turnaroundTime: 0,
        responseTime: -1,
        startTime: null,
        completionTime: null,
        remainingIOTime: p.ioDuration || 0, // Reset I/O
        totalIOTime: 0
      }))
    );
    setCurrentTime(0);
    setGanttChart([]);
    setIsRunning(false);
    setIsPaused(false);
    currentProcessRef.current = null;
    quantumCounterRef.current = 0;
    readyQueueRef.current = [];
    setLogs([{
      id: Math.random().toString(36).substr(2, 9),
      time: 0,
      message: 'Simulation reset.',
      type: 'warning'
    }]);
  }, []);

  // Check if simulation is complete
  const allCompleted = processes.length > 0 && processes.every((p) => p.state === 'terminated');

  // Auto-stop is now handled inside runSimulationStep implicitly by the state check,
  // but we should ensure isRunning becomes false when done to stop the effect.
  useEffect(() => {
    if (allCompleted && isRunning) {
      setIsRunning(false);
      setIsPaused(false);
    }
  }, [allCompleted, isRunning]);

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
    logs
  };
}
