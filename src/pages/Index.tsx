import { useState } from 'react';
import { useScheduler } from '@/hooks/useScheduler';
import { SimpleControls } from '@/components/SimpleControls';
import { QueueVisualizer } from '@/components/QueueVisualizer';
import { SimpleGanttChart } from '@/components/SimpleGanttChart';
import { StatsCards } from '@/components/StatsCards';
import { ConceptCard } from '@/components/ConceptCard';
import { AddProcessModal } from '@/components/AddProcessModal';
import { Cpu, Sparkles } from 'lucide-react';

const Index = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  
  const {
    processes,
    algorithm,
    setAlgorithm,
    isRunning,
    isPaused,
    ganttChart,
    speed,
    setSpeed,
    timeQuantum,
    setTimeQuantum,
    stats,
    runningProcess,
    addProcess,
    removeProcess,
    startSimulation,
    pauseSimulation,
    stepSimulation,
    resetSimulation,
    allCompleted,
  } = useScheduler();

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/25">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-xl font-bold text-foreground">
                    CPU Scheduler
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Interactive Job Queue Simulation
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {allCompleted && processes.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-xl text-sm font-medium animate-scale-in">
                    <Sparkles className="w-4 h-4" />
                    Simulation Complete!
                  </div>
                )}
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-muted rounded-xl">
                  <span className="text-xs text-muted-foreground">Time:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {stats.currentTime}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Stats Row */}
          <StatsCards stats={stats} isRunning={isRunning} />

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Controls + Concept */}
            <div className="space-y-6">
              <SimpleControls
                algorithm={algorithm}
                onAlgorithmChange={setAlgorithm}
                isRunning={isRunning}
                isPaused={isPaused}
                onStart={startSimulation}
                onPause={pauseSimulation}
                onStep={stepSimulation}
                onReset={resetSimulation}
                onAddProcess={() => setShowAddModal(true)}
                hasProcesses={processes.length > 0}
                speed={speed}
                onSpeedChange={setSpeed}
              />
              
              <ConceptCard algorithm={algorithm} />
            </div>

            {/* Right: Visualizations */}
            <div className="lg:col-span-2 space-y-6">
              {/* Process Flow */}
              <QueueVisualizer 
                processes={processes} 
                onRemove={removeProcess} 
              />

              {/* Gantt Chart */}
              <SimpleGanttChart
                entries={ganttChart}
                processes={processes}
                currentTime={stats.currentTime}
              />

              {/* Process List (if any) */}
              {processes.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                    All Processes ({processes.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Name</th>
                          <th className="text-center py-2 px-3 text-muted-foreground font-medium">Status</th>
                          <th className="text-center py-2 px-3 text-muted-foreground font-medium">Arrival</th>
                          <th className="text-center py-2 px-3 text-muted-foreground font-medium">Burst</th>
                          <th className="text-center py-2 px-3 text-muted-foreground font-medium">Priority</th>
                          <th className="text-center py-2 px-3 text-muted-foreground font-medium">Remaining</th>
                          <th className="text-center py-2 px-3 text-muted-foreground font-medium">Wait</th>
                          <th className="text-center py-2 px-3 text-muted-foreground font-medium">Turnaround</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processes.map((p, idx) => (
                          <tr 
                            key={p.id} 
                            className={`border-b border-border/50 animate-slide-up ${p.state === 'running' ? 'bg-success/5' : ''}`}
                            style={{ animationDelay: `${idx * 30}ms` }}
                          >
                            <td className="py-3 px-3 font-medium">{p.name}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`process-pill state-${p.state}`}>
                                {p.state}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center text-muted-foreground">{p.arrivalTime}</td>
                            <td className="py-3 px-3 text-center text-muted-foreground">{p.burstTime}</td>
                            <td className="py-3 px-3 text-center text-muted-foreground">{p.priority}</td>
                            <td className="py-3 px-3 text-center font-mono">
                              {p.state === 'terminated' ? '—' : `${p.remainingTime}ms`}
                            </td>
                            <td className="py-3 px-3 text-center text-muted-foreground">
                              {p.state === 'terminated' ? `${p.waitingTime}ms` : '—'}
                            </td>
                            <td className="py-3 px-3 text-center text-muted-foreground">
                              {p.state === 'terminated' ? `${p.turnaroundTime}ms` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {processes.length === 0 && (
                <div className="glass-card p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Cpu className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    No Processes Yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add some processes to start the simulation
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-2.5 btn-primary rounded-xl font-medium inline-flex items-center gap-2"
                  >
                    Add Your First Process
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="pt-8 pb-4 text-center">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">OS Concepts:</span>{' '}
              Process States • CPU Scheduling • Context Switching • Ready Queue • Burst Time
            </p>
          </footer>
        </main>
      </div>

      {/* Add Process Modal */}
      <AddProcessModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addProcess}
      />
    </div>
  );
};

export default Index;
