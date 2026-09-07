import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  outputFileTracingIncludes: {
    "/api/analyze": ["./node_modules/kuromoji/dict/**/*"],
  },
};

export default nextConfig;
