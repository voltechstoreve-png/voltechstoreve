/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Headers de seguridad y caché
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          // ✅ Content Security Policy para permitir Service Workers y Firebase
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.gstatic.com https://www.google-analytics.com;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https: blob:;
              font-src 'self' data:;
              connect-src 'self' https://*.supabase.co https://*.firebaseio.com https://*.googleapis.com https://fcm.googleapis.com;
              worker-src 'self' blob:;
              frame-src 'self' https://*.google.com;
            `.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },

  // ✅ Redirecciones de dominio
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'voltechstoreve-6nuj-git-main-voltechstoreve-pngs-projects.vercel.app',
          },
        ],
        destination: 'https://voltechstoreve.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'voltechstoreve-6nuj.vercel.app',
          },
        ],
        destination: 'https://voltechstoreve.com/:path*',
        permanent: true,
      },
    ];
  },

  // ✅ Configuración adicional para PWA y Service Workers
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Asegurar que los Service Workers funcionen
      config.output = {
        ...config.output,
        webassemblyModuleFilename: 'static/wasm/[modulehash].wasm',
      };
    }
    return config;
  },
};

export default nextConfig;
