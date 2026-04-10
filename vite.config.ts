import { defineConfig, type Plugin } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function fontDisplayOptional(): Plugin {
  return {
    name: "font-display-optional",
    transform(code, id) {
      if (id.includes("@fontsource") && id.endsWith(".css")) {
        return code.replace(/font-display:\s*swap/g, "font-display: optional");
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
