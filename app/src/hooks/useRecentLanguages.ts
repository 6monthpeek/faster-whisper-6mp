import { useState, useCallback } from "react";

const STORAGE_KEY = "whisper-elite-recent-langs";
const MAX_RECENT = 5;

export function useRecentLanguages() {
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : ["en", "tr"];
    } catch {
      return ["en", "tr"];
    }
  });

  const addRecent = useCallback((code: string) => {
    setRecent((prev) => {
      const filtered = prev.filter((c) => c !== code);
      const next = [code, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  return { recent, addRecent };
}
