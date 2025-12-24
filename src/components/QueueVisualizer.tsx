import { Process } from '@/types/process';
import { ProcessBubble } from './ProcessBubble';
import { ArrowRight, Cpu, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueueVisualizerProps {
  processes: Process[];
  onRemove: (id: string) => void;
}

export function QueueVisualizer({ processes, onRemove }: QueueVisualizerProps) {
  const newProcesses = processes.filter(p => p.state === 'new');
  const readyProcesses = processes.filter(p => p.state === 'ready');
  const runningProcess = processes.find(p => p.state === 'running');
  const terminatedProcesses = processes.filter(p => p.state === 'terminated');

  return (
    <div className="glass-card p-6">
      <h3 className="font-display text-lg font-semibold text-foreground mb-6">
        Process Flow Visualization
      </h3>

      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4">
        {/* New Queue */}
        <div className="flex-shrink-0 min-w-[100px]">
          <div className="text-xs font-medium text-primary mb-3 text-center uppercase tracking-wider">
            New
          </div>
          <div className="flex flex-wrap gap-2 justify-center min-h-[70px] items-center">
            {newProcesses.length > 0 ? (
              newProcesses.map(p => (
                <ProcessBubble key={p.id} process={p} onRemove={onRemove} size="sm" />
              ))
            ) : (
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                <span className="text-xs text-muted-foreground">—</span>
              </div>
            )}
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

        {/* Ready Queue */}
        <div className="flex-shrink-0 min-w-[140px]">
          <div className="text-xs font-medium text-warning mb-3 text-center uppercase tracking-wider">
            Ready Queue
          </div>
          <div className="flex gap-2 justify-center min-h-[70px] items-center bg-warning/5 rounded-xl px-4 py-2">
            {readyProcesses.length > 0 ? (
              readyProcesses.map(p => (
                <ProcessBubble key={p.id} process={p} onRemove={onRemove} size="sm" />
              ))
            ) : (
              <span className="text-xs text-muted-foreground">Empty</span>
            )}
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

        {/* CPU (Running) */}
        <div className="flex-shrink-0">
          <div className="text-xs font-medium text-success mb-3 text-center uppercase tracking-wider">
            CPU
          </div>
          <div className={cn(
            'relative w-24 h-24 rounded-2xl flex items-center justify-center transition-all duration-300',
            runningProcess 
              ? 'bg-success/10 border-2 border-success/30' 
              : 'bg-muted border-2 border-dashed border-border'
          )}>
            {runningProcess ? (
              <>
                <ProcessBubble process={runningProcess} size="lg" showDetails={false} />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-success text-success-foreground text-[10px] font-medium rounded-full">
                  {runningProcess.remainingTime}ms left
                </div>
              </>
            ) : (
              <Cpu className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

        {/* Completed */}
        <div className="flex-shrink-0 min-w-[100px]">
          <div className="text-xs font-medium text-muted-foreground mb-3 text-center uppercase tracking-wider flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Done
          </div>
          <div className="flex flex-wrap gap-2 justify-center min-h-[70px] items-center">
            {terminatedProcesses.length > 0 ? (
              terminatedProcesses.slice(-4).map(p => (
                <ProcessBubble key={p.id} process={p} size="sm" />
              ))
            ) : (
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                <span className="text-xs text-muted-foreground">—</span>
              </div>
            )}
            {terminatedProcesses.length > 4 && (
              <span className="text-xs text-muted-foreground">+{terminatedProcesses.length - 4}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
