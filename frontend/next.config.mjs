const api = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: api.protocol.replace(":", ""), hostname: api.hostname, port: api.port, pathname: "/media/**" }],
  },
};
export default nextConfig;
