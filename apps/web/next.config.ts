import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // API audit/correlation remains authoritative; dev access URLs can carry one-use tokens.
  logging: {incomingRequests: false},
  poweredByHeader: false,
  async headers() {
    return [{source: "/:path*", headers: [
      {key: "Referrer-Policy", value: "no-referrer"},
      {key: "X-Content-Type-Options", value: "nosniff"},
      {key: "X-Frame-Options", value: "DENY"},
      {key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'"},
      {key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()"},
    ]}];
  },
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  allowedDevOrigins: ["192.168.0.8"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
