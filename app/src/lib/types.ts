// ─── Engine Status ──────────────────────────────────────────────────────────
export type EngineStatus = {
  loading: boolean;
  model_loaded: boolean;
  current_model: string | null;
  device: string | null;
  compute_type: string | null;
  error?: string | null;
  diarization_available: boolean;
  diarization_loading: boolean;
  noise_suppression_available: boolean;
  progress: {
    pct: number;
    bytes: number;
    total: number;
    speed: string;
    desc: string;
  };
};

// ─── Hardware Info ──────────────────────────────────────────────────────────
export type HardwareInfo = {
  cuda: boolean;
  name: string;
  gpu_label: string;
  vram_total: number;
  vram_free: number;
  vram_total_label: string;
  vram_free_label: string;
  compute_capability: string;
  driver_version: string;
  cuda_version: string;
  gpu_count: number;
  cpu_name: string;
  cpu_cores: number;
  ram_total: number;
  ram_free: number;
  ram_total_label: string;
  ram_free_label: string;
};

// ─── Model Info ─────────────────────────────────────────────────────────────
export type ModelInfo = {
  size: string;
  bytes: number;
  label: string;
};

// ─── Transcription Segment ─────────────────────────────────────────────────
export type Word = {
  word: string;
  start: number;
  end: number;
  probability: number;
};

export type Segment = {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker?: string;
  words?: Word[];
};

// ─── Transcription Result ──────────────────────────────────────────────────
export type TranscriptionResult = {
  language: string;
  language_probability: number;
  duration?: number;
  segments: Segment[];
  elapsed_seconds: number;
};

// ─── History Entry ─────────────────────────────────────────────────────────
export type HistoryEntry = {
  id: number;
  filename: string;
  file_path?: string;
  language: string;
  task: string;
  segment_count: number;
  duration_seconds: number;
  timestamp: number;
  text_preview: string;
  segments?: Segment[];
};

// ─── Cached Model ──────────────────────────────────────────────────────────
export type CachedModel = {
  size: string;
  folder: string;
  bytes: number;
  label: string;
};

// ─── Capabilities ──────────────────────────────────────────────────────────
export type Capabilities = {
  diarization: boolean;
  noise_suppression: boolean;
  sse_streaming: boolean;
  export_formats: string[];
};

// ─── Transcription Options ─────────────────────────────────────────────────
export type TranscriptionOptions = {
  task: "transcribe" | "translate";
  language: string;
  targetLanguage: string;
  vad_filter: boolean;
  word_timestamps: boolean;
  diarize: boolean;
  num_speakers: number | null;
  noise_suppression: boolean;
  beam_size: number;
};

// ─── Export Options ─────────────────────────────────────────────────────────
export type ExportFormat = "txt" | "srt" | "vtt" | "json";

// ─── Page Route ─────────────────────────────────────────────────────────────
export type PageRoute = "transcribe" | "history" | "settings";

// ─── Toast ──────────────────────────────────────────────────────────────────
export type Toast = {
  id: number;
  msg: string;
  type: "success" | "error" | "info";
};
