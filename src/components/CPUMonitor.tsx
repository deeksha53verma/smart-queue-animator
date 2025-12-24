import { CPUStats, Process } from '@/types/process';
import { Cpu, Clock, Activity, TrendingUp, Gauge, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CPUMonitorProps {
  stats: CPUStats;
  runningProcess: Process | null;
  isRunning: boolean;
}

export function CPUMonitor({ stats, runningProcess, isRunning }: CPUMonitorProps) {
  const utilization = Math.round(stats.cpuUtilization);

  return (
    <div className="glass-panel rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary" />
          CPU Monitor
        </h3>
        <div className={cn(
          'px-3 py-1 rounded-full text-xs font-semibold',
          isRunning ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
        )}>
          {isRunning ? 'ACTIVE' : 'IDLE'}
        </div>
      </div>

      {/* CPU Utilization Gauge */}
      <div className="relative">
        <div className="flex items-center justify-center py-6">
          <div className="relative w-32 h-32">
            {/* Background ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${utilization * 2.51} 251`}
                className="transition-all duration-500"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-display font-bold text-foreground">
                {utilization}%
              </span>
              <span className="text-xs text-muted-foreground">Utilization</span>
            </div>
          </div>
        </div>

        {/* Running process indicator */}
        {runningProcess && (
          <div className="absolute top-2 right-2 animate-pulse">
            <div className="flex items-center gap-2 bg-success/20 text-success px-3 py-1.5 rounded-lg text-xs">
              <Activity className="w-3.5 h-3.5" />
              <span>Executing: {runningProcess.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Avg Wait Time"
          value={`${stats.avgWaitingTime.toFixed(1)}ms`}
          color="text-warning"
        />
        <StatCard
          icon={<Timer className="w-4 h-4" />}
          label="Avg Turnaround"
          value={`${stats.avgTurnaroundTime.toFixed(1)}ms`}
          color="text-secondary"
        />
        <StatCard
          icon={<Gauge className="w-4 h-4" />}
          label="Avg Response"
          value={`${stats.avgResponseTime.toFixed(1)}ms`}
          color="text-accent"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Throughput"
          value={`${stats.throughput.toFixed(2)}/ms`}
          color="text-primary"
        />
      </div>

      {/* Current Time */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <span className="text-sm text-muted-foreground">System Time</span>
        <span className="font-mono text-lg font-bold text-primary">
          T = {stats.currentTime}
        </span>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-muted/30 rounded-lg p-3">
      <div className={cn('flex items-center gap-2 mb-1', color)}>
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
