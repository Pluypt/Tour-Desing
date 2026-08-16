import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["canvas", "pdfjs-dist"],
  turbopack: {
    root: __dirname,
    resolveAlias: {
      canvas: { browser: "./src/lib/canvas-mock.js" },
      ws: { browser: "./src/lib/ws-mock.js" },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: path.resolve(__dirname, "./src/lib/canvas-mock.js"),
        ws: path.resolve(__dirname, "./src/lib/ws-mock.js"),
      };
    }
    return config;
  },
};

export default nextConfig;
