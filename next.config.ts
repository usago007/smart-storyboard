import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const isExport = process.env.BUILD_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(isExport ? { output: "export" as const } : {}),
  basePath,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
