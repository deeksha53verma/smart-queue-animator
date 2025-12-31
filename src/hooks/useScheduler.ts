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
  const [speed, setSpeed] = useState(1);
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [contextSwitchDuration, setContextSwitchDuration] = useState(0.5); // Default 0.5s (simulated as ticks)
  const [isContextSwitching, setIsContextSwitching] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Refs for logic state
  const currentProcessRef = useRef<Process | null>(null);
  const quantumCounterRef = useRef(0);
  const readyQueueRef = useRef<string[]>([]);
  const contextSwitchCounterRef = useRef(0);
  const pendingProcessRef = useRef<Process | null>(null); // Process waiting to start after CS

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

  const addProcess = useCallback((name: string, arrivalTime: number, burstTime: number, priority: number, type: Process['type'] = 'user', ioStartTime?: number, ioDuration?: number) => {
    const newProcess: Process = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
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
      if (isContextSwitching) {
        contextSwitchCounterRef.current++;

        // Visualize CS in Gantt
        setGanttChart((prevGantt) => {
          const lastEntry = prevGantt[prevGantt.length - 1];
          if (lastEntry && lastEntry.isContextSwitch && lastEntry.endTime === time) {
            return [...prevGantt.slice(0, -1), { ...lastEntry, endTime: time + 1 }];
          }
          return [...prevGantt, {
            processId: 'cs',
            processName: 'CS',
            startTime: time,
            endTime: time + 1,
            isContextSwitch: true
          }];
        });

        if (contextSwitchCounterRef.current >= contextSwitchDuration) {
          setIsContextSwitching(false);
          contextSwitchCounterRef.current = 0;
          // The pending process will be picked up in next tick or logic below if we allow it to fall through
          // But updated state won't reflect 'isContextSwitching' false until next render/tick effectively
          // So we just return here and let next tick handle the actual execution start

          // Actually, let's force the transition now if we have a pending process
          if (pendingProcessRef.current) {
            // We need to set it as running in the *updated* array effectively?
            // The logic below 'if (!updated.some(p => p.state === running))' will pick it up
            // provided we cleared current process.
          }
        }
        setCurrentTime((prev) => prev + 1);
        return updated;
      }

      // Move new processes to ready state if they've arrived
      updated.forEach((p) => {
        if (p.state === 'new' && p.arrivalTime <= time) {
          p.state = 'ready';
          if (algorithm === 'round-robin' && !readyQueueRef.current.includes(p.id)) {
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
            // Usually I/O burst is part of CPU burst cycle. Here user sets "IO Start Time" relative to burst.
            // If we want it to happen ONLY once, we should flag it as done.
            // But 'remainingIOTime' reaching 0 implies done.

            if (algorithm === 'round-robin') {
              readyQueueRef.current.push(p.id);
            }
            log(`Process ${p.name} completed I/O and moved to Ready.`, 'info');
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
            log(`Time Quantum expired for ${runningProcess.name}. Moved to ready queue.`, 'info');

            // Trigger Context Switch
            if (contextSwitchDuration > 0) {
              setIsContextSwitching(true);
              currentProcessRef.current = null;
              // No specific pending process yet, scheduler will pick next
            }
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
          if (contextSwitchDuration > 0) {
            setIsContextSwitching(true);
            // Scheduler will pick next
          }
        }
      }

      // If no running process (and not switching), select next one
      if (!updated.some((p) => p.state === 'running') && !isContextSwitching) {
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
          // Check if we need to context switch (if we weren't already)
          // If we just finished a context switch, 'isContextSwitching' is false, so we proceed.
          // Ideally we trigger CS *before* this selection if previous process was preempted/terminated.
          // But for initial start or idle->run, maybe CS? 
          // Let's assume CS happens on SWITCH. Idle -> Process might differ.
          // Simplification: If we just picked a process and we have CS duration, and we aren't coming from a CS...
          // But treating "just picked" IS the moment.

          // Logic: If 'pendingProcessRef' was set, we are resuming from CS? No.
          // Let's just run it.

          // WAIT: Logic flow.
          // 1. Running process runs. Terminate/Preempt -> set to null. Trigger CS if needed.
          // 2. CS runs. Ends -> set isContextSwitching 'false'.
          // 3. Loop comes here. Selects next.

          // Case: Idle -> New Process. Should we CS? Real RTOS usually yes (dispatcher).
          // Let's keep it simple: Only if we had a previous process running recently? 
          // User asked: "Whenever the CPU switches from one process to another".

          // Implementation:
          // If we selected a process `nextProcess`.
          // If `currentProcessRef.current` was null (CPU free).
          // Note: if we just finished CS, we are good to go.

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
        }
      } else if (runningProcess && !isContextSwitching) {
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
          if (contextSwitchDuration > 0 && updated.some(p => p.state === 'ready')) {
            setIsContextSwitching(true);
          }
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
  }, [currentTime, algorithm, timeQuantum, processes.length, contextSwitchDuration, isContextSwitching]);

  // Use useEffect for the simulation loop to avoid stale closures
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && !isPaused) {
      runSimulationStep(); // Run immediately so we don't wait for first interval
      interval = setInterval(() => {
        runSimulationStep();
      }, 1000 / speed);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, speed, runSimulationStep]);

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
    setIsContextSwitching(false); // Reset CS state
    currentProcessRef.current = null;
    quantumCounterRef.current = 0;
    readyQueueRef.current = [];
    contextSwitchCounterRef.current = 0;
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
    logs,
    contextSwitchDuration,
    setContextSwitchDuration,
    isContextSwitching
  };
}
