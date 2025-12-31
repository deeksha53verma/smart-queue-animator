import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Shuffle, Settings2 } from 'lucide-react';
import { Process, ProcessType, PROCESS_TYPE_CONFIG } from '@/types/process';

interface AddProcessFormProps {
  onAdd: (name: string, arrivalTime: number, burstTime: number, priority: number, type: ProcessType, ioStartTime?: number, ioDuration?: number) => void;
  disabled?: boolean;
}

export function AddProcessForm({ onAdd, disabled }: AddProcessFormProps) {
  const [name, setName] = useState('');
  const [arrivalTime, setArrivalTime] = useState('0');
  const [burstTime, setBurstTime] = useState('5');
  const [priority, setPriority] = useState('1');
  const [type, setType] = useState<ProcessType>('user');
  const [ioEnabled, setIoEnabled] = useState(false);
  const [ioStartTime, setIoStartTime] = useState('2');
  const [ioDuration, setIoDuration] = useState('2');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const processName = name.trim() || `P${Date.now() % 1000}`;
    onAdd(
      processName,
      Math.max(0, parseInt(arrivalTime) || 0),
      Math.max(1, parseInt(burstTime) || 1),
      Math.max(1, parseInt(priority) || 1),
      type,
      ioEnabled ? Math.max(0, parseInt(ioStartTime) || 0) : undefined,
      ioEnabled ? Math.max(1, parseInt(ioDuration) || 0) : undefined
    );
    // Reset
    setName('');
    setArrivalTime('0');
    // Keep type defaults or reset? Let's reset to defaults for the current type
    // or just keep them.
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
    // Add random jitter to defaults
    setBurstTime((PROCESS_TYPE_CONFIG[randomType].defaultBurst + Math.floor(Math.random() * 4) - 2).toString());
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Add New Process
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRandomize}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <Shuffle className="w-3.5 h-3.5 mr-1" />
          Randomize
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground mb-1 block">Process Type</Label>
          <Select value={type} onValueChange={(val) => handleTypeChange(val as ProcessType)} disabled={disabled}>
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
            Process Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`e.g., ${PROCESS_TYPE_CONFIG[type].label} 1`}
            className="mt-1 bg-muted/30 border-border/50 focus:border-primary"
            disabled={disabled}
          />
        </div>

        <div>
          <Label htmlFor="arrival" className="text-xs text-muted-foreground">
            Arrival Time (ms)
          </Label>
          <Input
            id="arrival"
            type="number"
            min="0"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
            className="mt-1 bg-muted/30 border-border/50 focus:border-primary"
            disabled={disabled}
          />
        </div>

        <div>
          <Label htmlFor="burst" className="text-xs text-muted-foreground">
            Burst Time (ms)
          </Label>
          <Input
            id="burst"
            type="number"
            min="1"
            value={burstTime}
            onChange={(e) => setBurstTime(e.target.value)}
            className="mt-1 bg-muted/30 border-border/50 focus:border-primary"
            disabled={disabled}
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="priority" className="text-xs text-muted-foreground">
            Priority (1 = Highest)
          </Label>
          <Input
            id="priority"
            type="number"
            min="1"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="mt-1 bg-muted/30 border-border/50 focus:border-primary"
            disabled={disabled}
          />
        </div>

        <div className="col-span-2 pt-2 border-t border-border/40">
          <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => setIoEnabled(!ioEnabled)}>
            <div className={`w-4 h-4 rounded border ${ioEnabled ? 'bg-primary border-primary' : 'border-muted-foreground'} flex items-center justify-center`}>
              {ioEnabled && <div className="w-2 h-2 bg-primary-foreground rounded-sm" />}
            </div>
            <Label className="text-xs font-semibold cursor-pointer">simulate I/O Operations</Label>
          </div>

          {ioEnabled && (
            <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 fade-in duration-200">
              <div>
                <Label htmlFor="ioStart" className="text-xs text-muted-foreground">I/O Start (relative)</Label>
                <Input
                  id="ioStart"
                  type="number"
                  min="0"
                  max={parseInt(burstTime) - 1}
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

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        disabled={disabled}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Process
      </Button>
    </form>
  );
}
