import { GanttChartEntry, Process } from '@/types/process';
import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';

interface SimpleGanttChartProps {
  entries: GanttChartEntry[];
  processes: Process[];
  currentTime: number;
}

const colors = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
  'from-cyan-500 to-cyan-600',
  'from-pink-500 to-pink-600',
  'from-indigo-500 to-indigo-600',
];

export function SimpleGanttChart({ entries, processes, currentTime }: SimpleGanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const processColorMap = useRef<Record<string, string>>({});

  processes.forEach((p, i) => {
    if (!processColorMap.current[p.id]) {
      processColorMap.current[p.id] = colors[i % colors.length];
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [entries, currentTime]);

  const maxTime = Math.max(currentTime + 5, 15);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Timeline
        </h3>
        <span className="text-sm text-muted-foreground font-mono">
          T = {currentTime}
        </span>
      </div>

      <div 
        ref={scrollRef}
        className="overflow-x-auto pb-2"
      >
        <div className="relative min-w-[600px]" style={{ height: '80px' }}>
          {/* Timeline grid */}
          <div className="absolute inset-x-0 bottom-6 h-px bg-border" />
          
          {/* Time markers */}
          <div className="absolute inset-x-0 bottom-0 flex">
            {Array.from({ length: maxTime + 1 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 flex flex-col items-center"
                style={{ width: '40px' }}
              >
                <div className="w-px h-2 bg-border" />
                <span className="text-[10px] text-muted-foreground mt-1">{i}</span>
              </div>
            ))}
          </div>

          {/* Current time indicator */}
          <div
            className="absolute top-0 bottom-6 w-0.5 bg-primary transition-all duration-300 z-10"
            style={{ left: `${currentTime * 40 + 20}px` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50" />
          </div>

          {/* Gantt bars */}
          <div className="absolute inset-x-0 top-4 bottom-10 flex items-center">
            {entries.map((entry, idx) => {
              const color = processColorMap.current[entry.processId] || colors[0];
              const width = (entry.endTime - entry.startTime) * 40;
              const left = entry.startTime * 40;

              return (
                <div
                  key={`${entry.processId}-${entry.startTime}-${idx}`}
                  className={cn(
                    'absolute h-10 rounded-lg flex items-center justify-center text-xs font-semibold text-white shadow-md',
                    'bg-gradient-to-r animate-scale-in',
                    color
                  )}
                  style={{
                    left: `${left + 4}px`,
                    width: `${Math.max(width - 8, 24)}px`,
                  }}
                >
                  {entry.processName.slice(0, 4)}
                </div>
              );
            })}
          </div>

          {entries.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              Add processes and start to see timeline
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      {processes.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
          {processes.map((p) => (
            <div key={p.id} className="flex items-center gap-2 text-xs">
              <div className={cn('w-3 h-3 rounded bg-gradient-to-r', processColorMap.current[p.id])} />
              <span className="text-muted-foreground">{p.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
