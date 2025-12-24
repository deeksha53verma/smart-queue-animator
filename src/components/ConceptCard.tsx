import { SchedulingAlgorithm } from '@/types/process';
import { algorithmInfo } from '@/utils/schedulingAlgorithms';
import { BookOpen, Code2, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ConceptCardProps {
  algorithm: SchedulingAlgorithm;
}

export function ConceptCard({ algorithm }: ConceptCardProps) {
  const [showCode, setShowCode] = useState(false);
  const info = algorithmInfo[algorithm];

  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Learn
        </h3>
        <button
          onClick={() => setShowCode(!showCode)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            showCode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          <Code2 className="w-3.5 h-3.5" />
          {showCode ? 'Hide Code' : 'Show Code'}
        </button>
      </div>

      {!showCode ? (
        <div className="space-y-4 animate-slide-up">
          <div>
            <h4 className="font-semibold text-foreground mb-1">{info.name}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {info.description}
            </p>
          </div>

          <div className="bg-primary/5 rounded-xl p-4 border-l-4 border-primary">
            <p className="text-sm text-foreground/80">{info.concept}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-semibold text-success flex items-center gap-1 mb-2">
                <CheckCircle className="w-3.5 h-3.5" />
                Pros
              </h5>
              <ul className="space-y-1">
                {info.pros.map((pro, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-success mt-0.5">•</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-destructive flex items-center gap-1 mb-2">
                <XCircle className="w-3.5 h-3.5" />
                Cons
              </h5>
              <ul className="space-y-1">
                {info.cons.map((con, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-destructive mt-0.5">•</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-slide-up">
          <div className="bg-foreground/5 rounded-xl p-4 font-mono text-xs overflow-auto max-h-[300px]">
            <pre className="text-foreground/80 whitespace-pre-wrap">{info.pseudocode}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
