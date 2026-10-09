/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Cho phép mở dev server qua tunnel Cloudflare (không thì Next chặn /_next/* và JS client không chạy -> không gọi API)
    allowedDevOrigins: ['*.trycloudflare.com'],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'img.vietqr.io',
            },
        ],
    },
    turbopack: {},
};

export default nextConfig;
