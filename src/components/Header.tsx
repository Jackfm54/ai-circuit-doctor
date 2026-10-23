import { CircuitBoard, PlayCircle } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onHome?: () => void;
  onDemo?: () => void;
}

export function Header({ onHome, onDemo }: HeaderProps) {
  const { t } = useLanguage();

  return (
    <header className="no-print border-b border-border/60 bg-background/85 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <button type="button" onClick={onHome} className="flex items-center gap-3 text-left">
          <div className="p-2 rounded-md bg-primary/10 border border-primary/30">
            <CircuitBoard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight leading-none">
              <span className="text-primary">Circuit</span>Diag
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-1">{t.header.subtitle}</p>
          </div>
        </button>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={() => { onHome?.(); setTimeout(() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" }), 50); }}>
            {t.pro.navHow}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDemo}>
            <PlayCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{t.pro.navDemo}</span>
          </Button>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
