'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Bell, BellRing, BellOff, CheckCircle, Users, Gift, Trophy, ShoppingCart, AlertTriangle, 
  Trash2, X, MonitorPlay, RefreshCw, Link as LinkIcon, Clock, Ticket, Megaphone 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNotificaciones } from '@/app/context/NotificationContext';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const [showDropdown, setShowDropdown] = useState(false);
  const { notificaciones, marcarLeida, marcarTodasLeidas, eliminarNotificacion, limpiarTodas } = useNotificaciones();
  const router = useRouter();
  const contenedorRef = useRef(null);

  // ✅ Si el Header abre "Mis Ventas" o el menú de usuario, cerramos Notificaciones
  useEffect(() => {
    const cerrar = () => setShowDropdown(false);
    window.addEventListener('voltech-abrio-dropdown', cerrar);
    return () => window.removeEventListener('voltech-abrio-dropdown', cerrar);
  }, []);

  // ✅ Clic fuera cierra Notificaciones
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ NOTIFICACIONES DEL SISTEMA (PC y móvil), por dispositivo
  const [notifSistema, setNotifSistema] = useState(false);
  const vistasRef = useRef(null);

  useEffect(() => {
    setNotifSistema(localStorage.getItem('voltech_notif_sistema') === '1');
  }, []);

  const activarNotifSistema = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Este dispositivo no soporta notificaciones');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      localStorage.setItem('voltech_notif_sistema', '1');
      setNotifSistema(true);
      try { new Notification('VOLTECH STORE ✅', { body: 'Notificaciones activadas en este dispositivo', icon: '/voltechstore.png' }); } catch (e) {}
      toast.success('Notificaciones activadas en este dispositivo');
    } else {
      toast.error('Permiso de notificaciones denegado');
    }
  };

  const desactivarNotifSistema = () => {
    localStorage.setItem('voltech_notif_sistema', '0');
    setNotifSistema(false);
    toast.success('Notificaciones desactivadas en este dispositivo');
  };

  // ✅ Al llegar una notificación NUEVA del panel → la envía al sistema operativo
  useEffect(() => {
    if (!Array.isArray(notificaciones) || notificaciones.length === 0) return;
    const keyDe = (n) => n.id || `${n.titulo || ''}${n.fecha || ''}`;
    if (vistasRef.current === null) {
      vistasRef.current = new Set(notificaciones.map(keyDe));
      return; // no notificar las que ya existían al abrir
    }
    const nuevas = notificaciones.filter(n => !vistasRef.current.has(keyDe(n)));
    if (nuevas.length > 0) {
      nuevas.forEach(n => vistasRef.current.add(keyDe(n)));
      if (notifSistema && 'Notification' in window && Notification.permission === 'granted') {
        const n = nuevas[0];
        try {
          new Notification(n.titulo || 'VOLTECH STORE', { body: n.mensaje || n.detalle || '', icon: '/voltechstore.png' });
        } catch (e) {}
      }
    }
  }, [notificaciones, notifSistema]);

  const noLeidas = notificaciones.filter(n => !n.leida).length;
  const ultimas = notificaciones.slice(0, 5);

  const getIcono = (tipo) => {
    switch (tipo) {
      case 'referido': return <Gift className="w-4 h-4 text-voltech-cyan" />;
      case 'nivel': return <Trophy className="w-4 h-4 text-voltech-warning" />;
      case 'sorteo': return <Users className="w-4 h-4 text-voltech-purple" />;
      case 'venta':
      case 'nueva_venta': return <ShoppingCart className="w-4 h-4 text-voltech-success" />;
      case 'nueva_venta_streaming': return <MonitorPlay className="w-4 h-4 text-voltech-purple" />;
      case 'vencimiento_streaming': return <Clock className="w-4 h-4 text-voltech-warning" />;
      case 'cuenta_nueva': return <MonitorPlay className="w-4 h-4 text-voltech-cyan" />;
      case 'cuenta_modificada':
      case 'cuenta_reemplazada': return <RefreshCw className="w-4 h-4 text-voltech-purple" />;
      case 'plataforma_nueva':
      case 'plataforma_eliminada': return <LinkIcon className="w-4 h-4 text-voltech-cyan" />;
      case 'cupon': return <Ticket className="w-4 h-4 text-voltech-success" />;
      case 'publicidad': return <Megaphone className="w-4 h-4 text-voltech-warning" />;
      case 'stock': return <AlertTriangle className="w-4 h-4 text-voltech-error" />;
      case 'cliente': return <Users className="w-4 h-4 text-voltech-success" />;
      default: return <Bell className="w-4 h-4 text-voltech-muted" />;
    }
  };

  // ✅ RUTAS ACTUALIZADAS: todo lo de streaming va a ventas-streaming; "ver todas" va a Alertas
  const getRuta = (notificacion) => {
    switch (notificacion.tipo) {
      case 'referido':
      case 'nivel':
      case 'sorteo':
      case 'cliente':
        return '/panel/clientes';
      case 'venta':
      case 'nueva_venta':
        return '/panel/ventas-productos';
      case 'nueva_venta_streaming':
      case 'vencimiento_streaming':
      case 'cuenta_nueva':
      case 'cuenta_modificada':
      case 'cuenta_reemplazada':
      case 'plataforma_nueva':
      case 'plataforma_eliminada':
        return '/panel/ventas-streaming';
      case 'cupon':
      case 'publicidad':
        return '/panel/marketing';
      case 'stock':
        return '/panel/productos';
      default:
        return '/panel/alertas';
    }
  };

  const handleClic = (notificacion) => {
    marcarLeida(notificacion.id);
    router.push(getRuta(notificacion));
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        onClick={() => {
          const vaAbrir = !showDropdown;
          if (vaAbrir) window.dispatchEvent(new CustomEvent('voltech-abrio-notificaciones'));
          setShowDropdown(vaAbrir);
        }}
        className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-white transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-voltech-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {noLeidas}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* ✅ Fondo oscuro solo en móvil (toca fuera para cerrar) */}
          <div className="fixed inset-0 bg-black/60 z-40 sm:hidden" onClick={() => setShowDropdown(false)} />

          <div className="fixed left-2 right-2 top-14 bottom-4 w-auto flex flex-col overflow-hidden sm:left-auto sm:right-0 sm:top-auto sm:bottom-auto sm:mt-2 sm:w-96 sm:max-h-[80vh] bg-voltech-surface border border-voltech-border rounded-2xl shadow-2xl z-50">
            <div className="p-4 border-b border-voltech-border shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white">Notificaciones</h3>
                <button onClick={() => setShowDropdown(false)} className="p-1.5 rounded-lg hover:bg-voltech-border text-voltech-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={marcarTodasLeidas} className="text-xs text-voltech-cyan flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Marcar todas leídas
                </button>
                <button onClick={limpiarTodas} className="text-xs text-voltech-error flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Vaciar
                </button>
              </div>
              <button
                onClick={notifSistema ? desactivarNotifSistema : activarNotifSistema}
                className={`mt-2 w-full flex items-center justify-center gap-2 text-xs px-2 py-2 rounded-lg border transition-colors ${notifSistema ? 'bg-voltech-success/20 text-voltech-success border-voltech-success/40' : 'bg-voltech-dark/50 text-voltech-muted border-voltech-border hover:text-voltech-cyan'}`}
              >
                {notifSistema ? <BellRing className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                {notifSistema ? 'Notificaciones: ACTIVADAS' : 'Activar notificaciones (PC/móvil)'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {ultimas.length === 0 ? (
                <p className="text-center text-voltech-muted py-8 text-sm">No hay notificaciones</p>
              ) : (
                ultimas.map((notificacion, idx) => (
                  <div key={notificacion.id || idx} className={`p-3 border-b border-voltech-border last:border-b-0 ${!notificacion.leida ? 'bg-voltech-cyan/5' : ''}`}>
                    <div className="flex items-start gap-2">
                      <button onClick={() => handleClic(notificacion)} className="flex-1 min-w-0 text-left flex items-start gap-2">
                        <div className="p-2 rounded-lg bg-voltech-dark shrink-0">{getIcono(notificacion.tipo)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <h4 className="text-xs font-bold text-white break-words leading-snug">{notificacion.titulo}</h4>
                            {!notificacion.leida && (
                              <span className="shrink-0 text-[9px] px-1.5 py-0.5 bg-voltech-cyan text-white rounded">Nueva</span>
                            )}
                          </div>
                          <p className="text-[11px] text-voltech-muted break-words">{notificacion.mensaje}</p>
                          <p className="text-[10px] text-voltech-muted/70 mt-1">{new Date(notificacion.created_at || notificacion.hora).toLocaleString('es-VE')}</p>
                        </div>
                      </button>
                      <button onClick={() => eliminarNotificacion(notificacion.id)} className="p-1.5 rounded-lg hover:bg-voltech-error/10 text-voltech-muted hover:text-voltech-error shrink-0" title="Eliminar notificación">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-voltech-border shrink-0">
              <button
                onClick={() => {
                  router.push('/panel/alertas');
                  setShowDropdown(false);
                }}
                className="w-full text-center text-xs text-voltech-cyan py-1"
              >
                Ver todas las notificaciones →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}