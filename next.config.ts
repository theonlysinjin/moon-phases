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
  images: {
    unoptimized: true,
    // Ensure all images are included in the build
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Optimize webpack configuration for better asset handling
  webpack: (config, { isServer }) => {
    // Handle image files
    config.module.rules.push({
      test: /\.(jpg|jpeg|png|gif|webp)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/images/[name].[hash][ext]',
      },
    });
    
    // Handle video files
    config.module.rules.push({
      test: /\.(webm|mp4|ogg)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/videos/[name].[hash][ext]',
      },
    });
    
    return config;
  },
  // Ensure all assets are properly handled
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
  },
};

export default nextConfig;
