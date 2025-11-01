/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@react-pdf/renderer'],
  serverComponentsExternalPackages: ['@react-pdf/renderer'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    // Ensure @react-pdf/renderer is properly resolved
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
};

export default nextConfig;
