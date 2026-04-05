import type { NextConfig } from "next";

const allowedDevOrigins = Array.from(
  new Set(
    [
      "localhost",
      "127.0.0.1",
      "10.16.9.159",
      ...(process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",") ?? []),
    ]
      .map((value) => value.trim())
      .filter(Boolean),
  ),
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins,
};

export default nextConfig;
