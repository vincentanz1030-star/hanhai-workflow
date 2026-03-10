import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
  },
  // 允许开发环境的跨域请求
  allowedDevOrigins: [
    'bebfc9ed-0429-4050-b7ba-204ee62d731c.dev.coze.site',
    '.dev.coze.site',
    'localhost:5000',
  ],
  // 添加缓存控制头
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
