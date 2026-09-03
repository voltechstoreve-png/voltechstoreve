import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from './context/ThemeContext'
import { NotificationProvider } from './context/NotificationContext'
import { PermissionsProvider } from './context/PermissionsContext'
import ApkGate from '@/components/ApkGate'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Voltech Store',
  description: 'Tienda de productos tecnológicos y streaming',
  manifest: '/manifest.json',
  appleMobileWebAppCapable: 'yes',
  appleMobileWebAppStatusBarStyle: 'black-translucent',
  appleMobileWebAppTitle: 'Voltech Store',
  // ✅ ELIMINADO: themeColor ya no va aquí
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#00d4ff', // ✅ CORRECTO: themeColor va únicamente aquí
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
        <ThemeProvider>
          <NotificationProvider>
            <PermissionsProvider>
              <ApkGate>{children}</ApkGate>
            </PermissionsProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}