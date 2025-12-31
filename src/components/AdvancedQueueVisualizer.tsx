import { Process, PROCESS_TYPE_CONFIG, PROCESS_OPERATIONS, ProcessType } from '@/types/process';
import { ArrowRight, Cpu, Layers, HardDrive, TerminalSquare, Activity } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

interface AdvancedQueueVisualizerProps {
    processes: Process[];
    onRemove: (id: string) => void;
    isContextSwitching?: boolean;
    speed?: number;
}

export function AdvancedQueueVisualizer({ processes, isContextSwitching = false, speed = 1 }: AdvancedQueueVisualizerProps) {
    // Filter processes by state
    const readyParams = processes.filter(p => p.state === 'ready' || p.state === 'new').sort((a, b) => a.arrivalTime - b.arrivalTime);
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
                    {/* 1. Ready Queue Area */}
                    <div className="flex-1 w-full bg-muted/30 rounded-xl p-4 border border-dashed border-border/50 relative min-h-[140px] flex flex-col">
                        <span className="absolute -top-3 left-4 bg-background px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Ready Queue
                        </span>

                        {readyParams.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm italic">
                                Queue Empty
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-thin h-full">
                                {readyParams.map((p, idx) => {
                                    const typeConfig = PROCESS_TYPE_CONFIG[p.type] || PROCESS_TYPE_CONFIG['user'];
                                    return (
                                        <div
                                            key={p.id}
                                            className="flex-shrink-0 w-20 h-24 bg-card border-2 border-primary/20 rounded-lg flex flex-col items-center justify-center shadow-sm relative group animate-scale-in"
                                            style={{ animationDelay: `${idx * 100}ms` }}
                                        >
                                            <div className={`absolute top-1 left-1 w-2 h-2 rounded-full ${typeConfig.color}`} title={typeConfig.label} />
                                            <span className="text-xs font-bold text-primary mb-1 mt-2 text-center px-1 truncate w-full">{p.name}</span>
                                            <div className="w-full h-[1px] bg-border mb-1" />
                                            <span className="text-[10px] text-muted-foreground">BT: {p.remainingTime}</span>
                                            <span className="text-[9px] text-muted-foreground/70 uppercase tracking-tighter">{typeConfig.label}</span>
                                            <span className="absolute -top-2 -right-2 w-5 h-5 bg-secondary text-secondary-foreground rounded-full text-[10px] flex items-center justify-center font-bold shadow-sm">
                                                {p.priority}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
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

                        {isContextSwitching ? (
                            <div className="w-full h-full flex flex-col items-center justify-center animate-pulse text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                                <ShuffleIcon className="w-10 h-10 mb-2 opacity-50" />
                                <span className="text-sm font-medium">Context Switch</span>
                                <span className="text-xs text-muted-foreground/70 mt-1">Saving state...</span>
                            </div>
                        ) : runningProcess ? (
                            <div className="w-full h-full flex flex-col items-center justify-between p-2">
                                {/* Running Process Card */}
                                <div className="w-full flex-1 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 flex flex-col items-center justify-center relative overflow-hidden p-2">
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${PROCESS_TYPE_CONFIG[runningProcess.type]?.color || 'bg-white'}`} />

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

                    {/* 3. Completed Area */}
                    <div className="w-full md:w-32 bg-success/5 rounded-xl border border-success/20 p-4 flex flex-col items-center min-h-[140px] relative overflow-hidden">
                        <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-background px-2 text-xs font-semibold text-success uppercase tracking-wider">
                            Finish
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
                    <div className="w-full bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 relative animate-in fade-in slide-in-from-bottom-2">
                        <span className="absolute -top-3 left-4 bg-background px-2 text-xs font-semibold text-orange-500 uppercase tracking-wider flex items-center gap-1">
                            <HardDrive className="w-3 h-3" /> I/O Waiting
                        </span>

                        <div className="flex items-center gap-4 overflow-x-auto py-2 scrollbar-thin">
                            {waitingParams.map((p) => (
                                <div
                                    key={p.id}
                                    className="flex-shrink-0 w-32 h-12 bg-card border border-orange-500/30 rounded-lg flex items-center px-3 justify-between shadow-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${PROCESS_TYPE_CONFIG[p.type]?.color}`} />
                                        <span className="text-sm font-bold text-foreground">{p.name}</span>
                                    </div>
                                    <span className="text-xs font-mono text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded">
                                        {p.remainingIOTime}s
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Icon for CS
function ShuffleIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l14.2-12.6c.8-1 2-1.7 3.3-1.7H22" />
            <path d="M2 6h1.4c1.3 0 2.5.6 3.3 1.7l14.2 12.6c.8 1 2 1.7 3.3 1.7H22" />
        </svg>
    )
}
