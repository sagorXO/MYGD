import { securityHeaders } from "./src/lib/security-headers.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Only hosts the app actually loads images from. Our own /public files need no entry.
    remotePatterns: [{ protocol: "https", hostname: "mygermandoener.com" }],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    // Dev tooling needs eval and websockets, so the policy applies to production builds only.
    if (process.env.NODE_ENV !== "production") return [];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
