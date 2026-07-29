'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/app/context/PermissionsContext'; // ✅ NUEVO: Sistema de permisos
import { 
  DollarSign, BarChart, Target, MessageCircle, CheckCircle, 
  User, Save, Trash2, Plus, Calendar, Bell, X, TrendingUp, 
  Award, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function MetasYComisionesPage() {
  // ✅ NUEVO: Usamos el contexto de permisos en lugar de leer localStorage manualmente
  const { esAdmin, esSocio, esVendedor, usuarioActual } = usePermissions();
  const puedeGestionar = esAdmin || esSocio; // Helper para saber si puede editar

  const [mostrarFormMetas, setMostrarFormMetas] = useState(false);
  
  const [comisiones, setComisiones] = useState({
    metas: [
      { id: 1, ventas: 0, porcentaje: 3, activo: true, fechaInicio: '', fechaFin: '' },
      { id: 2, ventas: 10, porcentaje: 5, activo: true, fechaInicio: '', fechaFin: '' },
      { id: 3, ventas: 20, porcentaje: 7, activo: true, fechaInicio: '', fechaFin: '' },
    ],
    comentarios: [],
    comisionesPagadas: []
  });
  
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [metasTemp, setMetasTemp] = useState([]);
  const [showModalAprobar, setShowModalAprobar] = useState(false);
  const [comentarioSeleccionado, setComentarioSeleccionado] = useState(null);
  
  const [ranking, setRanking] = useState([]);
  const [statsReales, setStatsReales] = useState({ ventasMes: 0, metaActual: 0 });

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
        setComisiones(savedData);
        setMetasTemp(savedData.metas || []);
      } else {
        setMetasTemp(comisiones.metas);
      }

      calcularRankingYStats();
    };

    cargarDatos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Se recalcula cuando cambian las metas o el usuario

  const calcularRankingYStats = () => {
    const ventasProd = JSON.parse(localStorage.getItem('voltech_ventas') || '[]');
    const ventasStream = JSON.parse(localStorage.getItem('voltech_ventas_streaming') || '[]');
    const todasLasVentas = [...ventasProd, ...ventasStream];
    const equipo = JSON.parse(localStorage.getItem('voltech_equipo') || '[]');

    const mesActual = new Date().getMonth();
    const ventasDelMes = todasLasVentas.filter(v => new Date(v.fecha || v.fechaRegistro).getMonth() === mesActual);

    const ventasPorVendedor = {};
    ventasDelMes.forEach(v => {
      const vendedor = v.vendedor || 'Sin Asignar';
      if (!ventasPorVendedor[vendedor]) ventasPorVendedor[vendedor] = 0;
      ventasPorVendedor[vendedor] += 1;
    });

    let rankingCalculado = equipo.map(miembro => {
      const ventasCount = ventasPorVendedor[miembro.nombre] || 0;
      const metasOrdenadas = [...(comisiones.metas || [])].sort((a, b) => a.ventas - b.ventas);
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

    // ✅ FILTRAR RANKING: Si es vendedor, solo ve su propio progreso
    if (esVendedor && usuarioActual?.nombre) {
      rankingCalculado = rankingCalculado.filter(r => r.nombre === usuarioActual.nombre);
    }

    setRanking(rankingCalculado);
    
    // ✅ ESTADÍSTICAS: Vendedor ve solo sus ventas, Admin ve el total global
    const totalVentasMes = (esVendedor && usuarioActual?.nombre) 
      ? (ventasPorVendedor[usuarioActual.nombre] || 0) 
      : ventasDelMes.length;
      
    const metaObj = comisiones.metas?.find(m => m.activo) || comisiones.metas?.[comisiones.metas.length - 1];
    
    setStatsReales({
      ventasMes: totalVentasMes,
      metaActual: metaObj?.ventas || 0
    });
  };

  const guardarEnSupabaseYLocal = async (nuevosDatos) => {
    if (supabase) {
      await supabase.from('settings').upsert({ clave: 'metas_comisiones', valor: nuevosDatos }, { onConflict: 'clave' });
    }
    localStorage.setItem('voltech_comisiones', JSON.stringify(nuevosDatos));
    setComisiones(nuevosDatos);
  };

  const handleSave = async () => {
    await guardarEnSupabaseYLocal(comisiones);
    toast.success('Configuración guardada correctamente');
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

    const nuevasComisiones = {
      ...comisiones,
      comentarios: [comentario, ...comisiones.comentarios]
    };
    
    await guardarEnSupabaseYLocal(nuevasComisiones);
    setNuevoComentario('');
    toast.success('Sugerencia enviada. El admin la revisará.');
  };

  const aprobarComentario = (comentario) => {
    setComentarioSeleccionado(comentario);
    setShowModalAprobar(true);
  };

  const confirmarAprobacion = async () => {
    if (!comentarioSeleccionado) return;

    const nuevasComisiones = {
      ...comisiones,
      comentarios: comisiones.comentarios.map(c => 
        c.id === comentarioSeleccionado.id ? { ...c, aprobado: true, leido: true } : c
      )
    };
    
    await guardarEnSupabaseYLocal(nuevasComisiones);
    toast.success(`Sugerencia de ${comentarioSeleccionado.usuario} aprobada.`);
    
    const notificacion = {
      id: Date.now(),
      tipo: 'sugerencia_aprobada',
      usuario: comentarioSeleccionado.usuario,
      mensaje: `Tu sugerencia ha sido aprobada: "${comentarioSeleccionado.texto}"`,
      hora: new Date().toISOString()
    };
    
    // Guardar notificación (usando el formato correcto del contexto)
    const notificacionesGuardadas = localStorage.getItem('voltech_notificaciones');
    const notificaciones = notificacionesGuardadas ? JSON.parse(notificacionesGuardadas) : [];
    localStorage.setItem('voltech_notificaciones', JSON.stringify([notificacion, ...notificaciones]));

    setShowModalAprobar(false);
    setComentarioSeleccionado(null);
  };

  const rechazarComentario = async (id) => {
    const nuevasComisiones = {
      ...comisiones,
      comentarios: comisiones.comentarios.map(c => 
        c.id === id ? { ...c, rechazado: true, leido: true } : c
      )
    };
    await guardarEnSupabaseYLocal(nuevasComisiones);
    toast.success('Sugerencia rechazada');
  };

  const eliminarComentario = async (id) => {
    const nuevasComisiones = {
      ...comisiones,
      comentarios: comisiones.comentarios.filter(c => c.id !== id)
    };
    await guardarEnSupabaseYLocal(nuevasComisiones);
    toast.success('Comentario eliminado');
  };

  const agregarMeta = () => {
    const ultimaMeta = metasTemp[metasTemp.length - 1];
    const nuevaMeta = {
      id: Date.now(),
      ventas: (ultimaMeta?.ventas || 0) + 10,
      porcentaje: ultimaMeta?.porcentaje ? Math.min(ultimaMeta.porcentaje + 2, 15) : 7,
      activo: true,
      fechaInicio: '',
      fechaFin: ''
    };
    setMetasTemp([...metasTemp, nuevaMeta]);
    toast.success('Meta agregada. Recuerda dar clic en "Guardar Metas"');
  };

  const eliminarMeta = (id) => {
    const nuevasMetas = metasTemp.filter(m => m.id !== id);
    setMetasTemp(nuevasMetas);
    toast.success('Meta eliminada de la vista previa. Recuerda guardar.');
  };

  const actualizarMeta = (id, campo, valor) => {
    setMetasTemp(prev => prev.map(meta => 
      meta.id === id ? { ...meta, [campo]: valor } : meta
    ));
  };

  const guardarMetas = async () => {
    const nuevasComisiones = {
      ...comisiones,
      metas: [...metasTemp]
    };
    
    await guardarEnSupabaseYLocal(nuevasComisiones);
    calcularRankingYStats();
    
    toast.success('Metas actualizadas y guardadas correctamente en el sistema');
    setMostrarFormMetas(false);
  };

  const marcarComisionPagada = async (comisionId) => {
    const nuevasComisiones = {
      ...comisiones,
      comisionesPagadas: comisiones.comisionesPagadas.map(c => 
        c.id === comisionId ? { ...c, estado: 'pagada', fechaPago: new Date().toISOString() } : c
      )
    };
    await guardarEnSupabaseYLocal(nuevasComisiones);
    toast.success('Comisión marcada como pagada');
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
    toast.success('Reporte generado. ¡Envíalo por WhatsApp a tu socio!');
  };

  const comentariosNoLeidos = comisiones.comentarios?.filter(c => !c.leido).length || 0;
  const comisionActual = comisiones.metas?.[comisiones.metas.length - 1]?.porcentaje || 0;

  // ✅ Filtrar comisiones pagadas si es vendedor
  const comisionesVisibles = (esVendedor && usuarioActual?.nombre)
    ? comisiones.comisionesPagadas.filter(c => c.vendedor === usuarioActual.nombre)
    : comisiones.comisionesPagadas;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' },
        success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } },
      }} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Metas y Comisiones</h1>
          <p className="text-sm text-voltech-muted mt-1">
            {esVendedor ? 'Monitorea tu progreso y rendimiento' : 'Configura porcentajes y monitorea el rendimiento del equipo'}
          </p>
        </div>
        <div className="flex gap-3">
          {puedeGestionar && (
            <button
              onClick={generarReporteSocio}
              className="px-4 py-2 bg-voltech-surface border border-voltech-border text-voltech-cyan rounded-lg text-sm font-medium hover:bg-voltech-cyan/10 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Reporte para Socio
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

      {/* Stats Cards */}
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

      {/* 🏆 RANKING DE VENTAS DEL MES */}
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

      {/* 🎯 METAS ESCALONADAS (COLAPSABLE - SOLO ADMIN/SOCIO) */}
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
                <h3 className="text-lg font-bold text-white">Metas Escalonadas</h3>
                <p className="text-xs text-voltech-muted">
                  {mostrarFormMetas ? 'Ocultar configuración' : 'Clic para gestionar porcentajes y fechas'}
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
                            <p className="text-xs text-voltech-muted">Comisión del {meta.porcentaje}% al alcanzar {meta.ventas} ventas</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => eliminarMeta(meta.id)}
                          className="text-voltech-error hover:text-voltech-error/70 p-2 rounded-lg hover:bg-voltech-error/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

      {/* Sugerencias del Socio / Equipo */}
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

        {(!comisiones.comentarios || comisiones.comentarios.length === 0) ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50 text-voltech-muted" />
            <p className="text-sm text-voltech-muted">
              {puedeGestionar ? 'Aún no hay sugerencias del equipo' : 'No has enviado sugerencias aún'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {comisiones.comentarios.map((comentario) => (
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
                      <button onClick={() => eliminarComentario(comentario.id)} className="text-voltech-error hover:text-voltech-error/70 p-1">
                        <Trash2 className="w-4 h-4" />
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

      {/* Historial de Comisiones Pagadas (Filtrado para vendedores) */}
      {comisionesVisibles.length > 0 && (
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-voltech-success/20"><BarChart className="w-5 h-5 text-voltech-success" /></div>
              <div>
                <h3 className="text-lg font-bold text-white">Historial de Comisiones</h3>
                <p className="text-xs text-voltech-muted">
                  {esVendedor ? 'Tus comisiones registradas' : 'Registro de pagos realizados'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-voltech-dark border-b border-voltech-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Fecha</th>
                  {!esVendedor && <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Vendedor</th>}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Ventas</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Monto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Comisión</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Estado</th>
                  {puedeGestionar && <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {comisionesVisibles.map((comision) => (
                  <tr key={comision.id} className="border-b border-voltech-border hover:bg-voltech-border/30">
                    <td className="px-4 py-3 text-sm text-white">{new Date(comision.fecha).toLocaleDateString('es-VE')}</td>
                    {!esVendedor && <td className="px-4 py-3 text-sm text-white">{comision.vendedor}</td>}
                    <td className="px-4 py-3 text-sm text-white">{comision.ventas}</td>
                    <td className="px-4 py-3 text-sm text-voltech-success">${comision.monto.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-voltech-cyan">${comision.comision.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${comision.estado === 'pagada' ? 'bg-voltech-success/20 text-voltech-success' : 'bg-voltech-warning/20 text-voltech-warning'}`}>
                        {comision.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                      </span>
                    </td>
                    {puedeGestionar && (
                      <td className="px-4 py-3 text-right">
                        {comision.estado !== 'pagada' && (
                          <button onClick={() => marcarComisionPagada(comision.id)} className="text-voltech-success hover:text-voltech-success/70 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Marcar pagada
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Aprobación */}
      <AnimatePresence>
        {showModalAprobar && comentarioSeleccionado && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModalAprobar(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-voltech-surface border border-voltech-border rounded-xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4">Aprobar Sugerencia</h3>
              <p className="text-sm text-voltech-muted mb-4">
                ¿Estás seguro de aprobar esta sugerencia de <span className="text-white font-semibold">{comentarioSeleccionado.usuario}</span>?
              </p>
              <div className="p-3 bg-voltech-dark/50 border border-voltech-border rounded-lg mb-6">
                <p className="text-sm text-white">{comentarioSeleccionado.texto}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={confirmarAprobacion} className="flex-1 px-4 py-2 bg-voltech-success/20 text-voltech-success rounded-lg hover:bg-voltech-success/30 transition-colors flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Sí, Aprobar
                </button>
                <button onClick={() => setShowModalAprobar(false)} className="flex-1 px-4 py-2 bg-voltech-dark border border-voltech-border rounded-lg text-voltech-muted hover:text-white transition-colors">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}