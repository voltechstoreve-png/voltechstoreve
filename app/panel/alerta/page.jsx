'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/app/context/PermissionsContext';
import { Bell, CreditCard, PlayCircle, Ticket, ChevronRight, AlertTriangle, BellRing } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function AlertasPage() {
  const router = useRouter();
  const { esAdmin, esSocio, usuarioActual } = usePermissions();
  const [soloMio, setSoloMio] = useState(false);
  const [ventasProductos, setVentasProductos] = useState([]);
  const [ventasStreaming, setVentasStreaming] = useState([]);
  const [cupones, setCupones] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
    // ✅ Por defecto: no-admin ve solo lo suyo
    if (!(esAdmin || esSocio)) setSoloMio(true);
  }, [esAdmin, esSocio]);

  useEffect(() => {
    const cargar = async () => {
      if (!supabase) return;
      const [{ data: vp }, { data: vs }, { data: cp }, { data: nt }] = await Promise.all([
        supabase.from('ventas').select('*'),
        supabase.from('ventas_streaming').select('*'),
        supabase.from('cupones').select('*'),
        supabase.from('notificaciones').select('*')
      ]);
      setVentasProductos(vp || []);
      setVentasStreaming(vs || []);
      setCupones(cp || []);
      setNotificaciones(nt || []);
    };
    cargar();
  }, []);

  const mio = (v) => !soloMio || (v.vendedor || '').toLowerCase() === (usuarioActual?.nombre || '').toLowerCase();

  const pendientesProductos = ventasProductos.filter(v => (v.estado === 'pendiente' || Number(v.montoPendiente) > 0) && mio(v));
  const pendientesStreaming = ventasStreaming.filter(v => (v.estado === 'pendiente' || Number(v.montoPendiente) > 0) && mio(v));
  const cuponesActivos = cupones.filter(c => c.estado === 'activo');
  const notisRecientes = [...(notificaciones || [])].reverse().slice(0, 10);

  const diasAtraso = (v) => (v.fechaPago && new Date(v.fechaPago) < new Date())
    ? Math.floor((new Date() - new Date(v.fechaPago)) / 86400000)
    : 0;

  const diasParaVencer = (c) => c.fecha_vencimiento
    ? Math.ceil((new Date(c.fecha_vencimiento) - new Date()) / 86400000)
    : null;

  const rutaNotificacion = (n) => {
    const t = (n.tipo || '').toLowerCase();
    if (t.includes('streaming')) return '/panel/ventas-streaming';
    if (t.includes('venta')) return '/panel/ventas-productos';
    if (t.includes('cupon')) return '/panel/marketing';
    if (t.includes('cliente')) return '/panel/clientes';
    if (t.includes('sorteo')) return '/panel/sorteos';
    return '/panel/dashboard';
  };

  const totalAlertas = pendientesProductos.length + pendientesStreaming.length + cuponesActivos.length + notisRecientes.length;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" toastOptions={{ style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' } }} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Bell className="w-6 h-6 text-voltech-cyan" /> Alertas</h1>
          <p className="text-sm text-voltech-muted mt-1">Pagos pendientes, cupones y notificaciones en un solo lugar</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer bg-voltech-surface border border-voltech-border rounded-lg px-3 py-2">
          <input type="checkbox" checked={soloMio} onChange={(e) => setSoloMio(e.target.checked)} className="w-4 h-4 rounded border-voltech-border bg-voltech-dark text-voltech-cyan" />
          <span className="text-xs text-voltech-muted">Solo lo mío</span>
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-error/20"><CreditCard className="w-5 h-5 text-voltech-error" /></div>
            <div><p className="text-xs text-voltech-muted">Pagos Productos</p><p className="text-xl font-bold text-white">{pendientesProductos.length}</p></div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-purple/20"><PlayCircle className="w-5 h-5 text-voltech-purple" /></div>
            <div><p className="text-xs text-voltech-muted">Pagos Streaming</p><p className="text-xl font-bold text-white">{pendientesStreaming.length}</p></div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-warning/20"><Ticket className="w-5 h-5 text-voltech-warning" /></div>
            <div><p className="text-xs text-voltech-muted">Cupones Activos</p><p className="text-xl font-bold text-white">{cuponesActivos.length}</p></div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-cyan/20"><BellRing className="w-5 h-5 text-voltech-cyan" /></div>
            <div><p className="text-xs text-voltech-muted">Notificaciones</p><p className="text-xl font-bold text-white">{notisRecientes.length}</p></div>
          </div>
        </div>
      </div>

      {/* ✅ PAGOS PENDIENTES PRODUCTOS */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-voltech-border flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-voltech-error" />
          <h3 className="text-sm font-bold text-white">Pagos Pendientes — Ventas Productos</h3>
        </div>
        {pendientesProductos.length === 0 ? (
          <p className="text-center text-sm text-voltech-muted py-8">🎉 No hay pagos pendientes</p>
        ) : (
          <div className="divide-y divide-voltech-border">
            {pendientesProductos.map(v => (
              <button key={v.id} onClick={() => router.push(`/panel/clientes?search=${encodeURIComponent(v.telefono || v.cliente)}`)} className="w-full flex items-center justify-between gap-3 p-4 hover:bg-voltech-border/30 transition-colors text-left">
                <div>
                  <p className="text-sm font-medium text-white">{v.cliente} <span className="text-xs text-voltech-muted">• {v.telefono}</span></p>
                  <p className="text-xs text-voltech-muted mt-1">Vendedor: {v.vendedor || 'N/A'} | Orden: {v.numeroOrden || 'N/A'}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="text-sm font-bold text-voltech-error">${Number(v.montoPendiente || 0).toFixed(2)}</p>
                    {diasAtraso(v) > 0 && <p className="text-[10px] text-voltech-warning flex items-center gap-1 justify-end"><AlertTriangle className="w-3 h-3" /> {diasAtraso(v)} días de atraso</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-voltech-muted" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ✅ PAGOS PENDIENTES STREAMING */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-voltech-border flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-voltech-purple" />
          <h3 className="text-sm font-bold text-white">Pagos Pendientes — Ventas Streaming</h3>
        </div>
        {pendientesStreaming.length === 0 ? (
          <p className="text-center text-sm text-voltech-muted py-8">🎉 No hay pagos pendientes</p>
        ) : (
          <div className="divide-y divide-voltech-border">
            {pendientesStreaming.map(v => (
              <button key={v.id} onClick={() => router.push('/panel/ventas-streaming')} className="w-full flex items-center justify-between gap-3 p-4 hover:bg-voltech-border/30 transition-colors text-left">
                <div>
                  <p className="text-sm font-medium text-white">{v.cliente || v.nombre} <span className="text-xs text-voltech-muted">• {v.telefono || ''}</span></p>
                  <p className="text-xs text-voltech-muted mt-1">Vendedor: {v.vendedor || 'N/A'} | {v.plataforma || v.servicio || 'Streaming'}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <p className="text-sm font-bold text-voltech-error">${Number(v.montoPendiente || v.total || 0).toFixed(2)}</p>
                  <ChevronRight className="w-4 h-4 text-voltech-muted" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ✅ CUPONES ACTIVOS */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-voltech-border flex items-center gap-2">
          <Ticket className="w-4 h-4 text-voltech-warning" />
          <h3 className="text-sm font-bold text-white">Cupones Activos</h3>
        </div>
        {cuponesActivos.length === 0 ? (
          <p className="text-center text-sm text-voltech-muted py-8">No hay cupones activos</p>
        ) : (
          <div className="divide-y divide-voltech-border">
            {cuponesActivos.map(c => (
              <button key={c.id} onClick={() => router.push('/panel/marketing')} className="w-full flex items-center justify-between gap-3 p-4 hover:bg-voltech-border/30 transition-colors text-left">
                <div>
                  <p className="text-sm font-medium text-voltech-cyan font-mono">{c.codigo}</p>
                  <p className="text-xs text-voltech-muted mt-1">Creado por: {c.creadoPor || c.registradoPor || 'Admin'}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    {diasParaVencer(c) !== null && (
                      <p className={`text-xs font-semibold ${diasParaVencer(c) <= 3 ? 'text-voltech-error' : 'text-voltech-warning'}`}>
                        {diasParaVencer(c) < 0 ? 'VENCIDO' : `Vence en ${diasParaVencer(c)} días`}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-voltech-muted" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ✅ NOTIFICACIONES */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-voltech-border flex items-center gap-2">
          <BellRing className="w-4 h-4 text-voltech-cyan" />
          <h3 className="text-sm font-bold text-white">Notificaciones Recientes</h3>
        </div>
        {notisRecientes.length === 0 ? (
          <p className="text-center text-sm text-voltech-muted py-8">Sin notificaciones</p>
        ) : (
          <div className="divide-y divide-voltech-border">
            {notisRecientes.map(n => (
              <button key={n.id} onClick={() => router.push(rutaNotificacion(n))} className="w-full flex items-center justify-between gap-3 p-4 hover:bg-voltech-border/30 transition-colors text-left">
                <div>
                  <p className="text-sm font-medium text-white">{n.titulo}</p>
                  <p className="text-xs text-voltech-muted mt-1">{n.mensaje}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-voltech-muted flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}