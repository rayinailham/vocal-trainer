/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
      '@/components': './src/components',
      '@/app': './src/app',
      '@/lib': './src/lib',
      '@/utils': './src/utils',
      '@/hooks': './src/hooks',
      '@/types': './src/types',
      '@/styles': './src/styles',
      '@/public': './public',
    };
    return config;
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },

    resolveAlias: {
      '@': './src',
      '@/components': './src/components',
      '@/app': './src/app',
      '@/lib': './src/lib',
      '@/utils': './src/utils',
      '@/hooks': './src/hooks',
      '@/types': './src/types',
      '@/styles': './src/styles',
      '@/public': './public',
    }
  },
}

module.exports = nextConfig