import { useState, useCallback } from "react";
import { transcribeFile } from "../lib/api";
import type { Segment, TranscriptionOptions, TranscriptionResult } from "../lib/types";

type UseTranscriptionReturn = {
  isTranscribing: boolean;
  segments: Segment[];
  result: TranscriptionResult | null;
  currentFileName: string;
  error: string | null;
  transcribe: (
    filePath: string | null,
    file: File | null,
    options: TranscriptionOptions,
    fileName?: string,
  ) => Promise<void>;
  reset: () => void;
};

export function useTranscription(): UseTranscriptionReturn {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [currentFileName, setCurrentFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const transcribe = useCallback(
    async (
      filePath: string | null,
      file: File | null,
      options: TranscriptionOptions,
      fileName?: string,
    ) => {
      if (!filePath && !file) return;

      setIsTranscribing(true);
      setSegments([]);
      setResult(null);
      setError(null);
      setCurrentFileName(fileName || file?.name || filePath?.split(/[\\/]/).pop() || "audio");

      try {
        const data = await transcribeFile(filePath, file, options);
        setSegments(data.segments);
        setResult(data);
      } catch (e: any) {
        setError(e.message || "Transcription failed");
        throw e;
      } finally {
        setIsTranscribing(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setSegments([]);
    setResult(null);
    setCurrentFileName("");
    setError(null);
  }, []);

  return {
    isTranscribing,
    segments,
    result,
    currentFileName,
    error,
    transcribe,
    reset,
  };
}
