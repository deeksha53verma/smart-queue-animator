import { useNavigate } from 'react-router-dom';
import { useSchedulerContext } from '@/context/SchedulerContext';
import { ArrowLeft, Clock, BarChart2 } from 'lucide-react';
import { SimpleGanttChart } from '@/components/SimpleGanttChart';

const AnalysisPage = () => {
    const navigate = useNavigate();
    const { processes, ganttChart, stats } = useSchedulerContext();

    const sortedProcesses = [...processes].sort((a, b) =>
        a.completionTime && b.completionTime ? a.completionTime - b.completionTime : 0
    );

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 animate-fade-in">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-3 hover:bg-muted rounded-full transition-colors border border-border"
                    >
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">Simulation Analysis</h1>
                        <p className="text-muted-foreground">Detailed breakdown of CPU scheduling metrics</p>
                    </div>
                </header>

                {/* 1. Gantt Chart Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-semibold">Execution Timeline (Gantt Chart)</h2>
                    </div>
                    <div className="glass-card p-6 overflow-hidden">
                        <SimpleGanttChart
                            entries={ganttChart}
                            processes={processes}
                            currentTime={stats.currentTime}
                        />
                    </div>
                </div>

                {/* 2. Calculation Table */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-secondary" />
                        <h2 className="text-xl font-semibold">Process Performance Metrics</h2>
                    </div>

                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="text-left py-4 px-6 font-semibold">Process</th>
                                        <th className="text-center py-4 px-4 font-semibold text-muted-foreground">Arrival (AT)</th>
                                        <th className="text-center py-4 px-4 font-semibold text-muted-foreground">Burst (BT)</th>
                                        <th className="text-center py-4 px-4 font-semibold text-muted-foreground">Priority</th>
                                        <th className="text-center py-4 px-4 font-semibold text-foreground bg-primary/5">Completion (CT)</th>
                                        <th className="text-center py-4 px-4 font-semibold text-foreground bg-primary/5">Turnaround (TAT)</th>
                                        <th className="text-center py-4 px-4 font-semibold text-foreground bg-primary/5">Waiting (WT)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {processes.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No processes in simulation. Go back and run a simulation first.
                                            </td>
                                        </tr>
                                    ) : (
                                        sortedProcesses.map((p) => (
                                            <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-3 px-6 font-medium font-mono text-primary">{p.name}</td>
                                                <td className="text-center py-3 px-4">{p.arrivalTime}</td>
                                                <td className="text-center py-3 px-4">{p.burstTime}</td>
                                                <td className="text-center py-3 px-4">{p.priority}</td>
                                                <td className="text-center py-3 px-4 font-mono">{p.completionTime ?? '-'}</td>
                                                <td className="text-center py-3 px-4 font-mono">{p.turnaroundTime}</td>
                                                <td className="text-center py-3 px-4 font-mono">{p.waitingTime}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {processes.length > 0 && (
                                    <tfoot>
                                        <tr className="bg-muted/30 border-t-2 border-border font-semibold">
                                            <td colSpan={4} className="py-4 px-6 text-right">Averages:</td>
                                            <td className="text-center py-4 px-4">-</td>
                                            <td className="text-center py-4 px-4 text-primary">
                                                {stats.avgTurnaroundTime.toFixed(2)}
                                            </td>
                                            <td className="text-center py-4 px-4 text-primary">
                                                {stats.avgWaitingTime.toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                </div>

                {/* Formulas / Explanations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
                    <div className="glass-panel p-4">
                        <h3 className="font-semibold text-foreground mb-2">Formulas Used:</h3>
                        <ul className="space-y-1 list-disc list-inside">
                            <li><strong>Turnaround Time (TAT)</strong> = Completion Time - Arrival Time</li>
                            <li><strong>Waiting Time (WT)</strong> = Turnaround Time - Burst Time</li>
                        </ul>
                    </div>
                    <div className="glass-panel p-4">
                        <h3 className="font-semibold text-foreground mb-2">Scheduler Details:</h3>
                        <ul className="space-y-1">
                            <li>Algorithm: <span className="text-foreground capitalize">{useSchedulerContext().algorithm.replace('-', ' ')}</span></li>
                            <li>Total Simulation Time: <span className="text-foreground">{stats.currentTime} units</span></li>
                            <li>CPU Utilization: <span className="text-foreground">{stats.cpuUtilization.toFixed(1)}%</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisPage;
