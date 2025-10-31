// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // This completely disables Next.js image optimization
  },
  // Remove all remotePatterns and other image config for now
}

export default nextConfig;