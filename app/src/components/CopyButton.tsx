import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useClipboard } from "../hooks/useClipboard";

type CopyButtonProps = {
  text: string;
  label?: string;
  className?: string;
};

export default function CopyButton({ text, label, className }: CopyButtonProps) {
  const { copied, copy } = useClipboard();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        copy(text);
      }}
      className={`flex items-center gap-1 text-white/20 hover:text-white/50 transition-colors ${className || ""}`}
      title="Copy"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="copied"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1 text-emerald-400/70"
          >
            <Check size={11} />
            {label && <span className="text-[10px]">Copied!</span>}
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1"
          >
            <Copy size={11} />
            {label && <span className="text-[10px]">{label}</span>}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
