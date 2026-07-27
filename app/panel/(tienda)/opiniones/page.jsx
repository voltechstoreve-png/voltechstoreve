'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'default-no-store';

import { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { 
  MessageSquare, Star, Search, Trash2, Edit, CheckCircle, 
  X, User, Calendar, Clock, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  useEffect(() => {
    const opinionesGuardadas = localStorage.getItem('voltech_opiniones');
    if (opinionesGuardadas) {
      setOpiniones(JSON.parse(opinionesGuardadas));
    }
  }, []);

  const guardarOpiniones = (nuevasOpiniones) => {
    localStorage.setItem('voltech_opiniones', JSON.stringify(nuevasOpiniones));
    setOpiniones(nuevasOpiniones);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.comentario) {
      toast.error('Nombre y comentario son obligatorios');
      return;
    }

    if (editingOpinion) {
      const actualizadas = opiniones.map(o => 
        o.id === editingOpinion.id ? { ...formData, id: editingOpinion.id } : o
      );
      guardarOpiniones(actualizadas);
      toast.success('Opinión actualizada');
    } else {
      const nuevaOpinion = {
        id: `opinion-${Date.now()}`,
        ...formData
      };
      guardarOpiniones([...opiniones, nuevaOpinion]);
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

  const eliminarOpinion = (id) => {
    if (confirm('¿Estás seguro de eliminar esta opinión?')) {
      guardarOpiniones(opiniones.filter(o => o.id !== id));
      toast.success('Opinión eliminada');
    }
  };

  const cambiarEstado = (opinion, nuevoEstado) => {
    const actualizadas = opiniones.map(o => 
      o.id === opinion.id ? { ...o, estado: nuevoEstado } : o
    );
    guardarOpiniones(actualizadas);
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
      
      <div className="w-full space-y-6 p-6">
        {/* Header - IGUAL QUE SORTEOS */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Opiniones</h1>
            <p className="text-sm text-voltech-muted mt-1">
              Gestión de reseñas y comentarios de clientes
            </p>
          </div>
          {/* ✅ ELIMINADO: Botón "Agregar Opinión" */}
        </div>

        {/* Grid de Métricas - 4 COLUMNAS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-voltech-surface border border-voltech-border rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-voltech-muted">Total Opiniones</p>
                <p className="text-lg font-bold text-white">{getTotalOpiniones()}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-voltech-surface border border-voltech-border rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-voltech-muted">Pendientes</p>
                <p className="text-lg font-bold text-white">{getPendientes()}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-voltech-surface border border-voltech-border rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-voltech-muted">Aprobadas</p>
                <p className="text-lg font-bold text-white">{getAprobadas()}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-voltech-surface border border-voltech-border rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-voltech-muted">Promedio</p>
                <p className="text-lg font-bold text-white">{getPromedio()}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-voltech-muted">Filtrar por estado:</span>
              {['todas', 'pendiente', 'aprobada', 'rechazada'].map(estado => (
                <button
                  key={estado}
                  onClick={() => setFilterEstado(estado)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterEstado === estado
                      ? 'bg-voltech-purple text-white'
                      : 'bg-voltech-dark text-voltech-muted hover:bg-voltech-border'
                  }`}
                >
                  {estado.charAt(0).toUpperCase() + estado.slice(1)}
                </button>
              ))}
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-voltech-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o producto..."
                className="input-voltech w-full pl-10 pr-4 py-2 text-sm rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Tabla de Opiniones - IGUAL QUE SORTEOS */}
        <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
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
                    <label className="block text-sm font-medium text-voltech-muted mb-2">
                      Estado
                    </label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="aprobada">Aprobada</option>
                      <option value="rechazada">Rechazada</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-voltech-border">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 rounded-lg font-medium bg-voltech-surface border border-voltech-border text-voltech-muted hover:text-white hover:border-voltech-cyan/50 transition-all"
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