'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase'; // ✅ NUEVO: Conexión a Supabase
import { 
  MonitorPlay, Database, AlertTriangle, DollarSign, Package, Search, 
  Edit3, Trash2, X, Save, Calendar, MessageCircle, Mail, RefreshCw,
  Eye, EyeOff, ChevronDown, CheckCircle, Link as LinkIcon, Plus, Tag,
  Gift, AlertCircle, StickyNote, Copy, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function VentasStreamingPage() {
  const [activeTab, setActiveTab] = useState('nueva');
  const [ventas, setVentas] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [equipo, setEquipo] = useState([]);
  const [plataformas, setPlataformas] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPlataformasModal, setShowPlataformasModal] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [mostrarPrecios, setMostrarPrecios] = useState(false);
  const [nuevaPlataforma, setNuevaPlataforma] = useState('');
  const [expandedVenta, setExpandedVenta] = useState(null);
  const [expandedCuenta, setExpandedCuenta] = useState(null);
  
  const [showRegaloModal, setShowRegaloModal] = useState(false);
  const [regaloData, setRegaloData] = useState({
    ventaId: null, plataformaIndex: 0, dias: 0, tipo: 'regalo', nota: ''
  });

  const [showRecordatorioModal, setShowRecordatorioModal] = useState(false);
  const [recordatorioText, setRecordatorioText] = useState('');
  
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

  // ✅ ACTUALIZADO: Carga desde Supabase con fallback a localStorage
  useEffect(() => {
    const cargarDatos = async () => {
      const userLogged = localStorage.getItem('voltech_user');
      if (userLogged) setCurrentUser(JSON.parse(userLogged));

      let vData = [], cData = [], iData = [], pData = null;

      if (supabase) {
        const [{ data: v }, { data: c }, { data: i }, { data: p }] = await Promise.all([
          supabase.from('ventas_streaming').select('*'),
          supabase.from('cuentas_streaming').select('*'),
          supabase.from('inventario_streaming').select('*'),
          supabase.from('settings').select('valor').eq('clave', 'plataformas_streaming').single()
        ]);
        if (v) vData = v;
        if (c) cData = c;
        if (i) iData = i;
        if (p?.valor) pData = p.valor;
      }

      // Fallback y migración de datos
      if (vData.length === 0) {
        const ventasGuardadas = localStorage.getItem('voltech_ventas_streaming');
        if (ventasGuardadas) {
          const ventasData = JSON.parse(ventasGuardadas);
          vData = ventasData.map(v => {
            if (!v.plataformas && v.plataforma) {
              return {
                ...v,
                plataformas: [{
                  plataforma: v.plataforma, fechaVencimiento: v.fechaVencimiento,
                  diasDisponibles: v.diasDisponibles || 30,
                  precioMayor: v.precioMayor || 0, precioDetal: v.precioDetal || 0,
                }],
                total: v.total || (v.precioDetal || 0),
                metodoPago: v.metodoPago || 'efectivo',
                cartera: v.cartera || 'Caja Principal',
              };
            }
            return v;
          });
        }
      }

      if (cData.length === 0) {
        const cuentasGuardadas = localStorage.getItem('voltech_cuentas_streaming');
        if (cuentasGuardadas) cData = JSON.parse(cuentasGuardadas);
      }

      if (iData.length === 0) {
        const inventarioGuardado = localStorage.getItem('voltech_inventario_streaming');
        if (inventarioGuardado) iData = JSON.parse(inventarioGuardado);
      }

      if (clientes.length === 0) {
        const clientesGuardados = localStorage.getItem('voltech_clientes');
        if (clientesGuardados) {
          try {
            const parsed = JSON.parse(clientesGuardados);
            setClientes(Array.isArray(parsed) ? parsed : []);
          } catch (error) { setClientes([]); }
        }
      }

      if (equipo.length === 0) {
        const equipoGuardado = localStorage.getItem('voltech_equipo');
        if (equipoGuardado) setEquipo(JSON.parse(equipoGuardado));
      }

      const historialGuardado = localStorage.getItem('voltech_historial_reemplazos');
      if (historialGuardado) setHistorialReemplazos(JSON.parse(historialGuardado));
      
      if (!pData) {
        const plataformasGuardadas = localStorage.getItem('voltech_plataformas_streaming');
        if (plataformasGuardadas) {
          setPlataformas(JSON.parse(plataformasGuardadas));
        } else {
          const plataformasDefault = ['Netflix Premium', 'Netflix Estándar', 'Disney+', 'HBO Max', 'Spotify', 'Amazon Prime', 'YouTube Premium', 'Apple TV+'];
          setPlataformas(plataformasDefault);
          localStorage.setItem('voltech_plataformas_streaming', JSON.stringify(plataformasDefault));
        }
      } else {
        setPlataformas(pData);
      }

      setVentas(vData);
      setCuentas(cData);
      setInventario(iData);
    };

    cargarDatos();
  }, []);

  const calcularFechaVencimiento = (fechaInicio, dias) => {
    if (!fechaInicio || !dias) return '';
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + parseInt(dias));
    return fecha.toISOString().split('T')[0];
  };

  const calcularDiasDesdeFecha = (fechaInicio, fechaVencimiento) => {
    if (!fechaInicio || !fechaVencimiento) return 0;
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaVencimiento);
    const diffTime = fin - inicio;
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
        {
          plataforma: '', fechaVencimiento: calcularFechaVencimiento(prev.fecha, 30),
          diasDisponibles: 30, precioMayor: 0, precioDetal: 0,
        }
      ]
    }));
  };

  const eliminarPlataformaDeVenta = (index) => {
    if (formDataNueva.plataformas.length > 1) {
      const nuevasPlataformas = formDataNueva.plataformas.filter((_, i) => i !== index);
      setFormDataNueva(prev => ({ ...prev, plataformas: nuevasPlataformas }));
    } else {
      toast.error('Debe haber al menos una plataforma');
    }
  };

  const actualizarPlataforma = (index, field, value) => {
    const nuevasPlataformas = [...formDataNueva.plataformas];
    if (field === 'diasDisponibles') {
      const dias = parseInt(value) || 0;
      nuevasPlataformas[index].diasDisponibles = dias;
      nuevasPlataformas[index].fechaVencimiento = calcularFechaVencimiento(formDataNueva.fecha, dias);
    } else if (field === 'fechaVencimiento') {
      nuevasPlataformas[index].fechaVencimiento = value;
      nuevasPlataformas[index].diasDisponibles = calcularDiasDesdeFecha(formDataNueva.fecha, value);
    } else {
      nuevasPlataformas[index][field] = value;
    }
    setFormDataNueva(prev => ({ ...prev, plataformas: nuevasPlataformas }));
  };

  // ✅ ACTUALIZADO: Guarda en Supabase y localStorage
  const aplicarRegaloFalla = async () => {
    const { ventaId, plataformaIndex, dias, tipo, nota } = regaloData;
    if (!ventaId || dias === 0) {
      toast.error('Selecciona una venta y especifica los días');
      return;
    }

    const ventasActualizadas = ventas.map(v => {
      if (v.id !== ventaId) return v;
      const nuevasPlataformas = [...v.plataformas];
      if (nuevasPlataformas[plataformaIndex]) {
        const plat = { ...nuevasPlataformas[plataformaIndex] };
        const diasActuales = plat.diasDisponibles || 0;
        const nuevosDias = tipo === 'regalo' ? diasActuales + dias : diasActuales - dias;
        plat.diasDisponibles = nuevosDias;
        plat.fechaVencimiento = calcularFechaVencimiento(v.fecha, nuevosDias);
        if (!plat.historialRegalos) plat.historialRegalos = [];
        plat.historialRegalos.push({
          tipo, dias, nota, fecha: new Date().toISOString(),
          usuario: currentUser?.nombre || 'Admin'
        });
        nuevasPlataformas[plataformaIndex] = plat;
      }
      return { ...v, plataformas: nuevasPlataformas };
    });

    if (supabase) {
      const ventaActualizada = ventasActualizadas.find(v => v.id === ventaId);
      await supabase.from('ventas_streaming').update({ plataformas: ventaActualizada.plataformas }).eq('id', ventaId);
    }

    setVentas(ventasActualizadas);
    localStorage.setItem('voltech_ventas_streaming', JSON.stringify(ventasActualizadas));
    toast.success(`${tipo === 'regalo' ? 'Días de regalo' : 'Días de falla'} aplicados correctamente`);
    setShowRegaloModal(false);
    setRegaloData({ ventaId: null, plataformaIndex: 0, dias: 0, tipo: 'regalo', nota: '' });
  };

  // ✅ ACTUALIZADO: Guarda en Supabase y localStorage
  const guardarNuevaPlataforma = async () => {
    if (!formDataNueva.cliente || !formDataNueva.vendedor || formDataNueva.plataformas.some(p => !p.plataforma)) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    const total = formDataNueva.plataformas.reduce((sum, p) => sum + (p.precioDetal || 0), 0);
    const nuevaVenta = {
      id: editingId || Date.now().toString(), ...formDataNueva, total,
      estado: 'activa', fechaRegistro: new Date().toISOString(),
      registradoPor: currentUser?.nombre || 'Admin',
    };

    let cuentasActualizadas = cuentas;
    if (formDataNueva.cuentaAsignada) {
      cuentasActualizadas = cuentas.map(c =>
        c.id === formDataNueva.cuentaAsignada.id ? { ...c, estado: 'ocupada', ventaId: nuevaVenta.id } : c
      );
      if (supabase) {
        await supabase.from('cuentas_streaming').upsert(cuentasActualizadas.filter(c => c.id === formDataNueva.cuentaAsignada.id), { onConflict: 'id' });
      }
      setCuentas(cuentasActualizadas);
      localStorage.setItem('voltech_cuentas_streaming', JSON.stringify(cuentasActualizadas));
    }

    const ventasActualizadas = editingId
      ? ventas.map(v => v.id === editingId ? nuevaVenta : v)
      : [nuevaVenta, ...ventas];

    if (supabase) {
      await supabase.from('ventas_streaming').upsert(nuevaVenta, { onConflict: 'id' });
    }

    setVentas(ventasActualizadas);
    localStorage.setItem('voltech_ventas_streaming', JSON.stringify(ventasActualizadas));

    if (formDataNueva.cliente && formDataNueva.telefono) {
      const clienteExistente = clientes.find(c => 
        c.telefono === formDataNueva.telefono || c.nombre?.toLowerCase() === formDataNueva.cliente.toLowerCase()
      );

      if (!clienteExistente) {
        const nuevoCliente = {
          id: Date.now().toString(), nombre: formDataNueva.cliente, telefono: formDataNueva.telefono,
          email: '', direccion: '', fechaRegistro: new Date().toISOString().split('T')[0],
          ultimaCompra: new Date().toISOString().split('T')[0], totalCompras: 1,
          totalGastado: total, etiquetas: ['Streaming'],
          registradoPor: currentUser?.nombre || 'Admin',
        };
        const clientesActualizados = [...clientes, nuevoCliente];
        setClientes(clientesActualizados);
        if (supabase) await supabase.from('clientes').upsert(nuevoCliente, { onConflict: 'id' });
        localStorage.setItem('voltech_clientes', JSON.stringify(clientesActualizados));
        toast.success(`Cliente "${formDataNueva.cliente}" creado automáticamente`);
      } else {
        const clientesActualizados = clientes.map(c => 
          c.id === clienteExistente.id 
            ? { ...c, totalCompras: (c.totalCompras || 0) + 1, totalGastado: (c.totalGastado || 0) + total, ultimaCompra: new Date().toISOString().split('T')[0] } 
            : c
        );
        setClientes(clientesActualizados);
        if (supabase) {
          const cToUpdate = clientesActualizados.find(c => c.id === clienteExistente.id);
          await supabase.from('clientes').update(cToUpdate).eq('id', clienteExistente.id);
        }
        localStorage.setItem('voltech_clientes', JSON.stringify(clientesActualizados));
      }
    }

    toast.success(editingId ? 'Venta actualizada' : 'Venta registrada correctamente');
    resetForm('nueva');
    setShowFormNueva(false);
  };

  const actualizarPinCuenta = (index, valor) => {
    const nuevosPins = [...formDataCuenta.pins];
    nuevosPins[index] = valor;
    setFormDataCuenta(prev => ({ ...prev, pins: nuevosPins }));
  };

  // ✅ ACTUALIZADO: Guarda en Supabase y localStorage
  const guardarCuenta = async () => {
    if (!formDataCuenta.plataforma || !formDataCuenta.correo || !formDataCuenta.contraseña) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    const nuevasCuentas = [];
    for (let i = 0; i < formDataCuenta.cantidad; i++) {
      nuevasCuentas.push({
        id: (Date.now() + i).toString(), plataforma: formDataCuenta.plataforma,
        correo: formDataCuenta.correo, contraseña: formDataCuenta.contraseña,
        nombrePerfil: formDataCuenta.nombrePerfil,
        pin: formDataCuenta.pins[i] || '',
        vendedor: formDataCuenta.vendedor, estado: 'libre',
        fechaRegistro: new Date().toISOString(), registradoPor: currentUser?.nombre || 'Admin',
        perfil: i + 1,
      });
    }

    if (supabase) {
      await supabase.from('cuentas_streaming').insert(nuevasCuentas);
    }

    const cuentasActualizadas = [...nuevasCuentas, ...cuentas];
    setCuentas(cuentasActualizadas);
    localStorage.setItem('voltech_cuentas_streaming', JSON.stringify(cuentasActualizadas));
    toast.success(`${formDataCuenta.cantidad} cuenta(s) guardada(s) correctamente`);
    
    setFormDataCuenta({ plataforma: '', correo: '', contraseña: '', nombrePerfil: '', pins: [''], cantidad: 1, vendedor: '' });
  };

  const actualizarPinInventario = (index, valor) => {
    const nuevosPins = [...formDataInventario.pins];
    nuevosPins[index] = valor;
    setFormDataInventario(prev => ({ ...prev, pins: nuevosPins }));
  };

  // ✅ ACTUALIZADO: Guarda en Supabase y localStorage
  const guardarInventario = async () => {
    if (!formDataInventario.plataforma || !formDataInventario.correo) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    const nuevoInventario = {
      id: Date.now().toString(), ...formDataInventario, estado: 'disponible',
      fechaRegistro: new Date().toISOString(), registradoPor: currentUser?.nombre || 'Admin',
    };

    if (supabase) {
      await supabase.from('inventario_streaming').insert(nuevoInventario);
    }

    const inventarioActualizado = [nuevoInventario, ...inventario];
    setInventario(inventarioActualizado);
    localStorage.setItem('voltech_inventario_streaming', JSON.stringify(inventarioActualizado));
    toast.success('Cuenta agregada al inventario');
    resetForm('inventario');
    setShowFormInventario(false);
  };

  // ✅ ACTUALIZADO: Guarda en Supabase y localStorage
  const reemplazarCuenta = async () => {
    if (!reemplazoData.cuentaId || !reemplazoData.nuevoCorreo || !reemplazoData.nuevaContraseña) {
      toast.error('Completa los datos de la nueva cuenta');
      return;
    }

    const cuentaOriginal = cuentas.find(c => c.id === reemplazoData.cuentaId);
    if (!cuentaOriginal) return;

    const nuevaCuenta = {
      ...cuentaOriginal,
      id: Date.now().toString(),
      plataforma: reemplazoData.nuevaPlataforma || cuentaOriginal.plataforma,
      correo: reemplazoData.nuevoCorreo,
      contraseña: reemplazoData.nuevaContraseña,
      pin: reemplazoData.nuevosPins[0] || '',
      estado: 'libre',
      fechaReemplazo: new Date().toISOString(),
      reemplazadoPor: currentUser?.nombre || 'Admin',
      observacion: reemplazoData.observacion,
      cuentaAnterior: {
        correo: cuentaOriginal.correo,
        contraseña: cuentaOriginal.contraseña,
        pin: cuentaOriginal.pin,
        fechaReemplazo: new Date().toISOString()
      }
    };

    const cuentaOriginalActualizada = { 
      ...cuentaOriginal, 
      estado: 'reemplazada', 
      tieneHistorial: true, 
      cuentaReemplazadaPor: nuevaCuenta.id 
    };

    const cuentasActualizadas = cuentas.map(c => {
      if (c.id === reemplazoData.cuentaId) return cuentaOriginalActualizada;
      return c;
    });
    cuentasActualizadas.unshift(nuevaCuenta);

    if (supabase) {
      await supabase.from('cuentas_streaming').upsert([cuentaOriginalActualizada, nuevaCuenta], { onConflict: 'id' });
    }

    setCuentas(cuentasActualizadas);
    localStorage.setItem('voltech_cuentas_streaming', JSON.stringify(cuentasActualizadas));
    
    const historialActualizado = {
      ...historialReemplazos,
      [reemplazoData.cuentaId]: [
        ...(historialReemplazos[reemplazoData.cuentaId] || []),
        { ...cuentaOriginal, fechaReemplazo: new Date().toISOString(), reemplazadoPor: currentUser?.nombre || 'Admin' }
      ]
    };
    setHistorialReemplazos(historialActualizado);
    localStorage.setItem('voltech_historial_reemplazos', JSON.stringify(historialActualizado));

    toast.success('Cuenta reemplazada correctamente');
    setShowReemplazoCuentaModal(false);
    setReemplazoData({ cuentaId: null, nuevaPlataforma: '', nuevoCorreo: '', nuevaContraseña: '', nuevosPins: [''], observacion: '' });
  };

  // ✅ ACTUALIZADO: Guarda en Supabase y localStorage
  const asignarCuentaAVenta = async (venta, cuenta) => {
    const ventasActualizadas = ventas.map(v => v.id === venta.id ? { ...v, cuentaAsignada: cuenta } : v);
    
    const cuentasActualizadas = cuentas.map(c => {
      if (c.id === cuenta.id) {
        return { 
          ...c, 
          estado: 'ocupada', 
          ventaId: venta.id,
          nombrePerfil: venta.cliente || c.nombrePerfil 
        };
      }
      return c;
    });

    if (supabase) {
      await supabase.from('ventas_streaming').update({ cuentaAsignada: cuenta }).eq('id', venta.id);
      await supabase.from('cuentas_streaming').update({ estado: 'ocupada', ventaId: venta.id, nombrePerfil: venta.cliente || cuenta.nombrePerfil }).eq('id', cuenta.id);
    }

    setVentas(ventasActualizadas);
    setCuentas(cuentasActualizadas);
    localStorage.setItem('voltech_ventas_streaming', JSON.stringify(ventasActualizadas));
    localStorage.setItem('voltech_cuentas_streaming', JSON.stringify(cuentasActualizadas));
    toast.success('Cuenta asignada correctamente');
    setShowAssignModal(false);
    setSelectedVenta(null);
  };

  const generarRecordatorio = (venta) => {
    const plataforma = venta.plataformas?.[0]?.plataforma || '';
    const monto = venta.plataformas?.[0]?.precioDetal || 0;
    
    const textoDefault = `¡Buen día, ${venta.cliente}!

Te escribimos de parte de *Voltechstore.ve* para recordarte que tu servicio está disponible *solo hasta el día de mañana*

${plataforma}
Monto ${monto}$

Por favor, realiza el pago pendiente de antes de esta fecha para evitar la suspensión del servicio.

Si ya realizaste tu pago, ignora este mensaje y ¡gracias por tu puntualidad!

Que tengas un excelente día,
El equipo de Voltechstore.ve`;

    setRecordatorioText(textoDefault);
    setSelectedVenta(venta);
    setShowRecordatorioModal(true);
  };

  const enviarRecordatorioWhatsApp = () => {
    if (!selectedVenta) return;
    const telefonoLimpio = selectedVenta.telefono.replace(/\D/g, '');
    const url = `https://wa.me/58${telefonoLimpio}?text=${encodeURIComponent(recordatorioText)}`;
    window.open(url, '_blank');
    toast.success('Recordatorio enviado por WhatsApp');
    setShowRecordatorioModal(false);
  };

  const copiarRecordatorio = () => {
    navigator.clipboard.writeText(recordatorioText);
    toast.success('Texto copiado al portapapeles');
  };

  const generarEnviarCuenta = (venta) => {
    const cuenta = venta.cuentaAsignada;
    if (!cuenta) {
      toast.error('No hay cuenta asignada');
      return;
    }

    const plataforma = venta.plataformas?.[0]?.plataforma || '';
    const fechaVenc = venta.plataformas?.[0]?.fechaVencimiento || '';
    
    const texto = `*_✅ PERFIL ${plataforma.toUpperCase()}_*

*📧 Correo:* ${cuenta.correo}
*🔑 Contraseña:* ${cuenta.contraseña}

*☑️ Perfil:* ${cuenta.nombrePerfil || 'N/A'}
*🔐 PIN:* ${cuenta.pin || 'N/A'}

*📍 Vence:*  *${fechaVenc}*`;

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
    const url = `https://wa.me/58${telefonoLimpio}?text=${encodeURIComponent(cuentaText)}`;
    window.open(url, '_blank');
    toast.success('Cuenta enviada por WhatsApp');
    setShowEnviarCuentaModal(false);
  };

  const generarEnviarReemplazo = (venta) => {
    const cuenta = venta.cuentaAsignada;
    if (!cuenta) {
      toast.error('No hay cuenta asignada');
      return;
    }

    const plataforma = venta.plataformas?.[0]?.plataforma || '';
    const fechaVenc = venta.plataformas?.[0]?.fechaVencimiento || '';
    
    const texto = `*Reemplazo*

*_✅ PERFIL ${plataforma.toUpperCase()}_*

*📧 Correo:* ${cuenta.correo}
*🔑 Contraseña:* ${cuenta.contraseña}

*☑️ Perfil:* ${cuenta.nombrePerfil || 'N/A'}
*🔐 PIN:* ${cuenta.pin || 'N/A'}

*📍 Vence:*  *${fechaVenc}*`;

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
    const url = `https://wa.me/58${telefonoLimpio}?text=${encodeURIComponent(reemplazoText)}`;
    window.open(url, '_blank');
    toast.success('Reemplazo enviado por WhatsApp');
    setShowReemplazoModal(false);
  };

  const renovarVenta = (venta) => {
    setFormDataNueva({
      fecha: new Date().toISOString().split('T')[0], vendedor: venta.vendedor,
      cliente: venta.cliente, telefono: venta.telefono,
      metodoPago: venta.metodoPago || 'efectivo',
      cartera: venta.cartera || 'Caja Principal',
      plataformas: venta.plataformas.map(p => ({
        ...p, fechaVencimiento: calcularFechaVencimiento(new Date().toISOString().split('T')[0], p.diasDisponibles || 30),
        diasDisponibles: p.diasDisponibles || 30,
      })),
      cuentaAsignada: null,
    });
    setEditingId(null);
    setActiveTab('nueva');
    setShowFormNueva(true);
    toast.success('Datos cargados para renovación');
  };

  const editarVenta = (venta) => {
    setFormDataNueva({ ...venta, mostrarPrecios: currentUser?.rol === 'admin' });
    setEditingId(venta.id);
    setActiveTab('nueva');
    setShowFormNueva(true);
  };

  // ✅ ACTUALIZADO: Elimina de Supabase y localStorage
  const eliminarVenta = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta venta?')) return;
    if (supabase) {
      await supabase.from('ventas_streaming').delete().eq('id', id);
    }
    const ventasActualizadas = ventas.filter(v => v.id !== id);
    setVentas(ventasActualizadas);
    localStorage.setItem('voltech_ventas_streaming', JSON.stringify(ventasActualizadas));
    toast.success('Venta eliminada');
  };

  // ✅ ACTUALIZADO: Guarda en Supabase (settings) y localStorage
  const agregarPlataforma = async () => {
    if (!nuevaPlataforma.trim()) { toast.error('Ingresa un nombre para la plataforma'); return; }
    if (plataformas.includes(nuevaPlataforma)) { toast.error('Esta plataforma ya existe'); return; }

    const plataformasActualizadas = [...plataformas, nuevaPlataforma];
    if (supabase) {
      await supabase.from('settings').upsert({ clave: 'plataformas_streaming', valor: plataformasActualizadas }, { onConflict: 'clave' });
    }
    setPlataformas(plataformasActualizadas);
    localStorage.setItem('voltech_plataformas_streaming', JSON.stringify(plataformasActualizadas));
    toast.success('Plataforma agregada');
    setNuevaPlataforma('');
  };

  // ✅ ACTUALIZADO: Elimina de Supabase (settings) y localStorage
  const eliminarPlataforma = async (nombre) => {
    if (!confirm(`¿Estás seguro de eliminar "${nombre}"?`)) return;
    const plataformasActualizadas = plataformas.filter(p => p !== nombre);
    if (supabase) {
      await supabase.from('settings').upsert({ clave: 'plataformas_streaming', valor: plataformasActualizadas }, { onConflict: 'clave' });
    }
    setPlataformas(plataformasActualizadas);
    localStorage.setItem('voltech_plataformas_streaming', JSON.stringify(plataformasActualizadas));
    toast.success('Plataforma eliminada');
  };

  const resetForm = (tipo) => {
    if (tipo === 'nueva') {
      setFormDataNueva({
        fecha: new Date().toISOString().split('T')[0], vendedor: '', cliente: '', telefono: '',
        metodoPago: 'efectivo', cartera: 'Caja Principal',
        plataformas: [{ plataforma: '', fechaVencimiento: '', diasDisponibles: 30, precioMayor: 0, precioDetal: 0 }],
        cuentaAsignada: null,
      });
      setEditingId(null);
    } else if (tipo === 'inventario') {
      setFormDataInventario({
        fecha: new Date().toISOString().split('T')[0], fechaVencimiento: '', diasDisponibles: 30,
        plataforma: '', correo: '', contraseña: '', nombrePerfil: '', pins: [''], cantidad: 1, vendedor: '',
        precioMayor: 0, precioDetal: 0, proveedor: '', telefonoProveedor: '', metodoPago: 'efectivo', cartera: 'Caja Principal',
      });
    }
  };

  const ventasFiltradas = ventas.filter(v =>
    v.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.plataformas?.some(p => p.plataforma?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const cuentasFiltradas = cuentas.filter(c =>
    c.plataforma?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.correo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cuentasLibres = cuentas.filter(c => c.estado === 'libre');

  const inventarioFiltrado = inventario.filter(i =>
    i.plataforma?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calcularDiasRestantes = (fechaVencimiento) => {
    if (!fechaVencimiento) return 0;
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = vencimiento - hoy;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

  return (
    <div className="space-y-6">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' },
        success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } },
      }} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ventas Streaming</h1>
          <p className="text-sm text-voltech-muted mt-1">Gestiona plataformas, cuentas e inventario</p>
        </div>
        <button onClick={handleHeaderButton} className="px-4 py-2 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> {getHeaderText()}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-cyan/20"><MonitorPlay className="w-5 h-5 text-voltech-cyan" /></div>
            <div><p className="text-xs text-voltech-muted">Ventas Activas</p><p className="text-xl font-bold text-white">{ventas.filter(v => v.estado === 'activa').length}</p></div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-success/20"><Database className="w-5 h-5 text-voltech-success" /></div>
            <div><p className="text-xs text-voltech-muted">Cuentas Disponibles</p><p className="text-xl font-bold text-white">{cuentas.filter(c => c.estado === 'libre').length}</p></div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-warning/20"><AlertTriangle className="w-5 h-5 text-voltech-warning" /></div>
            <div><p className="text-xs text-voltech-muted">Por Vencer (7 días)</p><p className="text-xl font-bold text-white">{ventas.filter(v => { const dias = calcularDiasRestantes(v.plataformas?.[0]?.fechaVencimiento); return dias <= 7 && dias >= 0 && v.estado === 'activa'; }).length}</p></div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-purple/20"><DollarSign className="w-5 h-5 text-voltech-purple" /></div>
            <div><p className="text-xs text-voltech-muted">Ingresos del Mes</p><p className="text-xl font-bold text-white">${ventas.filter(v => v.fechaRegistro?.startsWith(new Date().toISOString().slice(0, 7))).reduce((acc, v) => acc + (v.total || 0), 0).toFixed(2)}</p></div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-voltech-border">
        <button onClick={() => setActiveTab('nueva')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'nueva' ? 'text-voltech-cyan border-b-2 border-voltech-cyan' : 'text-voltech-muted hover:text-white'}`}>
          <MonitorPlay className="w-4 h-4 inline mr-2" /> Nueva Plataforma
        </button>
        <button onClick={() => setActiveTab('cuentas')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'cuentas' ? 'text-voltech-cyan border-b-2 border-voltech-cyan' : 'text-voltech-muted hover:text-white'}`}>
          <Database className="w-4 h-4 inline mr-2" /> Agregar Cuentas
        </button>
        <button onClick={() => setActiveTab('inventario')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'inventario' ? 'text-voltech-cyan border-b-2 border-voltech-cyan' : 'text-voltech-muted hover:text-white'}`}>
          <Package className="w-4 h-4 inline mr-2" /> Inventario Plataformas
        </button>
        <button onClick={() => setShowPlataformasModal(true)} className="px-4 py-2 text-sm font-medium text-voltech-muted hover:text-white transition-colors flex items-center gap-2">
          <Tag className="w-4 h-4" /> Gestionar Plataformas
        </button>
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
                    <button onClick={() => setShowFormNueva(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted transition-colors"><X className="w-5 h-5" /></button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 pb-6 border-b border-voltech-border">
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1 ml-1">Fecha *</label>
                      <input type="date" value={formDataNueva.fecha} onChange={(e) => setFormDataNueva({ ...formDataNueva, fecha: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1 ml-1">Vendedor *</label>
                      <select value={formDataNueva.vendedor} onChange={(e) => setFormDataNueva({ ...formDataNueva, vendedor: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                        <option value="">-- Selecciona --</option>
                        {equipo.filter(m => m.activo).map(m => (<option key={m.id} value={m.nombre}>{m.nombre} ({m.rol})</option>))}
                      </select>
                    </div>
                    <div className="relative">
                      <label className="block text-xs text-voltech-muted mb-1 ml-1">Comprador *</label>
                      <input ref={clienteInputRef} type="text" value={formDataNueva.cliente} onChange={(e) => handleClienteChange(e.target.value)} onFocus={() => { if (sugerenciasClientes.length > 0) setShowSugerencias(true); }} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Buscar cliente..." />
                      {showSugerencias && sugerenciasClientes.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-voltech-surface border border-voltech-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                          {sugerenciasClientes.map((cliente) => (
                            <button key={cliente.id} onClick={() => seleccionarCliente(cliente)} className="w-full px-4 py-2 text-left text-sm hover:bg-voltech-border flex items-center justify-between border-b border-voltech-border/50 last:border-0">
                              <span className="text-white">{cliente.nombre}</span>
                              <span className="text-xs text-voltech-muted">{cliente.telefono}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1 ml-1">Teléfono</label>
                      <input type="tel" value={formDataNueva.telefono} onChange={(e) => setFormDataNueva({ ...formDataNueva, telefono: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="0412-1234567" />
                    </div>
                    
                    {/* ✅ NUEVO: Método de Pago */}
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1 ml-1">Método de Pago *</label>
                      <select value={formDataNueva.metodoPago} onChange={(e) => setFormDataNueva({ ...formDataNueva, metodoPago: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                        <option value="efectivo">Efectivo</option>
                        <option value="pago_movil">Pago Móvil</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="binance">Binance / Zelle</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>

                    {/* ✅ NUEVO: Cartera */}
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1 ml-1">Cartera *</label>
                      <select value={formDataNueva.cartera} onChange={(e) => setFormDataNueva({ ...formDataNueva, cartera: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                        <option value="Caja Principal">Caja Principal</option>
                        <option value="Caja Chica">Caja Chica</option>
                        <option value="Banco Mercantil">Banco Mercantil</option>
                        <option value="Banco Provincial">Banco Provincial</option>
                        <option value="Binance">Binance</option>
                      </select>
                    </div>
                  </div>

                  {formDataNueva.plataformas.map((plat, index) => (
                    <div key={index} className={`mb-6 pb-6 ${index < formDataNueva.plataformas.length - 1 ? 'border-b border-voltech-border' : ''}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-voltech-cyan">{index === 0 ? 'PLATAFORMA 1' : `PLATAFORMA ${index + 1}`}</h4>
                        {index > 0 && (
                          <button onClick={() => eliminarPlataformaDeVenta(index)} className="px-3 py-1 bg-voltech-error/20 text-voltech-error rounded-lg text-xs hover:bg-voltech-error/30 transition-colors flex items-center gap-1">
                            <X className="w-3 h-3" /> Eliminar
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-voltech-muted mb-1 ml-1">Plataforma *</label>
                          <select value={plat.plataforma} onChange={(e) => actualizarPlataforma(index, 'plataforma', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                            <option value="">-- Selecciona --</option>
                            {plataformas.map(p => (<option key={p} value={p}>{p}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-voltech-muted mb-1 ml-1">Fecha Vencimiento</label>
                          <input type="date" value={plat.fechaVencimiento} onChange={(e) => actualizarPlataforma(index, 'fechaVencimiento', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-voltech-muted mb-1 ml-1">Días Disponibles</label>
                          <input type="number" value={plat.diasDisponibles || ''} onChange={(e) => actualizarPlataforma(index, 'diasDisponibles', parseInt(e.target.value) || 0)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-voltech-muted mb-1 ml-1">Precio Mayor ($)</label>
                          <div className="relative">
                            <input type="number" step="0.01" value={plat.precioMayor || ''} onChange={(e) => actualizarPlataforma(index, 'precioMayor', parseFloat(e.target.value) || 0)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                            <button onClick={() => setMostrarPrecios(!mostrarPrecios)} className="absolute right-2 top-1/2 -translate-y-1/2 text-voltech-muted hover:text-voltech-cyan">
                              {mostrarPrecios ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-voltech-muted mb-1 ml-1">Precio Detal ($)</label>
                          <div className="relative">
                            <input type="number" step="0.01" value={plat.precioDetal || ''} onChange={(e) => actualizarPlataforma(index, 'precioDetal', parseFloat(e.target.value) || 0)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                            <button onClick={() => setMostrarPrecios(!mostrarPrecios)} className="absolute right-2 top-1/2 -translate-y-1/2 text-voltech-muted hover:text-voltech-cyan">
                              {mostrarPrecios ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      {index === formDataNueva.plataformas.length - 1 && (
                        <button onClick={agregarPlataformaAVenta} className="mt-4 px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2">
                          <Plus className="w-4 h-4" /> Agregar otra plataforma
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-voltech-muted">Total de Plataformas</p><p className="text-lg font-bold text-white">{formDataNueva.plataformas.length}</p></div>
                      <div><p className="text-xs text-voltech-muted">Total Venta</p><p className="text-2xl font-bold text-voltech-success">${formDataNueva.plataformas.reduce((sum, p) => sum + (p.precioDetal || 0), 0).toFixed(2)}</p></div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={guardarNuevaPlataforma} className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                      <Save className="w-5 h-5" /> {editingId ? 'Actualizar Venta' : 'Registrar Venta'}
                    </button>
                    {editingId && (
                      <button onClick={() => { resetForm('nueva'); setShowFormNueva(false); }} className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-error transition-all flex items-center gap-2">
                        <X className="w-4 h-4" /> Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-voltech-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Historial de Ventas</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-voltech rounded-lg pl-10 pr-4 py-2 text-sm w-64" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-voltech-dark border-b border-voltech-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Plataformas</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Método Pago</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Cartera</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Vence</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Estado</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.map((venta) => {
                    const diasRestantes = calcularDiasRestantes(venta.plataformas?.[0]?.fechaVencimiento);
                    return (
                      <tr key={venta.id} className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-voltech-muted">{venta.fecha}</td>
                        <td className="px-4 py-3"><p className="text-sm font-medium text-white">{venta.cliente}</p><p className="text-xs text-voltech-muted">{venta.telefono}</p></td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-white">{venta.plataformas?.[0]?.plataforma}</p>
                            {venta.plataformas && venta.plataformas.length > 1 && (
                              <button onClick={() => setExpandedVenta(expandedVenta === venta.id ? null : venta.id)} className="text-xs text-voltech-cyan hover:underline flex items-center gap-1 mt-1">
                                <ChevronDown className={`w-3 h-3 transition-transform ${expandedVenta === venta.id ? 'rotate-180' : ''}`} /> + {venta.plataformas.length - 1} más
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-voltech-muted capitalize">{venta.metodoPago?.replace('_', ' ') || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-voltech-muted">{venta.cartera || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-voltech-muted" />
                            <span className="text-sm text-white">{venta.plataformas?.[0]?.fechaVencimiento}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${diasRestantes <= 3 ? 'bg-voltech-error/20 text-voltech-error' : diasRestantes <= 7 ? 'bg-voltech-warning/20 text-voltech-warning' : 'bg-voltech-success/20 text-voltech-success'}`}>{diasRestantes} días</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${venta.estado === 'activa' ? 'bg-voltech-success/20 text-voltech-success' : venta.estado === 'vencida' ? 'bg-voltech-error/20 text-voltech-error' : 'bg-voltech-muted/20 text-voltech-muted'}`}>{venta.estado}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => { setRegaloData({ ventaId: venta.id, plataformaIndex: 0, dias: 0, tipo: 'regalo', nota: '' }); setShowRegaloModal(true); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-purple transition-colors" title="Días Regalo/Falla"><Gift className="w-4 h-4" /></button>
                            <button onClick={() => generarRecordatorio(venta)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-success transition-colors" title="Enviar recordatorio"><MessageCircle className="w-4 h-4" /></button>
                            <button onClick={() => generarEnviarCuenta(venta)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors" title="Enviar cuenta"><Mail className="w-4 h-4" /></button>
                            <button onClick={() => generarEnviarReemplazo(venta)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-purple transition-colors" title="Enviar reemplazo"><RefreshCw className="w-4 h-4" /></button>
                            <button onClick={() => editarVenta(venta)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors" title="Editar"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => renovarVenta(venta)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-purple transition-colors" title="Renovar"><RefreshCw className="w-4 h-4" /></button>
                            <button onClick={() => eliminarVenta(venta.id)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <AnimatePresence>
              {ventasFiltradas.map((venta) => {
                if (expandedVenta !== venta.id || !venta.plataformas || venta.plataformas.length <= 1) return null;
                return venta.plataformas.slice(1).map((plat, idx) => {
                  const diasRestantes = calcularDiasRestantes(plat.fechaVencimiento);
                  return (
                    <motion.tr key={`${venta.id}-plat-${idx}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-voltech-dark/30 border-b border-voltech-border/50">
                      <td className="px-4 py-3 text-sm text-voltech-muted">{venta.fecha}</td>
                      <td className="px-4 py-3"><p className="text-sm font-medium text-white">{venta.cliente}</p><p className="text-xs text-voltech-muted">{venta.telefono}</p></td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-voltech-purple"></div><p className="text-sm text-white">{plat.plataforma}</p></div></td>
                      <td className="px-4 py-3 text-sm text-voltech-muted capitalize">{venta.metodoPago?.replace('_', ' ') || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-voltech-muted">{venta.cartera || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-voltech-muted" />
                          <span className="text-sm text-white">{plat.fechaVencimiento}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${diasRestantes <= 3 ? 'bg-voltech-error/20 text-voltech-error' : diasRestantes <= 7 ? 'bg-voltech-warning/20 text-voltech-warning' : 'bg-voltech-success/20 text-voltech-success'}`}>{diasRestantes} días</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${venta.estado === 'activa' ? 'bg-voltech-success/20 text-voltech-success' : venta.estado === 'vencida' ? 'bg-voltech-error/20 text-voltech-error' : 'bg-voltech-muted/20 text-voltech-muted'}`}>{venta.estado}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setRegaloData({ ventaId: venta.id, plataformaIndex: idx + 1, dias: 0, tipo: 'regalo', nota: '' }); setShowRegaloModal(true); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-purple transition-colors" title="Días Regalo/Falla"><Gift className="w-4 h-4" /></button>
                          <button onClick={() => generarRecordatorio(venta)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-success transition-colors" title="Enviar recordatorio"><MessageCircle className="w-4 h-4" /></button>
                          <button onClick={() => generarEnviarCuenta(venta)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors" title="Enviar cuenta"><Mail className="w-4 h-4" /></button>
                          <button onClick={() => generarEnviarReemplazo(venta)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-purple transition-colors" title="Enviar reemplazo"><RefreshCw className="w-4 h-4" /></button>
                          <button onClick={() => editarVenta(venta)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors" title="Editar"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => renovarVenta(venta)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-purple transition-colors" title="Renovar"><RefreshCw className="w-4 h-4" /></button>
                          <button onClick={() => eliminarVenta(venta.id)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                });
              })}
            </AnimatePresence>
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
                    <button onClick={() => setShowFormCuenta(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted transition-colors"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1 ml-1">Plataforma *</label>
                      <select value={formDataCuenta.plataforma} onChange={(e) => setFormDataCuenta({ ...formDataCuenta, plataforma: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                        <option value="">-- Selecciona --</option>
                        {plataformas.map(p => (<option key={p} value={p}>{p}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1 ml-1">Cant Perfil</label>
                      <input type="number" min="1" max="4" value={formDataCuenta.cantidad} onChange={(e) => {
                        const cant = parseInt(e.target.value) || 1;
                        const nuevosPins = Array(cant).fill('').map((_, i) => formDataCuenta.pins[i] || '');
                        setFormDataCuenta({ ...formDataCuenta, cantidad: cant, pins: nuevosPins });
                      }} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1 ml-1">Correo *</label>
                      <input type="email" value={formDataCuenta.correo} onChange={(e) => setFormDataCuenta({ ...formDataCuenta, correo: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="cuenta@email.com" />
                    </div>
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1 ml-1">Contraseña *</label>
                      <input type="text" value={formDataCuenta.contraseña} onChange={(e) => setFormDataCuenta({ ...formDataCuenta, contraseña: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1 ml-1">Nombre del Perfil</label>
                      <input type="text" value={formDataCuenta.nombrePerfil} onChange={(e) => setFormDataCuenta({ ...formDataCuenta, nombrePerfil: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Ej: ANA BEATRIZ" />
                    </div>
                    
                    {formDataCuenta.pins.map((pin, index) => (
                      <div key={index}>
                        <label className="block text-xs text-voltech-muted mb-1 ml-1">PIN Perfil {index + 1}</label>
                        <input type="text" value={pin} onChange={(e) => actualizarPinCuenta(index, e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder={`PIN ${index + 1}`} />
                      </div>
                    ))}

                    <div>
                      <label className="block text-xs text-voltech-muted mb-1 ml-1">Vendedor *</label>
                      <select value={formDataCuenta.vendedor} onChange={(e) => setFormDataCuenta({ ...formDataCuenta, vendedor: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                        <option value="">-- Selecciona --</option>
                        {equipo.filter(m => m.activo).map(m => (<option key={m.id} value={m.nombre}>{m.nombre} ({m.rol})</option>))}
                      </select>
                    </div>
                  </div>
                  <button onClick={guardarCuenta} className="mt-6 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" /> Guardar Cuenta(s)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {showFormCuenta && (
            <div className="flex justify-end">
              <button onClick={() => setFormDataCuenta({ plataforma: '', correo: '', contraseña: '', nombrePerfil: '', pins: [''], cantidad: 1, vendedor: '' })} className="flex items-center gap-2 px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors">
                <Plus className="w-4 h-4" /> Agregar otra cuenta
              </button>
            </div>
          )}

          <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-voltech-border"><h3 className="text-lg font-bold text-white">Cuentas Disponibles</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-voltech-dark border-b border-voltech-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Plataforma</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Correo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Cant Perfil</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Perfil</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">PIN</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Estado</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cuentasFiltradas.map((cuenta) => (
                    <tr key={cuenta.id} className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-white">{cuenta.plataforma}</td>
                      <td className="px-4 py-3 text-sm text-voltech-muted">{cuenta.correo}</td>
                      <td className="px-4 py-3 text-sm text-voltech-muted">{cuenta.cantidad || cuenta.perfil || '-'}</td>
                      <td className="px-4 py-3 text-sm text-voltech-muted">{cuenta.nombrePerfil || '-'}</td>
                      <td className="px-4 py-3 text-sm text-voltech-muted">{cuenta.pin || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${cuenta.estado === 'libre' ? 'bg-voltech-success/20 text-voltech-success' : cuenta.estado === 'ocupada' ? 'bg-voltech-cyan/20 text-voltech-cyan' : cuenta.estado === 'reemplazada' ? 'bg-voltech-warning/20 text-voltech-warning' : 'bg-voltech-muted/20 text-voltech-muted'}`}>{cuenta.estado}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {cuenta.estado === 'reemplazada' && cuenta.cuentaReemplazadaPor && (
                            <button onClick={() => setExpandedCuenta(expandedCuenta === cuenta.id ? null : cuenta.id)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors" title="Ver cuenta nueva">
                              <ChevronDown className={`w-4 h-4 transition-transform ${expandedCuenta === cuenta.id ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                          <button onClick={() => { setReemplazoData({ cuentaId: cuenta.id, nuevaPlataforma: cuenta.plataforma, nuevoCorreo: '', nuevaContraseña: '', nuevosPins: [''], observacion: '' }); setShowReemplazoCuentaModal(true); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-purple transition-colors" title="Reemplazar"><RefreshCw className="w-4 h-4" /></button>
                          <button onClick={() => { setFormDataCuenta({ plataforma: cuenta.plataforma, correo: cuenta.correo, contraseña: cuenta.contraseña, nombrePerfil: cuenta.nombrePerfil || '', pins: cuenta.pins || [cuenta.pin || ''], cantidad: cuenta.cantidad || 1, vendedor: cuenta.vendedor || '' }); setShowFormCuenta(true); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors" title="Editar"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={async () => { 
                            if (supabase) await supabase.from('cuentas_streaming').delete().eq('id', cuenta.id);
                            const filtradas = cuentas.filter(c => c.id !== cuenta.id); 
                            setCuentas(filtradas); 
                            localStorage.setItem('voltech_cuentas_streaming', JSON.stringify(filtradas)); 
                            toast.success('Cuenta eliminada'); 
                          }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {cuentasFiltradas.map((cuenta) => {
                    if (expandedCuenta !== cuenta.id || !cuenta.cuentaReemplazadaPor) return null;
                    const cuentaNueva = cuentas.find(c => c.id === cuenta.cuentaReemplazadaPor);
                    if (!cuentaNueva) return null;
                    return (
                      <motion.tr key={`${cuenta.id}-nueva`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-voltech-success/10 border-b border-voltech-border/50">
                        <td className="px-4 py-3 text-sm text-white">{cuentaNueva.plataforma}</td>
                        <td className="px-4 py-3 text-sm text-voltech-muted">{cuentaNueva.correo}</td>
                        <td className="px-4 py-3 text-sm text-voltech-muted">{cuentaNueva.cantidad || cuentaNueva.perfil || '-'}</td>
                        <td className="px-4 py-3 text-sm text-voltech-muted">{cuentaNueva.nombrePerfil || '-'}</td>
                        <td className="px-4 py-3 text-sm text-voltech-muted">{cuentaNueva.pin || '-'}</td>
                        <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-voltech-success/20 text-voltech-success">Nueva</span></td>
                        <td className="px-4 py-3 text-xs text-voltech-muted">Reemplazó a la anterior</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB: INVENTARIO ================= */}
      {activeTab === 'inventario' && (
        <div className="space-y-6">
          <AnimatePresence>
            {showFormInventario && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Nueva Compra Streaming</h3>
                    <button onClick={() => setShowFormInventario(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted transition-colors"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Fecha</label><input type="date" value={formDataInventario.fecha} onChange={(e) => setFormDataInventario({ ...formDataInventario, fecha: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Fecha Vencimiento</label><input type="date" value={formDataInventario.fechaVencimiento} onChange={(e) => setFormDataInventario({ ...formDataInventario, fechaVencimiento: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Días Disponibles</label><input type="number" value={formDataInventario.diasDisponibles} onChange={(e) => setFormDataInventario({ ...formDataInventario, diasDisponibles: parseInt(e.target.value) })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Plataforma *</label><select value={formDataInventario.plataforma} onChange={(e) => setFormDataInventario({ ...formDataInventario, plataforma: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="">-- Selecciona --</option>{plataformas.map(p => (<option key={p} value={p}>{p}</option>))}</select></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Correo *</label><input type="email" value={formDataInventario.correo} onChange={(e) => setFormDataInventario({ ...formDataInventario, correo: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Contraseña</label><input type="text" value={formDataInventario.contraseña} onChange={(e) => setFormDataInventario({ ...formDataInventario, contraseña: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Nombre del Perfil</label><input type="text" value={formDataInventario.nombrePerfil} onChange={(e) => setFormDataInventario({ ...formDataInventario, nombrePerfil: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Ej: ANA BEATRIZ" /></div>
                    
                    {formDataInventario.pins.map((pin, index) => (
                      <div key={index}>
                        <label className="block text-xs text-voltech-muted mb-1 ml-1">PIN Perfil {index + 1}</label>
                        <input type="text" value={pin} onChange={(e) => actualizarPinInventario(index, e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder={`PIN ${index + 1}`} />
                      </div>
                    ))}

                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Cantidad de Perfiles</label><input type="number" min="1" max="4" value={formDataInventario.cantidad} onChange={(e) => { const cant = parseInt(e.target.value) || 1; const nuevosPins = Array(cant).fill('').map((_, i) => formDataInventario.pins[i] || ''); setFormDataInventario({ ...formDataInventario, cantidad: cant, pins: nuevosPins }); }} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Vendedor</label><select value={formDataInventario.vendedor} onChange={(e) => setFormDataInventario({ ...formDataInventario, vendedor: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="">-- Selecciona --</option>{equipo.filter(m => m.activo).map(m => (<option key={m.id} value={m.nombre}>{m.nombre} ({m.rol})</option>))}</select></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Precio Mayor ($)</label><input type="number" step="0.01" value={formDataInventario.precioMayor} onChange={(e) => setFormDataInventario({ ...formDataInventario, precioMayor: parseFloat(e.target.value) })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Precio Detal ($)</label><input type="number" step="0.01" value={formDataInventario.precioDetal} onChange={(e) => setFormDataInventario({ ...formDataInventario, precioDetal: parseFloat(e.target.value) })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Proveedor</label><input type="text" value={formDataInventario.proveedor} onChange={(e) => setFormDataInventario({ ...formDataInventario, proveedor: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Importadora XYZ" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Teléfono Proveedor</label><input type="tel" value={formDataInventario.telefonoProveedor} onChange={(e) => setFormDataInventario({ ...formDataInventario, telefonoProveedor: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="0412-9876543" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Método de Pago</label><select value={formDataInventario.metodoPago} onChange={(e) => setFormDataInventario({ ...formDataInventario, metodoPago: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="efectivo">Efectivo</option><option value="pago_movil">Pago Móvil</option><option value="transferencia">Transferencia</option><option value="binance">Binance</option></select></div>
                  </div>
                  <button onClick={guardarInventario} className="mt-6 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Agregar al Inventario</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {showFormInventario && (
            <div className="flex justify-end">
              <button onClick={() => resetForm('inventario')} className="flex items-center gap-2 px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors">
                <Plus className="w-4 h-4" /> Agregar otra cuenta
              </button>
            </div>
          )}

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
                      <tr key={item.id} className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-voltech-muted">{item.fecha}</td>
                        <td className="px-4 py-3 text-sm text-white">{item.plataforma}</td>
                        <td className="px-4 py-3 text-sm text-white">{item.fechaVencimiento}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${diasRestantes <= 3 ? 'bg-voltech-error/20 text-voltech-error' : diasRestantes <= 7 ? 'bg-voltech-warning/20 text-voltech-warning' : 'bg-voltech-success/20 text-voltech-success'}`}>{diasRestantes} días</span></td>
                        <td className="px-4 py-3 text-sm text-voltech-success">${item.precioDetal}</td>
                        <td className="px-4 py-3 text-sm text-voltech-muted">{item.proveedor}{item.telefonoProveedor && <p className="text-xs text-voltech-muted">{item.telefonoProveedor}</p>}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => { setReemplazoData({ cuentaId: item.id, nuevaPlataforma: item.plataforma, nuevoCorreo: item.correo, nuevaContraseña: item.contraseña, nuevosPins: item.pins, observacion: '' }); setShowReemplazoCuentaModal(true); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-purple transition-colors" title="Editar/Reemplazar"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={async () => { 
                              if (supabase) await supabase.from('inventario_streaming').delete().eq('id', item.id);
                              const inv = inventario.filter(i => i.id !== item.id); 
                              setInventario(inv); 
                              localStorage.setItem('voltech_inventario_streaming', JSON.stringify(inv)); 
                              toast.success('Item eliminado del inventario'); 
                            }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors"><Trash2 className="w-4 h-4" /></button>
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
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-voltech-purple/20"><Gift className="w-5 h-5 text-voltech-purple" /></div>
                  <div><h2 className="text-lg font-bold text-white">Días Regalo/Falla</h2><p className="text-xs text-voltech-muted">Ajustar días de la plataforma</p></div>
                </div>
                <button onClick={() => setShowRegaloModal(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs text-voltech-muted mb-2">Tipo de ajuste</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setRegaloData({ ...regaloData, tipo: 'regalo' })} className={`p-3 rounded-lg border text-sm transition-all flex items-center justify-center gap-2 ${regaloData.tipo === 'regalo' ? 'bg-voltech-success/20 border-voltech-success text-voltech-success' : 'bg-voltech-dark border-voltech-border text-voltech-muted hover:border-voltech-success'}`}><Gift className="w-4 h-4" /> Regalo (+días)</button>
                    <button onClick={() => setRegaloData({ ...regaloData, tipo: 'falla' })} className={`p-3 rounded-lg border text-sm transition-all flex items-center justify-center gap-2 ${regaloData.tipo === 'falla' ? 'bg-voltech-error/20 border-voltech-error text-voltech-error' : 'bg-voltech-dark border-voltech-border text-voltech-muted hover:border-voltech-error'}`}><AlertCircle className="w-4 h-4" /> Falla (-días)</button>
                  </div>
                </div>
                <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Cantidad de días *</label><input type="number" min="1" value={regaloData.dias} onChange={(e) => setRegaloData({ ...regaloData, dias: parseInt(e.target.value) || 0 })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Ej: 5" /></div>
                <div><label className="block text-xs text-voltech-muted mb-1 ml-1"><StickyNote className="w-3 h-3 inline mr-1" /> Nota explicativa *</label><textarea value={regaloData.nota} onChange={(e) => setRegaloData({ ...regaloData, nota: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm h-20 resize-none" placeholder="Explica el motivo..." /></div>
                <div className="flex gap-3 pt-4">
                  <button onClick={aplicarRegaloFalla} disabled={!regaloData.dias || !regaloData.nota.trim()} className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Save className="w-4 h-4" /> Aplicar</button>
                  <button onClick={() => setShowRegaloModal(false)} className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-error transition-all flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRecordatorioModal && selectedVenta && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center pt-[15vh] p-4" onClick={() => setShowRecordatorioModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-voltech-border p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-voltech-success/20"><MessageCircle className="w-5 h-5 text-voltech-success" /></div>
                  <div><h2 className="text-lg font-bold text-white">Enviar Recordatorio</h2><p className="text-xs text-voltech-muted">{selectedVenta.cliente} - {selectedVenta.plataformas?.[0]?.plataforma}</p></div>
                </div>
                <button onClick={() => setShowRecordatorioModal(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <textarea value={recordatorioText} onChange={(e) => setRecordatorioText(e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm h-64 resize-none font-mono" />
                <div className="flex gap-3 mt-4">
                  <button onClick={copiarRecordatorio} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2"><Copy className="w-4 h-4" /> Copiar</button>
                  <button onClick={enviarRecordatorioWhatsApp} className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Enviar por WhatsApp</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEnviarCuentaModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center pt-[15vh] p-4" onClick={() => setShowEnviarCuentaModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-voltech-border p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-voltech-cyan/20"><Mail className="w-5 h-5 text-voltech-cyan" /></div>
                  <div><h2 className="text-lg font-bold text-white">Enviar Cuenta</h2><p className="text-xs text-voltech-muted">Credenciales de acceso</p></div>
                </div>
                <button onClick={() => setShowEnviarCuentaModal(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <textarea value={cuentaText} onChange={(e) => setCuentaText(e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm h-64 resize-none font-mono" />
                <div className="flex gap-3 mt-4">
                  <button onClick={copiarCuenta} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2"><Copy className="w-4 h-4" /> Copiar</button>
                  <button onClick={enviarCuentaWhatsApp} className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Enviar por WhatsApp</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReemplazoModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center pt-[15vh] p-4" onClick={() => setShowReemplazoModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-voltech-border p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-voltech-purple/20"><RefreshCw className="w-5 h-5 text-voltech-purple" /></div>
                  <div><h2 className="text-lg font-bold text-white">Enviar Reemplazo</h2><p className="text-xs text-voltech-muted">Nuevas credenciales</p></div>
                </div>
                <button onClick={() => setShowReemplazoModal(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <textarea value={reemplazoText} onChange={(e) => setReemplazoText(e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm h-64 resize-none font-mono" />
                <div className="flex gap-3 mt-4">
                  <button onClick={copiarReemplazo} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2"><Copy className="w-4 h-4" /> Copiar</button>
                  <button onClick={enviarReemplazoWhatsApp} className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Enviar por WhatsApp</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReemplazoCuentaModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center pt-[15vh] p-4" onClick={() => setShowReemplazoCuentaModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-voltech-border p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-voltech-purple/20"><RefreshCw className="w-5 h-5 text-voltech-purple" /></div>
                  <div><h2 className="text-lg font-bold text-white">Reemplazar Cuenta</h2><p className="text-xs text-voltech-muted">Ingresa los datos de la nueva cuenta</p></div>
                </div>
                <button onClick={() => setShowReemplazoCuentaModal(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Plataforma</label><input type="text" value={reemplazoData.nuevaPlataforma} onChange={(e) => setReemplazoData({ ...reemplazoData, nuevaPlataforma: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Correo *</label><input type="email" value={reemplazoData.nuevoCorreo} onChange={(e) => setReemplazoData({ ...reemplazoData, nuevoCorreo: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Contraseña *</label><input type="text" value={reemplazoData.nuevaContraseña} onChange={(e) => setReemplazoData({ ...reemplazoData, nuevaContraseña: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">PIN</label><input type="text" value={reemplazoData.nuevosPins[0] || ''} onChange={(e) => setReemplazoData({ ...reemplazoData, nuevosPins: [e.target.value] })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                </div>
                <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Observación</label><textarea value={reemplazoData.observacion} onChange={(e) => setReemplazoData({ ...reemplazoData, observacion: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm h-20 resize-none" placeholder="Notas adicionales..." /></div>
                <div className="flex gap-3 pt-4">
                  <button onClick={reemplazarCuenta} className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Guardar Reemplazo</button>
                  <button onClick={() => setShowReemplazoCuentaModal(false)} className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-error transition-all flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAssignModal && selectedVenta && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center pt-[15vh] p-4" onClick={() => { setShowAssignModal(false); setSelectedVenta(null); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-voltech-border p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-voltech-cyan/20"><LinkIcon className="w-5 h-5 text-voltech-cyan" /></div>
                  <div><h2 className="text-lg font-bold text-white">Asignar Cuenta</h2><p className="text-xs text-voltech-muted">{selectedVenta.cliente} - {selectedVenta.plataformas?.[0]?.plataforma}</p></div>
                </div>
                <button onClick={() => { setShowAssignModal(false); setSelectedVenta(null); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <div className="mb-4 p-3 bg-voltech-dark/50 border border-voltech-border rounded-lg">
                  <p className="text-xs text-voltech-muted mb-1">Cuentas disponibles para esta plataforma:</p>
                  <p className="text-sm text-white font-medium">{cuentasLibres.filter(c => c.plataforma === selectedVenta.plataformas?.[0]?.plataforma).length} cuenta(s) libre(s)</p>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {cuentasLibres.filter(c => c.plataforma === selectedVenta.plataformas?.[0]?.plataforma).length === 0 ? (
                    <div className="text-center py-8"><Database className="w-12 h-12 mx-auto mb-3 opacity-50 text-voltech-muted" /><p className="text-sm text-voltech-muted">No hay cuentas disponibles</p></div>
                  ) : (
                    cuentasLibres.filter(c => c.plataforma === selectedVenta.plataformas?.[0]?.plataforma).map(cuenta => (
                      <button key={cuenta.id} onClick={() => asignarCuentaAVenta(selectedVenta, cuenta)} className="w-full p-4 bg-voltech-dark/50 border border-voltech-border rounded-lg text-left hover:border-voltech-cyan hover:bg-voltech-cyan/5 transition-all group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-voltech-cyan/20 flex items-center justify-center"><Mail className="w-5 h-5 text-voltech-cyan" /></div>
                            <div><p className="text-sm font-medium text-white group-hover:text-voltech-cyan transition-colors">{cuenta.correo}</p><p className="text-xs text-voltech-muted">PIN: {cuenta.pin || 'N/A'} • Perfil: {cuenta.perfil || 'N/A'}</p></div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-voltech-cyan opacity-0 group-hover:opacity-100 transition-opacity"><span>Asignar</span><ChevronDown className="w-4 h-4 rotate-[-90deg]" /></div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="flex gap-3 mt-6 pt-4 border-t border-voltech-border">
                  <button onClick={() => { setShowAssignModal(false); setSelectedVenta(null); }} className="flex-1 px-4 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-error transition-all flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
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
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-voltech-purple/20"><Tag className="w-5 h-5 text-voltech-purple" /></div>
                  <div><h2 className="text-lg font-bold text-white">Gestionar Plataformas</h2><p className="text-xs text-voltech-muted">Agrega o elimina plataformas disponibles</p></div>
                </div>
                <button onClick={() => setShowPlataformasModal(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <div className="flex gap-2 mb-6">
                  <input type="text" value={nuevaPlataforma} onChange={(e) => setNuevaPlataforma(e.target.value)} className="input-voltech flex-1 rounded-lg px-4 py-2 text-sm" placeholder="Nombre de la plataforma" onKeyPress={(e) => e.key === 'Enter' && agregarPlataforma()} />
                  <button onClick={agregarPlataforma} className="px-4 py-2 bg-voltech-purple/20 text-voltech-purple rounded-lg hover:bg-voltech-purple/30 transition-colors flex items-center gap-2"><Plus className="w-4 h-4" /> Agregar</button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {plataformas.map((plataforma, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-voltech-dark/50 border border-voltech-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-voltech-purple/20 flex items-center justify-center"><MonitorPlay className="w-4 h-4 text-voltech-purple" /></div>
                        <span className="text-sm text-white">{plataforma}</span>
                      </div>
                      <button onClick={() => eliminarPlataforma(plataforma)} className="p-2 text-voltech-error hover:bg-voltech-error/10 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-voltech-border">
                  <button onClick={() => setShowPlataformasModal(false)} className="w-full px-4 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-cyan transition-all">Cerrar</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}