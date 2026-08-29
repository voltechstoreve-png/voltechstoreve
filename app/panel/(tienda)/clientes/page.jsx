'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/app/context/PermissionsContext';
import CustomSelect from '@/components/CustomSelect';
import { 
  Users, UserPlus, Search, Edit3, Trash2, X, Save, Mail, Phone, MapPin, 
  Tag, AlertTriangle, CheckCircle, Filter, Palette, Plus, Gift, 
  Link as LinkIcon, Trophy, UserCheck, Copy, Share2, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

const generarUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// ✅ Componente interno que usa useSearchParams
function ClientesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { esVendedor, esAdmin, esSocio, usuarioActual, tienePermiso } = usePermissions();
  
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
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
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
    const cargarDatos = async () => {
      let clientesData = [], etiquetasData = [], nivelesData = [];

      if (supabase) {
        const [{ data: cData }, { data: eData }, { data: nData }] = await Promise.all([
          supabase.from('clientes').select('*'),
          supabase.from('settings').select('valor').eq('clave', 'etiquetas').single(),
          supabase.from('settings').select('valor').eq('clave', 'niveles_referidos').single()
        ]);
        if (cData) clientesData = cData;
        if (eData?.valor) etiquetasData = eData.valor;
        if (nData?.valor) nivelesData = nData.valor;
      }

      if (clientesData.length === 0) {
        const clientesGuardados = localStorage.getItem('voltech_clientes');
        if (clientesGuardados) clientesData = JSON.parse(clientesGuardados);
      }
      if (!etiquetasData || etiquetasData.length === 0) {
        const etiquetasGuardadas = localStorage.getItem('voltech_etiquetas');
        if (etiquetasGuardadas) etiquetasData = JSON.parse(etiquetasGuardadas);
      }
      if (!nivelesData || nivelesData.length === 0) {
        const nivelesGuardados = localStorage.getItem('voltech_niveles_referidos');
        if (nivelesGuardados) nivelesData = JSON.parse(nivelesGuardados);
      }

      // ✅ EQUIPO y VENTAS desde Supabase (adiós clientes zombi del localStorage)
      let vts = [], eqp = [];
      if (supabase) {
        const [{ data: vData }, { data: eqData }] = await Promise.all([
          supabase.from('ventas').select('*'),
          supabase.from('usuarios').select('*').eq('activo', true)
        ]);
        if (vData && vData.length > 0) vts = vData;
        if (eqData && eqData.length > 0) eqp = eqData;
      }
      if (vts.length === 0) {
        const ventasGuardadas = localStorage.getItem('voltech_ventas');
        vts = ventasGuardadas ? JSON.parse(ventasGuardadas) : [];
      }
      if (eqp.length === 0) {
        const equipoGuardado = localStorage.getItem('voltech_equipo');
        eqp = equipoGuardado ? JSON.parse(equipoGuardado) : [];
      }

      if (esVendedor && usuarioActual?.nombre) {
        vts = vts.filter(v => v.vendedor?.toLowerCase() === usuarioActual.nombre.toLowerCase());
      }

      setVentas(vts);
      setEquipo(eqp);
      setEtiquetas(etiquetasData);
      setNivelesReferidos(nivelesData);

      if (esVendedor && usuarioActual?.nombre) {
        clientesData = clientesData.filter(c => c.registradoPor === usuarioActual.nombre);
      }

      const clientesSincronizados = sincronizarClientesDesdeVentas(clientesData, vts);
      setClientes(clientesSincronizados);
      localStorage.setItem('voltech_clientes', JSON.stringify(clientesSincronizados));
    };
    
    cargarDatos();
  }, [esVendedor, usuarioActual]);

  const sincronizarClientesDesdeVentas = (listaClientes, listaVentas) => {
    const clientesActuales = [...listaClientes];
    
    listaVentas.forEach(venta => {
      const clienteExistente = clientesActuales.find(c => c.telefono === venta.telefono || c.nombre.toLowerCase() === venta.cliente.toLowerCase());
      if (clienteExistente) {
        clienteExistente.totalCompras = (clienteExistente.totalCompras || 0) + 1;
        clienteExistente.ultimaCompra = venta.fecha;
        clienteExistente.totalGastado = (clienteExistente.totalGastado || 0) + (venta.total || 0);
      } else {
        clientesActuales.push({
          id: generarUUID(), 
          nombre: venta.cliente, 
          apellido: '', 
          telefono: venta.telefono,
          correo: '', 
          direccion: '', 
          registradoPor: venta.vendedor || usuarioActual?.nombre || 'Sistema', 
          fuenteRegistro: 'normal',
          etiquetas: [], 
          referidos: [], 
          notas: '', 
          totalCompras: 1, 
          ultimaCompra: venta.fecha,
          totalGastado: venta.total || 0, 
          fechaRegistro: venta.fecha,
        });
      }
    });
    return clientesActuales;
  };

  const obtenerNivelReferido = (cantidad) => {
    const nivel = [...nivelesReferidos]
      .sort((a, b) => b.minimo - a.minimo)
      .find(n => cantidad >= n.minimo);
    return nivel || null;
  };

  const generarCodigoReferido = (cliente) => {
    return `VOLTECHSTORE-${cliente.nombre.substring(0, 5).toUpperCase()}-${cliente.id.toString().slice(-4)}`;
  };

  const obtenerVendedorConMenosVentas = () => {
    const ventasPorVendedor = {};
    equipo.forEach(e => { if (['vendedor', 'admin', 'socio'].includes((e.rol || '').toLowerCase())) ventasPorVendedor[e.nombre] = 0; });
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
      const asignadoA = esVendedor ? usuarioActual?.nombre : obtenerVendedorConMenosVentas();
      setFormData(prev => ({ ...prev, fuenteRegistro: value, registradoPor: asignadoA }));
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

  const guardarCliente = async () => {
    if (!formData.nombre || !formData.telefono) { toast.error('Nombre y Teléfono son obligatorios'); return; }
    if (clientes.find(c => c.telefono === formData.telefono && c.id !== editingId)) { toast.error('Ya existe un cliente con ese teléfono'); return; }
    
    const clienteAGuardar = editingId 
      ? { ...formData, ultimaActualizacion: new Date().toISOString() } 
      : { 
          id: generarUUID(), 
          ...formData, 
          registradoPor: esVendedor ? usuarioActual?.nombre : formData.registradoPor,
          totalCompras: 0, 
          totalGastado: 0, 
          fechaRegistro: new Date().toISOString().split('T')[0] 
        };

    if (supabase) {
      const { error } = await supabase.from('clientes').upsert(clienteAGuardar, { onConflict: 'id' });
      if (error) {
        console.error('Error Supabase:', error?.message, error?.code, error?.details);
        toast.error('Error al guardar: ' + (error?.message || 'revisa la consola'));
        return;
      }
    }

    if (editingId) {
      const actualizados = clientes.map(c => c.id === editingId ? clienteAGuardar : c);
      setClientes(actualizados); 
      localStorage.setItem('voltech_clientes', JSON.stringify(actualizados));
      toast.success('Cliente actualizado');
    } else {
      const actualizados = [clienteAGuardar, ...clientes];
      setClientes(actualizados); 
      localStorage.setItem('voltech_clientes', JSON.stringify(actualizados));
      toast.success('Cliente registrado');
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ 
      nombre: '', apellido: '', telefono: '', correo: '', direccion: '', 
      registradoPor: esVendedor ? (usuarioActual?.nombre || '') : '', 
      fuenteRegistro: 'normal', numeroOrdenSorteo: '', etiquetas: [], referidos: [], notas: '' 
    });
    setShowForm(false); setEditingId(null);
  };

  const editarCliente = (cliente) => {
    setEditingId(cliente.id);
    setFormData({ 
      nombre: cliente.nombre||'', apellido: cliente.apellido||'', telefono: cliente.telefono||'', 
      correo: cliente.correo||'', direccion: cliente.direccion||'', registradoPor: cliente.registradoPor||'', 
      fuenteRegistro: cliente.fuenteRegistro||'normal', numeroOrdenSorteo: cliente.numeroOrdenSorteo||'', 
      etiquetas: cliente.etiquetas||[], referidos: cliente.referidos||[], notas: cliente.notas||'' 
    });
    setShowForm(true);
  };

  const eliminarCliente = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    
    if (supabase) {
      await supabase.from('clientes').delete().eq('id', id.toString());
    }
    
    const actualizados = clientes.filter(c => c.id !== id);
    setClientes(actualizados); 
    localStorage.setItem('voltech_clientes', JSON.stringify(actualizados));
    toast.success('Cliente eliminado');
  };

  const verReferidos = (cliente) => { setClienteSeleccionado(cliente); setShowReferidosModal(true); };

  const guardarEtiqueta = async () => {
    if (!nuevaEtiqueta.nombre.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (etiquetas.find(e => e.nombre.toLowerCase() === nuevaEtiqueta.nombre.toLowerCase())) { toast.error('Ya existe'); return; }
    
    const nueva = { id: Date.now(), nombre: nuevaEtiqueta.nombre, color: nuevaEtiqueta.color };
    const actualizadas = [...etiquetas, nueva];
    
    if (supabase) {
      await supabase.from('settings').upsert({ clave: 'etiquetas', valor: actualizadas }, { onConflict: 'clave' });
    }
    
    setEtiquetas(actualizadas); 
    localStorage.setItem('voltech_etiquetas', JSON.stringify(actualizadas));
    toast.success('Etiqueta creada'); 
    setNuevaEtiqueta({ nombre: '', color: '#00d4ff' });
  };

  const eliminarEtiqueta = async (id) => {
    if (!confirm('¿Eliminar esta etiqueta?')) return;
    const actualizadas = etiquetas.filter(e => e.id !== id);
    
    if (supabase) {
      await supabase.from('settings').upsert({ clave: 'etiquetas', valor: actualizadas }, { onConflict: 'clave' });
    }
    
    setEtiquetas(actualizadas); 
    localStorage.setItem('voltech_etiquetas', JSON.stringify(actualizadas));
    toast.success('Etiqueta eliminada');
  };

  const guardarNivel = async () => {
    if (!formDataNivel.nombre.trim()) { toast.error('El nombre del nivel es obligatorio'); return; }
    
    let actualizados;
    if (formDataNivel.id) {
      actualizados = nivelesReferidos.map(n => n.id === formDataNivel.id ? formDataNivel : n);
      toast.success('Nivel actualizado');
    } else {
      const nuevo = { ...formDataNivel, id: Date.now() };
      actualizados = [...nivelesReferidos, nuevo].sort((a, b) => a.minimo - b.minimo);
      toast.success('Nivel creado');
    }
    
    if (supabase) {
      await supabase.from('settings').upsert({ clave: 'niveles_referidos', valor: actualizados }, { onConflict: 'clave' });
    }
    
    setNivelesReferidos(actualizados);
    localStorage.setItem('voltech_niveles_referidos', JSON.stringify(actualizados));
    setShowNivelForm(false);
    setFormDataNivel({ nombre: '', minimo: 2, descuento: 10, ticketsExtra: 2, productoGratis: 'Ninguno' });
  };

  const editarNivel = (nivel) => {
    setFormDataNivel(nivel);
    setShowNivelForm(true);
  };

  const eliminarNivel = async (id) => {
    if (!confirm('¿Eliminar este nivel?')) return;
    const actualizados = nivelesReferidos.filter(n => n.id !== id);
    
    if (supabase) {
      await supabase.from('settings').upsert({ clave: 'niveles_referidos', valor: actualizados }, { onConflict: 'clave' });
    }
    
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

  return (
    <div className="space-y-6">
      <Toaster position="top-right" toastOptions={{ style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' }, success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } }, error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } } }} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
        <div className="flex-1 min-w-0 pr-2">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Clientes</h1>
          <p className="text-xs sm:text-sm text-voltech-muted mt-1">
            {esVendedor ? 'Gestiona tus clientes personales y referidos' : 'Gestiona tu base de clientes, referidos y etiquetas'}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {activeTab === 'clientes' && (
            <button onClick={() => { resetForm(); setShowForm(true); }} className="w-full sm:w-auto shrink-0 justify-center text-xs sm:text-sm py-2.5 px-4 rounded-xl bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white font-medium hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Nuevo Cliente
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4 flex items-center gap-3">
          <div className="p-2.5 md:p-2 rounded-xl md:rounded-lg bg-voltech-cyan/10 md:bg-voltech-cyan/20 text-voltech-cyan shrink-0 flex items-center justify-center"><Users className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1 md:flex-none"><p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Total Clientes</p><p className="text-base md:text-xl font-bold text-white mt-0.5 md:mt-0">{clientes.length}</p></div>
        </div>
        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4 flex items-center gap-3">
          <div className="p-2.5 md:p-2 rounded-xl md:rounded-lg bg-voltech-success/10 md:bg-voltech-success/20 text-voltech-success shrink-0 flex items-center justify-center"><CheckCircle className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1 md:flex-none"><p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Nuevos</p><p className="text-base md:text-xl font-bold text-white mt-0.5 md:mt-0">{clientes.filter(c => c.etiquetas?.includes('Nuevo')).length}</p></div>
        </div>
        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4 flex items-center gap-3">
          <div className="p-2.5 md:p-2 rounded-xl md:rounded-lg bg-voltech-purple/10 md:bg-voltech-purple/20 text-voltech-purple shrink-0 flex items-center justify-center"><Tag className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1 md:flex-none"><p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Frecuentes</p><p className="text-base md:text-xl font-bold text-white mt-0.5 md:mt-0">{clientes.filter(c => c.etiquetas?.includes('Frecuente')).length}</p></div>
        </div>
        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4 flex items-center gap-3">
          <div className="p-2.5 md:p-2 rounded-xl md:rounded-lg bg-voltech-warning/10 md:bg-voltech-warning/20 text-voltech-warning shrink-0 flex items-center justify-center"><Trophy className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1 md:flex-none"><p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Embajadores (2+)</p><p className="text-base md:text-xl font-bold text-white mt-0.5 md:mt-0">{clientes.filter(c => (c.referidos?.length || 0) >= 2).length}</p></div>
        </div>
      </div>

      <div className="border-b border-voltech-border">
        <div className="grid grid-cols-2 md:flex md:gap-6 w-full gap-y-2 pb-2 md:pb-1">
          <button className={`justify-center md:justify-start py-2.5 md:py-0 md:pb-3 flex items-center gap-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap rounded-lg md:rounded-none border-b-2 ${activeTab === 'clientes' ? 'text-voltech-cyan bg-voltech-cyan/10 border-transparent md:bg-transparent md:border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'}`} onClick={() => setActiveTab('clientes')}>
            <Users className="w-4 h-4" /> Base de Clientes
          </button>
          <button className={`justify-center md:justify-start py-2.5 md:py-0 md:pb-3 flex items-center gap-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap rounded-lg md:rounded-none border-b-2 ${activeTab === 'referidos' ? 'text-voltech-cyan bg-voltech-cyan/10 border-transparent md:bg-transparent md:border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'}`} onClick={() => setActiveTab('referidos')}>
            <Gift className="w-4 h-4" /> Programa de Referidos
          </button>
        </div>
        {activeTab === 'notificaciones' && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Notificaciones</h3>
                <p className="text-sm text-voltech-muted">Recibe alertas de actividad importante</p>
              </div>
            </div>
            <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
              <p className="text-center text-voltech-muted py-8">Sistema de notificaciones activo. (Integrado con el contexto global)</p>
            </div>
          </div>
        )}
      </div>

      <div>
        {activeTab === 'clientes' && (
          <div>
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
                      <div>
                        <CustomSelect
                          label="Fuente de Registro"
                          name="fuenteRegistro"
                          value={formData.fuenteRegistro}
                          onChange={(v) => handleInputChange({ target: { name: 'fuenteRegistro', value: v } })}
                          options={[
                            { value: 'normal', label: 'Normal' },
                            { value: 'sorteo', label: 'Sorteo (Auto-asigna)' },
                            { value: 'referido', label: 'Referido' }
                          ]}
                          placeholder="-- Selecciona --"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-voltech-muted mb-1 ml-1">Registrado por (Equipo) *</label>
                        {esVendedor ? (
                          <input type="text" value={usuarioActual?.nombre || ''} readOnly className="input-voltech w-full rounded-lg px-4 py-2 text-sm bg-voltech-dark/50 cursor-not-allowed" />
                        ) : (
                          <CustomSelect
                            name="registradoPor"
                            value={formData.registradoPor}
                            onChange={(v) => handleInputChange({ target: { name: 'registradoPor', value: v } })}
                            options={equipo
                              .filter(e => ['vendedor', 'admin', 'socio'].includes((e.rol || '').toLowerCase()))
                              .map(e => ({ value: e.nombre, label: `${e.nombre} (${e.rol})` }))}
                            placeholder="-- Selecciona --"
                            className="w-full"
                          />
                        )}
                      </div>
                      {formData.fuenteRegistro === 'sorteo' && (<div className="lg:col-span-3 bg-voltech-purple/5 border border-voltech-purple/20 rounded-lg p-4"><div className="flex items-center gap-2 mb-2"><Gift className="w-4 h-4 text-voltech-purple" /><span className="text-sm font-semibold text-voltech-purple">Registro por Sorteo</span></div><p className="text-xs text-voltech-muted mb-3">Asignado a: <strong className="text-white">{formData.registradoPor || 'Nadie'}</strong></p><div><label className="block text-xs text-voltech-muted mb-1 ml-1">N° Orden del Sorteo</label><input type="text" name="numeroOrdenSorteo" value={formData.numeroOrdenSorteo} onChange={handleInputChange} className="input-voltech w-full rounded-lg px-4 py-2 text-sm font-mono" placeholder="Ej: 23-07-003" /></div></div>)}
                      <div className="lg:col-span-3">
                        <label className="block text-xs text-voltech-muted mb-2 ml-1">Etiquetas</label>
                        {etiquetas.length === 0 ? (
                          <p className="text-xs text-voltech-muted italic">No hay etiquetas creadas.</p>
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

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full min-w-0 mt-3 mb-4">
              <div className="relative w-full sm:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
                <input type="text" placeholder="Buscar por nombre, teléfono, correo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-voltech w-full rounded-lg pl-10 pr-4 py-2.5 sm:py-3 text-sm" />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-voltech-muted shrink-0" />
                <CustomSelect
                  value={filterEtiqueta}
                  onChange={(v) => {
                    if (v === 'GESTIONAR_ETIQUETAS') {
                      if (tienePermiso('puedeVerConfiguracion')) {
                        setShowEtiquetasModal(true);
                      } else {
                        toast.error('No tienes permisos para gestionar etiquetas');
                      }
                      setFilterEtiqueta('');
                    } else {
                      setFilterEtiqueta(v);
                    }
                  }}
                  options={[
                    { value: '', label: 'Todas las etiquetas' },
                    ...etiquetas.map(e => ({ value: e.nombre, label: e.nombre })),
                    ...(tienePermiso('puedeVerConfiguracion') ? [
                      { value: '__separador__', label: '────────────────' },
                      { value: 'GESTIONAR_ETIQUETAS', label: '🎨 Gestionar etiquetas' }
                    ] : [])
                  ]}
                  placeholder="Todas las etiquetas"
                  className="w-full sm:w-auto sm:min-w-[200px]"
                />
              </div>
            </div>

            {/* ✅ Vista Card en Móvil (< md) */}
            <div className="block md:hidden space-y-3">
              {clientesFiltrados.length === 0 ? (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                  <p className="text-xs text-slate-400">No hay clientes registrados</p>
                </div>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <div key={cliente.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-voltech-cyan to-voltech-purple flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {cliente.nombre.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-100 truncate">{cliente.nombre} {cliente.apellido}</h4>
                          <p className="text-[11px] text-slate-400 font-mono truncate">{cliente.telefono}</p>
                        </div>
                      </div>
                      {(esAdmin || esSocio || (cliente.registradoPor || '').toLowerCase() === (usuarioActual?.nombre || '').toLowerCase()) && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => editarCliente(cliente)} className="p-1.5 text-slate-400 hover:text-white" title="Editar"><Edit3 size={16} /></button>
                          <button onClick={() => eliminarCliente(cliente.id)} className="p-1.5 text-slate-400 hover:text-rose-400" title="Eliminar"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </div>

                    {(cliente.etiquetas?.length > 0 || cliente.fuenteRegistro === 'sorteo') && (
                      <div className="flex flex-wrap gap-1">
                        {cliente.etiquetas?.filter(n => etiquetas.some(e => e.nombre === n)).map((n, idx) => {
                          const et = etiquetas.find(e => e.nombre === n);
                          return (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${et?.color || '#666'}30`, color: et?.color || '#fff', border: `1px solid ${et?.color || '#666'}` }}>
                              {n}
                            </span>
                          );
                        })}
                        {cliente.fuenteRegistro === 'sorteo' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">🎁 Sorteo: {cliente.numeroOrdenSorteo || 'N/A'}</span>
                        )}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-700/40 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Compras:</span>
                        <span className="text-slate-200 font-bold">{cliente.totalCompras || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Total Gastado:</span>
                        <span className="text-emerald-400 font-bold">${(cliente.totalGastado || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Registrado por:</span>
                        <span className="text-slate-200 truncate block">{cliente.registradoPor || 'Sistema'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Referidos:</span>
                        <button onClick={() => verReferidos(cliente)} className="text-cyan-400 font-medium hover:text-cyan-300">
                          {cliente.referidos?.length || 0} Ver
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ✅ Vista Tabla en Desktop (>= md) */}
            <div className="hidden md:block bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
              <div className="w-full overflow-x-auto min-w-0">
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
                                <p className="text-sm font-medium text-white whitespace-nowrap">{cliente.nombre} {cliente.apellido}</p>
                                {cliente.etiquetas && cliente.etiquetas.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {cliente.etiquetas.filter(etiquetaNombre => etiquetas.some(e => e.nombre === etiquetaNombre)).map((etiquetaNombre, idx) => {
                                      const etiquetaObj = etiquetas.find(e => e.nombre === etiquetaNombre);
                                      return (
                                        <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${etiquetaObj?.color || '#666'}30`, color: etiquetaObj?.color || '#fff', border: `1px solid ${etiquetaObj?.color || '#666'}` }}>
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
                              {(esAdmin || esSocio || (cliente.registradoPor || '').toLowerCase() === (usuarioActual?.nombre || '').toLowerCase()) && (<>
                                <button onClick={() => editarCliente(cliente)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors" title="Editar"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => eliminarCliente(cliente.id)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                              </>)}
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

        {activeTab === 'referidos' && (
          <div>
            <div className="bg-voltech-dark/50 border border-voltech-border rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Niveles de Referidos</h3>
                {tienePermiso('puedeVerConfiguracion') && (
                  <button onClick={() => setShowNivelForm(true)} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Agregar Nivel
                  </button>
                )}
              </div>

              <AnimatePresence>
                {showNivelForm && tienePermiso('puedeVerConfiguracion') && (
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
                      {tienePermiso('puedeVerConfiguracion') && (
                        <div className="flex gap-2">
                          <button onClick={() => editarNivel(nivel)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => eliminarNivel(nivel.id)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
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

            <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Códigos de Referidos Generados</h3>
              {/* ✅ Vista Card Móvil (< md) */}
              <div className="block md:hidden space-y-3">
                {clientes.filter(c => (c.referidos?.length || 0) >= 2).length === 0 ? (
                  <p className="text-center py-8 text-voltech-muted text-sm">Aún no hay códigos generados</p>
                ) : (
                  clientes.filter(c => (c.referidos?.length || 0) >= 2).map(cliente => {
                    const nivel = obtenerNivelReferido(cliente.referidos.length);
                    return (
                      <div key={cliente.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-100 truncate">{cliente.nombre}</h4>
                            <p className="text-[11px] text-cyan-400 font-mono truncate">{generarCodigoReferido(cliente)}</p>
                          </div>
                          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">{nivel?.nombre || 'Sin nivel'}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-700/40 grid grid-cols-2 gap-2 text-[11px]">
                          <div><span className="text-slate-400 block">Descuento:</span><span className="text-emerald-400 font-bold">{nivel?.descuento || 0}%</span></div>
                          <div><span className="text-slate-400 block">Referidos:</span><span className="text-slate-200 font-bold">{cliente.referidos?.length || 0}</span></div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-700/40">
                          <button onClick={() => { navigator.clipboard.writeText(generarCodigoReferido(cliente)); toast.success('Código copiado'); }} className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-cyan-300 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"><Copy size={14} /> Copiar</button>
                          <button onClick={() => { const codigo = generarCodigoReferido(cliente); const mensaje = `¡Hola! ${cliente.nombre} te invitó a Voltech Store 🎉\nUsa mi código ${codigo} y obtén beneficios\n👉 https://voltechstore.ve/?ref=${codigo}`; window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank'); }} className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-300 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"><Share2 size={14} /> Compartir</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="hidden md:block overflow-x-auto">
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

        {activeTab === 'notificaciones' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Notificaciones</h3>
                <p className="text-sm text-voltech-muted">Recibe alertas de actividad importante</p>
              </div>
            </div>
            <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
              <p className="text-center text-voltech-muted py-8">Sistema de notificaciones activo. (Integrado con el contexto global)</p>
            </div>
          </div>
        )}
      </div>

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

// ✅ Componente principal que envuelve en Suspense
export default function ClientesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-voltech-muted animate-pulse">Cargando clientes...</div>
      </div>
    }>
      <ClientesContent />
    </Suspense>
  );
}