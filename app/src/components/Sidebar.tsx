import { Mic, Clock, Settings, Zap } from "lucide-react";
import type { PageRoute } from "../lib/types";
import { t } from "../lib/i18n";

type SidebarProps = {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  engineOnline: boolean;
  modelLoaded: boolean;
  currentModel: string | null;
  device: string | null;
  appLang: string;
};

export default function Sidebar({
  currentPage,
  onNavigate,
  engineOnline,
  modelLoaded,
  currentModel,
  device,
  appLang,
}: SidebarProps) {
  const NAV_ITEMS: { id: PageRoute; icon: typeof Mic; labelKey: string }[] = [
    { id: "transcribe", icon: Mic, labelKey: "nav.transcribe" },
    { id: "history", icon: Clock, labelKey: "nav.history" },
    { id: "settings", icon: Settings, labelKey: "nav.settings" },
  ];

  const statusColor = !engineOnline
    ? "bg-red-500"
    : modelLoaded
    ? "bg-emerald-400"
    : "bg-amber-400";

  const statusText = !engineOnline
    ? t("nav.offline", appLang)
    : modelLoaded
    ? `${currentModel} · ${device?.toUpperCase()}`
    : t("nav.noModel", appLang);

  return (
    <aside className="w-[220px] flex-shrink-0 border-r border-white/5 bg-[#080808] flex flex-col">
      {/* Status */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`} />
          <span className="text-[11px] text-white/55 truncate">{statusText}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ id, icon: Icon, labelKey }) => {
          const active = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                ${
                  active
                    ? "bg-white/[0.06] text-white border border-white/10"
                    : "text-white/45 hover:text-white/75 hover:bg-white/[0.02] border border-transparent"
                }`}
            >
              <Icon size={15} />
              <span className="font-medium">{t(labelKey, appLang)}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-white/25">
          <Zap size={12} />
          <span className="text-[10px] font-semibold tracking-widest uppercase">{t("nav.localProcessing", appLang)}</span>
        </div>
      </div>
    </aside>
  );
}
