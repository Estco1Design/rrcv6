/** @type {import('next').NextConfig} */
const nextConfig = {
 output: 'standalone',
 poweredByHeader: false,
 images: {formats:['image/webp'],minimumCacheTTL:86400},
};
export default nextConfig;
