import { defineConfig } from "vite";
import relay from "vite-plugin-relay";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import pluginRewriteAll from "vite-plugin-rewrite-all";

export default defineConfig({
  plugins: [relay, react(), visualizer(), pluginRewriteAll()],
  define: { "process.env": {} },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          markdown: [
            "react-markdown",
            "remark-breaks",
            "sanitize-html",
            "rehype-raw",
          ],
          common: [
            "react",
            "react-dom",
            "react-relay",
            "relay-runtime",
            "@sentry/react",
            "recoil",
            "connectkit",
            "wagmi",
            "@emotion/css",
            "@tanstack/react-query",
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      "/graphql": "http://localhost:4001/",
    },
  },
});
