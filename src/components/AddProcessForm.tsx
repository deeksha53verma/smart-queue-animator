import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Shuffle } from 'lucide-react';

interface AddProcessFormProps {
  onAdd: (name: string, arrivalTime: number, burstTime: number, priority: number) => void;
  disabled?: boolean;
}

export function AddProcessForm({ onAdd, disabled }: AddProcessFormProps) {
  const [name, setName] = useState('');
  const [arrivalTime, setArrivalTime] = useState('0');
  const [burstTime, setBurstTime] = useState('5');
  const [priority, setPriority] = useState('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const processName = name.trim() || `P${Date.now() % 1000}`;
    onAdd(
      processName,
      Math.max(0, parseInt(arrivalTime) || 0),
      Math.max(1, parseInt(burstTime) || 1),
      Math.max(1, parseInt(priority) || 1)
    );
    setName('');
    setArrivalTime('0');
    setBurstTime('5');
    setPriority('1');
  };

  const handleRandomize = () => {
    setArrivalTime(Math.floor(Math.random() * 10).toString());
    setBurstTime((Math.floor(Math.random() * 9) + 1).toString());
    setPriority((Math.floor(Math.random() * 5) + 1).toString());
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
          <Label htmlFor="name" className="text-xs text-muted-foreground">
            Process Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Process A"
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
