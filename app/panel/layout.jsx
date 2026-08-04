'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function PanelTiendaLayout({ children }) {
  // ✅ Arranca cerrado en móvil y abierto en PC
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const ajustar = () => setSidebarOpen(window.innerWidth >= 1024);
    ajustar();
    window.addEventListener('resize', ajustar);
    return () => window.removeEventListener('resize', ajustar);
  }, []);

  return (
    <div className="flex h-screen bg-voltech-dark overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        {/* ✅ Padding responsive + contenido centrado en pantallas grandes */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <div className="w-full max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}