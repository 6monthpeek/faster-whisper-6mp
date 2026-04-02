import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, User, Clock } from "lucide-react";
import CopyButton from "./CopyButton";
import type { Segment } from "../lib/types";
import { formatTime } from "../lib/utils";

const SPEAKER_COLORS: Record<string, string> = {};
const COLOR_PALETTE = [
  "text-blue-400",
  "text-emerald-400",
  "text-amber-400",
  "text-purple-400",
  "text-pink-400",
  "text-cyan-400",
  "text-orange-400",
  "text-rose-400",
];

function getSpeakerColor(speaker: string): string {
  if (!SPEAKER_COLORS[speaker]) {
    const idx = Object.keys(SPEAKER_COLORS).length % COLOR_PALETTE.length;
    SPEAKER_COLORS[speaker] = COLOR_PALETTE[idx];
  }
  return SPEAKER_COLORS[speaker];
}

export default function SegmentCard({ segment }: { segment: Segment }) {
  const [expanded, setExpanded] = useState(false);
  const hasWords = segment.words && segment.words.length > 0;
  const duration = (segment.end - segment.start).toFixed(1);
  const speakerColor = segment.speaker ? getSpeakerColor(segment.speaker) : "";

  return (
    <div className="group">
      <div
        onClick={() => hasWords && setExpanded(!expanded)}
        className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl transition-colors
          ${expanded ? "bg-white/[0.03]" : "hover:bg-white/[0.015]"}
          ${hasWords ? "cursor-pointer" : "cursor-default"}`}
      >
        {/* Timestamp */}
        <div className="flex flex-col items-end flex-shrink-0 w-[80px] pt-0.5">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-white/40">
            <Clock size={10} className="text-white/20" />
            {formatTime(segment.start)}
          </div>
          <div className="text-[10px] font-mono text-white/20 mt-0.5">
            → {formatTime(segment.end)}
          </div>
          <div className="text-[9px] text-white/15 mt-0.5 font-medium">
            {duration}s
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-white/8 self-stretch flex-shrink-0 rounded-full" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {segment.speaker && (
            <div className={`flex items-center gap-1.5 mb-1.5 ${speakerColor}`}>
              <User size={11} />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {segment.speaker}
              </span>
            </div>
          )}
          <p className="text-[13px] text-white/75 leading-[1.8] break-words whitespace-pre-wrap">
            {segment.text.trim()}
          </p>
        </div>

        {/* Actions — always visible on hover, Copy always accessible */}
        <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={segment.text.trim()} />
          {hasWords && (
            <ChevronRight
              size={12}
              className={`text-white/20 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          )}
        </div>
      </div>

      {/* Word-level timestamps */}
      <AnimatePresence>
        {expanded && hasWords && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="ml-[84px] mr-8 mb-2 flex flex-wrap gap-1 border-l-2 border-white/8 pl-3 py-1">
              {segment.words!.map((w, i) => (
                <span
                  key={i}
                  className="text-[10px] text-white/30 bg-white/[0.025] border border-white/6
                    px-2 py-0.5 rounded-md cursor-default hover:text-white/50 hover:bg-white/[0.05] transition-colors"
                  title={`${w.start.toFixed(2)}s → ${w.end.toFixed(2)}s`}
                >
                  {w.word}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
