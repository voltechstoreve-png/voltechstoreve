/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Silenciar error de Turbopack
  turbopack: {},

  // ✅ Headers simplificados (sin CSP estricto por ahora)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
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
};

export default nextConfig;
