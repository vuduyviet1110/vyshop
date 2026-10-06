/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
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
