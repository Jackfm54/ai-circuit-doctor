import { useState } from "react";
import { Cpu, Cable, Download, Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/i18n/LanguageContext";
import firmware from "../../public/firmware/circuit_diagnostic.ino?raw";

export function HardwareGuide() {
  const { language } = useLanguage();
  const fr = language === "fr";
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const steps = fr ? [
    "Nano seule : chargez ce code dans Arduino IDE (Nano, ATmega328P ; Old Bootloader si nécessaire). Seul A0 / CH1 est actif au départ.",
    "Étalonnage : Nano alimentée par USB, mesurez entre 5V et GND au multimètre. Reportez cette valeur dans VREF puis rechargez le code. Ne confondez pas 5V et VIN.",
    "Vérification : débranchez l’USB, reliez le négatif de deux piles AA à GND et leur positif à A0 via 1 kΩ. Rebranchez l’USB. Comparez CH1 avec le multimètre. Arrêtez si les lectures ne concordent pas.",
    "Carte inconnue : aucun branchement à la Nano. Identifiez d’abord son modèle, sa masse et un point de test documenté. Carte débranchée, résistances et continuité se vérifient au multimètre, après vérification d’absence de tension et décharge conforme au fabricant.",
    "Carte alimentée : seulement après validation d’un point DC compris entre 0 V et moins de 5 V et de VREF, avec une alimentation basse tension isolée et compatible. Coupez toutes les alimentations avant de placer les clips. Ne mettez jamais la carte sous tension sans avoir validé ce branchement.",
    "Acquisition : fermez Arduino IDE et son moniteur série, connectez la Nano dans Chrome ou Edge, lancez puis arrêtez les mesures. Pour la même carte, ouvrez ensuite l’onglet Photo et chargez son image : les mesures capturées accompagnent l’analyse."
  ] : [
    "Nano alone: upload this code with Arduino IDE (Nano, ATmega328P; Old Bootloader if needed). Only A0 / CH1 is enabled initially.",
    "Calibration: with USB powering the Nano, measure 5V to GND using your multimeter. Enter that reading as VREF and upload again. Do not confuse 5V with VIN.",
    "Check: unplug USB, connect two AA batteries’ negative to GND and positive to A0 through 1 kΩ. Reconnect USB. Compare CH1 with the multimeter. Stop if readings disagree.",
    "Unknown board: do not connect the Nano. First identify the model, ground and a documented test point. Resistance and continuity require a multimeter on an unpowered board, after checking for residual voltage and discharge according to the manufacturer.",
    "Powered board: only after validating a DC point from 0 V to below both 5 V and VREF, with a compatible isolated low-voltage supply. Turn all power off before attaching clips. Never power the board before validating this wiring.",
    "Capture: close Arduino IDE and its serial monitor, connect the Nano in Chrome or Edge, start then stop measurements. For the same board, then open Photo and upload its image: the captured measurements accompany analysis."
  ];
  return <div className="space-y-8">
    <section className="space-y-4">
      <h3 className="flex items-center gap-2 text-xl font-semibold"><Cpu className="h-5 w-5 text-primary" />Arduino Nano · ATmega328P</h3>
      <div role="alert" className="flex gap-3 border-l-2 border-warning bg-warning/5 p-4 text-sm text-warning">
        <AlertTriangle className="h-5 w-5 shrink-0" /><p>{fr ? "Tension continue uniquement. D2–D5 ne mesurent pas la continuité. Une lecture « reçue » ne prouve pas qu’un composant est sain. Une carte éteinte peut afficher 0 V sans être défectueuse." : "DC voltage only. D2–D5 do not measure continuity. A received reading does not prove a component is healthy. An unpowered board may read 0 V without being faulty."}</p>
      </div>
      <ol className="list-decimal space-y-3 pl-5 text-sm text-muted-foreground">{steps.map(step => <li key={step} className="pl-2">{step}</li>)}</ol>
    </section>
    <section className="space-y-4 border-t border-border pt-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold"><Cable className="h-5 w-5 text-primary" />{fr ? "Première mesure : deux piles AA" : "First reading: two AA batteries"}</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted/30 p-4 text-sm font-mono text-foreground">{`2 × AA (−) ───────────────── GND Nano
2 × AA (+) ─── 1 kΩ ──────── A0 / CH1
USB PC ───────────────────── USB Nano
D2–D5: ${fr ? "non connectés" : "not connected"}`}</pre>
      <p className="text-sm text-warning">{fr ? "La résistance 1 kΩ ne protège pas contre une surtension. Jamais de tension négative, de secteur ni plus de 5 V / VREF. La Nano n’alimente pas la carte. Une entrée proche de VREF peut saturer : vérifiez au multimètre." : "The 1 kΩ resistor does not protect against overvoltage. Never apply negative voltage, mains or more than 5 V / VREF. The Nano must not power the board. Readings near VREF may clip: check with a multimeter."}</p>
    </section>
    <section className="space-y-4 border-t border-border pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold">{fr ? "Code Nano · 115200 bauds" : "Nano firmware · 115200 baud"}</h3><Button variant="tech" asChild><a href="/firmware/circuit_diagnostic.ino" download><Download className="h-4 w-4" />{fr ? "Télécharger .ino" : "Download .ino"}</a></Button></div>
      <p className="text-sm text-muted-foreground">{fr ? "A0–A7 disponibles ; activez uniquement les canaux raccordés dans CHANNEL_ENABLED. CH1 = A0, CH2 = A1, … CH8 = A7. Ce code est réservé à la Nano classique, pas à l’ESP32." : "A0–A7 available; enable only connected channels in CHANNEL_ENABLED. CH1 = A0, CH2 = A1, … CH8 = A7. This code is for the classic Nano, not ESP32."}</p>
      <Accordion type="single" collapsible><AccordionItem value="code"><AccordionTrigger>{fr ? "Afficher le code" : "Show code"}</AccordionTrigger><AccordionContent><Button variant="ghost" size="sm" onClick={async () => { try { await navigator.clipboard.writeText(firmware); setCopied(true); setCopyError(false); } catch { setCopyError(true); } }}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? (fr ? "Copié" : "Copied") : (fr ? "Copier" : "Copy")}</Button>{copyError && <p role="alert" className="text-sm text-warning">{fr ? "Copie indisponible : téléchargez le fichier .ino." : "Clipboard unavailable: download the .ino file."}</p>}<pre className="max-h-96 overflow-auto rounded-md border border-border bg-muted/30 p-4 text-xs font-mono"><code>{firmware}</code></pre></AccordionContent></AccordionItem></Accordion>
    </section>
  </div>;
}
