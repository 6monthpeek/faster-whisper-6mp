import { useCallback, useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

type DropZoneProps = {
  isTranscribing: boolean;
  isDisabled: boolean;
  currentFileName: string;
  onFile: (file: File) => void;
  onNativeDialog: () => void;
};

export default function DropZone({
  isTranscribing,
  isDisabled,
  currentFileName,
  onFile,
  onNativeDialog,
}: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (isTranscribing || isDisabled) return;
    if (window.electronAPI) {
      onNativeDialog();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        relative flex-shrink-0 rounded-2xl border-2 border-dashed cursor-pointer
        flex flex-col items-center justify-center gap-3 py-10 px-8
        transition-all duration-200
        ${
          dragOver
            ? "border-white/40 bg-white/[0.04] scale-[1.005]"
            : isTranscribing
            ? "border-white/15 bg-white/[0.01] cursor-default"
            : isDisabled
            ? "border-white/5 bg-white/[0.005] cursor-default opacity-40"
            : "border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.025]"
        }
      `}
    >
      {isTranscribing && (
        <motion.div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors
          ${isTranscribing ? "border-white/15 bg-white/[0.03]" : "border-white/8 bg-white/[0.02]"}`}
      >
        {isTranscribing ? (
          <Loader2 size={20} className="text-white/60 animate-spin" />
        ) : (
          <UploadCloud size={20} className="text-white/25" />
        )}
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-white/80">
          {isTranscribing
            ? `Processing "${currentFileName}"…`
            : dragOver
            ? "Drop to transcribe"
            : "Drop a file or click to browse"}
        </p>
        <p className="text-[11px] text-white/20 mt-1">
          MP3 · WAV · M4A · FLAC · MP4 · MKV · MOV
        </p>
      </div>

      {isDisabled && !isTranscribing && (
        <span className="text-[10px] text-amber-400/60 bg-amber-950/20 border border-amber-900/20 px-2.5 py-1 rounded-full">
          Load a model first
        </span>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="audio/*,video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
