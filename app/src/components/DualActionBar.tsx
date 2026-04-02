import { Mic, Languages, ArrowRight } from "lucide-react";
import LanguagePicker from "./LanguagePicker";
import { t } from "../lib/i18n";

type DualActionBarProps = {
  onTranscribe: () => void;
  onTranslate: () => void;
  targetLanguage: string;
  onTargetLanguageChange: (code: string) => void;
  sourceLanguage: string;
  onSourceLanguageChange: (code: string) => void;
  disabled: boolean;
  appLang: string;
};

export default function DualActionBar({
  onTranscribe,
  onTranslate,
  targetLanguage,
  onTargetLanguageChange,
  sourceLanguage,
  onSourceLanguageChange,
  disabled,
  appLang,
}: DualActionBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <LanguagePicker
            value={sourceLanguage}
            onChange={onSourceLanguageChange}
            label={t("transcribe.sourceLang", appLang)}
          />
        </div>
        <ArrowRight size={14} className="text-white/10 mt-4 flex-shrink-0" />
        <div className="flex-1">
          <LanguagePicker
            value={targetLanguage}
            onChange={onTargetLanguageChange}
            label={t("transcribe.targetLang", appLang)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onTranscribe}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-xl
            text-[13px] font-semibold hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed
            transition-all active:scale-[0.98]"
        >
          <Mic size={14} />
          {t("nav.transcribe", appLang)}
        </button>

        <button
          onClick={onTranslate}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 border border-white/18
            text-white/70 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-white/[0.04]
            hover:border-white/20 hover:text-white/90
            disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          <Languages size={14} />
          {t("transcribe.translate", appLang)}
        </button>
      </div>
    </div>
  );
}
