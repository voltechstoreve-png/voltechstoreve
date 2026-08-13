'use client';

import { useState } from 'react';
import { 
  Bell, CheckCircle, Users, Gift, Trophy, ShoppingCart, AlertTriangle, 
  Trash2, X, MonitorPlay, RefreshCw, Link as LinkIcon, Clock, Ticket, Megaphone 
} from 'lucide-react';
import { useNotificaciones } from '@/app/context/NotificationContext';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const [showDropdown, setShowDropdown] = useState(false);
  const { notificaciones, marcarLeida, marcarTodasLeidas, eliminarNotificacion, limpiarTodas } = useNotificaciones();
  const router = useRouter();

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
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
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
        <div className="fixed left-4 right-4 top-16 w-auto max-h-[80vh] overflow-y-auto sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 sm:max-h-none sm:overflow-visible bg-voltech-surface border border-voltech-border rounded-xl shadow-2xl z-50">
          <div className="p-4 border-b border-voltech-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Notificaciones</h3>
              <button
                onClick={() => setShowDropdown(false)}
                className="p-1 rounded hover:bg-voltech-border text-voltech-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={marcarTodasLeidas}
                className="text-xs text-voltech-cyan hover:text-voltech-cyan/70 flex items-center gap-1"
              >
                <CheckCircle className="w-3 h-3" /> Marcar todas leídas
              </button>
              <button
                onClick={limpiarTodas}
                className="text-xs text-voltech-error hover:text-voltech-error/70 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Vaciar
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {ultimas.length === 0 ? (
              <p className="text-center text-voltech-muted py-8 text-sm">No hay notificaciones</p>
            ) : (
              ultimas.map((notificacion, idx) => (
                <div
                  key={notificacion.id || idx}
                  className={`p-4 border-b border-voltech-border hover:bg-voltech-dark/30 transition-colors ${
                    !notificacion.leida ? 'bg-voltech-cyan/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleClic(notificacion)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-voltech-dark">
                          {getIcono(notificacion.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-bold text-white truncate">
                              {notificacion.titulo}
                            </h4>
                            {!notificacion.leida && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-voltech-cyan text-white rounded ml-2">
                                Nueva
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-voltech-muted line-clamp-2">
                            {notificacion.mensaje}
                          </p>
                          <p className="text-[10px] text-voltech-muted mt-1">
                            {new Date(notificacion.created_at || notificacion.hora).toLocaleString('es-VE')}
                          </p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => eliminarNotificacion(notificacion.id)}
                      className="p-1 rounded hover:bg-voltech-error/10 text-voltech-muted hover:text-voltech-error transition-colors"
                      title="Eliminar notificación"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-voltech-border">
            <button
              onClick={() => {
                router.push('/panel/alertas');
                setShowDropdown(false);
              }}
              className="w-full text-center text-xs text-voltech-cyan hover:text-voltech-cyan/70"
            >
              Ver todas las notificaciones →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}