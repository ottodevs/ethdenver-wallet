/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add output configuration for better error handling
  output: 'standalone',
  // Improve error reporting during build
  webpack: (config) => {
    // Add better error reporting for client components
    config.optimization.moduleIds = 'named';
    return config;
  },
  // Ensure proper handling of client components
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Improve static generation
  staticPageGenerationTimeout: 180,
};

export default nextConfig;
