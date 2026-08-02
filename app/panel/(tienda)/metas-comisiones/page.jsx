'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/app/context/PermissionsContext';
import { useNotificaciones } from '@/app/context/NotificationContext';
import { 
  DollarSign, BarChart, Target, MessageCircle, CheckCircle, 
  User, Save, Trash2, Plus, Calendar, Bell, X, TrendingUp, 
  Award, Download, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function MetasYComisionesPage() {
  const { esAdmin, esSocio, esVendedor, usuarioActual } = usePermissions();
  const { agregarNotificacion } = useNotificaciones();
  const puedeGestionar = esAdmin || esSocio;

  const [mostrarFormMetas, setMostrarFormMetas] = useState(false);
  const [metas, setMetas] = useState([]);
  const [metasTemp, setMetasTemp] = useState([]);
  
  const [statsReales, setStatsReales] = useState({ ventasMes: 0, metaActual: 0 });
  const [ranking, setRanking] = useState([]);
  
  const [bonosPendientes, setBonosPendientes] = useState([]);
  const [loadingBonos, setLoadingBonos] = useState(false);

  const [nuevoComentario, setNuevoComentario] = useState('');
  const [comentarios, setComentarios] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      let savedData = null;
      if (supabase) {
        const { data } = await supabase.from('settings').select('valor').eq('clave', 'metas_comisiones').single();
        if (data?.valor) savedData = data.valor;
      }
      
      if (!savedData) {
        const localData = localStorage.getItem('voltech_comisiones');
        if (localData) savedData = JSON.parse(localData);
      }

      if (savedData) {
        setMetas(savedData.metas || []);
        setMetasTemp(savedData.metas || []);
        setComentarios(savedData.comentarios || []);
      }

      await cargarDatosReales();
      await verificarBonosAutomaticamente();
    };

    cargarDatos();

    // ✅ NUEVO: Escuchar el evento de sincronización desde otros paneles (ej: Ventas Productos)
    const handleActualizacion = () => {
      cargarDatos();
    };
    window.addEventListener('voltech-data-updated', handleActualizacion);

    // Cleanup del event listener al desmontar el componente
    return () => {
      window.removeEventListener('voltech-data-updated', handleActualizacion);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatosReales = async () => {
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

    let rankingCalculado = equipo.map(miembro => {
      const ventasCount = ventasPorVendedor[miembro.nombre] || 0;
      const metasOrdenadas = [...metas].sort((a, b) => a.ventas - b.ventas);
      const proximaMeta = metasOrdenadas.find(m => m.ventas > ventasCount) || metasOrdenadas[metasOrdenadas.length - 1];
      const progreso = proximaMeta ? Math.min((ventasCount / proximaMeta.ventas) * 100, 100) : 100;

      return {
        nombre: miembro.nombre,
        rol: miembro.rol,
        ventas: ventasCount,
        proximaMeta: proximaMeta?.ventas || 0,
        porcentajeComision: proximaMeta?.porcentaje || 0,
        progreso: progreso
      };
    }).sort((a, b) => b.ventas - a.ventas);

    if (esVendedor && usuarioActual?.nombre) {
      rankingCalculado = rankingCalculado.filter(r => r.nombre === usuarioActual.nombre);
    }

    setRanking(rankingCalculado);
    
    const totalVentasMes = (esVendedor && usuarioActual?.nombre) 
      ? (ventasPorVendedor[usuarioActual.nombre] || 0) 
      : ventasDelMes.length;
      
    const metaObj = metas?.find(m => m.activo) || metas?.[metas.length - 1];
    
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
    await cargarDatosReales();
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

  const comentariosNoLeidos = comentarios?.filter(c => !c.leido).length || 0;
  const comisionActual = metas?.[metas.length - 1]?.porcentaje || 0;

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
        <div className="flex gap-3">
          {puedeGestionar && (
            <button
              onClick={verificarBonosAutomaticamente}
              disabled={loadingBonos}
              className="px-4 py-2 bg-voltech-success/20 text-voltech-success border border-voltech-success/30 rounded-lg text-sm font-medium hover:bg-voltech-success/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loadingBonos ? 'Verificando...' : <><CheckCircle className="w-4 h-4" /> Verificar y Generar Bonos</>}
            </button>
          )}
          {puedeGestionar && (
            <button
              onClick={generarReporteSocio}
              className="px-4 py-2 bg-voltech-surface border border-voltech-border text-voltech-cyan rounded-lg text-sm font-medium hover:bg-voltech-cyan/10 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Reporte PDF
            </button>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Guardar Configuración
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-cyan/20"><DollarSign className="w-5 h-5 text-voltech-cyan" /></div>
            <div>
              <p className="text-xs text-voltech-muted">Comisión máxima actual</p>
              <p className="text-lg font-bold text-white">{comisionActual}%</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-purple/20"><BarChart className="w-5 h-5 text-voltech-purple" /></div>
            <div>
              <p className="text-xs text-voltech-muted">Ventas este mes</p>
              <p className="text-lg font-bold text-white">{statsReales.ventasMes}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-success/20"><Target className="w-5 h-5 text-voltech-success" /></div>
            <div>
              <p className="text-xs text-voltech-muted">Meta global actual</p>
              <p className="text-lg font-bold text-white">{statsReales.metaActual} ventas</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-warning/20"><Bell className="w-5 h-5 text-voltech-warning" /></div>
            <div>
              <p className="text-xs text-voltech-muted">Sugerencias pendientes</p>
              <p className="text-lg font-bold text-white">{comentariosNoLeidos}</p>
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
          <div className="text-center py-8 bg-voltech-dark/30 rounded-lg border border-dashed border-voltech-border">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-50 text-voltech-muted" />
            <p className="text-sm text-voltech-muted">No hay bonos por metas pendientes de pago este período.</p>
            {puedeGestionar && <p className="text-xs text-voltech-muted mt-1">Haz clic en "Verificar y Generar Bonos" para revisar el progreso del equipo.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                      <span className={`text-xs px-2 py-1 rounded-full ${bono.estado === 'pagada' ? 'bg-voltech-success/20 text-voltech-success' : 'bg-voltech-warning/20 text-voltech-warning'}`}>
                        {bono.estado === 'pagada' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-voltech-warning/20"><Award className="w-5 h-5 text-voltech-warning" /></div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {esVendedor ? 'Tu Progreso del Mes' : 'Ranking de Ventas del Mes'}
            </h3>
            <p className="text-xs text-voltech-muted">Progreso hacia la siguiente meta</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {ranking.length === 0 ? (
            <p className="text-center text-voltech-muted py-4">Aún no hay ventas registradas este mes.</p>
          ) : (
            ranking.map((r, index) => (
              <div key={r.nombre} className="bg-voltech-dark/50 border border-voltech-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {!esVendedor && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-500' : 
                        index === 1 ? 'bg-gray-400/20 text-gray-400' : 
                        'bg-orange-700/20 text-orange-700'
                      }`}>
                        #{index + 1}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{r.nombre}</p>
                      <p className="text-xs text-voltech-muted">{r.ventas} ventas realizadas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-voltech-cyan">{r.porcentajeComision}% Comisión</p>
                    <p className="text-xs text-voltech-muted">Meta: {r.proximaMeta} vtas</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-voltech-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-voltech-cyan to-voltech-purple transition-all duration-500"
                    style={{ width: `${r.progreso}%` }}
                  ></div>
                </div>
                <p className="text-xs text-voltech-muted mt-1 text-right">{r.progreso.toFixed(0)}% completado</p>
              </div>
            ))
          )}
        </div>
      </div>

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
                          <label className="block text-xs text-voltech-muted mb-2">Estado</label>
                          <select
                            value={meta.activo ? 'activo' : 'inactivo'}
                            onChange={(e) => actualizarMeta(meta.id, 'activo', e.target.value === 'activo')}
                            className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                          >
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                          </select>
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
  );
}