'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUser } from '@/lib/session';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import InstallAppButton from '@/components/InstallAppButton';

export default function PanelTiendaLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setMounted(true);
    const checkWidth = () => setSidebarOpen(window.innerWidth >= 768);
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // ✅ CANDADO: sin sesión → al portal; con sesión → ve todo
  useEffect(() => {
    const raw = getUser();
    if (!raw || !raw.nombre) {
      router.replace('/portal');
    } else {
      setUser(raw);
    }
  }, [pathname, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-voltech-dark flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-voltech-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-voltech-dark overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mounted={mounted}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>

      <InstallAppButton />
    </div>
  );
}