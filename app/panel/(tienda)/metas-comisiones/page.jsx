'use client';

import { useState, useEffect, Fragment } from 'react';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/app/context/PermissionsContext';
import { useNotificaciones } from '@/app/context/NotificationContext';
import { 
  DollarSign, BarChart, Target, MessageCircle, CheckCircle, 
  User, Users, Save, Trash2, Plus, Calendar, Bell, X, TrendingUp, ChevronDown, 
  Award, Download, AlertCircle, ExternalLink, ShoppingCart, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from '@/components/CustomSelect';
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function MetasYComisionesPage() {
  const { esAdmin, esSocio, esVendedor, usuarioActual } = usePermissions();
  const { agregarNotificacion } = useNotificaciones();
  const puedeGestionar = esAdmin || esSocio;

  const [mostrarFormMetas, setMostrarFormMetas] = useState(false);
  const [mostrarReferidos, setMostrarReferidos] = useState(false);
  const [tabMetas, setTabMetas] = useState('rendimiento');
  const [metas, setMetas] = useState([]);
  const [metasTemp, setMetasTemp] = useState([]);
  
  const [statsReales, setStatsReales] = useState({ ventasMes: 0, metaActual: 0 });
  const [ranking, setRanking] = useState([]);
  
  const [bonosPendientes, setBonosPendientes] = useState([]);
  const [loadingBonos, setLoadingBonos] = useState(false);

  const [nuevoComentario, setNuevoComentario] = useState('');
  const [comentarios, setComentarios] = useState([]);
    const [escalaReferidos, setEscalaReferidos] = useState([
    { referidos: 1, porcentaje: 2 },
    { referidos: 3, porcentaje: 3 },
    { referidos: 5, porcentaje: 5 },
    { referidos: 10, porcentaje: 7 },
  ]);
  const [referidosEquipo, setReferidosEquipo] = useState([]);
  const [miembroExpandido, setMiembroExpandido] = useState(null);
  const [clientesTodos, setClientesTodos] = useState([]);
  const [ventasTodas, setVentasTodas] = useState([]);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState(null);
  const [cuponesTodos, setCuponesTodos] = useState([]);
  const [comisionesTodas, setComisionesTodas] = useState([]);
  
  useEffect(() => {
  const cargarDatos = async () => {
    let savedData = null;
    
    try {
      if (supabase) {
        console.log('🔄 Cargando Metas desde Supabase...');
        const { data, error } = await supabase.from('settings').select('valor').eq('clave', 'metas_comisiones').single();
        
        if (error) {
          console.warn('⚠️ Error Supabase:', error.message);
          const localData = localStorage.getItem('voltech_comisiones');
          if (localData) savedData = JSON.parse(localData);
        } else {
          if (data?.valor) savedData = data.valor;
          console.log('✅ Metas cargadas desde Supabase');
        }
      } else {
        const localData = localStorage.getItem('voltech_comisiones');
        if (localData) savedData = JSON.parse(localData);
      }

      if (savedData) {
        setMetas(savedData.metas || []);
        setMetasTemp(savedData.metas || []);
        setComentarios(savedData.comentarios || []);
      }

      await cargarDatosReales(savedData?.metas || []);
      await verificarBonosAutomaticamente();
      await cargarReferidosEquipo();
    } catch (error) {
      console.error('Error cargando metas:', error);
    }
  };

  cargarDatos();

  const handleActualizacion = () => cargarDatos();
  window.addEventListener('voltech-data-updated', handleActualizacion);

  return () => {
    window.removeEventListener('voltech-data-updated', handleActualizacion);
  };
}, []);

  const cargarDatosReales = async (metasOverride) => {
    const metasUsar = Array.isArray(metasOverride) && metasOverride.length ? metasOverride : metas;
    let ventasProd = [], ventasStream = [], equipo = [];
    
    if (supabase) {
      const [{ data: vp }, { data: vs }, { data: eq }] = await Promise.all([
        supabase.from('ventas').select('*'),
        supabase.from('ventas_streaming').select('*'),
        supabase.from('usuarios').select('*')
      ]);
      if (vp) ventasProd = vp;
      if (vs) ventasStream = vs;
      if (eq) equipo = eq;
    } else {
      ventasProd = JSON.parse(localStorage.getItem('voltech_ventas') || '[]');
      ventasStream = JSON.parse(localStorage.getItem('voltech_ventas_streaming') || '[]');
      equipo = JSON.parse(localStorage.getItem('voltech_equipo') || '[]');
    }

    const todasLasVentas = [...ventasProd, ...ventasStream];
    const mesActual = new Date().toISOString().slice(0, 7);

    const ventasDelMes = todasLasVentas.filter(v => {
      const fecha = v.fechaRegistro || v.fecha;
      return fecha && fecha.startsWith(mesActual);
    });

    const ventasPorVendedor = {};
    ventasDelMes.forEach(v => {
      const vendedor = v.vendedor || 'Sin Asignar';
      if (!ventasPorVendedor[vendedor]) ventasPorVendedor[vendedor] = 0;
      ventasPorVendedor[vendedor] += 1;
    });

    // Cargar datos de referidos para enriquecer el ranking
    let clientesRef = [];
    try {
      if (supabase) {
        const { data } = await supabase.from('clientes').select('*');
        clientesRef = data || [];
      } else {
        clientesRef = JSON.parse(localStorage.getItem('voltech_clientes') || '[]');
      }
    } catch {}
    const escalaRef = JSON.parse(localStorage.getItem('voltech_escala_referidos') || 'null') || [
      { referidos: 1, porcentaje: 2 }, { referidos: 3, porcentaje: 3 },
      { referidos: 5, porcentaje: 5 }, { referidos: 10, porcentaje: 7 }
    ];

    let rankingCalculado = equipo.map(miembro => {
      const ventasCount = ventasPorVendedor[miembro.nombre] || 0;
      const metasOrdenadas = [...metasUsar].sort((a, b) => a.ventas - b.ventas);
      const proximaMeta = metasOrdenadas.find(m => m.ventas > ventasCount) || metasOrdenadas[metasOrdenadas.length - 1];
      const progreso = proximaMeta ? Math.min((ventasCount / proximaMeta.ventas) * 100, 100) : 100;

      // Referidos del miembro
      const clientesDelMiembro = clientesRef.filter(c => (c.registradoPor || c.registrado_por) === miembro.nombre);
      const cantidadRef = clientesDelMiembro.length;
      const nivelRef = [...escalaRef].sort((a, b) => a.referidos - b.referidos).filter(e => cantidadRef >= e.referidos).pop();
      const porcentajeRef = nivelRef?.porcentaje || 0;
      const totalGastadoRef = clientesDelMiembro.reduce((s, c) => s + Number(c.totalGastado || 0), 0);
      const comisionRef = totalGastadoRef * (porcentajeRef / 100);

      return {
        nombre: miembro.nombre,
        rol: miembro.rol,
        ventas: ventasCount,
        proximaMeta: proximaMeta?.ventas || 0,
        porcentajeComision: proximaMeta?.porcentaje || 0,
        progreso: progreso,
        montoPromedio: 50, // promedio estimado por venta
        porcentajeReferidos: porcentajeRef,
        comisionReferidos: comisionRef,
        cantidadReferidos: cantidadRef,
      };
    }).sort((a, b) => b.ventas - a.ventas);

    if (esVendedor && usuarioActual?.nombre) {
      rankingCalculado = rankingCalculado.filter(r => r.nombre === usuarioActual.nombre);
    }

    setRanking(rankingCalculado);
    
    const totalVentasMes = (esVendedor && usuarioActual?.nombre) 
      ? (ventasPorVendedor[usuarioActual.nombre] || 0) 
      : ventasDelMes.length;
      
    const metaObj = metasUsar?.find(m => m.activo) || metasUsar?.[metasUsar.length - 1];
    
    setStatsReales({
      ventasMes: totalVentasMes,
      metaActual: metaObj?.ventas || 0
    });
  };

  const verificarBonosAutomaticamente = async () => {
    setLoadingBonos(true);
    try {
      let ventasProd = [], ventasStream = [], equipo = [], bonosExistentes = [];
      const periodoActual = new Date().toISOString().slice(0, 7);

      if (supabase) {
        const [{ data: vp }, { data: vs }, { data: eq }, { data: be }] = await Promise.all([
          supabase.from('ventas').select('*'),
          supabase.from('ventas_streaming').select('*'),
          supabase.from('usuarios').select('*'),
          supabase.from('comisiones_pendientes').select('*').eq('tipo', 'bono_meta').eq('periodo', periodoActual)
        ]);
        ventasProd = vp || [];
        ventasStream = vs || [];
        equipo = eq || [];
        bonosExistentes = be || [];
      } else {
        ventasProd = JSON.parse(localStorage.getItem('voltech_ventas') || '[]');
        ventasStream = JSON.parse(localStorage.getItem('voltech_ventas_streaming') || '[]');
        equipo = JSON.parse(localStorage.getItem('voltech_equipo') || '[]');
        bonosExistentes = JSON.parse(localStorage.getItem('voltech_comisiones_pendientes') || '[]').filter(b => b.tipo === 'bono_meta' && b.periodo === periodoActual);
      }
      

      const todasLasVentas = [...ventasProd, ...ventasStream];
      const ventasDelMes = todasLasVentas.filter(v => {
        const fecha = v.fechaRegistro || v.fecha;
        return fecha && fecha.startsWith(periodoActual);
      });

      const ventasPorVendedor = {};
      ventasDelMes.forEach(v => {
        const vendedor = v.vendedor;
        if (vendedor) {
          if (!ventasPorVendedor[vendedor]) ventasPorVendedor[vendedor] = 0;
          ventasPorVendedor[vendedor] += 1;
        }
      });

      const nuevosBonos = [];

      for (const miembro of equipo) {
        const ventasCount = ventasPorVendedor[miembro.nombre] || 0;
        
        const metasAlcanzadas = metas.filter(m => m.activo && ventasCount >= m.ventas).sort((a, b) => b.ventas - a.ventas);
        const mejorMeta = metasAlcanzadas[0];

        if (mejorMeta) {
          const yaBonificado = bonosExistentes.some(b => b.miembro_id === miembro.id && b.meta_id === mejorMeta.id);

          if (!yaBonificado) {
            const montoBono = mejorMeta.bono_monto || 20.00; 

            const nuevoBono = {
              id: `bono-${Date.now()}-${miembro.id}`,
              venta_id: null,
              venta_numero_orden: 'META',
              miembro_id: miembro.id,
              miembro_nombre: miembro.nombre,
              producto_id: null,
              producto_nombre: `Bono Meta: ${mejorMeta.ventas} ventas`,
              monto_venta: 0,
              porcentaje_comision: mejorMeta.porcentaje,
              monto_comision: montoBono,
              fecha_venta: new Date().toISOString().split('T')[0],
              estado: 'pendiente',
              tipo: 'bono_meta',
              periodo: periodoActual,
              meta_id: mejorMeta.id,
              fecha_registro: new Date().toISOString()
            };

            nuevosBonos.push(nuevoBono);

            if (agregarNotificacion) {
              agregarNotificacion({
                tipo: 'meta_alcanzada',
                titulo: '¡Meta Alcanzada! 🎉',
                mensaje: `Felicidades ${miembro.nombre}, alcanzaste la meta de ${mejorMeta.ventas} ventas. Bono: $${montoBono}`,
                detalle: `Revisa tus comisiones pendientes.`,
                usuario_id: miembro.id
              });
            }
          }
        }
      }

      if (nuevosBonos.length > 0) {
        if (supabase) {
          await supabase.from('comisiones_pendientes').insert(nuevosBonos);
        }
        const bonosGuardados = JSON.parse(localStorage.getItem('voltech_comisiones_pendientes') || '[]');
        localStorage.setItem('voltech_comisiones_pendientes', JSON.stringify([...bonosGuardados, ...nuevosBonos]));
        
        toast.success(`Se generaron ${nuevosBonos.length} bonos por metas alcanzadas. Revisa "Pagos al Equipo".`);
      }

      let todosLosBonos = [];
      if (supabase) {
        const { data } = await supabase.from('comisiones_pendientes').select('*').eq('tipo', 'bono_meta').order('fecha_registro', { ascending: false });
        todosLosBonos = data || [];
      } else {
        todosLosBonos = JSON.parse(localStorage.getItem('voltech_comisiones_pendientes') || '[]').filter(b => b.tipo === 'bono_meta');
      }
      
      const bonosVisibles = (esVendedor && usuarioActual?.nombre) 
        ? todosLosBonos.filter(b => b.miembro_nombre === usuarioActual.nombre)
        : todosLosBonos;

      setBonosPendientes(bonosVisibles);

    } catch (error) {
      console.error('Error verificando bonos:', error);
    } finally {
      setLoadingBonos(false);
    }
  };

  const cargarReferidosEquipo = async () => {
    try {
      let clientes = [], equipo = [], vts = [], comps = [];
      if (supabase) {
        const [{ data: cl }, { data: eq }, { data: vp }, { data: vs }, { data: cp }] = await Promise.all([
          supabase.from('clientes').select('*'),
          supabase.from('usuarios').select('*'),
          supabase.from('ventas').select('*'),
          supabase.from('ventas_streaming').select('*'),
          supabase.from('comisiones_pendientes').select('*')
        ]);
        clientes = cl || [];
        equipo = eq || [];
        vts = [...(vp || []), ...(vs || [])];
        comps = cp || [];
      } else {
        clientes = JSON.parse(localStorage.getItem('voltech_clientes') || '[]');
        equipo = JSON.parse(localStorage.getItem('voltech_equipo') || '[]');
        vts = [...JSON.parse(localStorage.getItem('voltech_ventas') || '[]'), ...JSON.parse(localStorage.getItem('voltech_ventas_streaming') || '[]')];
        comps = JSON.parse(localStorage.getItem('voltech_comisiones_pendientes') || '[]');
      }
      setClientesTodos(clientes);
      setVentasTodas(vts);
      setComisionesTodas(comps);

      const escalaGuardada = localStorage.getItem('voltech_escala_referidos');
      if (escalaGuardada) setEscalaReferidos(JSON.parse(escalaGuardada));

      const conteo = {};
      clientes.forEach(c => {
        const regPor = c.registradoPor || c.registrado_por;
        if (regPor) conteo[regPor] = (conteo[regPor] || 0) + 1;
      });

      const lista = equipo.map(m => {
        const cantidad = conteo[m.nombre] || 0;
        const escalaOrdenada = [...escalaReferidos].sort((a, b) => a.referidos - b.referidos);
        const nivel = escalaOrdenada.filter(e => cantidad >= e.referidos).pop();
        const porcentaje = nivel?.porcentaje || 0;
        const totalGastado = clientes
          .filter(c => (c.registradoPor || c.registrado_por) === m.nombre)
          .reduce((sum, c) => sum + Number(c.totalGastado || 0), 0);
        const comision = totalGastado * (porcentaje / 100);
        return { nombre: m.nombre, rol: m.rol, referidos: cantidad, porcentaje, totalGastado, comision };
      }).sort((a, b) => b.referidos - a.referidos);

      if (esVendedor && usuarioActual?.nombre) {
        setReferidosEquipo(lista.filter(r => r.nombre === usuarioActual.nombre));
      } else {
        setReferidosEquipo(lista);
      }
    } catch (e) {
      console.error('Error cargando referidos:', e);
    }
  };    

  const agregarEscala = () => {
    const ultima = escalaReferidos[escalaReferidos.length - 1];
    setEscalaReferidos([...escalaReferidos, { referidos: (ultima?.referidos || 0) + 5, porcentaje: (ultima?.porcentaje || 0) + 1 }]);
  };

  const eliminarEscala = (idx) => setEscalaReferidos(escalaReferidos.filter((_, i) => i !== idx));

  const actualizarEscala = (idx, campo, valor) => {
    setEscalaReferidos(escalaReferidos.map((e, i) => i === idx ? { ...e, [campo]: valor } : e));
  };

  const guardarEscala = () => {
    localStorage.setItem('voltech_escala_referidos', JSON.stringify(escalaReferidos));
    toast.success('Escala de referidos guardada');
    cargarReferidosEquipo();
  };

  const guardarEnSupabaseYLocal = async (nuevosDatos) => {
    if (supabase) {
      await supabase.from('settings').upsert({ clave: 'metas_comisiones', valor: nuevosDatos }, { onConflict: 'clave' });
    }
    localStorage.setItem('voltech_comisiones', JSON.stringify(nuevosDatos));
  };

  const handleSave = async () => {
    await guardarEnSupabaseYLocal({ metas: metas, comentarios: comentarios });
    setMetas(metas);
    toast.success('Configuración de metas guardada correctamente');
  };

  const agregarComentario = async () => {
    if (!nuevoComentario.trim()) {
      toast.error('Escribe un comentario o sugerencia');
      return;
    }

    const comentario = {
      id: Date.now(),
      usuario: usuarioActual?.nombre || 'Socio',
      texto: nuevoComentario,
      fecha: new Date().toISOString(),
      leido: false,
      aprobado: false,
      rechazado: false
    };

    const nuevosDatos = { metas, comentarios: [comentario, ...comentarios] };
    await guardarEnSupabaseYLocal(nuevosDatos);
    setComentarios(nuevosDatos.comentarios);
    setNuevoComentario('');
    toast.success('Sugerencia enviada. El admin la revisará.');

    if (agregarNotificacion) {
      agregarNotificacion({
        tipo: 'nueva_sugerencia',
        titulo: '💬 Nueva sugerencia del equipo',
        mensaje: `${comentario.usuario}: "${comentario.texto.substring(0, 40)}..."`,
        detalle: 'Revisa y aprueba en Metas y Comisiones → Configuraciones',
        usuario_id: 'admin'
      });
    }
  };

  const aprobarComentario = async (comentario) => {
    const nuevosDatos = {
      metas,
      comentarios: comentarios.map(c => c.id === comentario.id ? { ...c, aprobado: true, leido: true } : c)
    };
    await guardarEnSupabaseYLocal(nuevosDatos);
    setComentarios(nuevosDatos.comentarios);
    toast.success(`Sugerencia de ${comentario.usuario} aprobada.`);
    
    if (agregarNotificacion) {
      agregarNotificacion({
        tipo: 'sugerencia_aprobada',
        titulo: 'Sugerencia Aprobada',
        mensaje: `Tu sugerencia ha sido aprobada: "${comentario.texto.substring(0, 30)}..."`,
        usuario_id: comentario.usuario
      });
    }
  };

  const rechazarComentario = async (id) => {
    const nuevosDatos = {
      metas,
      comentarios: comentarios.map(c => c.id === id ? { ...c, rechazado: true, leido: true } : c)
    };
    await guardarEnSupabaseYLocal(nuevosDatos);
    setComentarios(nuevosDatos.comentarios);
    toast.success('Sugerencia rechazada');
  };

  const agregarMeta = () => {
    const ultimaMeta = metasTemp[metasTemp.length - 1];
    const nuevaMeta = {
      id: Date.now(),
      ventas: (ultimaMeta?.ventas || 0) + 10,
      porcentaje: ultimaMeta?.porcentaje ? Math.min(ultimaMeta.porcentaje + 2, 15) : 7,
      bono_monto: 20.00,
      activo: true,
      fechaInicio: '',
      fechaFin: ''
    };
    setMetasTemp([...metasTemp, nuevaMeta]);
    toast.success('Meta agregada. Recuerda dar clic en "Guardar Metas"');
  };

  const eliminarMeta = (id) => {
    setMetasTemp(prev => prev.filter(m => m.id !== id));
    toast.success('Meta eliminada de la vista previa.');
  };

  const actualizarMeta = (id, campo, valor) => {
    setMetasTemp(prev => prev.map(meta => 
      meta.id === id ? { ...meta, [campo]: valor } : meta
    ));
  };

  const guardarMetas = async () => {
    const nuevosDatos = { metas: [...metasTemp], comentarios };
    await guardarEnSupabaseYLocal(nuevosDatos);
    setMetas(metasTemp);
    await cargarDatosReales(metasTemp);
    toast.success('Metas actualizadas y guardadas correctamente');
    setMostrarFormMetas(false);
  };

  const generarReporteSocio = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("REPORTE DE AVANCE - METAS Y COMISIONES", 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-VE')}`, 105, 30, { align: 'center' });

    let y = 45;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("🏆 Ranking de Ventas del Mes", 14, y);
    y += 10;

    doc.autoTable({
      startY: y,
      head: [['Vendedor', 'Ventas Realizadas', 'Próxima Meta', 'Comisión', 'Progreso']],
      body: ranking.map(r => [
        r.nombre,
        r.ventas.toString(),
        `${r.proximaMeta} ventas`,
        `${r.porcentajeComision}%`,
        `${r.progreso.toFixed(0)}%`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [30, 30, 46], textColor: 255 },
      styles: { fontSize: 10 }
    });

    doc.save(`Reporte_Avance_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Reporte generado.');
  };

  const pedirPagoVenta = async (v, r, monto) => {
    const sol = { id: String(Date.now()), miembro_nombre: r.nombre, venta_id: v.id, monto, fecha: new Date().toISOString(), estado: 'pendiente', sync: false };
    const sols = JSON.parse(localStorage.getItem('voltech_solicitudes_pago') || '[]');
    localStorage.setItem('voltech_solicitudes_pago', JSON.stringify([sol, ...sols]));
    if (supabase) { try { await supabase.from('solicitudes_pago').upsert({ ...sol, sync: true }, { onConflict: 'id' }); } catch {} }
    if (agregarNotificacion) agregarNotificacion({ tipo: 'solicitud_pago', categoria: 'pagos_equipo', titulo: '💰 Solicitud de pago', mensaje: `${r.nombre} solicita el pago de $${monto.toFixed(2)} (Orden ${v.numeroOrden || ''})`, detalle: 'Venta específica', usuario_id: 'admin', miembro: r.nombre });
    window.dispatchEvent(new Event('voltech-data-updated'));
    toast.success('Solicitud de pago enviada');
  };

  const comisionDe = (v, pctFallback) => {
    const directo = Number(v.comision ?? v.comisionVendedor ?? v.montoComision ?? v.monto_comision ?? v.comision_venta ?? 0);
    if (directo > 0) return directo;
    const pct = Number(v.porcentajeComision ?? v.porcentaje_comision ?? 0);
    const total = Number(v.total || 0);
    const p = pct > 0 ? pct : (pctFallback || 0);
    return total * p / 100;
  };
  const comentariosNoLeidos = comentarios?.filter(c => !c.leido).length || 0;
  const comisionActual = metas?.[metas.length - 1]?.porcentaje || 0;
  const miNombre = usuarioActual?.nombre || '';
  const miRank = ranking.find(r => r.nombre === miNombre);
  const misRef = referidosEquipo.find(r => r.nombre === miNombre);

  return (
    <div className="space-y-6">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' },
        success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } },
      }} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Metas y Comisiones</h1>
          <p className="text-sm text-voltech-muted mt-1">
            {esVendedor ? 'Monitorea tu progreso y rendimiento' : 'Configura porcentajes, bonos y monitorea el equipo'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {puedeGestionar && (
            <button
              onClick={generarReporteSocio}
              className="w-full sm:w-auto justify-center px-4 py-2 bg-voltech-surface border border-voltech-border text-voltech-cyan rounded-lg text-sm font-medium hover:bg-voltech-cyan/10 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Reporte PDF
            </button>
          )}
          <button
            onClick={handleSave}
            className="w-full sm:w-auto justify-center px-4 py-2 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Guardar Configuración
          </button>
        </div>
      </div>
          
      <div className="border-b border-voltech-border">
        <div className="grid grid-cols-2 md:flex md:gap-6 w-full gap-y-2 pb-2 md:pb-1">
          <button onClick={() => setTabMetas('rendimiento')} className={`justify-center md:justify-start py-2.5 md:py-0 md:pb-3 flex items-center gap-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap rounded-lg md:rounded-none border-b-2 ${tabMetas === 'rendimiento' ? 'text-voltech-cyan bg-voltech-cyan/10 border-transparent md:bg-transparent md:border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'}`}>📊 Mi Rendimiento</button>
          {puedeGestionar && (
            <button onClick={() => setTabMetas('config')} className={`justify-center md:justify-start py-2.5 md:py-0 md:pb-3 flex items-center gap-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap rounded-lg md:rounded-none border-b-2 ${tabMetas === 'config' ? 'text-voltech-purple bg-voltech-purple/10 border-transparent md:bg-transparent md:border-voltech-purple' : 'text-voltech-muted border-transparent hover:text-white'}`}>⚙️ Configuraciones</button>
          )}
        </div>
      </div>

      {tabMetas === 'rendimiento' && (<>
      {/* 👤 MI RENDIMIENTO (vista personal) */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-voltech-cyan/20"><User className="w-5 h-5 text-voltech-cyan" /></div>
          <div>
            <h3 className="text-lg font-bold text-white">Mi Rendimiento</h3>
            <p className="text-xs text-voltech-muted">Tu progreso personal del mes</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-voltech-dark/50 border border-voltech-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-voltech-cyan/20"><TrendingUp className="w-5 h-5 text-voltech-cyan" /></div>
              <div>
                <p className="text-xs text-voltech-muted">Mis Ventas</p>
                <p className="text-xl font-bold text-white">{miRank?.ventas || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-voltech-dark/50 border border-voltech-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-voltech-success/20"><DollarSign className="w-5 h-5 text-voltech-success" /></div>
              <div>
                <p className="text-xs text-voltech-muted">Mi Comisión</p>
                <p className="text-xl font-bold text-voltech-success">{miRank?.porcentajeComision || 0}%</p>
              </div>
            </div>
          </div>
          <div className="bg-voltech-dark/50 border border-voltech-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-voltech-purple/20"><Users className="w-5 h-5 text-voltech-purple" /></div>
              <div>
                <p className="text-xs text-voltech-muted">Mis Referidos</p>
                <p className="text-xl font-bold text-white">{misRef?.referidos || 0} <span className="text-xs text-voltech-purple">({misRef?.porcentaje || 0}%)</span></p>
              </div>
            </div>
          </div>
          <div className="bg-voltech-dark/50 border border-voltech-border rounded-xl p-4">
            <p className="text-xs text-voltech-muted mb-1">Mi Próxima Meta</p>
            <p className="text-xl font-bold text-white">{miRank?.ventas || 0}/{miRank?.proximaMeta || 0}</p>
            <div className="w-full h-2 bg-voltech-border rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-voltech-cyan to-voltech-purple" style={{ width: `${miRank?.progreso || 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-voltech-warning/20"><Award className="w-5 h-5 text-voltech-warning" /></div>
            <div>
              <h3 className="text-lg font-bold text-white">Bonos por Metas Alcanzadas</h3>
              <p className="text-xs text-voltech-muted">Estos bonos aparecerán automáticamente en "Pagos al Equipo" listos para aprobar.</p>
            </div>
          </div>
        </div>
        
        {bonosPendientes.length === 0 ? (
          <div className="text-center py-6 bg-voltech-dark/30 rounded-lg border border-dashed border-voltech-border">
            <Award className="w-8 h-8 mx-auto mb-2 opacity-50 text-voltech-muted" />
            <p className="text-sm text-voltech-muted">No hay bonos por metas pendientes de pago este período.</p>
            {puedeGestionar && <p className="text-xs text-voltech-muted mt-1">Haz clic en "Verificar y Generar Bonos" para revisar el progreso del equipo.</p>}
          </div>
        ) : (
          <>
          {/* ✅ Vista Card Móvil (< md) */}
          <div className="block md:hidden space-y-3 p-3">
            {bonosPendientes.map((bono) => (
              <div key={bono.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-100 truncate">{bono.producto_nombre}</h4>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{new Date(bono.fecha_registro).toLocaleDateString('es-VE')} • {bono.periodo}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-emerald-300">${Number(bono.monto_comision).toFixed(2)}</span>
                </div>
                {!esVendedor && (
                  <p className="text-[11px] text-slate-400">Vendedor: <span className="text-slate-200 font-medium">{bono.miembro_nombre}</span></p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/40">
                  {bono.estado === 'pagada' ? (
                    <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300">✅ Pagado</span>
                  ) : bono.estado === 'solicitado' ? (
                    <span className="text-[11px] px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300">⏳ Solicitado</span>
                  ) : (
                    <span className="text-[11px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-300">⏳ Pendiente</span>
                  )}
                  {bono.estado !== 'pagada' && bono.estado !== 'solicitado' && bono.miembro_nombre === (usuarioActual?.nombre || '') && (
                    <button
                      onClick={async () => {
                        try {
                          if (supabase) await supabase.from('comisiones_pendientes').update({ estado: 'solicitado' }).eq('id', bono.id);
                          setBonosPendientes(bonosPendientes.map(b => b.id === bono.id ? { ...b, estado: 'solicitado' } : b));
                          if (agregarNotificacion) {
                            agregarNotificacion({
                              tipo: 'cobro_solicitado',
                              titulo: '💰 Solicitud de cobro de bono',
                              mensaje: `${bono.miembro_nombre} solicita el cobro de $${Number(bono.monto_comision).toFixed(2)}`,
                              detalle: `${bono.producto_nombre} - Período ${bono.periodo}`,
                              usuario_id: 'admin'
                            });
                          }
                          toast.success('Solicitud enviada al administrador');
                        } catch (e) { toast.error('Error al enviar solicitud'); }
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-3 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5 shrink-0" /> Pedir Cobro
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ✅ Vista Tabla Desktop (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-voltech-dark border-b border-voltech-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Fecha</th>
                  {!esVendedor && <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Vendedor</th>}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Concepto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Período</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Monto Bono</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted">Estado</th>
                </tr>
              </thead>
              <tbody>
                {bonosPendientes.map((bono) => (
                  <tr key={bono.id} className="border-b border-voltech-border hover:bg-voltech-border/30">
                    <td className="px-4 py-3 text-sm text-white">{new Date(bono.fecha_registro).toLocaleDateString('es-VE')}</td>
                    {!esVendedor && <td className="px-4 py-3 text-sm text-white">{bono.miembro_nombre}</td>}
                    <td className="px-4 py-3 text-sm text-voltech-cyan">{bono.producto_nombre}</td>
                    <td className="px-4 py-3 text-sm text-voltech-muted">{bono.periodo}</td>
                    <td className="px-4 py-3 text-sm font-bold text-voltech-success text-right">${Number(bono.monto_comision).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      {bono.estado === 'pagada' ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-voltech-success/20 text-voltech-success">Pagado</span>
                      ) : bono.estado === 'solicitado' ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-voltech-cyan/20 text-voltech-cyan">⏳ Solicitado</span>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-voltech-warning/20 text-voltech-warning">Pendiente</span>
                          {bono.miembro_nombre === (usuarioActual?.nombre || '') && (
                            <button
                              onClick={async () => {
                                try {
                                  if (supabase) await supabase.from('comisiones_pendientes').update({ estado: 'solicitado' }).eq('id', bono.id);
                                  setBonosPendientes(bonosPendientes.map(b => b.id === bono.id ? { ...b, estado: 'solicitado' } : b));
                                  if (agregarNotificacion) {
                                    agregarNotificacion({
                                      tipo: 'cobro_solicitado',
                                      titulo: '💰 Solicitud de cobro de bono',
                                      mensaje: `${bono.miembro_nombre} solicita el cobro de $${Number(bono.monto_comision).toFixed(2)}`,
                                      detalle: `${bono.producto_nombre} - Período ${bono.periodo}`,
                                      usuario_id: 'admin'
                                    });
                                  }
                                  toast.success('Solicitud enviada al administrador');
                                } catch (e) { toast.error('Error al enviar solicitud'); }
                              }}
                              className="px-2 py-1 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-xs hover:bg-voltech-cyan/30 transition-colors flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" /> Pedir Cobro
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* 👥 RENDIMIENTO DEL EQUIPO */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-voltech-border flex items-center gap-2">
          <div className="p-2 rounded-lg bg-voltech-purple/20"><Users className="w-5 h-5 text-voltech-purple" /></div>
          <div>
            <h3 className="text-lg font-bold text-white">Rendimiento del Equipo</h3>
            <p className="text-xs text-voltech-muted">Ventas propias = comisión de venta · Compras de referidos = comisión de referido</p>
          </div>
        </div>

        {/* ✅ Vista Card Móvil (< md) */}
        <div className="block md:hidden space-y-3 p-3">
          {referidosEquipo.length === 0 ? (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-500" />
              <p className="text-xs text-slate-400">Aún no hay miembros en el equipo.</p>
            </div>
          ) : (
            referidosEquipo.map((r, index) => {
              const rank = ranking.find(x => x.nombre === r.nombre) || {};
              const isSel = miembroSeleccionado === r.nombre;
              const susClientes = clientesTodos.filter(c => (c.registradoPor || c.registrado_por) === r.nombre);
              const susVentas = ventasTodas.filter(v => v.vendedor === r.nombre);
              const ventasReferidas = ventasTodas.filter(v => v.vendedor !== r.nombre && susClientes.some(c => c.nombre === (v.clienteNombre || v.cliente || '')));
              const ventasDetalle = [
                ...susVentas.map(v => ({ ...v, _propia: true })),
                ...ventasReferidas.map(v => ({ ...v, _propia: false })),
              ];
              const cuponesUsados = susVentas.filter(v => v.cuponCodigo || v.cupon).length;
              const pagadasSet = new Set(comisionesTodas.filter(c => c.estado === 'pagada').map(c => c.venta_id));
              const comisionVentasReal = susVentas.reduce((s, v) => s + comisionDe(v, rank.porcentajeComision), 0);
              const comisionTotal = comisionVentasReal + (r.comision || 0);
              return (
                <div key={r.nombre} className={`bg-slate-800/60 border rounded-2xl p-4 space-y-3 ${isSel ? 'border-cyan-500' : 'border-slate-700/50'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                        index === 1 ? 'bg-gray-400/20 text-gray-400' :
                        index === 2 ? 'bg-orange-700/20 text-orange-700' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>#{index + 1}</span>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0">{r.nombre?.charAt(0) || '?'}</div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-100 truncate">{r.nombre}</h4>
                        <p className="text-[10px] text-slate-400 capitalize truncate">{r.rol}</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-700/40 grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-slate-400 block">Ventas:</span><span className="text-slate-200 font-bold">{rank.ventas || 0}</span></div>
                    <div><span className="text-slate-400 block">% Ventas:</span><span className="text-emerald-300 font-bold">{rank.porcentajeComision || 0}%</span></div>
                    <div><span className="text-slate-400 block">% Referidos:</span><span className="text-purple-300 font-bold">{r.porcentaje}%</span></div>
                    <div><span className="text-slate-400 block">Cupones:</span><span className="text-cyan-300 font-bold">{cuponesUsados}</span></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const sol = { id: String(Date.now()), miembro_nombre: r.nombre, monto: comisionTotal, fecha: new Date().toISOString(), estado: 'pendiente', sync: false };
                        const sols = JSON.parse(localStorage.getItem('voltech_solicitudes_pago') || '[]');
                        localStorage.setItem('voltech_solicitudes_pago', JSON.stringify([sol, ...sols]));
                        if (agregarNotificacion) {
                          agregarNotificacion({ tipo: 'solicitud_pago', categoria: 'pagos_equipo', titulo: '💰 Solicitud de pago', mensaje: `${r.nombre} solicita el pago de $${comisionTotal.toFixed(2)}`, detalle: `Ventas: ${rank.ventas || 0} | Referidos: ${r.referidos}`, usuario_id: 'admin', miembro: r.nombre });
                        }
                        window.dispatchEvent(new Event('voltech-data-updated'));
                        toast.success('Solicitud de pago enviada al administrador');
                      }}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <DollarSign className="w-3.5 h-3.5 shrink-0" /> Pedir Pago
                    </button>
                    <button onClick={() => setMiembroSeleccionado(isSel ? null : r.nombre)} className="flex-1 bg-slate-700/50 border border-slate-600 text-slate-200 font-semibold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                      Detalle <ChevronDown size={14} className={`transition-transform ${isSel ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {isSel && (
                    <div className="space-y-2 pt-2 border-t border-slate-700/40">
                      {ventasDetalle.length === 0 ? (
                        <p className="text-center text-[11px] text-slate-400 py-3">Sin ventas este período.</p>
                      ) : (
                        ventasDetalle.map((v, i) => {
                          const esPropia = v._propia;
                          const esStream = !!v.plataformas;
                          const esKit = v.esKit || (v.productos || []).some(p => p.tipo === 'kit');
                          const tipo = esStream ? 'Streaming' : esKit ? 'Kit' : 'Producto';
                          const tipoColor = esStream ? 'bg-purple-500/20 text-purple-300' : esKit ? 'bg-orange-500/20 text-orange-300' : 'bg-emerald-500/20 text-emerald-300';
                          const total = Number(v.total || 0);
                          const comVenta = esPropia ? comisionDe(v, rank.porcentajeComision) : 0;
                          const comRef = !esPropia ? total * (r.porcentaje || 0) / 100 : 0;
                          return (
                            <div key={i} className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold text-slate-100 truncate">#{v.numeroOrden || v.id?.slice(-6) || 'N/A'}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${tipoColor}`}>{tipo}</span>
                              </div>
                              <p className="text-[10px] text-slate-400">{v.fecha || (v.fechaRegistro || '').split('T')[0]}</p>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400">Comisión:</span>
                                <span className={`font-bold ${esPropia ? 'text-emerald-300' : 'text-purple-300'}`}>
                                  {esPropia ? `$${comVenta.toFixed(2)}` : `$${comRef.toFixed(2)}`}
                                </span>
                              </div>
                              {esPropia && (
                                <button onClick={() => pedirPagoVenta(v, r, comVenta)} className="w-full text-[10px] py-1.5 bg-cyan-500/10 text-cyan-300 rounded-lg hover:bg-cyan-500/20 transition-colors">Pedir pago</button>
                              )}
                            </div>
                          );
                        })
                      )}
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Vendedor</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted">Ventas</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted">% Ventas</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted">% Referidos</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted">Cupones</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {referidosEquipo.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-voltech-muted">Aún no hay miembros en el equipo.</td></tr>
              ) : (
                referidosEquipo.map((r, index) => {
                  const rank = ranking.find(x => x.nombre === r.nombre) || {};
                  const isSel = miembroSeleccionado === r.nombre;
                  const susClientes = clientesTodos.filter(c => (c.registradoPor || c.registrado_por) === r.nombre);
                  const susVentas = ventasTodas.filter(v => v.vendedor === r.nombre);
                  const ventasReferidas = ventasTodas.filter(v => v.vendedor !== r.nombre && susClientes.some(c => c.nombre === (v.clienteNombre || v.cliente || '')));
                  const ventasDetalle = [
                    ...susVentas.map(v => ({ ...v, _propia: true })),
                    ...ventasReferidas.map(v => ({ ...v, _propia: false })),
                  ];
                  const cuponesUsados = susVentas.filter(v => v.cuponCodigo || v.cupon).length;
                  const pagadasSet = new Set(comisionesTodas.filter(c => c.estado === 'pagada').map(c => c.venta_id));
                  const comisionVentasReal = susVentas.reduce((s, v) => s + comisionDe(v, rank.porcentajeComision), 0);
                  const comisionTotal = comisionVentasReal + (r.comision || 0);
                  return (
                    <Fragment key={r.nombre}>
                      <tr className={`border-b border-voltech-border transition-colors ${isSel ? 'bg-voltech-cyan/5' : 'hover:bg-voltech-border/30'}`}>
                        <td className="px-4 py-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                            index === 1 ? 'bg-gray-400/20 text-gray-400' :
                            index === 2 ? 'bg-orange-700/20 text-orange-700' :
                            'bg-voltech-muted/20 text-voltech-muted'
                          }`}>#{index + 1}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-voltech-cyan to-voltech-purple flex items-center justify-center text-white font-bold flex-shrink-0">{r.nombre?.charAt(0) || '?'}</div>
                            <div>
                              <p className="text-sm font-bold text-white">{r.nombre}</p>
                              <p className="text-xs text-voltech-muted capitalize">{r.rol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-white">{rank.ventas || 0}</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-voltech-success">{rank.porcentajeComision || 0}%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-voltech-purple">{r.porcentaje}%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-voltech-cyan">{cuponesUsados}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                const sol = { id: String(Date.now()), miembro_nombre: r.nombre, monto: comisionTotal, fecha: new Date().toISOString(), estado: 'pendiente', sync: false };
                                const sols = JSON.parse(localStorage.getItem('voltech_solicitudes_pago') || '[]');
                                localStorage.setItem('voltech_solicitudes_pago', JSON.stringify([sol, ...sols]));
                                if (agregarNotificacion) {
                                  agregarNotificacion({ tipo: 'solicitud_pago', categoria: 'pagos_equipo', titulo: '💰 Solicitud de pago', mensaje: `${r.nombre} solicita el pago de $${comisionTotal.toFixed(2)}`, detalle: `Ventas: ${rank.ventas || 0} | Referidos: ${r.referidos}`, usuario_id: 'admin', miembro: r.nombre });
                                }
                                window.dispatchEvent(new Event('voltech-data-updated'));
                                toast.success('Solicitud de pago enviada al administrador');
                              }}
                              className="px-3 py-1.5 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-xs hover:bg-voltech-cyan/30 transition-colors flex items-center gap-1"
                            >
                              <DollarSign className="w-3 h-3" /> Pedir Pago
                            </button>
                            <button onClick={() => setMiembroSeleccionado(isSel ? null : r.nombre)} className="px-3 py-1.5 bg-voltech-surface border border-voltech-border rounded-lg text-xs text-voltech-muted hover:text-white flex items-center gap-1">
                              Ver detalle <ChevronDown className={`w-3 h-3 transition-transform ${isSel ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isSel && (
                        <tr className="bg-voltech-dark/50 border-b border-voltech-border">
                          <td colSpan="7" className="px-4 py-4">
                            <div className="bg-voltech-surface border border-voltech-border rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Users className="w-4 h-4 text-voltech-cyan" />
                                <h5 className="text-xs font-bold text-voltech-muted uppercase">Detalle de Ventas - {r.nombre}</h5>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs min-w-[700px]">
                                  <thead className="border-b border-voltech-border">
                                    <tr>
                                      <th className="text-left py-2 px-2 text-voltech-muted">N° Orden</th>
                                      <th className="text-left py-2 px-2 text-voltech-muted">Fecha</th>
                                      <th className="text-left py-2 px-2 text-voltech-muted">Tipo</th>
                                      <th className="text-right py-2 px-2 text-voltech-muted">% Ventas</th>
                                      <th className="text-right py-2 px-2 text-voltech-muted">Comisión Ventas</th>
                                      <th className="text-right py-2 px-2 text-voltech-muted">% Referido</th>
                                      <th className="text-right py-2 px-2 text-voltech-muted">Comisión Referido</th>
                                      <th className="text-center py-2 px-2 text-voltech-muted">Cupón</th>
                                      <th className="text-center py-2 px-2 text-voltech-muted">Pago</th>
                                      <th className="text-center py-2 px-2 text-voltech-muted">Acción</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ventasDetalle.length === 0 ? (
                                      <tr><td colSpan="10" className="text-center py-4 text-voltech-muted">Sin ventas este período.</td></tr>
                                    ) : (
                                      ventasDetalle.map((v, i) => {
                                        const esPropia = v._propia;
                                        const esStream = !!v.plataformas;
                                        const esKit = v.esKit || (v.productos || []).some(p => p.tipo === 'kit');
                                        const tipo = esStream ? 'Streaming' : esKit ? 'Kit' : 'Producto';
                                        const tipoColor = esStream ? 'bg-voltech-purple/20 text-voltech-purple' : esKit ? 'bg-orange-500/20 text-orange-500' : 'bg-voltech-success/20 text-voltech-success';
                                        const total = Number(v.total || 0);
                                        const comVenta = esPropia ? comisionDe(v, rank.porcentajeComision) : 0;
                                        const pctVenta = total > 0 ? (comisionDe(v, rank.porcentajeComision) / total) * 100 : 0;
                                        const comRef = !esPropia ? total * (r.porcentaje || 0) / 100 : 0;
                                        const cupon = v.cuponCodigo || v.cupon;
                                        const esCuotas = v.pagoEnCuotas || v.cuotas;
                                        return (
                                          <tr key={i} className="border-b border-voltech-border/50 last:border-0 hover:bg-voltech-dark/50">
                                            <td className="py-2 px-2 text-voltech-cyan font-mono">{v.numeroOrden || v.id?.slice(-6) || 'N/A'}</td>
                                            <td className="py-2 px-2 text-voltech-muted">{v.fecha || (v.fechaRegistro || '').split('T')[0]}</td>
                                            <td className="py-2 px-2"><span className={`text-[10px] px-2 py-0.5 rounded-full ${tipoColor}`}>{tipo}</span></td>
                                            <td className="py-2 px-2 text-right text-voltech-success">{esPropia ? `${pctVenta.toFixed(1)}%` : '-'}</td>
                                            <td className="py-2 px-2 text-right text-voltech-success font-bold">{esPropia ? `$${comVenta.toFixed(2)}` : '-'}</td>
                                            <td className="py-2 px-2 text-right text-voltech-purple">{!esPropia ? `${r.porcentaje}%` : '-'}</td>
                                            <td className="py-2 px-2 text-right text-voltech-purple font-bold">{!esPropia ? `$${comRef.toFixed(2)}` : '-'}</td>
                                            <td className="py-2 px-2 text-center">{cupon ? <span className="text-voltech-warning">{cupon}</span> : <span className="text-voltech-muted">-</span>}</td>
                                            <td className="py-2 px-2 text-center">
                                              {pagadasSet.has(v.id) ? (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-voltech-success/20 text-voltech-success font-semibold">✓ Pagado</span>
                                              ) : (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-voltech-warning/20 text-voltech-warning font-semibold">⏳ Pendiente</span>
                                              )}
                                            </td>
                                            <td className="py-2 px-2 text-center">
                                              {esPropia ? (
                                                <button onClick={() => pedirPagoVenta(v, r, comVenta)} className="text-[10px] px-2 py-1 bg-voltech-cyan/20 text-voltech-cyan rounded hover:bg-voltech-cyan/30">Pedir pago</button>
                                              ) : <span className="text-voltech-muted">-</span>}
                                            </td>
                                          </tr>
                                        );
                                      })
                                    )}
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

      {/* 💬 SUGERENCIAS (se envían desde Mi Rendimiento) */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-voltech-cyan/20"><MessageCircle className="w-5 h-5 text-voltech-cyan" /></div>
          <div>
            <h3 className="text-lg font-bold text-white">Sugerencias y Comentarios</h3>
            <p className="text-xs text-voltech-muted">Envía tu propuesta al administrador</p>
          </div>
        </div>
        <div className="mb-6">
          <textarea value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)} placeholder="Ej: ¿Podemos aumentar la comisión al 7% si llego a 20 ventas este mes?" className="input-voltech w-full rounded-lg px-4 py-3 text-sm h-24 resize-none mb-2" />
          <button onClick={agregarComentario} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Enviar sugerencia</button>
        </div>
        {comentarios.filter(c => c.usuario === (usuarioActual?.nombre || '')).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Mis sugerencias</h4>
            {comentarios.filter(c => c.usuario === (usuarioActual?.nombre || '')).map(c => (
              <div key={c.id} className={`p-3 rounded-lg border text-sm ${c.aprobado ? 'bg-voltech-success/10 border-voltech-success' : c.rechazado ? 'bg-voltech-error/10 border-voltech-error' : 'bg-voltech-dark/30 border-voltech-border'}`}>
                <p className="text-voltech-muted">{c.texto}</p>
                <p className="text-xs mt-1">{c.aprobado ? '✅ Aprobada' : c.rechazado ? '❌ Rechazada' : '⏳ Pendiente'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      </>)}

      {tabMetas === 'config' && puedeGestionar && (<>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
      {puedeGestionar && (
        <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
          <button 
            onClick={() => setMostrarFormMetas(!mostrarFormMetas)}
            className="w-full p-6 flex items-center justify-between hover:bg-voltech-dark/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-voltech-purple/20">
                <Target className="w-5 h-5 text-voltech-purple" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">Configurar Metas Escalonadas</h3>
                <p className="text-xs text-voltech-muted">
                  {mostrarFormMetas ? 'Ocultar configuración' : 'Clic para gestionar porcentajes, fechas y montos de bonos'}
                </p>
              </div>
            </div>
            <motion.div animate={{ rotate: mostrarFormMetas ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <Plus className="w-5 h-5 text-voltech-muted" />
            </motion.div>
          </button>

          <AnimatePresence>
            {mostrarFormMetas && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-voltech-border p-6 bg-voltech-dark/20"
              >
                <div className="flex justify-end gap-2 mb-6">
                  <button
                    onClick={agregarMeta}
                    className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Agregar Meta
                  </button>
                  <button
                    onClick={guardarMetas}
                    className="px-4 py-2 bg-voltech-success/20 text-voltech-success rounded-lg text-sm hover:bg-voltech-success/30 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Guardar Metas
                  </button>
                </div>
                
                <div className="space-y-4">
                  {metasTemp.map((meta, index) => (
                    <div key={meta.id} className="bg-voltech-dark/50 border border-voltech-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-voltech-cyan/20 flex items-center justify-center">
                            <Target className="w-4 h-4 text-voltech-cyan" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Meta {index + 1}</p>
                            <p className="text-xs text-voltech-muted">Comisión del {meta.porcentaje}% + Bono de ${meta.bono_monto || 20} al alcanzar {meta.ventas} ventas</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => eliminarMeta(meta.id)}
                          className="text-voltech-error hover:text-voltech-error/70 p-2 rounded-lg hover:bg-voltech-error/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div>
                          <label className="block text-xs text-voltech-muted mb-2">Ventas requeridas</label>
                          <input
                            type="number" min="0" value={meta.ventas}
                            onChange={(e) => actualizarMeta(meta.id, 'ventas', parseInt(e.target.value) || 0)}
                            className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-voltech-muted mb-2">Porcentaje (%)</label>
                          <input
                            type="number" min="0" max="100" step="0.1" value={meta.porcentaje}
                            onChange={(e) => actualizarMeta(meta.id, 'porcentaje', parseFloat(e.target.value) || 0)}
                            className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-voltech-muted mb-2">Monto Bono ($)</label>
                          <input
                            type="number" min="0" step="0.01" value={meta.bono_monto || 20}
                            onChange={(e) => actualizarMeta(meta.id, 'bono_monto', parseFloat(e.target.value) || 0)}
                            className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-voltech-muted mb-2">Fecha Inicio</label>
                          <input
                            type="date" value={meta.fechaInicio || ''}
                            onChange={(e) => actualizarMeta(meta.id, 'fechaInicio', e.target.value)}
                            className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-voltech-muted mb-2">Fecha Fin</label>
                          <input
                            type="date" value={meta.fechaFin || ''}
                            onChange={(e) => actualizarMeta(meta.id, 'fechaFin', e.target.value)}
                            className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                          />
                        </div>
                        <div>
                          <CustomSelect
                            label="Estado"
                            value={meta.activo ? 'activo' : 'inactivo'}
                            onChange={(v) => actualizarMeta(meta.id, 'activo', v === 'activo')}
                            options={[
                              { value: 'activo', label: 'Activo' },
                              { value: 'inactivo', label: 'Inactivo' }
                            ]}
                            placeholder="Selecciona estado"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {/* 🎁 REFERIDOS DEL EQUIPO */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
        <button onClick={() => setMostrarReferidos(!mostrarReferidos)} className="w-full p-6 flex items-center justify-between hover:bg-voltech-dark/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-success/20"><Users className="w-5 h-5 text-voltech-success" /></div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white">Referidos del Equipo</h3>
              <p className="text-xs text-voltech-muted">
                {mostrarReferidos ? 'Ocultar configuración' : 'Clic para gestionar escala y comisiones por referidos'}
              </p>
            </div>
          </div>
          <motion.div animate={{ rotate: mostrarReferidos ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <Plus className="w-5 h-5 text-voltech-muted" />
          </motion.div>
        </button>
        {mostrarReferidos && (<>
        <div className="p-6 pt-0">

        {puedeGestionar && (
          <div className="mb-6 bg-voltech-dark/30 border border-voltech-border rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <h4 className="text-sm font-semibold text-white">📊 Escala de Comisiones por Referidos</h4>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button onClick={agregarEscala} className="w-full sm:w-auto justify-center px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2"><Plus className="w-4 h-4" /> Agregar Nivel</button>
                <button onClick={guardarEscala} className="w-full sm:w-auto justify-center px-4 py-2 bg-voltech-success/20 text-voltech-success rounded-lg text-sm hover:bg-voltech-success/30 transition-colors flex items-center gap-2"><Save className="w-4 h-4" /> Guardar Escala</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {escalaReferidos.map((nivel, idx) => (
                <div key={idx} className="bg-voltech-dark/50 border border-voltech-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-voltech-muted mb-2">Referidos</label>
                      <input type="number" min="1" value={nivel.referidos} onChange={(e) => actualizarEscala(idx, 'referidos', parseInt(e.target.value) || 0)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" />
                    </div>
                    <span className="text-voltech-muted text-sm mt-6">→</span>
                    <div className="flex-1">
                      <label className="block text-xs text-voltech-muted mb-2">Comisión (%)</label>
                      <input type="number" min="0" max="100" step="0.5" value={nivel.porcentaje} onChange={(e) => actualizarEscala(idx, 'porcentaje', parseFloat(e.target.value) || 0)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" />
                    </div>
                    <button onClick={() => eliminarEscala(idx)} className="p-2 text-voltech-error hover:bg-voltech-error/10 rounded-lg mt-6 shrink-0"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        </div>
        </>)}
      </div>
        </div>
        <div className="space-y-6">
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-voltech-cyan/20"><MessageCircle className="w-5 h-5 text-voltech-cyan" /></div>
            <div>
              <h3 className="text-lg font-bold text-white">Sugerencias y Comentarios</h3>
              <p className="text-xs text-voltech-muted">Propuestas del equipo sobre comisiones</p>
            </div>
          </div>
        </div>
        
        {!puedeGestionar && (
          <div className="mb-6">
            <textarea
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              placeholder="Ej: ¿Podemos aumentar la comisión al 7% si llego a 20 ventas este mes?"
              className="input-voltech w-full rounded-lg px-4 py-3 text-sm h-24 resize-none mb-2"
            />
            <button
              onClick={agregarComentario}
              className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" /> Enviar sugerencia
            </button>
          </div>
        )}

        {(!comentarios || comentarios.length === 0) ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50 text-voltech-muted" />
            <p className="text-sm text-voltech-muted">
              {puedeGestionar ? 'Aún no hay sugerencias del equipo' : 'No has enviado sugerencias aún'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {comentarios.map((comentario) => (
              <motion.div 
                key={comentario.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-lg border ${
                  comentario.aprobado ? 'bg-voltech-success/10 border-voltech-success' : 
                  comentario.rechazado ? 'bg-voltech-error/10 border-voltech-error' :
                  comentario.leido ? 'bg-voltech-dark/30 border-voltech-border' : 
                  'bg-voltech-cyan/5 border-voltech-cyan/30'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-voltech-muted" />
                    <span className="text-sm font-medium text-white">{comentario.usuario}</span>
                    <span className="text-xs text-voltech-muted">
                      {new Date(comentario.fecha).toLocaleDateString('es-VE')}
                    </span>
                  </div>
                  {puedeGestionar && !comentario.aprobado && !comentario.rechazado && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => aprobarComentario(comentario)} className="text-xs px-3 py-1 bg-voltech-success/20 text-voltech-success rounded hover:bg-voltech-success/30 transition-colors flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Aprobar
                      </button>
                      <button onClick={() => rechazarComentario(comentario.id)} className="text-xs px-3 py-1 bg-voltech-error/20 text-voltech-error rounded hover:bg-voltech-error/30 transition-colors flex items-center gap-1">
                        <X className="w-3 h-3" /> Rechazar
                      </button>
                    </div>
                  )}
                  {comentario.aprobado && <span className="text-xs px-2 py-1 bg-voltech-success/20 text-voltech-success rounded-full">Aprobado</span>}
                  {comentario.rechazado && <span className="text-xs px-2 py-1 bg-voltech-error/20 text-voltech-error rounded-full">Rechazado</span>}
                </div>
                <p className="text-sm text-voltech-muted">{comentario.texto}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
        </div>
      </div>
      </>)}
    </div>
  );
}