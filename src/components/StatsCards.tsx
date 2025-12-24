import { CPUStats } from '@/types/process';
import { Clock, Timer, Gauge, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  stats: CPUStats;
  isRunning: boolean;
}

export function StatsCards({ stats, isRunning }: StatsCardsProps) {
  const cards = [
    {
      label: 'CPU Usage',
      value: `${Math.round(stats.cpuUtilization)}%`,
      icon: Activity,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Avg Wait',
      value: `${stats.avgWaitingTime.toFixed(1)}ms`,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Avg Turnaround',
      value: `${stats.avgTurnaroundTime.toFixed(1)}ms`,
      icon: Timer,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      label: 'Throughput',
      value: `${stats.throughput.toFixed(2)}/ms`,
      icon: Gauge,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass-card p-4 flex items-center gap-3"
        >
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', card.bgColor)}>
            <card.icon className={cn('w-5 h-5', card.color)} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className={cn('text-lg font-semibold font-display', card.color)}>
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
