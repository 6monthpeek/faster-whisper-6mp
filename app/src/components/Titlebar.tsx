import { Minus, Square, X } from "lucide-react";

export default function Titlebar() {
  return (
    <div
      className="h-10 w-full flex items-center px-4 border-b border-white/5 flex-shrink-0"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 flex-1">
        <div className="w-3 h-3 rounded-full bg-white/10 border border-white/15" />
        <span className="text-[11px] font-semibold tracking-[0.2em] text-white/25 uppercase">
          Whisper Elite
        </span>
      </div>
      <div
        className="flex items-center gap-0.5"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <button
          onClick={() => window.electronAPI?.minimize()}
          className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 rounded-md transition-colors"
        >
          <Minus size={12} />
        </button>
        <button
          onClick={() => window.electronAPI?.maximize()}
          className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 rounded-md transition-colors"
        >
          <Square size={10} />
        </button>
        <button
          onClick={() => window.electronAPI?.close()}
          className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
