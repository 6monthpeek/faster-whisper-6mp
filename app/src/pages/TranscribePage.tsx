import { useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DualActionBar from "../components/DualActionBar";
import TranscriptionResult from "../components/TranscriptionResult";
import ProcessingOverlay from "../components/ProcessingOverlay";
import type { EngineStatus, HardwareInfo, ModelInfo } from "../lib/types";
import { t } from "../lib/i18n";
import { formatBytes } from "../lib/utils";

type TranscribePageProps = {
  status: EngineStatus;
  hardware: HardwareInfo | null;
  models: ModelInfo[];
  languages: Record<string, string>;
  engineOnline: boolean;
  appLang: string;
  onToast: (msg: string, type: "success" | "error" | "info") => void;
};

export default function TranscribePage({
  status,
  hardware: _hardware,
  models: _models,
  languages: _languages,
  engineOnline,
  appLang,
  onToast,
}: TranscribePageProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [segments, setSegments] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [currentFileName, setCurrentFileName] = useState("");
  const [currentTask, setCurrentTask] = useState<string>("transcribe");
  const [showOptions, setShowOptions] = useState(false);

  const [selectedFile, setSelectedFile] = useState<{
    path: string | null;
    file: File | null;
    name: string;
    size: number;
  } | null>(null);

  const [processingSteps, setProcessingSteps] = useState<any[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingLabel, setProcessingLabel] = useState("");

  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("en");

  const [vadFilter, setVadFilter] = useState(true);
  const [wordTimestamps, setWordTimestamps] = useState(true);
  const [diarize, setDiarize] = useState(false);
  const [numSpeakers, setNumSpeakers] = useState("");
  const [noiseSuppression, setNoiseSuppression] = useState(false);

  const selectFile = useCallback((filePath: string | null, file: File | null) => {
    const name = file?.name || filePath?.split(/[\\/]/).pop() || "audio";
    const size = file?.size || 0;
    setSelectedFile({ path: filePath, file, name, size });
    setCurrentFileName(name);
    setSegments([]);
    setResult(null);
  }, []);

  const openDialog = useCallback(async () => {
    if (!window.electronAPI) return;
    const fp = await window.electronAPI.openFileDialog();
    if (fp) selectFile(fp, null);
  }, [selectFile]);

  const startTranscription = useCallback(
    async (task: string) => {
      if (!selectedFile) {
        onToast(t("error.selectFile", appLang), "error");
        return;
      }
      if (!engineOnline) { onToast(t("error.engineOffline", appLang), "error"); return; }
      if (!status.model_loaded) { onToast(t("error.loadModel", appLang), "error"); return; }
      if (isTranscribing) return;

      setIsTranscribing(true);
      setSegments([]);
      setResult(null);
      setCurrentTask(task);

      const steps = [
        { key: "prepare", label: t("processing.preparing", appLang), status: "active" },
      ];
      if (noiseSuppression) steps.push({ key: "noise", label: t("processing.noiseReduction", appLang), status: "pending" });
      if (diarize) steps.push({ key: "diarize", label: t("processing.diarization", appLang), status: "pending" });
      steps.push({
        key: "transcribe",
        label: task === "translate" ? t("processing.translating", appLang) : t("processing.transcribing", appLang),
        status: "pending",
      });
      steps.push({ key: "finalize", label: t("processing.finalizing", appLang), status: "pending" });

      setProcessingSteps(steps);
      setProcessingProgress(10);
      setProcessingLabel(steps[0].label);

      const fd = new FormData();
      fd.append("task", task);
      if (sourceLanguage !== "auto") fd.append("language", sourceLanguage);
      fd.append("vad_filter", String(vadFilter));
      fd.append("word_timestamps", String(wordTimestamps));
      fd.append("diarize", String(diarize));
      fd.append("noise_suppression", String(noiseSuppression));
      fd.append("beam_size", "5");
      if (numSpeakers && parseInt(numSpeakers) > 0) fd.append("num_speakers", numSpeakers);

      if (selectedFile.path) fd.append("file_path", selectedFile.path);
      else if (selectedFile.file) fd.append("audio", selectedFile.file);

      const stepThresholds = steps.map((_, i) => (i / steps.length) * 100);

      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          const next = Math.min(prev + 0.3, 94);

          let activeIdx = 0;
          for (let i = stepThresholds.length - 1; i >= 0; i--) {
            if (next >= stepThresholds[i]) {
              activeIdx = i;
              break;
            }
          }

          setProcessingSteps(prevSteps =>
            prevSteps.map((s, i) => ({
              ...s,
              status: i < activeIdx ? "done" : i === activeIdx ? "active" : "pending"
            }))
          );
          setProcessingLabel(steps[activeIdx].label);

          return next;
        });
      }, 600);

      try {
        const res = await fetch("http://127.0.0.1:8181/transcribe", {
          method: "POST",
          body: fd,
        });

        clearInterval(progressInterval);

        if (!res.ok) {
          const body = await res.json().catch(() => ({ detail: "Request failed" }));
          throw new Error(body.detail || `Error ${res.status}`);
        }
        const data = await res.json();

        setProcessingSteps(prev => prev.map((s) => ({ ...s, status: "done" as const })));
        setProcessingProgress(100);
        setProcessingLabel(t("transcribe.complete", appLang));

        setTimeout(() => {
          setSegments(data.segments || []);
          setResult(data);
          setIsTranscribing(false);
          onToast(task === "translate" ? t("toast.translationComplete", appLang) : t("toast.transcriptionComplete", appLang), "success");
        }, 600);

      } catch (e: any) {
        clearInterval(progressInterval);
        setIsTranscribing(false);
        setProcessingSteps([]);
        setProcessingProgress(0);
        if (e.name !== "AbortError") {
          onToast(e.message || "Failed", "error");
        }
      }
    },
    [selectedFile, engineOnline, status.model_loaded, isTranscribing, sourceLanguage, vadFilter, wordTimestamps, diarize, numSpeakers, noiseSuppression, appLang, onToast],
  );

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setCurrentFileName("");
    setSegments([]);
    setResult(null);
  }, []);

  const hasFile = selectedFile !== null;
  const hasResult = result && segments.length > 0;

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
      {/* Action Bar */}
      <DualActionBar
        onTranscribe={() => startTranscription("transcribe")}
        onTranslate={() => startTranscription("translate")}
        targetLanguage={targetLanguage}
        onTargetLanguageChange={setTargetLanguage}
        sourceLanguage={sourceLanguage}
        onSourceLanguageChange={setSourceLanguage}
        disabled={isTranscribing || !status.model_loaded || !hasFile}
        appLang={appLang}
      />

      {/* File Selection Area */}
      {!hasFile ? (
        <button
          onClick={openDialog}
          disabled={isTranscribing || !status.model_loaded}
          className={`flex-shrink-0 rounded-2xl border-2 border-dashed cursor-pointer
            flex flex-col items-center justify-center gap-3 py-10 px-8 transition-all duration-200
            ${isTranscribing
              ? "border-white/15 bg-white/[0.01] cursor-default"
              : !status.model_loaded
              ? "border-white/5 bg-white/[0.005] cursor-default opacity-40"
              : "border-white/10 bg-white/[0.01] hover:border-white/25 hover:bg-white/[0.03]"
            }`}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/8 bg-white/[0.02]">
            <svg className="w-5 h-5 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-sm font-medium text-white/60">{t("transcribe.selectFile", appLang)}</p>
          <p className="text-[11px] text-white/20">{t("transcribe.formats", appLang)}</p>
        </button>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/8 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/[0.04] border border-white/8 flex-shrink-0">
            <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/85 truncate">{selectedFile.name}</p>
            <p className="text-[10px] text-white/45 mt-0.5">
              {selectedFile.size > 0 && `${formatBytes(selectedFile.size)}`}
              {selectedFile.size > 0 && result?.duration ? ' · ' : ''}
              {result?.duration ? `${formatDuration(result.duration)}` : ''}
              {!selectedFile.size && !result?.duration && t("transcribe.readyToProcess", appLang)}
            </p>
          </div>
          <button
            onClick={openDialog}
            disabled={isTranscribing}
            className="text-[10px] text-white/50 hover:text-white/60 border border-white/8 px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors disabled:opacity-30"
          >
            {t("transcribe.change", appLang)}
          </button>
          <button
            onClick={clearFile}
            disabled={isTranscribing}
            className="text-[10px] text-red-400/40 hover:text-red-400/80 border border-white/8 px-3 py-1.5 rounded-lg hover:bg-red-950/20 transition-colors disabled:opacity-30"
          >
            {t("transcribe.clear", appLang)}
          </button>
        </div>
      )}

      {/* Options Toggle */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/12 hover:text-white/25 transition-colors"
      >
        <ChevronDown size={11} className={`transition-transform ${showOptions ? "rotate-180" : ""}`} />
        {t("options.title", appLang)}
      </button>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-3">
              <ToggleOption label={t("options.vad", appLang)} description={t("options.vadDesc", appLang)} checked={vadFilter} onChange={setVadFilter} />
              <ToggleOption label={t("options.words", appLang)} description={t("options.wordsDesc", appLang)} checked={wordTimestamps} onChange={setWordTimestamps} />
              <ToggleOption label={t("options.diarize", appLang)} description={t("options.diarizeDesc", appLang)} checked={diarize} onChange={setDiarize} disabled={!status.diarization_available} />
              <ToggleOption label={t("options.noise", appLang)} description={t("options.noiseDesc", appLang)} checked={noiseSuppression} onChange={setNoiseSuppression} disabled={!status.noise_suppression_available} />
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-white/20">{t("options.numSpeakers", appLang)}</label>
                <input type="number" min="1" max="20" placeholder={t("file.auto", appLang)} value={numSpeakers} onChange={(e) => setNumSpeakers(e.target.value)}
                  className="w-full bg-[#111] border border-white/8 rounded-lg p-2 text-xs text-white/70 outline-none focus:border-white/20 transition-colors placeholder:text-white/15" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Overlay or Results */}
      <AnimatePresence mode="wait">
        {isTranscribing ? (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex items-start justify-center pt-8">
            <div className="w-full max-w-sm">
              <ProcessingOverlay steps={processingSteps} progress={processingProgress} currentLabel={processingLabel} />
            </div>
          </motion.div>
        ) : hasResult ? (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 min-h-0">
            <TranscriptionResult
              segments={segments} language={result.language} languageProbability={result.language_probability}
              elapsedSeconds={result.elapsed_seconds} fileName={currentFileName} task={currentTask}
              appLang={appLang}
            />
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center">
            <p className="text-white/8 text-sm">{hasFile ? t("transcribe.configure", appLang) : t("transcribe.placeholder", appLang)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToggleOption({ label, description, checked, onChange, disabled = false }: {
  label: string; description: string; checked: boolean; onChange: (val: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${disabled ? "opacity-30" : ""}`} onClick={() => !disabled && onChange(!checked)}>
      <label className="text-[9px] font-bold uppercase tracking-widest text-white/20">{label}</label>
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${checked ? "bg-white/[0.04] border-white/15" : "bg-[#111] border-white/8"}`}>
        <div className={`w-7 h-4 rounded-full transition-colors relative ${checked ? "bg-white/30" : "bg-white/10"}`}>
          <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${checked ? "left-3.5 bg-white" : "left-0.5 bg-white/40"}`} />
        </div>
        <span className="text-[10px] text-white/30">{description}</span>
      </div>
    </div>
  );
}
