import type { NextConfig } from "next";

// Configure for GitHub Pages static export
// Use env vars so CI can set them dynamically based on repo name
const basePath = process.env.NEXT_BASE_PATH || "";
const assetPrefix = process.env.NEXT_ASSET_PREFIX || undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix,
  trailingSlash: true,
};

export default nextConfig;
