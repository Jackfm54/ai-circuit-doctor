import { Cpu, CircuitBoard } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <CircuitBoard className="w-6 h-6 text-primary" />
            </div>
            <Cpu className="w-3 h-3 text-primary absolute -bottom-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-primary">Circuit</span>
              <span className="text-foreground">Diag</span>
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Diagnóstico con IA v1.0
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
