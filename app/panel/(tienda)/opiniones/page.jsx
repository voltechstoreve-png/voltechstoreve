'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // ✅ NUEVO: Conexión a Supabase
import { useTheme } from '@/app/context/ThemeContext';
import { 
  MessageSquare, Star, Search, Trash2, Edit, CheckCircle, 
  X, User, Calendar, Clock, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from '@/components/CustomSelect';
import toast, { Toaster } from 'react-hot-toast';

export default function OpinionesPage() {
  const { darkMode } = useTheme();
  
  const [opiniones, setOpiniones] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingOpinion, setEditingOpinion] = useState(null);
  const [filterEstado, setFilterEstado] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    rating: 5,
    comentario: '',
    producto: '',
    estado: 'pendiente',
    fecha: new Date().toISOString()
  });

  // ✅ ACTUALIZADO: Carga desde Supabase con fallback a localStorage
  useEffect(() => {
    const cargarOpiniones = async () => {
      let opinionesData = [];
      
      if (supabase) {
        const { data, error } = await supabase
          .from('opiniones')
          .select('*')
          .order('fecha', { ascending: false });
        
        if (!error && data) {
          opinionesData = data;
        }
      }

      // Fallback a localStorage si no hay datos en Supabase
      if (opinionesData.length === 0) {
        const opinionesGuardadas = localStorage.getItem('voltech_opiniones');
        if (opinionesGuardadas) {
          opinionesData = JSON.parse(opinionesGuardadas);
        }
      }
      
      setOpiniones(opinionesData);
    };

    cargarOpiniones();
  }, []);

  // ✅ ACTUALIZADO: Guarda en Supabase y localStorage
  const guardarOpiniones = async (nuevasOpiniones) => {
    if (supabase) {
      await supabase.from('opiniones').upsert(nuevasOpiniones, { onConflict: 'id' });
    }
    localStorage.setItem('voltech_opiniones', JSON.stringify(nuevasOpiniones));
    setOpiniones(nuevasOpiniones);
  };

  // ✅ ACTUALIZADO: Maneja creación y edición con Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.comentario) {
      toast.error('Nombre y comentario son obligatorios');
      return;
    }

    const opinionData = editingOpinion 
      ? { ...formData, id: editingOpinion.id }
      : { id: `opinion-${Date.now()}`, ...formData };

    if (editingOpinion) {
      const actualizadas = opiniones.map(o => o.id === editingOpinion.id ? opinionData : o);
      await guardarOpiniones(actualizadas);
      toast.success('Opinión actualizada');
    } else {
      await guardarOpiniones([...opiniones, opinionData]);
      toast.success('Opinión agregada');
    }

    setShowModal(false);
    setEditingOpinion(null);
    setFormData({
      nombre: '',
      correo: '',
      rating: 5,
      comentario: '',
      producto: '',
      estado: 'pendiente',
      fecha: new Date().toISOString()
    });
  };

  // ✅ ACTUALIZADO: Elimina de Supabase y localStorage
  const eliminarOpinion = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta opinión?')) {
      if (supabase) {
        await supabase.from('opiniones').delete().eq('id', id);
      }
      const filtradas = opiniones.filter(o => o.id !== id);
      localStorage.setItem('voltech_opiniones', JSON.stringify(filtradas));
      setOpiniones(filtradas);
      toast.success('Opinión eliminada');
    }
  };

  // ✅ ACTUALIZADO: Cambia estado en Supabase y localStorage
  const cambiarEstado = async (opinion, nuevoEstado) => {
    const actualizadas = opiniones.map(o => 
      o.id === opinion.id ? { ...o, estado: nuevoEstado } : o
    );
    await guardarOpiniones(actualizadas);
    toast.success(`Opinión ${nuevoEstado === 'aprobada' ? 'aprobada' : 'rechazada'}`);
  };

  const getTotalOpiniones = () => opiniones.length;
  const getPendientes = () => opiniones.filter(o => o.estado === 'pendiente').length;
  const getAprobadas = () => opiniones.filter(o => o.estado === 'aprobada').length;
  const getPromedio = () => {
    if (opiniones.length === 0) return '0.0';
    return (opiniones.reduce((sum, o) => sum + o.rating, 0) / opiniones.length).toFixed(1);
  };

  const opinionesFiltradas = opiniones.filter(opinion => {
    const matchEstado = filterEstado === 'todas' || opinion.estado === filterEstado;
    const matchSearch = opinion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       opinion.producto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       opinion.correo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchEstado && matchSearch;
  });

  return (
    <div className="min-h-screen bg-voltech-dark text-white">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: { 
            background: '#12121a', 
            color: '#fff', 
            border: '1px solid #1e1e2e',
            borderRadius: '8px'
          },
          success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } },
        }}
      />
      
      <div className="w-full max-w-full space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Opiniones</h1>
            <p className="text-xs sm:text-sm text-voltech-muted mt-0.5">Gestión de reseñas y comentarios de clientes</p>
          </div>
        </div>

        {/* Grid de Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full mb-4">
          <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4 flex items-center gap-3">
            <div className="p-2.5 md:p-2 rounded-xl md:rounded-lg bg-blue-500/10 md:bg-blue-500/20 text-blue-400 md:text-blue-600 shrink-0 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 md:flex-none">
              <p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Total Opiniones</p>
              <p className="text-base md:text-xl font-bold text-white mt-0.5 md:mt-0 truncate">{getTotalOpiniones()}</p>
            </div>
          </div>
          <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4 flex items-center gap-3">
            <div className="p-2.5 md:p-2 rounded-xl md:rounded-lg bg-yellow-500/10 md:bg-yellow-500/20 text-yellow-400 md:text-yellow-600 shrink-0 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 md:flex-none">
              <p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Pendientes</p>
              <p className="text-base md:text-xl font-bold text-white mt-0.5 md:mt-0 truncate">{getPendientes()}</p>
            </div>
          </div>
          <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4 flex items-center gap-3">
            <div className="p-2.5 md:p-2 rounded-xl md:rounded-lg bg-green-500/10 md:bg-green-500/20 text-green-400 md:text-green-600 shrink-0 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 md:flex-none">
              <p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Aprobadas</p>
              <p className="text-base md:text-xl font-bold text-white mt-0.5 md:mt-0 truncate">{getAprobadas()}</p>
            </div>
          </div>
          <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4 flex items-center gap-3">
            <div className="p-2.5 md:p-2 rounded-xl md:rounded-lg bg-purple-500/10 md:bg-purple-500/20 text-purple-400 md:text-purple-600 shrink-0 flex items-center justify-center">
              <Star className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 md:flex-none">
              <p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Promedio</p>
              <p className="text-base md:text-xl font-bold text-white mt-0.5 md:mt-0 truncate">{getPromedio()}</p>
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="flex flex-col gap-3 w-full mb-4 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
          <div className="flex flex-col gap-2 w-full">
            <span className="text-xs text-slate-400 font-medium">Filtrar por estado:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full no-scrollbar">
              {['todas', 'pendiente', 'aprobada', 'rechazada'].map(estado => (
                <button
                  key={estado}
                  onClick={() => setFilterEstado(estado)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    filterEstado === estado
                      ? 'bg-voltech-purple text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {estado.charAt(0).toUpperCase() + estado.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o producto..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        {/* Tabla de Opiniones - IGUAL QUE SORTEOS */}
        <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden w-full">
          {/* ✅ Vista Card Móvil (< md) */}
          <div className="block md:hidden space-y-3 p-3">
            {opinionesFiltradas.length === 0 ? (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-center">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                <p className="text-xs text-slate-400">No hay opiniones</p>
              </div>
            ) : (
              opinionesFiltradas.map(opinion => (
                <div key={opinion.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {opinion.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-100 truncate">{opinion.nombre}</h4>
                        {opinion.correo && <p className="text-[10px] text-slate-400 truncate">{opinion.correo}</p>}
                      </div>
                    </div>
                    <span className={`shrink-0 text-[10px] px-2 py-1 rounded-full font-medium ${
                      opinion.estado === 'aprobada' ? 'bg-emerald-500/20 text-emerald-300' :
                      opinion.estado === 'rechazada' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {opinion.estado}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-700/40">
                    <p className="text-[11px] text-slate-400 mb-1">Producto: <span className="text-slate-200">{opinion.producto || 'Sin producto'}</span></p>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{opinion.comentario}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 text-[11px]">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className={`w-3 h-3 ${star <= opinion.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-500'}`} />
                      ))}
                      <span className="text-slate-400 ml-1">{opinion.rating}/5</span>
                    </div>
                    <span className="text-slate-400 font-mono">{new Date(opinion.fecha).toLocaleDateString('es-VE')}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700/40">
                    {opinion.estado === 'pendiente' && (
                      <>
                        <button onClick={() => cambiarEstado(opinion, 'aprobada')} className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-300 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors">
                          <CheckCircle size={14} /> Aprobar
                        </button>
                        <button onClick={() => cambiarEstado(opinion, 'rechazada')} className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-rose-300 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-colors">
                          <X size={14} /> Rechazar
                        </button>
                      </>
                    )}
                    <button onClick={() => { setEditingOpinion(opinion); setFormData(opinion); setShowModal(true); }} className="p-2 text-slate-400 hover:text-cyan-400" title="Editar"><Edit size={16} /></button>
                    <button onClick={() => eliminarOpinion(opinion.id)} className="p-2 text-slate-400 hover:text-rose-400" title="Eliminar"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ✅ Vista Tabla Desktop (>= md) */}
          <div className="hidden md:block overflow-x-auto w-full">
            <table className="w-full">
              <thead className="bg-voltech-dark border-b border-voltech-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-voltech-muted uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-voltech-muted uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-voltech-muted uppercase tracking-wider">
                    Calificación
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-voltech-muted uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-voltech-muted uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-voltech-muted uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-voltech-border">
                {opinionesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-voltech-cyan/20 mb-4">
                        <MessageSquare className="w-8 h-8 text-voltech-cyan" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">No hay opiniones {filterEstado !== 'todas' ? filterEstado : ''}</h3>
                      <p className="text-voltech-muted text-sm">
                        {filterEstado === 'todas' ? 'Las opiniones aparecerán aquí cuando los clientes las envíen' : 'No hay opiniones con este estado'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  opinionesFiltradas.map(opinion => (
                    <tr key={opinion.id} className="hover:bg-voltech-cyan/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-voltech-cyan to-voltech-purple flex items-center justify-center text-white font-bold">
                            {opinion.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{opinion.nombre}</p>
                            {opinion.correo && <p className="text-xs text-voltech-muted">{opinion.correo}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white text-sm">{opinion.producto || 'Sin producto'}</p>
                          <p className="text-xs text-voltech-muted mt-1 line-clamp-2 max-w-xs">{opinion.comentario}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= opinion.rating ? 'text-yellow-400 fill-yellow-400' : 'text-voltech-muted'}`}
                            />
                          ))}
                          <span className="text-xs text-voltech-muted ml-2">{opinion.rating}/5</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          opinion.estado === 'aprobada'
                            ? 'bg-voltech-success/20 text-voltech-success'
                            : opinion.estado === 'rechazada'
                            ? 'bg-voltech-error/20 text-voltech-error'
                            : 'bg-voltech-warning/20 text-voltech-warning'
                        }`}>
                          {opinion.estado === 'aprobada' && <CheckCircle className="w-3 h-3" />}
                          {opinion.estado === 'rechazada' && <X className="w-3 h-3" />}
                          {opinion.estado === 'pendiente' && <Clock className="w-3 h-3" />}
                          {opinion.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-voltech-muted">
                        {new Date(opinion.fecha).toLocaleDateString('es-VE')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {opinion.estado === 'pendiente' && (
                            <>
                              <button
                                onClick={() => cambiarEstado(opinion, 'aprobada')}
                                className="p-2 hover:bg-voltech-success/20 rounded-lg transition-colors group"
                                title="Aprobar"
                              >
                                <CheckCircle className="w-4 h-4 text-voltech-success group-hover:scale-110 transition-transform" />
                              </button>
                              <button
                                onClick={() => cambiarEstado(opinion, 'rechazada')}
                                className="p-2 hover:bg-voltech-error/20 rounded-lg transition-colors group"
                                title="Rechazar"
                              >
                                <X className="w-4 h-4 text-voltech-error group-hover:scale-110 transition-transform" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => { setEditingOpinion(opinion); setFormData(opinion); setShowModal(true); }}
                            className="p-2 hover:bg-voltech-cyan/20 rounded-lg transition-colors group"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4 text-voltech-cyan group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => eliminarOpinion(opinion.id)}
                            className="p-2 hover:bg-voltech-error/20 rounded-lg transition-colors group"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-voltech-error group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal para Editar Opinión */}
        <AnimatePresence>
          {showModal && editingOpinion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-voltech-surface border border-voltech-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-voltech-border flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Editar Opinión</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-voltech-border rounded-lg transition-colors">
                    <X className="w-5 h-5 text-voltech-muted" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-voltech-muted mb-2">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-voltech-muted mb-2">
                        Correo
                      </label>
                      <input
                        type="email"
                        value={formData.correo}
                        onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                        className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-voltech-muted mb-2">
                      Calificación *
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className="p-1"
                        >
                          <Star
                            className={`w-8 h-8 ${star <= formData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-voltech-muted'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-voltech-muted mb-2">
                      Producto (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.producto}
                      onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
                      className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                      placeholder="Nombre del producto"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-voltech-muted mb-2">
                      Comentario *
                    </label>
                    <textarea
                      value={formData.comentario}
                      onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                      rows={4}
                      className="input-voltech w-full rounded-lg px-4 py-3 text-sm resize-none"
                      required
                    />
                  </div>

                  <div>
                    <CustomSelect
                      label="Estado"
                      value={formData.estado}
                      onChange={(v) => setFormData({ ...formData, estado: v })}
                      options={[
                        { value: 'pendiente', label: 'Pendiente' },
                        { value: 'aprobada', label: 'Aprobada' },
                        { value: 'rechazada', label: 'Rechazada' }
                      ]}
                      placeholder="Selecciona estado"
                      className="w-full"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-voltech-border">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="w-full sm:w-auto px-6 py-3 rounded-lg font-medium bg-voltech-surface border border-voltech-border text-voltech-muted hover:text-white hover:border-voltech-cyan/50 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-neon flex-1 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all"
                    > 
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}