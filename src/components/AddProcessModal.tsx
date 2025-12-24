import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shuffle, Sparkles } from 'lucide-react';

interface AddProcessModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, arrivalTime: number, burstTime: number, priority: number) => void;
}

export function AddProcessModal({ open, onClose, onAdd }: AddProcessModalProps) {
  const [name, setName] = useState('');
  const [arrivalTime, setArrivalTime] = useState('0');
  const [burstTime, setBurstTime] = useState('5');
  const [priority, setPriority] = useState('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const processName = name.trim() || `P${Math.floor(Math.random() * 100)}`;
    onAdd(
      processName,
      Math.max(0, parseInt(arrivalTime) || 0),
      Math.max(1, parseInt(burstTime) || 1),
      Math.max(1, parseInt(priority) || 1)
    );
    resetForm();
    onClose();
  };

  const handleQuickAdd = () => {
    const processName = `P${Math.floor(Math.random() * 100)}`;
    const arrival = Math.floor(Math.random() * 8);
    const burst = Math.floor(Math.random() * 8) + 2;
    const prio = Math.floor(Math.random() * 5) + 1;
    onAdd(processName, arrival, burst, prio);
  };

  const handleRandomize = () => {
    setArrivalTime(Math.floor(Math.random() * 10).toString());
    setBurstTime((Math.floor(Math.random() * 9) + 1).toString());
    setPriority((Math.floor(Math.random() * 5) + 1).toString());
  };

  const resetForm = () => {
    setName('');
    setArrivalTime('0');
    setBurstTime('5');
    setPriority('1');
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
              <Label htmlFor="name" className="text-xs text-muted-foreground">
                Process Name (optional)
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Process A"
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
                className="mt-1.5"
              />
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
