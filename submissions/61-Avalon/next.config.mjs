/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    webpackBuildWorker: false,
    workerThreads: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
