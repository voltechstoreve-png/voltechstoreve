'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/app/context/PermissionsContext';
import { 
  DollarSign, TrendingUp, TrendingDown, Wallet, Plus, X, Save, Search,
  Calendar, CreditCard, Users, FileText, Trash2, Edit3, ArrowUpRight, 
  ArrowDownRight, Calculator, CheckCircle, Clock, Download, MessageCircle,
  ChevronDown, ChevronUp, Briefcase, PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function PagosEquiposPage() {
  const { usuarioActual } = usePermissions();
  
  // Estados Principales
  const [activeTab, setActiveTab] = useState('pagos'); // 'pagos' | 'inversiones'
  const [movimientos, setMovimientos] = useState([]);
  const [equipo, setEquipo] = useState([]);
  const [carteras, setCarteras] = useState([]);
  const [comisionesPendientes, setComisionesPendientes] = useState([]);
  
  // Estados UI
  const [showForm, setShowForm] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroMiembro, setFiltroMiembro] = useState('todos');

  // Formulario
  const [formData, setFormData] = useState({
    tipo: 'pago',
    miembroId: '',
    miembroNombre: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    periodo: new Date().toISOString().slice(0, 7),
    descripcion: '',
    metodoPago: 'efectivo',
    carteraId: '',
    estado: 'pagado',
  });

  // Selección de comisiones para pagar
  const [selectedComisiones, setSelectedComisiones] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      let movs = [], eqp = [], crt = [], coms = [];
      
      if (supabase) {
        const [{ data: d1 }, { data: d2 }, { data: d3 }, { data: d4 }] = await Promise.all([
          supabase.from('movimientos_equipo').select('*').order('fechaRegistro', { ascending: false }),
          supabase.from('usuarios').select('id, nombre, rol, activo, telefono').eq('activo', true),
          supabase.from('settings').select('clave, valor').eq('clave', 'carteras'),
          supabase.from('comisiones_pendientes').select('*').order('fecha_venta', { ascending: false })
        ]);
        if (d1) movs = d1;
        if (d2) eqp = d2;
        if (d3 && d3[0]?.valor) crt = d3[0].valor;
        if (d4) coms = d4;
      } else {
        movs = JSON.parse(localStorage.getItem('voltech_movimientos_equipo') || '[]');
        eqp = JSON.parse(localStorage.getItem('voltech_equipo') || '[]').filter(m => m.activo);
        crt = JSON.parse(localStorage.getItem('voltech_carteras') || '[]');
        coms = JSON.parse(localStorage.getItem('voltech_comisiones_pendientes') || '[]');
      }

      setMovimientos(movs);
      setEquipo(eqp);
      setCarteras(crt);
      setComisionesPendientes(coms);
    };
    cargarDatos();
  }, []);

  // Cálculos para las tarjetas
  const totalInvertido = movimientos.filter(m => m.tipo === 'inversion').reduce((acc, m) => acc + Number(m.monto), 0);
  const totalPagado = movimientos.filter(m => m.tipo === 'pago').reduce((acc, m) => acc + Number(m.monto), 0);
  const totalPendienteComisiones = comisionesPendientes.filter(c => c.estado === 'pendiente').reduce((acc, c) => acc + Number(c.monto_comision), 0);
  const balance = totalInvertido - totalPagado;

  // Manejar selección de comisiones en el formulario
  const toggleComision = (comision) => {
    const exists = selectedComisiones.find(c => c.id === comision.id);
    if (exists) {
      setSelectedComisiones(selectedComisiones.filter(c => c.id !== comision.id));
    } else {
      setSelectedComisiones([...selectedComisiones, comision]);
    }
  };

  // Actualizar monto automáticamente al seleccionar comisiones
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
      miembroId: formData.miembroId,
      miembroNombre: miembro?.nombre || 'Desconocido',
      monto: Number(formData.monto),
      fecha: formData.fecha,
      periodo: formData.periodo,
      descripcion: formData.descripcion,
      metodoPago: formData.metodoPago,
      carteraId: formData.carteraId,
      estado: formData.estado,
      registradoPor: usuarioActual?.nombre || 'Sistema',
      fechaRegistro: new Date().toISOString(),
    };

    // 1. Guardar Movimiento
    if (supabase) {
      const { error } = await supabase.from('movimientos_equipo').upsert(nuevoMovimiento, { onConflict: 'id' });
      if (error) { toast.error('Error al guardar movimiento: ' + error.message); return; }
    }
    
    const movsActualizados = editingId 
      ? movimientos.map(m => m.id === editingId ? nuevoMovimiento : m)
      : [nuevoMovimiento, ...movimientos];
    setMovimientos(movsActualizados);
    localStorage.setItem('voltech_movimientos_equipo', JSON.stringify(movsActualizados));

    // 2. Si es PAGO, marcar comisiones como pagadas
    if (formData.tipo === 'pago' && selectedComisiones.length > 0) {
      const comisionesActualizadas = comisionesPendientes.map(c => {
        if (selectedComisiones.find(sc => sc.id === c.id)) {
          return { ...c, estado: 'pagada', movimiento_pago_id: nuevoMovimiento.id, fecha_pago: formData.fecha };
        }
        return c;
      });
      setComisionesPendientes(comisionesActualizadas);
      localStorage.setItem('voltech_comisiones_pendientes', JSON.stringify(comisionesActualizadas));
      
      if (supabase) {
        const idsToUpdate = selectedComisiones.map(c => c.id);
        await supabase.from('comisiones_pendientes').update({ 
          estado: 'pagada', 
          movimiento_pago_id: nuevoMovimiento.id, 
          fecha_pago: formData.fecha 
        }).in('id', idsToUpdate);
      }
    }

    toast.success(editingId ? 'Movimiento actualizado' : 'Pago registrado exitosamente');
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      tipo: activeTab === 'inversiones' ? 'inversion' : 'pago',
      miembroId: '', miembroNombre: '', monto: '',
      fecha: new Date().toISOString().split('T')[0], periodo: new Date().toISOString().slice(0, 7),
      descripcion: '', metodoPago: 'efectivo', carteraId: '', estado: 'pagado',
    });
    setSelectedComisiones([]);
    setShowForm(false);
    setEditingId(null);
  };

  // Filtrar comisiones pendientes por miembro seleccionado en el formulario
  const comisionesDelMiembro = comisionesPendientes.filter(c => 
    c.miembroId === formData.miembroId && c.estado === 'pendiente'
  );

  // Filtrar historial
  const movimientosFiltrados = movimientos.filter(m => {
    const matchSearch = m.miembroNombre.toLowerCase().includes(searchTerm.toLowerCase()) || m.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMiembro = filtroMiembro === 'todos' || m.miembroId === filtroMiembro;
    const matchTipo = m.tipo === activeTab; // Solo mostrar según la pestaña activa
    return matchSearch && matchMiembro && matchTipo;
  });

  // Obtener detalles de un movimiento (qué comisiones pagó)
  const getDetallesMovimiento = (movId) => {
    return comisionesPendientes.filter(c => c.movimiento_pago_id === movId);
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Finanzas del Equipo</h1>
          <p className="text-sm text-voltech-muted mt-1">Gestiona pagos a vendedores e inversiones de socios</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Movimiento
        </button>
      </div>

      {/* PESTAÑAS */}
      <div className="flex gap-4 border-b border-voltech-border">
        <button 
          onClick={() => setActiveTab('pagos')}
          className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'pagos' ? 'text-voltech-cyan border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'}`}
        >
          <Briefcase className="w-4 h-4" /> Pagos a Vendedores
        </button>
        <button 
          onClick={() => setActiveTab('inversiones')}
          className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'inversiones' ? 'text-voltech-success border-voltech-success' : 'text-voltech-muted border-transparent hover:text-white'}`}
        >
          <TrendingUp className="w-4 h-4" /> Inversiones Socios
        </button>
      </div>

      {/* TARJETAS RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {activeTab === 'pagos' ? (
          <>
            <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-voltech-error/20"><TrendingDown className="w-5 h-5 text-voltech-error" /></div>
                <div><p className="text-xs text-voltech-muted">Total Pagado</p><p className="text-xl font-bold text-voltech-error">${totalPagado.toFixed(2)}</p></div>
              </div>
            </div>
            <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-voltech-warning/20"><Clock className="w-5 h-5 text-voltech-warning" /></div>
                <div><p className="text-xs text-voltech-muted">Comisiones Pendientes</p><p className="text-xl font-bold text-voltech-warning">${totalPendienteComisiones.toFixed(2)}</p></div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-voltech-success/20"><TrendingUp className="w-5 h-5 text-voltech-success" /></div>
                <div><p className="text-xs text-voltech-muted">Total Invertido</p><p className="text-xl font-bold text-voltech-success">${totalInvertido.toFixed(2)}</p></div>
              </div>
            </div>
          </>
        )}
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-cyan/20"><Wallet className="w-5 h-5 text-voltech-cyan" /></div>
            <div><p className="text-xs text-voltech-muted">Balance Neto</p><p className={`text-xl font-bold ${balance >= 0 ? 'text-voltech-cyan' : 'text-voltech-error'}`}>${balance.toFixed(2)}</p></div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-purple/20"><PieChart className="w-5 h-5 text-voltech-purple" /></div>
            <div><p className="text-xs text-voltech-muted">Movimientos Totales</p><p className="text-xl font-bold text-white">{movimientos.length}</p></div>
          </div>
        </div>
      </div>

      {/* FORMULARIO NUEVO MOVIMIENTO */}
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
                  <select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                    <option value="pago">💸 Pago a Vendedor</option>
                    <option value="inversion"> Inversión de Socio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Miembro *</label>
                  <select value={formData.miembroId} onChange={(e) => {
                    const miembro = equipo.find(x => x.id === e.target.value);
                    setFormData({ ...formData, miembroId: e.target.value, miembroNombre: miembro?.nombre || '' });
                  }} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                    <option value="">-- Selecciona --</option>
                    {equipo.map(e => (<option key={e.id} value={e.id}>{e.nombre} ({e.rol})</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Monto ($) *</label>
                  <input type="number" step="0.01" value={formData.monto} onChange={(e) => setFormData({ ...formData, monto: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Fecha *</label>
                  <input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Período</label>
                  <input type="text" value={formData.periodo} onChange={(e) => setFormData({ ...formData, periodo: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Ej: 2024-06" />
                </div>
                <div>
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Cartera</label>
                  <select value={formData.carteraId} onChange={(e) => setFormData({ ...formData, carteraId: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                    <option value="">-- Sin especificar --</option>
                    {carteras.map(c => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Método de Pago</label>
                  <select value={formData.metodoPago} onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                    <option value="efectivo">Efectivo</option>
                    <option value="pago_movil">Pago Móvil</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="zelle">Zelle</option>
                    <option value="binance">Binance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Estado</label>
                  <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                    <option value="pagado">Pagado</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Descripción</label>
                  <input type="text" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Concepto del pago..." />
                </div>
              </div>

              {/* SECCIÓN: SELECCIONAR VENTAS A PAGAR (Solo si es Pago) */}
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
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-voltech-cyan/10 border-voltech-cyan' : 'bg-voltech-surface border-voltech-border hover:border-voltech-cyan/50'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-voltech-cyan border-voltech-cyan' : 'border-voltech-muted'}`}>
                                {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                              </div>
                              <div>
                                <p className="text-sm text-white font-medium">{com.producto_nombre}</p>
                                <p className="text-xs text-voltech-muted">Venta #{com.venta_numero_orden} • {com.fecha_venta}</p>
                              </div>
                            </div>
                            <div className="text-right">
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

      {/* HISTORIAL */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-voltech-border flex flex-col md:flex-row items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-white">Historial de {activeTab === 'pagos' ? 'Pagos' : 'Inversiones'}</h3>
          <div className="flex gap-2 w-full md:w-auto">
            <select value={filtroMiembro} onChange={(e) => setFiltroMiembro(e.target.value)} className="input-voltech rounded-lg px-3 py-2 text-sm">
              <option value="todos">Todos los miembros</option>
              {equipo.map(e => (<option key={e.id} value={e.id}>{e.nombre}</option>))}
            </select>
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-voltech w-full rounded-lg pl-10 pr-4 py-2 text-sm" />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-voltech-dark border-b border-voltech-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Miembro</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Descripción</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Método</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Monto</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {movimientosFiltrados.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-12 text-voltech-muted"><FileText className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No hay registros</p></td></tr>
              ) : (
                movimientosFiltrados.map((mov) => {
                  const detalles = getDetallesMovimiento(mov.id);
                  const isExpanded = expandedRowId === mov.id;
                  
                  return (
                    <>
                      <tr key={mov.id} className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors cursor-pointer" onClick={() => setExpandedRowId(isExpanded ? null : mov.id)}>
                        <td className="px-4 py-3 text-sm text-voltech-muted flex items-center gap-2"><Calendar className="w-3 h-3" /> {mov.fecha}</td>
                        <td className="px-4 py-3"><p className="text-sm font-medium text-white">{mov.miembroNombre}</p></td>
                        <td className="px-4 py-3 text-sm text-voltech-muted max-w-xs truncate">{mov.descripcion || (mov.tipo === 'pago' ? 'Pago de comisiones' : 'Aporte de capital')}</td>
                        <td className="px-4 py-3 text-sm text-voltech-muted capitalize">{mov.metodoPago?.replace('_', ' ')}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-bold ${mov.tipo === 'inversion' ? 'text-voltech-success' : 'text-voltech-error'}`}>
                            {mov.tipo === 'inversion' ? '+' : '-'}${Number(mov.monto).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {detalles.length > 0 && (
                              <button className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); /* Lógica de editar */ }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); /* Lógica de eliminar */ }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* FILA EXPANDIDA CON DETALLES */}
                      {isExpanded && detalles.length > 0 && (
                        <tr className="bg-voltech-dark/50">
                          <td colSpan="6" className="px-4 py-4">
                            <div className="bg-voltech-surface border border-voltech-border rounded-lg p-4">
                              <h5 className="text-xs font-bold text-voltech-muted uppercase mb-3">Ventas incluidas en este pago</h5>
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
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}