import { Process } from '@/types/process';
import { ProcessStateIndicator } from './ProcessStateIndicator';
import { Trash2, Clock, Zap, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProcessCardProps {
  process: Process;
  onRemove: (id: string) => void;
  isActive?: boolean;
}

export function ProcessCard({ process, onRemove, isActive }: ProcessCardProps) {
  const progress = process.burstTime > 0 
    ? ((process.burstTime - process.remainingTime) / process.burstTime) * 100 
    : 0;

  return (
    <div
      className={cn(
        'glass-panel rounded-lg p-4 transition-all duration-300 animate-slide-in',
        isActive && 'neon-border ring-1 ring-primary/50',
        process.state === 'terminated' && 'opacity-60'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-lg',
            process.state === 'running' ? 'bg-success/20 text-success' :
            process.state === 'ready' ? 'bg-warning/20 text-warning' :
            process.state === 'terminated' ? 'bg-muted text-muted-foreground' :
            'bg-primary/20 text-primary'
          )}>
            {process.name.charAt(0)}
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{process.name}</h4>
            <p className="text-xs text-muted-foreground">PID: {process.id.slice(0, 8)}</p>
          </div>
        </div>
        <ProcessStateIndicator state={process.state} animated={process.state === 'running'} />
      </div>

      {/* Progress bar for running processes */}
      {process.state === 'running' && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Execution Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>Arrival: {process.arrivalTime}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Zap className="w-3.5 h-3.5 text-warning" />
          <span>Burst: {process.burstTime}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Flag className="w-3.5 h-3.5 text-secondary" />
          <span>Priority: {process.priority}</span>
        </div>
      </div>

      {process.state !== 'terminated' && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">
            Remaining: <span className="text-foreground font-semibold">{process.remainingTime}ms</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(process.id)}
            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {process.state === 'terminated' && (
        <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-border/50">
          <div>
            <span className="text-muted-foreground">Wait:</span>
            <span className="ml-1 text-foreground">{process.waitingTime}ms</span>
          </div>
          <div>
            <span className="text-muted-foreground">Turn:</span>
            <span className="ml-1 text-foreground">{process.turnaroundTime}ms</span>
          </div>
          <div>
            <span className="text-muted-foreground">Response:</span>
            <span className="ml-1 text-foreground">{process.responseTime}ms</span>
          </div>
        </div>
      )}
    </div>
  );
}
