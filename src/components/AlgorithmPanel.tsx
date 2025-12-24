import { SchedulingAlgorithm } from '@/types/process';
import { algorithmInfo } from '@/utils/schedulingAlgorithms';
import { Code, BookOpen, ThumbsUp, ThumbsDown, Lightbulb } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AlgorithmPanelProps {
  algorithm: SchedulingAlgorithm;
}

export function AlgorithmPanel({ algorithm }: AlgorithmPanelProps) {
  const info = algorithmInfo[algorithm];

  return (
    <div className="glass-panel rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg font-semibold text-foreground">
          Algorithm Details
        </h3>
      </div>

      <Tabs defaultValue="concept" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="concept" className="text-xs">
            <Lightbulb className="w-3.5 h-3.5 mr-1" />
            Concept
          </TabsTrigger>
          <TabsTrigger value="code" className="text-xs">
            <Code className="w-3.5 h-3.5 mr-1" />
            Pseudocode
          </TabsTrigger>
          <TabsTrigger value="analysis" className="text-xs">
            <ThumbsUp className="w-3.5 h-3.5 mr-1" />
            Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="concept" className="flex-1 mt-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">{info.name}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {info.description}
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 border-l-4 border-primary">
            <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              OS Concept
            </h5>
            <p className="text-sm text-muted-foreground">{info.concept}</p>
          </div>
        </TabsContent>

        <TabsContent value="code" className="flex-1 mt-4">
          <div className="code-block h-full overflow-auto">
            <pre className="text-xs text-foreground/90 whitespace-pre-wrap">
              {info.pseudocode}
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="flex-1 mt-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-success mb-2">
              <ThumbsUp className="w-4 h-4" />
              <h5 className="text-sm font-semibold">Advantages</h5>
            </div>
            <ul className="space-y-1.5">
              {info.pros.map((pro, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-success mt-1">•</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <ThumbsDown className="w-4 h-4" />
              <h5 className="text-sm font-semibold">Disadvantages</h5>
            </div>
            <ul className="space-y-1.5">
              {info.cons.map((con, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
