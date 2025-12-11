/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output file tracing root for Docker builds (absolute path)
  outputFileTracingRoot: process.cwd(),

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Enable experimental features without invalid keys
  experimental: {
    scrollRestoration: true,
  },

  // Image optimization for profile pictures
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "zawaj-platform.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: false,
    unoptimized: false,
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Add allowed qualities to fix image quality warnings
     // qualities: [75, 100],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Static file serving optimization
  trailingSlash: false,
  poweredByHeader: false,

  // Redirect configuration for better SEO
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
      {
        source: "/login",
        destination: "/auth/register",
        permanent: false,
      },
    ];
  },

  // Output configuration for deployment
  output: "standalone",

  // Ensure proper standalone output
  outputFileTracingExcludes: {
    "*": ["node_modules/**", ".next/cache/**"], // Removed .next/server/chunks/** to ensure all chunks are included
  },

  // Skip static generation for all pages during build to avoid SSR issues
  generateBuildId: async () => {
    return "build";
  },

  // Force dynamic rendering for all pages to avoid SSR issues
  trailingSlash: false,
  poweredByHeader: false,

  // Disable static generation for all pages during build
  output: "standalone",

  // Server components external packages
  serverExternalPackages: ["@vercel/analytics", "@vercel/speed-insights"],

  // Strict mode for better development experience
  reactStrictMode: true,
};

module.exports = nextConfig;
