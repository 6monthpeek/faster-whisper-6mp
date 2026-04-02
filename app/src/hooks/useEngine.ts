import { useState, useEffect, useCallback, useRef } from "react";
import { fetchStatus, fetchHardware, fetchModels, fetchLanguages, fetchCapabilities } from "../lib/api";
import type { EngineStatus, HardwareInfo, ModelInfo, Capabilities } from "../lib/types";

const DEFAULT_STATUS: EngineStatus = {
  loading: false,
  model_loaded: false,
  current_model: null,
  device: null,
  compute_type: null,
  error: null,
  diarization_available: false,
  diarization_loading: false,
  noise_suppression_available: false,
  progress: { pct: 0, bytes: 0, total: 0, speed: "", desc: "" },
};

const FAIL_THRESHOLD = 3;

export function useEngine() {
  const [online, setOnline] = useState(false);
  const [status, setStatus] = useState<EngineStatus>(DEFAULT_STATUS);
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [languages, setLanguages] = useState<Record<string, string>>({});
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failCountRef = useRef(0);

  useEffect(() => {
    const interval = status.loading ? 2000 : 5000;

    const poll = async () => {
      try {
        const data = await fetchStatus();
        setStatus(data);
        failCountRef.current = 0;
        if (!online) setOnline(true);
      } catch {
        failCountRef.current++;
        if (failCountRef.current >= FAIL_THRESHOLD) {
          setOnline(false);
        }
      }
    };

    poll();
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(poll, interval);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [status.loading, online]);

  useEffect(() => {
    if (!online) return;
    fetchHardware().then(setHardware).catch(() => { /* ignore */ });
  }, [online]);

  useEffect(() => {
    if (!online) return;
    fetchModels().then((d) => setModels(d.models)).catch(() => { /* ignore */ });
    fetchLanguages().then((d) => setLanguages(d.languages)).catch(() => { /* ignore */ });
    fetchCapabilities().then(setCapabilities).catch(() => { /* ignore */ });
  }, [online]);

  const refreshStatus = useCallback(async () => {
    try {
      const data = await fetchStatus();
      setStatus(data);
    } catch { /* ignore */ }
  }, []);

  return {
    online,
    status,
    hardware,
    models,
    languages,
    capabilities,
    refreshStatus,
  };
}
