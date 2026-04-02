import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRecentLanguages } from "../hooks/useRecentLanguages";

const LANGUAGES: Record<string, string> = {
  en: "English", tr: "Turkish", de: "German", fr: "French",
  es: "Spanish", it: "Italian", pt: "Portuguese", ru: "Russian",
  zh: "Chinese", ja: "Japanese", ko: "Korean", ar: "Arabic",
  hi: "Hindi", nl: "Dutch", pl: "Polish", sv: "Swedish",
  da: "Danish", fi: "Finnish", no: "Norwegian", cs: "Czech",
  el: "Greek", he: "Hebrew", hu: "Hungarian", id: "Indonesian",
  ms: "Malay", ro: "Romanian", sk: "Slovak", th: "Thai",
  uk: "Ukrainian", vi: "Vietnamese", bg: "Bulgarian", ca: "Catalan",
  hr: "Croatian", lt: "Lithuanian", lv: "Latvian", sl: "Slovenian",
  et: "Estonian", tl: "Filipino", ur: "Urdu", ta: "Tamil",
};

type LanguagePickerProps = {
  value: string;
  onChange: (code: string) => void;
  label?: string;
};

export default function LanguagePicker({ value, onChange, label }: LanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { recent, addRecent } = useRecentLanguages();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus search on open
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const filtered = Object.entries(LANGUAGES).filter(([code, name]) =>
    code.toLowerCase().includes(search.toLowerCase()) ||
    name.toLowerCase().includes(search.toLowerCase())
  );

  const recentFiltered = recent
    .filter((code) => LANGUAGES[code])
    .filter((code) =>
      code.toLowerCase().includes(search.toLowerCase()) ||
      LANGUAGES[code].toLowerCase().includes(search.toLowerCase())
    );

  const select = (code: string) => {
    onChange(code);
    addRecent(code);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="relative" ref={ref}>
      {label && (
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-1 block">
          {label}
        </span>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/8 bg-[#111]
          text-xs text-white/60 hover:border-white/15 hover:text-white/80 transition-colors cursor-pointer"
      >
        <span className="font-medium">
          {value && LANGUAGES[value] ? LANGUAGES[value] : "Select…"}
        </span>
        <ChevronDown size={11} className={`text-white/30 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1 w-52 max-h-64 overflow-hidden rounded-xl
              bg-[#111] border border-white/10 shadow-2xl z-50 flex flex-col"
          >
            {/* Search */}
            <div className="p-2 border-b border-white/5">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.04]">
                <Search size={11} className="text-white/20" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="flex-1 bg-transparent text-[11px] text-white/70 outline-none placeholder:text-white/15"
                />
              </div>
            </div>

            {/* Language List */}
            <div className="overflow-auto flex-1 py-1">
              {/* Recent */}
              {!search && recentFiltered.length > 0 && (
                <>
                  <div className="px-3 py-1.5 flex items-center gap-1.5">
                    <Star size={8} className="text-white/15" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/15">
                      Recent
                    </span>
                  </div>
                  {recentFiltered.map((code) => (
                    <button
                      key={`r-${code}`}
                      onClick={() => select(code)}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] hover:bg-white/[0.04] transition-colors
                        ${value === code ? "text-white/80 bg-white/[0.03]" : "text-white/40"}`}
                    >
                      <span className="font-mono text-[9px] text-white/15 w-5">{code}</span>
                      <span>{LANGUAGES[code]}</span>
                    </button>
                  ))}
                  <div className="mx-3 my-1 border-t border-white/5" />
                </>
              )}

              {/* All */}
              {filtered.map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => select(code)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] hover:bg-white/[0.04] transition-colors
                    ${value === code ? "text-white/80 bg-white/[0.03]" : "text-white/40"}`}
                >
                  <span className="font-mono text-[9px] text-white/15 w-5">{code}</span>
                  <span>{name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
