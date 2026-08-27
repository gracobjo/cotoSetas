/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permitir HMR / assets desde la IP LAN al probar con el móvil
  allowedDevOrigins: ["10.197.185.46", "127.0.0.1", "localhost"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
  },
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
};

export default nextConfig;
