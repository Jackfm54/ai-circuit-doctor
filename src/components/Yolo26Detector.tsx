import { useEffect, useRef, useState } from "react";
import { Download, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ImageAnalysisOverlay } from "@/components/ImageAnalysisOverlay";
import { createYolo26Session, detectYolo26 } from "@/lib/yolo26";
import { YoloDetection } from "@/lib/yolo26-output";
import { useLanguage } from "@/i18n/LanguageContext";

export function Yolo26Detector() {
  const { language } = useLanguage();
  const fr = language === "fr";
  const session = useRef<Awaited<ReturnType<typeof createYolo26Session>> | null>(null);
  const [ready, setReady] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [detections, setDetections] = useState<YoloDetection[] | null>(null);
  const [threshold, setThreshold] = useState(0.25);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => () => { void session.current?.release(); }, []);

  async function loadModel(file?: File) {
    if (!file) return;
    setBusy(true); setError(""); setReady(false); setDetections(null);
    try {
      if (!file.name.endsWith(".onnx") || file.size > 100 * 1024 * 1024) throw new Error(fr ? "Fichier ONNX requis, 100 Mo maximum." : "ONNX file required, maximum 100 MB.");
      await session.current?.release(); session.current = null;
      session.current = await createYolo26Session(file);
      setReady(true);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  async function loadLabels(file?: File) {
    if (!file) return;
    setError(""); setLabels([]); setDetections(null);
    try {
      if (file.size > 1024 * 1024) throw new Error("labels.json: 1 MB maximum");
      const names: unknown = JSON.parse(await file.text());
      if (!Array.isArray(names) || names.length === 0 || names.length > 1000 || names.some(n => typeof n !== "string" || !n.trim() || n.length > 100)) throw new Error(fr ? "labels.json doit contenir une liste de noms de classes." : "labels.json must contain a list of class names.");
      setLabels(names);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  async function loadImage(file?: File) {
    if (!file) return;
    setError(""); setImage(null); setDetections(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError(fr ? "JPG, PNG ou WebP, 10 Mo maximum." : "JPG, PNG or WebP, maximum 10 MB."); return;
    }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") setImage(reader.result); };
    reader.onerror = () => setError(fr ? "Lecture de l'image impossible." : "Cannot read image.");
    reader.readAsDataURL(file);
  }

  async function run() {
    const model = session.current;
    if (!model || !image || !labels.length) return;
    setBusy(true); setError(""); setDetections(null);
    try { setDetections(await detectYolo26(model, image, labels, threshold)); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  return <section className="space-y-5 border-t border-border pt-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-lg font-semibold flex items-center gap-2"><ScanSearch className="w-5 h-5 text-primary" />YOLO26 · ONNX</h3>
      <Button asChild variant="outline" size="sm"><a href="/firmware/export_yolo26.py" download><Download className="w-4 h-4 mr-2" />{fr ? "Exportateur Python" : "Python exporter"}</a></Button>
    </div>
    <p className="text-sm text-warning">{fr ? "Modèle PCB non fourni. Les poids yolo26n.pt généraux reconnaissent les objets COCO, pas les pannes électroniques. Un score de détection ne confirme pas une panne." : "PCB model not provided. General yolo26n.pt weights recognize COCO objects, not electronic faults. A detection score does not confirm a fault."}</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-2 text-sm"><span>{fr ? "Modèle YOLO26 (.onnx)" : "YOLO26 model (.onnx)"}</span><Input aria-label={fr ? "Modèle YOLO26" : "YOLO26 model"} type="file" accept=".onnx" disabled={busy} onChange={e => void loadModel(e.target.files?.[0])} /></label>
      <label className="space-y-2 text-sm"><span>{fr ? "Classes (labels.json)" : "Classes (labels.json)"}</span><Input aria-label="labels.json" type="file" accept=".json" disabled={busy} onChange={e => void loadLabels(e.target.files?.[0])} /></label>
    </div>
    <p className="text-sm text-muted-foreground" role="status">{ready ? (fr ? "Modèle chargé" : "Model loaded") : (fr ? "Aucun modèle chargé" : "No model loaded")} · {labels.length} {fr ? "classes" : "classes"}</p>
    <label className="block space-y-2 text-sm"><span>{fr ? "Photo pour YOLO26" : "Photo for YOLO26"}</span><Input aria-label={fr ? "Photo pour YOLO26" : "Photo for YOLO26"} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => void loadImage(e.target.files?.[0])} /></label>
    <div className="space-y-2"><label className="text-sm" id="yolo-threshold">{fr ? "Seuil du score de détection" : "Detection score threshold"}: {threshold.toFixed(2)}</label><Slider aria-labelledby="yolo-threshold" min={0.05} max={0.95} step={0.05} value={[threshold]} disabled={busy} onValueChange={v => { setThreshold(v[0]); setDetections(null); }} /></div>
    <Button onClick={() => void run()} disabled={busy || !ready || !labels.length || !image}><ScanSearch className="w-4 h-4 mr-2" />{busy ? (fr ? "Traitement…" : "Processing…") : (fr ? "Détecter avec YOLO26" : "Detect with YOLO26")}</Button>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {image && <ImageAnalysisOverlay imageUrl={image} boundingBoxes={(detections ?? []).map(d => ({ ...d, label: `${d.label} · ${d.score.toFixed(2)}`, status: "warning" }))} />}
    {detections !== null && <div className="space-y-2" role="status"><p className="font-medium">{detections.length} {fr ? "détections YOLO26" : "YOLO26 detections"}</p>{detections.map((d, i) => <div key={i} className="flex justify-between gap-3 border-b border-border py-2 text-sm"><span>{d.label}</span><span className="font-mono text-muted-foreground">{d.score.toFixed(3)}</span></div>)}</div>}
  </section>;
}