import { SchedulingAlgorithm } from '@/types/process';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, Pause, RotateCcw, FastForward, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ControlPanelProps {
  algorithm: SchedulingAlgorithm;
  onAlgorithmChange: (algorithm: SchedulingAlgorithm) => void;
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  timeQuantum: number;
  onTimeQuantumChange: (quantum: number) => void;
  hasProcesses: boolean;
}

export function ControlPanel({
  algorithm,
  onAlgorithmChange,
  isRunning,
  isPaused,
  onStart,
  onPause,
  onStep,
  onReset,
  speed,
  onSpeedChange,
  timeQuantum,
  onTimeQuantumChange,
  hasProcesses,
}: ControlPanelProps) {
  return (
    <div className="glass-panel rounded-lg p-4 space-y-4">
      <h3 className="font-display text-lg font-semibold text-foreground">
        Simulation Controls
      </h3>

      {/* Algorithm Selection */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Scheduling Algorithm</Label>
        <Select
          value={algorithm}
          onValueChange={(value) => onAlgorithmChange(value as SchedulingAlgorithm)}
          disabled={isRunning}
        >
          <SelectTrigger className="bg-muted/30 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fcfs">First Come First Serve (FCFS)</SelectItem>
            <SelectItem value="sjf">Shortest Job First (SJF)</SelectItem>
            <SelectItem value="priority">Priority Scheduling</SelectItem>
            <SelectItem value="round-robin">Round Robin (RR)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Time Quantum (for Round Robin) */}
      {algorithm === 'round-robin' && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Time Quantum (ms)</Label>
          <Input
            type="number"
            min="1"
            max="10"
            value={timeQuantum}
            onChange={(e) => onTimeQuantumChange(Math.max(1, parseInt(e.target.value) || 1))}
            className="bg-muted/30 border-border/50"
            disabled={isRunning}
          />
        </div>
      )}

      {/* Speed Control */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Simulation Speed: {speed}x
        </Label>
        <div className="flex gap-2">
          {[0.5, 1, 2, 4].map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              onClick={() => onSpeedChange(s)}
              className={cn(
                'flex-1 text-xs',
                speed === s && 'bg-primary/20 border-primary text-primary'
              )}
            >
              {s}x
            </Button>
          ))}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {!isRunning ? (
          <Button
            onClick={onStart}
            disabled={!hasProcesses}
            className="col-span-2 bg-success hover:bg-success/90 text-success-foreground"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Simulation
          </Button>
        ) : (
          <>
            <Button
              onClick={isPaused ? onStart : onPause}
              className={cn(
                isPaused
                  ? 'bg-success hover:bg-success/90 text-success-foreground'
                  : 'bg-warning hover:bg-warning/90 text-warning-foreground'
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
            <Button
              onClick={onStep}
              disabled={!isPaused}
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              <ChevronRight className="w-4 h-4 mr-2" />
              Step
            </Button>
          </>
        )}

        <Button
          onClick={onReset}
          variant="outline"
          className="col-span-2 border-destructive/50 text-destructive hover:bg-destructive/10"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Simulation
        </Button>
      </div>
    </div>
  );
}
