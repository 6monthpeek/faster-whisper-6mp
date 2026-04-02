import { useState, useEffect } from "react";
import { Clock, Trash2, FileDown, ChevronRight, ArrowLeft, FolderOpen } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { HistoryEntry, Segment } from "../lib/types";
import { fetchHistory, clearHistory } from "../lib/api";
import SegmentCard from "../components/SegmentCard";
import CopyButton from "../components/CopyButton";
import ExportBar from "../components/ExportBar";

type HistoryPageProps = {
  onToast: (msg: string, type: "success" | "error" | "info") => void;
};

export default function HistoryPage({ onToast }: HistoryPageProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  const loadHistory = async () => {
    try {
      const data = await fetchHistory();
      setHistory(data.history);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClear = async () => {
    try {
      await clearHistory();
      setHistory([]);
      setSelectedEntry(null);
      onToast("History cleared.", "info");
    } catch (e: any) {
      onToast(e.message || "Failed to clear history", "error");
    }
  };

  // Detail view for a selected entry
  if (selectedEntry) {
    const segments: Segment[] = selectedEntry.segments || [];
    const fullText = segments.map((s) => s.text.trim()).join(" ");

    return (
      <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
        {/* Back button + header */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setSelectedEntry(null)}
            className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/60 transition-colors"
          >
            <ArrowLeft size={12} /> Back
          </button>
          <div className="w-px h-3 bg-white/10" />
          <span className="text-xs font-medium text-white/50 truncate">{selectedEntry.filename}</span>
        </div>

        {/* File info */}
        <div className="grid grid-cols-4 gap-3">
          <InfoCell label="Language" value={selectedEntry.language?.toUpperCase() || "—"} />
          <InfoCell label="Task" value={selectedEntry.task === "translate" ? "Translate" : "Transcribe"} />
          <InfoCell label="Segments" value={String(selectedEntry.segment_count)} />
          <InfoCell label="Duration" value={`${selectedEntry.duration_seconds}s`} />
        </div>

        {/* File path */}
        {selectedEntry.file_path && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.015] border border-white/5">
            <FolderOpen size={12} className="text-white/15 flex-shrink-0" />
            <span className="text-[11px] text-white/25 truncate">{selectedEntry.file_path}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <CopyButton text={fullText} label="Copy All" className="text-white/30" />
          {segments.length > 0 && (
            <ExportBar
              segments={segments}
              language={selectedEntry.language}
              languageProbability={1}
              fileName={selectedEntry.filename}
            />
          )}
        </div>

        {/* Full text */}
        {fullText && (
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4">
            <p className="text-white/60 leading-[1.8] text-[13px] whitespace-pre-wrap">{fullText}</p>
          </div>
        )}

        {/* Segments timeline */}
        {segments.length > 0 && (
          <div className="flex-1 min-h-0 overflow-auto space-y-0.5">
            {segments.map((seg) => (
              <SegmentCard key={seg.id} segment={seg} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Clock size={14} className="text-white/20" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">History</span>
          <span className="text-[10px] text-white/10">{history.length} entries</span>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-[10px] text-red-400/40 hover:text-red-400/80
              px-2 py-1 rounded-lg hover:bg-red-950/20 transition-colors"
          >
            <Trash2 size={10} /> Clear All
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <p className="text-white/10 text-sm">No transcriptions yet.</p>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {history.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedEntry(entry)}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.015] border border-white/5
                    hover:bg-white/[0.03] hover:border-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileDown size={12} className="text-white/20 flex-shrink-0" />
                      <span className="text-xs font-medium text-white/60 truncate">{entry.filename}</span>
                      {entry.task === "translate" && (
                        <span className="text-[9px] bg-blue-500/10 text-blue-400/50 px-1.5 py-0.5 rounded font-semibold">TRANSLATE</span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/15 mt-1 line-clamp-1">{entry.text_preview}</p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-[10px] text-white/15 uppercase font-semibold">{entry.language}</span>
                    <span className="text-[10px] text-white/15">{entry.segment_count} seg</span>
                    <span className="text-[10px] text-white/15">{entry.duration_seconds}s</span>
                    <ChevronRight size={12} className="text-white/10 group-hover:text-white/20 transition-colors" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 rounded-xl bg-white/[0.015] border border-white/5">
      <span className="text-[9px] font-bold uppercase tracking-widest text-white/15">{label}</span>
      <p className="text-xs text-white/50 mt-0.5">{value}</p>
    </div>
  );
}
