import type { NextConfig } from "next";

// Cache Components is off: guide pages read the store and searchParams on every request,
// and the classic dynamic model is simpler to reason about for this slice.
const nextConfig: NextConfig = {
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
