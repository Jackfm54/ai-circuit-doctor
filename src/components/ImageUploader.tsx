import { useState, useCallback } from "react";
import { Upload, X, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onImageSelect: (file: File, preview: string) => void;
  isAnalyzing: boolean;
}

export function ImageUploader({ onImageSelect, isAnalyzing }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const processFile = useCallback((file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        setSelectedFile(file);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const clearImage = () => {
    setPreview(null);
    setSelectedFile(null);
  };

  const handleAnalyze = () => {
    if (selectedFile && preview) {
      onImageSelect(selectedFile, preview);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl transition-all duration-300 overflow-hidden",
          isDragging 
            ? "border-primary bg-primary/10 scale-[1.02]" 
            : "border-border hover:border-primary/50",
          preview ? "p-0" : "p-12",
          isAnalyzing && "animate-pulse-border"
        )}
      >
        {/* Scanning animation overlay */}
        {isAnalyzing && preview && (
          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent scan-line" />
            <div className="absolute inset-0 bg-primary/5" />
          </div>
        )}

        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="Tarjeta electrónica" 
              className="w-full h-auto max-h-96 object-contain bg-background/50"
            />
            {!isAnalyzing && (
              <button
                onClick={clearImage}
                className="absolute top-3 right-3 p-2 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center cursor-pointer">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <span className="text-lg font-medium mb-2">
              Arrastra una imagen aquí
            </span>
            <span className="text-sm text-muted-foreground mb-4">
              o haz clic para seleccionar
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              PNG, JPG hasta 10MB
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        )}
      </div>

      {preview && (
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          variant="techGlow"
          size="xl"
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Cpu className="w-5 h-5 animate-spin" />
              Analizando componentes...
            </>
          ) : (
            <>
              <Cpu className="w-5 h-5" />
              Iniciar diagnóstico
            </>
          )}
        </Button>
      )}
    </div>
  );
}
