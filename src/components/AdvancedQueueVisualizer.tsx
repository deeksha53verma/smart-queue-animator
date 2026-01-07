import { Process, PROCESS_TYPE_CONFIG, PROCESS_OPERATIONS, ProcessType, SchedulingAlgorithm } from '@/types/process';
import { ArrowRight, Cpu, Layers, HardDrive, TerminalSquare, Activity } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

interface AdvancedQueueVisualizerProps {
    processes: Process[];
    onRemove: (id: string) => void;
    speed?: number;
    algorithm?: SchedulingAlgorithm;
}

export function AdvancedQueueVisualizer({ processes, speed = 1, algorithm = 'fcfs' }: AdvancedQueueVisualizerProps) {
    // Group processes based on algorithm
    const readyQueues = useMemo(() => {
        const ready = processes.filter(p => p.state === 'ready' || p.state === 'new').sort((a, b) => a.arrivalTime - b.arrivalTime);

        if (algorithm === 'mlfq') {
            return [
                { id: 'q0', title: 'Queue 0 (RR-4)', processes: ready.filter(p => (p.queueLevel || 0) === 0) },
                { id: 'q1', title: 'Queue 1 (RR-8)', processes: ready.filter(p => (p.queueLevel || 0) === 1) },
                { id: 'q2', title: 'Queue 2 (FCFS)', processes: ready.filter(p => (p.queueLevel || 0) >= 2) },
            ];
        }
        else if (algorithm === 'mlq') {
            const getPriority = (type: string) => ({ system: 0, interactive: 1, user: 2, batch: 3 }[type] ?? 4);
            return [
                { id: 'q_sys', title: 'System Queue', processes: ready.filter(p => getPriority(p.type) === 0) },
                { id: 'q_int', title: 'Interactive Queue', processes: ready.filter(p => getPriority(p.type) === 1) },
                { id: 'q_usr', title: 'User Queue', processes: ready.filter(p => getPriority(p.type) === 2) },
                { id: 'q_bat', title: 'Batch Queue', processes: ready.filter(p => getPriority(p.type) === 3) },
            ];
        }
        else {
            let sorted = ready;
            // Apply sorting for visualization matching algorithm (optional, but helpful)
            if (algorithm === 'sjf' || algorithm === 'srtf') {
                sorted = [...ready].sort((a, b) => a.remainingTime - b.remainingTime);
            } else if (algorithm === 'priority') {
                sorted = [...ready].sort((a, b) => a.priority - b.priority);
            } else if (algorithm === 'edf') {
                sorted = [...ready].sort((a, b) => (a.deadline || 999) - (b.deadline || 999));
            }

            return [{ id: 'main', title: 'Ready Queue', processes: sorted }];
        }
    }, [processes, algorithm]);

    const runningProcess = processes.find(p => p.state === 'running');
    const waitingParams = processes.filter(p => p.state === 'waiting').sort((a, b) => (a.remainingIOTime || 0) - (b.remainingIOTime || 0));
    const terminated = processes.filter(p => p.state === 'terminated');

    // Local state for fake "operations" to display
    const [currentOp, setCurrentOp] = useState<string>('');

    // Update operation text when process runs
    useEffect(() => {
        if (runningProcess) {
            const ops = PROCESS_OPERATIONS[runningProcess.type] || PROCESS_OPERATIONS['user'];
            // Pick op based on remaining time to simulate sequence
            const opIndex = (runningProcess.burstTime - runningProcess.remainingTime) % ops.length;
            setCurrentOp(ops[opIndex]);
        } else {
            setCurrentOp('');
        }
    }, [runningProcess?.id, runningProcess?.remainingTime]);

    return (
        <div className="md:col-span-2 glass-card p-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Process Pipeline
                </h3>
                <div className="text-xs text-muted-foreground">
                    {processes.length} Total Processes
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {/* Top Row: Ready -> CPU -> Finish */}
                <div className="flex flex-col md:flex-row items-center gap-4 relative min-h-[160px]">
                    {/* 1. Ready Queue Area (Multi-Queue Supported) */}
                    <div className="flex-1 w-full flex flex-col gap-2">
                        {readyQueues.map((queue) => (
                            <div key={queue.id} className="relative w-full bg-muted/30 rounded-xl p-3 border border-dashed border-border/50 min-h-[100px] flex flex-col justify-center">
                                <span className="absolute -top-2.5 left-4 bg-background px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border border-border/50 rounded-full">
                                    {queue.title}
                                </span>

                                {queue.processes.length === 0 ? (
                                    <div className="flex items-center justify-center text-muted-foreground text-xs italic opacity-50 h-full">
                                        Empty
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
                                        {queue.processes.map((p) => {
                                            const typeConfig = PROCESS_TYPE_CONFIG[p.type] || PROCESS_TYPE_CONFIG['user'];
                                            return (
                                                <div
                                                    key={p.id}
                                                    className="flex-shrink-0 w-16 h-20 bg-card border border-primary/20 rounded-lg flex flex-col items-center justify-center shadow-sm relative group"
                                                >
                                                    <div className={`absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full ${typeConfig.color}`} title={typeConfig.label} />
                                                    <span className="text-[10px] font-bold text-foreground mb-0.5 mt-1 text-center px-1 truncate w-full">{p.name}</span>
                                                    <div className="w-full h-[1px] bg-border mb-0.5" />
                                                    <span className="text-[9px] text-muted-foreground">T: {p.remainingTime}</span>
                                                    {algorithm === 'edf' && (
                                                        <span className="text-[8px] text-destructive font-mono">D: {p.deadline}</span>
                                                    )}
                                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-secondary text-secondary-foreground rounded-full text-[9px] flex items-center justify-center font-bold shadow-sm">
                                                        {p.priority}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Arrow */}
                    <div className="hidden md:flex text-muted-foreground">
                        <ArrowRight className="w-6 h-6 animate-pulse" />
                    </div>

                    {/* 2. CPU Area */}
                    <div className="w-full md:w-56 h-40 bg-primary/5 rounded-xl border border-primary/30 flex flex-col items-center justify-center relative p-4 transition-colors duration-300">
                        <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-background px-2 text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                            <Cpu className="w-3 h-3" /> CPU Core 1
                        </span>

                        {runningProcess ? (
                            <div className="w-full h-full flex flex-col items-center justify-between p-2">
                                {/* Running Process Card */}
                                <div className="w-full flex-1 bg-card text-card-foreground border-2 border-primary/50 rounded-lg shadow-lg flex flex-col items-center justify-center relative overflow-hidden p-2">
                                    <div className={`absolute top-0 left-0 w-2 h-full ${PROCESS_TYPE_CONFIG[runningProcess.type]?.color || 'bg-white'}`} />

                                    <div className="flex items-center justify-between w-full pl-3 mb-1">
                                        <span className="text-lg font-bold truncate">{runningProcess.name}</span>
                                        <Activity className="w-4 h-4 animate-pulse" />
                                    </div>

                                    <div className="w-full bg-black/20 rounded p-1.5 mb-2 font-mono text-[10px] text-primary-foreground/90 overflow-hidden whitespace-nowrap">
                                        <span className="text-green-300 mr-2">$</span>
                                        <span className="animate-pulse">{currentOp || 'Executing...'}</span>
                                    </div>

                                    <div className="w-full flex items-center justify-between text-xs px-1 mb-1">
                                        <span>Time Rem:</span>
                                        <span className="font-mono">{runningProcess.remainingTime}ms</span>
                                    </div>

                                    <div className="w-full px-1">
                                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-white ease-linear"
                                                style={{
                                                    width: `${((runningProcess.burstTime - runningProcess.remainingTime) / runningProcess.burstTime) * 100}%`,
                                                    transition: `width ${1000 / speed}ms linear`
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-muted-foreground text-sm flex flex-col items-center gap-2 opacity-50">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                    <Cpu className="w-8 h-8 opacity-20" />
                                </div>
                                <span className="uppercase tracking-widest text-xs font-semibold">Idle</span>
                            </div>
                        )}
                    </div>

                    {/* Arrow */}
                    <div className="hidden md:flex text-muted-foreground">
                        <ArrowRight className="w-6 h-6 opacity-30" />
                    </div>

                    {/* 3. Terminated Area */}
                    <div className="w-full md:w-32 bg-success/5 rounded-xl border border-success/20 p-4 flex flex-col items-center min-h-[140px] relative overflow-hidden">
                        <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-background px-2 text-xs font-semibold text-success uppercase tracking-wider">
                            Terminated
                        </span>

                        <div className="flex flex-col-reverse gap-1 w-full max-h-28 overflow-y-auto scrollbar-none mt-2">
                            {terminated.map((p) => (
                                <div key={p.id} className="w-full bg-success/10 border border-success/30 rounded px-2 py-1 text-xs text-center text-success-foreground font-medium animate-fade-in truncate" title={p.name}>
                                    {p.name}
                                </div>
                            ))}
                            {terminated.length === 0 && (
                                <span className="text-xs text-muted-foreground text-center mt-8">Empty</span>
                            )}
                        </div>

                        {terminated.length > 0 && (
                            <div className="absolute bottom-1 right-2 text-[10px] text-success font-bold">
                                {terminated.length}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Row: I/O Waiting Queue */}
                {waitingParams.length > 0 && (
                    <div className="relative w-full">
                        {/* Flow Arrow from CPU to I/O */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center">
                            <div className="h-4 w-px bg-orange-500/30"></div>
                            <ArrowRight className="w-4 h-4 text-orange-500/50 rotate-90" />
                        </div>

                        <div className="w-full bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 relative">
                            <span className="absolute -top-3 left-4 bg-background px-2 text-xs font-semibold text-orange-500 uppercase tracking-wider flex items-center gap-1">
                                <HardDrive className="w-3 h-3" /> I/O Waiting
                            </span>

                            <div className="flex items-center gap-4 overflow-x-auto py-2 scrollbar-thin">
                                {waitingParams.map((p) => {
                                    // Need to get color from config potentially if not available on p directly
                                    const typeConfig = PROCESS_TYPE_CONFIG[p.type];
                                    return (
                                        <div
                                            key={p.id}
                                            className="flex-shrink-0 w-32 h-14 bg-card border border-orange-500/30 rounded-lg flex items-center px-3 justify-between shadow-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-sm ${typeConfig?.color || 'bg-gray-500'}`} />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-foreground leading-tight">{p.name}</span>
                                                    <span className="text-[9px] text-muted-foreground">{p.type}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-mono text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded mb-1">
                                                    {p.remainingIOTime}s
                                                </span>
                                                <span className="text-[8px] uppercase text-muted-foreground/50">Returning</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


