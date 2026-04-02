"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const formats = ["TXT", "SRT", "VTT", "JSON"];
const languages = ["EN", "ES", "FR", "DE", "JA", "ZH", "AR", "KO", "PT", "RU", "TR", "HI"];

function AnimatedCounter({ target, inView }: { target: number; inView: boolean }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) {
      const controls = animate(count, target, {
        duration: 2,
        ease: "easeOut",
      });
      const unsub = rounded.on("change", (v) => setDisplay(v));
      return () => {
        controls.stop();
        unsub();
      };
    }
  }, [inView, target, count, rounded]);

  return <span>{display}</span>;
}

export default function FormatsShowcase() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-32 px-6 border-t border-white/5" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          {/* Export Formats */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
            >
              Export in any format
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-gray-500 mb-8"
            >
              Ready for subtitles, captions, and data analysis.
            </motion.p>

            <div className="flex flex-wrap gap-3">
              {formats.map((fmt, i) => (
                <motion.span
                  key={fmt}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                  className="rounded-full border border-white/10 px-6 py-2.5 text-sm font-mono hover:bg-white/[0.06] transition-colors cursor-default"
                >
                  .{fmt.toLowerCase()}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Language Counter */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6"
            >
              <span className="text-6xl md:text-7xl font-bold tracking-tighter">
                <AnimatedCounter target={90} inView={isInView} />+
              </span>
              <p className="text-gray-500 mt-2">languages with auto-detection</p>
            </motion.div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {languages.map((lang, i) => (
                <motion.span
                  key={lang}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.3, delay: 0.4 + i * 0.03 }}
                  className="text-sm text-gray-600 text-center py-1 font-mono"
                >
                  {lang}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
