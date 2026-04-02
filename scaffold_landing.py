import os
import json

base_dir = r"c:\Users\Omerk\Desktop\faster-whisper-6mp\landing"

os.makedirs(f"{base_dir}/app", exist_ok=True)

package_json = {
  "name": "faster-whisper-landing",
  "version": "0.1.0",
  "private": True,
  "scripts": {
    "dev": "next dev",
    "build": "npm run build:next",
    "build:next": "next build",
    "build:worker": "opennextjs-cloudflare build",
    "build:cf": "npm run build:worker",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "^18",
    "react-dom": "^18",
    "framer-motion": "^11",
    "lucide-react": "^0.378.0",
    "tailwind-merge": "^2.3.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "eslint": "^8",
    "eslint-config-next": "14.2.3",
    "opennextjs-cloudflare": "^0.2.1"
  }
}

with open(f"{base_dir}/package.json", "w") as f:
    json.dump(package_json, f, indent=2)

wrangler_jsonc = """{
  "name": "faster-whisper-landing",
  "main": ".worker-next/index.mjs",
  "compatibility_date": "2024-05-01",
  "compatibility_flags": ["nodejs_compat"],
  "build": {
    "command": "npm run build:worker"
  }
}
"""

with open(f"{base_dir}/wrangler.jsonc", "w") as f:
    f.write(wrangler_jsonc)

tailwind_config = """import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: {} },
  plugins: [],
};
export default config;
"""

with open(f"{base_dir}/tailwind.config.ts", "w") as f:
    f.write(tailwind_config)

postcss_config = """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
"""

with open(f"{base_dir}/postcss.config.js", "w") as f:
    f.write(postcss_config)

tsconfig = {
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": True,
    "skipLibCheck": True,
    "strict": True,
    "noEmit": True,
    "esModuleInterop": True,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": True,
    "isolatedModules": True,
    "jsx": "preserve",
    "incremental": True,
    "plugins": [{"name": "next"}],
    "paths": {"@/*": ["./*"]}
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

with open(f"{base_dir}/tsconfig.json", "w") as f:
    json.dump(tsconfig, f, indent=2)

layout_tsx = """import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Faster-Whisper Desktop",
  description: "Elite Local Transcription on GPU.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
"""

with open(f"{base_dir}/app/layout.tsx", "w") as f:
    f.write(layout_tsx)

page_tsx = """export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-5xl font-bold tracking-tight mb-4">Faster-Whisper Elite</h1>
      <p className="text-lg text-gray-400 mb-8 max-w-xl text-center">
        Unleash the power of local GPU transcription. Zero latency. Zero hosting costs. Total privacy.
      </p>
      <a href="#" className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors">
        Download for Windows
      </a>
    </main>
  );
}
"""

with open(f"{base_dir}/app/page.tsx", "w") as f:
    f.write(page_tsx)

globals_css = """@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #000000;
  --foreground: #ffffff;
}

body {
  background-color: var(--background);
  color: var(--foreground);
}
"""

with open(f"{base_dir}/app/globals.css", "w") as f:
    f.write(globals_css)

print("Scaffolding complete!")
