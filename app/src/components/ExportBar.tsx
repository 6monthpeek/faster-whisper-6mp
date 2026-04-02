import { FileDown } from "lucide-react";
import type { ExportFormat, Segment } from "../lib/types";
import {
  segmentsToSrt,
  segmentsToVtt,
  segmentsToTxt,
  segmentsToJson,
  downloadFile,
  getFileNameWithoutExt,
} from "../lib/utils";

type ExportBarProps = {
  segments: Segment[];
  language: string;
  languageProbability: number;
  fileName: string;
};

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: "txt", label: "TXT" },
  { id: "srt", label: "SRT" },
  { id: "vtt", label: "VTT" },
  { id: "json", label: "JSON" },
];

export default function ExportBar({
  segments,
  language,
  languageProbability,
  fileName,
}: ExportBarProps) {
  const baseName = getFileNameWithoutExt(fileName || "transcription");

  const handleExport = (format: ExportFormat) => {
    let content: string;
    let ext: string;
    let mime: string;

    switch (format) {
      case "srt":
        content = segmentsToSrt(segments);
        ext = ".srt";
        mime = "text/plain";
        break;
      case "vtt":
        content = segmentsToVtt(segments);
        ext = ".vtt";
        mime = "text/vtt";
        break;
      case "json":
        content = segmentsToJson(segments, language, languageProbability);
        ext = ".json";
        mime = "application/json";
        break;
      default:
        content = segmentsToTxt(segments);
        ext = ".txt";
        mime = "text/plain";
    }

    downloadFile(content, `${baseName}${ext}`, mime);
  };

  return (
    <div className="flex items-center gap-1.5">
      {FORMATS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => handleExport(id)}
          className="flex items-center gap-1 text-[10px] text-white/20 hover:text-white/50
            bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <FileDown size={10} />
          {label}
        </button>
      ))}
    </div>
  );
}
