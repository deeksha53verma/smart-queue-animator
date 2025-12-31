import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

export interface LogEntry {
    id: string;
    time: number;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

interface DecisionLogProps {
    logs: LogEntry[];
}

export function DecisionLog({ logs }: DecisionLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [logs]);

    return (
        <div className="glass-panel rounded-lg p-4 h-[300px] flex flex-col">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Scheduler Decision Log
            </h3>

            <ScrollArea ref={scrollRef} className="flex-1 pr-4">
                <div className="space-y-3">
                    {logs.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-8">
                            Start simulation to see scheduling decisions...
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div
                                key={log.id}
                                className={cn(
                                    "text-xs p-2 rounded-md border-l-2 animate-fade-in",
                                    log.type === 'info' && "bg-muted/50 border-primary/50",
                                    log.type === 'success' && "bg-success/5 border-success",
                                    log.type === 'warning' && "bg-warning/5 border-warning",
                                    log.type === 'error' && "bg-destructive/5 border-destructive"
                                )}
                            >
                                <div className="flex gap-2">
                                    <span className="font-mono font-bold opacity-70">t={log.time}:</span>
                                    <span className="text-foreground/90">{log.message}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
