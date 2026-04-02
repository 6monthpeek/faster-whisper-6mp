import { motion } from "framer-motion";
import { formatBytes } from "../lib/utils";

type ProgressBarProps = {
  pct: number;
  bytes: number;
  total: number;
  speed: string;
  desc: string;
};

export default function ProgressBar({ pct, bytes, total, speed, desc }: ProgressBarProps) {
  return (
    <div className="w-full space-y-4">
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div
          className="h-full bg-white rounded-full"
          style={{ boxShadow: "0 0 15px rgba(255,255,255,0.3)" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", bounce: 0, duration: 0.25 }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px]">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold uppercase tracking-wider text-white/20">Speed</span>
          <span className="text-white/80 font-medium">{speed || "—"}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-bold uppercase tracking-wider text-white/20">Progress</span>
          <span className="text-white/80 font-medium">{Math.round(pct)}%</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-bold uppercase tracking-wider text-white/20">Data</span>
          <span className="text-white/80 font-medium">
            {formatBytes(bytes)} / {formatBytes(total)}
          </span>
        </div>
      </div>

      {desc && (
        <p className="text-[11px] text-white/30 text-center">{desc}</p>
      )}
    </div>
  );
}
