import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

module.exports = {
  experimental: {
    esmExternals: true, // Allow ES Modules
  },
};

export default nextConfig;
