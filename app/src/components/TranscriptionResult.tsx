import { motion } from "framer-motion";
import { Wand2, Copy as CopyIcon } from "lucide-react";
import SegmentCard from "./SegmentCard";
import ExportBar from "./ExportBar";
import { useClipboard } from "../hooks/useClipboard";
import type { Segment } from "../lib/types";
import { formatTime } from "../lib/utils";
import { t } from "../lib/i18n";

type TranscriptionResultProps = {
  segments: Segment[];
  language: string;
  languageProbability: number;
  elapsedSeconds: number;
  fileName: string;
  task: string;
  appLang: string;
};

export default function TranscriptionResult({
  segments,
  language,
  languageProbability,
  elapsedSeconds,
  fileName,
  task,
  appLang,
}: TranscriptionResultProps) {
  const fullText = segments.map((s) => s.text.trim()).join(" ");
  const totalDuration =
    segments.length > 0 ? segments[segments.length - 1].end - segments[0].start : 0;
  const hasSpeakers = segments.some((s) => s.speaker);
  const { copied, copy } = useClipboard();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col min-h-0 gap-4"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
            <Wand2 size={13} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/85">
              {t(task === "translate" ? "transcribe.translationComplete" : "transcribe.transcriptionComplete", appLang)}
            </h3>
            <div className="flex items-center gap-2 text-[10px] text-white/35 mt-0.5">
              <span className="uppercase font-bold tracking-wider">{language}</span>
              <span>({(languageProbability * 100).toFixed(0)}%)</span>
              <span className="w-px h-2.5 bg-white/10" />
              <span>{segments.length} {t("transcribe.segments", appLang)}</span>
              {totalDuration > 0 && (
                <>
                  <span className="w-px h-2.5 bg-white/10" />
                  <span>{formatTime(totalDuration)}</span>
                </>
              )}
              <span className="w-px h-2.5 bg-white/10" />
              <span>{elapsedSeconds.toFixed(1)}s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full text preview + actions */}
      <div className="flex-shrink-0 bg-white/[0.02] border border-white/6 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <p className="flex-1 text-[13px] text-white/75 leading-[1.9] whitespace-pre-wrap break-words max-h-24 overflow-auto">
            {fullText}
          </p>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <button
              onClick={() => copy(fullText)}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-all
                ${copied
                  ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
                  : "text-white/45 border-white/8 bg-white/[0.02] hover:text-white/70 hover:border-white/15"
                }`}
            >
              <CopyIcon size={11} />
              {copied ? t("transcribe.copied", appLang) : t("transcribe.copyAll", appLang)}
            </button>
            <ExportBar
              segments={segments}
              language={language}
              languageProbability={languageProbability}
              fileName={fileName}
            />
          </div>
        </div>
      </div>

      {/* Timeline header */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
          {t("transcribe.timeline", appLang)}
        </span>
        {hasSpeakers && (
          <span className="text-[9px] text-blue-400/35 font-semibold uppercase tracking-wider">
            · Speaker Diarization Active
          </span>
        )}
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Scrollable segment list */}
      <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-white/4 bg-white/[0.008]">
        <div className="divide-y divide-white/[0.03]">
          {segments.map((seg) => (
            <SegmentCard key={seg.id} segment={seg} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
