import { GanttChartEntry, Process } from '@/types/process';
import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';

interface GanttChartProps {
  entries: GanttChartEntry[];
  processes: Process[];
  currentTime: number;
}

const processColors = [
  'from-primary to-cyan-400',
  'from-secondary to-pink-400',
  'from-accent to-emerald-400',
  'from-warning to-orange-400',
  'from-destructive to-rose-400',
  'from-blue-500 to-indigo-400',
  'from-violet-500 to-purple-400',
  'from-amber-500 to-yellow-400',
];

export function GanttChart({ entries, processes, currentTime }: GanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const processColorMap = useRef<Record<string, string>>({});

  // Assign consistent colors to processes
  processes.forEach((p, i) => {
    if (!processColorMap.current[p.id]) {
      processColorMap.current[p.id] = processColors[i % processColors.length];
    }
  });

  // Auto-scroll to the right
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [entries]);

  const maxTime = Math.max(currentTime, 20);
  const timeScale = 40; // pixels per time unit

  return (
    <div className="glass-panel rounded-lg p-4">
      <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Gantt Chart Timeline
      </h3>

      <div 
        ref={scrollRef}
        className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-muted"
      >
        <div className="relative" style={{ minWidth: `${maxTime * timeScale + 100}px`, height: '120px' }}>
          {/* Time axis */}
          <div className="absolute bottom-0 left-0 right-0 h-8 flex items-end border-t border-border/50">
            {Array.from({ length: maxTime + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute flex flex-col items-center"
                style={{ left: `${i * timeScale}px` }}
              >
                <div className="w-px h-2 bg-border" />
                <span className="text-[10px] text-muted-foreground mt-1">{i}</span>
              </div>
            ))}
          </div>

          {/* Current time indicator */}
          <div
            className="absolute top-0 bottom-8 w-0.5 bg-primary z-10 transition-all duration-300"
            style={{ left: `${currentTime * timeScale}px` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary animate-pulse-glow" />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-primary font-semibold whitespace-nowrap">
              t={currentTime}
            </div>
          </div>

          {/* Gantt bars */}
          <div className="absolute top-2 left-0 right-0 bottom-10 flex flex-col gap-2">
            {entries.map((entry, idx) => {
              const color = processColorMap.current[entry.processId] || processColors[0];
              const width = (entry.endTime - entry.startTime) * timeScale;
              const left = entry.startTime * timeScale;

              return (
                <div
                  key={`${entry.processId}-${entry.startTime}-${idx}`}
                  className={cn(
                    'absolute h-10 rounded-lg flex items-center justify-center text-xs font-semibold animate-fade-up',
                    'bg-gradient-to-r shadow-lg',
                    color
                  )}
                  style={{
                    left: `${left}px`,
                    width: `${Math.max(width, 30)}px`,
                    top: '10px',
                    animationDelay: `${idx * 50}ms`,
                  }}
                >
                  <span className="text-background drop-shadow-md truncate px-2">
                    {entry.processName}
                  </span>
                </div>
              );
            })}
          </div>

          {entries.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              Start the simulation to see the Gantt chart
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border/50">
        {processes.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2 text-xs">
            <div
              className={cn(
                'w-4 h-4 rounded bg-gradient-to-r',
                processColorMap.current[p.id] || processColors[i % processColors.length]
              )}
            />
            <span className="text-muted-foreground">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
