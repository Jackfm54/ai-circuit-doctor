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
          const container = containerRef.current;
          if (!container) return;
          const containerWidth = container.offsetWidth;
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
      {/* Container for image with exact positioning */}
      <div className="relative" style={{ width: "100%" }}>
        <img
          ref={(el) => {
            if (el && imageLoaded) {
              const rect = el.getBoundingClientRect();
              if (rect.width !== dimensions.width || rect.height !== dimensions.height) {
                setDimensions({ width: rect.width, height: rect.height });
              }
            }
          }}
          src={imageUrl}
          alt="Circuit board analysis"
          className="w-full h-auto block"
          onLoad={(e) => {
            const img = e.currentTarget;
            setDimensions({ width: img.offsetWidth, height: img.offsetHeight });
            setImageLoaded(true);
          }}
        />
        
        {/* Bounding boxes overlay - positioned exactly over the image */}
        {imageLoaded && (
          <div
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ 
              width: "100%", 
              height: "100%",
            }}
          >
            {boundingBoxes.map((box, index) => {
              const colors = statusColors[box.status];
              const isSelected = selectedIndex === index;
              
              // Calculate pixel positions from normalized coordinates
              // x, y are top-left corner; width, height are dimensions
              const left = box.x * 100;
              const top = box.y * 100;
              const width = box.width * 100;
              const height = box.height * 100;
              
              return (
                <div
                  key={index}
                  className={cn(
                    "absolute cursor-pointer transition-all duration-200 pointer-events-auto",
                    isSelected && "z-10"
                  )}
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${width}%`,
                    height: `${height}%`,
                    border: `2px solid ${colors.border}`,
                    backgroundColor: isSelected ? colors.bg : "transparent",
                    boxShadow: isSelected
                      ? `0 0 20px ${colors.border}, inset 0 0 20px ${colors.bg}`
                      : `0 0 8px ${colors.border}`,
                    // Ensure box-sizing doesn't affect positioning
                    boxSizing: "border-box",
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
                  {/* Label - positioned above the box */}
                  <div
                    className="absolute left-0 px-2 py-0.5 text-xs font-mono font-bold whitespace-nowrap rounded-t-md"
                    style={{
                      bottom: "100%",
                      marginBottom: "2px",
                      backgroundColor: colors.border,
                      color: "#000",
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {box.label}
                    {box.confidence && (
                      <span className="ml-1 opacity-75">
                        {Math.round(box.confidence * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Corner markers for better visibility */}
                  <div
                    className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2"
                    style={{ borderColor: colors.border, margin: "-1px" }}
                  />
                  <div
                    className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2"
                    style={{ borderColor: colors.border, margin: "-1px" }}
                  />
                  <div
                    className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2"
                    style={{ borderColor: colors.border, margin: "-1px" }}
                  />
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2"
                    style={{ borderColor: colors.border, margin: "-1px" }}
                  />

                  {/* Center crosshair for precision reference */}
                  <div 
                    className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 opacity-60"
                    style={{
                      borderRadius: "50%",
                      backgroundColor: colors.border,
                    }}
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
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 flex gap-3 px-3 py-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50">
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-sm border-2" style={{ borderColor: statusColors.ok.border }} />
          <span className="text-muted-foreground">OK</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-sm border-2" style={{ borderColor: statusColors.warning.border }} />
          <span className="text-muted-foreground">Warning</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-sm border-2" style={{ borderColor: statusColors.error.border }} />
          <span className="text-muted-foreground">Error</span>
        </div>
      </div>
    </div>
  );
}
