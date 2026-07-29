'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // ✅ NUEVO: Conexión a Supabase
import {
  Building2, Plus, Search, Edit3, Trash2, X, Save,
  Phone, Mail, Globe, MapPin, Clock, DollarSign,
  Users, MessageCircle, CheckCircle, ChevronDown, ChevronUp,
  Package, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([]);
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCiudad, setFilterCiudad] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const ciudades = [
    'Caracas', 'Valencia', 'Maracaibo', 'Barquisimeto',
    'Maracay', 'Ciudad Guayana', 'San Cristóbal', 'Maturín',
    'Barcelona', 'Mérida', 'Otra'
  ];

  const tiposProductos = [
    'Electrónica', 'Accesorios', 'Streaming', 'Componentes',
    'Cables', 'Audio', 'Celulares', 'Computación', 'Otro'
  ];

  const tasasDisponibles = ['BCV', 'BINANCE', 'Efectivo USD'];

  const [formData, setFormData] = useState({
    nombre: '',
    ciudad: 'Caracas',
    tipo_productos: 'Electrónica',
    sitio_web: '',
    email: '',
    estado: 'activo',
    direccion: '',
    horario: '',
    tasas_aceptadas: ['BCV'],
    monto_minimo: 0,
    cantidad_minima: 0,
    asesores: [{ nombre: '', cargo: '', telefono: '', email: '', whatsapp: true }],
    notas: ''
  });

  // ✅ ACTUALIZADO: Carga desde Supabase con fallback a localStorage
  useEffect(() => {
    const cargarProveedores = async () => {
      let data = [];

      if (supabase) {
        const { data: supaData, error } = await supabase
          .from('proveedores')
          .select('*')
          .order('fecha_creacion', { ascending: false });
        
        if (!error && supaData) {
          data = supaData;
        }
      }

      // Fallback a localStorage si no hay datos en Supabase
      if (data.length === 0) {
        const guardados = localStorage.getItem('voltech_proveedores');
        if (guardados) {
          try {
            const parsed = JSON.parse(guardados);
            if (Array.isArray(parsed)) {
              data = parsed;
            }
          } catch (e) {
            console.error('Error al cargar proveedores:', e);
          }
        }
      }

      setProveedores(data);
    };

    cargarProveedores();
  }, []);

  // ✅ ACTUALIZADO: Guarda en Supabase y localStorage
  const guardarProveedores = async (nuevos) => {
    if (supabase) {
      await supabase.from('proveedores').upsert(nuevos, { onConflict: 'id' });
    }
    localStorage.setItem('voltech_proveedores', JSON.stringify(nuevos));
    setProveedores(nuevos);
  };

  const resetForm = () => {
    setFormData({
      nombre: '', ciudad: 'Caracas', tipo_productos: 'Electrónica',
      sitio_web: '', email: '', estado: 'activo',
      direccion: '', horario: '',
      tasas_aceptadas: ['BCV'], monto_minimo: 0, cantidad_minima: 0,
      asesores: [{ nombre: '', cargo: '', telefono: '', email: '', whatsapp: true }],
      notas: ''
    });
    setProveedorEditando(null);
    setShowForm(false);
  };

  // ✅ ACTUALIZADO: Maneja creación y edición con Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      toast.error('El nombre del proveedor es obligatorio');
      return;
    }
    if (formData.asesores.some(a => !a.nombre.trim())) {
      toast.error('Todos los asesores deben tener nombre');
      return;
    }

    const nuevo = {
      id: proveedorEditando ? proveedorEditando.id : `prov-${Date.now()}`,
      ...formData,
      fecha_creacion: proveedorEditando?.fecha_creacion || new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    };

    if (proveedorEditando) {
      const actualizados = proveedores.map(p => p.id === proveedorEditando.id ? nuevo : p);
      await guardarProveedores(actualizados);
      toast.success('Proveedor actualizado');
    } else {
      await guardarProveedores([...proveedores, nuevo]);
      toast.success('Proveedor creado exitosamente');
    }
    resetForm();
  };

  const handleEditar = (proveedor) => {
    setProveedorEditando(proveedor);
    setFormData({
      nombre: proveedor.nombre || '',
      ciudad: proveedor.ciudad || 'Caracas',
      tipo_productos: proveedor.tipo_productos || 'Electrónica',
      sitio_web: proveedor.sitio_web || '',
      email: proveedor.email || '',
      estado: proveedor.estado || 'activo',
      direccion: proveedor.direccion || '',
      horario: proveedor.horario || '',
      tasas_aceptadas: proveedor.tasas_aceptadas || ['BCV'],
      monto_minimo: proveedor.monto_minimo || 0,
      cantidad_minima: proveedor.cantidad_minima || 0,
      asesores: (proveedor.asesores && proveedor.asesores.length > 0) 
        ? proveedor.asesores 
        : [{ nombre: '', cargo: '', telefono: '', email: '', whatsapp: true }],
      notas: proveedor.notas || ''
    });
    setShowForm(true);
  };

  // ✅ ACTUALIZADO: Elimina de Supabase y localStorage
  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;
    if (supabase) {
      await supabase.from('proveedores').delete().eq('id', id);
    }
    const filtrados = proveedores.filter(p => p.id !== id);
    localStorage.setItem('voltech_proveedores', JSON.stringify(filtrados));
    setProveedores(filtrados);
    toast.success('Proveedor eliminado');
  };

  // ✅ ACTUALIZADO: Cambia estado en Supabase y localStorage
  const toggleEstado = async (proveedor) => {
    const nuevoEstado = proveedor.estado === 'activo' ? 'inactivo' : 'activo';
    if (supabase) {
      await supabase.from('proveedores').update({ 
        estado: nuevoEstado, 
        fecha_actualizacion: new Date().toISOString() 
      }).eq('id', proveedor.id);
    }
    const actualizados = proveedores.map(p =>
      p.id === proveedor.id ? { ...p, estado: nuevoEstado } : p
    );
    localStorage.setItem('voltech_proveedores', JSON.stringify(actualizados));
    setProveedores(actualizados);
    toast.success(nuevoEstado === 'activo' ? 'Proveedor activado' : 'Proveedor desactivado');
  };

  const agregarAsesor = () => {
    setFormData({
      ...formData,
      asesores: [...formData.asesores, { nombre: '', cargo: '', telefono: '', email: '', whatsapp: true }]
    });
  };

  const eliminarAsesor = (index) => {
    if (formData.asesores.length <= 1) {
      toast.error('Debe haber al menos un asesor');
      return;
    }
    const nuevos = formData.asesores.filter((_, i) => i !== index);
    setFormData({ ...formData, asesores: nuevos });
  };

  const actualizarAsesor = (index, campo, valor) => {
    const nuevos = formData.asesores.map((a, i) => i === index ? { ...a, [campo]: valor } : a);
    setFormData({ ...formData, asesores: nuevos });
  };

  const toggleTasa = (tasa) => {
    const actuales = formData.tasas_aceptadas || [];
    if (actuales.includes(tasa)) {
      setFormData({ ...formData, tasas_aceptadas: actuales.filter(t => t !== tasa) });
    } else {
      setFormData({ ...formData, tasas_aceptadas: [...actuales, tasa] });
    }
  };

  const abrirWhatsApp = (telefono) => {
    if (!telefono) return;
    const limpio = telefono.replace(/\D/g, '');
    const numero = limpio.startsWith('58') ? limpio : `58${limpio}`;
    window.open(`https://wa.me/${numero}`, '_blank');
  };

  const abrirEmail = (email) => {
    if (!email) return;
    window.open(`mailto:${email}`, '_blank');
  };

  // ✅ Estadísticas con validaciones
  const totalProveedores = proveedores?.length || 0;
  const activos = proveedores?.filter(p => p?.estado === 'activo').length || 0;
  const inactivos = proveedores?.filter(p => p?.estado === 'inactivo').length || 0;
  const ciudadesUnicas = [...new Set(proveedores?.map(p => p?.ciudad).filter(Boolean) || [])].length;
  const totalContactos = proveedores?.reduce((acc, p) => acc + (p?.asesores?.length || 0), 0) || 0;

  // ✅ Filtrado con validaciones robustas
  const proveedoresFiltrados = (proveedores || []).filter(p => {
    if (!p) return false;
    
    const searchLower = searchTerm.toLowerCase();
    
    const coincideBusqueda =
      (p.nombre?.toLowerCase().includes(searchLower) || false) ||
      (p.ciudad?.toLowerCase().includes(searchLower) || false) ||
      (p.tipo_productos?.toLowerCase().includes(searchLower) || false) ||
      (p.asesores?.some(a =>
        (a.nombre?.toLowerCase().includes(searchLower) || false) ||
        (a.telefono?.includes(searchTerm) || false)
      ) || false);

    if (activeTab === 'todos') return coincideBusqueda && p.estado === 'activo';
    if (activeTab === 'ciudad') return coincideBusqueda && p.estado === 'activo' && (!filterCiudad || p.ciudad === filterCiudad);
    if (activeTab === 'inactivos') return coincideBusqueda && p.estado === 'inactivo';
    return coincideBusqueda;
  });

  return (
    <div className="space-y-6">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' },
        success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } },
      }} />

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Proveedores</h1>
          <p className="text-sm text-voltech-muted mt-1">Gestiona tus proveedores nacionales y sus contactos comerciales</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nuevo Proveedor
        </button>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-cyan/20"><Building2 className="w-5 h-5 text-voltech-cyan" /></div>
            <div><p className="text-xs text-voltech-muted">Total Proveedores</p><p className="text-xl font-bold text-white">{totalProveedores}</p></div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-success/20"><CheckCircle className="w-5 h-5 text-voltech-success" /></div>
            <div><p className="text-xs text-voltech-muted">Activos</p><p className="text-xl font-bold text-white">{activos}</p></div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-purple/20"><MapPin className="w-5 h-5 text-voltech-purple" /></div>
            <div><p className="text-xs text-voltech-muted">Ciudades</p><p className="text-xl font-bold text-white">{ciudadesUnicas}</p></div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-warning/20"><Users className="w-5 h-5 text-voltech-warning" /></div>
            <div><p className="text-xs text-voltech-muted">Contactos Totales</p><p className="text-xl font-bold text-white">{totalContactos}</p></div>
          </div>
        </div>
      </div>

      {/* PESTAÑAS */}
      <div className="border-b border-voltech-border">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('todos')}
            className={`pb-3 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'todos' ? 'text-voltech-cyan border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" /> Todos los Proveedores
          </button>
          <button
            onClick={() => setActiveTab('ciudad')}
            className={`pb-3 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'ciudad' ? 'text-voltech-cyan border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" /> Por Ciudad
          </button>
          <button
            onClick={() => setActiveTab('inactivos')}
            className={`pb-3 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'inactivos' ? 'text-voltech-cyan border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'
            }`}
          >
            <AlertCircle className="w-4 h-4" /> Inactivos
            {inactivos > 0 && (
              <span className="bg-voltech-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{inactivos}</span>
            )}
          </button>
        </div>
      </div>

      {/* FORMULARIO */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-voltech-cyan" />
                  {proveedorEditando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h2>
                <button onClick={resetForm} className="p-2 hover:bg-voltech-border rounded-lg transition-colors">
                  <X className="w-5 h-5 text-voltech-muted" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información General */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-voltech-cyan" /> Información General
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-voltech-muted mb-1">Nombre del Proveedor *</label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                        placeholder="Ej: VOLTECH ASIA SUPPLY"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1">Ciudad *</label>
                      <select
                        value={formData.ciudad}
                        onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                        className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                      >
                        {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1">Tipo de Productos *</label>
                      <select
                        value={formData.tipo_productos}
                        onChange={(e) => setFormData({ ...formData, tipo_productos: e.target.value })}
                        className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                      >
                        {tiposProductos.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1">Sitio Web</label>
                      <input
                        type="text"
                        value={formData.sitio_web}
                        onChange={(e) => setFormData({ ...formData, sitio_web: e.target.value })}
                        className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1">Email de Contacto</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                        placeholder="contacto@..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-voltech-muted mb-2">Estado</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="estado"
                            checked={formData.estado === 'activo'}
                            onChange={() => setFormData({ ...formData, estado: 'activo' })}
                            className="w-4 h-4 text-voltech-cyan"
                          />
                          <span className="text-sm text-white">Activo</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="estado"
                            checked={formData.estado === 'inactivo'}
                            onChange={() => setFormData({ ...formData, estado: 'inactivo' })}
                            className="w-4 h-4 text-voltech-cyan"
                          />
                          <span className="text-sm text-white">Inactivo</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ubicación y Horario */}
                <div className="border-t border-voltech-border pt-6">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-voltech-purple" /> Ubicación y Horario
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-voltech-muted mb-1">Dirección Física</label>
                      <textarea
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        className="input-voltech w-full rounded-lg px-4 py-2 text-sm h-20 resize-none"
                        placeholder="Av. Francisco de Miranda, Centro Comercial X, Local 12, Chacao, Caracas"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-voltech-muted mb-1">Horario de Atención</label>
                      <input
                        type="text"
                        value={formData.horario}
                        onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                        className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                        placeholder="Lun-Vie 8:00 AM - 5:00 PM | Sáb 9:00 AM - 1:00 PM"
                      />
                    </div>
                  </div>
                </div>

                {/* Condiciones Comerciales */}
                <div className="border-t border-voltech-border pt-6">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-voltech-success" /> Condiciones Comerciales
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-voltech-muted mb-2">Tasas que Aceptan *</label>
                      <div className="flex flex-wrap gap-2">
                        {tasasDisponibles.map(tasa => (
                          <button
                            key={tasa}
                            type="button"
                            onClick={() => toggleTasa(tasa)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                              (formData.tasas_aceptadas || []).includes(tasa)
                                ? 'bg-voltech-cyan/20 border-voltech-cyan text-voltech-cyan'
                                : 'bg-voltech-dark/30 border-voltech-border text-voltech-muted hover:border-voltech-cyan/50'
                            }`}
                          >
                            {tasa}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-voltech-muted mb-1">Monto Mínimo ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.monto_minimo}
                          onChange={(e) => setFormData({ ...formData, monto_minimo: parseFloat(e.target.value) || 0 })}
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                          placeholder="100.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-voltech-muted mb-1">Cantidad Mínima (unidades)</label>
                        <input
                          type="number"
                          value={formData.cantidad_minima}
                          onChange={(e) => setFormData({ ...formData, cantidad_minima: parseInt(e.target.value) || 0 })}
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                          placeholder="10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Asesores */}
                <div className="border-t border-voltech-border pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-voltech-warning" /> Asesores / Contactos
                    </h3>
                    <button
                      type="button"
                      onClick={agregarAsesor}
                      className="px-3 py-1.5 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-xs hover:bg-voltech-cyan/30 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Agregar Asesor
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(formData.asesores || []).map((asesor, index) => (
                      <div key={index} className="bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-voltech-cyan">Asesor {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => eliminarAsesor(index)}
                            className="p-1 text-voltech-error hover:bg-voltech-error/10 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-voltech-muted mb-1">Nombre *</label>
                            <input
                              type="text"
                              value={asesor.nombre || ''}
                              onChange={(e) => actualizarAsesor(index, 'nombre', e.target.value)}
                              className="input-voltech w-full rounded-lg px-3 py-2 text-sm"
                              placeholder="Nombre del asesor"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-voltech-muted mb-1">Cargo</label>
                            <input
                              type="text"
                              value={asesor.cargo || ''}
                              onChange={(e) => actualizarAsesor(index, 'cargo', e.target.value)}
                              className="input-voltech w-full rounded-lg px-3 py-2 text-sm"
                              placeholder="Ej: Gerente de Ventas"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-voltech-muted mb-1">Teléfono *</label>
                            <input
                              type="tel"
                              value={asesor.telefono || ''}
                              onChange={(e) => actualizarAsesor(index, 'telefono', e.target.value)}
                              className="input-voltech w-full rounded-lg px-3 py-2 text-sm"
                              placeholder="+58 412 1234567"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-voltech-muted mb-1">Email</label>
                            <input
                              type="email"
                              value={asesor.email || ''}
                              onChange={(e) => actualizarAsesor(index, 'email', e.target.value)}
                              className="input-voltech w-full rounded-lg px-3 py-2 text-sm"
                              placeholder="asesor@..."
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={asesor.whatsapp || false}
                                onChange={(e) => actualizarAsesor(index, 'whatsapp', e.target.checked)}
                                className="w-4 h-4 rounded border-voltech-border bg-voltech-dark text-voltech-cyan"
                              />
                              <span className="text-sm text-white">Tiene WhatsApp</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notas */}
                <div className="border-t border-voltech-border pt-6">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4 text-voltech-muted" /> Notas Adicionales
                  </h3>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="input-voltech w-full rounded-lg px-4 py-2 text-sm h-24 resize-none"
                    placeholder="Información adicional sobre el proveedor, tiempos de entrega, condiciones de pago, etc."
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4 border-t border-voltech-border">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 rounded-lg font-medium bg-voltech-surface border border-voltech-border text-voltech-muted hover:text-white hover:border-voltech-cyan/50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-neon flex-1 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {proveedorEditando ? 'Guardar Cambios' : 'Guardar Proveedor'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar proveedor, asesor, ciudad o tipo de producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-voltech w-full rounded-lg pl-10 pr-4 py-3 text-sm"
          />
        </div>
        {activeTab === 'ciudad' && (
          <select
            value={filterCiudad}
            onChange={(e) => setFilterCiudad(e.target.value)}
            className="input-voltech rounded-lg px-4 py-3 text-sm min-w-[200px]"
          >
            <option value="">Todas las ciudades</option>
            {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* LISTA DE PROVEEDORES */}
      <div className="space-y-4">
        {proveedoresFiltrados.length === 0 ? (
          <div className="bg-voltech-surface border border-voltech-border rounded-xl p-12 text-center">
            <Building2 className="w-16 h-16 text-voltech-muted mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-semibold text-white mb-2">No hay proveedores</h3>
            <p className="text-voltech-muted text-sm">
              {searchTerm ? 'No se encontraron resultados para tu búsqueda' : 'Comienza creando tu primer proveedor'}
            </p>
          </div>
        ) : (
          proveedoresFiltrados.map(proveedor => {
            const isExpanded = expandedId === proveedor.id;
            return (
              <div
                key={proveedor.id}
                className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden hover:border-voltech-cyan/30 transition-colors"
              >
                {/* Header de la card */}
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : proveedor.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-voltech-cyan" />
                          {proveedor.nombre || 'Sin nombre'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          proveedor.estado === 'activo'
                            ? 'bg-voltech-success/20 text-voltech-success'
                            : 'bg-voltech-muted/20 text-voltech-muted'
                        }`}>
                          {proveedor.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-voltech-muted">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {proveedor.ciudad || 'Sin ciudad'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" /> {proveedor.tipo_productos || 'Sin tipo'}
                        </span>
                        {proveedor.sitio_web && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-4 h-4" /> {proveedor.sitio_web}
                          </span>
                        )}
                        {proveedor.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" /> {proveedor.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="p-2 text-voltech-muted hover:text-voltech-cyan transition-colors">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Contenido expandido */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-voltech-border"
                    >
                      <div className="p-6 space-y-6">
                        {/* Dirección y Horario */}
                        {(proveedor.direccion || proveedor.horario) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {proveedor.direccion && (
                              <div className="bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
                                <h4 className="text-xs font-semibold text-voltech-muted mb-2 flex items-center gap-2">
                                  <MapPin className="w-4 h-4" /> Dirección
                                </h4>
                                <p className="text-sm text-white">{proveedor.direccion}</p>
                              </div>
                            )}
                            {proveedor.horario && (
                              <div className="bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
                                <h4 className="text-xs font-semibold text-voltech-muted mb-2 flex items-center gap-2">
                                  <Clock className="w-4 h-4" /> Horario
                                </h4>
                                <p className="text-sm text-white">{proveedor.horario}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Condiciones Comerciales */}
                        <div className="bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
                          <h4 className="text-xs font-semibold text-voltech-muted mb-3 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Condiciones Comerciales
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-voltech-muted mb-2">Tasas Aceptadas:</p>
                              <div className="flex flex-wrap gap-2">
                                {(proveedor.tasas_aceptadas || []).map(tasa => (
                                  <span key={tasa} className="px-2 py-1 bg-voltech-cyan/20 text-voltech-cyan rounded text-xs font-medium">
                                    {tasa}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                              <div>
                                <p className="text-xs text-voltech-muted">Monto Mínimo</p>
                                <p className="text-sm font-bold text-voltech-success">
                                  ${(proveedor.monto_minimo || 0).toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-voltech-muted">Cantidad Mínima</p>
                                <p className="text-sm font-bold text-voltech-success">
                                  {proveedor.cantidad_minima || 0} unidades
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Asesores */}
                        {proveedor.asesores && proveedor.asesores.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-voltech-muted mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4" /> Asesores ({proveedor.asesores.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {proveedor.asesores.map((asesor, idx) => (
                                <div key={idx} className="bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <p className="text-sm font-semibold text-white">{asesor.nombre || 'Sin nombre'}</p>
                                      {asesor.cargo && <p className="text-xs text-voltech-muted">{asesor.cargo}</p>}
                                    </div>
                                    {asesor.whatsapp && asesor.telefono && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); abrirWhatsApp(asesor.telefono); }}
                                        className="p-2 bg-voltech-success/20 text-voltech-success rounded-lg hover:bg-voltech-success/30 transition-colors"
                                        title="Enviar WhatsApp"
                                      >
                                        <MessageCircle className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="space-y-1 text-xs">
                                    <p className="text-voltech-muted flex items-center gap-1">
                                      <Phone className="w-3 h-3" /> {asesor.telefono || 'Sin teléfono'}
                                    </p>
                                    {asesor.email && (
                                      <p className="text-voltech-muted flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> {asesor.email}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notas */}
                        {proveedor.notas && (
                          <div className="bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
                            <h4 className="text-xs font-semibold text-voltech-muted mb-2">Notas</h4>
                            <p className="text-sm text-white whitespace-pre-wrap">{proveedor.notas}</p>
                          </div>
                        )}

                        {/* Acciones */}
                        <div className="flex items-center justify-end gap-2 pt-4 border-t border-voltech-border">
                          <button
                            onClick={() => proveedor.email && abrirEmail(proveedor.email)}
                            disabled={!proveedor.email}
                            className="px-3 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-xs hover:bg-voltech-cyan/30 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Mail className="w-4 h-4" /> Email
                          </button>
                          <button
                            onClick={() => handleEditar(proveedor)}
                            className="px-3 py-2 bg-voltech-purple/20 text-voltech-purple rounded-lg text-xs hover:bg-voltech-purple/30 transition-colors flex items-center gap-1"
                          >
                            <Edit3 className="w-4 h-4" /> Editar
                          </button>
                          <button
                            onClick={() => toggleEstado(proveedor)}
                            className={`px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                              proveedor.estado === 'activo'
                                ? 'bg-voltech-warning/20 text-voltech-warning hover:bg-voltech-warning/30'
                                : 'bg-voltech-success/20 text-voltech-success hover:bg-voltech-success/30'
                            }`}
                          >
                            {proveedor.estado === 'activo' ? (
                              <><AlertCircle className="w-4 h-4" /> Desactivar</>
                            ) : (
                              <><CheckCircle className="w-4 h-4" /> Activar</>
                            )}
                          </button>
                          <button
                            onClick={() => handleEliminar(proveedor.id)}
                            className="px-3 py-2 bg-voltech-error/20 text-voltech-error rounded-lg text-xs hover:bg-voltech-error/30 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}