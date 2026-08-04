'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Menu, 
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  X,
  TrendingUp,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNotificaciones } from '@/app/context/NotificationContext';
import NotificationBell from '@/components/NotificationBell';

export default function Header({ sidebarOpen, setSidebarOpen, darkMode, setDarkMode }) {
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [userData, setUserData] = useState({
    nombre: 'Administrador',
    email: 'admin@voltech.store',
    rol: 'Admin',
    avatar: 'https://ui-avatars.com/api/?name=Administrador&background=00d4ff&color=fff&bold=true',
    id: null
  });

  const [salesStats, setSalesStats] = useState({
    clics: 0,
    ventas: 0,
    comisiones: 0
  });

  const { notificaciones } = useNotificaciones();

  useEffect(() => {
    const fetchUserDataAndStats = async () => {
      let user = null;
      const userLoggedStr = localStorage.getItem('voltech_user');
      
      if (userLoggedStr) {
        const localUser = JSON.parse(userLoggedStr);
        
        if (supabase && localUser.id) {
          const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', localUser.id)
            .single();
          
          if (!error && data) {
            user = data;
          } else {
            user = localUser;
          }
        } else {
          user = localUser;
        }
      }

      if (user) {
        setUserData(prev => ({
          ...prev,
          nombre: user.nombre || 'Administrador',
          email: user.email || 'admin@voltech.store',
          rol: user.rol || 'Admin',
          avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.nombre || 'Admin'}&background=00d4ff&color=fff&bold=true`,
          id: user.id || null
        }));

        let ventasCount = 0;
        let comisionesTotal = 0;
        const nombreVendedor = user.nombre?.toLowerCase() || '';
        
        const normalizarNombre = (nombre) => {
          if (!nombre) return '';
          return nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        };
        const nombreNormalizado = normalizarNombre(nombreVendedor);

        const calcularDesdeLocalStorage = () => {
          const ventasProductos = JSON.parse(localStorage.getItem('voltech_ventas') || '[]');
          const ventasStreaming = JSON.parse(localStorage.getItem('voltech_ventas_streaming') || '[]');
          
          [...ventasProductos, ...ventasStreaming].forEach(venta => {
            const vendedorVenta = normalizarNombre(
              venta.vendedor || 
              venta.vendedorNombre || 
              venta.usuario || 
              venta.user || 
              venta.empleado || 
              venta.nombreVendedor ||
              ''
            );
            
            const coincide = 
              vendedorVenta === nombreNormalizado ||
              vendedorVenta.includes(nombreNormalizado) ||
              nombreNormalizado.includes(vendedorVenta);

            if (coincide) {
              ventasCount += 1;
              const total = venta.total || 0;
              comisionesTotal += total * 0.10;
            }
          });
        };

        if (supabase) {
          const { data: ventasData, error } = await supabase
            .from('ventas')
            .select('*');
          
          if (!error && ventasData) {
            ventasData.forEach(venta => {
              const vendedorVenta = normalizarNombre(
                venta.vendedor || 
                venta.vendedorNombre || 
                venta.usuario || 
                venta.user || 
                venta.empleado || 
                venta.nombreVendedor ||
                ''
              );
              
              const coincide = 
                vendedorVenta === nombreNormalizado ||
                vendedorVenta.includes(nombreNormalizado) ||
                nombreNormalizado.includes(vendedorVenta);

              if (coincide) {
                ventasCount += 1;
                const total = venta.total || 0;
                comisionesTotal += total * 0.10;
              }
            });
          } else {
            calcularDesdeLocalStorage();
          }
        } else {
          calcularDesdeLocalStorage();
        }

        const clics = parseInt(localStorage.getItem(`clics_ref_${user.nombre}`) || '0') || 8;

        setSalesStats({
          clics,
          ventas: ventasCount,
          comisiones: comisionesTotal
        });
      }
    };

    fetchUserDataAndStats();
  }, []);

  const referralCode = userData.nombre ? `VOLTECHSTORE-${userData.nombre.substring(0, 5).toUpperCase()}-${(userData.id || '0000').toString().slice(-4)}` : 'voltech2024';
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/catalogo?ref=${referralCode}` : '';

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Link de referido copiado al portapapeles');
  };

  const handleLogout = () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('voltech_user');
      toast.success('Sesión cerrada correctamente');
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => {
          document.getElementById('global-search-input')?.focus();
        }, 100);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/panel/productos?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className="bg-voltech-surface border-b border-voltech-border px-3 sm:px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors"
              title={sidebarOpen ? 'Contraer menú' : 'Expandir menú'}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* ✅ Búsqueda visible en móvil */}
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors"
              title="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 bg-voltech-dark border border-voltech-border rounded-lg px-3 py-2 hover:border-voltech-cyan transition-colors"
            >
              <Search className="w-4 h-4 text-voltech-muted" />
              <span className="text-sm text-voltech-muted">Buscar...</span>
              <span className="text-[10px] text-voltech-muted bg-voltech-border px-2 py-0.5 rounded">
                Ctrl Shift K
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
            <NotificationBell />

            <div className="relative">
              <button
                onClick={() => setStatsOpen(!statsOpen)}
                className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors relative"
                title="Mis Ventas"
              >
                <TrendingUp className="w-5 h-5" />
                {salesStats.ventas > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-voltech-success rounded-full"></span>
                )}
              </button>

              <AnimatePresence>
                {statsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-voltech-surface border border-voltech-border rounded-lg shadow-xl z-50"
                  >
                    <div className="p-3 border-b border-voltech-border">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-voltech-cyan" />
                        Mis Ventas
                      </h3>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-voltech-muted mb-1">Tu link de referencia:</p>
                        <div className="flex items-center gap-2 bg-voltech-dark border border-voltech-border rounded-lg p-2">
                          <span className="text-xs text-voltech-cyan truncate flex-1">{referralLink}</span>
                          <button 
                            onClick={copyReferralLink}
                            className="p-1 hover:bg-voltech-border rounded transition-colors"
                            title="Copiar"
                          >
                            <Copy className="w-3 h-3 text-voltech-muted" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-voltech-dark/50 rounded-lg p-2">
                          <p className="text-lg font-bold text-white">{salesStats.clics}</p>
                          <p className="text-[10px] text-voltech-muted">Clics</p>
                        </div>
                        <div className="bg-voltech-dark/50 rounded-lg p-2">
                          <p className="text-lg font-bold text-voltech-success">{salesStats.ventas}</p>
                          <p className="text-[10px] text-voltech-muted">Ventas</p>
                        </div>
                        <div className="bg-voltech-dark/50 rounded-lg p-2">
                          <p className="text-lg font-bold text-voltech-cyan">${salesStats.comisiones.toFixed(2)}</p>
                          <p className="text-[10px] text-voltech-muted">Comisiones</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          router.push('/panel/dashboard-ventas');
                          setStatsOpen(false);
                        }}
                        className="w-full py-2 text-xs text-voltech-cyan hover:bg-voltech-cyan/10 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        Ver reporte completo <TrendingUp className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-voltech-border transition-colors"
              >
                <img 
                  src={userData.avatar} 
                  alt={userData.nombre} 
                  className="w-8 h-8 rounded-full" 
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">{userData.nombre}</p>
                  <p className="text-[10px] text-voltech-muted">{userData.rol}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-voltech-muted" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-voltech-surface border border-voltech-border rounded-lg shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-voltech-border">
                      <p className="text-sm font-semibold text-white">{userData.nombre}</p>
                      <p className="text-xs text-voltech-muted">{userData.email}</p>
                    </div>
                    
                    <div className="py-2">
                      <button 
                        onClick={() => {
                          router.push('/panel/perfil');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-voltech-muted hover:bg-voltech-border hover:text-white transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Mi Perfil
                      </button>
                      <button 
                        onClick={() => {
                          router.push('/panel/configuracion');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-voltech-muted hover:bg-voltech-border hover:text-white transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Configuración
                      </button>
                    </div>

                    <div className="border-t border-voltech-border py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-voltech-error hover:bg-voltech-error/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[60] flex items-start justify-center pt-[20vh] px-4"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-voltech-surface border border-voltech-border rounded-2xl w-full max-w-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearch}>
                <div className="flex items-center gap-3 p-4 border-b border-voltech-border">
                  <Search className="w-5 h-5 text-voltech-muted" />
                  <input
                    id="global-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar productos, clientes, ventas..."
                    className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder-voltech-muted"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </form>
              <div className="p-4 text-xs text-voltech-muted hidden sm:block">
                <p>Presiona <kbd className="px-2 py-1 bg-voltech-dark rounded">Ctrl Shift K</kbd> para buscar</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}