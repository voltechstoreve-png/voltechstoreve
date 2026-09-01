'use client';

import { useState, useEffect, Fragment } from 'react';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/app/context/PermissionsContext';
import { useNotificaciones } from '@/app/context/NotificationContext';
import { 
  DollarSign, TrendingUp, TrendingDown, Wallet, Plus, X, Save, Search,
  Calendar, CreditCard, Users, FileText, Trash2, Edit3, ArrowUpRight, 
  ArrowDownRight, Calculator, CheckCircle, Clock, Download, MessageCircle,
  ChevronDown, ChevronUp, Briefcase, PieChart, Printer, Send, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from '@/components/CustomSelect';
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PagosEquiposPage() {
  const { usuarioActual, esAdmin, esSocio } = usePermissions();
  const { agregarNotificacion } = useNotificaciones();
  const puedeGestionar = esAdmin || esSocio;
  
  // Estados Principales
  const [activeTab, setActiveTab] = useState('pagos'); // 'pagos' | 'inversiones'
  const [movimientos, setMovimientos] = useState([]);
  const [equipo, setEquipo] = useState([]);
  const [carteras, setCarteras] = useState([]);
  const [comisionesPendientes, setComisionesPendientes] = useState([]);
  const [ventas, setVentas] = useState([]);
  
  // Estados UI
  const [showForm, setShowForm] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedMiembro, setSelectedMiembro] = useState(null);
  const [miembroExpandido, setMiembroExpandido] = useState(null);
  const [verSoloMi, setVerSoloMi] = useState(false);
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroPendiente, setFiltroPendiente] = useState('todos');
  const [filtroNombreEquipo, setFiltroNombreEquipo] = useState('');
  const [solicitudes, setSolicitudes] = useState([]);
  const [equipoColapsado, setEquipoColapsado] = useState(false);
  const [metasGlobales, setMetasGlobales] = useState([]);
  const [metodosPago, setMetodosPago] = useState([
    { id: 'efectivo', nombre: 'Efectivo' },
    { id: 'pago_movil', nombre: 'Pago Móvil' },
    { id: 'transferencia', nombre: 'Transferencia' },
    { id: 'zelle', nombre: 'Zelle' },
    { id: 'binance', nombre: 'Binance' },
  ]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroMiembro, setFiltroMiembro] = useState('todos');

  // ✅ NUEVO: Cuentas / Caja (lo que entra y sale de cada cuenta)
  const [movCuentas, setMovCuentas] = useState([]);
  const [movGlobales, setMovGlobales] = useState([]);
  const [showFormCuenta, setShowFormCuenta] = useState(false);
  const [formCuenta, setFormCuenta] = useState({ tipo: 'entrada', cuentaOrigen: '', cuentaDestino: '', montoBs: '', montoUsd: '', monedaOrigen: 'USD', monedaDestino: 'USDT', tasa: 36.5, nota: '' });
  const [cuentasInternas, setCuentasInternas] = useState([]);
  const [nuevaCuentaInterna, setNuevaCuentaInterna] = useState('');

  useEffect(() => {
    const cargarCuentas = async () => {
      let mc = [], vts = [], vst = [], movs = [], prods = [], pubs = [];
      if (supabase) {
        const [a, b, c, d, e, f] = await Promise.all([
          supabase.from('movimientos_cuentas').select('*'),
          supabase.from('ventas').select('*'),
          supabase.from('ventas_streaming').select('*'),
          supabase.from('movimientos_equipo').select('*'),
          supabase.from('productos').select('*'),
          supabase.from('publicidad').select('*'),
        ]);
        mc = a.data || []; vts = b.data || []; vst = c.data || []; movs = d.data || []; prods = e.data || []; pubs = f.data || [];
      } else {
        mc = JSON.parse(localStorage.getItem('voltech_movimientos_cuentas') || '[]');
        vts = JSON.parse(localStorage.getItem('voltech_ventas') || '[]');
        vst = JSON.parse(localStorage.getItem('voltech_ventas_streaming') || '[]');
        movs = JSON.parse(localStorage.getItem('voltech_movimientos_equipo') || '[]');
        prods = JSON.parse(localStorage.getItem('voltech_productos') || '[]');
        pubs = JSON.parse(localStorage.getItem('voltech_publicidad') || '[]');
      }
      const list = [];
      vts.forEach(v => list.push({ id: 'vp-' + v.id, fecha: v.fecha, tipo: 'entrada', fuente: 'Venta Producto', concepto: (v.numeroOrden || '') + ' ' + (v.cliente || ''), cuenta: v.carteraId || v.metodoPago || 'sin cuenta', monto: Number(v.total || 0) }));
      vst.forEach(v => list.push({ id: 'vs-' + v.id, fecha: v.fecha, tipo: 'entrada', fuente: 'Venta Streaming', concepto: (v.numeroOrden || '') + ' ' + (v.cliente || ''), cuenta: v.cartera || v.metodoPago || 'sin cuenta', monto: Number(v.total || 0) }));
      movs.filter(m => m.tipo === 'pago').forEach(m => list.push({ id: 'pg-' + m.id, fecha: m.fecha, tipo: 'salida', fuente: 'Pago Equipo', concepto: 'Pago a ' + (m.miembroNombre || ''), cuenta: m.carteraId || m.metodoPago || 'sin cuenta', monto: Number(m.monto || 0) }));
      movs.filter(m => m.tipo === 'inversion').forEach(m => list.push({ id: 'inv-' + m.id, fecha: m.fecha, tipo: (m.subtipo === 'inyeccion' || !m.subtipo) ? 'entrada' : 'salida', fuente: 'Inversión', concepto: m.miembroNombre || '', cuenta: m.carteraId || 'sin cuenta', monto: Number(m.monto || 0) }));
      prods.forEach(p => (p.historial || []).forEach((h, i) => list.push({ id: 'com-' + p.id + '-' + i, fecha: h.fecha, tipo: 'salida', fuente: 'Compra', concepto: 'Compra ' + (p.plataforma || p.producto || ''), cuenta: h.cartera || h.metodoPago || 'sin cuenta', monto: Number(h.precioTotal || 0) })));
      pubs.forEach(p => list.push({ id: 'pub-' + p.id, fecha: p.fecha_inicio, tipo: 'entrada', fuente: 'Publicidad', concepto: (p.titulo || '') + (p.estado_pago === 'pagado' ? ' (Pagado)' : ' (Por cobrar)'), cuenta: p.estado_pago === 'pagado' ? (p.cuenta_pago || 'efectivo') : 'por cobrar', monto: (p.clicks || 0) * (p.costo_por_click || 0) }));
      mc.forEach(m => list.push({ id: 'mc-' + m.id, fecha: m.fecha, tipo: m.tipo, fuente: 'Manual', concepto: m.nota || m.tipo, cuenta: m.cuentaOrigen, cuentaOrigen: m.cuentaOrigen, cuentaDestino: m.cuentaDestino, montoDestino: m.montoDestino, monto: Number(m.monto || 0) }));
      list.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
      setMovCuentas(mc);
      setMovGlobales(list);
    };
    cargarCuentas();
    const handleAct = () => cargarCuentas();
    window.addEventListener('voltech-data-updated', handleAct);
    return () => window.removeEventListener('voltech-data-updated', handleAct);
  }, []);

  // ✅ Cargar cuentas internas propias (creadas en esta página)
  useEffect(() => {
    try { setCuentasInternas(JSON.parse(localStorage.getItem('voltech_cuentas_internas') || '[]')); } catch { setCuentasInternas([]); }
  }, []);

  const saldoCartera = (nombre) => {
    let saldo = 0;
    movGlobales.forEach(m => {
      if (m.tipo === 'transferencia') {
        if (m.cuentaOrigen === nombre) saldo -= Number(m.monto);
        if (m.cuentaDestino === nombre) saldo += Number(m.montoDestino || m.monto);
      } else if (m.cuenta === nombre) {
        saldo += (m.tipo === 'entrada' ? Number(m.monto) : -Number(m.monto));
      }
    });
    return saldo;
  };

  // ✅ Cuentas disponibles = Carteras de Ajustes + cuentas internas propias
  const todasCuentas = [...new Set([...carteras.map(c => c.nombre), ...cuentasInternas])];

  const agregarCuentaInterna = () => {
    const nombre = (nuevaCuentaInterna || '').trim();
    if (!nombre) { toast.error('Escribe el nombre de la cuenta'); return; }
    if (todasCuentas.some(c => c.toLowerCase() === nombre.toLowerCase())) { toast.error('Esa cuenta ya existe'); return; }
    const nuevas = [...cuentasInternas, nombre];
    setCuentasInternas(nuevas);
    localStorage.setItem('voltech_cuentas_internas', JSON.stringify(nuevas));
    setNuevaCuentaInterna('');
    toast.success(`Cuenta "${nombre}" creada`);
    window.dispatchEvent(new Event('voltech-data-updated'));
  };

  const eliminarCuentaInterna = (nombre) => {
    if (!confirm(`¿Eliminar la cuenta "${nombre}"?`)) return;
    const nuevas = cuentasInternas.filter(c => c !== nombre);
    setCuentasInternas(nuevas);
    localStorage.setItem('voltech_cuentas_internas', JSON.stringify(nuevas));
    toast.success(`Cuenta "${nombre}" eliminada`);
    window.dispatchEvent(new Event('voltech-data-updated'));
  };

  const setMontoBs = (v) => setFormCuenta(prev => ({ ...prev, montoBs: v, montoUsd: (Number(v || 0) / Number(prev.tasa || 36.5)).toFixed(2) }));
  const setMontoUsd = (v) => setFormCuenta(prev => ({ ...prev, montoUsd: v, montoBs: (Number(v || 0) * Number(prev.tasa || 36.5)).toFixed(2) }));
  const setTasaBs = (v) => setFormCuenta(prev => ({ ...prev, tasa: v, montoBs: prev.montoUsd ? (Number(prev.montoUsd) * Number(v || 36.5)).toFixed(2) : prev.montoBs }));

  const registrarMovCuenta = async () => {
    const montoBs = Number(formCuenta.montoBs) || 0;
    const montoUsd = Number(formCuenta.montoUsd) || 0;
    const montoOrigen = formCuenta.monedaOrigen === 'BS' ? montoBs : montoUsd;
    const montoDestino = formCuenta.monedaDestino === 'BS' ? montoBs : montoUsd;
    const monto = formCuenta.tipo === 'entrada' ? montoDestino : montoOrigen;
    if (!monto || monto <= 0) { toast.error('Ingresa un monto válido'); return; }
    if (formCuenta.tipo !== 'entrada' && !formCuenta.cuentaOrigen) { toast.error('Selecciona la cuenta de origen'); return; }
    if (formCuenta.tipo !== 'salida' && !formCuenta.cuentaDestino) { toast.error('Selecciona la cuenta de destino'); return; }
    const mov = { id: Date.now().toString(), fecha: new Date().toISOString().split('T')[0], ...formCuenta, monto, montoDestino, usuario: usuarioActual?.nombre || 'Admin', creado_en: new Date().toISOString() };
    if (supabase) await supabase.from('movimientos_cuentas').upsert(mov, { onConflict: 'id' });
    const nuevos = [mov, ...movCuentas];
    setMovCuentas(nuevos);
    localStorage.setItem('voltech_movimientos_cuentas', JSON.stringify(nuevos));
    toast.success('Movimiento registrado');
    setShowFormCuenta(false);
    setFormCuenta({ tipo: 'entrada', cuentaOrigen: '', cuentaDestino: '', montoBs: '', montoUsd: '', monedaOrigen: 'USD', monedaDestino: 'USDT', tasa: 36.5, nota: '' });
    window.dispatchEvent(new Event('voltech-data-updated'));
  };

  // Formulario
  const [formData, setFormData] = useState({
    tipo: 'pago',
    subtipo: 'inyeccion', // inyeccion | retorno | rendimiento
    miembroId: '',
    miembroNombre: '',
    monto: '',
    porcentajeRetorno: 10,
    fecha: new Date().toISOString().split('T')[0],
    fechaVencimiento: '',
    periodo: new Date().toISOString().slice(0, 7),
    descripcion: '',
    metodoPago: 'efectivo',
    carteraId: '',
    estado: 'pagado',
    estadoInversion: 'activa', // activa | rendimiento_pagado | liquidada
    capitalAsociadoId: null,
  });

  // Selección de comisiones para pagar
  const [selectedComisiones, setSelectedComisiones] = useState([]);

  useEffect(() => {
  const cargarDatos = async () => {
    let movs = [], eqp = [], crt = [], coms = [], vts = [];
    
    try {
      if (supabase) {
        console.log('🔄 Cargando Finanzas desde Supabase...');
        const [{ data: d1, error: e1 }, { data: d2 }, { data: d3 }, { data: d4 }, { data: d5 }, { data: d6 }] = await Promise.all([
          supabase.from('movimientos_equipo').select('*').order('fecharegistro', { ascending: false }),
          supabase.from('usuarios').select('id, nombre, rol, activo, telefono').eq('activo', true),
          supabase.from('settings').select('clave, valor').in('clave', ['carteras', 'metodos_pago', 'metas_comisiones']),
          supabase.from('comisiones_pendientes').select('*').order('fecha_venta', { ascending: false }),
          supabase.from('ventas').select('*'),
          supabase.from('ventas_streaming').select('*')
        ]);
        
        if (e1) {
          console.warn('️ Error Supabase:', e1.message);
          movs = JSON.parse(localStorage.getItem('voltech_movimientos_equipo') || '[]');
          eqp = JSON.parse(localStorage.getItem('voltech_equipo') || '[]').filter(m => m.activo);
          crt = JSON.parse(localStorage.getItem('voltech_carteras') || '[]');
          coms = JSON.parse(localStorage.getItem('voltech_comisiones_pendientes') || '[]');
          vts = JSON.parse(localStorage.getItem('voltech_ventas') || '[]');
        } else {
          movs = d1 || [];
          eqp = d2 || [];
          const settingsList = d3 || [];
          const normLista = (val) => {
            if (Array.isArray(val)) return val.filter(x => x && x.activo !== false && x.activa !== false).map(x => ({ id: x.id || String(x.nombre).toLowerCase().replace(/\s+/g, '_'), nombre: x.nombre }));
            if (val && typeof val === 'object') return Object.entries(val).filter(([k, v]) => v && v.activo !== false).map(([k, v]) => ({ id: k, nombre: v?.nombre || k }));
            return [];
          };
          const metasVal = settingsList.find(s => s.clave === 'metas_comisiones')?.valor;
          if (metasVal && metasVal.metas) setMetasGlobales(metasVal.metas);
          const cartNorm = normLista(settingsList.find(s => s.clave === 'carteras')?.valor);
          if (cartNorm.length) crt = cartNorm;
          const mpNorm = normLista(settingsList.find(s => s.clave === 'metodos_pago')?.valor || settingsList.find(s => s.clave === 'pagos')?.valor);
          if (mpNorm.length) setMetodosPago(mpNorm);
          coms = d4 || [];
          vts = [...(d5 || []), ...(d6 || [])];
          console.log('✅ Finanzas cargadas desde Supabase');
        }
      } else {
        movs = JSON.parse(localStorage.getItem('voltech_movimientos_equipo') || '[]');
        eqp = JSON.parse(localStorage.getItem('voltech_equipo') || '[]').filter(m => m.activo);
        crt = JSON.parse(localStorage.getItem('voltech_carteras') || '[]');
        const mpLocal = localStorage.getItem('voltech_metodos_pago');
        if (mpLocal) try { setMetodosPago(JSON.parse(mpLocal)); } catch {}
        coms = JSON.parse(localStorage.getItem('voltech_comisiones_pendientes') || '[]');
        vts = JSON.parse(localStorage.getItem('voltech_ventas') || '[]');
      }

      setMovimientos(movs);
      setEquipo(eqp);
      setCarteras(crt);
      setComisionesPendientes(coms);
      setVentas(vts);
      try {
        let sols = JSON.parse(localStorage.getItem('voltech_solicitudes_pago') || '[]');
        if (supabase) {
          const { data } = await supabase.from('solicitudes_pago').select('*');
          if (data && data.length) {
            const map = {};
            [...data, ...sols].forEach(s => { map[s.id] = s; });
            sols = Object.values(map);
          }
        }
        setSolicitudes(sols);
      } catch {}
    } catch (error) {
      console.error('Error cargando finanzas:', error);
    }
  };
  
  cargarDatos();

  const handleActualizacion = () => cargarDatos();
  window.addEventListener('voltech-data-updated', handleActualizacion);

  return () => {
    window.removeEventListener('voltech-data-updated', handleActualizacion);
  };
}, []);

