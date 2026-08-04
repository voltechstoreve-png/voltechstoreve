'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Package, ShoppingCart, DollarSign, Menu } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { usePermissions } from '@/app/context/PermissionsContext';

export default function PanelTiendaLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { tienePermiso } = usePermissions();

  useEffect(() => {
    const ajustar = () => setSidebarOpen(window.innerWidth >= 1024);
    ajustar();
    window.addEventListener('resize', ajustar);
    return () => window.removeEventListener('resize', ajustar);
  }, []);

  // ✅ Accesos rápidos de la barra inferior (móvil)
  const bottomNav = [
    { name: 'Productos', icon: Package, path: '/panel/productos' },
    { name: 'Ventas', icon: ShoppingCart, path: '/panel/ventas-productos' },
    ...(tienePermiso('puedeVerFinanzas') ? [{ name: 'Finanzas', icon: DollarSign, path: '/panel/finanzas' }] : []),
  ];

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
        
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
          <div className="w-full max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* ✅ BARRA INFERIOR SOLO MÓVIL (tipo app) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-voltech-surface border-t border-voltech-border flex items-stretch justify-around">
        {bottomNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors ${active ? 'text-voltech-cyan' : 'text-voltech-muted'}`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium text-voltech-muted hover:text-voltech-cyan transition-colors"
        >
          <Menu className="w-5 h-5" />
          Menú
        </button>
      </nav>
    </div>
  );
}