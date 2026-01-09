import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface BoundingBox {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  width: number; // 0-1 normalized
  height: number; // 0-1 normalized
  label: string;
  status: "ok" | "warning" | "error";
  confidence?: number;
}

interface ImageAnalysisOverlayProps {
  imageUrl: string;
  boundingBoxes: BoundingBox[];
  onBoxClick?: (box: BoundingBox, index: number) => void;
  selectedIndex?: number;
}

const statusColors = {
  ok: {
    border: "rgba(34, 197, 94, 0.9)",
    bg: "rgba(34, 197, 94, 0.15)",
    text: "rgb(34, 197, 94)",
  },
  warning: {
    border: "rgba(234, 179, 8, 0.9)",
    bg: "rgba(234, 179, 8, 0.15)",
    text: "rgb(234, 179, 8)",
  },
  error: {
    border: "rgba(239, 68, 68, 0.9)",
    bg: "rgba(239, 68, 68, 0.15)",
    text: "rgb(239, 68, 68)",
  },
};

export function ImageAnalysisOverlay({
  imageUrl,
  boundingBoxes,
  onBoxClick,
  selectedIndex,
}: ImageAnalysisOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const aspectRatio = img.height / img.width;
        const height = containerWidth * aspectRatio;
        setDimensions({ width: containerWidth, height });
        setImageLoaded(true);
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && imageLoaded) {
        const img = new Image();
        img.onload = () => {
          const containerWidth = containerRef.current!.offsetWidth;
          const aspectRatio = img.height / img.width;
          const height = containerWidth * aspectRatio;
          setDimensions({ width: containerWidth, height });
        };
        img.src = imageUrl;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [imageUrl, imageLoaded]);

  return (
    <div ref={containerRef} className="relative w-full rounded-xl overflow-hidden border border-border/50">
      <img
        src={imageUrl}
        alt="Circuit board analysis"
        className="w-full h-auto"
        style={{ display: "block" }}
      />
      
      {/* Bounding boxes overlay */}
      {imageLoaded && (
        <div
          className="absolute inset-0"
          style={{ width: dimensions.width, height: dimensions.height }}
        >
          {boundingBoxes.map((box, index) => {
            const colors = statusColors[box.status];
            const isSelected = selectedIndex === index;
            
            return (
              <div
                key={index}
                className={cn(
                  "absolute cursor-pointer transition-all duration-200",
                  isSelected && "z-10"
                )}
                style={{
                  left: `${box.x * 100}%`,
                  top: `${box.y * 100}%`,
                  width: `${box.width * 100}%`,
                  height: `${box.height * 100}%`,
                  border: `2px solid ${colors.border}`,
                  backgroundColor: isSelected ? colors.bg : "transparent",
                  boxShadow: isSelected
                    ? `0 0 20px ${colors.border}, inset 0 0 20px ${colors.bg}`
                    : `0 0 8px ${colors.border}`,
                }}
                onClick={() => onBoxClick?.(box, index)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg;
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                {/* Label */}
                <div
                  className="absolute -top-6 left-0 px-2 py-0.5 text-xs font-mono font-bold whitespace-nowrap rounded-t-md"
                  style={{
                    backgroundColor: colors.border,
                    color: "#000",
                  }}
                >
                  {box.label}
                  {box.confidence && (
                    <span className="ml-1 opacity-75">
                      {Math.round(box.confidence * 100)}%
                    </span>
                  )}
                </div>

                {/* Corner markers */}
                <div
                  className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2"
                  style={{ borderColor: colors.border }}
                />
                <div
                  className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2"
                  style={{ borderColor: colors.border }}
                />
                <div
                  className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2"
                  style={{ borderColor: colors.border }}
                />
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2"
                  style={{ borderColor: colors.border }}
                />

                {/* Status indicator pulse for errors */}
                {box.status === "error" && (
                  <div
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
                    style={{ backgroundColor: colors.border }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 right-3 flex gap-3 px-3 py-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50">
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-sm border-2" style={{ borderColor: statusColors.ok.border }} />
          <span className="text-muted-foreground">OK</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-sm border-2" style={{ borderColor: statusColors.warning.border }} />
          <span className="text-muted-foreground">Advertencia</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-sm border-2" style={{ borderColor: statusColors.error.border }} />
          <span className="text-muted-foreground">Fallo</span>
        </div>
      </div>
    </div>
  );
}
