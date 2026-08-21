'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/app/context/ThemeContext';
import { usePermissions } from '@/app/context/PermissionsContext';
import { 
  Package, ShoppingCart, Users, Megaphone, Gift, MessageSquare, 
  Settings, ChevronLeft, Monitor, Moon, LogOut, PlayCircle, UserCog,
  BarChart, Target, DollarSign, Truck, CreditCard, Bell
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, sidebarOpen, setSidebarOpen, mounted }) {
  const pathname = usePathname();
  const { darkMode, setDarkMode } = useTheme();
  const { usuarioActual, tienePermiso, esAdmin, esSocio } = usePermissions();

  // ✅ Mientras NO esté montado, SIEMPRE usa true (para coincidir con el SSR)
  const finalIsOpen = !mounted ? true : (sidebarOpen !== undefined ? sidebarOpen : isOpen);
  const finalOnClose = setSidebarOpen ? () => setSidebarOpen(false) : onClose;

  const menuItems = [
    {
      section: 'PANEL TIENDA',
      items: [
        { name: 'Catálogo Público', icon: Package, path: '/catalogo', siempreVisible: true },
        { name: 'Productos', icon: Package, path: '/panel/productos', siempreVisible: true },
        { name: 'Proveedores', icon: Truck, path: '/panel/proveedores', requierePermiso: 'puedeVerConfiguracion' },
        { name: 'Sorteos', icon: Gift, path: '/panel/sorteos', requierePermiso: 'puedeVerConfiguracion' },
        { name: 'Opiniones', icon: MessageSquare, path: '/panel/opiniones', requierePermiso: 'puedeVerConfiguracion' },
      ]
    },
    {
      section: 'PANEL VENTAS',
      items: [
        { name: 'Dashboard Ventas', icon: BarChart, path: '/panel/dashboard-ventas', siempreVisible: true },
        { name: 'Ventas Productos', icon: ShoppingCart, path: '/panel/ventas-productos', siempreVisible: true },
        { name: 'Ventas Streaming', icon: PlayCircle, path: '/panel/ventas-streaming', siempreVisible: true },
        { name: 'Clientes', icon: Users, path: '/panel/clientes', siempreVisible: true },
        { name: 'Alertas', icon: Bell, path: '/panel/alertas', siempreVisible: true },
      ]
    },
    {
      section: 'PANEL FINANZAS',
      items: [
        { name: 'Dashboard Finanzas', icon: DollarSign, path: '/panel/finanzas', requierePermiso: 'puedeVerFinanzas' },
        { name: 'Pagos al Equipo', icon: CreditCard, path: '/panel/finanzas/pagos-equipos', requierePermiso: 'puedeVerFinanzas' },
        { name: 'Metas y Comisiones', icon: Target, path: '/panel/metas-comisiones', siempreVisible: true },
      ]
    },
    {
      section: 'PANEL MARKETING',
      items: [
        { name: 'Marketing', icon: Megaphone, path: '/panel/marketing', siempreVisible: true },
      ]
    },
    {
      section: 'SISTEMA',
      items: [
        { name: 'Equipo', icon: UserCog, path: '/panel/equipo', requierePermiso: 'puedeCrearUsuarios' },
        { name: 'Ajustes', icon: Settings, path: '/panel/ajustes', requierePermiso: 'puedeVerConfiguracion' },
      ]
    }
  ];

  const menuItemsFiltrados = menuItems.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.siempreVisible) return true;
      if (item.requierePermiso && tienePermiso(item.requierePermiso)) return true;
      return false;
    })
  })).filter(section => section.items.length > 0);

  const handleLogout = () => {
    localStorage.removeItem('voltech_user');
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          finalIsOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={finalOnClose}
      />

      {/* Mobile sidebar (drawer) — sin Framer Motion */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 w-64 bg-voltech-surface border-r border-voltech-border z-50 overflow-hidden transition-transform duration-300 ${
          finalIsOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-voltech-border">
            <div
              className="text-xl font-extrabold bg-gradient-to-r from-voltech-cyan to-voltech-purple bg-clip-text text-transparent cursor-pointer"
              onClick={() => window.location.href = '/'}
            >
              VOLTECH
            </div>
            <button
              onClick={finalOnClose}
              className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            {menuItemsFiltrados.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h3 className="text-[10px] font-bold text-voltech-muted uppercase tracking-wider mb-2">
                  {section.section}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={finalOnClose}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-voltech-cyan/20 to-voltech-purple/20 text-voltech-cyan border-l-2 border-voltech-cyan'
                            : 'text-voltech-muted hover:bg-voltech-border hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-voltech-border space-y-2">
            {usuarioActual && (
              <div className="px-3 py-2 mb-2">
                <p className="text-xs text-voltech-muted">Conectado como:</p>
                <p className="text-sm font-semibold text-white">{usuarioActual.nombre}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  esAdmin ? 'bg-voltech-purple/20 text-voltech-purple' : 
                  esSocio ? 'bg-voltech-warning/20 text-voltech-warning' : 
                  'bg-voltech-cyan/20 text-voltech-cyan'
                }`}>
                  {esAdmin ? 'Administrador' : esSocio ? 'Socio' : 'Vendedor'}
                </span>
              </div>
            )}

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-voltech-muted hover:bg-voltech-border hover:text-white transition-colors"
            >
              {darkMode ? <Monitor className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="text-sm">{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-voltech-error hover:bg-voltech-error/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop sidebar — sin Framer Motion */}
      <aside
        className={`hidden md:block h-full bg-voltech-surface border-r border-voltech-border overflow-hidden transition-all duration-300 flex-shrink-0 ${
          finalIsOpen ? 'w-64' : 'w-0'
        }`}
      >
        <div className="flex flex-col h-full w-64">
          <div className="flex items-center justify-between p-4 border-b border-voltech-border">
            {finalIsOpen && (
              <div
                className="text-xl font-extrabold bg-gradient-to-r from-voltech-cyan to-voltech-purple bg-clip-text text-transparent cursor-pointer"
                onClick={() => window.location.href = '/'}
              >
                VOLTECH
              </div>
            )}
            {finalIsOpen && (
              <button
                onClick={finalOnClose}
                className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            {menuItemsFiltrados.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {finalIsOpen && (
                  <h3 className="text-[10px] font-bold text-voltech-muted uppercase tracking-wider mb-2">
                    {section.section}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <div key={item.path} className="relative group">
                        <Link
                          href={item.path}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-voltech-cyan/20 to-voltech-purple/20 text-voltech-cyan border-l-2 border-voltech-cyan'
                              : 'text-voltech-muted hover:bg-voltech-border hover:text-white'
                          }`}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          {finalIsOpen && (
                            <span className="text-sm font-medium">{item.name}</span>
                          )}
                        </Link>
                        
                        {!finalIsOpen && (
                          <div className="absolute left-full ml-2 px-3 py-2 bg-voltech-surface border border-voltech-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                            <span className="text-sm font-medium text-white">{item.name}</span>
                            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-voltech-surface border-l border-b border-voltech-border rotate-45"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-voltech-border space-y-2">
            {finalIsOpen && usuarioActual && (
              <div className="px-3 py-2 mb-2">
                <p className="text-xs text-voltech-muted">Conectado como:</p>
                <p className="text-sm font-semibold text-white">{usuarioActual.nombre}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  esAdmin ? 'bg-voltech-purple/20 text-voltech-purple' : 
                  esSocio ? 'bg-voltech-warning/20 text-voltech-warning' : 
                  'bg-voltech-cyan/20 text-voltech-cyan'
                }`}>
                  {esAdmin ? 'Administrador' : esSocio ? 'Socio' : 'Vendedor'}
                </span>
              </div>
            )}

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-voltech-muted hover:bg-voltech-border hover:text-white transition-colors"
            >
              {darkMode ? <Monitor className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {finalIsOpen && <span className="text-sm">{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>}
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-voltech-error hover:bg-voltech-error/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {finalIsOpen && <span className="text-sm">Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}