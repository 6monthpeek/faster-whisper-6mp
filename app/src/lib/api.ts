const ENGINE_URL = "http://127.0.0.1:8181";
const TIMEOUT = 5000;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${ENGINE_URL}${path}`, {
    signal: AbortSignal.timeout(TIMEOUT),
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── GET Endpoints ──────────────────────────────────────────────────────────

export function fetchStatus() {
  return request<import("./types").EngineStatus>("/status");
}

export function fetchHardware() {
  return request<import("./types").HardwareInfo>("/hardware");
}

export function fetchModels() {
  return request<{ models: import("./types").ModelInfo[] }>("/models");
}

export function fetchLanguages() {
  return request<{ languages: Record<string, string> }>("/languages");
}

export function fetchCapabilities() {
  return request<import("./types").Capabilities>("/capabilities");
}

export function fetchHistory() {
  return request<{ history: import("./types").HistoryEntry[] }>("/history");
}

export function fetchHistoryEntry(id: number) {
  return request<import("./types").HistoryEntry>(`/history/${id}`);
}

export function fetchCachedModels() {
  return request<{ cached: import("./types").CachedModel[] }>("/cached-models");
}

export function deleteCachedModel(modelSize: string) {
  return request<{ status: string; model: string }>(`/cached-models/${modelSize}`, { method: "DELETE" });
}

// ─── POST Endpoints ─────────────────────────────────────────────────────────

export function loadModel(modelSize: string, device: string = "auto", computeType: string = "auto") {
  const fd = new FormData();
  fd.append("model_size", modelSize);
  fd.append("device", device);
  fd.append("compute_type", computeType);
  return request<{ status: string; message: string }>("/load", { method: "POST", body: fd });
}

export function loadDiarization() {
  return request<{ status: string; message: string }>("/load-diarization", { method: "POST" });
}

export function unloadModel() {
  return request<{ status: string }>("/unload", { method: "POST" });
}

export function clearHistory() {
  return request<{ status: string }>("/history", { method: "DELETE" });
}

export async function transcribeFile(
  filePath: string | null,
  file: File | null,
  options: import("./types").TranscriptionOptions,
): Promise<import("./types").TranscriptionResult> {
  const fd = new FormData();
  fd.append("task", options.task);
  fd.append("language", options.language);
  fd.append("vad_filter", String(options.vad_filter));
  fd.append("word_timestamps", String(options.word_timestamps));
  fd.append("diarize", String(options.diarize));
  fd.append("noise_suppression", String(options.noise_suppression));
  fd.append("beam_size", String(options.beam_size));

  if (options.num_speakers) {
    fd.append("num_speakers", String(options.num_speakers));
  }

  if (filePath) {
    fd.append("file_path", filePath);
  } else if (file) {
    fd.append("audio", file);
  }

  return request<import("./types").TranscriptionResult>("/transcribe", {
    method: "POST",
    body: fd,
  });
}

export async function exportFile(
  filePath: string | null,
  file: File | null,
  format: import("./types").ExportFormat,
  options: import("./types").TranscriptionOptions,
): Promise<{ format: string; content: string; language: string }> {
  const fd = new FormData();
  fd.append("task", options.task);
  fd.append("language", options.language);
  fd.append("vad_filter", String(options.vad_filter));
  fd.append("word_timestamps", String(options.word_timestamps));
  fd.append("diarize", String(options.diarize));
  fd.append("noise_suppression", String(options.noise_suppression));
  fd.append("format", format);

  if (options.num_speakers) {
    fd.append("num_speakers", String(options.num_speakers));
  }

  if (filePath) {
    fd.append("file_path", filePath);
  } else if (file) {
    fd.append("audio", file);
  }

  return request<{ format: string; content: string; language: string }>("/export", {
    method: "POST",
    body: fd,
  });
}
