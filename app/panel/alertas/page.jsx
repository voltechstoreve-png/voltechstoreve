'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/app/context/PermissionsContext';
import { useNotificaciones } from '@/app/context/NotificationContext';
import { Bell, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, CheckCircle, Clock, AlertTriangle, XCircle, ExternalLink, X, Trash2 } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';
import toast, { Toaster } from 'react-hot-toast';

const CATEGORIAS = [
  { id: 'todas', label: 'Todas' },
  { id: 'sorteos', label: 'Sorteos' },
  { id: 'opiniones', label: 'Opiniones' },
  { id: 'ventas_productos', label: 'Ventas' },
  { id: 'ventas_streaming', label: 'Streaming' },
  { id: 'pagos_equipo', label: 'Pagos Equipo' },
  { id: 'metas_comisiones', label: 'Metas' },
  { id: 'cupones', label: 'Cupones' },
  { id: 'publicidad', label: 'Publicidad' },
  { id: 'aprobacion_equipo', label: 'Aprobaciones' },
  { id: 'modificacion_socio', label: 'Socios' },
  { id: 'sistema', label: 'Sistema' },
];

const RUTAS = {
  sorteos: '/panel/sorteos', opiniones: '/panel/opiniones', ventas_productos: '/panel/ventas-productos',
  ventas_streaming: '/panel/ventas-streaming', pagos_equipo: '/panel/finanzas/pagos-equipos',
  metas_comisiones: '/panel/metas-comisiones', cupones: '/panel/marketing', publicidad: '/panel/marketing',
  aprobacion_equipo: '/panel/equipo', modificacion_socio: '/panel/equipo', sistema: '/panel/dashboard',
};

const CATEGORIAS_VENDEDOR = ['ventas_productos', 'ventas_streaming', 'pagos_equipo', 'metas_comisiones', 'cupones', 'sorteos', 'opiniones', 'publicidad', 'sistema'];
const CATEGORIAS_SOCIO = CATEGORIAS.map(c => c.id).filter(id => id !== 'todas' && id !== 'aprobacion_equipo');

const aISO = (d) => { const dt = new Date(d); return isNaN(dt) ? null : dt.toISOString().slice(0, 10); };
const hoyISO = () => new Date().toISOString().slice(0, 10);
const diasPara = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);

