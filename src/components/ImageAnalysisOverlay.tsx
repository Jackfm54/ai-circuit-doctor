import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  status: "ok" | "warning" | "error";
  componentNumber?: number;
  confidence?: number;
}

interface ImageAnalysisOverlayProps {
  imageUrl: string;
  boundingBoxes: BoundingBox[];
  onBoxClick?: (box: BoundingBox, index: number) => void;
  selectedIndex?: number;
}

const statusStyles = {
  ok: "border-success text-success hover:bg-success/10",
  warning: "border-warning text-warning hover:bg-warning/10",
  error: "border-destructive text-destructive hover:bg-destructive/10",
};
const selectedStyles = {
  ok: "bg-success/10",
  warning: "bg-warning/10",
  error: "bg-destructive/10",
};

export function ImageAnalysisOverlay({ imageUrl, boundingBoxes, onBoxClick, selectedIndex }: ImageAnalysisOverlayProps) {
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const { t } = useLanguage();
  // Many small boxes: show only numbers on the photo; full names are in the legend.
  const dense = boundingBoxes.length > 12;
  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden rounded-lg border border-border">
        <img src={imageUrl} alt={t.imageUploader.imageAlt} className="block w-full h-auto" onLoad={() => setLoadedUrl(imageUrl)} />
        {loadedUrl === imageUrl && (
          <div className="absolute inset-0 pointer-events-none">
            {boundingBoxes.map((box, index) => (
              <Button
                key={index}
                variant="ghost"
                aria-label={`${box.componentNumber ?? index + 1}. ${box.label}`}
                aria-pressed={selectedIndex === index}
                title={box.label}
                onClick={() => onBoxClick?.(box, index)}
                className={cn("absolute pointer-events-auto rounded-none border-2 p-0 min-w-0 min-h-0 h-auto overflow-visible focus-visible:z-20", statusStyles[box.status], selectedIndex === index && ["z-10", selectedStyles[box.status]])}
                style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.width * 100}%`, height: `${box.height * 100}%` }}
              >
                <span className={cn("absolute left-0 max-w-[180px] px-1.5 py-0.5 rounded-sm border bg-background/95 text-xs font-mono truncate", statusStyles[box.status], box.y < 0.06 ? "top-0" : "bottom-full")}>
                  <span className={dense ? "" : "sm:hidden"}>{box.componentNumber ?? index + 1}</span>
                  <span className={dense ? "hidden" : "hidden sm:inline"}>{box.componentNumber ?? index + 1}. {box.label}</span>
                </span>
              </Button>
            ))}
          </div>
        )}
      </div>
      {boundingBoxes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {boundingBoxes.map((box, index) => (
            <Button key={index} variant="outline" size="sm" aria-pressed={selectedIndex === index} onClick={() => onBoxClick?.(box, index)} className={cn("max-w-full h-auto min-h-9 whitespace-normal text-left justify-start", statusStyles[box.status], selectedIndex === index && selectedStyles[box.status])}>
              <span className="break-words">{box.componentNumber ?? index + 1}. {box.label}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
