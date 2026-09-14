/** @type {import('next').NextConfig} */
const nextConfig = {
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