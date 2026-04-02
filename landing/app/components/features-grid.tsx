"use client";

import { motion, useInView } from "framer-motion";
import { Zap, Shield, Globe, Users, Clock, FileOutput } from "lucide-react";
import { useRef } from "react";

const features = [
  {
    icon: Zap,
    title: "GPU Accelerated",
    desc: "NVIDIA CUDA support for 10x faster transcription. Harness your GPU for real-time processing.",
    size: "large" as const,
  },
  {
    icon: Shield,
    title: "100% Private",
    desc: "Everything runs locally. Your audio never leaves your machine.",
    size: "small" as const,
  },
  {
    icon: Globe,
    title: "90+ Languages",
    desc: "Auto-detection included. Transcribe in any major language.",
    size: "small" as const,
  },
  {
    icon: Users,
    title: "Speaker Diarization",
    desc: "Identify who said what. Separate speakers automatically with precision timestamps.",
    size: "large" as const,
  },
  {
    icon: Clock,
    title: "Word Timestamps",
    desc: "Precise timing for every single word spoken.",
    size: "small" as const,
  },
  {
    icon: FileOutput,
    title: "Multiple Exports",
    desc: "TXT, SRT, VTT, JSON — ready for subtitles, captions, and analysis.",
    size: "small" as const,
  },
];

export default function FeaturesGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-32 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold tracking-tight mb-16"
        >
          Built for speed. Designed for privacy.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`${feature.size === "large" ? "md:col-span-2" : "md:col-span-1"} bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-8 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 group`}
            >
              <feature.icon
                className="w-6 h-6 text-white/40 mb-4 group-hover:text-white/70 transition-colors"
                strokeWidth={1.5}
              />
              <h3 className="text-lg font-semibold mb-2 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
