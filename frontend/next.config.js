/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply CORS headers to API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        // Proxy API requests to the Python backend
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ];
  },
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['react-markdown'],
    optimizeCss: true,
    scrollRestoration: true,
  },
  webpack: (config) => {
    // Handle audio files for TTS playback
    config.module.rules.push({
      test: /\.(ogg|mp3|wav|mpe?g)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/chunks/[path][name].[hash][ext]',
      },
    });
    return config;
  },
};

module.exports = nextConfig;
