import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const repositoryName = "myPixel";
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
  output: isGithubPages ? "export" : undefined,
  trailingSlash: isGithubPages,
  basePath: isGithubPages ? `/${repositoryName}` : undefined,
  assetPrefix: isGithubPages ? `/${repositoryName}/` : undefined,
};

export default nextConfig;
