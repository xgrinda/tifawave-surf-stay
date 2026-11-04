/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
  images: {
    qualities: [75, 80, 82, 84, 88],
    remotePatterns: [
      {
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL
          ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
          : "unconfigured.supabase.co",
        protocol: "https",
        port: "",
        pathname: "/storage/v1/object/public/tifawave-media/**",
      },
      {
        hostname: "tuzefzcosvvhzffbxhpm.supabase.co",
        protocol: "https",
        pathname: "/storage/v1/object/public/tifawave-media/**",
        port: "",
      },
      {
        hostname: "images.unsplash.com",
        protocol: "https",
        port: "",
      },
      {
        hostname: "images.pexels.com",
        protocol: "https",
        port: "",
      },
    ],
  },
};

export default nextConfig;
