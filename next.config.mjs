/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "32mb"
    }
  },
  images: {
    dangerouslyAllowLocalIP: true,
    qualities: [75, 82, 84, 88],
    remotePatterns: [
      {
        hostname: "**.supabase.co",
        protocol: "https"
      },
      {
        hostname: "images.unsplash.com",
        protocol: "https"
      },
      {
        hostname: "images.pexels.com",
        protocol: "https"
      }
    ]
  }
};

export default nextConfig;
