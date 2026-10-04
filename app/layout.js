import PushRegistrar from '@/components/PushRegistrar'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from './context/ThemeContext'
import { NotificationProvider } from './context/NotificationContext'
import { PermissionsProvider } from './context/PermissionsContext'
import ApkGate from '@/components/ApkGate'
import SessionKeeper from '@/components/SessionKeeper'
import ClearSW from './ClearSW' // ✅ NUEVO: Importamos el limpiador

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    default: 'Voltech Store | Tecnología y Streaming al Mejor Precio en Venezuela',
    template: '%s | Voltech Store'
  },
  description: 'Tienda líder en Venezuela de productos tecnológicos, accesorios, cornetas, audífonos y servicios de streaming. Envíos rápidos, garantía asegurada y las mejores ofertas.',
  keywords: ['tecnología', 'streaming', 'voltech', 'accesorios', 'cornetas', 'audífonos', 'venezuela', 'cargadores', 'kits'],
  authors: [{ name: 'Voltech Store' }],
  creator: 'Voltech Store',
  publisher: 'Voltech Store',
  manifest: '/manifest.json',
  appleMobileWebAppCapable: 'yes',
  appleMobileWebAppStatusBarStyle: 'black-translucent',
  appleMobileWebAppTitle: 'Voltech Store',
  openGraph: {
    type: 'website',
    locale: 'es_VE',
    url: 'https://voltechstoreve.com',
    siteName: 'Voltech Store',
    title: 'Voltech Store | Tecnología y Streaming',
    description: 'Los mejores productos tecnológicos y servicios de streaming en Venezuela. Calidad, garantía y los mejores precios.',
    images: [{ url: 'https://voltechstoreve.com/voltechstore.png', width: 1200, height: 630, alt: 'Voltech Store' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voltech Store | Tecnología y Streaming',
    description: 'Los mejores productos tecnológicos y servicios de streaming en Venezuela.',
    images: ['https://voltechstoreve.com/voltechstore.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#00d4ff',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" href="/voltechstore.png" />
        <link rel="apple-touch-icon" href="/voltechstore.png" />
        <meta name="theme-color" content="#00d4ff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Voltech Store" />
      </head>
      <body className={inter.className}>
        {/* ✅ NUEVO: Esto limpiará la caché corrupta automáticamente */}
        <ClearSW />
        
        <ThemeProvider>
          <NotificationProvider>
            <PermissionsProvider>
              <SessionKeeper>
                <PushRegistrar />
                <ApkGate>{children}</ApkGate>
              </SessionKeeper>
            </PermissionsProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}