import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Trình duyệt gọi /api cùng nguồn để cookie đăng nhập hoạt động, Next.js chuyển tiếp sang backend
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3001";
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
