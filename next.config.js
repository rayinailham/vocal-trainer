/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['meyda'],
    scrollRestoration: true,
  },
  
  // Bundle analyzer for production builds
  webpack: (config, { isServer }) => {
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
    
    // Production optimizations
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
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
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig