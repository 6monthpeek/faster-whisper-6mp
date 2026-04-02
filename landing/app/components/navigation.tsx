"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

export default function Navigation() {
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(latest > prev && latest > 80);
  });

  return (
    <motion.header
      animate={{ y: hidden ? -80 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/60 border-b border-white/10"
    >
      <nav className="max-w-6xl mx-auto h-16 flex items-center justify-between px-6">
        <span className="text-lg font-bold tracking-tight">
          Whisper Elite
        </span>

        <a
          href="#"
          className="hidden md:inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
        >
          Download
        </a>
      </nav>
    </motion.header>
  );
}
