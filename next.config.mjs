/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    // Only hosts the app actually loads images from. "**" let the image
    // optimiser fetch from any domain.
    // TODO(phase-1): drop images.unsplash.com once real menu photography is
    // imported (SOW Schedule C §6 — client supplies food photography).
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "mygermandoener.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
