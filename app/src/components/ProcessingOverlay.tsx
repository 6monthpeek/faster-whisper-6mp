import { motion } from "framer-motion";
import { Loader2, Check } from "lucide-react";

export type ProcessingStep = {
  key: string;
  label: string;
  status: "pending" | "active" | "done";
};

type ProcessingOverlayProps = {
  steps: ProcessingStep[];
  progress: number;
  currentLabel: string;
  detail?: string;
};

export default function ProcessingOverlay({
  steps,
  progress,
  currentLabel,
  detail,
}: ProcessingOverlayProps) {
  const doneCount = steps.filter((s) => s.status === "done").length;
  const totalSteps = steps.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center gap-4">
        <div className="relative w-10 h-10 flex-shrink-0">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="2.5"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeDasharray={`${progress * 0.94} 100`}
              strokeLinecap="round"
              className="transition-all duration-500"
              style={{
                filter: "drop-shadow(0 0 3px rgba(255,255,255,0.25))",
              }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white/85">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/80">{currentLabel}</p>
          {detail && (
            <p className="text-[10px] text-white/40 mt-0.5">{detail}</p>
          )}
          <p className="text-[10px] text-white/35 mt-0.5">
            {doneCount} / {totalSteps} steps complete
          </p>
        </div>
      </div>

      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-white/60 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        />
      </div>

      <div className="space-y-1.5">
        {steps.map((step) => (
          <div key={step.key} className="flex items-center gap-2.5">
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              {step.status === "done" && (
                <Check size={11} className="text-emerald-400/70" />
              )}
              {step.status === "active" && (
                <Loader2 size={11} className="text-white/50 animate-spin" />
              )}
              {step.status === "pending" && (
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
              )}
            </div>
            <span
              className={`text-[11px] transition-colors ${
                step.status === "done"
                  ? "text-white/45 line-through"
                  : step.status === "active"
                  ? "text-white/75 animate-pulse"
                  : "text-white/25"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
