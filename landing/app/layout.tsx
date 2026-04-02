import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Faster-Whisper Elite — Local GPU Transcription",
  description:
    "GPU-accelerated transcription that never leaves your machine. 90+ languages, zero latency, total privacy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
