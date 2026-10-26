import { Usb } from "lucide-react";
import type { MeasurementData } from "@/lib/serialMeasurement";
import { useLanguage } from "@/i18n/LanguageContext";

/** Shows the physical Nano readings that were sent with this report. */
export function MeasurementsUsed({ measurements }: { measurements: MeasurementData[] }) {
  const { t } = useLanguage();
  if (measurements.length === 0) return null;

  const byChannel = new Map<string, { last: MeasurementData; count: number; min: number; max: number }>();
  for (const m of measurements) {
    const key = `${m.type}-${m.channel}`;
    const prev = byChannel.get(key);
    byChannel.set(key, prev
      ? { last: m, count: prev.count + 1, min: Math.min(prev.min, m.value), max: Math.max(prev.max, m.value) }
      : { last: m, count: 1, min: m.value, max: m.value });
  }

  return (
    <section className="max-w-5xl mx-auto rounded-xl border border-border bg-card p-5 space-y-3">
      <h3 className="flex items-center gap-2 font-semibold">
        <Usb className="w-4 h-4 text-primary" />
        {t.hardware.usedInReport}
        <span className="ml-auto text-xs font-mono text-muted-foreground">{measurements.length} {t.hardware.readings}</span>
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {[...byChannel.values()].map(({ last, count, min, max }) => (
          <div key={`${last.type}-${last.channel}`} className="rounded-lg border border-border/60 bg-background/40 p-3 font-mono text-sm">
            <div className="text-xs text-muted-foreground">{t.hardware.channel} {last.channel} · {last.type}</div>
            <div className="text-lg text-foreground">{last.value.toFixed(3)} {last.unit}</div>
            <div className="text-xs text-muted-foreground">
              min {min.toFixed(3)} · max {max.toFixed(3)} · {count} {t.hardware.readings}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
