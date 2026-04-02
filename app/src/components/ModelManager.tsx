import { useState } from "react";
import { CheckCircle, Loader2, AlertCircle, Cpu, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressBar from "./ProgressBar";
import type { EngineStatus, ModelInfo, HardwareInfo } from "../lib/types";
import { loadModel, unloadModel, loadDiarization } from "../lib/api";
import { t } from "../lib/i18n";

type ModelManagerProps = {
  status: EngineStatus;
  models: ModelInfo[];
  hardware: HardwareInfo | null;
  appLang: string;
  onStatusChange: () => void;
  onToast: (msg: string, type: "success" | "error" | "info") => void;
};

export default function ModelManager({
  status,
  models,
  hardware,
  appLang,
  onStatusChange,
  onToast,
}: ModelManagerProps) {
  const [selectedModel, setSelectedModel] = useState("small");
  const [device, setDevice] = useState("auto");
  const [switching, setSwitching] = useState(false);

  const handleLoad = async () => {
    try {
      await loadModel(selectedModel, device);
      onToast(
        t("toast.modelLoading", appLang).replace("{name}", selectedModel),
        "info"
      );
    } catch (e: any) {
      onToast(e.message || "Failed to load model", "error");
    }
  };

  const handleSwitch = async () => {
    setSwitching(true);
    try {
      await unloadModel();
      await new Promise((r) => setTimeout(r, 500));
      onStatusChange();
      onToast("Model unloaded. Select a new model and click Load.", "info");
    } catch (e: any) {
      onToast(e.message || "Failed to unload", "error");
    } finally {
      setSwitching(false);
    }
  };

  const handleLoadDiarization = async () => {
    try {
      await loadDiarization();
      onToast("Loading diarization pipeline...", "info");
    } catch (e: any) {
      onToast(e.message || "Failed to load diarization", "error");
    }
  };

  const isLocked = status.loading || switching;

  return (
    <div className="space-y-5">
      {/* Hardware Info */}
      {hardware && (
        <div className="space-y-2">
          {/* GPU Card */}
          <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
            hardware.cuda
              ? "bg-emerald-950/10 border-emerald-500/10"
              : "bg-white/[0.02] border-white/5"
          }`}>
            <Cpu size={14} className={hardware.cuda ? "text-emerald-400 mt-0.5" : "text-white/20 mt-0.5"} />
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="text-xs font-semibold text-white/85">{hardware.name}</p>
              {hardware.cuda ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {hardware.vram_total > 0 && (
                    <InfoRow label="VRAM" value={`${hardware.vram_free_label} free / ${hardware.vram_total_label}`} />
                  )}
                  {hardware.compute_capability && (
                    <InfoRow label="Compute" value={hardware.compute_capability} />
                  )}
                  {hardware.driver_version && (
                    <InfoRow label="Driver" value={hardware.driver_version} />
                  )}
                  {hardware.cuda_version && (
                    <InfoRow label="CUDA" value={hardware.cuda_version} />
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-white/30">{t("transcribe.noCudaGpu", appLang)}</p>
              )}
            </div>
          </div>

          {/* CPU + RAM Row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="px-3 py-2 rounded-xl bg-white/[0.015] border border-white/5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">CPU</p>
              <p className="text-[11px] text-white/70 mt-0.5 truncate">{hardware.cpu_name || "—"}</p>
              <p className="text-[10px] text-white/35">{hardware.cpu_cores} cores</p>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/[0.015] border border-white/5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">RAM</p>
              <p className="text-[11px] text-white/70 mt-0.5">{hardware.ram_total_label || "—"}</p>
              <p className="text-[10px] text-white/35">{hardware.ram_free_label || "—"} free</p>
            </div>
          </div>
        </div>
      )}

      {/* Model Selection */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-white/35">{t("settings.model", appLang)}</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={isLocked}
          className="w-full bg-[#111] border border-white/8 rounded-xl p-2.5 text-sm text-white/80 outline-none
            focus:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors appearance-none cursor-pointer"
        >
          {models.map((m) => (
            <option key={m.size} value={m.size}>
              {m.size} — {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Device Selection */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-white/35">{t("settings.device", appLang)}</label>
        <select
          value={device}
          onChange={(e) => setDevice(e.target.value)}
          disabled={isLocked}
          className="w-full bg-[#111] border border-white/8 rounded-xl p-2.5 text-sm text-white/80 outline-none
            focus:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors appearance-none cursor-pointer"
        >
          <option value="auto">{t("transcribe.autoDetect", appLang)}</option>
          <option value="cuda">{t("transcribe.cudaNvidia", appLang)}</option>
          <option value="cpu">{t("transcribe.cpuOnly", appLang)}</option>
        </select>
      </div>

      {/* Action Buttons */}
      {status.model_loaded && !switching ? (
        <div className="space-y-2">
          {/* Current model badge */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-950/20 border border-emerald-500/15 rounded-xl">
            <CheckCircle size={13} className="text-emerald-400" />
            <span className="text-xs text-emerald-300 font-medium">
              {status.current_model} · {status.device?.toUpperCase()}
            </span>
          </div>
          {/* Switch button */}
          <button
            onClick={handleSwitch}
            disabled={isLocked}
            className="w-full py-2.5 border border-white/10 text-white/55 text-sm font-medium rounded-xl
              hover:border-white/20 hover:text-white/70 hover:bg-white/[0.03]
              disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]
              flex items-center justify-center gap-2"
          >
            <RefreshCw size={13} />
            {t("settings.switchModel", appLang)}
          </button>
        </div>
      ) : (
        <button
          onClick={handleLoad}
          disabled={isLocked}
          className="w-full py-2.5 bg-white text-black text-sm font-semibold rounded-xl
            hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed
            transition-all active:scale-[0.98]"
        >
          {switching ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={13} className="animate-spin" /> {t("transcribe.switchingModel", appLang)}
            </span>
          ) : status.loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={13} className="animate-spin" /> {t("transcribe.loadingModel", appLang)}
            </span>
          ) : (
            t("settings.loadModel", appLang)
          )}
        </button>
      )}

      {/* Diarization Button */}
      <div className="pt-2 border-t border-white/5">
        <button
          onClick={handleLoadDiarization}
          disabled={status.diarization_loading}
          className="w-full py-2 border border-white/8 text-white/40 text-xs rounded-xl
            hover:border-white/15 hover:text-white/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {status.diarization_loading
            ? t("transcribe.loadingDiarization", appLang)
            : status.diarization_available
            ? t("transcribe.reloadDiarization", appLang)
            : t("settings.loadDiarization", appLang)}
        </button>
        {status.diarization_available && (
          <p className="text-[9px] text-emerald-400/40 text-center mt-1.5">
            {t("transcribe.diarizationNoToken", appLang)}
          </p>
        )}
      </div>

      {/* Loading Progress */}
      <AnimatePresence>
        {status.loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4">
              <ProgressBar
                pct={status.progress?.pct || 0}
                bytes={status.progress?.bytes || 0}
                total={status.progress?.total || 0}
                speed={status.progress?.speed || ""}
                desc={status.progress?.desc || ""}
              />
              <p className="text-[10px] text-white/25 text-center italic">
                {t("transcribe.firstDownload", appLang)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {status.error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-red-950/20 border border-red-500/15 rounded-xl"
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-red-400/80 leading-relaxed break-words">{status.error}</p>
                <button
                  onClick={() => handleLoad()}
                  className="mt-2 text-[10px] font-semibold text-white/40 hover:text-white/60 transition-colors"
                >
                  {t("transcribe.retry", appLang)}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">{label}</span>
      <span className="text-[10px] text-white/55 font-mono">{value}</span>
    </div>
  );
}
