import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, AlertCircle, Loader2, X } from "lucide-react";
import type { Toast as ToastType } from "../lib/types";

type ToastContainerProps = {
  toasts: ToastType[];
  onDismiss: (id: number) => void;
};

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="absolute top-14 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastType; onDismiss: (id: number) => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 200);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30, scale: 0.96 }}
      animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : 30, scale: visible ? 1 : 0.96 }}
      exit={{ opacity: 0, x: 30, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 px-4 py-3 rounded-2xl text-sm shadow-2xl border backdrop-blur-md cursor-pointer
        ${
          toast.type === "success"
            ? "bg-emerald-950/80 border-emerald-500/20 text-emerald-300"
            : toast.type === "error"
            ? "bg-red-950/80 border-red-500/20 text-red-300"
            : "bg-white/[0.04] border-white/10 text-white/80"
        }`}
      onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 200); }}
    >
      <div className="flex-shrink-0 mt-0.5">
        {toast.type === "success" && <CheckCircle size={14} />}
        {toast.type === "error" && <AlertCircle size={14} />}
        {toast.type === "info" && <Loader2 size={14} className="animate-spin" />}
      </div>
      <span className="flex-1 leading-relaxed">{toast.msg}</span>
      <button className="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity">
        <X size={12} />
      </button>
    </motion.div>
  );
}
