import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow the app to be deployed as a static export to GitHub Pages.
  // On Vercel this is ignored — full Node runtime is used.
  output: undefined,
};

export default nextConfig;
