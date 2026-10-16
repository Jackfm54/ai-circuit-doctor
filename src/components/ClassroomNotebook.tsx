import { useState } from "react";
import { AlertTriangle, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

export function DiagnosticLimits() {
  const { t } = useLanguage();
  return (
    <aside className="border-l-2 border-warning bg-warning/5 p-4 space-y-2" aria-label={t.classroom.limitsTitle}>
      <h2 className="flex items-center gap-2 font-semibold text-warning"><AlertTriangle className="h-4 w-4 shrink-0" />{t.classroom.limitsTitle}</h2>
      <p className="text-sm text-muted-foreground">{t.classroom.limits}</p>
      <p className="text-sm text-muted-foreground">{t.classroom.safety}</p>
      <p className="text-sm text-muted-foreground">{t.classroom.schematic}</p>
    </aside>
  );
}

export function ClassroomNotebook() {
  const { t } = useLanguage();
  const [notes, setNotes] = useState({ observation: "", hypothesis: "", verification: "" });
  const fields = ["observation", "hypothesis", "verification"] as const;
  const hasNotes = fields.some((field) => notes[field].trim().length > 0);
  const exportNotes = () => {
    const content = [t.classroom.title, ...fields.map((field) => `${t.classroom[field]}\n${notes[field]}`)].join("\n\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = t.classroom.filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">{t.classroom.title}</h2>
        <p className="text-sm text-primary mt-1">{t.classroom.subtitle}</p>
      </header>
      <div className="grid gap-5 md:grid-cols-3">
        {fields.map((field) => (
          <div key={field} className="space-y-2 min-w-0">
            <label htmlFor={`notebook-${field}`} className="text-sm font-medium">{t.classroom[field]}</label>
            <textarea
              id={`notebook-${field}`}
              className="w-full min-h-48 rounded-md border border-input bg-background p-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={notes[field]}
              placeholder={t.classroom[`${field}Hint`]}
              onChange={(event) => setNotes((current) => ({ ...current, [field]: event.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={exportNotes} disabled={!hasNotes}><Download />{t.classroom.export}</Button>
        <Button variant="outline" disabled={!hasNotes} onClick={() => setNotes({ observation: "", hypothesis: "", verification: "" })}><RotateCcw />{t.classroom.clear}</Button>
      </div>
    </section>
  );
}