import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */

// const nextConfig: NextConfig = {
//   /* config options here */
//   reactStrictMode: true,
// };

// export default nextConfig;


const nextConfig: NextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:5002/api/v1/:path*', // Proxy to backend
      },
    ];
  },
};

export default nextConfig;

