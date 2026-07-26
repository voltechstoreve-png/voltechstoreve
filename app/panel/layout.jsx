'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from '@/app/context/ThemeContext';
import toast, { Toaster } from 'react-hot-toast';

export default function PanelLayout({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userLogged = localStorage.getItem('voltech_user');
    
    if (!userLogged) {
      toast.error('Debes iniciar sesión para acceder al panel');
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-voltech-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-voltech-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-voltech-muted">Cargando panel...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' },
          success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } },
        }}
      />
      {children}
    </ThemeProvider>
  );
}