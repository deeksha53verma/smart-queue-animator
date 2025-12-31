import { Process, PROCESS_TYPE_CONFIG, PROCESS_OPERATIONS } from '@/types/process';
import { cn } from '@/lib/utils';
import { Activity, Clock, Database, CheckCircle2, PauseCircle } from 'lucide-react';
import { useMemo } from 'react';

interface ProcessStateTableProps {
    processes: Process[];
    currentTime: number;
}

export function ProcessStateTable({ processes, currentTime }: ProcessStateTableProps) {
    // Sort processes: Running first, then Ready, Waiting, Terminated
    const sortedProcesses = useMemo(() => {
        const order = { running: 0, ready: 1, waiting: 2, new: 3, terminated: 4 };
        return [...processes].sort((a, b) => {
            if (order[a.state] !== order[b.state]) return order[a.state] - order[b.state];
            return parseInt(a.id) - parseInt(b.id);
        });
    }, [processes]);

    return (
        <div className="glass-card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Live Process State Monitor
                </h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    T = {currentTime}s
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-border/50 text-xs uppercase text-muted-foreground/70 tracking-wider text-left">
                            <th className="py-3 px-4 w-[20%]">Process</th>
                            <th className="py-3 px-4 w-[15%]">State</th>
                            <th className="py-3 px-4 w-[25%]">Current Activity</th>
                            <th className="py-3 px-4 w-[20%]">Time Remaining</th>
                            <th className="py-3 px-4 w-[20%]">Next Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {sortedProcesses.map((p) => {
                            const typeConfig = PROCESS_TYPE_CONFIG[p.type];
                            const isActive = p.state === 'running';

                            // Activity Description
                            let activity = 'Idle in Queue';
                            let icon = <Clock className="w-3 h-3 text-muted-foreground" />;
                            let nextAction = 'Wait for CPU';

                            if (p.state === 'running') {
                                const ops = PROCESS_OPERATIONS[p.type];
                                const opIndex = (p.burstTime - p.remainingTime) % ops.length;
                                activity = ops[opIndex];
                                icon = <Activity className="w-3 h-3 text-primary animate-pulse" />;
                                nextAction = p.remainingTime <= 1 ? 'Terminate' : 'Continue Execution';
                                if (p.remainingTime > 1 && p.ioStartTime && Math.abs((p.burstTime - p.remainingTime) - p.ioStartTime) < 1) {
                                    nextAction = 'Request I/O (Wait)';
                                }
                            } else if (p.state === 'waiting') {
                                activity = 'Performing I/O';
                                icon = <Database className="w-3 h-3 text-orange-500 animate-pulse" />;
                                nextAction = `Return to Ready in ${p.remainingIOTime}s`;
                            } else if (p.state === 'terminated') {
                                activity = 'Completed';
                                icon = <CheckCircle2 className="w-3 h-3 text-green-500" />;
                                nextAction = '-';
                            } else if (p.state === 'ready') {
                                activity = 'Ready to Run';
                                icon = <PauseCircle className="w-3 h-3 text-blue-400" />;
                            }

                            return (
                                <tr
                                    key={p.id}
                                    className={cn(
                                        "transition-colors duration-300",
                                        isActive ? "bg-primary/5 shadow-sm" : "hover:bg-muted/20"
                                    )}
                                >
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded shadow-sm ${typeConfig.color}`} />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground">{p.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{typeConfig.label}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded textxs font-medium uppercase tracking-tighter w-20 justify-center",
                                            p.state === 'running' && "bg-primary/10 text-primary border border-primary/20",
                                            p.state === 'waiting' && "bg-orange-500/10 text-orange-600 border border-orange-500/20",
                                            p.state === 'terminated' && "bg-green-500/10 text-green-600 border border-green-500/20",
                                            (p.state === 'ready' || p.state === 'new') && "bg-muted text-muted-foreground border border-border"
                                        )}>
                                            {p.state}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2 font-mono text-xs">
                                            {icon}
                                            <span className={isActive ? "text-primary font-semibold" : "text-muted-foreground"}>
                                                {activity}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        {p.state === 'terminated' ? (
                                            <span className="text-muted-foreground">-</span>
                                        ) : (
                                            <div className="w-full max-w-[100px] space-y-1">
                                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                                    <span>{p.remainingTime}s left</span>
                                                    <span>{Math.round(((p.burstTime - p.remainingTime) / p.burstTime) * 100)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full transition-all duration-300", typeConfig.color)}
                                                        style={{ width: `${((p.burstTime - p.remainingTime) / p.burstTime) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-xs text-muted-foreground">
                                        {nextAction}
                                    </td>
                                </tr>
                            );
                        })}

                        {processes.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm italic">
                                    No active processes. Add a process to monitor its state.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
