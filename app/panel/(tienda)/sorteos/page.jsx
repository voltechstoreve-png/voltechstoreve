'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { 
  Gift, Plus, Users, X, Search, Check, Clock,
  Edit, Trash2, Play, Calendar, Eye, Settings, 
  Trophy, QrCode, Copy, Sparkles, Ticket, Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

// Componente personalizado de búsqueda de productos
function ProductSearchSelect({ productos, seleccionados, onChange, maxSeleccion, modo }) {
  const [busqueda, setBusqueda] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const productosFiltrados = productos.filter(p => 
    p.publicado && 
    !seleccionados.includes(p.id) &&
    ((p.producto || '').toLowerCase().includes(busqueda.toLowerCase()) ||
     (p.marca || '').toLowerCase().includes(busqueda.toLowerCase()) ||
     (p.id || '').toLowerCase().includes(busqueda.toLowerCase()))
  );

  const handleSeleccionar = (producto) => {
    if (modo === 'fijo') {
      onChange([producto.id]);
    } else {
      if (seleccionados.length < maxSeleccion) {
        onChange([...seleccionados, producto.id]);
      } else {
        toast.error(`Máximo ${maxSeleccion} productos permitidos`);
      }
    }
    setBusqueda('');
    setIsOpen(false);
  };

  const handleRemover = (productoId) => {
    onChange(seleccionados.filter(id => id !== productoId));
  };

  return (
    <div className="space-y-3">
      {seleccionados.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {seleccionados.map(id => {
            const prod = productos.find(p => p.id === id);
            if (!prod) return null;
            return (
              <div key={id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-voltech-cyan/20 border border-voltech-cyan/50 rounded-lg text-sm">
                <span className="text-voltech-cyan font-medium truncate max-w-[200px]">{prod.producto || 'Producto sin nombre'}</span>
                <button onClick={() => handleRemover(id)} className="p-0.5 hover:bg-voltech-cyan/30 rounded transition-colors">
                  <X className="w-3 h-3 text-voltech-cyan" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="relative" ref={wrapperRef}>
        <div className="input-voltech w-full rounded-lg px-4 py-3 text-sm flex items-center gap-2 cursor-pointer border border-voltech-border bg-voltech-surface hover:border-voltech-cyan/50 transition-colors" onClick={() => setIsOpen(!isOpen)}>
          <Search className="w-4 h-4 text-voltech-muted" />
          <span className="text-voltech-muted flex-1">
            {modo === 'fijo' && seleccionados.length > 0 
              ? (productos.find(p => p.id === seleccionados[0])?.producto || 'Producto seleccionado')
              : modo === 'votacion' && seleccionados.length > 0
              ? `${seleccionados.length} producto${seleccionados.length > 1 ? 's' : ''} seleccionado${seleccionados.length > 1 ? 's' : ''}`
              : 'Buscar producto por nombre, marca o SKU...'}
          </span>
          <X className="w-4 h-4 text-voltech-muted cursor-pointer hover:text-white" onClick={(e) => { e.stopPropagation(); onChange([]); }} />
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 w-full mt-2 bg-voltech-surface border border-voltech-border rounded-lg shadow-xl max-h-64 overflow-y-auto">
              <div className="sticky top-0 bg-voltech-surface border-b border-voltech-border p-3">
                <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Escribir para buscar..." className="w-full bg-voltech-dark border border-voltech-border rounded px-3 py-2 text-sm text-white placeholder-voltech-muted focus:outline-none focus:border-voltech-cyan" autoFocus />
              </div>
              {productosFiltrados.length === 0 ? (
                <div className="p-4 text-center text-voltech-muted text-sm">{busqueda ? 'No se encontraron productos' : 'Escribe para buscar productos'}</div>
              ) : (
                <div className="divide-y divide-voltech-border">
                  {productosFiltrados.map(producto => (
                    <button key={producto.id} onClick={() => handleSeleccionar(producto)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-voltech-cyan/10 transition-colors text-left group">
                      <div className="w-10 h-10 bg-voltech-dark rounded-lg flex items-center justify-center flex-shrink-0">
                        {producto.imagen ? <img src={producto.imagen} alt={producto.producto || 'Producto'} className="w-full h-full object-cover rounded-lg" /> : <Gift className="w-5 h-5 text-voltech-muted" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{producto.producto || 'Sin nombre'}</p>
                        <p className="text-voltech-muted text-xs mt-0.5">{producto.marca || 'Sin marca'} • {producto.categoria || 'Sin categoría'} • ${producto.precioDetal || '0.00'}</p>
                      </div>
                      <Check className="w-4 h-4 text-voltech-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {modo === 'votacion' && (
        <p className={`text-xs ${seleccionados.length >= 2 ? 'text-voltech-success' : 'text-voltech-error'}`}>
          {seleccionados.length}/5 productos seleccionados (mínimo 2 requeridos)
        </p>
      )}
    </div>
  );
}

export default function PanelSorteosPage() {
  const { darkMode } = useTheme();
  
  const [sorteos, setSorteos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [participantes, setParticipantes] = useState([]);
  const [activeTab, setActiveTab] = useState('activos'); // 'activos', 'finalizados', 'configuracion'
  
  const [showForm, setShowForm] = useState(false);
  const [sorteoEditando, setSorteoEditando] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showParticipantes, setShowParticipantes] = useState(false);
  const [sorteoActual, setSorteoActual] = useState(null);
  const [showGanador, setShowGanador] = useState(false);
  const [ganadorData, setGanadorData] = useState(null);

  const [configGlobal, setConfigGlobal] = useState({
    ticketsBase: 1,
    bonusCompra: 2,
    bonusReferido: 2,
    duracionDescuento: 30,
    requiereCompraMinima: false,
    montoMinimo: 50
  });

  const [formData, setFormData] = useState({
    titulo: '',
    tipo_sorteo: 'fijo', // 'fijo', 'votacion', 'descuento'
    producto_id: '',
    productos_candidatos: [],
    porcentaje_descuento: 20,
    restricciones: '',
    fecha_fin: '',
    descripcion: '',
    estado: 'activo',
    configuracion: { ...configGlobal }
  });

  useEffect(() => {
    const sorteosGuardados = localStorage.getItem('voltech_sorteos');
    const productosGuardados = localStorage.getItem('voltech_productos');
    const participantesGuardados = localStorage.getItem('voltech_participantes');
    const configGuardada = localStorage.getItem('voltech_config_sorteos');

    if (sorteosGuardados) setSorteos(JSON.parse(sorteosGuardados));
    if (productosGuardados) setProductos(JSON.parse(productosGuardados));
    if (participantesGuardados) setParticipantes(JSON.parse(participantesGuardados));
    if (configGuardada) {
      const config = JSON.parse(configGuardada);
      setConfigGlobal(config);
      setFormData(prev => ({ ...prev, configuracion: config }));
    }
  }, []);

  const guardarSorteos = (nuevosSorteos) => {
    localStorage.setItem('voltech_sorteos', JSON.stringify(nuevosSorteos));
    setSorteos(nuevosSorteos);
  };

  const guardarConfigGlobal = () => {
    localStorage.setItem('voltech_config_sorteos', JSON.stringify(configGlobal));
    setFormData(prev => ({ ...prev, configuracion: configGlobal }));
    toast.success('Configuración global guardada');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.fecha_fin) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    if (formData.tipo_sorteo === 'fijo' && !formData.producto_id) {
      toast.error('Selecciona un producto para el sorteo fijo');
      return;
    }

    if (formData.tipo_sorteo === 'votacion' && formData.productos_candidatos.length < 2) {
      toast.error('Selecciona al menos 2 productos para la votación');
      return;
    }

    if (formData.tipo_sorteo === 'descuento' && (!formData.porcentaje_descuento || formData.porcentaje_descuento <= 0)) {
      toast.error('Ingresa un porcentaje de descuento válido');
      return;
    }

    const nuevoSorteo = {
      id: sorteoEditando ? sorteoEditando.id : `sorteo-${Date.now()}`,
      ...formData,
      fecha_creacion: sorteoEditando?.fecha_creacion || new Date().toISOString(),
      ganador: sorteoEditando?.ganador || null
    };

    if (sorteoEditando) {
      const actualizados = sorteos.map(s => s.id === sorteoEditando.id ? nuevoSorteo : s);
      guardarSorteos(actualizados);
      toast.success('Sorteo actualizado correctamente');
    } else {
      guardarSorteos([...sorteos, nuevoSorteo]);
      toast.success('Sorteo creado y publicado exitosamente');
    }

    setShowForm(false);
    setSorteoEditando(null);
    setFormData({
      titulo: '', tipo_sorteo: 'fijo', producto_id: '', productos_candidatos: [],
      porcentaje_descuento: 20, restricciones: '', fecha_fin: '', descripcion: '', estado: 'activo',
      configuracion: { ...configGlobal }
    });
  };

  const handleEditar = (sorteo) => {
    setSorteoEditando(sorteo);
    setFormData({
      titulo: sorteo.titulo,
      tipo_sorteo: sorteo.tipo_sorteo,
      producto_id: sorteo.producto_id || '',
      productos_candidatos: sorteo.productos_candidatos || [],
      porcentaje_descuento: sorteo.porcentaje_descuento || 20,
      restricciones: sorteo.restricciones || '',
      fecha_fin: sorteo.fecha_fin,
      descripcion: sorteo.descripcion || '',
      estado: sorteo.estado,
      configuracion: sorteo.configuracion || { ...configGlobal }
    });
    setShowForm(true);
  };

  const handleEliminar = (id) => {
    if (confirm('¿Estás seguro de eliminar este sorteo?')) {
      guardarSorteos(sorteos.filter(s => s.id !== id));
      toast.success('Sorteo eliminado correctamente');
    }
  };

  const handleSortearGanador = (sorteo) => {
    const participantesDelSorteo = participantes.filter(p => p.sorteo_id === sorteo.id);
    if (participantesDelSorteo.length === 0) {
      toast.error('No hay participantes para sortear un ganador');
      return;
    }

    if (confirm(`¿Estás seguro de finalizar el sorteo y elegir un ganador al azar entre ${participantesDelSorteo.length} participantes?`)) {
      const ganador = participantesDelSorteo[Math.floor(Math.random() * participantesDelSorteo.length)];
      
      let codigoPremio = '';
      if (sorteo.tipo_sorteo === 'descuento') {
        codigoPremio = `DISCOUNT${sorteo.porcentaje_descuento}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      } else {
        codigoPremio = `PREMIO-${sorteo.id.split('-')[1].substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      }

      const sorteoActualizado = {
        ...sorteo,
        estado: 'finalizado',
        ganador: {
          participante_id: ganador.id,
          nombre: ganador.nombre,
          telefono: ganador.telefono,
          numero_ticket: ganador.numero_ticket,
          codigo_premio: codigoPremio,
          estado_canje: 'pendiente'
        }
      };

      const sorteosActualizados = sorteos.map(s => s.id === sorteo.id ? sorteoActualizado : s);
      guardarSorteos(sorteosActualizados);
      
      setGanadorData(sorteoActualizado.ganador);
      setShowGanador(true);
      toast.success('¡Sorteo finalizado y ganador seleccionado!');
    }
  };

  const handleVerParticipantes = (sorteo) => {
    setSorteoActual(sorteo);
    setShowParticipantes(true);
  };

  const getParticipantesCount = (sorteoId) => participantes.filter(p => p.sorteo_id === sorteoId).length;
  const getParticipantesBySorteo = (sorteoId) => participantes.filter(p => p.sorteo_id === sorteoId);
  
  const getTotalSorteos = () => sorteos.length;
  const getSorteosActivos = () => sorteos.filter(s => s.estado === 'activo').length;
  const getSorteosFinalizados = () => sorteos.filter(s => s.estado === 'finalizado').length;
  const getTotalParticipantes = () => participantes.length;

  const sorteosFiltrados = sorteos.filter(sorteo => {
    const coincideEstado = activeTab === 'activos' ? sorteo.estado === 'activo' : sorteo.estado === 'finalizado';
    const coincideBusqueda = sorteo.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participantes.some(p => p.sorteo_id === sorteo.id && (p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.telefono.includes(searchTerm)));
    return coincideEstado && coincideBusqueda;
  });

  const getNombrePremio = (sorteo) => {
    if (sorteo.tipo_sorteo === 'descuento') return `${sorteo.porcentaje_descuento}% de Descuento`;
    if (sorteo.tipo_sorteo === 'fijo' && sorteo.producto_id) return productos.find(p => p.id === sorteo.producto_id)?.producto || 'Producto Fijo';
    if (sorteo.tipo_sorteo === 'votacion') return 'Votación Comunitaria';
    return 'Premio';
  };

  return (
    <div className="min-h-screen bg-voltech-dark text-white">
      <Toaster position="top-right" toastOptions={{ style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e', borderRadius: '8px' }, success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } }, error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } } }} />
      
      <div className="w-full space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Sorteos</h1>
            <p className="text-sm text-voltech-muted mt-1">Gestiona sorteos, votaciones y premios de tu tienda</p>
          </div>
          {activeTab !== 'configuracion' && (
            <button onClick={() => setShowForm(true)} className="btn-neon bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-lg px-4 py-2 text-sm font-medium hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" /> Crear Sorteo
            </button>
          )}
        </div>

        {/* Grid de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
            <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-voltech-cyan/20"><Gift className="w-5 h-5 text-voltech-cyan" /></div><div><p className="text-xs text-voltech-muted">Total Sorteos</p><p className="text-lg font-bold text-white">{getTotalSorteos()}</p></div></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
            <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-voltech-success/20"><Check className="w-5 h-5 text-voltech-success" /></div><div><p className="text-xs text-voltech-muted">Sorteos Activos</p><p className="text-lg font-bold text-white">{getSorteosActivos()}</p></div></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
            <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-voltech-warning/20"><Clock className="w-5 h-5 text-voltech-warning" /></div><div><p className="text-xs text-voltech-muted">Finalizados</p><p className="text-lg font-bold text-white">{getSorteosFinalizados()}</p></div></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
            <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-voltech-purple/20"><Users className="w-5 h-5 text-voltech-purple" /></div><div><p className="text-xs text-voltech-muted">Total Participantes</p><p className="text-lg font-bold text-white">{getTotalParticipantes()}</p></div></div>
          </motion.div>
        </div>

        {/* Pestañas de Navegación (Estilo Streaming) */}
        <div className="border-b border-voltech-border">
          <div className="flex gap-6">
            <button onClick={() => setActiveTab('activos')} className={`pb-3 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'activos' ? 'text-voltech-cyan border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'}`}>
              <Play className="w-4 h-4" /> Sorteos Activos
            </button>
            <button onClick={() => setActiveTab('finalizados')} className={`pb-3 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'finalizados' ? 'text-voltech-cyan border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'}`}>
              <Check className="w-4 h-4" /> Finalizados
            </button>
            <button onClick={() => setActiveTab('configuracion')} className={`pb-3 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'configuracion' ? 'text-voltech-cyan border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'}`}>
              <Settings className="w-4 h-4" /> Configuración Global
            </button>
          </div>
        </div>

        {/* CONTENIDO: CONFIGURACIÓN GLOBAL */}
        {activeTab === 'configuracion' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Ticket className="w-5 h-5 text-voltech-cyan" /> Configuración por Defecto de Tickets</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-xs text-voltech-muted mb-1">Tickets Base (por registrarse)</label><input type="number" min="1" value={configGlobal.ticketsBase} onChange={(e) => setConfigGlobal({...configGlobal, ticketsBase: parseInt(e.target.value) || 1})} className="input-voltech w-full rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-voltech-muted mb-1">Bonus por Código de Compra</label><input type="number" min="0" value={configGlobal.bonusCompra} onChange={(e) => setConfigGlobal({...configGlobal, bonusCompra: parseInt(e.target.value) || 0})} className="input-voltech w-full rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-voltech-muted mb-1">Bonus por Código de Referido</label><input type="number" min="0" value={configGlobal.bonusReferido} onChange={(e) => setConfigGlobal({...configGlobal, bonusReferido: parseInt(e.target.value) || 0})} className="input-voltech w-full rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Percent className="w-5 h-5 text-voltech-purple" /> Configuración de Descuentos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-xs text-voltech-muted mb-1">Duración del descuento (días)</label><input type="number" min="1" value={configGlobal.duracionDescuento} onChange={(e) => setConfigGlobal({...configGlobal, duracionDescuento: parseInt(e.target.value) || 30})} className="input-voltech w-full rounded-lg px-3 py-2 text-sm" /></div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={configGlobal.requiereCompraMinima} onChange={(e) => setConfigGlobal({...configGlobal, requiereCompraMinima: e.target.checked})} className="w-4 h-4 rounded border-voltech-border bg-voltech-dark text-voltech-cyan" />
                    <span className="text-sm text-voltech-muted">Requiere compra mínima</span>
                  </label>
                </div>
                {configGlobal.requiereCompraMinima && (
                  <div><label className="block text-xs text-voltech-muted mb-1">Monto Mínimo ($)</label><input type="number" min="0" step="0.01" value={configGlobal.montoMinimo} onChange={(e) => setConfigGlobal({...configGlobal, montoMinimo: parseFloat(e.target.value) || 0})} className="input-voltech w-full rounded-lg px-3 py-2 text-sm" /></div>
                )}
              </div>
              <button onClick={guardarConfigGlobal} className="mt-6 btn-neon text-white font-bold py-2 px-6 rounded-lg hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all">Guardar Configuración Global</button>
            </div>
          </motion.div>
        )}

        {/* CONTENIDO: LISTA DE SORTEOS (Activos o Finalizados) */}
        {activeTab !== 'configuracion' && (
          <>
            {/* Formulario Desplegable */}
            <AnimatePresence>
              {showForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                  <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-white">{sorteoEditando ? 'Editar Sorteo' : 'Crear Nuevo Sorteo'}</h2>
                      <button onClick={() => { setShowForm(false); setSorteoEditando(null); }} className="p-2 hover:bg-voltech-border rounded-lg transition-colors"><X className="w-5 h-5 text-voltech-muted" /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-voltech-muted mb-2">Título del Sorteo *</label>
                          <input type="text" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" placeholder="Ej: Sorteo Especial Mes del Padre" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-voltech-muted mb-2">Fecha y Hora de Finalización *</label>
                          <input type="datetime-local" value={formData.fecha_fin} onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" required />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-voltech-muted mb-3">Tipo de Sorteo y Premio</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                          <button type="button" onClick={() => setFormData({ ...formData, tipo_sorteo: 'fijo', productos_candidatos: [], porcentaje_descuento: 0 })} className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${formData.tipo_sorteo === 'fijo' ? 'border-voltech-cyan bg-voltech-cyan/20 text-voltech-cyan' : 'border-voltech-border text-voltech-muted hover:border-voltech-cyan/50'}`}>
                            <Gift className="w-5 h-5" /><span className="text-sm font-medium">Producto Fijo</span>
                          </button>
                          <button type="button" onClick={() => setFormData({ ...formData, tipo_sorteo: 'votacion', producto_id: '', porcentaje_descuento: 0 })} className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${formData.tipo_sorteo === 'votacion' ? 'border-voltech-purple bg-voltech-purple/20 text-voltech-purple' : 'border-voltech-border text-voltech-muted hover:border-voltech-purple/50'}`}>
                            <Users className="w-5 h-5" /><span className="text-sm font-medium">Votación</span>
                          </button>
                          <button type="button" onClick={() => setFormData({ ...formData, tipo_sorteo: 'descuento', producto_id: '', productos_candidatos: [] })} className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${formData.tipo_sorteo === 'descuento' ? 'border-voltech-success bg-voltech-success/20 text-voltech-success' : 'border-voltech-border text-voltech-muted hover:border-voltech-success/50'}`}>
                            <Percent className="w-5 h-5" /><span className="text-sm font-medium">Descuento Especial</span>
                          </button>
                        </div>

                        {/* Campos dinámicos según el tipo */}
                        {formData.tipo_sorteo === 'fijo' && (
                          <div><label className="block text-sm font-medium text-voltech-muted mb-2">Producto a Sortear *</label><ProductSearchSelect productos={productos} seleccionados={formData.producto_id ? [formData.producto_id] : []} onChange={(ids) => setFormData({ ...formData, producto_id: ids[0] || '' })} maxSeleccion={1} modo="fijo" /></div>
                        )}
                        
                        {formData.tipo_sorteo === 'votacion' && (
                          <div><label className="block text-sm font-medium text-voltech-muted mb-2">Productos Candidatos *</label><ProductSearchSelect productos={productos} seleccionados={formData.productos_candidatos} onChange={(ids) => setFormData({ ...formData, productos_candidatos: ids })} maxSeleccion={5} modo="votacion" /></div>
                        )}

                        {formData.tipo_sorteo === 'descuento' && (
                          <div className="space-y-4 bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
                            <div>
                              <label className="block text-sm font-medium text-voltech-muted mb-2">Porcentaje de Descuento (%) *</label>
                              <input type="number" min="1" max="100" value={formData.porcentaje_descuento} onChange={(e) => setFormData({ ...formData, porcentaje_descuento: parseInt(e.target.value) || 0 })} className="input-voltech w-full md:w-1/3 rounded-lg px-4 py-3 text-sm" placeholder="Ej: 20" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-voltech-muted mb-2">Restricciones (Opcional)</label>
                              <input type="text" value={formData.restricciones} onChange={(e) => setFormData({ ...formData, restricciones: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" placeholder="Ej: No aplica para productos en oferta" />
                            </div>
                            <p className="text-xs text-voltech-success flex items-center gap-1"><Check className="w-3 h-3" /> Se generará un código único (Ej: DISCOUNT20-X9Z2) para el ganador.</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-voltech-muted mb-2">Descripción y Reglas</label>
                        <textarea value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} rows={3} className="input-voltech w-full rounded-lg px-4 py-3 text-sm resize-none" placeholder="1. Debes ser mayor de edad&#10;2. Solo una participación por persona..." />
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-voltech-border">
                        <button type="button" onClick={() => { setShowForm(false); setSorteoEditando(null); }} className="px-6 py-3 rounded-lg font-medium bg-voltech-surface border border-voltech-border text-voltech-muted hover:text-white hover:border-voltech-cyan/50 transition-all">Cancelar</button>
                        <button type="submit" className="btn-neon flex-1 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all">{sorteoEditando ? 'Guardar Cambios' : 'Guardar y Publicar Sorteo'}</button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabla de Sorteos */}
            <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden w-full">
              <div className="p-6 border-b border-voltech-border flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">{activeTab === 'activos' ? 'Sorteos Activos' : 'Sorteos Finalizados'}</h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-voltech-muted" />
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por sorteo o participante..." className="input-voltech w-full pl-10 pr-4 py-2 text-sm rounded-lg" />
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full">
                  <thead className="bg-voltech-dark border-b border-voltech-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-voltech-muted uppercase tracking-wider">Fecha Fin</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-voltech-muted uppercase tracking-wider">Sorteo / Premio</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-voltech-muted uppercase tracking-wider">Participantes</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-voltech-muted uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-voltech-border">
                    {sorteosFiltrados.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center"><div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-voltech-cyan/20 mb-4"><Gift className="w-8 h-8 text-voltech-cyan" /></div><h3 className="text-lg font-semibold text-white mb-2">No hay sorteos en esta categoría</h3></td></tr>
                    ) : (
                      sorteosFiltrados.map((sorteo) => {
                        const participantesCount = getParticipantesCount(sorteo.id);
                        return (
                          <tr key={sorteo.id} className="hover:bg-voltech-cyan/5 transition-colors">
                            <td className="px-6 py-4"><div className="flex items-center gap-1.5 text-sm text-voltech-muted"><Calendar className="w-4 h-4" />{new Date(sorteo.fecha_fin).toLocaleDateString('es-VE')}</div></td>
                            <td className="px-6 py-4">
                              <p className="text-white font-medium">{sorteo.titulo}</p>
                              <p className="text-xs text-voltech-cyan mt-0.5 font-semibold">{getNombrePremio(sorteo)}</p>
                              {sorteo.estado === 'finalizado' && sorteo.ganador && <p className="text-xs text-voltech-success mt-1 flex items-center gap-1"><Trophy className="w-3 h-3" /> Ganó: {sorteo.ganador.nombre}</p>}
                            </td>
                            <td className="px-6 py-4"><span className="text-sm font-medium text-white">{participantesCount}</span><span className="text-xs text-voltech-muted ml-1">participantes</span></td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleVerParticipantes(sorteo)} className="p-2 hover:bg-voltech-cyan/20 rounded-lg transition-colors group" title="Ver Participantes"><Eye className="w-4 h-4 text-voltech-cyan group-hover:scale-110 transition-transform" /></button>
                                
                                {sorteo.estado === 'activo' && participantesCount > 0 && (
                                  <button onClick={() => handleSortearGanador(sorteo)} className="p-2 hover:bg-voltech-warning/20 rounded-lg transition-colors group" title="Sortear Ganador"><Sparkles className="w-4 h-4 text-voltech-warning group-hover:scale-110 transition-transform" /></button>
                                )}
                                
                                {sorteo.estado === 'finalizado' && sorteo.ganador && (
                                  <button onClick={() => { setGanadorData(sorteo.ganador); setShowGanador(true); }} className="p-2 hover:bg-voltech-purple/20 rounded-lg transition-colors group" title="Ver Premio / QR"><QrCode className="w-4 h-4 text-voltech-purple group-hover:scale-110 transition-transform" /></button>
                                )}
                                
                                <button onClick={() => handleEditar(sorteo)} className="p-2 hover:bg-voltech-cyan/20 rounded-lg transition-colors group" title="Editar"><Edit className="w-4 h-4 text-voltech-cyan group-hover:scale-110 transition-transform" /></button>
                                <button onClick={() => handleEliminar(sorteo.id)} className="p-2 hover:bg-voltech-error/20 rounded-lg transition-colors group" title="Eliminar"><Trash2 className="w-4 h-4 text-voltech-error group-hover:scale-110 transition-transform" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Modal para Ver Participantes */}
        <AnimatePresence>
          {showParticipantes && sorteoActual && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowParticipantes(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-voltech-border flex items-center justify-between">
                  <div><h2 className="text-2xl font-bold text-white">Participantes</h2><p className="text-voltech-muted text-sm mt-1">{sorteoActual.titulo}</p></div>
                  <button onClick={() => setShowParticipantes(false)} className="p-2 hover:bg-voltech-border rounded-lg transition-colors"><X className="w-5 h-5 text-voltech-muted" /></button>
                </div>
                <div className="overflow-y-auto max-h-[60vh]">
                  <table className="w-full">
                    <thead className="bg-voltech-dark sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-voltech-muted uppercase">Ticket</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-voltech-muted uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-voltech-muted uppercase">Teléfono</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-voltech-border">
                      {getParticipantesBySorteo(sorteoActual.id).map((participante) => (
                        <tr key={participante.id} className="hover:bg-voltech-cyan/5 transition-colors">
                          <td className="px-6 py-4"><span className="inline-flex items-center px-2 py-1 bg-voltech-purple/20 text-voltech-purple rounded text-xs font-medium">{participante.numero_ticket}</span></td>
                          <td className="px-6 py-4"><p className="text-white font-medium">{participante.nombre} {participante.apellido}</p></td>
                          <td className="px-6 py-4 text-sm text-voltech-muted">{participante.telefono}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {getParticipantesBySorteo(sorteoActual.id).length === 0 && (<div className="p-12 text-center"><Users className="w-12 h-12 text-voltech-muted mx-auto mb-3" /><p className="text-voltech-muted">Aún no hay participantes en este sorteo</p></div>)}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal del Ganador con QR */}
        <AnimatePresence>
          {showGanador && ganadorData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setShowGanador(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-voltech-purple to-voltech-cyan p-6 text-center">
                  <Trophy className="w-12 h-12 text-white mx-auto mb-2" />
                  <h2 className="text-2xl font-bold text-white">¡Tenemos Ganador!</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-voltech-muted">El premio es para:</p>
                    <p className="text-xl font-bold text-white">{ganadorData.nombre}</p>
                    <p className="text-sm text-voltech-muted">{ganadorData.telefono}</p>
                  </div>
                  
                  <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4 text-center">
                    <p className="text-xs text-voltech-muted mb-1">Ticket Ganador:</p>
                    <p className="text-lg font-mono font-bold text-voltech-cyan">{ganadorData.numero_ticket}</p>
                  </div>

                  <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4 text-center">
                    <p className="text-xs text-voltech-muted mb-2">Código de Validación del Premio:</p>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <p className="text-lg font-mono font-bold text-voltech-success">{ganadorData.codigo_premio}</p>
                      <button onClick={() => { navigator.clipboard.writeText(ganadorData.codigo_premio); toast.success('Código copiado'); }} className="p-1 hover:bg-voltech-border rounded"><Copy className="w-4 h-4 text-voltech-muted" /></button>
                    </div>
                    <div className="bg-white p-3 rounded-lg inline-block">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VALIDAR-PREMIO:${ganadorData.codigo_premio}`} alt="QR del Premio" className="w-32 h-32" />
                    </div>
                    <p className="text-[10px] text-voltech-muted mt-2">Escanea este código en tienda para validar y canjear el premio.</p>
                  </div>

                  <button onClick={() => setShowGanador(false)} className="w-full py-3 bg-voltech-cyan text-white font-bold rounded-lg hover:bg-voltech-cyan/80 transition-colors">Cerrar y Guardar</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}