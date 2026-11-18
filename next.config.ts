import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // markdown-it is a server-only dependency; bundling it into .next's vendor chunks
  // drops the `markdown-it.js` chunk name and the server then fails on first load.
  serverExternalPackages: ["markdown-it"],

  /**
   * /experience lost its own page when the home page took over the full role
   * entries, but the URL is still indexed and still linked from outside, so
   * visitors land on a 404 for a page that used to exist. Send them to the
   * section that replaced it instead. The per-role pages under /experience/*
   * are untouched and still resolve.
   */
  async redirects() {
    return [
      {
        source: "/experience",
        destination: "/#experience",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
