import type { Segment } from "./types";

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function formatTime(seconds: number): string {
  const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export function formatSrtTime(s: number): string {
  const pad = (n: number, z = 2) => String(Math.floor(n)).padStart(z, "0");
  return `${pad(s / 3600)}:${pad((s % 3600) / 60)}:${pad(s % 60)},${String(Math.round((s % 1) * 1000)).padStart(3, "0")}`;
}

export function formatVttTime(s: number): string {
  const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = String(Math.round((s % 1) * 1000)).padStart(3, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}.${ms}`;
}

export function segmentsToSrt(segments: Segment[]): string {
  return segments
    .map((seg, i) => {
      const speaker = seg.speaker ? `[${seg.speaker}] ` : "";
      return `${i + 1}\n${formatSrtTime(seg.start)} --> ${formatSrtTime(seg.end)}\n${speaker}${seg.text.trim()}`;
    })
    .join("\n\n");
}

export function segmentsToVtt(segments: Segment[]): string {
  const lines = ["WEBVTT", ""];
  segments.forEach((seg) => {
    const speaker = seg.speaker ? `<v ${seg.speaker}>` : "";
    lines.push(`${formatVttTime(seg.start)} --> ${formatVttTime(seg.end)}`);
    lines.push(`${speaker}${seg.text.trim()}`);
    lines.push("");
  });
  return lines.join("\n");
}

export function segmentsToTxt(segments: Segment[]): string {
  let currentSpeaker = "";
  const lines: string[] = [];
  for (const seg of segments) {
    if (seg.speaker && seg.speaker !== currentSpeaker) {
      lines.push(`\n[${seg.speaker}]`);
      currentSpeaker = seg.speaker;
    }
    lines.push(seg.text.trim());
  }
  return lines.join(" ").trim();
}

export function segmentsToJson(segments: Segment[], language: string, probability: number): string {
  return JSON.stringify(
    { language, language_probability: probability, segments },
    null,
    2,
  );
}

export function downloadFile(content: string, filename: string, mimeType: string = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getFileNameWithoutExt(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}
