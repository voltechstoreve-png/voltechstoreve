/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ 1. Evitar que el navegador guarde en caché la página HTML y los scripts
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

  // ✅ 2. Tus redirecciones de dominio existentes
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
    ]
  },
}

export default nextConfig