useEffect(() => {
  const m = new URLSearchParams(window.location.search).get('miembro');
  if (m) setFiltroNombreEquipo(m);
}, []);

  // Cálculos para las tarjetas
  const totalInvertido = movimientos.filter(m => m.tipo === 'inversion').reduce((acc, m) => acc + Number(m.monto), 0);
  const totalRetornos = movimientos.filter(m => m.tipo === 'inversion').reduce((acc, m) => acc + (Number(m.monto) * (Number(m.porcentajeRetorno) || 0) / 100), 0);
  const totalPagado = movimientos.filter(m => m.tipo === 'pago').reduce((acc, m) => acc + Number(m.monto), 0);
  const totalPendienteComisiones = comisionesPendientes.filter(c => c.estado === 'pendiente').reduce((acc, c) => acc + Number(c.monto_comision), 0);
  const balance = totalInvertido - totalPagado;

  // KPIs financieros de inversiones
  const inversionesActivas = movimientos.filter(m => m.tipo === 'inversion' && (m.subtipo === 'inyeccion' || !m.subtipo) && (m.estadoInversion !== 'liquidada'));
  const totalInvertidoActivo = inversionesActivas.reduce((s, m) => s + Number(m.monto), 0);
  const rendimientosPorPagar = inversionesActivas
    .filter(m => m.estadoInversion !== 'rendimiento_pagado')
    .reduce((s, m) => s + (Number(m.monto) * (Number(m.porcentajeRetorno) || 0) / 100), 0);
  const totalRetornado = movimientos
    .filter(m => m.tipo === 'inversion' && (m.subtipo === 'retorno' || m.subtipo === 'rendimiento'))
    .reduce((s, m) => s + Number(m.monto), 0);

  const registrarMovimientoInv = async (mov) => {
    if (supabase) {
      const { error } = await supabase.from('movimientos_equipo').upsert(mov, { onConflict: 'id' });
      if (error) { toast.error('Error: ' + error.message); return false; }
    }
    setMovimientos(prev => [mov, ...prev]);
    localStorage.setItem('voltech_movimientos_equipo', JSON.stringify([mov, ...movimientos]));
    window.dispatchEvent(new Event('voltech-data-updated'));
    return true;
  };

  const actualizarEstadoInversion = async (id, nuevoEstado) => {
    if (supabase) {
      await supabase.from('movimientos_equipo').update({ estadoInversion: nuevoEstado }).eq('id', id);
    }
    setMovimientos(prev => prev.map(m => m.id === id ? { ...m, estadoInversion: nuevoEstado } : m));
    const movsAct = movimientos.map(m => m.id === id ? { ...m, estadoInversion: nuevoEstado } : m);
    localStorage.setItem('voltech_movimientos_equipo', JSON.stringify(movsAct));
    window.dispatchEvent(new Event('voltech-data-updated'));
  };

  const pagarRendimiento = async (inv) => {
    const rendimiento = Number(inv.monto) * (Number(inv.porcentajeRetorno) || 0) / 100;
    const confirmado = confirm(`¿Confirmas el pago de rendimiento de $${rendimiento.toFixed(2)} a ${inv.miembroNombre}? (El capital de $${Number(inv.monto).toFixed(2)} sigue activo)`);
    if (!confirmado) return;
    const mov = {
      id: Date.now().toString(), tipo: 'inversion', subtipo: 'rendimiento',
      miembroId: inv.miembroId, miembroNombre: inv.miembroNombre,
      monto: rendimiento, fecha: new Date().toISOString().split('T')[0],
      periodo: new Date().toISOString().slice(0, 7),
      descripcion: `Pago de rendimiento (${inv.porcentajeRetorno}%) de inversión`,
      metodoPago: 'efectivo', carteraId: '', estado: 'pagado',
      porcentajeRetorno: 0, estadoInversion: null, capitalAsociadoId: inv.id,
      registradoPor: usuarioActual?.nombre || 'Sistema', fechaRegistro: new Date().toISOString(),
    };
    const ok = await registrarMovimientoInv(mov);
    if (ok) {
      await actualizarEstadoInversion(inv.id, 'rendimiento_pagado');
      if (agregarNotificacion) agregarNotificacion({ tipo: 'rendimiento_pagado', titulo: '💰 Rendimiento pagado', mensaje: `Se pagó $${rendimiento.toFixed(2)} de rendimiento a ${inv.miembroNombre}`, detalle: `Capital: $${Number(inv.monto).toFixed(2)} activo`, usuario_id: inv.miembroId });
      toast.success(`Rendimiento de $${rendimiento.toFixed(2)} pagado. Capital sigue activo.`);
    }
  };

  const liquidarInversion = async (inv) => {
    const capital = Number(inv.monto);
    const rendimiento = capital * (Number(inv.porcentajeRetorno) || 0) / 100;
    const total = capital + rendimiento;
    const confirmado = confirm(`¿Confirmas LIQUIDAR la inversión de ${inv.miembroNombre}?\n\n• Capital: $${capital.toFixed(2)}\n• Rendimiento (${inv.porcentajeRetorno}%): $${rendimiento.toFixed(2)}\n• TOTAL A PAGAR: $${total.toFixed(2)}\n\nLa inversión pasará a estado "Liquidada".`);
    if (!confirmado) return;
    const mov = {
      id: Date.now().toString(), tipo: 'inversion', subtipo: 'retorno',
      miembroId: inv.miembroId, miembroNombre: inv.miembroNombre,
      monto: total, fecha: new Date().toISOString().split('T')[0],
      periodo: new Date().toISOString().slice(0, 7),
      descripcion: `Liquidación: Capital $${capital.toFixed(2)} + Rendimiento $${rendimiento.toFixed(2)}`,
      metodoPago: 'efectivo', carteraId: '', estado: 'pagado',
      porcentajeRetorno: 0, estadoInversion: null, capitalAsociadoId: inv.id,
      registradoPor: usuarioActual?.nombre || 'Sistema', fechaRegistro: new Date().toISOString(),
    };
    const ok = await registrarMovimientoInv(mov);
    if (ok) {
      await actualizarEstadoInversion(inv.id, 'liquidada');
      if (agregarNotificacion) agregarNotificacion({ tipo: 'inversion_liquidada', titulo: '🏁 Inversión liquidada', mensaje: `Se devolvió $${total.toFixed(2)} a ${inv.miembroNombre}`, detalle: `Capital $${capital.toFixed(2)} + Rendimiento $${rendimiento.toFixed(2)}`, usuario_id: inv.miembroId });
      toast.success(`Inversión liquidada. Total devuelto: $${total.toFixed(2)}`);
    }
  };

  // Helper: calcular % de comisión de un miembro según sus ventas del mes
  const pctMiembro = (nombre) => {
    const mes = new Date().toISOString().slice(0, 7);
    const count = ventas.filter(v => v.vendedor === nombre && (v.fechaRegistro || v.fecha || '').startsWith(mes)).length;
    const orden = [...metasGlobales].sort((a, b) => a.ventas - b.ventas);
    const proxima = orden.find(m => m.ventas > count) || orden[orden.length - 1];
    return proxima?.porcentaje || 0;
  };

  // Calcular estadísticas de un miembro (usa ventas REALES, no comisiones_pendientes)
  const getMiembroStats = (miembroId) => {
    const nombre = equipo.find(e => e.id === miembroId)?.nombre;
    const pagadasIds = new Set(comisionesPendientes.filter(c => c.estado === 'pagada').map(c => c.venta_id));
    const ventasMiembro = ventas.filter(v => v.vendedor === nombre);
    const ventasPagadas = ventasMiembro.filter(v => pagadasIds.has(v.id));
    const ventasPendientes = ventasMiembro.filter(v => !pagadasIds.has(v.id));
    const comDe = (v) => Number(v.comision ?? (Number(v.total || 0) * (Number(v.porcentajeComision ?? pctMiembro(nombre)) || 0) / 100));
    return {
      totalVentas: ventasMiembro.length,
      totalPagadas: ventasPagadas.length,
      totalPendientes: ventasPendientes.length,
      montoTotalVentas: ventasMiembro.reduce((s, v) => s + Number(v.total || 0), 0),
      montoTotalComisiones: ventasMiembro.reduce((s, v) => s + comDe(v), 0),
      montoPagado: ventasPagadas.reduce((s, v) => s + comDe(v), 0),
      montoPendiente: ventasPendientes.reduce((s, v) => s + comDe(v), 0),
      porcentajePromedio: ventasMiembro.length ? (ventasMiembro.reduce((s, v) => s + (Number(v.porcentajeComision ?? pctMiembro(nombre)) || 0), 0) / ventasMiembro.length).toFixed(1) : 0,
    };
  };

  const marcarSolicitudesPagadas = (miembroNombre) => {
    const act = solicitudes.map(s => s.miembro_nombre === miembroNombre && s.estado === 'pendiente' ? { ...s, estado: 'pagada' } : s);
    setSolicitudes(act);
    localStorage.setItem('voltech_solicitudes_pago', JSON.stringify(act));
  };

  const pagarSeleccionadas = async (miembro) => {
    if (selectedComisiones.length === 0) {
      toast.error('Selecciona al menos una venta a pagar');
      return;
    }
    const total = selectedComisiones.reduce((s, c) => s + Number(c.monto_comision), 0);
    const confirmado = confirm(`¿Confirmas el pago de ${selectedComisiones.length} venta(s) por un total de $${total.toFixed(2)} a ${miembro.nombre}?`);
    if (!confirmado) return;

    const nuevoMovimiento = {
      id: Date.now().toString(),
      tipo: 'pago',
      miembroId: miembro.id,
      miembroNombre: miembro.nombre,
      monto: total,
      fecha: new Date().toISOString().split('T')[0],
      periodo: new Date().toISOString().slice(0, 7),
      descripcion: `Pago de ${selectedComisiones.length} venta(s)`,
      metodoPago: formData.metodoPago,
      carteraId: formData.carteraId,
      estado: 'pagado',
      registradoPor: usuarioActual?.nombre || 'Sistema',
      fechaRegistro: new Date().toISOString(),
    };

    if (supabase) {
      const { error } = await supabase.from('movimientos_equipo').upsert(nuevoMovimiento, { onConflict: 'id' });
      if (error) { toast.error('Error: ' + error.message); return; }
    }
    setMovimientos([nuevoMovimiento, ...movimientos]);
    localStorage.setItem('voltech_movimientos_equipo', JSON.stringify([nuevoMovimiento, ...movimientos]));

    const nuevasComisiones = selectedComisiones.filter(sc => sc._venta).map(sc => ({
      id: Date.now().toString() + Math.random().toString(16).slice(2),
      venta_id: sc.venta_id,
      venta_numero_orden: sc.venta_numero_orden,
      miembro_id: miembro.id,
      miembro_nombre: miembro.nombre,
      producto_nombre: sc.producto_nombre,
      monto_venta: sc.monto_venta,
      porcentaje_comision: sc.porcentaje_comision,
      monto_comision: sc.monto_comision,
      fecha_venta: sc.fecha_venta,
      estado: 'pagada',
      movimiento_pago_id: nuevoMovimiento.id,
      fecha_pago: nuevoMovimiento.fecha,
      tipo: 'comision_venta',
    }));
    const comisionesActualizadas = [...comisionesPendientes, ...nuevasComisiones];
    setComisionesPendientes(comisionesActualizadas);
    localStorage.setItem('voltech_comisiones_pendientes', JSON.stringify(comisionesActualizadas));
    if (supabase) {
      if (nuevasComisiones.length) await supabase.from('comisiones_pendientes').insert(nuevasComisiones);
    }

    if (agregarNotificacion) {
      agregarNotificacion({
        tipo: 'pago_completado', categoria: 'pagos_equipos', titulo: '💰 Pago recibido',
        mensaje: `Se pagó $${total.toFixed(2)} por ${selectedComisiones.length} venta(s)`,
        detalle: miembro.nombre, usuario_id: miembro.id, miembro: miembro.nombre,
        enlace: '/panel/finanzas/pagos-equipos',
      });
    }

    marcarSolicitudesPagadas(miembro.nombre);
    toast.success(`Pago de $${total.toFixed(2)} registrado`);
    setSelectedComisiones([]);
    setMiembroExpandido(null);
    window.dispatchEvent(new Event('voltech-data-updated'));
  };

  const toggleComision = (comision) => {
    const exists = selectedComisiones.find(c => c.id === comision.id);
    if (exists) {
      setSelectedComisiones(selectedComisiones.filter(c => c.id !== comision.id));
    } else {
      setSelectedComisiones([...selectedComisiones, comision]);
    }
  };

  useEffect(() => {
    if (formData.tipo === 'pago' && selectedComisiones.length > 0) {
      const total = selectedComisiones.reduce((sum, c) => sum + Number(c.monto_comision), 0);
      setFormData(prev => ({ ...prev, monto: total.toFixed(2) }));
    }
  }, [selectedComisiones, formData.tipo]);

  const handleSave = async () => {
    if (!formData.miembroId || !formData.monto || Number(formData.monto) <= 0) {
      toast.error('Selecciona un miembro y un monto válido');
      return;
    }

    const miembro = equipo.find(e => e.id === formData.miembroId);
    const nuevoMovimiento = {
      id: editingId || Date.now().toString(),
      tipo: formData.tipo,
      subtipo: formData.tipo === 'inversion' ? formData.subtipo : 'pago',
      miembroId: formData.miembroId,
      miembroNombre: miembro?.nombre || 'Desconocido',
      monto: Number(formData.monto),
      fecha: formData.fecha,
      fechaVencimiento: formData.fechaVencimiento || null,
      periodo: formData.periodo,
      descripcion: formData.descripcion,
      metodoPago: formData.metodoPago,
      carteraId: formData.carteraId,
      estado: formData.estado,
      porcentajeRetorno: Number(formData.porcentajeRetorno) || 0,
      estadoInversion: formData.tipo === 'inversion' ? formData.estadoInversion : null,
      capitalAsociadoId: formData.capitalAsociadoId,
      registradoPor: usuarioActual?.nombre || 'Sistema',
      fechaRegistro: new Date().toISOString(),
    };

    if (supabase) {
      const { error } = await supabase.from('movimientos_equipo').upsert(nuevoMovimiento, { onConflict: 'id' });
      if (error) { toast.error('Error al guardar movimiento: ' + error.message); return; }
    }
    
    const movsActualizados = editingId 
      ? movimientos.map(m => m.id === editingId ? nuevoMovimiento : m)
      : [nuevoMovimiento, ...movimientos];
    setMovimientos(movsActualizados);
    localStorage.setItem('voltech_movimientos_equipo', JSON.stringify(movsActualizados));

    if (formData.tipo === 'pago' && selectedComisiones.length > 0) {
      const nuevas = selectedComisiones.filter(sc => sc._venta).map(sc => ({
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        venta_id: sc.venta_id, venta_numero_orden: sc.venta_numero_orden,
        miembro_id: formData.miembroId, miembro_nombre: formData.miembroNombre,
        producto_nombre: sc.producto_nombre, monto_venta: sc.monto_venta,
        porcentaje_comision: sc.porcentaje_comision, monto_comision: sc.monto_comision,
        fecha_venta: sc.fecha_venta, estado: 'pagada', movimiento_pago_id: nuevoMovimiento.id,
        fecha_pago: formData.fecha, tipo: 'comision_venta',
      }));
      const existentes = selectedComisiones.filter(sc => !sc._venta);
      const comisionesActualizadas = [...comisionesPendientes, ...nuevas].map(c =>
        existentes.find(sc => sc.id === c.id) ? { ...c, estado: 'pagada', movimiento_pago_id: nuevoMovimiento.id, fecha_pago: formData.fecha } : c
      );
      setComisionesPendientes(comisionesActualizadas);
      localStorage.setItem('voltech_comisiones_pendientes', JSON.stringify(comisionesActualizadas));
      if (supabase) {
        if (nuevas.length) await supabase.from('comisiones_pendientes').insert(nuevas);
        if (existentes.length) await supabase.from('comisiones_pendientes').update({ estado: 'pagada', movimiento_pago_id: nuevoMovimiento.id, fecha_pago: formData.fecha }).in('id', existentes.map(c => c.id));
      }
    }

    if (formData.tipo === 'pago') {
      marcarSolicitudesPagadas(formData.miembroNombre);
      if (agregarNotificacion) {
        agregarNotificacion({
          tipo: 'pago_completado', categoria: 'pagos_equipo', titulo: '💰 Pago recibido',
          mensaje: `Se pagó $${Number(formData.monto).toFixed(2)} a ${formData.miembroNombre}`,
          detalle: formData.descripcion || 'Pago de comisiones', usuario_id: formData.miembroId, miembro: formData.miembroNombre,
          enlace: '/panel/finanzas/pagos-equipos',
        });
      }
    }
    toast.success(editingId ? 'Movimiento actualizado' : 'Pago registrado exitosamente');
    resetForm();
    // ✅ SINCRONIZACIÓN: Avisar a otros paneles si es necesario
    window.dispatchEvent(new Event('voltech-data-updated'));
  };

  const handleEdit = (movimiento) => {
    setEditingId(movimiento.id);
    setFormData({
      tipo: movimiento.tipo,
      subtipo: movimiento.subtipo || (movimiento.tipo === 'inversion' ? 'inyeccion' : 'pago'),
      miembroId: movimiento.miembroId,
      miembroNombre: movimiento.miembroNombre,
      monto: movimiento.monto.toString(),
      porcentajeRetorno: movimiento.porcentajeRetorno || 10,
      fecha: movimiento.fecha,
      fechaVencimiento: movimiento.fechaVencimiento || '',
      periodo: movimiento.periodo,
      descripcion: movimiento.descripcion || '',
      metodoPago: movimiento.metodoPago,
      carteraId: movimiento.carteraId,
      estado: movimiento.estado,
      estadoInversion: movimiento.estadoInversion || 'activa',
      capitalAsociadoId: movimiento.capitalAsociadoId || null,
    });
    setShowForm(true);
  };

  const handleDelete = async (movimiento) => {
    if (!confirm('¿Estás seguro de eliminar este movimiento?')) return;
    
    if (supabase) {
      await supabase.from('movimientos_equipo').delete().eq('id', movimiento.id);
    }
    
    const movsActualizados = movimientos.filter(m => m.id !== movimiento.id);
    setMovimientos(movsActualizados);
    localStorage.setItem('voltech_movimientos_equipo', JSON.stringify(movsActualizados));
    
    if (movimiento.tipo === 'pago') {
      const comisionesActualizadas = comisionesPendientes.map(c => {
        if (c.movimiento_pago_id === movimiento.id) {
          return { ...c, estado: 'pendiente', movimiento_pago_id: null, fecha_pago: null };
        }
        return c;
      });
      setComisionesPendientes(comisionesActualizadas);
      localStorage.setItem('voltech_comisiones_pendientes', JSON.stringify(comisionesActualizadas));
      
      if (supabase) {
        await supabase.from('comisiones_pendientes').update({ 
          estado: 'pendiente', 
          movimiento_pago_id: null, 
          fecha_pago: null 
        }).eq('movimiento_pago_id', movimiento.id);
      }
    }
    
    toast.success('Movimiento eliminado');
    window.dispatchEvent(new Event('voltech-data-updated'));
  };

  const generarReciboPDF = (movimiento) => {
    const detalles = getDetallesMovimiento(movimiento.id);
    const miembro = equipo.find(e => e.id === movimiento.miembroId);
    
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("RECIBO DE PAGO", 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("VOLTECH STORE", 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    let y = 45;
    
    doc.text(`N° Recibo: ${movimiento.id.slice(-8).toUpperCase()}`, 14, y);
    doc.text(`Fecha: ${new Date(movimiento.fecha).toLocaleDateString('es-VE')}`, 140, y);
    
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("INFORMACIÓN DEL BENEFICIARIO:", 14, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    doc.text(`Nombre: ${movimiento.miembroNombre}`, 14, y);
    doc.text(`Teléfono: ${miembro?.telefono || 'N/A'}`, 14, y + 5);
    doc.text(`Rol: ${miembro?.rol || 'N/A'}`, 14, y + 10);
    
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.text("DETALLE DEL PAGO:", 14, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    doc.text(`Monto Total: $${Number(movimiento.monto).toFixed(2)}`, 14, y);
    doc.text(`Método de Pago: ${(movimiento.metodoPago || 'efectivo').replace('_', ' ').toUpperCase()}`, 14, y + 5);
    doc.text(`Cartera: ${movimiento.carteraId || 'No especificada'}`, 14, y + 10);
    doc.text(`Período: ${movimiento.periodo}`, 14, y + 15);
    
    if (detalles.length > 0) {
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.text("VENTAS PAGADAS:", 14, y);
      y += 6;
      
      const tableData = detalles.map(d => [
        d.venta_numero_orden,
        d.fecha_venta,
        d.producto_nombre,
        `$${Number(d.monto_venta).toFixed(2)}`,
        `${d.porcentaje_comision}%`,
        `$${Number(d.monto_comision).toFixed(2)}`
      ]);
      
      autoTable(doc, {
        startY: y,
        head: [['N° Orden', 'Fecha', 'Producto', 'Monto Venta', '%', 'Comisión']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 30, 46], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 60 },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 30, halign: 'right' }
        }
      });
      
      y = doc.lastAutoTable.finalY + 10;
    }
    
    if (movimiento.descripcion) {
      doc.text(`Observaciones: ${movimiento.descripcion}`, 14, y);
      y += 10;
    }
    
    y += 20;
    doc.setFont("helvetica", "italic");
    doc.text("_______________________________", 14, y);
    doc.text("_______________________________", 120, y);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Firma del Beneficiario", 14, y + 5);
    doc.text("Firma del Administrador", 120, y + 5);
    
    doc.text(`Generado el ${new Date().toLocaleString('es-VE')}`, 105, 280, { align: 'center' });
    
    doc.save(`Recibo_${movimiento.miembroNombre}_${movimiento.fecha}.pdf`);
    toast.success('Recibo PDF generado correctamente');
  };

  const notificarWhatsApp = (movimiento) => {
    const miembro = equipo.find(e => e.id === movimiento.miembroId);
    const telefono = miembro?.telefono?.replace(/\D/g, '') || '';
    
    if (!telefono) {
      toast.error('El miembro no tiene número de teléfono registrado');
      return;
    }
    
    const detalles = getDetallesMovimiento(movimiento.id);
    let mensaje = `¡Hola ${movimiento.miembroNombre}! \n\n`;
    mensaje += `*VOLTECH STORE* - Comprobante de Pago\n\n`;
    mensaje += `📅 Fecha: ${new Date(movimiento.fecha).toLocaleDateString('es-VE')}\n`;
    mensaje += `💰 *Monto Total: $${Number(movimiento.monto).toFixed(2)}*\n`;
    mensaje += `💳 Método: ${(movimiento.metodoPago || 'efectivo').replace('_', ' ').toUpperCase()}\n`;
    
    if (detalles.length > 0) {
      mensaje += `\n📦 *Ventas Pagadas:* ${detalles.length}\n`;
      detalles.forEach((d, i) => {
        mensaje += `${i + 1}. ${d.producto_nombre} - $${Number(d.monto_comision).toFixed(2)}\n`;
      });
    }
    
    mensaje += `\n¡Gracias por tu excelente trabajo! `;
    
    const url = `https://wa.me/58${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp abierto para enviar notificación');
  };

  const resetForm = () => {
    setFormData({
      tipo: activeTab === 'inversiones' ? 'inversion' : 'pago',
      subtipo: 'inyeccion',
      miembroId: '', miembroNombre: '', monto: '', porcentajeRetorno: 10,
      fecha: new Date().toISOString().split('T')[0],
      fechaVencimiento: '',
      periodo: new Date().toISOString().slice(0, 7),
      descripcion: '', metodoPago: 'efectivo', carteraId: '', estado: 'pagado',
      estadoInversion: 'activa', capitalAsociadoId: null,
    });
    setSelectedComisiones([]);
    setShowForm(false);
    setEditingId(null);
  };

  const miembroForm = equipo.find(e => e.id === formData.miembroId);
  const ventasPagadasIds = new Set(comisionesPendientes.filter(c => c.estado === 'pagada').map(c => c.venta_id));
  const comisionesDelMiembro = ventas
    .filter(v => v.vendedor === miembroForm?.nombre && !ventasPagadasIds.has(v.id))
    .map(v => ({
      id: 'v-' + v.id,
      venta_id: v.id,
      venta_numero_orden: v.numeroOrden || String(v.id).slice(-6),
      producto_nombre: (v.productos || []).map(p => p.producto || p.nombre).join(', ') || (v.plataformas || []).map(p => p.plataforma).join(', ') || 'Venta',
      fecha_venta: v.fecha || (v.fechaRegistro || '').split('T')[0],
      monto_venta: Number(v.total || 0),
      porcentaje_comision: Number(v.porcentajeComision ?? (pctMiembro(miembroForm?.nombre) || 0)),
      monto_comision: Number(v.comision ?? (Number(v.total || 0) * (Number(v.porcentajeComision ?? pctMiembro(miembroForm?.nombre)) || 0) / 100)),
      estado: 'pendiente',
      _venta: v,
    }));

  const equipoFiltrado = equipo.filter(e => {
    if (verSoloMi && e.nombre !== usuarioActual?.nombre) return false;
    if (filtroRol !== 'todos' && (e.rol || '').toLowerCase() !== filtroRol) return false;
    if (filtroNombreEquipo && !e.nombre.toLowerCase().includes(filtroNombreEquipo.toLowerCase())) return false;
    const st = getMiembroStats(e.id);
    const solPend = solicitudes.some(s => s.miembro_nombre === e.nombre && s.estado === 'pendiente');
    if (filtroPendiente === 'pendiente' && st.montoPendiente <= 0) return false;
    if (filtroPendiente === 'solicitado' && !solPend) return false;
    return true;
  });

  const movimientosFiltrados = movimientos.filter(m => {
    const matchSearch = m.miembroNombre.toLowerCase().includes(searchTerm.toLowerCase()) || m.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMiembro = filtroMiembro === 'todos' || m.miembroId === filtroMiembro;
    const matchTipo = activeTab === 'pagos' ? m.tipo === 'pago' : m.tipo === 'inversion';
    return matchSearch && matchMiembro && matchTipo;
  });

  const getDetallesMovimiento = (movId) => {
    return comisionesPendientes.filter(c => c.movimiento_pago_id === movId);
  };

  const depurarPagos = async () => {
    const limite = new Date(); limite.setDate(limite.getDate() - 30);
    const antiguos = movimientos.filter(m => m.tipo === 'pago' && new Date(m.fecha) < limite);
    if (!antiguos.length) { toast.error('No hay pagos mayores a 30 días para depurar'); return; }
    if (!confirm(`¿Eliminar ${antiguos.length} pago(s) mayores a 30 días? Esta acción no se puede deshacer.`)) return;
    const ids = antiguos.map(m => m.id);
    if (supabase) await supabase.from('movimientos_equipo').delete().in('id', ids);
    const restantes = movimientos.filter(m => !ids.includes(m.id));
    setMovimientos(restantes);
    localStorage.setItem('voltech_movimientos_equipo', JSON.stringify(restantes));
    toast.success(`${ids.length} pago(s) depurados`);
    window.dispatchEvent(new Event('voltech-data-updated'));
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Finanzas del Equipo</h1>
          <p className="text-sm text-voltech-muted mt-1">Gestiona pagos a vendedores e inversiones de socios</p>
        </div>
        <div className="flex gap-3 items-center">
          {puedeGestionar && (
            <button
              onClick={() => setVerSoloMi(!verSoloMi)}
              className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors ${verSoloMi ? 'bg-voltech-purple/20 text-voltech-purple border border-voltech-purple/30' : 'bg-voltech-surface border border-voltech-border text-voltech-muted hover:text-white'}`}
            >
              {verSoloMi ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {verSoloMi ? 'Ver lo mío' : 'Ver todo'}
            </button>
          )}
          {activeTab === 'inversiones' && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="px-4 py-2 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva Inversión
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-voltech-border">
        <div className="grid grid-cols-2 md:flex md:gap-6 w-full gap-y-2 pb-2 md:pb-1">
          <button 
            onClick={() => setActiveTab('pagos')}
            className={`justify-center md:justify-start py-2.5 md:py-0 md:pb-3 flex items-center gap-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap rounded-lg md:rounded-none border-b-2 ${activeTab === 'pagos' ? 'text-voltech-cyan bg-voltech-cyan/10 border-transparent md:bg-transparent md:border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'}`}
          >
            <Briefcase className="w-4 h-4" /> Pagos a Vendedores
          </button>
          <button 
            onClick={() => setActiveTab('inversiones')}
            className={`justify-center md:justify-start py-2.5 md:py-0 md:pb-3 flex items-center gap-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap rounded-lg md:rounded-none border-b-2 ${activeTab === 'inversiones' ? 'text-voltech-success bg-voltech-success/10 border-transparent md:bg-transparent md:border-voltech-success' : 'text-voltech-muted border-transparent hover:text-white'}`}
          >
            <TrendingUp className="w-4 h-4" /> Inversiones Socios
          </button>
          <button 
            onClick={() => setActiveTab('cuentas')}
            className={`justify-center md:justify-start py-2.5 md:py-0 md:pb-3 flex items-center gap-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap rounded-lg md:rounded-none border-b-2 ${activeTab === 'cuentas' ? 'text-voltech-cyan bg-voltech-cyan/10 border-transparent md:bg-transparent md:border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'}`}
          >
            <Wallet className="w-4 h-4" /> Cuentas / Caja
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {activeTab === 'pagos' ? (
          <>
            <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4 flex items-center gap-3">
              <div className="p-2.5 md:p-2 rounded-xl md:rounded-lg bg-voltech-error/10 md:bg-voltech-error/20 text-voltech-error shrink-0 flex items-center justify-center"><TrendingDown className="w-5 h-5" /></div>
              <div className="min-w-0 flex-1 md:flex-none"><p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Total Pagado</p><p className="text-base md:text-xl font-bold text-voltech-error mt-0.5 md:mt-0">${totalPagado.toFixed(2)}</p></div>
            </div>
            <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4 flex items-center gap-3">
              <div className="p-2.5 md:p-2 rounded-xl md:rounded-lg bg-voltech-warning/10 md:bg-voltech-warning/20 text-voltech-warning shrink-0 flex items-center justify-center"><Clock className="w-5 h-5" /></div>
              <div className="min-w-0 flex-1 md:flex-none"><p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Comisiones Pendientes</p><p className="text-base md:text-xl font-bold text-voltech-warning mt-0.5 md:mt-0">${totalPendienteComisiones.toFixed(2)}</p></div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4 flex items-center gap-3">
              <div className="p-2.5 md:p-2 rounded-xl md:rounded-lg bg-voltech-success/10 md:bg-voltech-success/20 text-voltech-success shrink-0 flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
              <div className="min-w-0 flex-1 md:flex-none"><p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Total Invertido (Activo)</p><p className="text-base md:text-xl font-bold text-voltech-success mt-0.5 md:mt-0">${totalInvertidoActivo.toFixed(2)}</p></div>
            </div>
            <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4 flex items-center gap-3">
              <div className="p-2.5 md:p-2 rounded-xl md:rounded-lg bg-voltech-warning/10 md:bg-voltech-warning/20 text-voltech-warning shrink-0 flex items-center justify-center"><Clock className="w-5 h-5" /></div>
              <div className="min-w-0 flex-1 md:flex-none"><p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Rendimientos por Pagar</p><p className="text-base md:text-xl font-bold text-voltech-warning mt-0.5 md:mt-0">${rendimientosPorPagar.toFixed(2)}</p></div>
            </div>
          </>
        )}
        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4 flex items-center gap-3">
          <div className="p-2.5 md:p-2 rounded-xl md:rounded-lg bg-voltech-cyan/10 md:bg-voltech-cyan/20 text-voltech-cyan shrink-0 flex items-center justify-center"><Wallet className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1 md:flex-none"><p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">{activeTab === 'inversiones' ? 'Total Retornado' : 'Balance Neto'}</p><p className={`text-base md:text-xl font-bold mt-0.5 md:mt-0 ${balance >= 0 ? 'text-voltech-cyan' : 'text-voltech-error'}`}>${(activeTab === 'inversiones' ? totalRetornado : balance).toFixed(2)}</p></div>
        </div>
        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4 flex items-center gap-3">
          <div className="p-2.5 md:p-2 rounded-xl md:rounded-lg bg-voltech-purple/10 md:bg-voltech-purple/20 text-voltech-purple shrink-0 flex items-center justify-center"><PieChart className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1 md:flex-none"><p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Movimientos Totales</p><p className="text-base md:text-xl font-bold text-white mt-0.5 md:mt-0">{movimientos.length}</p></div>
        </div>
      </div>

      {activeTab === 'pagos' && (
        <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-voltech-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setEquipoColapsado(!equipoColapsado)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted">
                {equipoColapsado ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
              <div className="p-2 rounded-lg bg-voltech-cyan/20"><Users className="w-5 h-5 text-voltech-cyan" /></div>
              <div>
                <h3 className="text-lg font-bold text-white">Equipo - Comisiones</h3>
                <p className="text-xs text-voltech-muted">Haz clic en "Pagar" para registrar el pago de ventas pendientes</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <input type="text" placeholder="Buscar vendedor..." value={filtroNombreEquipo} onChange={(e) => setFiltroNombreEquipo(e.target.value)} className="input-voltech rounded-lg px-3 py-2 text-sm" />
              <CustomSelect
                value={filtroRol}
                onChange={setFiltroRol}
                options={[
                  { value: 'todos', label: 'Todos los roles' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'vendedor', label: 'Vendedor' },
                  { value: 'socio', label: 'Socio' }
                ]}
                placeholder="Rol"
                className="w-full sm:w-auto"
              />
              <CustomSelect
                value={filtroPendiente}
                onChange={setFiltroPendiente}
                options={[
                  { value: 'todos', label: 'Todos' },
                  { value: 'pendiente', label: 'Con pendiente' },
                  { value: 'solicitado', label: 'Con solicitud' }
                ]}
                placeholder="Estado"
                className="w-full sm:w-auto"
              />
            </div>
          </div>
          {!equipoColapsado && (<>
            {/* ✅ Vista Card Móvil (< md) */}
            <div className="block md:hidden space-y-3 p-3">
              {equipoFiltrado.length === 0 ? (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                  <p className="text-xs text-slate-400">No hay miembros.</p>
                </div>
              ) : (
                equipoFiltrado.map((miembro, index) => {
                  const stats = getMiembroStats(miembro.id);
                  const solPend = solicitudes.some(s => s.miembro_nombre === miembro.nombre && s.estado === 'pendiente');
                  return (
                    <div key={miembro.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-voltech-cyan to-voltech-purple flex items-center justify-center text-white font-bold text-xs shrink-0">{miembro.nombre?.charAt(0) || '?'}</div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-100 truncate">#{index + 1} • {miembro.nombre}</h4>
                            <p className="text-[11px] text-slate-400 capitalize truncate">{miembro.rol}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setFormData({ ...formData, tipo: 'pago', miembroId: miembro.id, miembroNombre: miembro.nombre });
                            setSelectedComisiones([]);
                            setShowForm(true);
                          }}
                          className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-3 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Wallet className="w-4 h-4 shrink-0" /> Pagar
                        </button>
                      </div>
                      {solPend && (
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">💰 Solicitado</span>
                      )}
                      <div className="pt-2 border-t border-slate-700/40 grid grid-cols-2 gap-2 text-[11px]">
                        <div><span className="text-slate-400 block">Ventas:</span><span className="text-slate-200 font-bold">{stats.totalVentas}</span></div>
                        <div><span className="text-slate-400 block">Pagadas:</span><span className="text-emerald-300 font-bold">{stats.totalPagadas}</span></div>
                        <div><span className="text-slate-400 block">Pendientes:</span><span className="text-amber-300 font-bold">{stats.totalPendientes}</span></div>
                        <div><span className="text-slate-400 block">Pendiente ($):</span><span className="text-amber-300 font-bold">${stats.montoPendiente.toFixed(2)}</span></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ✅ Vista Tabla Desktop (>= md) */}
            <div className="hidden md:block w-full overflow-x-auto min-w-0">
            <table className="w-full min-w-[720px] md:min-w-0">
              <thead className="bg-voltech-dark border-b border-voltech-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted whitespace-nowrap">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted whitespace-nowrap">Miembro</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted whitespace-nowrap">Ventas</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted whitespace-nowrap">Pagadas</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted whitespace-nowrap">Pendientes</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted whitespace-nowrap">Pendiente ($)</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted whitespace-nowrap">Solicitud</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {equipoFiltrado.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-8 text-voltech-muted">No hay miembros.</td></tr>
                ) : (
                  equipoFiltrado.map((miembro, index) => {
                    const stats = getMiembroStats(miembro.id);
                    const solPend = solicitudes.some(s => s.miembro_nombre === miembro.nombre && s.estado === 'pendiente');
                    return (
                      <tr key={miembro.id} className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : index === 1 ? 'bg-gray-400/20 text-gray-400' : 'bg-voltech-muted/20 text-voltech-muted'}`}>#{index + 1}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-voltech-cyan to-voltech-purple flex items-center justify-center text-white font-bold">{miembro.nombre?.charAt(0) || '?'}</div>
                            <div>
                              <p className="text-sm font-bold text-white">{miembro.nombre}</p>
                              <p className="text-xs text-voltech-muted capitalize">{miembro.rol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-white">{stats.totalVentas}</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-voltech-success">{stats.totalPagadas}</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-voltech-warning">{stats.totalPendientes}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-voltech-warning">${stats.montoPendiente.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          {solPend ? <span className="text-xs px-2 py-1 rounded-full bg-voltech-warning/20 text-voltech-warning">💰 Solicitado</span> : <span className="text-xs text-voltech-muted">-</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setFormData({ ...formData, tipo: 'pago', miembroId: miembro.id, miembroNombre: miembro.nombre });
                              setSelectedComisiones([]);
                              setShowForm(true);
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-3 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm ml-auto"
                          >
                            <Wallet className="w-3.5 h-3.5 shrink-0" /> Pagar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>
          </>)}
        </div>
      )}

      <AnimatePresence>
        {selectedMiembro && activeTab === 'pagos' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden"
          >
            <div className="p-6 border-b border-voltech-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-voltech-cyan flex items-center justify-center text-white font-bold text-xl">
                  {selectedMiembro.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedMiembro.nombre}</h3>
                  <p className="text-sm text-voltech-muted">{selectedMiembro.telefono} • {selectedMiembro.rol}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMiembro(null)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {(() => {
                const stats = getMiembroStats(selectedMiembro.id);
                const comisionesMiembro = comisionesPendientes.filter(c => c.miembroId === selectedMiembro.id);
                
                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                        <p className="text-xs text-voltech-muted mb-1">Total Ventas</p>
                        <p className="text-2xl font-bold text-white">{stats.totalVentas}</p>
                      </div>
                      <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                        <p className="text-xs text-voltech-muted mb-1">Ventas Pagadas</p>
                        <p className="text-2xl font-bold text-voltech-success">{stats.totalPagadas}</p>
                      </div>
                      <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                        <p className="text-xs text-voltech-muted mb-1">Ventas Pendientes</p>
                        <p className="text-2xl font-bold text-voltech-warning">{stats.totalPendientes}</p>
                      </div>
                      <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                        <p className="text-xs text-voltech-muted mb-1">% Promedio</p>
                        <p className="text-2xl font-bold text-voltech-cyan">{stats.porcentajePromedio}%</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                        <p className="text-xs text-voltech-muted mb-1">Monto Total en Ventas</p>
                        <p className="text-xl font-bold text-white">${stats.montoTotalVentas.toFixed(2)}</p>
                      </div>
                      <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                        <p className="text-xs text-voltech-muted mb-1">Total Comisiones</p>
                        <p className="text-xl font-bold text-voltech-cyan">${stats.montoTotalComisiones.toFixed(2)}</p>
                      </div>
                      <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                        <p className="text-xs text-voltech-muted mb-1">Monto Pendiente</p>
                        <p className="text-xl font-bold text-voltech-warning">${stats.montoPendiente.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-bold text-white mb-3">Historial de Comisiones</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-voltech-dark border-b border-voltech-border">
                            <tr>
                              <th className="text-left px-3 py-2 text-xs text-voltech-muted">Fecha</th>
                              <th className="text-left px-3 py-2 text-xs text-voltech-muted">N° Orden</th>
                              <th className="text-left px-3 py-2 text-xs text-voltech-muted">Producto</th>
                              <th className="text-right px-3 py-2 text-xs text-voltech-muted">Monto Venta</th>
                              <th className="text-right px-3 py-2 text-xs text-voltech-muted">%</th>
                              <th className="text-right px-3 py-2 text-xs text-voltech-muted">Comisión</th>
                              <th className="text-center px-3 py-2 text-xs text-voltech-muted">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comisionesMiembro.length === 0 ? (
                              <tr>
                                <td colSpan="7" className="text-center py-8 text-voltech-muted">No hay comisiones registradas</td>
                              </tr>
                            ) : (
                              comisionesMiembro.map((com) => (
                                <tr key={com.id} className="border-b border-voltech-border/50">
                                  <td className="px-3 py-2 text-voltech-muted">{com.fecha_venta}</td>
                                  <td className="px-3 py-2 text-voltech-cyan font-mono text-xs">{com.venta_numero_orden}</td>
                                  <td className="px-3 py-2 text-white">{com.producto_nombre}</td>
                                  <td className="px-3 py-2 text-right text-voltech-muted">${Number(com.monto_venta).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right text-voltech-muted">{com.porcentaje_comision}%</td>
                                  <td className="px-3 py-2 text-right font-bold text-voltech-success">${Number(com.monto_comision).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-center">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      com.estado === 'pagada' ? 'bg-voltech-success/20 text-voltech-success' : 'bg-voltech-warning/20 text-voltech-warning'
                                    }`}>
                                      {com.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {formData.tipo === 'pago' ? <Briefcase className="w-5 h-5 text-voltech-cyan" /> : <TrendingUp className="w-5 h-5 text-voltech-success" />}
                  {editingId ? 'Editar' : 'Nuevo'} {formData.tipo === 'pago' ? 'Pago' : 'Inversión'}
                </h3>
                <button onClick={resetForm} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Tipo</label>
                  <select value={formData.tipo} disabled className="input-voltech w-full rounded-lg px-4 py-2 text-sm opacity-70">
                    {activeTab === 'inversiones' ? (<option value="inversion">💰 Inversión de Socio</option>) : (<option value="pago">💵 Pago a Vendedor</option>)}
                  </select>
                </div>
                {formData.tipo === 'inversion' && (
                  <div>
                    <CustomSelect
                      label="Tipo de Movimiento *"
                      value={formData.subtipo}
                      onChange={(v) => setFormData({ ...formData, subtipo: v })}
                      options={[
                        { value: 'inyeccion', label: '💚 Inyección de Capital' },
                        { value: 'retorno', label: '🔴 Retorno de Capital' },
                        { value: 'rendimiento', label: '🟡 Pago de Rendimiento' }
                      ]}
                      placeholder="Selecciona tipo"
                      className="w-full"
                    />
                  </div>
                )}
                <div>
                  <CustomSelect
                    label="Miembro *"
                    value={formData.miembroId}
                    onChange={(v) => {
                      const miembro = equipo.find(x => x.id === v);
                      setFormData({ ...formData, miembroId: v, miembroNombre: miembro?.nombre || '' });
                    }}
                    options={equipo.map(e => ({ value: e.id, label: `${e.nombre} (${e.rol})` }))}
                    placeholder="-- Selecciona --"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Monto ($) *</label>
                  <input type="number" step="0.01" value={formData.monto} onChange={(e) => setFormData({ ...formData, monto: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="0.00" />
                </div>
                {formData.tipo === 'inversion' && (
                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">% Retorno</label>
                    <input type="number" step="0.1" value={formData.porcentajeRetorno} onChange={(e) => setFormData({ ...formData, porcentajeRetorno: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                    {formData.monto && <p className="text-xs text-voltech-success mt-1">Retorno estimado: ${(Number(formData.monto) * Number(formData.porcentajeRetorno) / 100).toFixed(2)}</p>}
                  </div>
                )}
                <div>
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Fecha *</label>
                  <input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                </div>
                {formData.tipo === 'inversion' && formData.subtipo === 'inyeccion' && (
                  <>
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1 ml-1">Plazo (días)</label>
                      <input type="number" min="0" placeholder="Ej: 30" onChange={(e) => {
                        const dias = Number(e.target.value) || 0;
                        const f = new Date(formData.fecha);
                        f.setDate(f.getDate() + dias);
                        setFormData({ ...formData, fechaVencimiento: f.toISOString().split('T')[0] });
                      }} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1 ml-1">Fecha Vencimiento</label>
                      <input type="date" value={formData.fechaVencimiento} onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Período</label>
                  <input type="text" value={formData.periodo} onChange={(e) => setFormData({ ...formData, periodo: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Ej: 2024-06" />
                </div>
                <div>
                  <CustomSelect
                    label="Cartera"
                    value={formData.carteraId}
                    onChange={(v) => setFormData({ ...formData, carteraId: v })}
                    options={carteras.map(c => ({ value: c.id, label: c.nombre }))}
                    placeholder="-- Sin especificar --"
                    className="w-full"
                  />
                </div>
                <div>
                  <CustomSelect
                    label="Método de Pago"
                    value={formData.metodoPago}
                    onChange={(v) => setFormData({ ...formData, metodoPago: v })}
                    options={metodosPago.map(m => ({ value: m.id, label: m.nombre }))}
                    placeholder="-- Sin especificar --"
                    className="w-full"
                  />
                </div>
                <div>
                  <CustomSelect
                    label="Estado"
                    value={formData.estado}
                    onChange={(v) => setFormData({ ...formData, estado: v })}
                    options={[
                      { value: 'pagado', label: 'Pagado' },
                      { value: 'pendiente', label: 'Pendiente' }
                    ]}
                    placeholder="Selecciona estado"
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Descripción</label>
                  <input type="text" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Concepto del pago..." />
                </div>
              </div>

              {formData.tipo === 'pago' && formData.miembroId && (
                <div className="mb-6 bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-voltech-cyan" /> 
                    Seleccionar Ventas a Pagar ({comisionesDelMiembro.length} pendientes)
                  </h4>
                  
                  {comisionesDelMiembro.length === 0 ? (
                    <p className="text-xs text-voltech-muted text-center py-4">Este miembro no tiene comisiones pendientes de pago.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {comisionesDelMiembro.map((com) => {
                        const isSelected = selectedComisiones.find(c => c.id === com.id);
                        return (
                          <div 
                            key={com.id} 
                            onClick={() => toggleComision(com)}
                            className={`flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 rounded-xl md:rounded-lg w-full border cursor-pointer transition-all ${isSelected ? 'bg-voltech-cyan/10 border-voltech-cyan' : 'bg-slate-800/60 md:bg-voltech-surface border-slate-700/50 md:border-voltech-border hover:border-voltech-cyan/50'}`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={`w-5 h-5 mt-0.5 shrink-0 rounded border flex items-center justify-center ${isSelected ? 'bg-voltech-cyan border-voltech-cyan' : 'border-voltech-muted'}`}>
                                {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs md:text-sm font-medium text-slate-200 md:text-white line-clamp-2">{com.producto_nombre} {solicitudes.some(s => s.venta_id === com.venta_id && s.estado === 'pendiente') && <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-voltech-warning/20 text-voltech-warning">💰 Solicitada</span>}</p>
                                <p className="text-[11px] text-slate-400 md:text-voltech-muted font-mono mt-0.5">Venta #{com.venta_numero_orden} • {com.fecha_venta}</p>
                              </div>
                            </div>

                            {/* Móvil: barra inferior con desglose */}
                            <div className="md:hidden flex items-center justify-between pt-2 border-t border-slate-700/40 text-xs">
                              <span className="text-slate-400">Venta: ${Number(com.monto_venta).toFixed(2)} ({com.porcentaje_comision}%)</span>
                              <span className="text-emerald-400 font-bold text-sm">${Number(com.monto_comision).toFixed(2)}</span>
                            </div>

                            {/* Desktop: bloque derecho original */}
                            <div className="hidden md:block text-right">
                              <p className="text-xs text-voltech-muted">Venta: ${Number(com.monto_venta).toFixed(2)}</p>
                              <p className="text-sm font-bold text-voltech-cyan">{com.porcentaje_comision}% = ${Number(com.monto_comision).toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={handleSave} className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" /> {editingId ? 'Actualizar' : 'Registrar'}
                </button>
                <button onClick={resetForm} className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white">
                  <X className="w-4 h-4" /> Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-voltech-border flex flex-col md:flex-row items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-white">Historial de {activeTab === 'pagos' ? 'Pagos' : 'Inversiones'}</h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            {activeTab === 'pagos' && (
              <button onClick={depurarPagos} className="w-full sm:w-auto shrink-0 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"><Trash2 className="w-3 h-3" /> Depurar</button>
            )}
            <CustomSelect
              value={filtroMiembro}
              onChange={setFiltroMiembro}
              options={[
                { value: 'todos', label: 'Todos los miembros' },
                ...equipo.map(e => ({ value: e.id, label: e.nombre }))
              ]}
              placeholder="Filtrar miembro"
              className="flex-1 w-full"
            />
            <div className="relative w-full sm:w-56 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
            </div>
          </div>
        </div>
        
        {/* ✅ Vista Card Móvil (< md) */}
        <div className="block md:hidden space-y-3 p-3">
          {movimientosFiltrados.length === 0 ? (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-500" />
              <p className="text-xs text-slate-400">No hay registros</p>
            </div>
          ) : (
            movimientosFiltrados.map((mov) => {
              const detalles = getDetallesMovimiento(mov.id);
              const isExpanded = expandedRowId === mov.id;
              const st = mov.subtipo || (mov.tipo === 'inversion' ? 'inyeccion' : 'pago');
              const cfg = { inyeccion: { cls: 'bg-emerald-500/20 text-emerald-300', label: '💚 Inyección' }, retorno: { cls: 'bg-rose-500/20 text-rose-300', label: '🔴 Retorno' }, rendimiento: { cls: 'bg-amber-500/20 text-amber-300', label: '🟡 Rendimiento' }, pago: { cls: 'bg-cyan-500/20 text-cyan-300', label: '💵 Pago' } }[st] || { cls: 'bg-slate-500/20 text-slate-300', label: st };
              return (
                <div key={mov.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-100 truncate">{mov.miembroNombre}</h4>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{mov.fecha}</p>
                    </div>
                    <span className={`shrink-0 text-[11px] font-bold ${mov.tipo === 'inversion' && mov.subtipo === 'inyeccion' ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {mov.tipo === 'inversion' && mov.subtipo === 'inyeccion' ? '+' : '-'}${Number(mov.monto).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                    {activeTab === 'inversiones' && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${mov.estadoInversion === 'liquidada' ? 'bg-purple-500/20 text-purple-300' : mov.estadoInversion === 'rendimiento_pagado' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {mov.estadoInversion === 'liquidada' ? '🟣 Liquidada' : mov.estadoInversion === 'rendimiento_pagado' ? '🔵 Rend. Pagado' : '🟢 Activa'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{mov.descripcion || (mov.tipo === 'pago' ? 'Pago de comisiones' : 'Aporte de capital')}</p>
                  <div className="pt-2 border-t border-slate-700/40 grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-slate-400 block">Método:</span><span className="text-slate-200 capitalize">{(mov.metodoPago || '').replace('_', ' ') || 'N/A'}</span></div>
                    {activeTab === 'inversiones' ? (
                      <div><span className="text-slate-400 block">% ROI:</span><span className="text-emerald-300 font-bold">{mov.porcentajeRetorno || 0}%</span></div>
                    ) : (
                      <div><span className="text-slate-400 block">Ventas en pago:</span><span className="text-cyan-300 font-bold">{detalles.length}</span></div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {detalles.length > 0 && (
                      <button onClick={() => setExpandedRowId(isExpanded ? null : mov.id)} className="flex-1 flex items-center justify-center gap-1 text-[11px] text-cyan-400 py-1.5 rounded-lg border border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                        <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} /> Ver detalle
                      </button>
                    )}
                    {activeTab === 'inversiones' && (mov.subtipo === 'inyeccion' || !mov.subtipo) && mov.estadoInversion !== 'liquidada' && mov.estadoInversion !== 'rendimiento_pagado' && (
                      <button onClick={() => pagarRendimiento(mov)} className="flex-1 text-[11px] font-semibold text-amber-300 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors">💰 Rend.</button>
                    )}
                    {activeTab === 'inversiones' && (mov.subtipo === 'inyeccion' || !mov.subtipo) && mov.estadoInversion !== 'liquidada' && (
                      <button onClick={() => liquidarInversion(mov)} className="flex-1 text-[11px] font-semibold text-purple-300 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-colors">🏁 Liquidar</button>
                    )}
                    <button onClick={() => handleEdit(mov)} className="p-1.5 text-slate-400 hover:text-cyan-400" title="Editar"><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(mov)} className="p-1.5 text-slate-400 hover:text-rose-400" title="Eliminar"><Trash2 size={16} /></button>
                  </div>
                  {isExpanded && detalles.length > 0 && (
                    <div className="space-y-2">
                      {detalles.map((det) => (
                        <div key={det.id} className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-100 truncate">{det.producto_nombre}</span>
                            <span className="text-[11px] text-emerald-300 font-bold">${Number(det.monto_comision).toFixed(2)}</span>
                          </div>
                          <p className="text-[10px] text-slate-400">#{det.venta_numero_orden} • {det.fecha_venta} • {det.porcentaje_comision}%</p>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <button onClick={() => notificarWhatsApp(mov)} className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-300 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors">
                          <MessageCircle size={14} /> WhatsApp
                        </button>
                        <button onClick={() => generarReciboPDF(mov)} className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-cyan-300 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors">
                          <Printer size={14} /> Recibo PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ✅ Vista Tabla Desktop (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-voltech-dark border-b border-voltech-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Miembro</th>
                {activeTab === 'inversiones' && <th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted">Tipo</th>}
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Descripción</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Método</th>
                {activeTab === 'inversiones' && <th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted">% ROI</th>}
                {activeTab === 'inversiones' && <th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted">Vence</th>}
                {activeTab === 'inversiones' && <th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted">Estado</th>}
                <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Monto</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {movimientosFiltrados.length === 0 ? (
                <tr><td colSpan="11" className="text-center py-12 text-voltech-muted"><FileText className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No hay registros</p></td></tr>
              ) : (
                movimientosFiltrados.map((mov) => {
                  const detalles = getDetallesMovimiento(mov.id);
                  const isExpanded = expandedRowId === mov.id;
                  
                  return (
                    <Fragment key={mov.id}>
                      <tr className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors cursor-pointer" onClick={() => setExpandedRowId(isExpanded ? null : mov.id)}>
                        <td className="px-4 py-3 text-sm text-voltech-muted flex items-center gap-2"><Calendar className="w-3 h-3" /> {mov.fecha}</td>
                        <td className="px-4 py-3"><p className="text-sm font-medium text-white">{mov.miembroNombre}</p></td>
                        <td className="px-4 py-3 text-sm text-voltech-muted max-w-xs truncate">{mov.descripcion || (mov.tipo === 'pago' ? 'Pago de comisiones' : 'Aporte de capital')}</td>
                        {activeTab === 'inversiones' && (
                          <td className="px-4 py-3 text-center">
                            {(() => {
                              const st = mov.subtipo || (mov.tipo === 'inversion' ? 'inyeccion' : 'pago');
                              const cfg = { inyeccion: { color: 'bg-voltech-success/20 text-voltech-success', label: '💚 Inyección' }, retorno: { color: 'bg-voltech-error/20 text-voltech-error', label: '🔴 Retorno' }, rendimiento: { color: 'bg-voltech-warning/20 text-voltech-warning', label: '🟡 Rendimiento' }, pago: { color: 'bg-voltech-cyan/20 text-voltech-cyan', label: '💵 Pago' } }[st] || { color: 'bg-voltech-muted/20 text-voltech-muted', label: st };
                              return <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${cfg.color}`}>{cfg.label}</span>;
                            })()}
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm text-voltech-muted capitalize">{mov.metodoPago?.replace('_', ' ')}</td>
                        {activeTab === 'inversiones' && <td className="px-4 py-3 text-center text-sm font-bold text-voltech-success">{mov.porcentajeRetorno || 0}%</td>}
                        {activeTab === 'inversiones' && <td className="px-4 py-3 text-center text-xs text-voltech-muted">{mov.fechaVencimiento || '-'}</td>}
                        {activeTab === 'inversiones' && (
                          <td className="px-4 py-3 text-center">
                            {(() => {
                              const ei = mov.estadoInversion || (mov.subtipo === 'inyeccion' || !mov.subtipo ? 'activa' : 'n/a');
                              const cfg = { activa: { color: 'bg-voltech-success/20 text-voltech-success', label: '🟢 Activa' }, rendimiento_pagado: { color: 'bg-voltech-cyan/20 text-voltech-cyan', label: '🔵 Rend. Pagado' }, liquidada: { color: 'bg-voltech-purple/20 text-voltech-purple', label: '🟣 Liquidada' }, 'n/a': { color: 'bg-voltech-muted/20 text-voltech-muted', label: '-' } }[ei];
                              return <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${cfg.color}`}>{cfg.label}</span>;
                            })()}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-bold ${mov.tipo === 'inversion' && mov.subtipo === 'inyeccion' ? 'text-voltech-success' : mov.tipo === 'inversion' ? 'text-voltech-error' : mov.tipo === 'pago' ? 'text-voltech-error' : 'text-voltech-success'}`}>
                            {mov.tipo === 'inversion' && mov.subtipo === 'inyeccion' ? '+' : '-'}${Number(mov.monto).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {detalles.length > 0 && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setExpandedRowId(isExpanded ? null : mov.id); }}
                                className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                            {activeTab === 'inversiones' && (mov.subtipo === 'inyeccion' || !mov.subtipo) && mov.estadoInversion !== 'liquidada' && (
                              <>
                                {mov.estadoInversion !== 'rendimiento_pagado' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); pagarRendimiento(mov); }}
                                    className="px-2 py-1 bg-voltech-warning/20 text-voltech-warning rounded-lg text-xs hover:bg-voltech-warning/30 transition-colors"
                                    title="Pagar solo el rendimiento"
                                  >
                                    💰 Rend.
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); liquidarInversion(mov); }}
                                  className="px-2 py-1 bg-voltech-purple/20 text-voltech-purple rounded-lg text-xs hover:bg-voltech-purple/30 transition-colors"
                                  title="Devolver capital + rendimiento"
                                >
                                  🏁 Liquidar
                                </button>
                              </>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEdit(mov); }} 
                              className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(mov); }} 
                              className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {isExpanded && detalles.length > 0 && (
                        <tr className="bg-voltech-dark/50">
                          <td colSpan="6" className="px-4 py-4">
                            <div className="bg-voltech-surface border border-voltech-border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-xs font-bold text-voltech-muted uppercase">Ventas incluidas en este pago</h5>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => notificarWhatsApp(mov)}
                                    className="px-3 py-1.5 bg-green-500/20 text-green-500 rounded-lg text-xs hover:bg-green-500/30 transition-colors flex items-center gap-1"
                                  >
                                    <MessageCircle className="w-3 h-3" /> WhatsApp
                                  </button>
                                  <button 
                                    onClick={() => generarReciboPDF(mov)}
                                    className="px-3 py-1.5 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-xs hover:bg-voltech-cyan/30 transition-colors flex items-center gap-1"
                                  >
                                    <Printer className="w-3 h-3" /> Recibo PDF
                                  </button>
                                </div>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="border-b border-voltech-border">
                                    <tr>
                                      <th className="text-left py-2 text-xs text-voltech-muted">N° Orden</th>
                                      <th className="text-left py-2 text-xs text-voltech-muted">Fecha Venta</th>
                                      <th className="text-left py-2 text-xs text-voltech-muted">Producto</th>
                                      <th className="text-right py-2 text-xs text-voltech-muted">Monto Venta</th>
                                      <th className="text-right py-2 text-xs text-voltech-muted">%</th>
                                      <th className="text-right py-2 text-xs text-voltech-muted">Comisión</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {detalles.map((det) => (
                                      <tr key={det.id} className="border-b border-voltech-border/50 last:border-0">
                                        <td className="py-2 text-voltech-cyan font-mono text-xs">{det.venta_numero_orden}</td>
                                        <td className="py-2 text-voltech-muted text-xs">{det.fecha_venta}</td>
                                        <td className="py-2 text-white text-xs">{det.producto_nombre}</td>
                                        <td className="py-2 text-right text-voltech-muted text-xs">${Number(det.monto_venta).toFixed(2)}</td>
                                        <td className="py-2 text-right text-voltech-muted text-xs">{det.porcentaje_comision}%</td>
                                        <td className="py-2 text-right text-voltech-success font-bold text-xs">${Number(det.monto_comision).toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeTab === 'cuentas' && (
        <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-voltech-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-voltech-cyan/20"><Wallet className="w-5 h-5 text-voltech-cyan" /></div>
              <div>
                <h3 className="text-lg font-bold text-white">Cuentas / Caja</h3>
                <p className="text-xs text-voltech-muted">Lo que entra y sale de cada cuenta · mueve fondos entre cuentas</p>
              </div>
            </div>
            <button onClick={() => setShowFormCuenta(!showFormCuenta)} className="px-4 py-2 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" /> Registrar Movimiento
            </button>
          </div>

          {showFormCuenta && (
            <div className="p-6 border-b border-voltech-border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-voltech-muted mb-1 ml-1">Tipo</label>
                <CustomSelect value={formCuenta.tipo} onChange={(v) => setFormCuenta({ ...formCuenta, tipo: v })} options={[{ value: 'entrada', label: '⬆️ Entrada' }, { value: 'salida', label: '⬇️ Salida' }, { value: 'transferencia', label: '🔄 Transferencia' }]} placeholder="Tipo" className="w-full" />
              </div>
              <div>
                <label className="block text-xs text-voltech-muted mb-1 ml-1">Cuenta Origen</label>
                <CustomSelect value={formCuenta.cuentaOrigen} onChange={(v) => setFormCuenta({ ...formCuenta, cuentaOrigen: v })} options={todasCuentas.map(c => ({ value: c, label: c }))} placeholder="-- Origen --" className="w-full" />
              </div>
              <div>
                <label className="block text-xs text-voltech-muted mb-1 ml-1">Cuenta Destino</label>
                <CustomSelect value={formCuenta.cuentaDestino} onChange={(v) => setFormCuenta({ ...formCuenta, cuentaDestino: v })} options={todasCuentas.map(c => ({ value: c, label: c }))} placeholder="-- Destino --" className="w-full" />
              </div>
              <div>
                <label className="block text-xs text-voltech-muted mb-1 ml-1">Moneda Origen</label>
                <CustomSelect value={formCuenta.monedaOrigen} onChange={(v) => setFormCuenta({ ...formCuenta, monedaOrigen: v })} options={[{ value: 'USD', label: 'USD $' }, { value: 'BS', label: 'Bolívares Bs' }, { value: 'USDT', label: 'USDT' }]} placeholder="USD" className="w-full" />
              </div>
              <div>
                <label className="block text-xs text-voltech-muted mb-1 ml-1">Moneda Destino</label>
                <CustomSelect value={formCuenta.monedaDestino} onChange={(v) => setFormCuenta({ ...formCuenta, monedaDestino: v })} options={[{ value: 'USD', label: 'USD $' }, { value: 'BS', label: 'Bolívares Bs' }, { value: 'USDT', label: 'USDT' }]} placeholder="USDT" className="w-full" />
              </div>
              <div>
                <label className="block text-xs text-voltech-muted mb-1 ml-1">Tasa (Bs/$) · ej: BCV</label>
                <input type="number" step="0.01" value={formCuenta.tasa} onChange={(e) => setTasaBs(e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="36.50" />
              </div>
              <div>
                <label className="block text-xs text-voltech-muted mb-1 ml-1">Monto en Bs → calcula $</label>
                <input type="number" step="0.01" value={formCuenta.montoBs} onChange={(e) => setMontoBs(e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs text-voltech-muted mb-1 ml-1">Monto en $ → calcula Bs</label>
                <input type="number" step="0.01" value={formCuenta.montoUsd} onChange={(e) => setMontoUsd(e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs text-voltech-muted mb-1 ml-1">Nota</label>
                <input type="text" value={formCuenta.nota} onChange={(e) => setFormCuenta({ ...formCuenta, nota: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Ej: Bs → USDT" />
              </div>
              <div className="md:col-span-2 lg:col-span-4 flex gap-3">
                <button onClick={registrarMovCuenta} className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Guardar Movimiento</button>
                <button onClick={() => setShowFormCuenta(false)} className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white"><X className="w-4 h-4" /> Cancelar</button>
              </div>
            </div>
          )}

          <div className="p-6 border-b border-voltech-border flex flex-col sm:flex-row gap-2">
            <input type="text" value={nuevaCuentaInterna} onChange={(e) => setNuevaCuentaInterna(e.target.value)} placeholder="Nueva cuenta interna (ej: Ahorros, Publicidad, Caja Principal $)" className="input-voltech flex-1 rounded-lg px-4 py-2 text-sm" />
            <button onClick={agregarCuentaInterna} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 flex items-center gap-2"><Plus className="w-4 h-4" /> Crear Cuenta</button>
          </div>

          <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {todasCuentas.map(nombre => (
              <div key={nombre} className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4 relative">
                {cuentasInternas.includes(nombre) && (
                  <button onClick={() => eliminarCuentaInterna(nombre)} className="absolute top-2 right-2 p-1 text-voltech-error hover:bg-voltech-error/10 rounded" title="Eliminar cuenta"><Trash2 className="w-3 h-3" /></button>
                )}
                <p className="text-xs text-voltech-muted mb-1 truncate">{nombre}</p>
                <p className="text-xl font-bold text-voltech-cyan">{saldoCartera(nombre).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-voltech-dark border-b border-voltech-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Origen</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Ingreso</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Egreso</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Cartera</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Destino</th>
                </tr>
              </thead>
              <tbody>
                {movGlobales.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-voltech-muted">No hay movimientos aún.</td></tr>
                ) : (
                  movGlobales.map(m => (
                    <tr key={m.id} className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-voltech-muted whitespace-nowrap">{m.fecha}</td>
                      <td className="px-4 py-3 text-sm text-white truncate max-w-[200px]">{m.fuente}{m.concepto ? ` · ${m.concepto}` : ''}</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-voltech-success">{m.tipo === 'entrada' ? `+$${Number(m.monto).toFixed(2)}` : ''}</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-voltech-error">{(m.tipo === 'salida' || m.tipo === 'transferencia') ? `$${Number(m.monto).toFixed(2)}` : ''}</td>
                      <td className="px-4 py-3 text-sm text-voltech-muted">{m.tipo === 'transferencia' ? m.cuentaOrigen : (m.cuenta || '-')}</td>
                      <td className="px-4 py-3 text-sm text-voltech-muted">{m.tipo === 'transferencia' ? m.cuentaDestino : (m.tipo === 'entrada' ? '-' : (m.nota || m.fuente))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}