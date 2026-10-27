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
  const boardSteps = fr ? [
    "Identifier la puce de la carte (soie, notice ou emballage). Une carte ESP32, Due, Zero, MKR, Nano ESP32 ou UNO Q ne se branche pas : 3,3 V, convertisseur et brochage différents — le code refuse délibérément de compiler.",
    "Brancher la carte seule par USB, puis dans Arduino IDE : Outils → Type de carte (le modèle exact), Outils → Port (le numéro peut changer, par ex. COM4) et, pour une Nano, Processeur → ATmega328P (Old Bootloader) si le téléversement échoue.",
    "Téléverser le même fichier : le nombre de canaux se règle seul (CH1 = A0, CH2 = A1, …). À ce stade, rien n’est connecté à une carte à tester.",
    "Étalonner : carte alimentée par USB, mesurer 5V → GND au multimètre, reporter la valeur dans VREF, puis téléverser de nouveau.",
    "Vérifier avec deux piles AA sur CH1, exactement comme avec la Nano, et comparer au multimètre avant toute autre mesure.",
    "Fermer Arduino IDE et son moniteur série, puis connecter la carte dans CircuitDiag (Chrome ou Edge). Selon la carte, un pilote CH340 ou FTDI peut être demandé."
  ] : [
    "Identify the board’s chip (silk screen, datasheet or packaging). An ESP32, Due, Zero, MKR, Nano ESP32 or UNO Q board must not be connected: 3.3 V, different converter and pinout — the code deliberately refuses to compile.",
    "Connect the board by USB alone, then in Arduino IDE: Tools → Board (the exact model), Tools → Port (the number may change, e.g. COM4) and, for a Nano, Processor → ATmega328P (Old Bootloader) if the upload fails.",
    "Upload the same file: the channel count adapts on its own (CH1 = A0, CH2 = A1, …). At this stage nothing is connected to a board under test.",
    "Calibrate: with the board powered over USB, measure 5V → GND with the multimeter, enter that reading as VREF, then upload again.",
    "Verify with two AA batteries on CH1, exactly as with the Nano, and compare with the multimeter before any other measurement.",
    "Close Arduino IDE and its serial monitor, then connect the board in CircuitDiag (Chrome or Edge). A CH340 or FTDI driver may be required depending on the board."
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
      <h3 className="flex items-center gap-2 text-lg font-semibold"><Cpu className="h-5 w-5 text-primary" />{fr ? "Autre carte Arduino" : "Another Arduino board"}</h3>
      <p className="text-sm text-muted-foreground">{fr ? "Le même fichier s’adapte à la carte sélectionnée dans Arduino IDE : le nombre de canaux se règle automatiquement d’après la puce. Aucun autre réglage n’est requis." : "The same file adapts to the board selected in Arduino IDE: the channel count is set automatically from the chip. No other setting changes."}</p>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/30 text-left"><th className="p-3 font-medium">{fr ? "Carte" : "Board"}</th><th className="p-3 font-medium">{fr ? "Entrées" : "Inputs"}</th><th className="p-3 font-medium">{fr ? "Canaux" : "Channels"}</th><th className="p-3 font-medium">{fr ? "État" : "Status"}</th></tr></thead>
          <tbody>
            <tr className="border-b border-border"><td className="p-3">Arduino Nano · ATmega328P</td><td className="p-3 font-mono">A0–A7</td><td className="p-3 font-mono">CH1–CH8</td><td className="p-3 text-primary">{fr ? "Prise en charge" : "Supported"}</td></tr>
            <tr className="border-b border-border"><td className="p-3">Arduino Uno / Duemilanove / Pro Mini · ATmega328P</td><td className="p-3 font-mono">A0–A5</td><td className="p-3 font-mono">CH1–CH6</td><td className="p-3 text-primary">{fr ? "Prise en charge" : "Supported"}</td></tr>
            <tr className="border-b border-border"><td className="p-3">Arduino Mega · ATmega2560</td><td className="p-3 font-mono">A0–A15</td><td className="p-3 font-mono">CH1–CH16</td><td className="p-3 text-primary">{fr ? "Prise en charge" : "Supported"}</td></tr>
            <tr><td className="p-3">ESP32 / ESP32 DevKit V1 / Nano ESP32 / Due / Zero / MKR / UNO Q</td><td className="p-3 font-mono">—</td><td className="p-3 font-mono">—</td><td className="p-3 text-warning">{fr ? "Refusée à la compilation" : "Refused at compile"}</td></tr>
          </tbody>
        </table>
      </div>
      <ol className="list-decimal space-y-3 pl-5 text-sm text-muted-foreground">{boardSteps.map(step => <li key={step} className="pl-2">{step}</li>)}</ol>
      <p className="text-sm text-warning">{fr ? "Toute carte hors Nano, Uno et Mega est refusée à la compilation : ne pas forcer. Les limites restent les mêmes — jamais de tension négative, de secteur ni plus de 5 V / VREF sur une entrée." : "Every board except Nano, Uno and Mega is refused at compile time: do not force it. Limits stay the same — never negative voltage, mains or more than 5 V / VREF on an input."}</p>
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
      <p className="text-sm text-muted-foreground">{fr ? "A0–A7 sur Nano (A0–A5 sur Uno, A0–A15 sur Mega) ; activez uniquement les canaux raccordés dans CHANNEL_ENABLED. CH1 = A0, CH2 = A1, … Le nombre de canaux se règle seul selon la carte choisie dans Arduino IDE ; ESP32 et cartes 3,3 V sont refusées à la compilation." : "A0–A7 on Nano (A0–A5 on Uno, A0–A15 on Mega); enable only connected channels in CHANNEL_ENABLED. CH1 = A0, CH2 = A1, … The channel count adapts to the board selected in Arduino IDE; ESP32 and 3.3 V boards are refused at compile time."}</p>
      <Accordion type="single" collapsible><AccordionItem value="code"><AccordionTrigger>{fr ? "Afficher le code" : "Show code"}</AccordionTrigger><AccordionContent><Button variant="ghost" size="sm" onClick={async () => { try { await navigator.clipboard.writeText(firmware); setCopied(true); setCopyError(false); } catch { setCopyError(true); } }}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? (fr ? "Copié" : "Copied") : (fr ? "Copier" : "Copy")}</Button>{copyError && <p role="alert" className="text-sm text-warning">{fr ? "Copie indisponible : téléchargez le fichier .ino." : "Clipboard unavailable: download the .ino file."}</p>}<pre className="max-h-96 overflow-auto rounded-md border border-border bg-muted/30 p-4 text-xs font-mono"><code>{firmware}</code></pre></AccordionContent></AccordionItem></Accordion>
    </section>
  </div>;
}
