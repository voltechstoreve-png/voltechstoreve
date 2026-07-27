'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'default-no-store';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Users, UserPlus, Search, Edit3, Trash2, X, Save, Mail, Phone, MapPin, 
  Tag, AlertTriangle, CheckCircle, Filter, Palette, Plus, Gift, 
  Link as LinkIcon, Trophy, UserCheck, Copy, Share2, Bell, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { useNotificaciones } from '@/app/context/NotificationContext';

export default function ClientesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { agregarNotificacion, notificaciones, marcarLeida, limpiarTodas } = useNotificaciones();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'clientes');
  const [clientes, setClientes] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [equipo, setEquipo] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [showEtiquetasModal, setShowEtiquetasModal] = useState(false);
  const [showReferidosModal, setShowReferidosModal] = useState(false);
  const [showSeleccionarReferidoModal, setShowSeleccionarReferidoModal] = useState(false);
  const [showNivelForm, setShowNivelForm] = useState(false);
  
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEtiqueta, setFilterEtiqueta] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState({ nombre: '', color: '#00d4ff' });
  const [busquedaReferido, setBusquedaReferido] = useState('');
  
  const [nivelesReferidos, setNivelesReferidos] = useState([
    { id: 1, nombre: 'Bronce', minimo: 2, descuento: 10, ticketsExtra: 2, productoGratis: 'Ninguno' },
    { id: 2, nombre: 'Plata', minimo: 4, descuento: 15, ticketsExtra: 3, productoGratis: 'Audífonos JBL ($20)' },
    { id: 3, nombre: 'Oro', minimo: 6, descuento: 20, ticketsExtra: 5, productoGratis: 'Netflix 1 mes ($5)' },
  ]);
  
  const [formDataNivel, setFormDataNivel] = useState({
    nombre: '', minimo: 2, descuento: 10, ticketsExtra: 2, productoGratis: 'Ninguno'
  });

  const [formData, setFormData] = useState({
    nombre: '', apellido: '', telefono: '', correo: '', direccion: '', 
    registradoPor: '', fuenteRegistro: 'normal', numeroOrdenSorteo: '',
    etiquetas: [], referidos: [], notas: '',
  });

  useEffect(() => {
    const clientesGuardados = localStorage.getItem('voltech_clientes');
    const ventasGuardadas = localStorage.getItem('voltech_ventas');
    const equipoGuardado = localStorage.getItem('voltech_equipo');
    const etiquetasGuardadas = localStorage.getItem('voltech_etiquetas');
    const nivelesGuardados = localStorage.getItem('voltech_niveles_referidos');

    if (clientesGuardados) setClientes(JSON.parse(clientesGuardados));
    if (ventasGuardadas) setVentas(JSON.parse(ventasGuardadas));
    if (equipoGuardado) setEquipo(JSON.parse(equipoGuardado));
    if (etiquetasGuardadas) setEtiquetas(JSON.parse(etiquetasGuardadas));
    if (nivelesGuardados) setNivelesReferidos(JSON.parse(nivelesGuardados));
    
    sincronizarClientesDesdeVentas();
  }, []);

  const obtenerNivelReferido = (cantidad) => {
    const nivel = [...nivelesReferidos]
      .sort((a, b) => b.minimo - a.minimo)
      .find(n => cantidad >= n.minimo);
    return nivel || null;
  };

  const generarCodigoReferido = (cliente) => {
    return `VOLTECHSTORE-${cliente.nombre.substring(0, 5).toUpperCase()}-${cliente.id.toString().slice(-4)}`;
  };

  const sincronizarClientesDesdeVentas = () => {
    const clientesActuales = [...clientes];
    let cambios = false;
    ventas.forEach(venta => {
      const clienteExistente = clientesActuales.find(c => c.telefono === venta.telefono || c.nombre.toLowerCase() === venta.cliente.toLowerCase());
      if (clienteExistente) {
        clienteExistente.totalCompras = (clienteExistente.totalCompras || 0) + 1;
        clienteExistente.ultimaCompra = venta.fecha;
        clienteExistente.totalGastado = (clienteExistente.totalGastado || 0) + (venta.total || 0);
      } else {
        clientesActuales.push({
          id: Date.now() + Math.random(), nombre: venta.cliente, apellido: '', telefono: venta.telefono,
          correo: '', direccion: '', registradoPor: venta.vendedor || 'Sistema', fuenteRegistro: 'normal',
          etiquetas: [], referidos: [], notas: '', totalCompras: 1, ultimaCompra: venta.fecha,
          totalGastado: venta.total || 0, fechaRegistro: venta.fecha,
        });
        cambios = true;
      }
    });
    if (cambios) {
      setClientes(clientesActuales);
      localStorage.setItem('voltech_clientes', JSON.stringify(clientesActuales));
    }
  };

  const obtenerVendedorConMenosVentas = () => {
    const ventasPorVendedor = {};
    equipo.forEach(e => { if (e.rol === 'vendedor' || e.rol === 'admin') ventasPorVendedor[e.nombre] = 0; });
    ventas.forEach(v => { if (ventasPorVendedor[v.vendedor] !== undefined) ventasPorVendedor[v.vendedor]++; });
    let minVentas = Infinity, vendedorMenosVentas = '';
    for (const [vendedor, count] of Object.entries(ventasPorVendedor)) {
      if (count < minVentas) { minVentas = count; vendedorMenosVentas = vendedor; }
    }
    return vendedorMenosVentas || (equipo.find(e => e.rol === 'admin' || e.rol === 'vendedor')?.nombre || '');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'fuenteRegistro' && value === 'sorteo') {
      setFormData(prev => ({ ...prev, fuenteRegistro: value, registradoPor: obtenerVendedorConMenosVentas() }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleEtiqueta = (etiquetaNombre) => {
    setFormData(prev => ({
      ...prev,
      etiquetas: prev.etiquetas.includes(etiquetaNombre) ? prev.etiquetas.filter(e => e !== etiquetaNombre) : [...prev.etiquetas, etiquetaNombre]
    }));
  };

  const abrirSeleccionReferido = () => { setBusquedaReferido(''); setShowSeleccionarReferidoModal(true); };

  const seleccionarClienteComoReferido = (cliente) => {
    if (formData.referidos.length >= 2) { toast.error('Máximo 2 referidos por cliente'); return; }
    const nuevoReferido = { id: cliente.id, nombre: `${cliente.nombre} ${cliente.apellido}`.trim(), telefono: cliente.telefono, fecha: new Date().toISOString() };
    const nuevosReferidos = [...formData.referidos, nuevoReferido];
    let nuevasEtiquetas = [...formData.etiquetas];
    
    const nivelAlcanzado = obtenerNivelReferido(nuevosReferidos.length);
    if (nivelAlcanzado && !formData.etiquetas.includes(nivelAlcanzado.nombre)) {
      nuevasEtiquetas.push(nivelAlcanzado.nombre);
      toast.success(`¡Cliente alcanzó nivel ${nivelAlcanzado.nombre.toUpperCase()}!`);
    }
    
    setFormData(prev => ({ ...prev, referidos: nuevosReferidos, etiquetas: nuevasEtiquetas }));
    setShowSeleccionarReferidoModal(false);
  };

  const eliminarReferido = (index) => {
    const nuevosReferidos = formData.referidos.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, referidos: nuevosReferidos }));
    toast.success('Referido eliminado');
  };

  const guardarCliente = () => {
    if (!formData.nombre || !formData.telefono) { toast.error('Nombre y Teléfono son obligatorios'); return; }
    if (clientes.find(c => c.telefono === formData.telefono && c.id !== editingId)) { toast.error('Ya existe un cliente con ese teléfono'); return; }
    
    if (editingId) {
      const actualizados = clientes.map(c => c.id === editingId ? { ...c, ...formData, ultimaActualizacion: new Date().toISOString() } : c);
      setClientes(actualizados); localStorage.setItem('voltech_clientes', JSON.stringify(actualizados));
      toast.success('Cliente actualizado');
    } else {
      const nuevo = { id: Date.now(), ...formData, totalCompras: 0, totalGastado: 0, fechaRegistro: new Date().toISOString().split('T')[0] };
      const actualizados = [nuevo, ...clientes];
      setClientes(actualizados); localStorage.setItem('voltech_clientes', JSON.stringify(actualizados));
      
      agregarNotificacion({
        tipo: 'cliente',
        titulo: 'NUEVO CLIENTE REGISTRADO',
        mensaje: `${formData.nombre} ${formData.apellido} se registró en el sistema`,
        detalle: `Teléfono: ${formData.telefono}`,
      });
      
      toast.success('Cliente registrado');
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ nombre: '', apellido: '', telefono: '', correo: '', direccion: '', registradoPor: '', fuenteRegistro: 'normal', numeroOrdenSorteo: '', etiquetas: [], referidos: [], notas: '' });
    setShowForm(false); setEditingId(null);
  };

  const editarCliente = (cliente) => {
    setEditingId(cliente.id);
    setFormData({ nombre: cliente.nombre||'', apellido: cliente.apellido||'', telefono: cliente.telefono||'', correo: cliente.correo||'', direccion: cliente.direccion||'', registradoPor: cliente.registradoPor||'', fuenteRegistro: cliente.fuenteRegistro||'normal', numeroOrdenSorteo: cliente.numeroOrdenSorteo||'', etiquetas: cliente.etiquetas||[], referidos: cliente.referidos||[], notas: cliente.notas||'' });
    setShowForm(true);
  };

  const eliminarCliente = (id) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    const actualizados = clientes.filter(c => c.id !== id);
    setClientes(actualizados); localStorage.setItem('voltech_clientes', JSON.stringify(actualizados));
    toast.success('Cliente eliminado');
  };

  const verReferidos = (cliente) => { setClienteSeleccionado(cliente); setShowReferidosModal(true); };

  const guardarEtiqueta = () => {
    if (!nuevaEtiqueta.nombre.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (etiquetas.find(e => e.nombre.toLowerCase() === nuevaEtiqueta.nombre.toLowerCase())) { toast.error('Ya existe'); return; }
    const nueva = { id: Date.now(), nombre: nuevaEtiqueta.nombre, color: nuevaEtiqueta.color };
    const actualizadas = [...etiquetas, nueva];
    setEtiquetas(actualizadas); localStorage.setItem('voltech_etiquetas', JSON.stringify(actualizadas));
    toast.success('Etiqueta creada'); setNuevaEtiqueta({ nombre: '', color: '#00d4ff' });
  };

  const eliminarEtiqueta = (id) => {
    if (!confirm('¿Eliminar esta etiqueta?')) return;
    const actualizadas = etiquetas.filter(e => e.id !== id);
    setEtiquetas(actualizadas); localStorage.setItem('voltech_etiquetas', JSON.stringify(actualizadas));
    toast.success('Etiqueta eliminada');
  };

  const guardarNivel = () => {
    if (!formDataNivel.nombre.trim()) { toast.error('El nombre del nivel es obligatorio'); return; }
    
    if (formDataNivel.id) {
      const actualizados = nivelesReferidos.map(n => n.id === formDataNivel.id ? formDataNivel : n);
      setNivelesReferidos(actualizados);
      toast.success('Nivel actualizado');
    } else {
      const nuevo = { ...formDataNivel, id: Date.now() };
      const actualizados = [...nivelesReferidos, nuevo].sort((a, b) => a.minimo - b.minimo);
      setNivelesReferidos(actualizados);
      toast.success('Nivel creado');
    }
    localStorage.setItem('voltech_niveles_referidos', JSON.stringify(nivelesReferidos));
    setShowNivelForm(false);
    setFormDataNivel({ nombre: '', minimo: 2, descuento: 10, ticketsExtra: 2, productoGratis: 'Ninguno' });
  };

  const editarNivel = (nivel) => {
    setFormDataNivel(nivel);
    setShowNivelForm(true);
  };

  const eliminarNivel = (id) => {
    if (!confirm('¿Eliminar este nivel?')) return;
    const actualizados = nivelesReferidos.filter(n => n.id !== id);
    setNivelesReferidos(actualizados);
    localStorage.setItem('voltech_niveles_referidos', JSON.stringify(actualizados));
    toast.success('Nivel eliminado');
  };

  const clientesFiltrados = clientes.filter(c => {
    const coincideBusqueda = c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || c.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) || c.telefono.includes(searchTerm) || c.correo?.toLowerCase().includes(searchTerm.toLowerCase());
    return coincideBusqueda && (!filterEtiqueta || c.etiquetas?.includes(filterEtiqueta));
  });

  const clientesDisponiblesParaReferido = clientes.filter(c => c.id !== (editingId || formData.id) && !formData.referidos.some(r => r.id === c.id) && (c.nombre.toLowerCase().includes(busquedaReferido.toLowerCase()) || c.telefono.includes(busquedaReferido)));

  const tieneDuplicados = clientes.length > new Set(clientes.map(c => c.telefono)).size;

  const notificacionesClientes = notificaciones.filter(n => 
    ['referido', 'nivel', 'sorteo', 'cliente'].includes(n.tipo)
  );
  const noLeidas = notificacionesClientes.filter(n => !n.leida).length;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" toastOptions={{ style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' }, success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } }, error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } } }} />

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-sm text-voltech-muted mt-1">Gestiona tu base de clientes, referidos y etiquetas</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'clientes' && (
            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Nuevo Cliente
            </button>
          )}
        </div>
      </div>

      {/* ✅ TARJETAS DE MÉTRICAS (ARRIBA - Estilo Streaming) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-cyan/20">
              <Users className="w-5 h-5 text-voltech-cyan" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Total Clientes</p>
              <p className="text-xl font-bold text-white">{clientes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-success/20">
              <CheckCircle className="w-5 h-5 text-voltech-success" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Nuevos</p>
              <p className="text-xl font-bold text-white">{clientes.filter(c => c.etiquetas?.includes('Nuevo')).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-purple/20">
              <Tag className="w-5 h-5 text-voltech-purple" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Frecuentes</p>
              <p className="text-xl font-bold text-white">{clientes.filter(c => c.etiquetas?.includes('Frecuente')).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-warning/20">
              <Trophy className="w-5 h-5 text-voltech-warning" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Embajadores (2+ referidos)</p>
              <p className="text-xl font-bold text-white">{clientes.filter(c => (c.referidos?.length || 0) >= 2).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ PESTAÑAS DE NAVEGACIÓN (DEBAJO DE LAS TARJETAS - Estilo Streaming) */}
      <div className="border-b border-voltech-border">
        <div className="flex gap-6">
          <button 
            className={`pb-3 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'clientes' 
                ? 'text-voltech-cyan border-voltech-cyan' 
                : 'text-voltech-muted border-transparent hover:text-white'
            }`}
            onClick={() => setActiveTab('clientes')}
          >
            <Users className="w-4 h-4" /> Base de Clientes
          </button>
          
          <button 
            className={`pb-3 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'referidos' 
                ? 'text-voltech-cyan border-voltech-cyan' 
                : 'text-voltech-muted border-transparent hover:text-white'
            }`}
            onClick={() => setActiveTab('referidos')}
          >
            <Gift className="w-4 h-4" /> Programa de Referidos
          </button>
          
          <button 
            className={`pb-3 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'notificaciones' 
                ? 'text-voltech-cyan border-voltech-cyan' 
                : 'text-voltech-muted border-transparent hover:text-white'
            }`}
            onClick={() => setActiveTab('notificaciones')}
          >
            <Bell className="w-4 h-4" /> Notificaciones
            {noLeidas > 0 && (
              <span className="bg-voltech-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {noLeidas}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ✅ CONTENIDO DE PESTAÑAS */}
      <div>
        {/* PESTAÑA 1: BASE DE CLIENTES */}
        {activeTab === 'clientes' && (
          <div>
            {/* Formulario */}
            <AnimatePresence>
              {showForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden mb-6">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2"><UserPlus className="w-5 h-5 text-voltech-cyan" />{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                      <button onClick={resetForm} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Nombre *</label><input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Nombre del cliente" /></div>
                      <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Apellido</label><input type="text" name="apellido" value={formData.apellido} onChange={handleInputChange} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Apellido" /></div>
                      <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Teléfono *</label><input type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="0412-1234567" /></div>
                      <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Correo (Opcional)</label><input type="email" name="correo" value={formData.correo} onChange={handleInputChange} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="cliente@email.com" /></div>
                      <div className="lg:col-span-2"><label className="block text-xs text-voltech-muted mb-1 ml-1">Dirección (Opcional)</label><input type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Dirección completa" /></div>
                      <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Fuente de Registro</label><select name="fuenteRegistro" value={formData.fuenteRegistro} onChange={handleInputChange} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="normal">Normal</option><option value="sorteo">Sorteo (Auto-asigna)</option><option value="referido">Referido</option></select></div>
                      <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Registrado por (Equipo) *</label><select name="registradoPor" value={formData.registradoPor} onChange={handleInputChange} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="">-- Selecciona --</option>{equipo.filter(e => e.rol === 'vendedor' || e.rol === 'admin').map(e => (<option key={e.id} value={e.nombre}>{e.nombre} ({e.rol})</option>))}</select></div>
                      {formData.fuenteRegistro === 'sorteo' && (<div className="lg:col-span-3 bg-voltech-purple/5 border border-voltech-purple/20 rounded-lg p-4"><div className="flex items-center gap-2 mb-2"><Gift className="w-4 h-4 text-voltech-purple" /><span className="text-sm font-semibold text-voltech-purple">Registro por Sorteo</span></div><p className="text-xs text-voltech-muted mb-3">Asignado a: <strong className="text-white">{formData.registradoPor || 'Nadie'}</strong></p><div><label className="block text-xs text-voltech-muted mb-1 ml-1">N° Orden del Sorteo</label><input type="text" name="numeroOrdenSorteo" value={formData.numeroOrdenSorteo} onChange={handleInputChange} className="input-voltech w-full rounded-lg px-4 py-2 text-sm font-mono" placeholder="Ej: 23-07-003" /></div></div>)}
                      <div className="lg:col-span-3">
                        <label className="block text-xs text-voltech-muted mb-2 ml-1">Etiquetas</label>
                        {etiquetas.length === 0 ? (
                          <p className="text-xs text-voltech-muted italic">No hay etiquetas creadas. Crea una desde el filtro de arriba.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {etiquetas.map(etiqueta => (
                              <button key={etiqueta.id} onClick={() => toggleEtiqueta(etiqueta.nombre)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${formData.etiquetas.includes(etiqueta.nombre) ? 'bg-voltech-dark ring-1 ring-offset-1 ring-offset-voltech-surface' : 'opacity-50 hover:opacity-75 bg-voltech-dark/30'}`} style={{ color: etiqueta.color, borderColor: etiqueta.color, ringColor: etiqueta.color }}>{etiqueta.nombre}</button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="lg:col-span-3 bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-semibold text-white flex items-center gap-2"><Gift className="w-4 h-4 text-voltech-purple" />Referidos <span className="text-xs text-voltech-muted">(Máx 2 - Beneficio: Embajador)</span></h4><span className={`text-xs px-2 py-1 rounded-full ${formData.referidos.length >= 2 ? 'bg-voltech-error/20 text-voltech-error' : formData.referidos.length === 1 ? 'bg-voltech-warning/20 text-voltech-warning' : 'bg-voltech-success/20 text-voltech-success'}`}>{formData.referidos.length}/2</span></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">{formData.referidos.map((ref, idx) => (<div key={idx} className="flex items-center justify-between bg-voltech-surface border border-voltech-border rounded-lg p-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-voltech-cyan/20 flex items-center justify-center text-voltech-cyan font-bold text-xs">{ref.nombre.charAt(0)}</div><div><p className="text-sm font-medium text-white">{ref.nombre}</p><p className="text-xs text-voltech-muted">{ref.telefono}</p></div></div><button onClick={() => eliminarReferido(idx)} className="text-voltech-error hover:text-voltech-error/70 p-2"><Trash2 className="w-4 h-4" /></button></div>))}</div>
                        {formData.referidos.length < 2 && (<button onClick={abrirSeleccionReferido} className="w-full py-2 border border-dashed border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-voltech-cyan hover:border-voltech-cyan transition-colors flex items-center justify-center gap-2"><UserCheck className="w-4 h-4" />Seleccionar Cliente Existente</button>)}
                      </div>
                      <div className="lg:col-span-3"><label className="block text-xs text-voltech-muted mb-1 ml-1">Notas</label><textarea name="notas" value={formData.notas} onChange={handleInputChange} className="input-voltech w-full rounded-lg px-4 py-2 text-sm h-20 resize-none" placeholder="Notas adicionales..." /></div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={guardarCliente} className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Save className="w-5 h-5" />{editingId ? 'Actualizar' : 'Guardar'}</button>
                      <button onClick={resetForm} className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-error transition-all flex items-center gap-2"><X className="w-4 h-4" />Cancelar</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FILTROS Y BÚSQUEDA */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
                <input type="text" placeholder="Buscar por nombre, teléfono, correo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-voltech w-full rounded-lg pl-10 pr-4 py-3 text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-voltech-muted" />
                <select 
                  value={filterEtiqueta} 
                  onChange={(e) => {
                    if (e.target.value === 'GESTIONAR_ETIQUETAS') {
                      setShowEtiquetasModal(true);
                      setFilterEtiqueta('');
                    } else {
                      setFilterEtiqueta(e.target.value);
                    }
                  }} 
                  className="input-voltech rounded-lg px-4 py-3 text-sm min-w-[200px]"
                >
                  <option value="">Todas las etiquetas</option>
                  {etiquetas.map(e => (<option key={e.id} value={e.nombre}>{e.nombre}</option>))}
                  <option disabled>────────────────</option>
                  <option value="GESTIONAR_ETIQUETAS" className="text-voltech-cyan font-bold">🎨 Gestionar etiquetas</option>
                </select>
              </div>
            </div>

            {/* TABLA DE CLIENTES */}
            <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-voltech-dark border-b border-voltech-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Cliente</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Contacto</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Registrado por</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Referidos</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Compras</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Total Gastado</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFiltrados.length === 0 ? (
                      <tr><td colSpan="7" className="text-center py-12 text-voltech-muted"><Users className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No hay clientes registrados</p></td></tr>
                    ) : (
                      clientesFiltrados.map((cliente) => (
                        <tr key={cliente.id} className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-voltech-cyan to-voltech-purple flex items-center justify-center text-white font-bold text-sm">{cliente.nombre.charAt(0)}</div>
                              <div>
                                <p className="text-sm font-medium text-white">{cliente.nombre} {cliente.apellido}</p>
                                
                                {cliente.etiquetas && cliente.etiquetas.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {cliente.etiquetas
                                      .filter(etiquetaNombre => etiquetas.some(e => e.nombre === etiquetaNombre))
                                      .map((etiquetaNombre, idx) => {
                                        const etiquetaObj = etiquetas.find(e => e.nombre === etiquetaNombre);
                                        return (
                                          <span
                                            key={idx}
                                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                            style={{ 
                                              backgroundColor: `${etiquetaObj?.color || '#666'}30`, 
                                              color: etiquetaObj?.color || '#fff',
                                              border: `1px solid ${etiquetaObj?.color || '#666'}`
                                            }}
                                          >
                                            {etiquetaNombre}
                                          </span>
                                        );
                                      })}
                                  </div>
                                )}
                                
                                {cliente.fuenteRegistro === 'sorteo' && (
                                  <p className="text-xs text-voltech-warning flex items-center gap-1 mt-1">
                                    🎁 Sorteo: {cliente.numeroOrdenSorteo || 'N/A'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <p className="text-xs text-voltech-muted flex items-center gap-1"><Phone className="w-3 h-3" /> {cliente.telefono}</p>
                              {cliente.correo && <p className="text-xs text-voltech-muted flex items-center gap-1"><Mail className="w-3 h-3" /> {cliente.correo}</p>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-voltech-muted">{cliente.registradoPor || 'Sistema'}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => verReferidos(cliente)} className="flex items-center gap-1 text-xs text-voltech-cyan hover:underline">
                              <LinkIcon className="w-3 h-3" />
                              {cliente.referidos?.length || 0} Ver
                            </button>
                            
                            {obtenerNivelReferido(cliente.referidos?.length || 0) && (
                              <p className="text-xs text-voltech-warning flex items-center gap-1 mt-1 font-semibold">
                                <Trophy className="w-3 h-3" /> 
                                Nivel {obtenerNivelReferido(cliente.referidos.length).nombre}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-white">{cliente.totalCompras || 0}</td>
                          <td className="px-4 py-3 text-sm font-bold text-voltech-success">${(cliente.totalGastado || 0).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => editarCliente(cliente)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors" title="Editar"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={() => eliminarCliente(cliente.id)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {tieneDuplicados && (
                <div className="p-4 bg-voltech-warning/10 border-t border-voltech-border flex items-center justify-between">
                  <p className="text-sm text-voltech-warning flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Se detectaron {clientes.length - new Set(clientes.map(c => c.telefono)).size} cliente(s) duplicado(s)
                  </p>
                  <button
                    onClick={() => {
                      if (!confirm('¿Eliminar clientes duplicados? Se conservará el más reciente.')) return;
                      const clientesUnicos = [];
                      const telefonosVistos = new Set();
                      const clientesOrdenados = [...clientes].sort((a, b) => new Date(b.fechaRegistro || b.id) - new Date(a.fechaRegistro || a.id));
                      clientesOrdenados.forEach(cliente => {
                        if (!telefonosVistos.has(cliente.telefono)) {
                          clientesUnicos.push(cliente);
                          telefonosVistos.add(cliente.telefono);
                        }
                      });
                      setClientes(clientesUnicos);
                      localStorage.setItem('voltech_clientes', JSON.stringify(clientesUnicos));
                      toast.success('Clientes duplicados eliminados');
                    }}
                    className="px-4 py-2 bg-voltech-warning/20 text-voltech-warning rounded-lg text-sm hover:bg-voltech-warning/30 transition-colors"
                  >
                    Limpiar Duplicados
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: PROGRAMA DE REFERIDOS */}
        {activeTab === 'referidos' && (
          <div>
            {/* Niveles Editables */}
            <div className="bg-voltech-dark/50 border border-voltech-border rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Niveles de Referidos</h3>
                <button onClick={() => setShowNivelForm(true)} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Agregar Nivel
                </button>
              </div>

              <AnimatePresence>
                {showNivelForm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-6 bg-voltech-surface border border-voltech-border rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-white mb-3">{formDataNivel.id ? 'Editar Nivel' : 'Nuevo Nivel'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div><label className="block text-xs text-voltech-muted mb-1">Nombre del Nivel</label><input type="text" value={formDataNivel.nombre} onChange={(e) => setFormDataNivel({...formDataNivel, nombre: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Ej: Bronce" /></div>
                      <div><label className="block text-xs text-voltech-muted mb-1">Mínimo de Referidos</label><input type="number" value={formDataNivel.minimo} onChange={(e) => setFormDataNivel({...formDataNivel, minimo: parseInt(e.target.value) || 0})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                      <div><label className="block text-xs text-voltech-muted mb-1">Descuento (%)</label><input type="number" value={formDataNivel.descuento} onChange={(e) => setFormDataNivel({...formDataNivel, descuento: parseInt(e.target.value) || 0})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                      <div><label className="block text-xs text-voltech-muted mb-1">Tickets Extra</label><input type="number" value={formDataNivel.ticketsExtra} onChange={(e) => setFormDataNivel({...formDataNivel, ticketsExtra: parseInt(e.target.value) || 0})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                      <div className="lg:col-span-4"><label className="block text-xs text-voltech-muted mb-1">Producto Gratis</label><input type="text" value={formDataNivel.productoGratis} onChange={(e) => setFormDataNivel({...formDataNivel, productoGratis: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Ej: Audífonos JBL ($20)" /></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={guardarNivel} className="px-4 py-2 bg-voltech-success/20 text-voltech-success rounded-lg text-sm hover:bg-voltech-success/30 transition-colors flex items-center gap-2"><Save className="w-4 h-4" /> Guardar</button>
                      <button onClick={() => { setShowNivelForm(false); setFormDataNivel({ nombre: '', minimo: 2, descuento: 10, ticketsExtra: 2, productoGratis: 'Ninguno' }); }} className="px-4 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white transition-colors flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                {nivelesReferidos.map(nivel => (
                  <div key={nivel.id} className="bg-voltech-surface border border-voltech-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-white">{nivel.nombre} - {nivel.minimo}+ Referidos</h4>
                      <div className="flex gap-2">
                        <button onClick={() => editarNivel(nivel)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => eliminarNivel(nivel.id)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><p className="text-xs text-voltech-muted mb-1">Descuento</p><p className="text-sm text-voltech-success font-bold">{nivel.descuento}%</p></div>
                      <div><p className="text-xs text-voltech-muted mb-1">Tickets Extra</p><p className="text-sm text-voltech-cyan font-bold">+{nivel.ticketsExtra}</p></div>
                      <div><p className="text-xs text-voltech-muted mb-1">Producto Gratis</p><p className="text-sm text-voltech-warning">{nivel.productoGratis}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lista de Códigos */}
            <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Códigos de Referidos Generados</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-voltech-dark border-b border-voltech-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Código</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Cliente</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Nivel</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Descuento</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.filter(c => (c.referidos?.length || 0) >= 2).map(cliente => {
                      const nivel = obtenerNivelReferido(cliente.referidos.length);
                      return (
                        <tr key={cliente.id} className="border-b border-voltech-border hover:bg-voltech-border/30">
                          <td className="px-4 py-3 text-sm font-mono text-voltech-cyan">{generarCodigoReferido(cliente)}</td>
                          <td className="px-4 py-3 text-sm text-white">{cliente.nombre}</td>
                          <td className="px-4 py-3 text-sm"><span className="text-voltech-warning">{nivel?.nombre || 'Sin nivel'}</span></td>
                          <td className="px-4 py-3 text-sm text-voltech-success">{nivel?.descuento || 0}%</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => { navigator.clipboard.writeText(generarCodigoReferido(cliente)); toast.success('Código copiado'); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors"><Copy className="w-4 h-4" /></button>
                              <button onClick={() => { const codigo = generarCodigoReferido(cliente); const mensaje = `¡Hola! ${cliente.nombre} te invitó a Voltech Store 🎉\nUsa mi código ${codigo} y obtén beneficios\n👉 https://voltechstore.ve/?ref=${codigo}`; window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank'); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-success transition-colors"><Share2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {clientes.filter(c => (c.referidos?.length || 0) >= 2).length === 0 && (
                      <tr><td colSpan="5" className="text-center py-8 text-voltech-muted">Aún no hay códigos generados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: NOTIFICACIONES */}
        {activeTab === 'notificaciones' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Notificaciones</h3>
                <p className="text-sm text-voltech-muted">Recibe alertas de actividad importante</p>
              </div>
              <div className="flex gap-2">
                <button onClick={limpiarTodas} className="px-3 py-1.5 bg-voltech-dark text-voltech-muted rounded-lg text-sm hover:bg-voltech-border transition-colors">Limpiar todas</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
                <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-voltech-cyan/20"><Bell className="w-5 h-5 text-voltech-cyan" /></div><div><p className="text-xs text-voltech-muted">No leídas</p><p className="text-xl font-bold text-white">{noLeidas}</p></div></div>
              </div>
              <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
                <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-voltech-purple/20"><Trophy className="w-5 h-5 text-voltech-purple" /></div><div><p className="text-xs text-voltech-muted">Nuevos registros</p><p className="text-xl font-bold text-white">{notificacionesClientes.filter(n => n.tipo === 'sorteo').length}</p></div></div>
              </div>
              <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
                <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-voltech-success/20"><Users className="w-5 h-5 text-voltech-success" /></div><div><p className="text-xs text-voltech-muted">Referidos</p><p className="text-xl font-bold text-white">{notificacionesClientes.filter(n => n.tipo === 'referido').length}</p></div></div>
              </div>
              <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
                <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-voltech-warning/20"><Trophy className="w-5 h-5 text-voltech-warning" /></div><div><p className="text-xs text-voltech-muted">Niveles</p><p className="text-xl font-bold text-white">{notificacionesClientes.filter(n => n.tipo === 'nivel').length}</p></div></div>
              </div>
            </div>

            <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
              <div className="space-y-4">
                {notificacionesClientes.length === 0 ? (
                  <p className="text-center text-voltech-muted py-8">No hay notificaciones</p>
                ) : (
                  notificacionesClientes.map(notificacion => (
                    <div key={notificacion.id} className={`bg-voltech-dark/50 border border-voltech-border rounded-xl p-4 transition-all ${!notificacion.leida ? 'ring-2 ring-voltech-cyan' : ''}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3">
                          {notificacion.tipo === 'referido' && <div className="bg-voltech-cyan/20 text-voltech-cyan p-2 rounded-lg"><Gift className="w-4 h-4" /></div>}
                          {notificacion.tipo === 'sorteo' && <div className="bg-voltech-purple/20 text-voltech-purple p-2 rounded-lg"><Users className="w-4 h-4" /></div>}
                          {notificacion.tipo === 'nivel' && <div className="bg-voltech-warning/20 text-voltech-warning p-2 rounded-lg"><Trophy className="w-4 h-4" /></div>}
                          {notificacion.tipo === 'cliente' && <div className="bg-voltech-success/20 text-voltech-success p-2 rounded-lg"><UserPlus className="w-4 h-4" /></div>}
                          
                          <div>
                            <h4 className="text-sm font-bold text-white">{notificacion.titulo}</h4>
                            <p className="text-sm text-voltech-muted">{notificacion.mensaje}</p>
                            <p className="text-xs text-voltech-muted mt-1">{notificacion.detalle}</p>
                          </div>
                        </div>
                        <div className="text-xs text-voltech-muted flex flex-col items-end">
                          <span>{new Date(notificacion.hora).toLocaleString('es-VE')}</span>
                          {!notificacion.leida && (
                            <span className="bg-voltech-cyan text-white text-[10px] px-1.5 py-0.5 rounded mt-1">Nueva</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => marcarLeida(notificacion.id)} className="text-xs text-voltech-cyan hover:text-voltech-cyan/70 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Marcar leída</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE ETIQUETAS */}
      <AnimatePresence>
        {showEtiquetasModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-2xl w-full max-w-md">
              <div className="border-b border-voltech-border p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Palette className="w-5 h-5 text-voltech-purple" /> Gestionar Etiquetas</h2>
                <button onClick={() => setShowEtiquetasModal(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs text-voltech-muted mb-2 ml-1">Crear Nueva Etiqueta</label>
                  <div className="flex gap-2">
                    <input type="text" value={nuevaEtiqueta.nombre} onChange={(e) => setNuevaEtiqueta({ ...nuevaEtiqueta, nombre: e.target.value })} className="input-voltech flex-1 rounded-lg px-4 py-2 text-sm" placeholder="Nombre" />
                    <input type="color" value={nuevaEtiqueta.color} onChange={(e) => setNuevaEtiqueta({ ...nuevaEtiqueta, color: e.target.value })} className="w-12 h-10 rounded-lg cursor-pointer border border-voltech-border" />
                    <button onClick={guardarEtiqueta} className="px-4 py-2 bg-voltech-purple/20 text-voltech-purple rounded-lg hover:bg-voltech-purple/30 transition-colors"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="border-t border-voltech-border pt-4">
                  <label className="block text-xs text-voltech-muted mb-2">Etiquetas Existentes</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {etiquetas.length === 0 ? (
                      <p className="text-center text-voltech-muted py-4 text-sm">No hay etiquetas creadas aún</p>
                    ) : (
                      etiquetas.map(etiqueta => (
                        <div key={etiqueta.id} className="flex items-center justify-between p-3 bg-voltech-dark/50 border border-voltech-border rounded-lg">
                          <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full" style={{ backgroundColor: etiqueta.color }} /><span className="text-sm text-white">{etiqueta.nombre}</span></div>
                          <button onClick={() => eliminarEtiqueta(etiqueta.id)} className="p-1 text-voltech-error hover:bg-voltech-error/10 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL SELECCIONAR REFERIDO */}
      <AnimatePresence>
        {showSeleccionarReferidoModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-2xl w-full max-w-lg">
              <div className="border-b border-voltech-border p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><UserCheck className="w-5 h-5 text-voltech-cyan" /> Seleccionar Referido</h2>
                <button onClick={() => setShowSeleccionarReferidoModal(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" /><input type="text" placeholder="Buscar por nombre o teléfono..." value={busquedaReferido} onChange={(e) => setBusquedaReferido(e.target.value)} className="input-voltech w-full rounded-lg pl-10 pr-4 py-2 text-sm" /></div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {clientesDisponiblesParaReferido.length === 0 ? (<p className="text-center text-voltech-muted py-4">No se encontraron clientes</p>) : (
                    clientesDisponiblesParaReferido.map(cliente => (
                      <button key={cliente.id} onClick={() => seleccionarClienteComoReferido(cliente)} className="w-full flex items-center justify-between p-3 bg-voltech-dark/50 border border-voltech-border rounded-lg hover:border-voltech-cyan transition-colors text-left">
                        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-voltech-cyan to-voltech-purple flex items-center justify-center text-white font-bold text-sm">{cliente.nombre.charAt(0)}</div><div><p className="text-sm font-medium text-white">{cliente.nombre} {cliente.apellido}</p><p className="text-xs text-voltech-muted flex items-center gap-2"><Phone className="w-3 h-3" /> {cliente.telefono}</p></div></div>
                        <Plus className="w-5 h-5 text-voltech-cyan" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL VER REFERIDOS */}
      <AnimatePresence>
        {showReferidosModal && clienteSeleccionado && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-2xl w-full max-w-md">
              <div className="border-b border-voltech-border p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Gift className="w-5 h-5 text-voltech-purple" /> Programa de Referidos</h2>
                <button onClick={() => setShowReferidosModal(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4 text-center">
                  <p className="text-xs text-voltech-muted mb-1">Tu código de referido:</p>
                  <p className="text-xl font-bold text-voltech-cyan font-mono mb-3">{generarCodigoReferido(clienteSeleccionado)}</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => { navigator.clipboard.writeText(generarCodigoReferido(clienteSeleccionado)); toast.success('Código copiado'); }} className="px-3 py-1.5 bg-voltech-cyan/20 text-voltech-cyan rounded text-xs hover:bg-voltech-cyan/30 transition-colors flex items-center gap-1"><Copy className="w-3 h-3" /> Copiar</button>
                    <button onClick={() => { const codigo = generarCodigoReferido(clienteSeleccionado); const mensaje = `¡Hola! ${clienteSeleccionado.nombre} te invitó a Voltech Store 🎉\nUsa mi código ${codigo} y obtén beneficios\n https://voltechstore.ve/?ref=${codigo}`; window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank'); }} className="px-3 py-1.5 bg-voltech-success/20 text-voltech-success rounded text-xs hover:bg-voltech-success/30 transition-colors flex items-center gap-1"><Share2 className="w-3 h-3" /> Compartir</button>
                  </div>
                </div>

                {obtenerNivelReferido(clienteSeleccionado.referidos?.length || 0) && (
                  <div className="flex items-center justify-center gap-2 p-2 bg-voltech-warning/10 rounded-lg border border-voltech-warning/30">
                    <Trophy className="w-4 h-4 text-voltech-warning" />
                    <span className="text-sm font-semibold text-voltech-warning">Nivel {obtenerNivelReferido(clienteSeleccionado.referidos.length).nombre} Alcanzado 🎉</span>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Tus Referidos ({clienteSeleccionado.referidos?.length || 0})</h4>
                  {clienteSeleccionado.referidos && clienteSeleccionado.referidos.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {clienteSeleccionado.referidos.map((ref, idx) => (
                        <div key={idx} className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-voltech-cyan/20 flex items-center justify-center text-voltech-cyan font-bold text-xs">{ref.nombre.charAt(0)}</div>
                          <div><p className="text-sm font-medium text-white">{ref.nombre}</p><p className="text-xs text-voltech-muted">{ref.telefono}</p></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-voltech-muted py-4 text-sm">Aún no tienes referidos. ¡Comparte tu código!</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}