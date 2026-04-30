import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const jsxDevRuntimeShim = fileURLToPath(
  new URL("./src/react-jsx-dev-runtime-shim.ts", import.meta.url),
);

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "react/jsx-dev-runtime": jsxDevRuntimeShim,
    },
  },
  envDir: "../../",
  ssr: {
    external: ["pdfkit", "fontkit", "swissqrbill", "png-js", "linebreak"],
  },
  build: {
    rollupOptions: {
      external: [
        "pdfkit",
        "fontkit",
        "swissqrbill",
        "swissqrbill/pdf",
        "png-js",
        "linebreak",
      ],
    },
  },
  plugins: [tailwindcss(), tanstackStart(), nitro(), viteReact()],
  server: {
    port: 3000,
  },
});
