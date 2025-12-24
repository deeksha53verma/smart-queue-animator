import { useScheduler } from '@/hooks/useScheduler';
import { AddProcessForm } from '@/components/AddProcessForm';
import { ControlPanel } from '@/components/ControlPanel';
import { ProcessCard } from '@/components/ProcessCard';
import { GanttChart } from '@/components/GanttChart';
import { CPUMonitor } from '@/components/CPUMonitor';
import { AlgorithmPanel } from '@/components/AlgorithmPanel';
import { ProcessStateDiagram } from '@/components/ProcessStateDiagram';
import { Cpu, Terminal, Layers } from 'lucide-react';

const Index = () => {
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Cpu className="w-10 h-10 text-primary" />
                  <div className="absolute inset-0 w-10 h-10 bg-primary/30 rounded-full blur-lg animate-pulse-glow" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground neon-text">
                    Smart Job Queue Manager
                  </h1>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Terminal className="w-3 h-3" />
                    CPU Scheduling Simulation
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                  <Layers className="w-4 h-4 text-primary" />
                  <span>Operating System Concepts</span>
                </div>
                {allCompleted && processes.length > 0 && (
                  <span className="px-3 py-1 bg-success/20 text-success rounded-full text-xs font-semibold animate-pulse">
                    Simulation Complete!
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              <AddProcessForm
                onAdd={addProcess}
                disabled={isRunning && !isPaused}
              />
              <ControlPanel
                algorithm={algorithm}
                onAlgorithmChange={setAlgorithm}
                isRunning={isRunning}
                isPaused={isPaused}
                onStart={startSimulation}
                onPause={pauseSimulation}
                onStep={stepSimulation}
                onReset={resetSimulation}
                speed={speed}
                onSpeedChange={setSpeed}
                timeQuantum={timeQuantum}
                onTimeQuantumChange={setTimeQuantum}
                hasProcesses={processes.length > 0}
              />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-6 space-y-6">
              {/* Process State Diagram */}
              <ProcessStateDiagram currentState={runningProcess?.state} />

              {/* Gantt Chart */}
              <GanttChart
                entries={ganttChart}
                processes={processes}
                currentTime={stats.currentTime}
              />

              {/* Process Queue */}
              <div className="glass-panel rounded-lg p-4">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Process Queue
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {processes.length} process{processes.length !== 1 ? 'es' : ''}
                  </span>
                </h3>

                {processes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No processes in queue</p>
                    <p className="text-xs mt-1">Add a process to start the simulation</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {processes.map((process) => (
                      <ProcessCard
                        key={process.id}
                        process={process}
                        onRemove={removeProcess}
                        isActive={process.state === 'running'}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              <CPUMonitor
                stats={stats}
                runningProcess={runningProcess}
                isRunning={isRunning && !isPaused}
              />
              <AlgorithmPanel algorithm={algorithm} />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 bg-card/30 backdrop-blur-md mt-12">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-xs text-muted-foreground">
              <p className="mb-2">
                <span className="text-primary">OS Concepts Demonstrated:</span>{' '}
                Process Scheduling • CPU Burst Time • Context Switching • Process States • Ready Queue
              </p>
              <p>
                Built for learning Operating System fundamentals through interactive simulation
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
