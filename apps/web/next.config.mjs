/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@carepulse/shared-types"],
  output: "standalone",
};

export default nextConfig;
