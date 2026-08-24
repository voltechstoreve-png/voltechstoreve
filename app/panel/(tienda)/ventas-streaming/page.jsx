'use client';

import React, { useState, useEffect, useRef, Fragment, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/app/context/PermissionsContext';
import { useNotificaciones } from '@/app/context/NotificationContext';
import { 
  MonitorPlay, Database, AlertTriangle, DollarSign, Package, Search, 
  Edit3, Trash2, X, Save, Calendar, MessageCircle, Mail, RefreshCw,
  Eye, EyeOff, ChevronDown, CheckCircle, Link as LinkIcon, Plus, Tag,
  Gift, AlertCircle, StickyNote, Copy, Send, Users, Eye as EyeIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import ModalWhatsApp from '@/components/ModalWhatsApp';
import { resolverPlantillaWa, rellenarVariables } from '@/components/EmojiTextarea';

export default function VentasStreamingPage() {
  const { usuarioActual, esVendedor, esAdmin, esSocio } = usePermissions();
  const { agregarNotificacion } = useNotificaciones();
  
  const [activeTab, setActiveTab] = useState('nueva');
  const [ventas, setVentas] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [equipo, setEquipo] = useState([]);
  const [plataformas, setPlataformas] = useState([]);
  const [cupones, setCupones] = useState([]);
  const [settingsMap, setSettingsMap] = useState({});
  
  // ✅ NUEVO: Configuración de recordatorios desde /panel/configuracion
  const [configRecordatorios, setConfigRecordatorios] = useState({
    hora: '08:00',
    diasAnticipacion: 2,
    activado: true
  });
  
  const [currentUser, setCurrentUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [verTodo, setVerTodo] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPlataformasModal, setShowPlataformasModal] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [mostrarPrecios, setMostrarPrecios] = useState(false);
  const [nuevaPlataforma, setNuevaPlataforma] = useState('');
  
  // ✅ NUEVO: Estado para "Ver Cuentas" (reemplaza expandedVenta simple)
  const [expandedCuentasVenta, setExpandedCuentasVenta] = useState(null);
  const [expandedCuenta, setExpandedCuenta] = useState(null);
  
  // ✅ NUEVO: Modal "Asignar Cuenta" a una plataforma específica de una venta
  const [showAsignarPlataformaModal, setShowAsignarPlataformaModal] = useState(false);
  const [ventaParaAsignar, setVentaParaAsignar] = useState(null);
  const [plataformaIdxParaAsignar, setPlataformaIdxParaAsignar] = useState(null);
  
  const [showRegaloModal, setShowRegaloModal] = useState(false);
  const [regaloData, setRegaloData] = useState({
    ventaId: null, plataformaIndex: 0, dias: 0, tipo: 'regalo', nota: ''
  });

  const [showRecordatorioModal, setShowRecordatorioModal] = useState(false);
  const [recordatorioText, setRecordatorioText] = useState('');
  const [recordatorioPlatIdx, setRecordatorioPlatIdx] = useState(0);
  
  const [showEnviarCuentaModal, setShowEnviarCuentaModal] = useState(false);
  const [cuentaText, setCuentaText] = useState('');
  
  const [showReemplazoModal, setShowReemplazoModal] = useState(false);
  const [reemplazoText, setReemplazoText] = useState('');

  const [showReemplazoCuentaModal, setShowReemplazoCuentaModal] = useState(false);
  const [reemplazoData, setReemplazoData] = useState({
    cuentaId: null,
    nuevaPlataforma: '',
    nuevoCorreo: '',
    nuevaContraseña: '',
    nuevosPins: [''],
    observacion: ''
  });

  const [sugerenciasClientes, setSugerenciasClientes] = useState([]);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const clienteInputRef = useRef(null);

  const [showFormNueva, setShowFormNueva] = useState(false);
  const [showFormCuenta, setShowFormCuenta] = useState(false);
  const [showFormInventario, setShowFormInventario] = useState(false);

  const [cuponInput, setCuponInput] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState(null);
  const [errorCupon, setErrorCupon] = useState('');

  const [formDataNueva, setFormDataNueva] = useState({
    fecha: new Date().toISOString().split('T')[0],
    vendedor: '', cliente: '', telefono: '',
    metodoPago: 'efectivo',
    cartera: 'Caja Principal',
    plataformas: [{
      plataforma: '', fechaVencimiento: '', diasDisponibles: 30,
      precioMayor: 0, precioDetal: 0,
    }],
    cuentaAsignada: null,
  });

  const [formDataCuenta, setFormDataCuenta] = useState({
    plataforma: '', correo: '', contraseña: '',
    nombrePerfil: '',
    pins: [''], cantidad: 1, vendedor: '',
  });

  const [formDataInventario, setFormDataInventario] = useState({
    fecha: new Date().toISOString().split('T')[0], fechaVencimiento: '',
    diasDisponibles: 30, plataforma: '', correo: '', contraseña: '',
    nombrePerfil: '', pins: [''], cantidad: 1, vendedor: '',
    precioMayor: 0, precioDetal: 0,
    proveedor: '', telefonoProveedor: '', metodoPago: 'efectivo', cartera: 'Caja Principal',
  });

  const [historialReemplazos, setHistorialReemplazos] = useState({});

  // ✅ NUEVO: Cargar configuración de recordatorios desde Supabase
  useEffect(() => {
    const cargarConfig = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('valor')
          .eq('clave', 'configuracion_panel')
          .single();
        if (!error && data?.valor?.recordatoriosStreaming) {
          setConfigRecordatorios(prev => ({
            ...prev,
            ...data.valor.recordatoriosStreaming
          }));
        }
      } catch (err) {
        console.error('Error cargando config recordatorios:', err);
      }
    };
    cargarConfig();
  }, []);

  useEffect(() => {
    const cargarDatos = async () => {
      const userLogged = localStorage.getItem('voltech_user');
      if (userLogged) setCurrentUser(JSON.parse(userLogged));

      try {
        if (supabase) {
          const [{ data: v }, { data: c }, { data: i }, { data: p }, { data: cp }, { data: u }, { data: cl }, { data: st }] = await Promise.all([
            supabase.from('ventas_streaming').select('*').order('fecharegistro', { ascending: false }),
            supabase.from('cuentas_streaming').select('*'),
            supabase.from('inventario_streaming').select('*'),
            supabase.from('settings').select('valor').eq('clave', 'plataformas_streaming').single(),
            supabase.from('cupones').select('*'),
            supabase.from('usuarios').select('*').eq('activo', true),
            supabase.from('clientes').select('*'),
            supabase.from('settings').select('clave, valor'),
          ]);
          
          if (v) {
            setVentas(v);
          }
          if (c) {
            // ✅ SINCRONIZACIÓN: cuentas usadas en ventas quedan ocupadas y con el perfil del cliente
            const ventasRef = v || [];
            c.forEach(cuenta => {
              if (cuenta.estado === 'reemplazada') return;
              const ventaRef = ventasRef.find(vt =>
                (vt.plataformas || []).some(p => p.cuentaAsignadaId === cuenta.id || p.cuentaAsignada?.id === cuenta.id) ||
                vt.cuentaasignada?.id === cuenta.id || vt.cuentaAsignada?.id === cuenta.id
              );
              if (ventaRef) {
                cuenta.estado = 'ocupada';
                cuenta.nombrePerfil = ventaRef.cliente || cuenta.nombrePerfil;
                cuenta.ventaId = ventaRef.id;
              }
            });
            setCuentas(c);
          }
          if (i) setInventario(i);
          if (p?.valor) setPlataformas(p.valor);
          if (cp) setCupones(cp);
          if (u) setEquipo(u);
          if (cl) setClientes(cl);
          
          if (st) {
            const settingsMapLocal = {};
            st.forEach(s => {
              let v = s.valor;
              if (typeof v === 'string') {
                try { v = JSON.parse(v); } catch (e) {}
              }
              settingsMapLocal[s.clave] = v;
            });
            setSettingsMap(settingsMapLocal);
          }
        } else {
          const ventasGuardadas = localStorage.getItem('voltech_ventas_streaming');
          if (ventasGuardadas) setVentas(JSON.parse(ventasGuardadas));
          const cuentasGuardadas = localStorage.getItem('voltech_cuentas_streaming');
          if (cuentasGuardadas) setCuentas(JSON.parse(cuentasGuardadas));
          const inventarioGuardado = localStorage.getItem('voltech_inventario_streaming');
          if (inventarioGuardado) setInventario(JSON.parse(inventarioGuardado));
          const clientesGuardados = localStorage.getItem('voltech_clientes');
          if (clientesGuardados) setClientes(JSON.parse(clientesGuardados));
          const equipoGuardado = localStorage.getItem('voltech_equipo');
          if (equipoGuardado) setEquipo(JSON.parse(equipoGuardado));
          const cuponesGuardados = localStorage.getItem('voltech_cupones');
          if (cuponesGuardados) setCupones(JSON.parse(cuponesGuardados));
          const plataformasGuardadas = localStorage.getItem('voltech_plataformas_streaming');
          if (plataformasGuardadas) setPlataformas(JSON.parse(plataformasGuardadas));
          else setPlataformas(['Netflix Premium', 'Netflix Estándar', 'Disney+', 'HBO Max', 'Spotify', 'Amazon Prime', 'YouTube Premium', 'Apple TV+']);
          setSettingsMap(JSON.parse(localStorage.getItem('voltech_settings') || '{}'));
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };

    cargarDatos();
    const handleActualizacion = () => cargarDatos();
    window.addEventListener('voltech-data-updated', handleActualizacion);
    return () => window.removeEventListener('voltech-data-updated', handleActualizacion);
  }, [esVendedor, esAdmin, esSocio, usuarioActual]);

  // ✅ NUEVO: Verificar vencimientos y emitir notificación según configuración
  useEffect(() => {
    if (!configRecordatorios.activado || ventas.length === 0) return;
    
    const verificarVencimientos = async () => {
      const ahora = new Date();
      const [horaStr, minStr] = (configRecordatorios.hora || '08:00').split(':');
      const horaAlerta = parseInt(horaStr);
      const minAlerta = parseInt(minStr || 0);
      const diasAnticipacion = parseInt(configRecordatorios.diasAnticipacion || 2);
      
      // Solo ejecutar si ya pasó la hora configurada del día
      if (ahora.getHours() < horaAlerta || (ahora.getHours() === horaAlerta && ahora.getMinutes() < minAlerta)) return;
      
      const ventasActualizadas = [...ventas];
      let cambios = false;
      
      ventas.forEach((venta, idx) => {
        if (!venta.plataformas) return;
        
        venta.plataformas.forEach((plat, platIdx) => {
          if (!plat.fechaVencimiento) return;
          
          const venc = new Date(plat.fechaVencimiento);
          const diffMs = venc - ahora;
          const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          
          // Flag único: fecha vencimiento + plataforma para no repetir
          const flagKey = `notificado_${plat.fechaVencimiento}_${platIdx}`;
          
          if (diasRestantes === diasAnticipacion && !venta[flagKey]) {
            // Disparar notificación
            if (agregarNotificacion) {
              agregarNotificacion({
                tipo: 'vencimiento_streaming',
                titulo: `⏰ ${venta.cliente} - ${plat.plataforma} vence pronto`,
                mensaje: `La cuenta de ${plat.plataforma} de ${venta.cliente} vence en ${diasRestantes} día(s) (${plat.fechaVencimiento}).`,
                detalle: `Teléfono: ${venta.telefono} | Monto: $${plat.precioDetal || 0}`,
                usuario_id: 'admin',
                venta_id: venta.id,
                plataforma_idx: platIdx
              });
            }
            
            // Marcar flag
            ventasActualizadas[idx] = { ...ventasActualizadas[idx], [flagKey]: true };
            cambios = true;
          }
        });
      });
      
      if (cambios && supabase) {
        for (const v of ventasActualizadas) {
          if (v !== ventas.find(vt => vt.id === v.id)) {
            await supabase.from('ventas_streaming').update(v).eq('id', v.id);
          }
        }
        setVentas(ventasActualizadas);
      }
    };
    
    verificarVencimientos();
    // Revisar cada hora
    const intervalo = setInterval(verificarVencimientos, 60 * 60 * 1000);
    return () => clearInterval(intervalo);
  }, [ventas, configRecordatorios, agregarNotificacion]);

  const calcularFechaVencimiento = (fechaInicio, dias) => {
    if (!fechaInicio || !dias) return '';
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + parseInt(dias));
    return fecha.toISOString().split('T')[0];
  };

  const calcularDiasDesdeFecha = (fechaInicio, fechaVencimiento) => {
    if (!fechaInicio || !fechaVencimiento) return 0;
    const diffTime = new Date(fechaVencimiento) - new Date(fechaInicio);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleClienteChange = (value) => {
    setFormDataNueva(prev => ({ ...prev, cliente: value }));
    if (value.length > 0) {
      const filtrados = clientes.filter(c => {
        const nombre = (c.nombre || '').toLowerCase();
        const telefono = (c.telefono || '').toLowerCase();
        const search = value.toLowerCase();
        return nombre.includes(search) || telefono.includes(search);
      });
      setSugerenciasClientes(filtrados);
      setShowSugerencias(filtrados.length > 0);
    } else {
      setSugerenciasClientes([]);
      setShowSugerencias(false);
    }
  };

  const seleccionarCliente = (cliente) => {
    setFormDataNueva(prev => ({
      ...prev, cliente: cliente.nombre || '', telefono: cliente.telefono || prev.telefono
    }));
    setShowSugerencias(false);
    setSugerenciasClientes([]);
  };

  const agregarPlataformaAVenta = () => {
    setFormDataNueva(prev => ({
      ...prev,
      plataformas: [
        ...prev.plataformas,
        { plataforma: '', fechaVencimiento: calcularFechaVencimiento(prev.fecha, 30), diasDisponibles: 30, precioMayor: 0, precioDetal: 0 }
      ]
    }));
  };

  const eliminarPlataformaDeVenta = (index) => {
    if (formDataNueva.plataformas.length > 1) {
      setFormDataNueva(prev => ({ ...prev, plataformas: prev.plataformas.filter((_, i) => i !== index) }));
    } else {
      toast.error('Debe haber al menos una plataforma');
    }
  };

  const actualizarPlataforma = (index, field, value) => {
    const nuevasPlataformas = [...formDataNueva.plataformas];
    if (field === 'diasDisponibles') {
      nuevasPlataformas[index].diasDisponibles = parseInt(value) || 0;
      nuevasPlataformas[index].fechaVencimiento = calcularFechaVencimiento(formDataNueva.fecha, parseInt(value) || 0);
    } else if (field === 'fechaVencimiento') {
      nuevasPlataformas[index].fechaVencimiento = value;
      nuevasPlataformas[index].diasDisponibles = calcularDiasDesdeFecha(formDataNueva.fecha, value);
    } else {
      nuevasPlataformas[index][field] = value;
    }
    setFormDataNueva(prev => ({ ...prev, plataformas: nuevasPlataformas }));
  };

  const validarYAplicarCupon = () => {
    setErrorCupon('');
    setCuponAplicado(null);
    if (!cuponInput.trim()) return;
    const cupon = cupones.find(c => c.codigo.toUpperCase() === cuponInput.trim().toUpperCase() && c.estado === 'activo');
    if (!cupon) { setErrorCupon('Cupón no encontrado o inactivo'); return; }
    const ahora = new Date();
    if (cupon.fecha_inicio && new Date(cupon.fecha_inicio) > ahora) { setErrorCupon('Este cupón aún no está activo'); return; }
    if (cupon.fecha_vencimiento && new Date(cupon.fecha_vencimiento) < ahora) { setErrorCupon('Este cupón ha expirado'); return; }
    if (cupon.limite_usos === 'limitado' && (cupon.usos || 0) >= (cupon.max_usos || 0)) { setErrorCupon('Este cupón ha alcanzado su límite de usos'); return; }
    
    let descuento = 0;
    const subtotal = formDataNueva.plataformas.reduce((acc, p) => acc + (p.precioDetal || 0), 0);
    if (cupon.tipo_aplicacion === 'todos') {
      if (cupon.tipo_descuento === 'gratis' || cupon.es_gratis) descuento = subtotal;
      else if (cupon.tipo_descuento === 'porcentaje') descuento = subtotal * ((cupon.valor_descuento || 0) / 100);
      else if (cupon.tipo_descuento === 'monto_fijo') descuento = Math.min(cupon.valor_descuento || 0, subtotal);
    } else { setErrorCupon('Este cupón no aplica'); return; }
    setCuponAplicado({ ...cupon, descuentoCalculado: descuento });
  };

  const aplicarRegaloFalla = async () => {
    const { ventaId, plataformaIndex, dias, tipo, nota } = regaloData;
    if (!ventaId || dias === 0) { toast.error('Selecciona una venta y especifica los días'); return; }
    try {
      const ventaActual = ventas.find(v => v.id === ventaId);
      if (!ventaActual) return;
      const nuevasPlataformas = [...ventaActual.plataformas];
      if (nuevasPlataformas[plataformaIndex]) {
        const plat = { ...nuevasPlataformas[plataformaIndex] };
        const diasActuales = plat.diasDisponibles || 0;
        plat.diasDisponibles = tipo === 'regalo' ? diasActuales + dias : diasActuales - dias;
        plat.fechaVencimiento = calcularFechaVencimiento(ventaActual.fecha, plat.diasDisponibles);
        if (!plat.historialRegalos) plat.historialRegalos = [];
        plat.historialRegalos.push({ tipo, dias, nota, fecha: new Date().toISOString(), usuario: currentUser?.nombre || 'Admin' });
        nuevasPlataformas[plataformaIndex] = plat;
      }
      if (supabase) await supabase.from('ventas_streaming').update({ plataformas: nuevasPlataformas }).eq('id', ventaId);
      setVentas(ventas.map(v => v.id === ventaId ? { ...v, plataformas: nuevasPlataformas } : v));
      toast.success(`${tipo === 'regalo' ? 'Días de regalo' : 'Días de falla'} aplicados`);
      setShowRegaloModal(false);
      setRegaloData({ ventaId: null, plataformaIndex: 0, dias: 0, tipo: 'regalo', nota: '' });
      window.dispatchEvent(new Event('voltech-data-updated'));
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al aplicar el ajuste');
    }
  };

  const guardarNuevaPlataforma = async () => {
    if (!formDataNueva.cliente || !formDataNueva.vendedor || formDataNueva.plataformas.some(p => !p.plataforma)) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    try {
      const subtotal = formDataNueva.plataformas.reduce((sum, p) => sum + (p.precioDetal || 0), 0);
      const descuentoAplicado = cuponAplicado ? cuponAplicado.descuentoCalculado : 0;
      const total = subtotal - descuentoAplicado;
      const nuevaVenta = {
        id: editingId || crypto.randomUUID(),
        fecha: formDataNueva.fecha,
        vendedor: formDataNueva.vendedor,
        cliente: formDataNueva.cliente,
        telefono: formDataNueva.telefono,
        metodopago: formDataNueva.metodoPago,
        cartera: formDataNueva.cartera,
        plataformas: formDataNueva.plataformas,
        total, subtotal,
        cupon_aplicado: cuponAplicado ? cuponAplicado.codigo : null,
        descuento_aplicado: descuentoAplicado,
        total_con_descuento: total,
        estado: 'activa',
        fecharegistro: new Date().toISOString(),
        registradopor: currentUser?.nombre || 'Admin',
        cuentaasignada: formDataNueva.cuentaAsignada,
      };
      if (supabase) {
        const { error } = await supabase.from('ventas_streaming').upsert(nuevaVenta, { onConflict: 'id' });
        if (error) throw error;
      }
      setVentas(editingId ? ventas.map(v => v.id === editingId ? nuevaVenta : v) : [nuevaVenta, ...ventas]);
      
      if (formDataNueva.cuentaAsignada && supabase) {
        await supabase.from('cuentas_streaming').update({ estado: 'ocupada', ventaId: nuevaVenta.id }).eq('id', formDataNueva.cuentaAsignada.id);
        setCuentas(cuentas.map(c => c.id === formDataNueva.cuentaAsignada.id ? { ...c, estado: 'ocupada', ventaId: nuevaVenta.id } : c));
      }
      
      if (cuponAplicado && supabase) {
        await supabase.from('cupones').update({ 
          usos: (cuponAplicado.usos || 0) + 1,
          descuento_total: (cuponAplicado.descuento_total || 0) + descuentoAplicado
        }).eq('id', cuponAplicado.id);
      }
      
      if (formDataNueva.cliente && formDataNueva.telefono) {
        const clienteExistente = clientes.find(c => c.telefono === formDataNueva.telefono || c.nombre?.toLowerCase() === formDataNueva.cliente.toLowerCase());
        if (!clienteExistente) {
          const nuevoCliente = {
            id: Date.now().toString(), nombre: formDataNueva.cliente, telefono: formDataNueva.telefono,
            email: '', direccion: '', fechaRegistro: new Date().toISOString().split('T')[0],
            ultimaCompra: new Date().toISOString().split('T')[0], totalCompras: 1, totalGastado: total,
            etiquetas: ['Streaming'], registradoPor: currentUser?.nombre || 'Admin',
          };
          if (supabase) await supabase.from('clientes').insert(nuevoCliente);
          setClientes([...clientes, nuevoCliente]);
        } else {
          const clienteActualizado = { ...clienteExistente, totalCompras: (clienteExistente.totalCompras || 0) + 1, totalGastado: (clienteExistente.totalGastado || 0) + total, ultimaCompra: new Date().toISOString().split('T')[0] };
          if (supabase) await supabase.from('clientes').update(clienteActualizado).eq('id', clienteExistente.id);
          setClientes(clientes.map(c => c.id === clienteExistente.id ? clienteActualizado : c));
        }
      }
      
      toast.success(editingId ? 'Venta actualizada' : 'Venta registrada correctamente');
      
      if (agregarNotificacion && !editingId) {
        agregarNotificacion({
          tipo: 'nueva_venta_streaming',
          titulo: '📺 Nueva Venta Streaming',
          mensaje: `Venta de $${Number(total).toFixed(2)} a ${formDataNueva.cliente}`,
          detalle: `Vendedor: ${formDataNueva.vendedor} | Plataformas: ${formDataNueva.plataformas.map(p => p.plataforma).join(', ')}`,
          usuario_id: 'admin'
        });
      }
      
      window.dispatchEvent(new Event('voltech-data-updated'));
      resetForm('nueva');
      setShowFormNueva(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar: ' + error.message);
    }
  };

  const actualizarPinCuenta = (index, valor) => {
    const nuevosPins = [...formDataCuenta.pins];
    nuevosPins[index] = valor;
    setFormDataCuenta(prev => ({ ...prev, pins: nuevosPins }));
  };

  // ✅ ACTUALIZADO: Emite notificación de cuenta nueva
  const guardarCuenta = async () => {
    if (!formDataCuenta.plataforma || !formDataCuenta.correo || !formDataCuenta.contraseña) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    try {
      const nuevasCuentas = [];
      for (let i = 0; i < formDataCuenta.cantidad; i++) {
        nuevasCuentas.push({
          id: (Date.now() + i).toString(),
          plataforma: formDataCuenta.plataforma,
          correo: formDataCuenta.correo,
          contraseña: formDataCuenta.contraseña,
          nombrePerfil: formDataCuenta.nombrePerfil,
          pin: formDataCuenta.pins[i] || '',
          vendedor: formDataCuenta.vendedor,
          estado: 'libre',
          fecharegistro: new Date().toISOString(),
          registradopor: currentUser?.nombre || 'Admin',
          perfil: i + 1,
        });
      }
      if (supabase) {
        const { error } = await supabase.from('cuentas_streaming').insert(nuevasCuentas);
        if (error) throw error;
      }
      setCuentas([...nuevasCuentas, ...cuentas]);
      toast.success(`${formDataCuenta.cantidad} cuenta(s) guardada(s)`);
      
      // ✅ Notificación
      if (agregarNotificacion) {
        agregarNotificacion({
          tipo: 'cuenta_nueva',
          titulo: '➕ Nueva cuenta streaming agregada',
          mensaje: `${formDataCuenta.cantidad} cuenta(s) de ${formDataCuenta.plataforma} disponibles`,
          detalle: `Correo: ${formDataCuenta.correo} | Registrada por: ${currentUser?.nombre || 'Admin'}`,
          usuario_id: 'admin'
        });
      }
      
      setFormDataCuenta({ plataforma: '', correo: '', contraseña: '', nombrePerfil: '', pins: [''], cantidad: 1, vendedor: '' });
      window.dispatchEvent(new Event('voltech-data-updated'));
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar: ' + error.message);
    }
  };

  const actualizarPinInventario = (index, valor) => {
    const nuevosPins = [...formDataInventario.pins];
    nuevosPins[index] = valor;
    setFormDataInventario(prev => ({ ...prev, pins: nuevosPins }));
  };

  const guardarInventario = async () => {
    if (!formDataInventario.plataforma || !formDataInventario.correo) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    try {
      const nuevoInventario = { id: Date.now().toString(), ...formDataInventario, estado: 'disponible', fecharegistro: new Date().toISOString(), registradopor: currentUser?.nombre || 'Admin' };
      if (supabase) {
        const { error } = await supabase.from('inventario_streaming').insert(nuevoInventario);
        if (error) throw error;
      }
      setInventario([nuevoInventario, ...inventario]);
      toast.success('Cuenta agregada al inventario');
      resetForm('inventario');
      setShowFormInventario(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar inventario: ' + error.message);
    }
  };

  // ✅ ACTUALIZADO: Emite notificación de reemplazo
  const reemplazarCuenta = async () => {
    if (!reemplazoData.cuentaId || !reemplazoData.nuevoCorreo || !reemplazoData.nuevaContraseña) {
      toast.error('Completa los datos de la nueva cuenta');
      return;
    }
    try {
      const cuentaOriginal = cuentas.find(c => c.id === reemplazoData.cuentaId);
      if (!cuentaOriginal) return;
      
      const ventaAsociada = ventas.find(v => v.cuentaasignada?.id === cuentaOriginal.id || v.cuentaAsignada?.id === cuentaOriginal.id);
      
      const nuevaCuenta = {
        ...cuentaOriginal,
        id: Date.now().toString(),
        plataforma: reemplazoData.nuevaPlataforma || cuentaOriginal.plataforma,
        correo: reemplazoData.nuevoCorreo,
        contraseña: reemplazoData.nuevaContraseña,
        pin: reemplazoData.nuevosPins[0] || '',
        estado: ventaAsociada ? 'ocupada' : 'libre',
        ventaId: ventaAsociada?.id || null,
        fechareemplazo: new Date().toISOString(),
        reemplazadopor: currentUser?.nombre || 'Admin',
        observacion: reemplazoData.observacion,
        cuentaAnterior: { correo: cuentaOriginal.correo, contraseña: cuentaOriginal.contraseña, pin: cuentaOriginal.pin, fechareemplazo: new Date().toISOString() }
      };
      
      const cuentaOriginalActualizada = { ...cuentaOriginal, estado: 'reemplazada', tieneHistorial: true, cuentaReemplazadaPor: nuevaCuenta.id };
      
      if (supabase) {
        await supabase.from('cuentas_streaming').upsert([cuentaOriginalActualizada, nuevaCuenta], { onConflict: 'id' });
        
        // ✅ Si había una venta asociada, actualizarla con la nueva cuenta
        if (ventaAsociada) {
          await supabase.from('ventas_streaming').update({ cuentaasignada: nuevaCuenta }).eq('id', ventaAsociada.id);
          setVentas(ventas.map(v => v.id === ventaAsociada.id ? { ...v, cuentaasignada: nuevaCuenta, cuentaAsignada: nuevaCuenta } : v));
        }
      }
      
      setCuentas([nuevaCuenta, ...cuentas.map(c => c.id === reemplazoData.cuentaId ? cuentaOriginalActualizada : c)]);
      
      // ✅ Notificación de reemplazo
      if (agregarNotificacion) {
        agregarNotificacion({
          tipo: 'cuenta_reemplazada',
          titulo: '🔄 Cuenta streaming reemplazada',
          mensaje: `${cuentaOriginal.plataforma}: ${cuentaOriginal.correo} → ${reemplazoData.nuevoCorreo}`,
          detalle: ventaAsociada ? `Cliente: ${ventaAsociada.cliente}` : `Sin cliente asignado. Reemplazada por: ${currentUser?.nombre || 'Admin'}`,
          usuario_id: 'admin'
        });
      }
      
      toast.success('Cuenta reemplazada correctamente');
      setShowReemplazoCuentaModal(false);
      setReemplazoData({ cuentaId: null, nuevaPlataforma: '', nuevoCorreo: '', nuevaContraseña: '', nuevosPins: [''], observacion: '' });
      window.dispatchEvent(new Event('voltech-data-updated'));
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al reemplazar: ' + error.message);
    }
  };
    // ✅ ACTUALIZADO: asignarCuentaAVenta - ahora recibe venta, cuenta Y plataformaIndex
  const asignarCuentaAVenta = async (venta, cuenta, plataformaIdx = 0) => {
    try {
      // Marcar cuenta como ocupada y con el nombre del cliente en Perfil
      const cuentaActualizada = {
        ...cuenta,
        estado: 'ocupada',
        ventaId: venta.id,
        nombrePerfil: venta.cliente || cuenta.nombrePerfil,
        plataformaIdx
      };
      
      if (supabase) {
        await supabase.from('cuentas_streaming').update({
          estado: 'ocupada',
          ventaId: venta.id,
          nombrePerfil: venta.cliente || cuenta.nombrePerfil
        }).eq('id', cuenta.id);
        
        // Guardar asignación en la venta (por plataforma)
        const plataformasActualizadas = [...(venta.plataformas || [])];
        if (plataformasActualizadas[plataformaIdx]) {
          plataformasActualizadas[plataformaIdx] = {
            ...plataformasActualizadas[plataformaIdx],
            cuentaAsignadaId: cuenta.id,
            cuentaAsignada: cuentaActualizada
          };
        }
        await supabase.from('ventas_streaming').update({ plataformas: plataformasActualizadas }).eq('id', venta.id);
      }
      
      setVentas(ventas.map(v => {
        if (v.id !== venta.id) return v;
        const plataformasActualizadas = [...(v.plataformas || [])];
        if (plataformasActualizadas[plataformaIdx]) {
          plataformasActualizadas[plataformaIdx] = {
            ...plataformasActualizadas[plataformaIdx],
            cuentaAsignadaId: cuenta.id,
            cuentaAsignada: cuentaActualizada
          };
        }
        return { ...v, plataformas: plataformasActualizadas };
      }));
      
      setCuentas(cuentas.map(c => c.id === cuenta.id ? cuentaActualizada : c));
      
      toast.success(`Cuenta asignada a ${venta.cliente}`);
      setShowAsignarPlataformaModal(false);
      setShowAssignModal(false);
      setVentaParaAsignar(null);
      setPlataformaIdxParaAsignar(null);
      setSelectedVenta(null);
      window.dispatchEvent(new Event('voltech-data-updated'));
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al asignar: ' + error.message);
    }
  };

  const generarRecordatorio = (venta, plataformaIdx = 0) => {
    setSelectedVenta(venta);
    setRecordatorioPlatIdx(plataformaIdx);
    setShowRecordatorioModal(true);
  };

  const enviarRecordatorioWhatsApp = () => {
    if (!selectedVenta) return;
    const telefonoLimpio = selectedVenta.telefono.replace(/\D/g, '');
    window.open(`https://wa.me/58${telefonoLimpio}?text=${encodeURIComponent(recordatorioText)}`, '_blank');
    toast.success('Recordatorio enviado por WhatsApp');
    setShowRecordatorioModal(false);
  };

  const copiarRecordatorio = () => {
    navigator.clipboard.writeText(recordatorioText);
    toast.success('Texto copiado al portapapeles');
  };

  const generarEnviarCuenta = (venta, plataformaIdx = 0) => {
    const plat = venta.plataformas?.[plataformaIdx] || venta.plataformas?.[0];
    const cuenta = plat?.cuentaAsignada || venta.cuentaAsignada;
    if (!cuenta) { toast.error('No hay cuenta asignada'); return; }
    
    const texto = `*_✅ PERFIL ${(plat?.plataforma || '').toUpperCase()}_*

*📧 Correo:* ${cuenta.correo}
*🔑 Contraseña:* ${cuenta.contraseña}

*☑️ Perfil:* ${cuenta.nombrePerfil || 'N/A'}
*🔐 PIN:* ${cuenta.pin || 'N/A'}

*📍 Vence:* *${plat?.fechaVencimiento || ''}*`;
    setCuentaText(texto);
    setSelectedVenta(venta);
    setShowEnviarCuentaModal(true);
  };

  const copiarCuenta = () => {
    navigator.clipboard.writeText(cuentaText);
    toast.success('Texto copiado al portapapeles');
  };

  const enviarCuentaWhatsApp = () => {
    if (!selectedVenta) return;
    const telefonoLimpio = selectedVenta.telefono.replace(/\D/g, '');
    window.open(`https://wa.me/58${telefonoLimpio}?text=${encodeURIComponent(cuentaText)}`, '_blank');
    toast.success('Cuenta enviada por WhatsApp');
    setShowEnviarCuentaModal(false);
  };

  const generarEnviarReemplazo = (venta, plataformaIdx = 0) => {
    const plat = venta.plataformas?.[plataformaIdx] || venta.plataformas?.[0];
    const cuenta = plat?.cuentaAsignada || venta.cuentaAsignada;
    if (!cuenta) { toast.error('No hay cuenta asignada'); return; }
    const texto = `*Reemplazo*

*_✅ PERFIL ${(plat?.plataforma || '').toUpperCase()}_*

*📧 Correo:* ${cuenta.correo}
*🔑 Contraseña:* ${cuenta.contraseña}

*☑️ Perfil:* ${cuenta.nombrePerfil || 'N/A'}
*🔐 PIN:* ${cuenta.pin || 'N/A'}

*📍 Vence:* *${plat?.fechaVencimiento || ''}*`;
    setReemplazoText(texto);
    setSelectedVenta(venta);
    setShowReemplazoModal(true);
  };

  const copiarReemplazo = () => {
    navigator.clipboard.writeText(reemplazoText);
    toast.success('Texto de reemplazo copiado');
  };

  const enviarReemplazoWhatsApp = () => {
    if (!selectedVenta) return;
    const telefonoLimpio = selectedVenta.telefono.replace(/\D/g, '');
    window.open(`https://wa.me/58${telefonoLimpio}?text=${encodeURIComponent(reemplazoText)}`, '_blank');
    toast.success('Reemplazo enviado por WhatsApp');
    setShowReemplazoModal(false);
  };

  const renovarVenta = (venta) => {
    setFormDataNueva({
      fecha: new Date().toISOString().split('T')[0],
      vendedor: venta.vendedor, cliente: venta.cliente, telefono: venta.telefono,
      metodoPago: venta.metodoPago || 'efectivo', cartera: venta.cartera || 'Caja Principal',
      plataformas: venta.plataformas.map(p => ({
        ...p,
        fechaVencimiento: calcularFechaVencimiento(new Date().toISOString().split('T')[0], p.diasDisponibles || 30),
        diasDisponibles: p.diasDisponibles || 30,
        cuentaAsignada: null, cuentaAsignadaId: null
      })),
      cuentaAsignada: null,
    });
    setEditingId(null);
    setActiveTab('nueva');
    setShowFormNueva(true);
    toast.success('Datos cargados para renovación');
  };

  const editarVenta = (venta) => {
    setFormDataNueva({ ...venta, fecha: venta.fecha, plataformas: venta.plataformas || [] });
    setEditingId(venta.id);
    setActiveTab('nueva');
    setShowFormNueva(true);
  };

  const eliminarVenta = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta venta?')) return;
    try {
      if (supabase) await supabase.from('ventas_streaming').delete().eq('id', id);
      setVentas(ventas.filter(v => v.id !== id));
      toast.success('Venta eliminada');
      window.dispatchEvent(new Event('voltech-data-updated'));
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  // ✅ ACTUALIZADO: Emite notificación de plataforma nueva
  const agregarPlataforma = async () => {
    if (!nuevaPlataforma.trim()) { toast.error('Ingresa un nombre'); return; }
    if (plataformas.includes(nuevaPlataforma)) { toast.error('Ya existe'); return; }
    try {
      const nuevas = [...plataformas, nuevaPlataforma];
      if (supabase) await supabase.from('settings').upsert({ clave: 'plataformas_streaming', valor: nuevas }, { onConflict: 'clave' });
      setPlataformas(nuevas);
      if (agregarNotificacion) {
        agregarNotificacion({
          tipo: 'plataforma_nueva',
          titulo: '🆕 Nueva plataforma agregada',
          mensaje: `${nuevaPlataforma} está disponible para ventas streaming`,
          detalle: `Agregada por: ${currentUser?.nombre || 'Admin'}`,
          usuario_id: 'admin'
        });
      }
      toast.success('Plataforma agregada');
      setNuevaPlataforma('');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al agregar: ' + error.message);
    }
  };

  // ✅ ACTUALIZADO: Emite notificación de plataforma eliminada
  const eliminarPlataforma = async (nombre) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    try {
      const nuevas = plataformas.filter(p => p !== nombre);
      if (supabase) await supabase.from('settings').upsert({ clave: 'plataformas_streaming', valor: nuevas }, { onConflict: 'clave' });
      setPlataformas(nuevas);
      if (agregarNotificacion) {
        agregarNotificacion({
          tipo: 'plataforma_eliminada',
          titulo: '🗑️ Plataforma eliminada',
          mensaje: `${nombre} ya no está disponible`,
          detalle: `Eliminada por: ${currentUser?.nombre || 'Admin'}`,
          usuario_id: 'admin'
        });
      }
      toast.success('Plataforma eliminada');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  const resetForm = (tipo) => {
    if (tipo === 'nueva') {
      setFormDataNueva({
        fecha: new Date().toISOString().split('T')[0], vendedor: '', cliente: '', telefono: '',
        metodoPago: 'efectivo', cartera: 'Caja Principal',
        plataformas: [{ plataforma: '', fechaVencimiento: '', diasDisponibles: 30, precioMayor: 0, precioDetal: 0 }],
        cuentaAsignada: null,
      });
      setEditingId(null); setCuponInput(''); setCuponAplicado(null); setErrorCupon('');
    } else if (tipo === 'inventario') {
      setFormDataInventario({
        fecha: new Date().toISOString().split('T')[0], fechaVencimiento: '', diasDisponibles: 30,
        plataforma: '', correo: '', contraseña: '', nombrePerfil: '', pins: [''], cantidad: 1, vendedor: '',
        precioMayor: 0, precioDetal: 0, proveedor: '', telefonoProveedor: '', metodoPago: 'efectivo', cartera: 'Caja Principal',
      });
    }
  };

  // ✅ VISIBILIDAD: Admin alterna "Ver todo / Solo mío"; Socio y Vendedor solo ven sus ventas
  const ventasVisibles = useMemo(() => {
    if (esAdmin && verTodo) return ventas;
    return ventas.filter(vt => (vt.vendedor || '').toLowerCase() === (usuarioActual?.nombre || '').toLowerCase());
  }, [ventas, verTodo, esAdmin, usuarioActual]);

  const ventasFiltradas = ventasVisibles.filter(v =>
    v.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.plataformas?.some(p => p.plataforma?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const cuentasFiltradas = cuentas.filter(c =>
    c.plataforma?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.correo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cuentasLibres = cuentas.filter(c => c.estado === 'libre');

  const inventarioFiltrado = inventario.filter(i => i.plataforma?.toLowerCase().includes(searchTerm.toLowerCase()));

  const getComisionVenta = (venta) => (venta.plataformas || []).reduce((acc, p) => acc + (Number(p.precioDetal || 0) * Number(p.porcentaje_comision || 5)) / 100, 0);

  const calcularDiasRestantes = (fechaVencimiento) => {
    if (!fechaVencimiento) return 0;
    return Math.ceil((new Date(fechaVencimiento) - new Date()) / (1000 * 60 * 60 * 24));
  };

  // ✅ NUEVO: Helper para obtener cuenta asignada de una plataforma (incluyendo reemplazos)
  const getCuentaAsignadaDePlataforma = (venta, platIdx) => {
    const plat = venta.plataformas?.[platIdx];
    if (!plat) return null;
    
    // Primero revisar si la plataforma tiene cuentaAsignada directa
    if (plat.cuentaAsignada) return plat.cuentaAsignada;
    if (plat.cuentaAsignadaId) {
      const c = cuentas.find(x => x.id === plat.cuentaAsignadaId);
      if (c && c.estado !== 'reemplazada') return c;
      // Si está reemplazada, buscar la nueva
      if (c?.cuentaReemplazadaPor) return cuentas.find(x => x.id === c.cuentaReemplazadaPor);
    }
    
    // Fallback: cuentaasignada global de la venta (legacy)
    if (platIdx === 0 && venta.cuentaasignada) return venta.cuentaasignada;
    if (platIdx === 0 && venta.cuentaAsignada) return venta.cuentaAsignada;
    
    return null;
  };

  // ✅ NUEVO: Abrir modal de asignar para una plataforma específica
  const abrirModalAsignarPlataforma = (venta, platIdx) => {
    setVentaParaAsignar(venta);
    setPlataformaIdxParaAsignar(platIdx);
    setShowAsignarPlataformaModal(true);
  };

  const handleHeaderButton = () => {
    if (activeTab === 'nueva') setShowFormNueva(!showFormNueva);
    else if (activeTab === 'cuentas') setShowFormCuenta(!showFormCuenta);
    else if (activeTab === 'inventario') setShowFormInventario(!showFormInventario);
  };

  const getHeaderText = () => {
    if (activeTab === 'nueva') return 'Nueva Venta Streaming';
    if (activeTab === 'cuentas') return 'Agregar Cuenta Streaming';
    if (activeTab === 'inventario') return 'Nueva Compra Streaming';
    return 'Nueva Venta Streaming';
  };

  const getMetodosPagoOptions = () => {
    const pagos = settingsMap.pagos || {};
    const lista = Array.isArray(pagos) ? pagos : Object.entries(pagos).filter(([_, v]) => v && (v.activo !== false)).map(([k, v]) => ({ id: k, nombre: v?.nombre || k }));
    return lista.length > 0 ? lista : [{ id: 'efectivo', nombre: 'Efectivo' }, { id: 'pago_movil', nombre: 'Pago Móvil' }, { id: 'transferencia', nombre: 'Transferencia' }, { id: 'binance', nombre: 'Binance / Zelle' }];
  };

  const getCarterasOptions = () => {
    const crt = settingsMap.carteras || [];
    const lista = Array.isArray(crt) ? crt.filter(c => c && c.activo !== false) : [];
    return lista.length > 0 ? lista : [{ id: 'Caja Principal', nombre: 'Caja Principal' }, { id: 'Caja Chica', nombre: 'Caja Chica' }, { id: 'Binance', nombre: 'Binance' }];
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" toastOptions={{ style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' }, success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } }, error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } } }} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Ventas Streaming</h1>
          <p className="text-xs sm:text-sm text-voltech-muted mt-0.5">Gestiona plataformas, cuentas e inventario</p>
        </div>
        <button onClick={handleHeaderButton} className="w-full sm:w-auto shrink-0 justify-center px-4 py-2.5 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-xl text-xs sm:text-sm font-semibold hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> {getHeaderText()}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4 flex items-center gap-3">
          <div className="p-2.5 md:p-2 rounded-xl md:rounded-lg bg-voltech-cyan/10 md:bg-voltech-cyan/20 text-voltech-cyan shrink-0 flex items-center justify-center"><MonitorPlay className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1 md:flex-none"><p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Ventas Activas</p><p className="text-base md:text-xl font-bold text-white mt-0.5 md:mt-0">{ventasVisibles.filter(v => v.estado === 'activa').length}</p></div>
        </div>
        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4 flex items-center gap-3">
          <div className="p-2.5 md:p-2 rounded-xl md:rounded-lg bg-voltech-success/10 md:bg-voltech-success/20 text-voltech-success shrink-0 flex items-center justify-center"><Database className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1 md:flex-none"><p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Cuentas Disponibles</p><p className="text-base md:text-xl font-bold text-white mt-0.5 md:mt-0">{cuentas.filter(c => c.estado === 'libre').length}</p></div>
        </div>
        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4 flex items-center gap-3">
          <div className="p-2.5 md:p-2 rounded-xl md:rounded-lg bg-voltech-warning/10 md:bg-voltech-warning/20 text-voltech-warning shrink-0 flex items-center justify-center"><AlertTriangle className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1 md:flex-none"><p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Por Vencer (7 días)</p><p className="text-base md:text-xl font-bold text-white mt-0.5 md:mt-0">{ventasVisibles.filter(v => v.plataformas?.some(p => { const d = calcularDiasRestantes(p.fechaVencimiento); return d <= 7 && d >= 0; }) && v.estado === 'activa').length}</p></div>
        </div>
        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4 flex items-center gap-3">
          <div className="p-2.5 md:p-2 rounded-xl md:rounded-lg bg-voltech-purple/10 md:bg-voltech-purple/20 text-voltech-purple shrink-0 flex items-center justify-center"><DollarSign className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1 md:flex-none"><p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Ingresos del Mes</p><p className="text-base md:text-xl font-bold text-white mt-0.5 md:mt-0">${ventasVisibles.filter(v => v.fecharegistro?.startsWith(new Date().toISOString().slice(0, 7))).reduce((acc, v) => acc + (v.total || 0), 0).toFixed(2)}</p></div>
        </div>
      </div>

      <div className="border-b border-voltech-border">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 md:flex md:gap-6 w-full pb-2 md:pb-1">
          <button onClick={() => setActiveTab('nueva')} className={`justify-center md:justify-start py-2.5 md:py-0 md:pb-3 flex items-center gap-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap rounded-lg md:rounded-none border-b-2 ${activeTab === 'nueva' ? 'text-voltech-cyan bg-voltech-cyan/10 border-transparent md:bg-transparent md:border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'}`}>
            <MonitorPlay className="w-4 h-4" /> Nueva Plataforma
          </button>
          <button onClick={() => setActiveTab('cuentas')} className={`justify-center md:justify-start py-2.5 md:py-0 md:pb-3 flex items-center gap-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap rounded-lg md:rounded-none border-b-2 ${activeTab === 'cuentas' ? 'text-voltech-cyan bg-voltech-cyan/10 border-transparent md:bg-transparent md:border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'}`}>
            <Database className="w-4 h-4" /> Agregar Cuentas
          </button>
          {(esAdmin || esSocio) && (
            <button onClick={() => setActiveTab('inventario')} className={`justify-center md:justify-start py-2.5 md:py-0 md:pb-3 flex items-center gap-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap rounded-lg md:rounded-none border-b-2 ${activeTab === 'inventario' ? 'text-voltech-cyan bg-voltech-cyan/10 border-transparent md:bg-transparent md:border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'}`}>
              <Package className="w-4 h-4" /> Inventario Plataformas
            </button>
          )}
          <button onClick={() => setShowPlataformasModal(true)} className="justify-center md:justify-start py-2.5 md:py-0 md:pb-3 flex items-center gap-2 font-medium text-xs sm:text-sm text-voltech-muted border-transparent hover:text-white transition-colors whitespace-nowrap rounded-lg md:rounded-none">
            <Tag className="w-4 h-4" /> Gestionar Plataformas
          </button>
        </div>
      </div>
            {/* ================= TAB: NUEVA PLATAFORMA ================= */}
      {activeTab === 'nueva' && (
        <div className="space-y-6">
          <AnimatePresence>
            {showFormNueva && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Nueva Venta Streaming</h3>
                    <button onClick={() => setShowFormNueva(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 pb-6 border-b border-voltech-border">
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Fecha *</label><input type="date" value={formDataNueva.fecha} onChange={(e) => setFormDataNueva({ ...formDataNueva, fecha: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Vendedor *</label><select value={formDataNueva.vendedor} onChange={(e) => setFormDataNueva({ ...formDataNueva, vendedor: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="">-- Selecciona --</option>{equipo.filter(m => m.activo).map(m => (<option key={m.id} value={m.nombre}>{m.nombre} ({m.rol})</option>))}</select></div>
                    <div className="relative"><label className="block text-xs text-voltech-muted mb-1 ml-1">Comprador *</label><input ref={clienteInputRef} type="text" value={formDataNueva.cliente} onChange={(e) => handleClienteChange(e.target.value)} onFocus={() => { if (sugerenciasClientes.length > 0) setShowSugerencias(true); }} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Buscar cliente..." />
                      {showSugerencias && sugerenciasClientes.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-voltech-surface border border-voltech-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                          {sugerenciasClientes.map((cliente) => (<button key={cliente.id} onClick={() => seleccionarCliente(cliente)} className="w-full px-4 py-2 text-left text-sm hover:bg-voltech-border flex items-center justify-between border-b border-voltech-border/50 last:border-0"><span className="text-white">{cliente.nombre}</span><span className="text-xs text-voltech-muted">{cliente.telefono}</span></button>))}
                        </div>
                      )}
                    </div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Teléfono</label><input type="tel" value={formDataNueva.telefono} onChange={(e) => setFormDataNueva({ ...formDataNueva, telefono: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="0412-1234567" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Método de Pago *</label><select value={formDataNueva.metodoPago} onChange={(e) => setFormDataNueva({ ...formDataNueva, metodoPago: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="">-- Selecciona --</option>{getMetodosPagoOptions().map(m => (<option key={m.id} value={m.id}>{m.nombre}</option>))}</select></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Cartera *</label><select value={formDataNueva.cartera} onChange={(e) => setFormDataNueva({ ...formDataNueva, cartera: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="">-- Selecciona --</option>{getCarterasOptions().map(c => (<option key={c.id || c.nombre} value={c.id || c.nombre}>{c.nombre}</option>))}</select></div>
                  </div>

                  {formDataNueva.plataformas.map((plat, index) => (
                    <div key={index} className={`mb-6 pb-6 ${index < formDataNueva.plataformas.length - 1 ? 'border-b border-voltech-border' : ''}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-voltech-cyan">{index === 0 ? 'PLATAFORMA 1' : `PLATAFORMA ${index + 1}`}</h4>
                        {index > 0 && (<button onClick={() => eliminarPlataformaDeVenta(index)} className="px-3 py-1 bg-voltech-error/20 text-voltech-error rounded-lg text-xs hover:bg-voltech-error/30 flex items-center gap-1"><X className="w-3 h-3" /> Eliminar</button>)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Plataforma *</label><select value={plat.plataforma} onChange={(e) => actualizarPlataforma(index, 'plataforma', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="">-- Selecciona --</option>{plataformas.map(p => (<option key={p} value={p}>{p}</option>))}</select></div>
                        <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Fecha Vencimiento</label><input type="date" value={plat.fechaVencimiento} onChange={(e) => actualizarPlataforma(index, 'fechaVencimiento', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                        <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Días Disponibles</label><input type="number" value={plat.diasDisponibles || ''} onChange={(e) => actualizarPlataforma(index, 'diasDisponibles', parseInt(e.target.value) || 0)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                        <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Precio Mayor ($)</label><div className="relative"><input type="number" step="0.01" value={plat.precioMayor || ''} onChange={(e) => actualizarPlataforma(index, 'precioMayor', parseFloat(e.target.value) || 0)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /><button onClick={() => setMostrarPrecios(!mostrarPrecios)} className="absolute right-2 top-1/2 -translate-y-1/2 text-voltech-muted">{mostrarPrecios ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                        <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Precio Detal ($)</label><div className="relative"><input type="number" step="0.01" value={plat.precioDetal || ''} onChange={(e) => actualizarPlataforma(index, 'precioDetal', parseFloat(e.target.value) || 0)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /><button onClick={() => setMostrarPrecios(!mostrarPrecios)} className="absolute right-2 top-1/2 -translate-y-1/2 text-voltech-muted">{mostrarPrecios ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                      </div>
                      {index === formDataNueva.plataformas.length - 1 && (<button onClick={agregarPlataformaAVenta} className="mt-4 px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 flex items-center gap-2"><Plus className="w-4 h-4" /> Agregar otra plataforma</button>)}
                    </div>
                  ))}

                  <div className="mb-6 pb-6 border-b border-voltech-border">
                    <h4 className="text-sm font-semibold text-voltech-cyan mb-3 flex items-center gap-2"><Tag className="w-4 h-4" /> Cupón de Descuento</h4>
                    <div className="flex gap-2">
                      <input type="text" value={cuponInput} onChange={(e) => { setCuponInput(e.target.value.toUpperCase()); setErrorCupon(''); setCuponAplicado(null); }} placeholder="Ingresa el código del cupón" className="input-voltech flex-1 rounded-lg px-4 py-2 text-sm uppercase" disabled={!!cuponAplicado} />
                      <button onClick={validarYAplicarCupon} disabled={!!cuponAplicado} className="px-4 py-2 bg-voltech-purple/20 text-voltech-purple rounded-lg hover:bg-voltech-purple/30 text-sm font-medium disabled:opacity-50">Aplicar</button>
                      {cuponAplicado && (<button onClick={() => { setCuponInput(''); setCuponAplicado(null); setErrorCupon(''); }} className="px-4 py-2 bg-voltech-error/20 text-voltech-error rounded-lg hover:bg-voltech-error/30 text-sm" title="Quitar cupón"><X className="w-4 h-4" /></button>)}
                    </div>
                    {errorCupon && <p className="text-xs text-voltech-error mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {errorCupon}</p>}
                    {cuponAplicado && (<p className="text-xs text-voltech-success mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Cupón "{cuponAplicado.codigo}" aplicado: -$ {cuponAplicado.descuentoCalculado.toFixed(2)}</p>)}
                  </div>

                  <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-voltech-muted">Total de Plataformas</p><p className="text-lg font-bold text-white">{formDataNueva.plataformas.length}</p></div>
                      <div className="text-right">
                        <p className="text-xs text-voltech-muted">Subtotal</p>
                        <p className="text-sm font-bold text-white">${formDataNueva.plataformas.reduce((sum, p) => sum + (p.precioDetal || 0), 0).toFixed(2)}</p>
                        {cuponAplicado && (<p className="text-xs text-voltech-success">Descuento: -${cuponAplicado.descuentoCalculado.toFixed(2)}</p>)}
                        <p className="text-2xl font-bold text-voltech-success mt-1">Total: ${(formDataNueva.plataformas.reduce((sum, p) => sum + (p.precioDetal || 0), 0) - (cuponAplicado ? cuponAplicado.descuentoCalculado : 0)).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={guardarNuevaPlataforma} className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Save className="w-5 h-5" /> {editingId ? 'Actualizar Venta' : 'Registrar Venta'}</button>
                    {editingId && (<button onClick={() => { resetForm('nueva'); setShowFormNueva(false); }} className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-error flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>)}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-voltech-border flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white">Historial de Ventas</h3>
                {esAdmin && (
                  <div className="flex rounded-lg overflow-hidden border border-voltech-border">
                    <button onClick={() => setVerTodo(true)} className={`px-3 py-1.5 text-xs font-medium transition-colors ${verTodo ? 'bg-voltech-cyan/20 text-voltech-cyan' : 'bg-voltech-dark text-voltech-muted hover:text-white'}`}>👁 Ver todo</button>
                    <button onClick={() => setVerTodo(false)} className={`px-3 py-1.5 text-xs font-medium transition-colors ${!verTodo ? 'bg-voltech-cyan/20 text-voltech-cyan' : 'bg-voltech-dark text-voltech-muted hover:text-white'}`}>👤 Solo mío</button>
                  </div>
                )}
              </div>
              <div className="relative w-full md:w-64"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50" /></div>
            </div>

            {/* ✅ Vista Card Móvil (< md) */}
            <div className="block md:hidden space-y-3 p-3">
              {ventasFiltradas.length === 0 ? (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-center">
                  <MonitorPlay className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                  <p className="text-xs text-slate-400">No hay ventas registradas</p>
                </div>
              ) : (
                ventasFiltradas.map((venta) => {
                  const diasRestantes = calcularDiasRestantes(venta.plataformas?.[0]?.fechaVencimiento);
                  const puedeEditar = esAdmin || esSocio || (venta.vendedor || '').toLowerCase() === (usuarioActual?.nombre || '').toLowerCase();
                  const totalPlataformas = venta.plataformas?.length || 0;
                  const cuentasAsignadas = (venta.plataformas || []).filter((_, idx) => getCuentaAsignadaDePlataforma(venta, idx)).length;
                  return (
                    <div key={venta.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-100 truncate">{venta.cliente}</h4>
                          <p className="text-[11px] text-slate-400 font-mono truncate">{venta.telefono}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => renovarVenta(venta)} className="p-1.5 text-slate-400 hover:text-white" title="Renovar"><RefreshCw size={16} /></button>
                          {puedeEditar && <button onClick={() => editarVenta(venta)} className="p-1.5 text-slate-400 hover:text-white" title="Editar"><Edit3 size={16} /></button>}
                          {puedeEditar && <button onClick={() => eliminarVenta(venta.id)} className="p-1.5 text-slate-400 hover:text-rose-400" title="Eliminar"><Trash2 size={16} /></button>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">{venta.plataformas?.[0]?.plataforma}{totalPlataformas > 1 ? ` +${totalPlataformas - 1} más` : ''}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${diasRestantes <= 3 ? 'bg-rose-500/20 text-rose-300' : diasRestantes <= 7 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>Vence: {diasRestantes} días</span>
                      </div>
                      <div className="pt-2 border-t border-slate-700/40 grid grid-cols-2 gap-2 text-[11px]">
                        <div><span className="text-slate-400 block">Fecha:</span><span className="text-slate-200 font-mono">{venta.fecha}</span></div>
                        <div><span className="text-slate-400 block">Comisión:</span><span className="text-indigo-300 font-bold">${Number(getComisionVenta(venta)).toFixed(2)}</span></div>
                        <div><span className="text-slate-400 block">Método:</span><span className="text-slate-200 capitalize">{(venta.metodopago || '').replace('_', ' ') || 'N/A'}</span></div>
                        <div><span className="text-slate-400 block">Cuentas:</span><span className="text-cyan-400 font-medium">{cuentasAsignadas}/{totalPlataformas} asignadas</span></div>
                      </div>

                      {/* ✅ Acordeón "Ver Cuentas" (cerrado por defecto) */}
                      <button onClick={() => setExpandedCuentasVenta(expandedCuentasVenta === venta.id ? null : venta.id)} className="w-full flex items-center justify-center gap-1 text-[11px] text-cyan-400 py-1.5 rounded-lg border border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                        <EyeIcon size={14} /> Ver Cuentas ({cuentasAsignadas}/{totalPlataformas})
                        <ChevronDown size={14} className={`transition-transform ${expandedCuentasVenta === venta.id ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedCuentasVenta === venta.id && (
                        <div className="space-y-2">
                          {(venta.plataformas || []).map((plat, platIdx) => {
                            const cuentaAsig = getCuentaAsignadaDePlataforma(venta, platIdx);
                            const diasRest = calcularDiasRestantes(plat.fechaVencimiento);
                            return (
                              <div key={platIdx} className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-bold text-slate-100">{plat.plataforma}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${diasRest <= 3 ? 'bg-rose-500/20 text-rose-300' : diasRest <= 7 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>Vence: {diasRest} días</span>
                                </div>
                                {cuentaAsig ? (
                                  <>
                                    <p className="text-[11px] text-slate-400 truncate">📧 {cuentaAsig.correo}</p>
                                    <p className="text-[11px] text-slate-400">👤 Perfil: <span className="text-slate-200">{cuentaAsig.nombrePerfil || 'N/A'}</span> • 🔐 PIN: <span className="text-slate-200 font-mono">{cuentaAsig.pin || 'N/A'}</span></p>
                                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">Asignada</span>
                                  </>
                                ) : (
                                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">Sin cuenta asignada</span>
                                )}
                                <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-700/40">
                                  <button onClick={() => { setRegaloData({ ventaId: venta.id, plataformaIndex: platIdx, dias: 0, tipo: 'regalo', nota: '' }); setShowRegaloModal(true); }} className="p-1.5 text-slate-400 hover:text-indigo-300" title="Regalo/Falla"><Gift size={16} /></button>
                                  {!cuentaAsig ? (
                                    <button onClick={() => abrirModalAsignarPlataforma(venta, platIdx)} className="p-1.5 text-slate-400 hover:text-cyan-400" title="Asignar cuenta"><LinkIcon size={16} /></button>
                                  ) : (
                                    <>
                                      <button onClick={() => generarRecordatorio(venta, platIdx)} className="p-1.5 text-slate-400 hover:text-emerald-400" title="Recordatorio"><MessageCircle size={16} /></button>
                                      <button onClick={() => generarEnviarCuenta(venta, platIdx)} className="p-1.5 text-slate-400 hover:text-cyan-400" title="Enviar cuenta"><Mail size={16} /></button>
                                      <button onClick={() => generarEnviarReemplazo(venta, platIdx)} className="p-1.5 text-slate-400 hover:text-indigo-300" title="Enviar reemplazo"><RefreshCw size={16} /></button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* ✅ Vista Tabla Desktop (>= md) */}
            <div className="hidden md:block w-full overflow-x-auto min-w-0">
              <table className="w-full">
                <thead className="bg-voltech-dark border-b border-voltech-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Plataformas</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Método Pago</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Cartera</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-purple">Comisión</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Vence</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Cuentas</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.map((venta) => {
                    const diasRestantes = calcularDiasRestantes(venta.plataformas?.[0]?.fechaVencimiento);
                    const puedeEditar = esAdmin || esSocio || (venta.vendedor || '').toLowerCase() === (usuarioActual?.nombre || '').toLowerCase();
                    const totalPlataformas = venta.plataformas?.length || 0;
                    const cuentasAsignadas = (venta.plataformas || []).filter((_, idx) => getCuentaAsignadaDePlataforma(venta, idx)).length;
                    const isExpanded = expandedCuentasVenta === venta.id;
                    
                    return (
                      <Fragment key={venta.id}>
                        <tr className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors">
                          <td className="px-4 py-3 text-xs font-mono whitespace-nowrap text-voltech-muted pr-3">{venta.fecha}</td>
                          <td className="px-4 py-3"><p className="text-sm font-medium text-white">{venta.cliente}</p><p className="text-xs text-voltech-muted">{venta.telefono}</p></td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm text-white">{venta.plataformas?.[0]?.plataforma}</p>
                              {totalPlataformas > 1 && (<p className="text-xs text-voltech-muted">+ {totalPlataformas - 1} más</p>)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-voltech-muted capitalize">{venta.metodopago?.replace('_', ' ') || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-voltech-muted">{venta.cartera || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm font-bold text-voltech-purple">${Number(getComisionVenta(venta)).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-voltech-muted" />
                              <span className="text-sm text-white">{venta.plataformas?.[0]?.fechaVencimiento}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${diasRestantes <= 3 ? 'bg-voltech-error/20 text-voltech-error' : diasRestantes <= 7 ? 'bg-voltech-warning/20 text-voltech-warning' : 'bg-voltech-success/20 text-voltech-success'}`}>{diasRestantes} días</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => setExpandedCuentasVenta(isExpanded ? null : venta.id)} className="flex items-center gap-1 text-xs text-voltech-cyan hover:underline">
                              <EyeIcon className="w-3 h-3" />
                              <span>Ver Cuentas ({cuentasAsignadas}/{totalPlataformas})</span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1 flex-nowrap md:flex-wrap">
                              <button onClick={() => renovarVenta(venta)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-purple" title="Renovar"><RefreshCw className="w-4 h-4" /></button>
                              {puedeEditar && (<button onClick={() => editarVenta(venta)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan" title="Editar"><Edit3 className="w-4 h-4" /></button>)}
                              {puedeEditar && (<button onClick={() => eliminarVenta(venta.id)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error" title="Eliminar"><Trash2 className="w-4 h-4" /></button>)}
                            </div>
                          </td>
                        </tr>
                        
                        {/* ✅ NUEVO: Panel "Ver Cuentas" - una fila por plataforma */}
                        {isExpanded && venta.plataformas && venta.plataformas.map((plat, platIdx) => {
                          const cuentaAsig = getCuentaAsignadaDePlataforma(venta, platIdx);
                          const diasRest = calcularDiasRestantes(plat.fechaVencimiento);
                          const sinCuenta = !cuentaAsig;
                          
                          return (
                            <tr key={`${venta.id}-plat-${platIdx}`} className={`border-b border-voltech-border/50 ${sinCuenta ? 'bg-voltech-warning/5' : 'bg-voltech-dark/30'}`}>
                              <td className="px-4 py-3 text-xs text-voltech-muted" colSpan={2}>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-voltech-purple"></div>
                                  <span className="text-sm text-white font-medium">{plat.plataforma}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3" colSpan={4}>
                                {sinCuenta ? (
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-voltech-warning" />
                                    <span className="text-xs text-voltech-warning font-medium">Sin cuenta asignada</span>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <p className="text-xs text-white"><span className="text-voltech-muted">Correo:</span> {cuentaAsig.correo}</p>
                                    <p className="text-xs text-white"><span className="text-voltech-muted">Perfil:</span> {cuentaAsig.nombrePerfil || 'N/A'} • <span className="text-voltech-muted">PIN:</span> {cuentaAsig.pin || 'N/A'}</p>
                                    {cuentaAsig.cuentaAnterior && (<p className="text-[10px] text-voltech-purple flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Reemplazada</p>)}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3 h-3 text-voltech-muted" />
                                  <span className="text-sm text-white">{plat.fechaVencimiento}</span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${diasRest <= 3 ? 'bg-voltech-error/20 text-voltech-error' : diasRest <= 7 ? 'bg-voltech-warning/20 text-voltech-warning' : 'bg-voltech-success/20 text-voltech-success'}`}>{diasRest} días</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {sinCuenta ? (
                                  <button onClick={() => abrirModalAsignarPlataforma(venta, platIdx)} className="px-3 py-1.5 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-xs hover:bg-voltech-cyan/30 flex items-center gap-1"><LinkIcon className="w-3 h-3" /> Asignar Cuenta</button>
                                ) : (
                                  <span className="text-xs px-2 py-1 bg-voltech-success/20 text-voltech-success rounded">Asignada</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1 flex-nowrap md:flex-wrap">
                                  <button onClick={() => { setRegaloData({ ventaId: venta.id, plataformaIndex: platIdx, dias: 0, tipo: 'regalo', nota: '' }); setShowRegaloModal(true); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-purple" title="Regalo/Falla"><Gift className="w-4 h-4" /></button>
                                  {sinCuenta ? (
                                    <button onClick={() => abrirModalAsignarPlataforma(venta, platIdx)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan" title="Asignar"><LinkIcon className="w-4 h-4" /></button>
                                  ) : null}
                                  <button onClick={() => generarRecordatorio(venta, platIdx)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-success" title="Recordatorio"><MessageCircle className="w-4 h-4" /></button>
                                  {!sinCuenta && (<button onClick={() => generarEnviarCuenta(venta, platIdx)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan" title="Enviar cuenta"><Mail className="w-4 h-4" /></button>)}
                                  {!sinCuenta && (<button onClick={() => generarEnviarReemplazo(venta, platIdx)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-purple" title="Enviar reemplazo"><RefreshCw className="w-4 h-4" /></button>)}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB: AGREGAR CUENTAS ================= */}
      {activeTab === 'cuentas' && (
        <div className="space-y-6">
          <AnimatePresence>
            {showFormCuenta && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Agregar Cuenta Streaming</h3>
                    <button onClick={() => setShowFormCuenta(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Plataforma *</label><select value={formDataCuenta.plataforma} onChange={(e) => setFormDataCuenta({ ...formDataCuenta, plataforma: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="">-- Selecciona --</option>{plataformas.map(p => (<option key={p} value={p}>{p}</option>))}</select></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Cant Perfil</label><input type="number" min="1" max="4" value={formDataCuenta.cantidad} onChange={(e) => { const cant = parseInt(e.target.value) || 1; setFormDataCuenta({ ...formDataCuenta, cantidad: cant, pins: Array(cant).fill('').map((_, i) => formDataCuenta.pins[i] || '') }); }} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Correo *</label><input type="email" value={formDataCuenta.correo} onChange={(e) => setFormDataCuenta({ ...formDataCuenta, correo: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="cuenta@email.com" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Contraseña *</label><input type="text" value={formDataCuenta.contraseña} onChange={(e) => setFormDataCuenta({ ...formDataCuenta, contraseña: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="••••••••" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Nombre del Perfil</label><input type="text" value={formDataCuenta.nombrePerfil} onChange={(e) => setFormDataCuenta({ ...formDataCuenta, nombrePerfil: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Ej: ANA BEATRIZ" /></div>
                    {formDataCuenta.pins.map((pin, index) => (<div key={index}><label className="block text-xs text-voltech-muted mb-1 ml-1">PIN Perfil {index + 1}</label><input type="text" value={pin} onChange={(e) => actualizarPinCuenta(index, e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder={`PIN ${index + 1}`} /></div>))}
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Vendedor *</label><select value={formDataCuenta.vendedor} onChange={(e) => setFormDataCuenta({ ...formDataCuenta, vendedor: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="">-- Selecciona --</option>{equipo.filter(m => m.activo).map(m => (<option key={m.id} value={m.nombre}>{m.nombre} ({m.rol})</option>))}</select></div>
                  </div>
                  <button onClick={guardarCuenta} className="mt-6 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Guardar Cuenta(s)</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {showFormCuenta && (<div className="flex justify-end"><button onClick={() => setFormDataCuenta({ plataforma: '', correo: '', contraseña: '', nombrePerfil: '', pins: [''], cantidad: 1, vendedor: '' })} className="flex items-center gap-2 px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30"><Plus className="w-4 h-4" /> Agregar otra cuenta</button></div>)}

          <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-voltech-border flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <h3 className="text-lg font-bold text-white">Cuentas Disponibles</h3>
              <div className="relative w-full md:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" /><input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-voltech w-full md:w-64 rounded-lg pl-10 pr-4 py-2 text-sm" /></div>
            </div>

            {/* ✅ Vista Card Móvil (< md) — SOLO CUENTAS */}
            <div className="block md:hidden space-y-3 p-3">
              {cuentasFiltradas.length === 0 ? (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-center">
                  <Database className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                  <p className="text-xs text-slate-400">No hay cuentas registradas</p>
                </div>
              ) : (
                cuentasFiltradas.map((cuenta) => (
                  <div key={cuenta.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-100 truncate">{cuenta.plataforma}</h4>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{cuenta.correo}</p>
                      </div>
                      <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full ${cuenta.estado === 'libre' ? 'bg-emerald-500/20 text-emerald-300' : cuenta.estado === 'ocupada' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'}`}>{cuenta.estado}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-700/40 grid grid-cols-2 gap-2 text-[11px]">
                      <div><span className="text-slate-400 block">Perfil:</span><span className="text-slate-200 truncate block">{cuenta.nombrePerfil || '-'}</span></div>
                      <div><span className="text-slate-400 block">PIN:</span><span className="text-slate-200 font-mono block">{cuenta.pin || '-'}</span></div>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      {cuenta.estado === 'libre' && (
                        <button onClick={() => { setVentaParaAsignar(null); setPlataformaIdxParaAsignar(null); setSelectedVenta({ cuenta, ventasDisponibles: ventas.filter(v => (v.plataformas || []).some(p => p.plataforma === cuenta.plataforma && !getCuentaAsignadaDePlataforma(v, (v.plataformas || []).indexOf(p)))) }); setShowAssignModal(true); }} className="p-1.5 text-slate-400 hover:text-cyan-400" title="Asignar"><LinkIcon size={16} /></button>
                      )}
                      <button onClick={() => { setReemplazoData({ cuentaId: cuenta.id, nuevaPlataforma: cuenta.plataforma, nuevoCorreo: '', nuevaContraseña: '', nuevosPins: [''], observacion: '' }); setShowReemplazoCuentaModal(true); }} className="p-1.5 text-slate-400 hover:text-indigo-300" title="Reemplazar"><RefreshCw size={16} /></button>
                      <button onClick={() => { setFormDataCuenta({ plataforma: cuenta.plataforma, correo: cuenta.correo, contraseña: cuenta.contraseña, nombrePerfil: cuenta.nombrePerfil || '', pins: cuenta.pins || [cuenta.pin || ''], cantidad: cuenta.cantidad || 1, vendedor: cuenta.vendedor || '' }); setShowFormCuenta(true); }} className="p-1.5 text-slate-400 hover:text-white" title="Editar"><Edit3 size={16} /></button>
                      <button onClick={async () => { if(confirm('¿Eliminar?')) { if (supabase) await supabase.from('cuentas_streaming').delete().eq('id', cuenta.id); setCuentas(cuentas.filter(c => c.id !== cuenta.id)); toast.success('Cuenta eliminada'); } }} className="p-1.5 text-slate-400 hover:text-rose-400" title="Eliminar"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* ✅ Vista Tabla Desktop (>= md) */}
            <div className="hidden md:block w-full overflow-x-auto min-w-0">
              <table className="w-full">
                <thead className="bg-voltech-dark border-b border-voltech-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Plataforma</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Correo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Perfil</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">PIN</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Estado</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cuentasFiltradas.map((cuenta) => {
                    const puedeAsignar = cuenta.estado === 'libre';
                    // Filtrar ventas libres según plataforma de la cuenta y por rol
                    const ventasLibresParaEstaPlataforma = ventas.filter(v => {
                      // Filtrado por rol
                      if (esVendedor && !esAdmin && !esSocio) {
                        if ((v.vendedor || '').toLowerCase() !== (usuarioActual?.nombre || '').toLowerCase()) return false;
                      }
                      // Buscar plataformas sin cuenta asignada de esta plataforma
                      return (v.plataformas || []).some(p => 
                        p.plataforma === cuenta.plataforma && 
                        !getCuentaAsignadaDePlataforma(v, v.plataformas.indexOf(p))
                      );
                    });
                    
                    return (
                      <tr key={cuenta.id} className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-white">{cuenta.plataforma}</td>
                        <td className="px-4 py-3 text-sm text-voltech-muted">{cuenta.correo}</td>
                        <td className="px-4 py-3 text-sm text-voltech-muted">{cuenta.nombrePerfil || '-'}</td>
                        <td className="px-4 py-3 text-sm text-voltech-muted">{cuenta.pin || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${cuenta.estado === 'libre' ? 'bg-voltech-success/20 text-voltech-success' : cuenta.estado === 'ocupada' ? 'bg-voltech-cyan/20 text-voltech-cyan' : cuenta.estado === 'reemplazada' ? 'bg-voltech-warning/20 text-voltech-warning' : 'bg-voltech-muted/20 text-voltech-muted'}`}>{cuenta.estado}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {puedeAsignar && (
                              <button onClick={() => { setVentaParaAsignar(null); setPlataformaIdxParaAsignar(null); setSelectedVenta({ cuenta, ventasDisponibles: ventasLibresParaEstaPlataforma }); setShowAssignModal(true); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan" title={`Asignar a venta (${ventasLibresParaEstaPlataforma.length} disponibles)`}>
                                <LinkIcon className="w-4 h-4" />
                              </button>
                            )}
                            {cuenta.estado === 'reemplazada' && cuenta.cuentaReemplazadaPor && (<button onClick={() => setExpandedCuenta(expandedCuenta === cuenta.id ? null : cuenta.id)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan" title="Ver cuenta nueva"><ChevronDown className={`w-4 h-4 transition-transform ${expandedCuenta === cuenta.id ? 'rotate-180' : ''}`} /></button>)}
                            <button onClick={() => { setReemplazoData({ cuentaId: cuenta.id, nuevaPlataforma: cuenta.plataforma, nuevoCorreo: '', nuevaContraseña: '', nuevosPins: [''], observacion: '' }); setShowReemplazoCuentaModal(true); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-purple" title="Reemplazar"><RefreshCw className="w-4 h-4" /></button>
                            <button onClick={() => { setFormDataCuenta({ plataforma: cuenta.plataforma, correo: cuenta.correo, contraseña: cuenta.contraseña, nombrePerfil: cuenta.nombrePerfil || '', pins: cuenta.pins || [cuenta.pin || ''], cantidad: cuenta.cantidad || 1, vendedor: cuenta.vendedor || '' }); setShowFormCuenta(true); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan" title="Editar"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={async () => { if(confirm('¿Eliminar?')) { if (supabase) await supabase.from('cuentas_streaming').delete().eq('id', cuenta.id); setCuentas(cuentas.filter(c => c.id !== cuenta.id)); toast.success('Cuenta eliminada'); } }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {cuentasFiltradas.map((cuenta) => {
                    if (expandedCuenta !== cuenta.id || !cuenta.cuentaReemplazadaPor) return null;
                    const cuentaNueva = cuentas.find(c => c.id === cuenta.cuentaReemplazadaPor);
                    if (!cuentaNueva) return null;
                    return (
                      <tr key={`${cuenta.id}-nueva`} className="bg-voltech-success/10 border-b border-voltech-border/50">
                        <td className="px-4 py-3 text-sm text-white">{cuentaNueva.plataforma}</td>
                        <td className="px-4 py-3 text-sm text-voltech-muted">{cuentaNueva.correo}</td>
                        <td className="px-4 py-3 text-sm text-voltech-muted">{cuentaNueva.nombrePerfil || '-'}</td>
                        <td className="px-4 py-3 text-sm text-voltech-muted">{cuentaNueva.pin || '-'}</td>
                        <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-voltech-success/20 text-voltech-success">Nueva</span></td>
                        <td className="px-4 py-3 text-xs text-voltech-muted">Reemplazó a la anterior</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB: INVENTARIO ================= */}
      {activeTab === 'inventario' && (esAdmin || esSocio) && (
        <div className="space-y-6">
          <AnimatePresence>
            {showFormInventario && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Nueva Compra Streaming</h3>
                    <button onClick={() => setShowFormInventario(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Fecha</label><input type="date" value={formDataInventario.fecha} onChange={(e) => setFormDataInventario({ ...formDataInventario, fecha: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Fecha Vencimiento</label><input type="date" value={formDataInventario.fechaVencimiento} onChange={(e) => setFormDataInventario({ ...formDataInventario, fechaVencimiento: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Días</label><input type="number" value={formDataInventario.diasDisponibles} onChange={(e) => setFormDataInventario({ ...formDataInventario, diasDisponibles: parseInt(e.target.value) })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Plataforma *</label><select value={formDataInventario.plataforma} onChange={(e) => setFormDataInventario({ ...formDataInventario, plataforma: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="">--</option>{plataformas.map(p => (<option key={p} value={p}>{p}</option>))}</select></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Correo *</label><input type="email" value={formDataInventario.correo} onChange={(e) => setFormDataInventario({ ...formDataInventario, correo: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Contraseña</label><input type="text" value={formDataInventario.contraseña} onChange={(e) => setFormDataInventario({ ...formDataInventario, contraseña: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Nombre Perfil</label><input type="text" value={formDataInventario.nombrePerfil} onChange={(e) => setFormDataInventario({ ...formDataInventario, nombrePerfil: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Cantidad Perfiles</label><input type="number" min="1" max="4" value={formDataInventario.cantidad} onChange={(e) => { const cant = parseInt(e.target.value) || 1; setFormDataInventario({ ...formDataInventario, cantidad: cant, pins: Array(cant).fill('').map((_, i) => formDataInventario.pins[i] || '') }); }} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Vendedor</label><select value={formDataInventario.vendedor} onChange={(e) => setFormDataInventario({ ...formDataInventario, vendedor: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="">--</option>{equipo.filter(m => m.activo).map(m => (<option key={m.id} value={m.nombre}>{m.nombre} ({m.rol})</option>))}</select></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Precio Mayor ($)</label><input type="number" step="0.01" value={formDataInventario.precioMayor} onChange={(e) => setFormDataInventario({ ...formDataInventario, precioMayor: parseFloat(e.target.value) })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Precio Detal ($)</label><input type="number" step="0.01" value={formDataInventario.precioDetal} onChange={(e) => setFormDataInventario({ ...formDataInventario, precioDetal: parseFloat(e.target.value) })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Método Pago</label><select value={formDataInventario.metodoPago} onChange={(e) => setFormDataInventario({ ...formDataInventario, metodoPago: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="">--</option>{getMetodosPagoOptions().map(m => (<option key={m.id} value={m.id}>{m.nombre}</option>))}</select></div>
                  </div>
                  <button onClick={guardarInventario} className="mt-6 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Agregar al Inventario</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-voltech-border"><h3 className="text-lg font-bold text-white">Inventario Completo</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-voltech-dark border-b border-voltech-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Plataforma</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Vence</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Días</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Precio</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Proveedor</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inventarioFiltrado.map((item) => {
                    const diasRestantes = calcularDiasRestantes(item.fechaVencimiento);
                    return (
                      <tr key={item.id} className="border-b border-voltech-border hover:bg-voltech-border/30">
                        <td className="px-4 py-3 text-sm text-voltech-muted">{item.fecha}</td>
                        <td className="px-4 py-3 text-sm text-white">{item.plataforma}</td>
                        <td className="px-4 py-3 text-sm text-white">{item.fechaVencimiento}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${diasRestantes <= 3 ? 'bg-voltech-error/20 text-voltech-error' : diasRestantes <= 7 ? 'bg-voltech-warning/20 text-voltech-warning' : 'bg-voltech-success/20 text-voltech-success'}`}>{diasRestantes} días</span></td>
                        <td className="px-4 py-3 text-sm text-voltech-success">${item.precioDetal}</td>
                        <td className="px-4 py-3 text-sm text-voltech-muted">{item.proveedor}{item.telefonoProveedor && <p className="text-xs">{item.telefonoProveedor}</p>}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => { setReemplazoData({ cuentaId: item.id, nuevaPlataforma: item.plataforma, nuevoCorreo: item.correo, nuevaContraseña: item.contraseña, nuevosPins: item.pins, observacion: '' }); setShowReemplazoCuentaModal(true); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-purple"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={async () => { if (supabase) await supabase.from('inventario_streaming').delete().eq('id', item.id); setInventario(inventario.filter(i => i.id !== item.id)); toast.success('Eliminado'); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALES ================= */}
      <AnimatePresence>
        {showRegaloModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center pt-[15vh] p-4" onClick={() => setShowRegaloModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-voltech-border p-5 flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-voltech-purple/20"><Gift className="w-5 h-5 text-voltech-purple" /></div><div><h2 className="text-lg font-bold text-white">Días Regalo/Falla</h2><p className="text-xs text-voltech-muted">Ajustar días de la plataforma</p></div></div>
                <button onClick={() => setShowRegaloModal(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div><label className="block text-xs text-voltech-muted mb-2">Tipo de ajuste</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setRegaloData({ ...regaloData, tipo: 'regalo' })} className={`p-3 rounded-lg border text-sm flex items-center justify-center gap-2 ${regaloData.tipo === 'regalo' ? 'bg-voltech-success/20 border-voltech-success text-voltech-success' : 'bg-voltech-dark border-voltech-border text-voltech-muted'}`}><Gift className="w-4 h-4" /> Regalo</button>
                    <button onClick={() => setRegaloData({ ...regaloData, tipo: 'falla' })} className={`p-3 rounded-lg border text-sm flex items-center justify-center gap-2 ${regaloData.tipo === 'falla' ? 'bg-voltech-error/20 border-voltech-error text-voltech-error' : 'bg-voltech-dark border-voltech-border text-voltech-muted'}`}><AlertCircle className="w-4 h-4" /> Falla</button>
                  </div>
                </div>
                <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Cantidad de días *</label><input type="number" min="1" value={regaloData.dias} onChange={(e) => setRegaloData({ ...regaloData, dias: parseInt(e.target.value) || 0 })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Nota *</label><textarea value={regaloData.nota} onChange={(e) => setRegaloData({ ...regaloData, nota: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm h-20 resize-none" /></div>
                <div className="flex gap-3 pt-4">
                  <button onClick={aplicarRegaloFalla} disabled={!regaloData.dias || !regaloData.nota.trim()} className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"><Save className="w-4 h-4" /> Aplicar</button>
                  <button onClick={() => setShowRegaloModal(false)} className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white"><X className="w-4 h-4" /> Cancelar</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ModalWhatsApp
        abierto={showRecordatorioModal && !!selectedVenta}
        clave="recordatorio_streaming"
        titulo="Enviar Recordatorio"
        telefono={selectedVenta?.telefono || ''}
        nombreCliente={selectedVenta?.cliente || ''}
        vars={{
          nombre: selectedVenta?.cliente || '',
          plataforma: (selectedVenta?.plataformas?.[recordatorioPlatIdx] || selectedVenta?.plataformas?.[0])?.plataforma || '',
          monto: Number((selectedVenta?.plataformas?.[recordatorioPlatIdx] || selectedVenta?.plataformas?.[0])?.precioDetal || 0).toFixed(2),
          fecha_vence: (selectedVenta?.plataformas?.[recordatorioPlatIdx] || selectedVenta?.plataformas?.[0])?.fechaVencimiento || '',
        }}
        onClose={() => setShowRecordatorioModal(false)}
      />

      <ModalWhatsApp
        abierto={showEnviarCuentaModal && !!selectedVenta}
        textoFijo={cuentaText}
        titulo="Enviar Cuenta"
        telefono={selectedVenta?.telefono || ''}
        nombreCliente={selectedVenta?.cliente || ''}
        onClose={() => setShowEnviarCuentaModal(false)}
      />

      <ModalWhatsApp
        abierto={showReemplazoModal && !!selectedVenta}
        textoFijo={reemplazoText}
        titulo="Enviar Reemplazo"
        telefono={selectedVenta?.telefono || ''}
        nombreCliente={selectedVenta?.cliente || ''}
        onClose={() => setShowReemplazoModal(false)}
      />

      <AnimatePresence>
        {showReemplazoCuentaModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center pt-[15vh] p-4" onClick={() => setShowReemplazoCuentaModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-voltech-border p-5 flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-voltech-purple/20"><RefreshCw className="w-5 h-5 text-voltech-purple" /></div><div><h2 className="text-lg font-bold text-white">Reemplazar Cuenta</h2><p className="text-xs text-voltech-muted">Nueva cuenta</p></div></div>
                <button onClick={() => setShowReemplazoCuentaModal(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Plataforma</label><input type="text" value={reemplazoData.nuevaPlataforma} onChange={(e) => setReemplazoData({ ...reemplazoData, nuevaPlataforma: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Correo *</label><input type="email" value={reemplazoData.nuevoCorreo} onChange={(e) => setReemplazoData({ ...reemplazoData, nuevoCorreo: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Contraseña *</label><input type="text" value={reemplazoData.nuevaContraseña} onChange={(e) => setReemplazoData({ ...reemplazoData, nuevaContraseña: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">PIN</label><input type="text" value={reemplazoData.nuevosPins[0] || ''} onChange={(e) => setReemplazoData({ ...reemplazoData, nuevosPins: [e.target.value] })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                </div>
                <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Observación</label><textarea value={reemplazoData.observacion} onChange={(e) => setReemplazoData({ ...reemplazoData, observacion: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm h-20 resize-none" /></div>
                <div className="flex gap-3 pt-4">
                  <button onClick={reemplazarCuenta} className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Guardar Reemplazo</button>
                  <button onClick={() => setShowReemplazoCuentaModal(false)} className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white"><X className="w-4 h-4" /> Cancelar</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ NUEVO: Modal "Asignar Cuenta" a plataforma específica desde el Historial */}
      <AnimatePresence>
        {showAsignarPlataformaModal && ventaParaAsignar && plataformaIdxParaAsignar !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center pt-[15vh] p-4" onClick={() => { setShowAsignarPlataformaModal(false); setVentaParaAsignar(null); setPlataformaIdxParaAsignar(null); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-voltech-border p-5 flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-voltech-cyan/20"><LinkIcon className="w-5 h-5 text-voltech-cyan" /></div><div><h2 className="text-lg font-bold text-white">Asignar Cuenta</h2><p className="text-xs text-voltech-muted">{ventaParaAsignar.cliente} - {ventaParaAsignar.plataformas?.[plataformaIdxParaAsignar]?.plataforma}</p></div></div>
                <button onClick={() => { setShowAsignarPlataformaModal(false); setVentaParaAsignar(null); setPlataformaIdxParaAsignar(null); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <div className="mb-4 p-3 bg-voltech-dark/50 border border-voltech-border rounded-lg">
                  <p className="text-xs text-voltech-muted mb-1">Cuentas libres de esta plataforma:</p>
                  <p className="text-sm text-white font-medium">{cuentasLibres.filter(c => c.plataforma === ventaParaAsignar.plataformas?.[plataformaIdxParaAsignar]?.plataforma).length} disponible(s)</p>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {(() => {
                    const plataformaObjetivo = ventaParaAsignar.plataformas?.[plataformaIdxParaAsignar]?.plataforma;
                    const cuentasDisponibles = cuentasLibres.filter(c => c.plataforma === plataformaObjetivo);
                    if (cuentasDisponibles.length === 0) {
                      return <div className="text-center py-8"><Database className="w-12 h-12 mx-auto mb-3 opacity-50 text-voltech-muted" /><p className="text-sm text-voltech-muted">No hay cuentas disponibles para {plataformaObjetivo}</p></div>;
                    }
                    return cuentasDisponibles.map(cuenta => (
                      <button key={cuenta.id} onClick={() => asignarCuentaAVenta(ventaParaAsignar, cuenta, plataformaIdxParaAsignar)} className="w-full p-4 bg-voltech-dark/50 border border-voltech-border rounded-lg text-left hover:border-voltech-cyan hover:bg-voltech-cyan/5 transition-all group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-voltech-cyan/20 flex items-center justify-center"><Mail className="w-5 h-5 text-voltech-cyan" /></div>
                            <div><p className="text-sm font-medium text-white group-hover:text-voltech-cyan">{cuenta.correo}</p><p className="text-xs text-voltech-muted">PIN: {cuenta.pin || 'N/A'} • Perfil: {cuenta.nombrePerfil || 'N/A'}</p></div>
                          </div>
                          <span className="text-xs text-voltech-cyan opacity-0 group-hover:opacity-100">Asignar →</span>
                        </div>
                      </button>
                    ));
                  })()}
                </div>
                <div className="flex gap-3 mt-6 pt-4 border-t border-voltech-border">
                  <button onClick={() => { setShowAsignarPlataformaModal(false); setVentaParaAsignar(null); setPlataformaIdxParaAsignar(null); }} className="flex-1 px-4 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white"><X className="w-4 h-4 inline mr-1" /> Cancelar</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ NUEVO: Modal "Asignar Cuenta" desde la tabla de Cuentas (cuenta → venta) */}
      <AnimatePresence>
        {showAssignModal && selectedVenta?.cuenta && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center pt-[15vh] p-4" onClick={() => { setShowAssignModal(false); setSelectedVenta(null); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-voltech-border p-5 flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-voltech-cyan/20"><LinkIcon className="w-5 h-5 text-voltech-cyan" /></div><div><h2 className="text-lg font-bold text-white">Asignar cuenta a venta</h2><p className="text-xs text-voltech-muted">{selectedVenta.cuenta.plataforma} - {selectedVenta.cuenta.correo}</p></div></div>
                <button onClick={() => { setShowAssignModal(false); setSelectedVenta(null); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <div className="mb-4 p-3 bg-voltech-dark/50 border border-voltech-border rounded-lg">
                  <p className="text-xs text-voltech-muted mb-1">Ventas disponibles para esta plataforma:</p>
                  <p className="text-sm text-white font-medium">{(selectedVenta.ventasDisponibles || []).length} venta(s) sin cuenta</p>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {(selectedVenta.ventasDisponibles || []).length === 0 ? (
                    <div className="text-center py-8"><Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-voltech-muted" /><p className="text-sm text-voltech-muted">No hay ventas sin cuenta para {selectedVenta.cuenta.plataforma}</p></div>
                  ) : (
                    selectedVenta.ventasDisponibles.map(venta => {
                      // Encontrar la plataforma específica que coincide y no tiene cuenta
                      const platIdx = (venta.plataformas || []).findIndex(p => p.plataforma === selectedVenta.cuenta.plataforma && !getCuentaAsignadaDePlataforma(venta, (venta.plataformas || []).indexOf(p)));
                      return (
                        <button key={venta.id} onClick={() => asignarCuentaAVenta(venta, selectedVenta.cuenta, platIdx)} className="w-full p-4 bg-voltech-dark/50 border border-voltech-border rounded-lg text-left hover:border-voltech-cyan hover:bg-voltech-cyan/5 transition-all group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-voltech-cyan/20 flex items-center justify-center"><Users className="w-5 h-5 text-voltech-cyan" /></div>
                              <div>
                                <p className="text-sm font-medium text-white group-hover:text-voltech-cyan">{venta.cliente}</p>
                                <p className="text-xs text-voltech-muted">📱 {venta.telefono} • {venta.fecha}</p>
                              </div>
                            </div>
                            <span className="text-xs text-voltech-cyan opacity-0 group-hover:opacity-100">Asignar →</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="flex gap-3 mt-6 pt-4 border-t border-voltech-border">
                  <button onClick={() => { setShowAssignModal(false); setSelectedVenta(null); }} className="flex-1 px-4 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white"><X className="w-4 h-4 inline mr-1" /> Cancelar</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPlataformasModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center pt-[15vh] p-4" onClick={() => setShowPlataformasModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-voltech-border p-5 flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-voltech-purple/20"><Tag className="w-5 h-5 text-voltech-purple" /></div><div><h2 className="text-lg font-bold text-white">Gestionar Plataformas</h2><p className="text-xs text-voltech-muted">Agrega o elimina plataformas</p></div></div>
                <button onClick={() => setShowPlataformasModal(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 w-full min-w-0 mb-6">
                  <input type="text" value={nuevaPlataforma} onChange={(e) => setNuevaPlataforma(e.target.value)} className="input-voltech flex-1 min-w-0 w-full text-xs sm:text-sm rounded-lg px-3 sm:px-4 py-2" placeholder="Nombre de la plataforma" onKeyPress={(e) => e.key === 'Enter' && agregarPlataforma()} />
                  <button onClick={agregarPlataforma} className="shrink-0 text-xs py-2 px-3 sm:text-sm sm:px-4 bg-voltech-purple/20 text-voltech-purple rounded-lg hover:bg-voltech-purple/30 flex items-center justify-center gap-1 sm:gap-2"><Plus className="w-4 h-4" /> <span className="whitespace-nowrap">Agregar</span></button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {plataformas.map((plataforma, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-voltech-dark/50 border border-voltech-border rounded-lg">
                      <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-voltech-purple/20 flex items-center justify-center"><MonitorPlay className="w-4 h-4 text-voltech-purple" /></div><span className="text-sm text-white">{plataforma}</span></div>
                      <button onClick={() => eliminarPlataforma(plataforma)} className="p-2 text-voltech-error hover:bg-voltech-error/10 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-voltech-border">
                  <button onClick={() => setShowPlataformasModal(false)} className="w-full px-4 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white">Cerrar</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}