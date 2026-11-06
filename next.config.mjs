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
            value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; img-src 'self' data: blob: https://res.cloudinary.com/dytykwtc/image/upload/ https://tuzefzcosvvhzffbxhpm.supabase.co/storage/v1/object/public/tifawave-media/ https://images.unsplash.com https://images.pexels.com " + (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://unconfigured.supabase.co") + "/storage/v1/object/public/tifawave-media/",
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
    maximumRedirects: 0,
    dangerouslyAllowLocalIP: false,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", port: "",
        pathname: "/dytykwtc/image/upload/**", search: "" },
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
