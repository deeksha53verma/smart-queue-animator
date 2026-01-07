import { GanttChartEntry, Process, PROCESS_TYPE_CONFIG } from '@/types/process';
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
        className="overflow-x-auto pb-4"
      >
        <div className="relative min-w-[800px]" style={{ height: '140px' }}>
          {/* Static Timeline grid */}
          <div className="absolute inset-x-0 bottom-8 h-px bg-foreground/20" />

          {/* Time markers (Static) */}
          <div className="absolute inset-x-0 bottom-0 top-0 flex pointer-events-none">
            {Array.from({ length: maxTime + 1 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 flex flex-col items-start relative box-border"
                style={{ width: '60px' }} // Fixed scale
              >
                <div className="w-px h-full bg-border/20" />
                <span className="absolute bottom-1 -left-1 text-[10px] text-foreground/70 font-mono translate-x-[-25%]">
                  {i}
                </span>
              </div>
            ))}
          </div>

          {/* Gantt bars (Static blocks) */}
          <div className="absolute inset-x-0 top-6 bottom-10 flex items-center">
            {entries.map((entry, idx) => {
              // Map entry process to type color if available, else usage hash
              const process = processes.find(p => p.id === entry.processId);
              const typeConfig = process ? PROCESS_TYPE_CONFIG[process.type] : null;

              // Use explicit hex colors from config or fallback
              const colorClass = entry.processId === 'idle'
                ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-muted-foreground/50'
                : entry.processId === 'io-wait'
                  ? 'bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 dashed-border'
                  : (typeConfig ? typeConfig.color : (processColorMap.current[entry.processId] || colors[0]));

              const width = (entry.endTime - entry.startTime) * 60;
              const left = entry.startTime * 60;

              return (
                <div
                  key={`${entry.processId}-${entry.startTime}-${idx}`}
                  className={cn(
                    'absolute h-16 flex flex-col items-center justify-center text-xs font-bold shadow-sm',
                    'border-2 border-white/20', // Solid border for block look
                    colorClass,
                    // Remove animation classes
                  )}
                  style={{
                    left: `${left}px`,
                    width: `${width}px`,
                  }}
                  title={`${entry.processName}: ${entry.startTime}-${entry.endTime}`}
                >
                  <span className={cn(
                    "truncate w-full text-center px-1 shadow-sm",
                    entry.processId === 'idle' ? "text-muted-foreground/50" :
                      entry.processId === 'io-wait' ? "text-orange-600 dark:text-orange-400" : "text-white"
                  )}>
                    {entry.processName}
                  </span>
                  {width > 40 && (
                    <span className={cn(
                      "text-[10px] font-mono",
                      entry.processId === 'idle' ? "text-muted-foreground/40" :
                        entry.processId === 'io-wait' ? "text-orange-600/80 dark:text-orange-400/80" : "text-white/90"
                    )}>
                      {entry.endTime - entry.startTime}ms
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {entries.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm font-medium bg-muted/10 rounded-xl border border-dashed border-border/50">
              Start simulation to verify timeline
            </div>
          )}
        </div>
      </div>

      {/* Legend with new colors */}
      {processes.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-border/50">
          <span className="text-xs font-semibold uppercase text-muted-foreground mr-2">Legend:</span>
          {Object.entries(PROCESS_TYPE_CONFIG).map(([type, config]) => (
            <div key={type} className="flex items-center gap-2 text-xs">
              <div className={cn('w-4 h-4 rounded shadow-sm border border-white/10', config.color)} />
              <span className="text-foreground font-medium">{config.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
