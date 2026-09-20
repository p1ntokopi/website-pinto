import type { NextConfig } from "next";

const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || "";
const r2Hostname = r2PublicUrl ? new URL(r2PublicUrl).hostname : "";

const nextConfig: NextConfig = {
  // The Playwright suite drives the dev server through http://127.0.0.1:3000
  // while Next serves it on localhost. Without this, dev chunks are rejected as
  // cross-origin, React never hydrates, and a form submit falls through to the
  // browser's native GET (which puts credentials in the query string).
  allowedDevOrigins: ['127.0.0.1'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      ...(r2Hostname
        ? [
            {
              protocol: 'https' as const,
              hostname: r2Hostname,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
