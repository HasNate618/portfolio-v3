import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // markdown-it is a server-only dependency; bundling it into .next's vendor chunks
  // drops the `markdown-it.js` chunk name and the server then fails on first load.
  serverExternalPackages: ["markdown-it"],
};

export default nextConfig;
