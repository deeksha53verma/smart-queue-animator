import { SchedulingAlgorithm } from '@/types/process';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Plus, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleControlsProps {
  algorithm: SchedulingAlgorithm;
  onAlgorithmChange: (algorithm: SchedulingAlgorithm) => void;
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onAddProcess: () => void;
  hasProcesses: boolean;
  speed: number;
  onSpeedChange: (speed: number) => void;
  contextSwitchDuration?: number;
  onContextSwitchDurationChange?: (duration: number) => void;
}

const algorithms: { id: SchedulingAlgorithm; label: string; short: string }[] = [
  { id: 'fcfs', label: 'First Come First Serve', short: 'FCFS' },
  { id: 'sjf', label: 'Shortest Job First', short: 'SJF' },
  { id: 'priority', label: 'Priority', short: 'Priority' },
  { id: 'round-robin', label: 'Round Robin', short: 'RR' },
];

export function SimpleControls({
  algorithm,
  onAlgorithmChange,
  isRunning,
  isPaused,
  onStart,
  onPause,
  onStep,
  onReset,
  onAddProcess,
  hasProcesses,
  speed,
  onSpeedChange,
  contextSwitchDuration = 0,
  onContextSwitchDurationChange,
}: SimpleControlsProps) {
  return (
    <div className="glass-card p-5 space-y-5">
      {/* Algorithm Pills */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
          Algorithm
        </label>
        <div className="flex flex-wrap gap-2">
          {algorithms.map((algo) => (
            <button
              key={algo.id}
              onClick={() => onAlgorithmChange(algo.id)}
              disabled={isRunning}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                algorithm === algo.id
                  ? 'gradient-bg text-white shadow-lg shadow-primary/25'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
                isRunning && 'opacity-50 cursor-not-allowed'
              )}
            >
              {algo.short}
            </button>
          ))}
        </div>
      </div>

      {/* Speed Control */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
          Speed
        </label>
        <div className="flex gap-2">
          {[0.1, 0.25, 0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200',
                speed === s
                  ? 'bg-foreground text-background vector-effect-non-scaling-stroke'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {s === 0.1 ? '0.1x' : s === 0.25 ? '0.25x' : s === 0.5 ? '0.5x' : s + 'x'}
            </button>
          ))}
        </div>
      </div>

      {/* Context Switch Duration (Only valid for enabled contexts) */}
      {onContextSwitchDurationChange && (
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
            Context Switch Overhead (ms)
          </label>
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((d) => (
              <button
                key={d}
                onClick={() => onContextSwitchDurationChange(d)}
                disabled={isRunning}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                  contextSwitchDuration === d
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  isRunning && 'opacity-70 cursor-not-allowed'
                )}
              >
                {d}ms
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button
          onClick={onAddProcess}
          disabled={isRunning && !isPaused}
          variant="outline"
          className="rounded-xl h-11"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Process
        </Button>

        {!isRunning ? (
          <Button
            onClick={onStart}
            disabled={!hasProcesses}
            className="btn-primary rounded-xl h-11"
          >
            <Play className="w-4 h-4 mr-2" />
            Start
          </Button>
        ) : (
          <Button
            onClick={isPaused ? onStart : onPause}
            className={cn(
              'rounded-xl h-11',
              isPaused ? 'btn-primary' : 'bg-warning text-warning-foreground hover:bg-warning/90'
            )}
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            )}
          </Button>
        )}

        <Button
          onClick={onStep}
          disabled={!isPaused && !(!isRunning && hasProcesses)}
          variant="outline"
          className="rounded-xl h-11"
        >
          <SkipForward className="w-4 h-4 mr-2" />
          Step
        </Button>

        <Button
          onClick={onReset}
          variant="outline"
          className="rounded-xl h-11 text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
}
