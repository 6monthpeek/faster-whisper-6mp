"use client";

import { motion, useInView } from "framer-motion";
import { Upload, Settings, FileText } from "lucide-react";
import { useRef } from "react";

const steps = [
  {
    num: "01",
    icon: Upload,
    title: "Drop your file",
    desc: "Drag and drop any audio or video file. Supports all major formats.",
  },
  {
    num: "02",
    icon: Settings,
    title: "Select options",
    desc: "Choose language, enable diarization, adjust VAD and noise settings.",
  },
  {
    num: "03",
    icon: FileText,
    title: "Get transcription",
    desc: "GPU-accelerated processing delivers results in seconds.",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-32 px-6 border-t border-white/5" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold tracking-tight mb-20"
        >
          How it works
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.12 }}
              className="relative"
            >
              {/* Number */}
              <span className="text-sm text-gray-600 font-mono mb-4 block">
                {step.num}
              </span>

              {/* Icon circle */}
              <div className="w-12 h-12 rounded-full border border-white/15 flex items-center justify-center mb-5">
                <step.icon className="w-5 h-5 text-white/60" strokeWidth={1.5} />
              </div>

              <h3 className="text-xl font-semibold mb-2 tracking-tight">
                {step.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {step.desc}
              </p>

              {/* Connector line (desktop only) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 -right-6 w-12 border-t border-dashed border-white/10" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
