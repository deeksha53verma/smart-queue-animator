import { Process } from '@/types/process';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ProcessBubbleProps {
  process: Process;
  onRemove?: (id: string) => void;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

const stateStyles = {
  new: 'bg-primary/10 border-primary/30 text-primary',
  ready: 'bg-warning/10 border-warning/30 text-warning',
  running: 'bg-success/10 border-success/30 text-success ring-2 ring-success/30',
  waiting: 'bg-secondary/10 border-secondary/30 text-secondary',
  terminated: 'bg-muted border-muted-foreground/20 text-muted-foreground opacity-50',
};

const sizeClasses = {
  sm: 'w-12 h-12 text-sm',
  md: 'w-16 h-16 text-base',
  lg: 'w-20 h-20 text-lg',
};

export function ProcessBubble({ process, onRemove, size = 'md', showDetails = true }: ProcessBubbleProps) {
  const progress = process.burstTime > 0 
    ? ((process.burstTime - process.remainingTime) / process.burstTime) * 100 
    : 0;

  return (
    <div className="relative group animate-scale-in">
      {/* Main bubble */}
      <div
        className={cn(
          'relative rounded-full border-2 flex items-center justify-center font-display font-bold transition-all duration-300',
          stateStyles[process.state],
          sizeClasses[size],
          process.state === 'running' && 'animate-pulse-soft'
        )}
      >
        {/* Progress ring for running processes */}
        {process.state === 'running' && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${progress * 2.83} 283`}
              className="transition-all duration-300"
            />
          </svg>
        )}
        
        <span className="relative z-10">{process.name.slice(0, 3)}</span>

        {/* Remove button */}
        {onRemove && process.state !== 'terminated' && process.state !== 'running' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(process.id);
            }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Details tooltip */}
      {showDetails && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20">
          <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-xs whitespace-nowrap">
            <p className="font-semibold text-foreground">{process.name}</p>
            <div className="flex gap-3 text-muted-foreground mt-1">
              <span>Burst: {process.burstTime}ms</span>
              <span>Priority: {process.priority}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
