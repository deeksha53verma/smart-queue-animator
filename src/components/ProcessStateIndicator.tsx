import { ProcessState } from '@/types/process';
import { cn } from '@/lib/utils';

interface ProcessStateIndicatorProps {
  state: ProcessState;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

const stateConfig: Record<ProcessState, { label: string; className: string }> = {
  new: { label: 'NEW', className: 'state-new' },
  ready: { label: 'READY', className: 'state-ready' },
  running: { label: 'RUNNING', className: 'state-running' },
  waiting: { label: 'WAITING', className: 'state-waiting' },
  terminated: { label: 'TERMINATED', className: 'state-terminated' },
};

const sizeClasses = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-3 py-1',
  lg: 'text-sm px-4 py-1.5',
};

export function ProcessStateIndicator({
  state,
  size = 'md',
  showLabel = true,
  animated = false,
}: ProcessStateIndicatorProps) {
  const config = stateConfig[state];

  return (
    <span
      className={cn(
        'process-badge inline-flex items-center gap-1.5 font-semibold tracking-wider transition-all duration-300',
        config.className,
        sizeClasses[size],
        animated && state === 'running' && 'animate-pulse-glow'
      )}
    >
      {state === 'running' && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {showLabel && config.label}
    </span>
  );
}
