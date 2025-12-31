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
        className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
      >
        <div className="relative min-w-[800px]" style={{ height: '120px' }}>
          {/* Timeline grid */}
          <div className="absolute inset-x-0 bottom-8 h-px bg-border" />

          {/* Time markers and Grid lines */}
          <div className="absolute inset-x-0 bottom-0 top-0 flex pointer-events-none">
            {Array.from({ length: maxTime + 1 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 flex flex-col items-center group"
                style={{ width: '60px' }}
              >
                <div className="w-px h-full bg-border/30 group-hover:bg-border/60 transition-colors" />
                <span className="absolute bottom-1 text-[10px] text-muted-foreground font-mono bg-background/80 px-1 rounded">
                  {i}s
                </span>
              </div>
            ))}
          </div>

          {/* Current time indicator */}
          <div
            className="absolute top-0 bottom-8 w-0.5 bg-primary transition-all duration-300 z-10"
            style={{ left: `${currentTime * 60 + 30}px` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/50 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </div>
            {/* Current Time Badge */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-mono whitespace-nowrap shadow-md">
              T={currentTime}
            </div>
          </div>

          {/* Gantt bars */}
          <div className="absolute inset-x-0 top-8 bottom-12 flex items-center">
            {entries.map((entry, idx) => {
              const color = entry.isContextSwitch ? 'bg-muted/50 border border-border text-muted-foreground' : (processColorMap.current[entry.processId] || colors[0]);
              const width = (entry.endTime - entry.startTime) * 60;
              const left = entry.startTime * 60;

              return (
                <div
                  key={`${entry.processId}-${entry.startTime}-${idx}`}
                  className={cn(
                    'absolute h-14 rounded-md flex flex-col items-center justify-center text-xs font-semibold shadow-sm overflow-hidden border border-white/10',
                    'transition-all duration-300 hover:shadow-md hover:scale-[1.02] z-0 hover:z-20 cursor-default',
                    color
                  )}
                  style={{
                    left: `${left + 2}px`,
                    width: `${Math.max(width - 4, 24)}px`,
                  }}
                  title={`${entry.processName}: ${entry.startTime}-${entry.endTime}`}
                >
                  <span className="truncate w-full text-center px-1 text-white text-xs drop-shadow-md">
                    {entry.processName}
                  </span>
                  {!entry.isContextSwitch && width > 40 && (
                    <span className="text-[9px] opacity-80 text-white font-mono">
                      {entry.endTime - entry.startTime}ms
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {entries.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center p-4 bg-muted/20 rounded-xl border border-dashed border-border">
                Add processes and start to see timeline
              </div>
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
