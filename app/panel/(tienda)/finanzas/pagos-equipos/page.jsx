'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/app/context/PermissionsContext';
import { 
  DollarSign, TrendingUp, TrendingDown, Wallet, Plus, X, Save, Search,
  Calendar, CreditCard, Users, FileText, Trash2, Edit3, ArrowUpRight, 
  ArrowDownRight, Calculator, CheckCircle, Clock, Download, MessageCircle,
  ChevronDown, ChevronUp, Briefcase, PieChart, Printer, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PagosEquiposPage() {
  const { usuarioActual } = usePermissions();
  
  // Estados Principales
  const [activeTab, setActiveTab] = useState('pagos'); // 'pagos' | 'inversiones'
  const [movimientos, setMovimientos] = useState([]);
  const [equipo, setEquipo] = useState([]);
  const [carteras, setCarteras] = useState([]);
  const [comisionesPendientes, setComisionesPendientes] = useState([]);
  const [ventas, setVentas] = useState([]);
  
  // Estados UI
  const [showForm, setShowForm] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedMiembro, setSelectedMiembro] = useState(null);
  
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
    let movs = [], eqp = [], crt = [], coms = [], vts = [];
    
    try {
      if (supabase) {
        console.log('🔄 Cargando Finanzas desde Supabase...');
        const [{ data: d1, error: e1 }, { data: d2 }, { data: d3 }, { data: d4 }, { data: d5 }] = await Promise.all([
          supabase.from('movimientos_equipo').select('*').order('fecharegistro', { ascending: false }),
          supabase.from('usuarios').select('id, nombre, rol, activo, telefono').eq('activo', true),
          supabase.from('settings').select('clave, valor').eq('clave', 'carteras'),
          supabase.from('comisiones_pendientes').select('*').order('fecha_venta', { ascending: false }),
          supabase.from('ventas').select('*')
        ]);
        
        if (e1) {
          console.warn('️ Error Supabase:', e1.message);
          movs = JSON.parse(localStorage.getItem('voltech_movimientos_equipo') || '[]');
          eqp = JSON.parse(localStorage.getItem('voltech_equipo') || '[]').filter(m => m.activo);
          crt = JSON.parse(localStorage.getItem('voltech_carteras') || '[]');
          coms = JSON.parse(localStorage.getItem('voltech_comisiones_pendientes') || '[]');
          vts = JSON.parse(localStorage.getItem('voltech_ventas') || '[]');
        } else {
          movs = d1 || [];
          eqp = d2 || [];
          crt = (d3 && d3[0]?.valor) || [];
          coms = d4 || [];
          vts = d5 || [];
          console.log('✅ Finanzas cargadas desde Supabase');
        }
      } else {
        movs = JSON.parse(localStorage.getItem('voltech_movimientos_equipo') || '[]');
        eqp = JSON.parse(localStorage.getItem('voltech_equipo') || '[]').filter(m => m.activo);
        crt = JSON.parse(localStorage.getItem('voltech_carteras') || '[]');
        coms = JSON.parse(localStorage.getItem('voltech_comisiones_pendientes') || '[]');
        vts = JSON.parse(localStorage.getItem('voltech_ventas') || '[]');
      }

      setMovimientos(movs);
      setEquipo(eqp);
      setCarteras(crt);
      setComisionesPendientes(coms);
      setVentas(vts);
    } catch (error) {
      console.error('Error cargando finanzas:', error);
    }
  };
  
  cargarDatos();

  const handleActualizacion = () => cargarDatos();
  window.addEventListener('voltech-data-updated', handleActualizacion);

  return () => {
    window.removeEventListener('voltech-data-updated', handleActualizacion);
  };
}, []);

  // Cálculos para las tarjetas
  const totalInvertido = movimientos.filter(m => m.tipo === 'inversion').reduce((acc, m) => acc + Number(m.monto), 0);
  const totalPagado = movimientos.filter(m => m.tipo === 'pago').reduce((acc, m) => acc + Number(m.monto), 0);
  const totalPendienteComisiones = comisionesPendientes.filter(c => c.estado === 'pendiente').reduce((acc, c) => acc + Number(c.monto_comision), 0);
  const balance = totalInvertido - totalPagado;

  // Calcular estadísticas de un miembro
  const getMiembroStats = (miembroId) => {
    const miembroComisiones = comisionesPendientes.filter(c => c.miembroId === miembroId);
    const ventasPagadas = miembroComisiones.filter(c => c.estado === 'pagada');
    const ventasPendientes = miembroComisiones.filter(c => c.estado === 'pendiente');
    
    const totalVentas = miembroComisiones.length;
    const totalPagadas = ventasPagadas.length;
    const totalPendientes = ventasPendientes.length;
    const montoTotalVentas = miembroComisiones.reduce((acc, c) => acc + Number(c.monto_venta), 0);
    const montoTotalComisiones = miembroComisiones.reduce((acc, c) => acc + Number(c.monto_comision), 0);
    const montoPagado = ventasPagadas.reduce((acc, c) => acc + Number(c.monto_comision), 0);
    const montoPendiente = ventasPendientes.reduce((acc, c) => acc + Number(c.monto_comision), 0);
    
    const porcentajePromedio = totalVentas > 0 
      ? (miembroComisiones.reduce((acc, c) => acc + Number(c.porcentaje_comision), 0) / totalVentas).toFixed(1)
      : 0;

    return {
      totalVentas,
      totalPagadas,
      totalPendientes,
      montoTotalVentas,
      montoTotalComisiones,
      montoPagado,
      montoPendiente,
      porcentajePromedio
    };
  };

  const toggleComision = (comision) => {
    const exists = selectedComisiones.find(c => c.id === comision.id);
    if (exists) {
      setSelectedComisiones(selectedComisiones.filter(c => c.id !== comision.id));
    } else {
      setSelectedComisiones([...selectedComisiones, comision]);
    }
  };

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

    if (supabase) {
      const { error } = await supabase.from('movimientos_equipo').upsert(nuevoMovimiento, { onConflict: 'id' });
      if (error) { toast.error('Error al guardar movimiento: ' + error.message); return; }
    }
    
    const movsActualizados = editingId 
      ? movimientos.map(m => m.id === editingId ? nuevoMovimiento : m)
      : [nuevoMovimiento, ...movimientos];
    setMovimientos(movsActualizados);
    localStorage.setItem('voltech_movimientos_equipo', JSON.stringify(movsActualizados));

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
    // ✅ SINCRONIZACIÓN: Avisar a otros paneles si es necesario
    window.dispatchEvent(new Event('voltech-data-updated'));
  };

  const handleEdit = (movimiento) => {
    setEditingId(movimiento.id);
    setFormData({
      tipo: movimiento.tipo,
      miembroId: movimiento.miembroId,
      miembroNombre: movimiento.miembroNombre,
      monto: movimiento.monto.toString(),
      fecha: movimiento.fecha,
      periodo: movimiento.periodo,
      descripcion: movimiento.descripcion || '',
      metodoPago: movimiento.metodoPago,
      carteraId: movimiento.carteraId,
      estado: movimiento.estado,
    });
    setShowForm(true);
  };

  const handleDelete = async (movimiento) => {
    if (!confirm('¿Estás seguro de eliminar este movimiento?')) return;
    
    if (supabase) {
      await supabase.from('movimientos_equipo').delete().eq('id', movimiento.id);
    }
    
    const movsActualizados = movimientos.filter(m => m.id !== movimiento.id);
    setMovimientos(movsActualizados);
    localStorage.setItem('voltech_movimientos_equipo', JSON.stringify(movsActualizados));
    
    if (movimiento.tipo === 'pago') {
      const comisionesActualizadas = comisionesPendientes.map(c => {
        if (c.movimiento_pago_id === movimiento.id) {
          return { ...c, estado: 'pendiente', movimiento_pago_id: null, fecha_pago: null };
        }
        return c;
      });
      setComisionesPendientes(comisionesActualizadas);
      localStorage.setItem('voltech_comisiones_pendientes', JSON.stringify(comisionesActualizadas));
      
      if (supabase) {
        await supabase.from('comisiones_pendientes').update({ 
          estado: 'pendiente', 
          movimiento_pago_id: null, 
          fecha_pago: null 
        }).eq('movimiento_pago_id', movimiento.id);
      }
    }
    
    toast.success('Movimiento eliminado');
    window.dispatchEvent(new Event('voltech-data-updated'));
  };

  const generarReciboPDF = (movimiento) => {
    const detalles = getDetallesMovimiento(movimiento.id);
    const miembro = equipo.find(e => e.id === movimiento.miembroId);
    
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("RECIBO DE PAGO", 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("VOLTECH STORE", 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    let y = 45;
    
    doc.text(`N° Recibo: ${movimiento.id.slice(-8).toUpperCase()}`, 14, y);
    doc.text(`Fecha: ${new Date(movimiento.fecha).toLocaleDateString('es-VE')}`, 140, y);
    
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("INFORMACIÓN DEL BENEFICIARIO:", 14, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    doc.text(`Nombre: ${movimiento.miembroNombre}`, 14, y);
    doc.text(`Teléfono: ${miembro?.telefono || 'N/A'}`, 14, y + 5);
    doc.text(`Rol: ${miembro?.rol || 'N/A'}`, 14, y + 10);
    
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.text("DETALLE DEL PAGO:", 14, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    doc.text(`Monto Total: $${Number(movimiento.monto).toFixed(2)}`, 14, y);
    doc.text(`Método de Pago: ${(movimiento.metodoPago || 'efectivo').replace('_', ' ').toUpperCase()}`, 14, y + 5);
    doc.text(`Cartera: ${movimiento.carteraId || 'No especificada'}`, 14, y + 10);
    doc.text(`Período: ${movimiento.periodo}`, 14, y + 15);
    
    if (detalles.length > 0) {
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.text("VENTAS PAGADAS:", 14, y);
      y += 6;
      
      const tableData = detalles.map(d => [
        d.venta_numero_orden,
        d.fecha_venta,
        d.producto_nombre,
        `$${Number(d.monto_venta).toFixed(2)}`,
        `${d.porcentaje_comision}%`,
        `$${Number(d.monto_comision).toFixed(2)}`
      ]);
      
      autoTable(doc, {
        startY: y,
        head: [['N° Orden', 'Fecha', 'Producto', 'Monto Venta', '%', 'Comisión']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 30, 46], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 60 },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 30, halign: 'right' }
        }
      });
      
      y = doc.lastAutoTable.finalY + 10;
    }
    
    if (movimiento.descripcion) {
      doc.text(`Observaciones: ${movimiento.descripcion}`, 14, y);
      y += 10;
    }
    
    y += 20;
    doc.setFont("helvetica", "italic");
    doc.text("_______________________________", 14, y);
    doc.text("_______________________________", 120, y);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Firma del Beneficiario", 14, y + 5);
    doc.text("Firma del Administrador", 120, y + 5);
    
    doc.text(`Generado el ${new Date().toLocaleString('es-VE')}`, 105, 280, { align: 'center' });
    
    doc.save(`Recibo_${movimiento.miembroNombre}_${movimiento.fecha}.pdf`);
    toast.success('Recibo PDF generado correctamente');
  };

  const notificarWhatsApp = (movimiento) => {
    const miembro = equipo.find(e => e.id === movimiento.miembroId);
    const telefono = miembro?.telefono?.replace(/\D/g, '') || '';
    
    if (!telefono) {
      toast.error('El miembro no tiene número de teléfono registrado');
      return;
    }
    
    const detalles = getDetallesMovimiento(movimiento.id);
    let mensaje = `¡Hola ${movimiento.miembroNombre}! \n\n`;
    mensaje += `*VOLTECH STORE* - Comprobante de Pago\n\n`;
    mensaje += `📅 Fecha: ${new Date(movimiento.fecha).toLocaleDateString('es-VE')}\n`;
    mensaje += `💰 *Monto Total: $${Number(movimiento.monto).toFixed(2)}*\n`;
    mensaje += `💳 Método: ${(movimiento.metodoPago || 'efectivo').replace('_', ' ').toUpperCase()}\n`;
    
    if (detalles.length > 0) {
      mensaje += `\n📦 *Ventas Pagadas:* ${detalles.length}\n`;
      detalles.forEach((d, i) => {
        mensaje += `${i + 1}. ${d.producto_nombre} - $${Number(d.monto_comision).toFixed(2)}\n`;
      });
    }
    
    mensaje += `\n¡Gracias por tu excelente trabajo! `;
    
    const url = `https://wa.me/58${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp abierto para enviar notificación');
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

  const comisionesDelMiembro = comisionesPendientes.filter(c => 
    c.miembroId === formData.miembroId && c.estado === 'pendiente'
  );

  const movimientosFiltrados = movimientos.filter(m => {
    const matchSearch = m.miembroNombre.toLowerCase().includes(searchTerm.toLowerCase()) || m.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMiembro = filtroMiembro === 'todos' || m.miembroId === filtroMiembro;
    const matchTipo = m.tipo === activeTab;
    return matchSearch && matchMiembro && matchTipo;
  });

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
          <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-voltech-success/20"><TrendingUp className="w-5 h-5 text-voltech-success" /></div>
              <div><p className="text-xs text-voltech-muted">Total Invertido</p><p className="text-xl font-bold text-voltech-success">${totalInvertido.toFixed(2)}</p></div>
            </div>
          </div>
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

      {activeTab === 'pagos' && (
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-voltech-cyan" />
            <h3 className="text-lg font-bold text-white">Seleccionar Miembro del Equipo</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {equipo.map(miembro => {
              const stats = getMiembroStats(miembro.id);
              const isSelected = selectedMiembro?.id === miembro.id;
              
              return (
                <button
                  key={miembro.id}
                  onClick={() => setSelectedMiembro(isSelected ? null : miembro)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isSelected 
                      ? 'bg-voltech-cyan/10 border-voltech-cyan ring-2 ring-voltech-cyan/50' 
                      : 'bg-voltech-dark/30 border-voltech-border hover:border-voltech-cyan/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      isSelected ? 'bg-voltech-cyan text-white' : 'bg-voltech-purple/20 text-voltech-purple'
                    }`}>
                      {miembro.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{miembro.nombre}</p>
                      <p className="text-xs text-voltech-muted capitalize">{miembro.rol}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-voltech-muted">Ventas:</span>
                      <span className="text-white font-bold">{stats.totalVentas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-voltech-muted">Pagadas:</span>
                      <span className="text-voltech-success font-bold">{stats.totalPagadas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-voltech-muted">Pendientes:</span>
                      <span className="text-voltech-warning font-bold">{stats.totalPendientes}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-voltech-border">
                      <span className="text-voltech-muted">Comisión:</span>
                      <span className="text-voltech-cyan font-bold">{stats.porcentajePromedio}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedMiembro && activeTab === 'pagos' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden"
          >
            <div className="p-6 border-b border-voltech-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-voltech-cyan flex items-center justify-center text-white font-bold text-xl">
                  {selectedMiembro.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedMiembro.nombre}</h3>
                  <p className="text-sm text-voltech-muted">{selectedMiembro.telefono} • {selectedMiembro.rol}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMiembro(null)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {(() => {
                const stats = getMiembroStats(selectedMiembro.id);
                const comisionesMiembro = comisionesPendientes.filter(c => c.miembroId === selectedMiembro.id);
                
                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                        <p className="text-xs text-voltech-muted mb-1">Total Ventas</p>
                        <p className="text-2xl font-bold text-white">{stats.totalVentas}</p>
                      </div>
                      <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                        <p className="text-xs text-voltech-muted mb-1">Ventas Pagadas</p>
                        <p className="text-2xl font-bold text-voltech-success">{stats.totalPagadas}</p>
                      </div>
                      <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                        <p className="text-xs text-voltech-muted mb-1">Ventas Pendientes</p>
                        <p className="text-2xl font-bold text-voltech-warning">{stats.totalPendientes}</p>
                      </div>
                      <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                        <p className="text-xs text-voltech-muted mb-1">% Promedio</p>
                        <p className="text-2xl font-bold text-voltech-cyan">{stats.porcentajePromedio}%</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                        <p className="text-xs text-voltech-muted mb-1">Monto Total en Ventas</p>
                        <p className="text-xl font-bold text-white">${stats.montoTotalVentas.toFixed(2)}</p>
                      </div>
                      <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                        <p className="text-xs text-voltech-muted mb-1">Total Comisiones</p>
                        <p className="text-xl font-bold text-voltech-cyan">${stats.montoTotalComisiones.toFixed(2)}</p>
                      </div>
                      <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                        <p className="text-xs text-voltech-muted mb-1">Monto Pendiente</p>
                        <p className="text-xl font-bold text-voltech-warning">${stats.montoPendiente.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-bold text-white mb-3">Historial de Comisiones</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-voltech-dark border-b border-voltech-border">
                            <tr>
                              <th className="text-left px-3 py-2 text-xs text-voltech-muted">Fecha</th>
                              <th className="text-left px-3 py-2 text-xs text-voltech-muted">N° Orden</th>
                              <th className="text-left px-3 py-2 text-xs text-voltech-muted">Producto</th>
                              <th className="text-right px-3 py-2 text-xs text-voltech-muted">Monto Venta</th>
                              <th className="text-right px-3 py-2 text-xs text-voltech-muted">%</th>
                              <th className="text-right px-3 py-2 text-xs text-voltech-muted">Comisión</th>
                              <th className="text-center px-3 py-2 text-xs text-voltech-muted">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comisionesMiembro.length === 0 ? (
                              <tr>
                                <td colSpan="7" className="text-center py-8 text-voltech-muted">No hay comisiones registradas</td>
                              </tr>
                            ) : (
                              comisionesMiembro.map((com) => (
                                <tr key={com.id} className="border-b border-voltech-border/50">
                                  <td className="px-3 py-2 text-voltech-muted">{com.fecha_venta}</td>
                                  <td className="px-3 py-2 text-voltech-cyan font-mono text-xs">{com.venta_numero_orden}</td>
                                  <td className="px-3 py-2 text-white">{com.producto_nombre}</td>
                                  <td className="px-3 py-2 text-right text-voltech-muted">${Number(com.monto_venta).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right text-voltech-muted">{com.porcentaje_comision}%</td>
                                  <td className="px-3 py-2 text-right font-bold text-voltech-success">${Number(com.monto_comision).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-center">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      com.estado === 'pagada' ? 'bg-voltech-success/20 text-voltech-success' : 'bg-voltech-warning/20 text-voltech-warning'
                                    }`}>
                                      {com.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    <option value="pago"> Pago a Vendedor</option>
                    <option value="inversion">💰 Inversión de Socio</option>
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
                    <React.Fragment key={mov.id}>
                      <tr className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors cursor-pointer" onClick={() => setExpandedRowId(isExpanded ? null : mov.id)}>
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
                              <button 
                                onClick={(e) => { e.stopPropagation(); setExpandedRowId(isExpanded ? null : mov.id); }}
                                className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEdit(mov); }} 
                              className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(mov); }} 
                              className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {isExpanded && detalles.length > 0 && (
                        <tr className="bg-voltech-dark/50">
                          <td colSpan="6" className="px-4 py-4">
                            <div className="bg-voltech-surface border border-voltech-border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-xs font-bold text-voltech-muted uppercase">Ventas incluidas en este pago</h5>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => notificarWhatsApp(mov)}
                                    className="px-3 py-1.5 bg-green-500/20 text-green-500 rounded-lg text-xs hover:bg-green-500/30 transition-colors flex items-center gap-1"
                                  >
                                    <MessageCircle className="w-3 h-3" /> WhatsApp
                                  </button>
                                  <button 
                                    onClick={() => generarReciboPDF(mov)}
                                    className="px-3 py-1.5 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-xs hover:bg-voltech-cyan/30 transition-colors flex items-center gap-1"
                                  >
                                    <Printer className="w-3 h-3" /> Recibo PDF
                                  </button>
                                </div>
                              </div>
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
                    </React.Fragment>
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