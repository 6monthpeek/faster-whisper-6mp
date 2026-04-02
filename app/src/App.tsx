import { useState, useCallback, useEffect, useRef } from "react";
import Titlebar from "./components/Titlebar";
import Sidebar from "./components/Sidebar";
import ToastContainer from "./components/Toast";
import TranscribePage from "./pages/TranscribePage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import { useEngine } from "./hooks/useEngine";
import { t } from "./lib/i18n";
import type { PageRoute, Toast as ToastType } from "./lib/types";

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      openFileDialog: () => Promise<string | null>;
      openFolderDialog: () => Promise<string | null>;
      onEngineError: (cb: (msg: string) => void) => void;
    };
  }
}

const LANG_STORAGE_KEY = "whisper-elite-lang";

let toastId = 0;

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageRoute>("transcribe");
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [appLang, setAppLang] = useState<string>(() => {
    try {
      return localStorage.getItem(LANG_STORAGE_KEY) || "en";
    } catch {
      return "en";
    }
  });

  const { online, status, hardware, models, languages, refreshStatus } = useEngine();

  const gpuToastShown = useRef(false);

  const addToast = useCallback((msg: string, type: "success" | "error" | "info" = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-4), { id, msg, type }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleAppLangChange = useCallback((lang: string) => {
    setAppLang(lang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    window.electronAPI?.onEngineError((msg) => {
      addToast(`Engine Error: ${msg}`, "error");
    });
  }, [addToast]);

  useEffect(() => {
    if (hardware?.cuda && !gpuToastShown.current) {
      gpuToastShown.current = true;
      const msg = t("toast.gpuDetected", appLang).replace("{name}", hardware.name);
      addToast(msg, "success");
    }
  }, [hardware?.cuda, hardware?.name, appLang, addToast]);

  useEffect(() => {
    if (!online) {
      const timer = setTimeout(() => {
        addToast(t("toast.engineStarting", appLang), "info");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [online, appLang, addToast]);

  return (
    <div
      className="h-screen w-full flex flex-col bg-[#050505] text-white/80 overflow-hidden select-none"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <Titlebar />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          engineOnline={online}
          modelLoaded={status.model_loaded}
          currentModel={status.current_model}
          device={status.device}
          appLang={appLang}
        />

        <div className={`flex-1 flex flex-col ${currentPage !== "transcribe" ? "hidden" : ""}`}>
          <TranscribePage
            status={status}
            hardware={hardware}
            models={models}
            languages={languages}
            engineOnline={online}
            appLang={appLang}
            onToast={addToast}
          />
        </div>
        <div className={`flex-1 flex flex-col ${currentPage !== "history" ? "hidden" : ""}`}>
          <HistoryPage onToast={addToast} />
        </div>
        <div className={`flex-1 flex flex-col ${currentPage !== "settings" ? "hidden" : ""}`}>
          <SettingsPage
            status={status}
            models={models}
            hardware={hardware}
            appLang={appLang}
            onAppLangChange={handleAppLangChange}
            onRefreshStatus={refreshStatus}
            onToast={addToast}
          />
        </div>
      </div>
    </div>
  );
}
