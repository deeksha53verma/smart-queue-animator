import { ProcessState } from '@/types/process';
import { cn } from '@/lib/utils';

interface ProcessStateDiagramProps {
  currentState?: ProcessState;
}

const states: { id: ProcessState; label: string; x: number; y: number }[] = [
  { id: 'new', label: 'NEW', x: 50, y: 50 },
  { id: 'ready', label: 'READY', x: 200, y: 50 },
  { id: 'running', label: 'RUNNING', x: 350, y: 50 },
  { id: 'waiting', label: 'WAITING', x: 350, y: 150 },
  { id: 'terminated', label: 'TERMINATED', x: 500, y: 50 },
];

const transitions = [
  { from: 'new', to: 'ready', label: 'Admit' },
  { from: 'ready', to: 'running', label: 'Dispatch' },
  { from: 'running', to: 'ready', label: 'Interrupt' },
  { from: 'running', to: 'waiting', label: 'I/O Wait' },
  { from: 'waiting', to: 'ready', label: 'I/O Complete' },
  { from: 'running', to: 'terminated', label: 'Exit' },
];

export function ProcessStateDiagram({ currentState }: ProcessStateDiagramProps) {
  const getStatePosition = (id: ProcessState) => {
    return states.find((s) => s.id === id) || states[0];
  };

  return (
    <div className="glass-panel rounded-lg p-4">
      <h3 className="font-display text-lg font-semibold text-foreground mb-4">
        Process State Diagram
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Five-state process model used in operating systems
      </p>
      
      <div className="relative w-full h-52 overflow-auto">
        <svg className="w-full h-full min-w-[560px]" viewBox="0 0 560 200">
          {/* Draw transitions */}
          {transitions.map((t, i) => {
            const from = getStatePosition(t.from as ProcessState);
            const to = getStatePosition(t.to as ProcessState);
            
            // Calculate curve control points
            const isActive = currentState === t.from || currentState === t.to;
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            
            // Special handling for curved arrows
            let path = '';
            let labelX = midX;
            let labelY = midY - 10;
            
            if (t.from === 'running' && t.to === 'ready') {
              // Curved arrow above
              path = `M ${from.x} ${from.y - 20} Q ${midX} ${from.y - 60} ${to.x + 40} ${to.y - 20}`;
              labelY = from.y - 50;
            } else if (t.from === 'running' && t.to === 'waiting') {
              path = `M ${from.x} ${from.y + 20} L ${to.x} ${to.y - 20}`;
              labelX = from.x + 20;
            } else if (t.from === 'waiting' && t.to === 'ready') {
              path = `M ${from.x - 40} ${from.y} Q ${midX - 50} ${midY} ${to.x + 40} ${to.y + 20}`;
              labelX = midX - 60;
              labelY = midY + 10;
            } else {
              path = `M ${from.x + 40} ${from.y} L ${to.x - 40} ${to.y}`;
            }

            return (
              <g key={i}>
                <path
                  d={path}
                  fill="none"
                  stroke={isActive ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                  strokeWidth={isActive ? 2 : 1.5}
                  markerEnd="url(#arrowhead)"
                  className="transition-all duration-300"
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  className={cn(
                    'text-[9px] fill-current transition-colors duration-300',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {t.label}
                </text>
              </g>
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="hsl(var(--muted-foreground))"
              />
            </marker>
          </defs>

          {/* Draw states */}
          {states.map((state) => {
            const isActive = currentState === state.id;
            
            return (
              <g key={state.id}>
                <rect
                  x={state.x - 40}
                  y={state.y - 20}
                  width="80"
                  height="40"
                  rx="8"
                  className={cn(
                    'transition-all duration-300',
                    isActive
                      ? 'fill-primary stroke-primary'
                      : 'fill-muted/50 stroke-border'
                  )}
                  strokeWidth={isActive ? 2 : 1}
                />
                {isActive && (
                  <rect
                    x={state.x - 40}
                    y={state.y - 20}
                    width="80"
                    height="40"
                    rx="8"
                    className="fill-none stroke-primary animate-pulse-ring"
                    strokeWidth="2"
                  />
                )}
                <text
                  x={state.x}
                  y={state.y + 4}
                  textAnchor="middle"
                  className={cn(
                    'text-xs font-semibold transition-colors duration-300',
                    isActive ? 'fill-primary-foreground' : 'fill-foreground'
                  )}
                >
                  {state.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
