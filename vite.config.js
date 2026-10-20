import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function precache() {
  return {
    name: "dg-precache",
    apply: "build",
    generateBundle(_options, bundle) {
      const files = ["/index.html", "/logo.png", "/favicon.svg", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png", "/sw.js"];
      for (const fileName of Object.keys(bundle)) {
        if (/\.(js|css|svg|png|woff2)$/.test(fileName)) files.push(`/${fileName}`);
      }
      this.emitFile({ type: "asset", fileName: "precache.json", source: JSON.stringify(files) });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), precache()],
  server: { port: 5173 },
});
