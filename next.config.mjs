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
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
                ],
            },
        ];
    },
};

export default nextConfig;
