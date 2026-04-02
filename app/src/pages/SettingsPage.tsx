import { useState, useEffect } from "react";
import { Trash2, Globe, HardDrive, RefreshCw } from "lucide-react";
import ModelManager from "../components/ModelManager";
import type { EngineStatus, ModelInfo, HardwareInfo, CachedModel } from "../lib/types";
import { fetchCachedModels, deleteCachedModel } from "../lib/api";
import { t, APP_LANGUAGES, type AppLanguage } from "../lib/i18n";

type SettingsPageProps = {
  status: EngineStatus;
  models: ModelInfo[];
  hardware: HardwareInfo | null;
  appLang: string;
  onAppLangChange: (lang: string) => void;
  onRefreshStatus: () => void;
  onToast: (msg: string, type: "success" | "error" | "info") => void;
};

export default function SettingsPage({
  status,
  models,
  hardware,
  appLang,
  onAppLangChange,
  onRefreshStatus,
  onToast,
}: SettingsPageProps) {
  const [cachedModels, setCachedModels] = useState<CachedModel[]>([]);
  const [langSearch, setLangSearch] = useState("");
  const [showAllLangs, setShowAllLangs] = useState(false);

  useEffect(() => {
    loadCached();
  }, []);

  const loadCached = async () => {
    try {
      const data = await fetchCachedModels();
      setCachedModels(data.cached);
    } catch { /* ignore */ }
  };

  const handleDeleteCached = async (modelSize: string) => {
    try {
      await deleteCachedModel(modelSize);
      onToast(t("settings.deleteCache", appLang) + ` "${modelSize}"`, "info");
      onRefreshStatus();
      loadCached();
    } catch (e: any) {
      onToast(e.message || "Failed to delete model", "error");
    }
  };

  const filteredLangs = showAllLangs
    ? APP_LANGUAGES.filter((l) =>
        l.label.toLowerCase().includes(langSearch.toLowerCase()) ||
        l.code.toLowerCase().includes(langSearch.toLowerCase())
      )
    : APP_LANGUAGES.slice(0, 8);

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 overflow-auto">
      {/* Header */}
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
        {t("settings.title", appLang)}
      </span>

      {/* App Language */}
      <div className="max-w-lg space-y-3">
        <div className="flex items-center gap-2">
          <Globe size={12} className="text-white/35" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            {t("settings.appLanguage", appLang)}
          </span>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder={t("transcribe.searchLanguage", appLang)}
          value={langSearch}
          onChange={(e) => {
            setLangSearch(e.target.value);
            if (!showAllLangs) setShowAllLangs(true);
          }}
          className="w-full bg-[#111] border border-white/8 rounded-xl p-2.5 text-xs text-white/70 outline-none
            focus:border-white/20 transition-colors placeholder:text-white/15"
        />

        {/* Language Grid */}
        <div className="grid grid-cols-4 gap-1.5">
          {filteredLangs.map((lang: AppLanguage) => (
            <button
              key={lang.code}
              onClick={() => onAppLangChange(lang.code)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left
                ${appLang === lang.code
                  ? "bg-white/[0.08] border-white/25 text-white/90"
                  : "bg-white/[0.02] border-white/6 text-white/50 hover:bg-white/[0.04] hover:text-white/70"
                }`}
            >
              <span className="text-base flex-shrink-0">{lang.flag}</span>
              <span className="text-[11px] truncate">{lang.label}</span>
            </button>
          ))}
        </div>

        {!showAllLangs && APP_LANGUAGES.length > 8 && (
          <button
            onClick={() => setShowAllLangs(true)}
            className="text-[10px] text-white/30 hover:text-white/50 transition-colors"
          >
            {t("transcribe.showAllLanguages", appLang).replace("{count}", String(APP_LANGUAGES.length))}
          </button>
        )}
      </div>

      {/* Model Manager */}
      <div className="max-w-lg pt-4 border-t border-white/5">
        <ModelManager
          status={status}
          models={models}
          hardware={hardware}
          appLang={appLang}
          onStatusChange={onRefreshStatus}
          onToast={onToast}
        />
      </div>

      {/* Cached Models */}
      <div className="max-w-lg pt-4 border-t border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive size={12} className="text-white/35" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              {t("settings.cachedModels", appLang)}
            </span>
          </div>
          <button
            onClick={loadCached}
            className="text-white/15 hover:text-white/30 transition-colors"
          >
            <RefreshCw size={11} />
          </button>
        </div>

        {cachedModels.length === 0 ? (
          <p className="text-[11px] text-white/25">{t("transcribe.noCachedModels", appLang)}</p>
        ) : (
          <div className="space-y-1.5">
            {cachedModels.map((cm) => (
              <div
                key={cm.size}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.015] border border-white/5"
              >
                <div>
                  <span className="text-xs font-medium text-white/70">{cm.size}</span>
                  <span className="text-[10px] text-white/35 ml-2">{cm.label}</span>
                </div>
                <button
                  onClick={() => handleDeleteCached(cm.size)}
                  className="flex items-center gap-1 text-[10px] text-red-400/60 hover:text-red-400/90
                    transition-colors"
                >
                  <Trash2 size={10} />
                  {t("settings.deleteCache", appLang)}
                  {status.current_model === cm.size && (
                    <span className="text-[8px] text-amber-400/40 ml-1">{t("transcribe.active", appLang)}</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* About */}
      <div className="max-w-lg pt-4 border-t border-white/5 space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          {t("settings.about", appLang)}
        </span>
        <div className="space-y-2 text-[11px] text-white/35 leading-relaxed">
          <p>{t("settings.aboutDesc1", appLang)}</p>
          <p>{t("settings.aboutDesc2", appLang)}</p>
          <p>{t("settings.aboutDesc3", appLang)}</p>
        </div>
      </div>
    </div>
  );
}
