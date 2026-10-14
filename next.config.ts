import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components OFF: pages show live, per-user data.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    // Photos can be up to 2 MB; the form adds a little extra (default is 1 MB).
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;