export default function AlertasPage() {
  const router = useRouter();
  const { esAdmin, esSocio, esVendedor, usuarioActual } = usePermissions();
  const { notificaciones, marcarLeida } = useNotificaciones();

  const [alertas, setAlertas] = useState([]);
  const [notisDB, setNotisDB] = useState([]);
  const [catActiva, setCatActiva] = useState('todas');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [fechaSel, setFechaSel] = useState(null);
  const [mesActual, setMesActual] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      if (!supabase) return;
      const [rSorteos, rOpiniones, rVentas, rStreaming, rCupones, rPublicidad, rUsuarios, rMovimientos, rComisiones, rMetas, rBonos, rCuentas, rPagosEq, rPagos, rNotis] = await Promise.all([
        supabase.from('sorteos').select('*'),
        supabase.from('opiniones').select('*'),
        supabase.from('ventas').select('*'),
        supabase.from('ventas_streaming').select('*'),
        supabase.from('cupones').select('*'),
        supabase.from('publicidad').select('*'),
        supabase.from('usuarios').select('*'),
        supabase.from('movimientos_equipo').select('*'),
        supabase.from('comisiones_pendientes').select('*'),
        supabase.from('metas_ventas').select('*'),
        supabase.from('bonos_alcanzados').select('*'),
        supabase.from('cuentas_streaming').select('*'),
        supabase.from('pagos_equipo').select('*'),
        supabase.from('pagos').select('*'),
        supabase.from('notificaciones').select('*'),
      ]);
      const out = [];
      const push = (a) => out.push({ estado: 'pendiente', metadata: {}, ...a });

      (rSorteos.data || []).forEach(s => {
        if (s.fecha_fin) push({ id: `sorteo-fin-${s.id}`, category: 'sorteos', title: `Sorteo: ${s.titulo || s.id}`, description: `Finaliza el ${aISO(s.fecha_fin)}`, date: aISO(s.fecha_fin), status: new Date(s.fecha_fin) < new Date() ? 'expirado' : 'pendiente', metadata: { id: s.id } });
        if (s.ganador || s.estado === 'finalizado') push({ id: `sorteo-gan-${s.id}`, category: 'sorteos', title: `Ganador seleccionado: ${s.ganador || s.titulo}`, description: 'Revisa la entrega del premio', date: aISO(s.fecha_fin || s.fecha_inicio), status: 'requiere_accion', metadata: { id: s.id } });
      });

      (rOpiniones.data || []).filter(o => o.estado === 'pendiente').forEach(o => {
        push({ id: `opinion-${o.id}`, category: 'opiniones', title: `Nueva opinión de ${o.nombre}`, description: (o.comentario || '').slice(0, 80), date: aISO(o.fecha || o.created_at), status: 'requiere_accion', metadata: { id: o.id } });
      });

      (rVentas.data || []).forEach(v => {
        if (v.estado === 'pendiente' || Number(v.montoPendiente) > 0) push({ id: `venta-pend-${v.id}`, category: 'ventas_productos', title: `Pago pendiente: ${v.cliente}`, description: `$${Number(v.montoPendiente || v.total || 0).toFixed(2)} • Orden ${v.numeroOrden || ''}`, date: aISO(v.fechaPago || v.fecha), status: 'requiere_accion', metadata: { vendedor: v.vendedor, telefono: v.telefono, monto: v.montoPendiente || v.total, id: v.id } });
        else if (aISO(v.fecha) === hoyISO()) push({ id: `venta-hoy-${v.id}`, category: 'ventas_productos', title: `Nueva venta: ${v.cliente}`, description: `$${Number(v.total || 0).toFixed(2)} • ${v.vendedor}`, date: aISO(v.fecha), status: 'completado', metadata: { vendedor: v.vendedor, id: v.id } });
      });

      (rStreaming.data || []).forEach(v => {
        if (v.estado === 'pendiente' || Number(v.montoPendiente) > 0) push({ id: `stream-pend-${v.id}`, category: 'ventas_streaming', title: `Pago pendiente streaming: ${v.cliente || v.nombre}`, description: `$${Number(v.montoPendiente || v.total || 0).toFixed(2)}`, date: aISO(v.fechaPago || v.fecha), status: 'requiere_accion', metadata: { vendedor: v.vendedor, id: v.id } });
      });
      (rCuentas.data || []).forEach(c => {
        const fv = c.fecha_vencimiento || c.fechaFin;
        if (!fv) return;
        const d = diasPara(fv);
        if (d < 0) push({ id: `cuenta-exp-${c.id}`, category: 'ventas_streaming', title: `Cuenta vencida: ${c.plataforma || c.nombre}`, description: 'Requiere renovación o baja', date: aISO(fv), status: 'expirado', metadata: { id: c.id } });
        else if (d <= 7) push({ id: `cuenta-vence-${c.id}`, category: 'ventas_streaming', title: `Renovación próxima: ${c.plataforma || c.nombre}`, description: `Vence en ${d} día(s)`, date: aISO(fv), status: 'requiere_accion', metadata: { id: c.id } });
      });

      (rMovimientos.data || []).filter(m => m.estado === 'pendiente').forEach(m => {
        push({ id: `pago-${m.id}`, category: 'pagos_equipo', title: `Pago pendiente a ${m.vendedor || m.nombre}`, description: `$${Number(m.monto || m.total || 0).toFixed(2)}`, date: aISO(m.fecha || m.created_at), status: 'requiere_accion', metadata: { vendedor: m.vendedor || m.nombre, monto: m.monto || m.total, id: m.id } });
      });
      (rComisiones.data || []).forEach(c => {
        push({ id: `comision-${c.id}`, category: 'pagos_equipo', title: `Comisión generada: ${c.vendedor || c.nombre}`, description: `$${Number(c.monto || c.comision || 0).toFixed(2)}`, date: aISO(c.fecha || c.created_at), status: 'pendiente', metadata: { vendedor: c.vendedor || c.nombre, monto: c.monto || c.comision, id: c.id } });
      });
      // ✅ Pagos al equipo desde tablas reales
      [...(rPagosEq.data || []), ...(rPagos.data || [])].forEach(m => {
        if (m.estado === 'pendiente' || m.estado === 'por_pagar') push({ id: `pagoeq-${m.id}`, category: 'pagos_equipo', title: `Pago pendiente a ${m.vendedor || m.nombre}`, description: `$${Number(m.monto || m.total || 0).toFixed(2)} • ${m.concepto || 'Comisión'}`, date: aISO(m.fecha || m.created_at), status: 'requiere_accion', metadata: { vendedor: m.vendedor || m.nombre, monto: m.monto || m.total, id: m.id } });
      });

      (rBonos.data || []).filter(b => b.estado !== 'pagado').forEach(b => {
        push({ id: `bono-${b.id}`, category: 'metas_comisiones', title: `Meta alcanzada: ${b.vendedor || b.nombre}`, description: 'Aprobar e incluir en pagos', date: aISO(b.fecha || b.created_at), status: 'requiere_accion', metadata: { vendedor: b.vendedor || b.nombre, id: b.id } });
      });
      (rMetas.data || []).forEach(m => {
        if (m.fecha_corte) push({ id: `meta-corte-${m.id}`, category: 'metas_comisiones', title: `Corte de período: ${m.nombre || m.titulo}`, description: 'Cierre de comisiones', date: aISO(m.fecha_corte), status: 'pendiente', metadata: { id: m.id } });
      });

      (rCupones.data || []).forEach(c => {
        if (c.estado !== 'activo') return;
        if (c.limite_usos === 'limitado' && (c.usos || 0) >= (c.max_usos || 0)) push({ id: `cupon-lim-${c.id}`, category: 'cupones', title: `Cupón ${c.codigo}: límite alcanzado`, description: `${c.usos}/${c.max_usos} usos`, date: hoyISO(), status: 'completado', metadata: { id: c.id } });
        else if (c.fecha_vencimiento) {
          const d = diasPara(c.fecha_vencimiento);
          if (d < 0) push({ id: `cupon-exp-${c.id}`, category: 'cupones', title: `Cupón ${c.codigo} VENCIDO`, description: 'Desactívalo o renuévalo', date: aISO(c.fecha_vencimiento), status: 'expirado', metadata: { id: c.id } });
          else if (d <= 7) push({ id: `cupon-vence-${c.id}`, category: 'cupones', title: `Cupón ${c.codigo} por vencer`, description: `Vence en ${d} día(s)`, date: aISO(c.fecha_vencimiento), status: 'requiere_accion', metadata: { id: c.id } });
        }
      });

      (rPublicidad.data || []).filter(p => p.estado === 'activo' && p.fecha_fin).forEach(p => {
        const d = diasPara(p.fecha_fin);
        push({ id: `pub-${p.id}`, category: 'publicidad', title: `Campaña por vencer: ${p.titulo}`, description: d < 0 ? 'Vencida' : `Vence en ${d} día(s)`, date: aISO(p.fecha_fin), status: d < 0 ? 'expirado' : 'requiere_accion', metadata: { id: p.id } });
      });

      (rUsuarios.data || []).filter(u => u.activo === false || u.estado === 'pendiente').forEach(u => {
        push({ id: `apro-${u.id}`, category: 'aprobacion_equipo', title: `Solicitud de acceso: ${u.nombre}`, description: `Rol solicitado: ${u.rol || 'vendedor'}`, date: aISO(u.fechaRegistro || u.created_at), status: 'requiere_accion', metadata: { userId: u.id, rolSugerido: u.rol || 'vendedor' } });
      });

      // ✅ Notificaciones desde la BD (misma fuente que la campana → sync real)
      (rNotis.data || []).forEach(n => {
        const cat = n.categoria || ((n.tipo === 'modificacion_socio') ? 'modificacion_socio' : (['solicitud_pago','pago_completado','cobro_solicitado'].includes(n.tipo) ? 'pagos_equipo' : 'sistema'));
        push({ id: `noti-${n.id}`, category: cat, title: n.titulo, description: n.mensaje || n.detalle || '', date: aISO(n.fecha || n.created_at), status: n.leida ? 'completado' : 'pendiente', metadata: { notiId: n.id, miembro: n.miembro } });
      });
      setNotisDB(rNotis.data || []);

      try {
        const descartadas = JSON.parse(localStorage.getItem('voltech_alertas_descartadas') || '[]');
        setAlertas(out.filter(a => !descartadas.includes(a.id)));
      } catch (e) { setAlertas(out); }
    };
    cargar();
    window.addEventListener('voltech-data-updated', cargar);
    return () => window.removeEventListener('voltech-data-updated', cargar);
  }, [notificaciones]);

  const alertasVisibles = useMemo(() => {
    let lista = alertas;
    if (esVendedor && !esAdmin && !esSocio) {
      const miNombre = (usuarioActual?.nombre || '').toLowerCase();
      const miId = usuarioActual?.id;
      lista = lista.filter(a => {
        const v = (a.metadata?.vendedor || '').toLowerCase();
        if (v) return v === miNombre;                                   // MIS ventas / comisiones
        if (a.metadata?.miembro && a.metadata.miembro.toLowerCase() === miNombre) return true;  // MIS solicitudes/pagos
        if (a.metadata?.usuarioId === miId || a.metadata?.usuario_id === miId) return true;     // notificaciones PARA MÍ
        return false;                                                    // oculta publicidad, sistema, etc.
      });
    } else if (esSocio && !esAdmin) {
      lista = lista.filter(a => CATEGORIAS_SOCIO.includes(a.category));
    }
    return lista;
  }, [alertas, esAdmin, esSocio, esVendedor, usuarioActual]);

  const filtradas = useMemo(() => {
    return alertasVisibles.filter(a => {
      if (catActiva !== 'todas' && a.category !== catActiva) return false;
      if (estadoFiltro && a.status !== estadoFiltro) return false;
      if (fechaSel && a.date !== fechaSel) return false;
      if (busqueda && !(`${a.title} ${a.description}`.toLowerCase().includes(busqueda.toLowerCase()))) return false;
      return true;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [alertasVisibles, catActiva, estadoFiltro, fechaSel, busqueda]);

  const requierenAccion = alertasVisibles.filter(a => a.status === 'requiere_accion').length;
  const eventosHoy = alertasVisibles.filter(a => a.date === hoyISO()).length;
  const noLeidas = (notisDB.length ? notisDB : (notificaciones || [])).filter(n => !n.leida).length;

  const eventosPorFecha = useMemo(() => {
    const map = {};
    alertasVisibles.forEach(a => { if (a.date) (map[a.date] = map[a.date] || []).push(a); });
    return map;
  }, [alertasVisibles]);

  const celdasMes = useMemo(() => {
    const primero = mesActual;
    const inicioSemana = new Date(primero);
    inicioSemana.setDate(primero.getDate() - ((primero.getDay() + 1) % 7));
    const celdas = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(inicioSemana);
      d.setDate(inicioSemana.getDate() + i);
      celdas.push(d);
    }
    return celdas;
  }, [mesActual]);

  const cambiarMes = (delta) => setMesActual(m => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  const aprobarMiembro = async (alerta) => {
    const { error } = await supabase.from('usuarios').update({ activo: true }).eq('id', alerta.metadata.userId);
    if (!error) {
      toast.success(`✅ ${alerta.title} aprobado`);
      setAlertas(prev => prev.map(a => a.id === alerta.id ? { ...a, status: 'completado' } : a));
    } else toast.error('Error al aprobar');
  };

  // ✅ Marca leída en BD + contexto + campana
  const marcarLeidaAlerta = async (alerta) => {
    if (alerta.metadata?.notiId) {
      if (supabase) await supabase.from('notificaciones').update({ leida: true }).eq('id', alerta.metadata.notiId);
      if (marcarLeida) marcarLeida(alerta.metadata.notiId);
    }
    setAlertas(prev => prev.map(a => a.id === alerta.id ? { ...a, status: 'completado' } : a));
    window.dispatchEvent(new Event('voltech-data-updated'));
  };

  // ✅ Elimina de la BD → desaparece también de la campana
  const eliminarNotificacion = async (alerta) => {
    if (alerta.metadata?.notiId && supabase) await supabase.from('notificaciones').delete().eq('id', alerta.metadata.notiId);
    setAlertas(prev => prev.filter(a => a.id !== alerta.id));
    window.dispatchEvent(new Event('voltech-data-updated'));
    toast.success('Notificación eliminada en todo el sistema');
  };

  // ✅ Limpia TODAS las notificaciones vistas/aprobadas (BD + oculta completadas)
  const limpiarVistas = async () => {
    if (supabase) await supabase.from('notificaciones').delete().eq('leida', true);
    const arr = JSON.parse(localStorage.getItem('voltech_alertas_descartadas') || '[]');
    alertas.filter(a => a.status === 'completado').forEach(a => { if (!arr.includes(a.id)) arr.push(a.id); });
    localStorage.setItem('voltech_alertas_descartadas', JSON.stringify(arr));
    setAlertas(prev => prev.filter(a => a.status !== 'completado'));
    window.dispatchEvent(new Event('voltech-data-updated'));
    toast.success('Notificaciones vistas eliminadas');
  };

  // ✅ Elimina UNA alerta individual (de la BD si es notificación, o la oculta persistente)
  const descartarAlerta = async (alerta) => {
    if (alerta.metadata?.notiId && supabase) await supabase.from('notificaciones').delete().eq('id', alerta.metadata.notiId);
    const arr = JSON.parse(localStorage.getItem('voltech_alertas_descartadas') || '[]');
    if (!arr.includes(alerta.id)) arr.push(alerta.id);
    localStorage.setItem('voltech_alertas_descartadas', JSON.stringify(arr));
    setAlertas(prev => prev.filter(a => a.id !== alerta.id));
    window.dispatchEvent(new Event('voltech-data-updated'));
    toast.success('Alerta eliminada');
  };

  const badgeEstado = (status) => {
    if (status === 'requiere_accion') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Requiere Acción</span>;
    if (status === 'pendiente') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Pendiente</span>;
    if (status === 'expirado') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">Expirado</span>;
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">Notificación</span>;
  };

  const accionRapida = (a) => {
    if (a.category === 'aprobacion_equipo' && a.status === 'requiere_accion') return <button onClick={(e) => { e.stopPropagation(); aprobarMiembro(a); }} className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700">Aprobar Miembro</button>;
    if (a.category === 'sistema' || a.category === 'modificacion_socio') return (
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); marcarLeidaAlerta(a); }} className="text-xs px-2 py-1 rounded bg-slate-600 text-white hover:bg-slate-700">Marcar Leído</button>
        <button onClick={(e) => { e.stopPropagation(); eliminarNotificacion(a); }} className="text-xs px-2 py-1 rounded bg-red-600/60 text-white hover:bg-red-600" title="Eliminar"><Trash2 className="w-3 h-3" /></button>
      </div>
    );
    return <button onClick={(e) => { e.stopPropagation(); router.push(RUTAS[a.category] + (a.metadata?.miembro ? `?miembro=${encodeURIComponent(a.metadata.miembro)}` : '')); }} className="text-xs px-2 py-1 rounded bg-voltech-cyan/20 text-voltech-cyan hover:bg-voltech-cyan/30 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Ver</button>;
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" toastOptions={{ style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' } }} />

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Bell className="w-6 h-6 text-voltech-cyan" /> Pulse Center — Alertas & Agenda</h1>
        <p className="text-sm text-voltech-muted mt-1">Todo lo que pasa en tu tienda, en un solo lugar</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4"><p className="text-xs text-voltech-muted">Total Alertas</p><p className="text-xl font-bold text-white">{alertasVisibles.length}</p></div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4"><p className="text-xs text-voltech-muted">Requieren Acción</p><p className="text-xl font-bold text-red-400">{requierenAccion}</p></div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4"><p className="text-xs text-voltech-muted">Eventos de Hoy</p><p className="text-xl font-bold text-voltech-cyan">{eventosHoy}</p></div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4"><p className="text-xs text-voltech-muted">No Leídas</p><p className="text-xl font-bold text-yellow-400">{noLeidas}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => cambiarMes(-1)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><ChevronLeft className="w-4 h-4" /></button>
            <h3 className="text-sm font-bold text-white capitalize flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-voltech-cyan" /> {mesActual.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })}</h3>
            <button onClick={() => cambiarMes(1)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-voltech-muted mb-1">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="font-bold">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {celdasMes.map((d, i) => {
              const iso = aISO(d);
              const enMes = d.getMonth() === mesActual.getMonth();
              const eventos = eventosPorFecha[iso] || [];
              const esHoy = iso === hoyISO();
              const sel = fechaSel === iso;
              return (
                <button key={i} onClick={() => setFechaSel(sel ? null : iso)}
                  className={`min-h-[52px] rounded-lg border p-1 text-left transition-colors ${sel ? 'border-voltech-cyan bg-voltech-cyan/10' : 'border-voltech-border'} ${enMes ? 'bg-voltech-dark/50' : 'opacity-40'} ${esHoy ? 'ring-1 ring-voltech-cyan' : ''} hover:border-voltech-cyan`}>
                  <p className={`text-[10px] font-bold ${esHoy ? 'text-voltech-cyan' : 'text-white'}`}>{d.getDate()}</p>
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {eventos.slice(0, 3).map(ev => (
                      <span key={ev.id} className={`w-1.5 h-1.5 rounded-full ${ev.status === 'requiere_accion' ? 'bg-red-400' : ev.status === 'expirado' ? 'bg-slate-400' : 'bg-green-400'}`} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
          {fechaSel && <p className="text-xs text-voltech-cyan mt-2">📅 Filtrando por {fechaSel} — <button className="underline" onClick={() => setFechaSel(null)}>quitar filtro</button></p>}
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full mb-3">
              <div className="relative w-full flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-voltech-muted" />
                <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar alerta..." className="w-full pl-10 pr-3 py-2 bg-voltech-dark border border-voltech-border rounded-lg text-xs sm:text-sm text-white" />
              </div>
              <CustomSelect
                value={estadoFiltro}
                onChange={setEstadoFiltro}
                options={[
                  { value: '', label: 'Todos los estados' },
                  { value: 'requiere_accion', label: 'Requiere Acción' },
                  { value: 'pendiente', label: 'Pendiente' },
                  { value: 'completado', label: 'Completado' },
                  { value: 'expirado', label: 'Expirado' }
                ]}
                placeholder="Estado"
                className="w-full sm:w-auto"
              />
            </div>
            <div className="flex items-center gap-2 w-full">
              <CustomSelect
                value={catActiva}
                onChange={setCatActiva}
                options={CATEGORIAS.map(c => ({ value: c.id, label: c.label }))}
                placeholder="Categoría"
                className="flex-1"
              />
              <button
                onClick={limpiarVistas}
                className="shrink-0 text-xs py-2 px-3 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors flex items-center gap-1.5"
                title="Eliminar todas las notificaciones vistas/aprobadas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpiar vistas</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filtradas.length === 0 ? (
              <div className="text-center py-12 text-voltech-muted">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No hay alertas en esta categoría</p>
                <p className="text-xs mt-1">Todo al día por aquí 🎉</p>
              </div>
            ) : (
              filtradas.map(a => (
                <div key={a.id} onClick={() => setDetalle(a)} className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-3 hover:border-voltech-cyan/50 cursor-pointer transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{a.title}</p>
                      <p className="text-xs text-voltech-muted mt-0.5 line-clamp-2">{a.description}</p>
                      <p className="text-[10px] text-voltech-muted mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {a.date || 'Sin fecha'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {badgeEstado(a.status)}
                      <div className="flex items-center gap-1">
                        {accionRapida(a)}
                        <button onClick={(e) => { e.stopPropagation(); descartarAlerta(a); }} className="text-xs px-2 py-1 rounded bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/40 transition-colors" title="Eliminar alerta">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {detalle && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setDetalle(null)}>
          <div className="bg-voltech-surface border border-voltech-border rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold text-white pr-4">{detalle.title}</h3>
              <button onClick={() => setDetalle(null)} className="p-1 rounded hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-3">{badgeEstado(detalle.status)}</div>
            <p className="text-sm text-voltech-muted mb-3">{detalle.description}</p>
            {/* ✅ Detalle legible (adiós JSON crudo) */}
            <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-3 mb-4 text-xs space-y-1">
              {detalle.metadata?.vendedor && <p><span className="text-voltech-muted">👤 Vendedor: </span><span className="text-white">{detalle.metadata.vendedor}</span></p>}
              {detalle.metadata?.telefono && <p><span className="text-voltech-muted">📞 Teléfono: </span><span className="text-white">{detalle.metadata.telefono}</span></p>}
              {detalle.metadata?.monto && <p><span className="text-voltech-muted">💵 Monto: </span><span className="text-voltech-success">${Number(detalle.metadata.monto).toFixed(2)}</span></p>}
              {detalle.metadata?.rolSugerido && <p><span className="text-voltech-muted">🎖 Rol solicitado: </span><span className="text-white">{detalle.metadata.rolSugerido}</span></p>}
              <p><span className="text-voltech-muted">🏷 Categoría: </span><span className="text-white">{CATEGORIAS.find(c => c.id === detalle.category)?.label}</span></p>
              <p><span className="text-voltech-muted">📅 Fecha: </span><span className="text-white">{detalle.date || 'N/A'}</span></p>
            </div>
            <div className="flex gap-2">
              {accionRapida(detalle)}
              <button onClick={() => { descartarAlerta(detalle); setDetalle(null); }} className="text-sm px-3 py-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/40 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>
              <button onClick={() => { router.push(RUTAS[detalle.category] + (detalle.metadata?.miembro ? `?miembro=${encodeURIComponent(detalle.metadata.miembro)}` : '')); setDetalle(null); }} className="flex-1 text-sm px-3 py-2 rounded-lg bg-voltech-purple/20 text-voltech-purple hover:bg-voltech-purple/30">Ir al módulo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}