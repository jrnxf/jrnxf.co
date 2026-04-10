import { defineConfig, type Plugin } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function fontDisplayOptional(): Plugin {
  return {
    name: "font-display-optional",
    enforce: "pre",
    transform(code, id) {
      // Strip ?url suffix for matching — Vite resolves the id with the query still attached
      const cleanId = id.split("?")[0];
      if (cleanId.includes("@fontsource") && cleanId.endsWith(".css")) {
        return code.replace(/font-display:\s*swap/g, "font-display: optional");
      }
    },
    generateBundle(_, bundle) {
      // Catch any emitted CSS assets that slipped through transform
      for (const asset of Object.values(bundle)) {
        if (
          asset.type === "asset" &&
          typeof asset.source === "string" &&
          String(asset.fileName).endsWith(".css")
        ) {
          asset.source = asset.source.replace(/font-display:\s*swap/g, "font-display: optional");
        }
      }
    },
  };
}

export default defineConfig({
  staged: { "*": "vp check --fix" },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    react(),
    tailwindcss(),
    fontDisplayOptional(),
  ],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
