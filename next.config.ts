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
};

export default nextConfig;