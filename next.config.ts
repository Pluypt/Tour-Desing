import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["canvas", "pdfjs-dist"],
  turbopack: {
    resolveAlias: {
      canvas: { browser: "./src/lib/canvas-mock.js" },
    },
  },
};

export default nextConfig;
