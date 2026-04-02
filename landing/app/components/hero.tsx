"use client";

import { motion } from "framer-motion";

const titleWords = ["Transcribe.", "Locally.", "Instantly."];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-16">
      <div className="max-w-4xl mx-auto text-center">
        {/* Title */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">
          {titleWords.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.12,
                duration: 0.5,
                ease: "easeOut",
              }}
              className="inline-block mr-3 md:mr-5"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-gray-500 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
        >
          GPU-accelerated transcription that never leaves your machine.
          <br className="hidden md:block" /> 90+ languages. Zero latency. Total privacy.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
        >
          <a
            href="#"
            className="inline-block px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors text-lg"
          >
            Download for Windows
          </a>
        </motion.div>

        {/* Trust pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-8"
        >
          {["100% Local", "GPU Powered", "Zero Latency"].map((label) => (
            <span
              key={label}
              className="text-sm text-gray-500 border border-white/10 rounded-full px-4 py-1"
            >
              {label}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
