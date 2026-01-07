import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shuffle, Sparkles } from 'lucide-react';
import { ProcessType, PROCESS_TYPE_CONFIG, SchedulingAlgorithm } from '@/types/process';

interface AddProcessModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, arrivalTime: number, burstTime: number, priority: number, type: ProcessType, ioStartTime?: number, ioDuration?: number, deadline?: number) => void;
  algorithm: SchedulingAlgorithm;
}

export function AddProcessModal({ open, onClose, onAdd, algorithm }: AddProcessModalProps) {
  const [name, setName] = useState('');
  const [arrivalTime, setArrivalTime] = useState('0');
  const [burstTime, setBurstTime] = useState('5');
  const [priority, setPriority] = useState('1');
  const [deadline, setDeadline] = useState('20');
  const [type, setType] = useState<ProcessType>('user');
  const [ioEnabled, setIoEnabled] = useState(false);
  const [ioStartTime, setIoStartTime] = useState('2');
  const [ioDuration, setIoDuration] = useState('2');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const processName = name.trim() || `P${Math.floor(Math.random() * 100)}`;
    onAdd(
      processName,
      Math.max(0, parseInt(arrivalTime) || 0),
      Math.max(1, parseInt(burstTime) || 1),
      Math.max(1, parseInt(priority) || 1),
      type,
      ioEnabled ? Math.max(0, parseInt(ioStartTime) || 0) : undefined,
      ioEnabled ? Math.max(1, parseInt(ioDuration) || 0) : undefined,
      algorithm === 'edf' ? Math.max(0, parseInt(deadline) || 0) : undefined
    );
    resetForm();
    onClose();
  };

  const handleQuickAdd = () => {
    // Randomized quick add
    const randomType = Object.keys(PROCESS_TYPE_CONFIG)[Math.floor(Math.random() * 4)] as ProcessType;
    const config = PROCESS_TYPE_CONFIG[randomType];
    const processName = `${config.label} ${Math.floor(Math.random() * 100)}`;
    const arrival = Math.floor(Math.random() * 8);
    // Use default burst/prio from type with some jitter
    const burst = Math.max(1, config.defaultBurst + Math.floor(Math.random() * 4) - 2);
    const prio = config.defaultPriority;

    // 30% chance of IO
    const hasIO = Math.random() > 0.7;
    const ioStart = hasIO ? Math.floor(Math.random() * (burst - 1)) : undefined;
    const ioDur = hasIO ? Math.floor(Math.random() * 5) + 1 : undefined;

    // Random Deadline for EDF
    const randDeadline = arrival + burst + Math.floor(Math.random() * 20);

    onAdd(processName, arrival, burst, prio, randomType, ioStart, ioDur, algorithm === 'edf' ? randDeadline : undefined);
    onClose();
  };

  const handleTypeChange = (newType: ProcessType) => {
    setType(newType);
    const config = PROCESS_TYPE_CONFIG[newType];
    setBurstTime(config.defaultBurst.toString());
    setPriority(config.defaultPriority.toString());
  };

  const handleRandomize = () => {
    setArrivalTime(Math.floor(Math.random() * 10).toString());
    const randomType = Object.keys(PROCESS_TYPE_CONFIG)[Math.floor(Math.random() * 4)] as ProcessType;
    handleTypeChange(randomType);
    // Add random jitter
    setBurstTime((PROCESS_TYPE_CONFIG[randomType].defaultBurst + Math.floor(Math.random() * 4) - 2).toString());
  };

  const resetForm = () => {
    setName('');
    setArrivalTime('0');
    // setBurstTime('5'); // Don't reset these, keep last choice or defaults
    // setPriority('1');
    setIoEnabled(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add New Process</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground mb-1 block">Process Type</Label>
              <Select value={type} onValueChange={(val) => handleTypeChange(val as ProcessType)}>
                <SelectTrigger className="w-full bg-muted/30 border-border/50">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(PROCESS_TYPE_CONFIG) as [ProcessType, typeof PROCESS_TYPE_CONFIG[ProcessType]][]).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${config.color}`} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="name" className="text-xs text-muted-foreground">
                Process Name (optional)
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g., ${PROCESS_TYPE_CONFIG[type].label} 1`}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="arrival" className="text-xs text-muted-foreground">
                Arrival Time
              </Label>
              <Input
                id="arrival"
                type="number"
                min="0"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="burst" className="text-xs text-muted-foreground">
                Burst Time
              </Label>
              <Input
                id="burst"
                type="number"
                min="1"
                value={burstTime}
                onChange={(e) => setBurstTime(e.target.value)}
                className="mt-1.5"
              />
            </div>

            {algorithm === 'priority' && (
              <div className="col-span-2 animate-in slide-in-from-top-1 fade-in duration-200">
                <Label htmlFor="priority" className="text-xs text-muted-foreground">
                  Priority (1 = Highest)
                </Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            )}

            {algorithm === 'edf' && (
              <div className="col-span-2 animate-in slide-in-from-top-1 fade-in duration-200">
                <Label htmlFor="deadline" className="text-xs text-muted-foreground">
                  Deadline (Relative Time)
                </Label>
                <Input
                  id="deadline"
                  type="number"
                  min="1"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="e.g. 20"
                  className="mt-1.5"
                />
              </div>
            )}

            <div className="col-span-2 pt-2 border-t border-border/40">
              <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => setIoEnabled(!ioEnabled)}>
                <div className={`w-4 h-4 rounded border ${ioEnabled ? 'bg-primary border-primary' : 'border-muted-foreground'} flex items-center justify-center`}>
                  {ioEnabled && <div className="w-2 h-2 bg-primary-foreground rounded-sm" />}
                </div>
                <Label className="text-xs font-semibold cursor-pointer">Simulate I/O Operations</Label>
              </div>

              {ioEnabled && (
                <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div>
                    <Label htmlFor="ioStart" className="text-xs text-muted-foreground">I/O Start (relative)</Label>
                    <Input
                      id="ioStart"
                      type="number"
                      min="0"
                      max={Math.max(0, parseInt(burstTime) - 1)}
                      value={ioStartTime}
                      onChange={(e) => setIoStartTime(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ioDur" className="text-xs text-muted-foreground">I/O Duration</Label>
                    <Input
                      id="ioDur"
                      type="number"
                      min="1"
                      value={ioDuration}
                      onChange={(e) => setIoDuration(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRandomize}
              className="flex-1"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Randomize
            </Button>
            <Button type="submit" className="btn-primary flex-1">
              Add Process
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleQuickAdd}
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Quick Add Random Process
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
