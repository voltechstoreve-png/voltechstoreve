'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase'; // ✅ NUEVO: Conexión a Supabase
import { 
  MessageSquare, Send, Users, Gift, Copy, Plus, Search, Trash2, 
  Edit3, Save, X, CheckCircle, ShoppingCart, Tag, FileText, 
  ChevronDown, ChevronUp, Share2, Ticket, Percent, Calendar,
  TrendingUp, DollarSign, Package, Megaphone, Store, Image as ImageIcon,
  Eye, Monitor, Smartphone, Tablet, Clock, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState('plantillas');
  
  const [plantillas, setPlantillas] = useState([]);
  const [showPlantillaForm, setShowPlantillaForm] = useState(false);
  const [plantillaEditando, setPlantillaEditando] = useState(null);
  const [formDataPlantilla, setFormDataPlantilla] = useState({
    nombre: '', tipo: 'whatsapp', categoria: 'mensaje', contenido: '',
  });

  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [precioPromocion, setPrecioPromocion] = useState('');
  const [clientesSeleccionados, setClientesSeleccionados] = useState([]);
  const [filtroEtiqueta, setFiltroEtiqueta] = useState('');
  const [busquedaClientes, setBusquedaClientes] = useState('');
  const [plantillaWhatsappSeleccionada, setPlantillaWhatsappSeleccionada] = useState('');
  const [mensajePersonalizado, setMensajePersonalizado] = useState('');

  const [productoMarketplace, setProductoMarketplace] = useState(null);
  const [precioPromocionMarketplace, setPrecioPromocionMarketplace] = useState('');
  const [plantillaMarketplaceSeleccionada, setPlantillaMarketplaceSeleccionada] = useState('');
  const [textoMarketplace, setTextoMarketplace] = useState('');

  // ✅ ESTADOS PARA CUPONES
  const [cupones, setCupones] = useState([]);
  const [showCuponForm, setShowCuponForm] = useState(false);
  const [cuponEditando, setCuponEditando] = useState(null);
  const [busquedaProductoCupon, setBusquedaProductoCupon] = useState('');
  
  const [formDataCupon, setFormDataCupon] = useState({
    titulo: '',
    descripcion: '',
    codigo: '',
    tipo_descuento: 'porcentaje',
    valor: 20,
    aplica_a: 'todos',
    productos_especificos: [],
    excluir_ofertas: false,
    monto_minimo: 0,
    fecha_inicio: '',
    fecha_vencimiento: '',
    limite_usos: 'ilimitado',
    max_usos: 100,
    uso_por_cliente: 'una_vez',
    estado: 'activo'
  });

  // ✅ ESTADOS PARA PUBLICIDAD/BANNERS
  const [publicidad, setPublicidad] = useState([]);
  const [showPublicidadForm, setShowPublicidadForm] = useState(false);
  const [publicidadEditando, setPublicidadEditando] = useState(null);
  const [imagenPreview, setImagenPreview] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formDataPublicidad, setFormDataPublicidad] = useState({
    titulo: '',
    url_destino: '',
    url_imagen: '',
    lado: 'izquierdo',
    posicion: 'sidebar',
    fecha_inicio: '',
    hora_inicio: '00:00',
    fecha_fin: '',
    hora_fin: '23:59',
    prioridad: 'normal',
    mostrar_en: {
      inicio: true,
      catalogo: true,
      streaming: false,
      ofertas: false
    },
    dispositivos: {
      desktop: true,
      movil: true,
      tablet: true
    },
    rotacion: 5,
    estado: 'activo'
  });

  // ✅ ACTUALIZADO: Carga desde Supabase con fallback a localStorage
  useEffect(() => {
    const cargarDatos = async () => {
      let plts = [], cpons = [], pubs = [], prods = [], clts = [], etqs = [];

      if (supabase) {
        const [{ data: pData }, { data: cData }, { data: puData }, { data: prData }, { data: clData }, { data: etData }] = await Promise.all([
          supabase.from('plantillas').select('*'),
          supabase.from('cupones').select('*'),
          supabase.from('publicidad').select('*'),
          supabase.from('productos').select('*'),
          supabase.from('clientes').select('*'),
          supabase.from('settings').select('valor').eq('clave', 'etiquetas').single()
        ]);
        if (pData) plts = pData;
        if (cData) cpons = cData;
        if (puData) pubs = puData;
        if (prData) prods = prData;
        if (clData) clts = clData;
        if (etData?.valor) etqs = etData.valor;
      }

      if (plts.length === 0) { const d = localStorage.getItem('voltech_plantillas'); if (d) plts = JSON.parse(d); }
      if (cpons.length === 0) { const d = localStorage.getItem('voltech_cupones'); if (d) cpons = JSON.parse(d); }
      if (pubs.length === 0) { const d = localStorage.getItem('voltech_publicidad'); if (d) pubs = JSON.parse(d); }
      if (prods.length === 0) { const d = localStorage.getItem('voltech_productos'); if (d) prods = JSON.parse(d); }
      if (clts.length === 0) { const d = localStorage.getItem('voltech_clientes'); if (d) clts = JSON.parse(d); }
      if (etqs.length === 0) { const d = localStorage.getItem('voltech_etiquetas'); if (d) etqs = JSON.parse(d); }

      setPlantillas(plts); setCupones(cpons); setPublicidad(pubs);
      setProductos(prods); setClientes(clts); setEtiquetas(etqs);
    };
    cargarDatos();
  }, []);

  // ✅ MANEJAR SUBIDA DE IMAGEN
  const handleImageUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no debe pesar más de 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setImagenPreview(base64);
      setFormDataPublicidad({...formDataPublicidad, url_imagen: base64});
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleImageUpload(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleImageUpload(file);
  };

  // ✅ ACTUALIZADO: Guardar Publicidad en Supabase y localStorage
  const guardarPublicidad = async () => {
    if (!formDataPublicidad.titulo || !formDataPublicidad.url_imagen || !formDataPublicidad.fecha_inicio || !formDataPublicidad.fecha_fin) {
      toast.error('Título, imagen y fechas son obligatorios');
      return;
    }

    const nuevaPublicidad = {
      id: publicidadEditando ? publicidadEditando.id : `pub-${Date.now()}`,
      ...formDataPublicidad,
      fecha_creacion: publicidadEditando?.fecha_creacion || new Date().toISOString(),
      impresiones: publicidadEditando?.impresiones || 0,
      clics: publicidadEditando?.clics || 0
    };

    if (supabase) {
      const { error } = await supabase.from('publicidad').upsert(nuevaPublicidad, { onConflict: 'id' });
      if (error) { toast.error('Error al guardar en la nube'); return; }
    }

    if (publicidadEditando) {
      const actualizadas = publicidad.map(p => p.id === publicidadEditando.id ? nuevaPublicidad : p);
      localStorage.setItem('voltech_publicidad', JSON.stringify(actualizadas));
      setPublicidad(actualizadas);
      toast.success('Publicidad actualizada');
    } else {
      const actualizadas = [...publicidad, nuevaPublicidad];
      localStorage.setItem('voltech_publicidad', JSON.stringify(actualizadas));
      setPublicidad(actualizadas);
      toast.success('Publicidad creada exitosamente');
    }
    resetPublicidadForm();
  };

  const editarPublicidad = (pub) => {
    setPublicidadEditando(pub);
    setFormDataPublicidad({
      titulo: pub.titulo, url_destino: pub.url_destino || '', url_imagen: pub.url_imagen,
      lado: pub.lado || 'izquierdo', posicion: pub.posicion || 'sidebar', fecha_inicio: pub.fecha_inicio,
      hora_inicio: pub.hora_inicio || '00:00', fecha_fin: pub.fecha_fin, hora_fin: pub.hora_fin || '23:59',
      prioridad: pub.prioridad || 'normal', mostrar_en: pub.mostrar_en || { inicio: true, catalogo: true, streaming: false, ofertas: false },
      dispositivos: pub.dispositivos || { desktop: true, movil: true, tablet: true }, rotacion: pub.rotacion || 5, estado: pub.estado || 'activo'
    });
    setImagenPreview(pub.url_imagen);
    setShowPublicidadForm(true);
  };

  // ✅ ACTUALIZADO: Eliminar Publicidad de Supabase y localStorage
  const eliminarPublicidad = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta publicidad?')) return;
    if (supabase) await supabase.from('publicidad').delete().eq('id', id);
    const actualizadas = publicidad.filter(p => p.id !== id);
    localStorage.setItem('voltech_publicidad', JSON.stringify(actualizadas));
    setPublicidad(actualizadas);
    toast.success('Publicidad eliminada');
  };

  // ✅ ACTUALIZADO: Toggle Estado Publicidad en Supabase y localStorage
  const toggleEstadoPublicidad = async (pub) => {
    const nuevoEstado = pub.estado === 'activo' ? 'inactivo' : 'activo';
    if (supabase) await supabase.from('publicidad').update({ estado: nuevoEstado }).eq('id', pub.id);
    const actualizadas = publicidad.map(p => p.id === pub.id ? { ...p, estado: nuevoEstado } : p);
    localStorage.setItem('voltech_publicidad', JSON.stringify(actualizadas));
    setPublicidad(actualizadas);
    toast.success(nuevoEstado === 'activo' ? 'Publicidad activada' : 'Publicidad desactivada');
  };

  const resetPublicidadForm = () => {
    setFormDataPublicidad({
      titulo: '', url_destino: '', url_imagen: '', lado: 'izquierdo', posicion: 'sidebar',
      fecha_inicio: '', hora_inicio: '00:00', fecha_fin: '', hora_fin: '23:59', prioridad: 'normal',
      mostrar_en: { inicio: true, catalogo: true, streaming: false, ofertas: false },
      dispositivos: { desktop: true, movil: true, tablet: true }, rotacion: 5, estado: 'activo'
    });
    setImagenPreview(''); setShowPublicidadForm(false); setPublicidadEditando(null);
  };

  const guardarCupones = async (nuevosCupones) => {
    if (supabase) {
      // Guardamos solo los cupones modificados o todos (upsert maneja la duplicación por ID)
      await supabase.from('cupones').upsert(nuevosCupones, { onConflict: 'id' });
    }
    localStorage.setItem('voltech_cupones', JSON.stringify(nuevosCupones));
    setCupones(nuevosCupones);
  };

  const generarCodigo = (titulo) => {
    const codigoBase = titulo.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 12);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${codigoBase}-${random}`;
  };

  // ✅ ACTUALIZADO: Guardar Cupón en Supabase y localStorage
  const guardarCupon = async () => {
    if (!formDataCupon.titulo || !formDataCupon.descripcion || !formDataCupon.fecha_inicio || !formDataCupon.fecha_vencimiento) {
      toast.error('Completa los campos obligatorios (Título, Descripción, Fechas)');
      return;
    }

    const codigo = formDataCupon.codigo || generarCodigo(formDataCupon.titulo);
    const nuevoCupon = {
      id: cuponEditando ? cuponEditando.id : `cupon-${Date.now()}`,
      ...formDataCupon,
      codigo,
      usos: cuponEditando?.usos || 0,
      descuento_total: cuponEditando?.descuento_total || 0,
      fecha_creacion: cuponEditando?.fecha_creacion || new Date().toISOString()
    };

    await guardarCupones(cuponEditando ? cupones.map(c => c.id === cuponEditando.id ? nuevoCupon : c) : [...cupones, nuevoCupon]);
    toast.success(cuponEditando ? 'Cupón actualizado' : `Cupón creado: ${codigo}`);

    setShowCuponForm(false); setCuponEditando(null); setBusquedaProductoCupon('');
    setFormDataCupon({
      titulo: '', descripcion: '', codigo: '', tipo_descuento: 'porcentaje', valor: 20, aplica_a: 'todos',
      productos_especificos: [], excluir_ofertas: false, monto_minimo: 0, fecha_inicio: '', fecha_vencimiento: '',
      limite_usos: 'ilimitado', max_usos: 100, uso_por_cliente: 'una_vez', estado: 'activo'
    });
  };

  const editarCupon = (cupon) => {
    setCuponEditando(cupon);
    setFormDataCupon({
      titulo: cupon.titulo, descripcion: cupon.descripcion, codigo: cupon.codigo, tipo_descuento: cupon.tipo_descuento,
      valor: cupon.valor, aplica_a: cupon.aplica_a, productos_especificos: cupon.productos_especificos || [],
      excluir_ofertas: cupon.excluir_ofertas || false, monto_minimo: cupon.monto_minimo || 0, fecha_inicio: cupon.fecha_inicio,
      fecha_vencimiento: cupon.fecha_vencimiento, limite_usos: cupon.limite_usos, max_usos: cupon.max_usos || 100,
      uso_por_cliente: cupon.uso_por_cliente, estado: cupon.estado
    });
    setShowCuponForm(true);
  };

  // ✅ ACTUALIZADO: Eliminar Cupón de Supabase y localStorage
  const eliminarCupon = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cupón?')) return;
    if (supabase) await supabase.from('cupones').delete().eq('id', id);
    const actualizados = cupones.filter(c => c.id !== id);
    localStorage.setItem('voltech_cupones', JSON.stringify(actualizados));
    setCupones(actualizados);
    toast.success('Cupón eliminado');
  };

  // ✅ ACTUALIZADO: Toggle Estado Cupón en Supabase y localStorage
  const toggleEstadoCupon = async (cupon) => {
    const nuevoEstado = cupon.estado === 'activo' ? 'inactivo' : 'activo';
    if (supabase) await supabase.from('cupones').update({ estado: nuevoEstado }).eq('id', cupon.id);
    const actualizados = cupones.map(c => c.id === cupon.id ? { ...c, estado: nuevoEstado } : c);
    localStorage.setItem('voltech_cupones', JSON.stringify(actualizados));
    setCupones(actualizados);
    toast.success(nuevoEstado === 'activo' ? 'Cupón activado' : 'Cupón desactivado');
  };

  const copiarCodigo = (codigo) => { navigator.clipboard.writeText(codigo); toast.success('Código copiado'); };

  const toggleProductoCupon = (productoId) => {
    const actuales = formDataCupon.productos_especificos;
    if (actuales.includes(productoId)) {
      setFormDataCupon({ ...formDataCupon, productos_especificos: actuales.filter(id => id !== productoId) });
    } else {
      setFormDataCupon({ ...formDataCupon, productos_especificos: [...actuales, productoId] });
    }
  };

  const estadisticasCupones = {
    total: cupones.length,
    activos: cupones.filter(c => c.estado === 'activo').length,
    usados: cupones.reduce((acc, c) => acc + (c.usos || 0), 0),
    descuentoTotal: cupones.reduce((acc, c) => acc + (c.descuento_total || 0), 0)
  };

  // --- LÓGICA EXISTENTE (WHATSAPP & MARKETPLACE) ---
  useEffect(() => {
    if (productoSeleccionado && plantillaWhatsappSeleccionada && clientesSeleccionados.length > 0) {
      const plantilla = plantillas.find(p => p.id === parseInt(plantillaWhatsappSeleccionada));
      if (plantilla) {
        const primerCliente = clientes.find(c => c.id === clientesSeleccionados[0]);
        const nombre = productoSeleccionado.nombre || productoSeleccionado.plataforma || 'Producto';
        const precioFinal = precioPromocion ? parseFloat(precioPromocion).toFixed(2) : (productoSeleccionado.precioDetal || 0).toFixed(2);
        const descripcion = productoSeleccionado.descripcion || '';
        const imagen = productoSeleccionado.imagen ? `\n📸 ${productoSeleccionado.imagen}` : '';
        setMensajePersonalizado(`*${plantilla.nombre}*\n\n👤 ${primerCliente.nombre}\n\n📦 *${nombre}*\n💰 Precio: $${precioFinal}\n ${descripcion}${imagen}\n\n${plantilla.contenido}`);
      }
    } else { setMensajePersonalizado(''); }
  }, [productoSeleccionado, plantillaWhatsappSeleccionada, clientesSeleccionados, precioPromocion, plantillas, clientes]);

  useEffect(() => {
    if (productoMarketplace && plantillaMarketplaceSeleccionada) {
      const plantilla = plantillas.find(p => p.id === parseInt(plantillaMarketplaceSeleccionada));
      if (plantilla) {
        const nombre = productoMarketplace.nombre || productoMarketplace.plataforma || 'Producto';
        const precioFinal = precioPromocionMarketplace ? parseFloat(precioPromocionMarketplace).toFixed(2) : (productoMarketplace.precioDetal || 0).toFixed(2);
        const descripcion = productoMarketplace.descripcion || '';
        const imagen = productoMarketplace.imagen ? `\n📸 ${productoMarketplace.imagen}` : '';
        setTextoMarketplace(`*${plantilla.nombre}*\n\n📦 *${nombre}*\n Precio: $${precioFinal}\n ${descripcion}${imagen}\n\n${plantilla.contenido}\n\n🏢 Somos Tienda Online en Caracas\n🛵 Delivery Gratis / Envíos a nivel nacional\n📲 ¡Escríbenos al directo para coordinar tu pedido!`);
      }
    } else { setTextoMarketplace(''); }
  }, [productoMarketplace, plantillaMarketplaceSeleccionada, precioPromocionMarketplace, plantillas]);

  // ✅ ACTUALIZADO: Guardar Plantilla en Supabase y localStorage
  const guardarPlantilla = async () => {
    if (!formDataPlantilla.nombre || !formDataPlantilla.contenido) { toast.error('Nombre y contenido son obligatorios'); return; }
    const nuevaPlantilla = { id: Date.now().toString(), ...formDataPlantilla, fechaCreacion: new Date().toISOString() };
    
    if (supabase) {
      await supabase.from('plantillas').upsert(nuevaPlantilla, { onConflict: 'id' });
    }
    
    const actualizadas = plantillaEditando ? plantillas.map(p => p.id === plantillaEditando.id ? nuevaPlantilla : p) : [...plantillas, nuevaPlantilla];
    localStorage.setItem('voltech_plantillas', JSON.stringify(actualizadas));
    setPlantillas(actualizadas);
    toast.success(plantillaEditando ? 'Plantilla actualizada' : 'Plantilla guardada');
    resetPlantillaForm();
  };

  const resetPlantillaForm = () => {
    setFormDataPlantilla({ nombre: '', tipo: 'whatsapp', categoria: 'mensaje', contenido: '' });
    setShowPlantillaForm(false); setPlantillaEditando(null);
  };

  const editarPlantilla = (plantilla) => {
    setFormDataPlantilla({ nombre: plantilla.nombre, tipo: plantilla.tipo, categoria: plantilla.categoria, contenido: plantilla.contenido });
    setPlantillaEditando(plantilla); setShowPlantillaForm(true);
  };

  // ✅ ACTUALIZADO: Eliminar Plantilla de Supabase y localStorage
  const eliminarPlantilla = async (id) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    if (supabase) await supabase.from('plantillas').delete().eq('id', id);
    const actualizadas = plantillas.filter(p => p.id !== id);
    localStorage.setItem('voltech_plantillas', JSON.stringify(actualizadas));
    setPlantillas(actualizadas);
    toast.success('Plantilla eliminada');
  };

  const copiarTexto = (texto) => { navigator.clipboard.writeText(texto); toast.success('Texto copiado'); };

  const filtrarClientes = () => {
    let resultado = clientes;
    if (filtroEtiqueta) resultado = resultado.filter(c => c.etiquetas?.includes(filtroEtiqueta));
    if (busquedaClientes) {
      const busqueda = busquedaClientes.toLowerCase();
      resultado = resultado.filter(c => c.nombre.toLowerCase().includes(busqueda) || c.telefono.includes(busqueda));
    }
    return resultado;
  };

  const toggleClienteSeleccion = (clienteId) => {
    if (clientesSeleccionados.includes(clienteId)) setClientesSeleccionados(clientesSeleccionados.filter(id => id !== clienteId));
    else setClientesSeleccionados([...clientesSeleccionados, clienteId]);
  };

  const seleccionarTodosClientes = () => {
    const filtrados = filtrarClientes();
    setClientesSeleccionados(clientesSeleccionados.length === filtrados.length ? [] : filtrados.map(c => c.id));
  };

  const enviarWhatsApp = () => {
    if (clientesSeleccionados.length === 0) { toast.error('Selecciona al menos un cliente'); return; }
    if (!mensajePersonalizado) { toast.error('Escribe o genera un mensaje'); return; }
    clientesSeleccionados.forEach(clienteId => {
      const cliente = clientes.find(c => c.id === clienteId);
      const telefono = cliente.telefono.replace(/\D/g, '');
      window.open(`https://wa.me/58${telefono}?text=${encodeURIComponent(mensajePersonalizado)}`, '_blank');
    });
    toast.success(`Abriendo WhatsApp para ${clientesSeleccionados.length} cliente(s)`);
  };

  const estadisticas = { totalPlantillas: plantillas.length };
  const plantillasWhatsapp = plantillas.filter(p => p.tipo === 'whatsapp');
  const plantillasMarketplace = plantillas.filter(p => p.tipo === 'marketplace');
  const etiquetasOrdenadas = [...etiquetas].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const mostrarMensajeWhatsApp = productoSeleccionado && plantillaWhatsappSeleccionada && clientesSeleccionados.length > 0;
  const mostrarTextoMarketplace = productoMarketplace && plantillaMarketplaceSeleccionada && textoMarketplace !== '';

  const productosParaCupon = productos.filter(p => 
    (p.producto || '').toLowerCase().includes(busquedaProductoCupon.toLowerCase()) ||
    (p.marca || '').toLowerCase().includes(busquedaProductoCupon.toLowerCase())
  );

  const estadisticasPublicidad = {
    total: publicidad.length,
    activas: publicidad.filter(p => p.estado === 'activo').length,
    impresionesTotales: publicidad.reduce((acc, p) => acc + (p.impresiones || 0), 0),
    clicsTotales: publicidad.reduce((acc, p) => acc + (p.clics || 0), 0)
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
          <h1 className="text-2xl font-bold text-white">Panel de Marketing</h1>
          <p className="text-sm text-voltech-muted mt-1">Gestiona tus campañas, mensajes y cupones</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-cyan/20"><MessageSquare className="w-5 h-5 text-voltech-cyan" /></div>
            <div><p className="text-xs text-voltech-muted">Plantillas</p><p className="text-xl font-bold text-white">{estadisticas.totalPlantillas}</p></div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-purple/20"><Ticket className="w-5 h-5 text-voltech-purple" /></div>
            <div><p className="text-xs text-voltech-muted">Cupones Activos</p><p className="text-xl font-bold text-white">{estadisticasCupones.activos}</p></div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-success/20"><Megaphone className="w-5 h-5 text-voltech-success" /></div>
            <div><p className="text-xs text-voltech-muted">Publicidad Activa</p><p className="text-xl font-bold text-white">{estadisticasPublicidad.activas}</p></div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-warning/20"><DollarSign className="w-5 h-5 text-voltech-warning" /></div>
            <div><p className="text-xs text-voltech-muted">Descuento Total</p><p className="text-xl font-bold text-white">${estadisticasCupones.descuentoTotal.toFixed(2)}</p></div>
          </div>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div className="border-b border-voltech-border">
        <div className="flex gap-6 overflow-x-auto pb-1">
          {[
            { id: 'plantillas', icon: MessageSquare, label: 'Plantillas' },
            { id: 'whatsapp', icon: Send, label: 'WhatsApp' },
            { id: 'marketplace', icon: FileText, label: 'Marketplace' },
            { id: 'cupones', icon: Ticket, label: 'Cupones', badge: estadisticasCupones.activos },
            { id: 'publicidad', icon: Megaphone, label: 'Publicidad' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id ? 'text-voltech-cyan border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
              {tab.badge > 0 && (
                <span className="bg-voltech-cyan text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}
      <div>
        {/* PESTAÑA 1: PLANTILLAS */}
        {activeTab === 'plantillas' && (
          <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-voltech-cyan/20"><MessageSquare className="w-5 h-5 text-voltech-cyan" /></div>
                <div><h3 className="text-lg font-bold text-white">Plantillas de Mensajes</h3><p className="text-xs text-voltech-muted">Crea y guarda mensajes personalizados</p></div>
              </div>
              <button onClick={() => setShowPlantillaForm(true)} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nueva Plantilla
              </button>
            </div>

            <AnimatePresence>
              {showPlantillaForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-voltech-border p-6 bg-voltech-dark/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div><label className="block text-xs text-voltech-muted mb-1">Nombre</label><input type="text" value={formDataPlantilla.nombre} onChange={(e) => setFormDataPlantilla({...formDataPlantilla, nombre: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Ej: Oferta Flash" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1">Tipo</label><select value={formDataPlantilla.tipo} onChange={(e) => setFormDataPlantilla({...formDataPlantilla, tipo: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="whatsapp">WhatsApp</option><option value="marketplace">Marketplace</option></select></div>
                    <div><label className="block text-xs text-voltech-muted mb-1">Categoría</label><select value={formDataPlantilla.categoria} onChange={(e) => setFormDataPlantilla({...formDataPlantilla, categoria: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="mensaje">Mensaje</option><option value="oferta">Oferta</option><option value="recordatorio">Recordatorio</option></select></div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs text-voltech-muted mb-1">Contenido</label>
                    <textarea value={formDataPlantilla.contenido} onChange={(e) => setFormDataPlantilla({...formDataPlantilla, contenido: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm h-32 resize-none" placeholder="🔥 OFERTA FLASH&#10;&#10;Aprovecha esta oportunidad única&#10;Stock limitado" />
                    <p className="text-xs text-voltech-muted mt-1">Tip: Primera línea será el título. Variables: {'{producto}'}, {'{precio}'}, {'{descripcion}'}, {'{imagen}'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={guardarPlantilla} className="px-4 py-2 bg-voltech-success/20 text-voltech-success rounded-lg text-sm hover:bg-voltech-success/30 transition-colors flex items-center gap-2"><Save className="w-4 h-4" /> Guardar</button>
                    <button onClick={resetPlantillaForm} className="px-4 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white transition-colors flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-6 border-t border-voltech-border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plantillas.map((plantilla) => (
                  <div key={plantilla.id} className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-semibold text-white">{plantilla.nombre}</h4>
                        <div className="flex gap-1 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-voltech-cyan/20 text-voltech-cyan">{plantilla.tipo === 'whatsapp' ? '📱 WhatsApp' : ' Marketplace'}</span>
                          <span className="text-xs text-voltech-muted capitalize">{plantilla.categoria}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => editarPlantilla(plantilla)} className="p-1 text-voltech-cyan hover:bg-voltech-cyan/10 rounded"><Edit3 className="w-3 h-3" /></button>
                        <button onClick={() => eliminarPlantilla(plantilla.id)} className="p-1 text-voltech-error hover:bg-voltech-error/10 rounded"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <p className="text-xs text-voltech-muted mb-3 line-clamp-2">{plantilla.contenido}</p>
                  </div>
                ))}
                {plantillas.length === 0 && (<div className="col-span-3 text-center py-8 text-voltech-muted"><MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" /><p className="text-sm">No hay plantillas guardadas</p></div>)}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: WHATSAPP */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6">
            <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-lg bg-voltech-success/20"><Send className="w-5 h-5 text-voltech-success" /></div>
                  <div><h3 className="text-lg font-bold text-white">Difusión por WhatsApp</h3><p className="text-xs text-voltech-muted">Envía mensajes personalizados a tus clientes</p></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-6">
                    <div className="bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-white mb-3">1️ Seleccionar Producto</h4>
                      <select value={productoSeleccionado?.id || ''} onChange={(e) => { const prod = productos.find(p => p.id === parseInt(e.target.value)); setProductoSeleccionado(prod || null); setPrecioPromocion(''); }} className="input-voltech w-full rounded-lg px-4 py-2 text-sm mb-3">
                        <option value="">Buscar producto...</option>
                        {productos.filter(p => p.cantidad > 0).map(p => (<option key={p.id} value={p.id}>{p.nombre || p.plataforma} - ${p.precioDetal?.toFixed(2) || '0.00'} (Stock: {p.cantidad})</option>))}
                      </select>
                      {productoSeleccionado && (
                        <div className="bg-voltech-surface border border-voltech-border rounded-lg p-3">
                          <div className="flex gap-3">
                            <div className="w-16 h-16 bg-voltech-dark rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {productoSeleccionado.imagen ? (<img src={productoSeleccionado.imagen} alt={productoSeleccionado.nombre} className="w-full h-full object-cover rounded-lg" />) : (<ShoppingCart className="w-8 h-8 text-voltech-muted" />)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{productoSeleccionado.nombre || productoSeleccionado.plataforma}</p>
                              <p className="text-xs text-voltech-success font-bold">${productoSeleccionado.precioDetal?.toFixed(2) || '0.00'}</p>
                              <p className="text-xs text-voltech-muted">{productoSeleccionado.cantidad > 10 ? '✅ Stock disponible' : '⚠️ Pocas unidades'}</p>
                              {productoSeleccionado.imagen && (
                                <div className="mt-2">
                                  <p className="text-[10px] text-voltech-cyan break-all"> {productoSeleccionado.imagen}</p>
                                </div>
                              )}
                              <div className="mt-2">
                                <label className="text-xs text-voltech-muted block mb-1">💰 Precio para esta promoción:</label>
                                <input type="number" step="0.01" placeholder={productoSeleccionado.precioDetal?.toFixed(2) || '0.00'} value={precioPromocion} onChange={(e) => setPrecioPromocion(e.target.value)} className="input-voltech w-full rounded px-3 py-1.5 text-xs" />
                                <p className="text-[10px] text-voltech-muted mt-1">Déjalo vacío para usar el precio original</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-white mb-3">2️ Seleccionar Destinatarios</h4>
                      <div className="space-y-3 mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
                          <input type="text" placeholder=" Buscar por nombre o teléfono..." value={busquedaClientes} onChange={(e) => setBusquedaClientes(e.target.value)} className="input-voltech w-full rounded-lg pl-10 pr-4 py-2 text-sm" />
                        </div>
                        <div className="flex gap-2">
                          <select value={filtroEtiqueta} onChange={(e) => setFiltroEtiqueta(e.target.value)} className="input-voltech flex-1 rounded-lg px-4 py-2 text-sm">
                            <option value="">️ Todas las etiquetas</option>
                            {etiquetasOrdenadas.map(et => (<option key={et.id} value={et.nombre}>{et.nombre}</option>))}
                          </select>
                          <button onClick={seleccionarTodosClientes} className="px-3 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors whitespace-nowrap">
                            {clientesSeleccionados.length === filtrarClientes().length ? 'Deseleccionar' : 'Todos'}
                          </button>
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                        {filtrarClientes().map(cliente => (
                          <label key={cliente.id} className="flex items-start gap-3 p-3 bg-voltech-surface border border-voltech-border rounded-lg cursor-pointer hover:border-voltech-cyan transition-colors">
                            <input type="checkbox" checked={clientesSeleccionados.includes(cliente.id)} onChange={() => toggleClienteSeleccion(cliente.id)} className="w-4 h-4 rounded border-voltech-border bg-voltech-dark text-voltech-cyan mt-1" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium truncate">{cliente.nombre}</p>
                              <p className="text-xs text-voltech-muted flex items-center gap-1 mb-1"><span className="w-3 h-3"><Send className="w-3 h-3 inline" /></span> {cliente.telefono}</p>
                              {cliente.etiquetas && cliente.etiquetas.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {cliente.etiquetas.slice(0, 3).map((et, idx) => {
                                    const etiquetaObj = etiquetas.find(e => e.nombre === et);
                                    return <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded-full border" style={{ backgroundColor: `${etiquetaObj?.color || '#8b5cf6'}20`, color: etiquetaObj?.color || '#8b5cf6', borderColor: `${etiquetaObj?.color || '#8b5cf6'}40` }}>{et}</span>;
                                  })}
                                  {cliente.etiquetas.length > 3 && <span className="text-[10px] px-1.5 py-0.5 text-voltech-muted">+{cliente.etiquetas.length - 3}</span>}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                        {filtrarClientes().length === 0 && <p className="text-center text-xs text-voltech-muted py-4">No se encontraron clientes</p>}
                      </div>
                      <p className="text-xs text-voltech-muted mt-3 text-right">{clientesSeleccionados.length} cliente(s) seleccionado(s)</p>
                    </div>
                  </div>
                  <div className="bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-white mb-3">3️ Seleccionar Plantilla</h4>
                    <select value={plantillaWhatsappSeleccionada} onChange={(e) => setPlantillaWhatsappSeleccionada(e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm mb-3">
                      <option value="">Seleccionar plantilla de WhatsApp...</option>
                      {plantillasWhatsapp.map(p => (<option key={p.id} value={p.id}>📱 {p.nombre}</option>))}
                    </select>
                    {plantillaWhatsappSeleccionada && (
                      <div className="bg-voltech-surface border border-voltech-border rounded-lg p-3">
                        <p className="text-xs text-voltech-muted mb-1 font-semibold">Vista previa de la plantilla:</p>
                        <p className="text-sm text-white whitespace-pre-wrap font-mono text-xs bg-voltech-dark/50 p-2 rounded border border-voltech-border">{plantillas.find(p => p.id === parseInt(plantillaWhatsappSeleccionada))?.contenido || 'Sin contenido'}</p>
                      </div>
                    )}
                  </div>
                </div>
                {mostrarMensajeWhatsApp && (
                  <div className="bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2"><CheckCircle className="w-4 h-4 text-voltech-success" /> 4️⃣ Mensaje Generado (Vista Previa)</h4>
                      <div className="flex gap-2">
                        <button onClick={() => copiarTexto(mensajePersonalizado)} className="px-3 py-1.5 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-xs hover:bg-voltech-cyan/30 transition-colors flex items-center gap-1 font-medium"><Copy className="w-3.5 h-3.5" /> Copiar</button>
                        <button onClick={enviarWhatsApp} className="px-3 py-1.5 bg-voltech-success/20 text-voltech-success rounded-lg text-xs hover:bg-voltech-success/30 transition-colors flex items-center gap-1 font-medium"><Send className="w-3.5 h-3.5" /> Enviar a {clientesSeleccionados.length}</button>
                      </div>
                    </div>
                    <div className="bg-voltech-surface border border-voltech-border rounded-lg p-4">
                      <pre className="text-sm text-white whitespace-pre-wrap font-sans leading-relaxed">{mensajePersonalizado}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: MARKETPLACE */}
        {activeTab === 'marketplace' && (
          <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-voltech-purple/20"><FileText className="w-5 h-5 text-voltech-purple" /></div>
                <div><h3 className="text-lg font-bold text-white">Textos para Marketplace</h3><p className="text-xs text-voltech-muted">Genera descripciones optimizadas</p></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">1️⃣ Seleccionar Producto</h4>
                  <select value={productoMarketplace?.id || ''} onChange={(e) => { const prod = productos.find(p => p.id === parseInt(e.target.value)); setProductoMarketplace(prod || null); setPrecioPromocionMarketplace(''); }} className="input-voltech w-full rounded-lg px-4 py-2 text-sm mb-3">
                    <option value="">Buscar producto...</option>
                    {productos.map(p => (<option key={p.id} value={p.id}>{p.nombre || p.plataforma} - ${p.precioDetal?.toFixed(2) || '0.00'}</option>))}
                  </select>
                  {productoMarketplace && (
                    <div className="bg-voltech-surface border border-voltech-border rounded-lg p-3">
                      <div className="flex gap-3">
                        <div className="w-16 h-16 bg-voltech-dark rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {productoMarketplace.imagen ? (<img src={productoMarketplace.imagen} alt={productoMarketplace.nombre} className="w-full h-full object-cover rounded-lg" />) : (<ShoppingCart className="w-8 h-8 text-voltech-muted" />)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{productoMarketplace.nombre || productoMarketplace.plataforma}</p>
                          <p className="text-xs text-voltech-success font-bold">${productoMarketplace.precioDetal?.toFixed(2) || '0.00'}</p>
                          <p className="text-xs text-voltech-muted">{productoMarketplace.cantidad > 10 ? '✅ Stock disponible' : '⚠️ Pocas unidades'}</p>
                          <div className="mt-2">
                            <label className="text-xs text-voltech-muted block mb-1">💰 Precio para esta promoción:</label>
                            <input type="number" step="0.01" placeholder={productoMarketplace.precioDetal?.toFixed(2) || '0.00'} value={precioPromocionMarketplace} onChange={(e) => setPrecioPromocionMarketplace(e.target.value)} className="input-voltech w-full rounded px-3 py-1.5 text-xs" />
                            <p className="text-[10px] text-voltech-muted mt-1">Déjalo vacío para usar el precio original</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">2️⃣ Seleccionar Plantilla</h4>
                  <select value={plantillaMarketplaceSeleccionada} onChange={(e) => setPlantillaMarketplaceSeleccionada(e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm mb-3">
                    <option value="">Seleccionar plantilla de Marketplace...</option>
                    {plantillasMarketplace.map(p => (<option key={p.id} value={p.id}>📄 {p.nombre}</option>))}
                  </select>
                  {plantillaMarketplaceSeleccionada && (
                    <div className="bg-voltech-surface border border-voltech-border rounded-lg p-3">
                      <p className="text-xs text-voltech-muted mb-1 font-semibold">Vista previa de la plantilla:</p>
                      <p className="text-sm text-white whitespace-pre-wrap font-mono text-xs bg-voltech-dark/50 p-2 rounded border border-voltech-border">{plantillas.find(p => p.id === parseInt(plantillaMarketplaceSeleccionada))?.contenido || 'Sin contenido'}</p>
                    </div>
                  )}
                </div>
              </div>
              {mostrarTextoMarketplace && (
                <div className="bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2"><CheckCircle className="w-4 h-4 text-voltech-success" /> 3️⃣ Texto Generado (Vista Previa)</h4>
                    <button onClick={() => copiarTexto(textoMarketplace)} className="px-3 py-1.5 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-xs hover:bg-voltech-cyan/30 transition-colors flex items-center gap-1 font-medium"><Copy className="w-3.5 h-3.5" /> Copiar Texto</button>
                  </div>
                  <div className="bg-voltech-surface border border-voltech-border rounded-lg p-4">
                    <pre className="text-sm text-white whitespace-pre-wrap font-sans leading-relaxed">{textoMarketplace}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 4: CUPONES PROMOCIONALES */}
        {activeTab === 'cupones' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button onClick={() => setShowCuponForm(true)} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" /> Crear Nuevo Cupón
              </button>
            </div>

            <AnimatePresence>
              {showCuponForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-voltech-purple" />
                        {cuponEditando ? 'Editar Cupón' : 'Crear Nuevo Cupón'}
                      </h3>
                      <button onClick={() => { setShowCuponForm(false); setCuponEditando(null); setBusquedaProductoCupon(''); }} className="p-2 hover:bg-voltech-border rounded-lg transition-colors">
                        <X className="w-5 h-5 text-voltech-muted" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-voltech-cyan" /> Información del Cupón</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-voltech-muted mb-1">Título *</label>
                            <input type="text" value={formDataCupon.titulo} onChange={(e) => setFormDataCupon({...formDataCupon, titulo: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Ej: Lanzamiento iPhone 15" />
                          </div>
                          <div>
                            <label className="block text-xs text-voltech-muted mb-1">Código (opcional)</label>
                            <input type="text" value={formDataCupon.codigo} onChange={(e) => setFormDataCupon({...formDataCupon, codigo: e.target.value.toUpperCase().replace(/\s/g, '')})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Se genera automáticamente" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs text-voltech-muted mb-1">Descripción *</label>
                            <textarea value={formDataCupon.descripcion} onChange={(e) => setFormDataCupon({...formDataCupon, descripcion: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm h-20 resize-none" placeholder="20% de descuento en iPhone 15 - Edición limitada" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Percent className="w-4 h-4 text-voltech-success" /> Configuración del Descuento</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-xs text-voltech-muted mb-1">Tipo</label>
                            <select value={formDataCupon.tipo_descuento} onChange={(e) => setFormDataCupon({...formDataCupon, tipo_descuento: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                              <option value="porcentaje">Porcentaje (%)</option>
                              <option value="monto">Monto Fijo ($)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-voltech-muted mb-1">Valor *</label>
                            <input type="number" value={formDataCupon.valor} onChange={(e) => setFormDataCupon({...formDataCupon, valor: parseFloat(e.target.value) || 0})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder={formDataCupon.tipo_descuento === 'porcentaje' ? '20' : '10.00'} />
                          </div>
                          <div>
                            <label className="block text-xs text-voltech-muted mb-1">Monto Mínimo de Compra ($)</label>
                            <input type="number" step="0.01" value={formDataCupon.monto_minimo} onChange={(e) => setFormDataCupon({...formDataCupon, monto_minimo: parseFloat(e.target.value) || 0})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="0.00" />
                          </div>
                        </div>

                        <div className="bg-voltech-dark/30 border border-voltech-border rounded-lg p-4 space-y-4">
                          <div>
                            <label className="block text-xs text-voltech-muted mb-2">Aplicar descuento a:</label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="aplica_a" checked={formDataCupon.aplica_a === 'todos'} onChange={() => setFormDataCupon({...formDataCupon, aplica_a: 'todos'})} className="w-4 h-4 text-voltech-cyan" />
                                <span className="text-sm text-white">Todos los productos</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="aplica_a" checked={formDataCupon.aplica_a === 'especificos'} onChange={() => setFormDataCupon({...formDataCupon, aplica_a: 'especificos'})} className="w-4 h-4 text-voltech-cyan" />
                                <span className="text-sm text-white">Productos específicos</span>
                              </label>
                            </div>
                          </div>

                          {formDataCupon.aplica_a === 'especificos' && (
                            <div className="border-t border-voltech-border pt-4">
                              <label className="block text-xs text-voltech-muted mb-2">Buscar y seleccionar productos:</label>
                              <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
                                <input type="text" value={busquedaProductoCupon} onChange={(e) => setBusquedaProductoCupon(e.target.value)} placeholder="Escribir nombre o marca..." className="input-voltech w-full rounded-lg pl-10 pr-4 py-2 text-sm" />
                              </div>
                              <div className="max-h-40 overflow-y-auto space-y-2 border border-voltech-border rounded-lg p-2 bg-voltech-surface">
                                {productosParaCupon.map(prod => {
                                  const isSelected = formDataCupon.productos_especificos.includes(prod.id);
                                  return (
                                    <label key={prod.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${isSelected ? 'bg-voltech-cyan/10 border border-voltech-cyan/30' : 'hover:bg-voltech-dark/50'}`}>
                                      <input type="checkbox" checked={isSelected} onChange={() => toggleProductoCupon(prod.id)} className="w-4 h-4 rounded border-voltech-border text-voltech-cyan" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{prod.producto || prod.plataforma}</p>
                                        <p className="text-xs text-voltech-muted">${prod.precioDetal?.toFixed(2)} • {prod.marca || 'Sin marca'}</p>
                                      </div>
                                      {prod.precio_oferta && <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">En Oferta</span>}
                                    </label>
                                  );
                                })}
                                {productosParaCupon.length === 0 && <p className="text-xs text-voltech-muted text-center py-2">No se encontraron productos</p>}
                              </div>
                              <p className="text-xs text-voltech-cyan mt-2">{formDataCupon.productos_especificos.length} producto(s) seleccionado(s)</p>
                            </div>
                          )}

                          <div className="border-t border-voltech-border pt-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" checked={formDataCupon.excluir_ofertas} onChange={(e) => setFormDataCupon({...formDataCupon, excluir_ofertas: e.target.checked})} className="w-4 h-4 rounded border-voltech-border text-voltech-cyan" />
                              <div>
                                <span className="text-sm text-white font-medium">Excluir productos que ya tienen oferta activa</span>
                                <p className="text-xs text-voltech-muted">El cupón no se aplicará a productos que ya tengan un precio de oferta configurado.</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-voltech-warning" /> Validez y Límites</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs text-voltech-muted mb-1">Fecha y Hora de Inicio *</label>
                            <input type="datetime-local" value={formDataCupon.fecha_inicio} onChange={(e) => setFormDataCupon({...formDataCupon, fecha_inicio: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-voltech-muted mb-1">Fecha y Hora de Vencimiento *</label>
                            <input type="datetime-local" value={formDataCupon.fecha_vencimiento} onChange={(e) => setFormDataCupon({...formDataCupon, fecha_vencimiento: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-voltech-muted mb-1">Límite de Usos Totales</label>
                            <select value={formDataCupon.limite_usos} onChange={(e) => setFormDataCupon({...formDataCupon, limite_usos: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                              <option value="ilimitado">Ilimitado</option>
                              <option value="limitado">Limitado</option>
                            </select>
                          </div>
                          {formDataCupon.limite_usos === 'limitado' && (
                            <div>
                              <label className="block text-xs text-voltech-muted mb-1">Máximo de Usos</label>
                              <input type="number" value={formDataCupon.max_usos} onChange={(e) => setFormDataCupon({...formDataCupon, max_usos: parseInt(e.target.value) || 0})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-voltech-border">
                        <button onClick={() => { setShowCuponForm(false); setCuponEditando(null); setBusquedaProductoCupon(''); }} className="px-6 py-3 rounded-lg font-medium bg-voltech-surface border border-voltech-border text-voltech-muted hover:text-white hover:border-voltech-cyan/50 transition-all">Cancelar</button>
                        <button onClick={guardarCupon} className="btn-neon flex-1 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center justify-center gap-2">
                          <Save className="w-5 h-5" /> {cuponEditando ? 'Guardar Cambios' : 'Generar y Publicar Cupón'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-voltech-border">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Ticket className="w-5 h-5 text-voltech-purple" /> Cupones Creados</h3>
              </div>
              
              <div className="divide-y divide-voltech-border">
                {cupones.length === 0 ? (
                  <div className="p-12 text-center">
                    <Ticket className="w-16 h-16 text-voltech-muted mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-semibold text-white mb-2">No hay cupones creados</h3>
                    <p className="text-voltech-muted text-sm">Crea tu primer cupón para comenzar a promocionar</p>
                  </div>
                ) : (
                  cupones.map(cupon => {
                    const aplicaTexto = cupon.aplica_a === 'especificos' 
                      ? `${cupon.productos_especificos.length} productos específicos` 
                      : 'Todos los productos';
                    
                    return (
                      <div key={cupon.id} className="p-6 hover:bg-voltech-dark/30 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h4 className="text-lg font-bold text-white">{cupon.titulo}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${cupon.estado === 'activo' ? 'bg-voltech-success/20 text-voltech-success' : 'bg-voltech-muted/20 text-voltech-muted'}`}>
                                {cupon.estado === 'activo' ? 'Activo' : 'Inactivo'}
                              </span>
                              {cupon.excluir_ofertas && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-voltech-warning/20 text-voltech-warning flex items-center gap-1">
                                  <X className="w-3 h-3" /> Excluye ofertas
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-voltech-muted mb-3">{cupon.descripcion}</p>
                            
                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Ticket className="w-4 h-4 text-voltech-cyan" />
                                <span className="font-mono font-bold text-voltech-cyan">{cupon.codigo}</span>
                                <button onClick={() => copiarCodigo(cupon.codigo)} className="p-1 hover:bg-voltech-border rounded"><Copy className="w-3 h-3 text-voltech-muted" /></button>
                              </div>
                              <div className="flex items-center gap-2">
                                <Percent className="w-4 h-4 text-voltech-success" />
                                <span className="text-voltech-success font-bold">{cupon.tipo_descuento === 'porcentaje' ? `${cupon.valor}%` : `$${cupon.valor.toFixed(2)}`}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-voltech-purple" />
                                <span className="text-voltech-muted">{aplicaTexto}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-voltech-warning" />
                                <span className="text-voltech-muted">
                                  {new Date(cupon.fecha_inicio).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })} - {new Date(cupon.fecha_vencimiento).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <button onClick={() => toggleEstadoCupon(cupon)} className={`p-2 rounded-lg transition-colors ${cupon.estado === 'activo' ? 'hover:bg-voltech-warning/20 text-voltech-warning' : 'hover:bg-voltech-success/20 text-voltech-success'}`} title={cupon.estado === 'activo' ? 'Desactivar' : 'Activar'}>
                              {cupon.estado === 'activo' ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button onClick={() => editarCupon(cupon)} className="p-2 hover:bg-voltech-cyan/20 rounded-lg transition-colors text-voltech-cyan" title="Editar"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => eliminarCupon(cupon.id)} className="p-2 hover:bg-voltech-error/20 rounded-lg transition-colors text-voltech-error" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-voltech-border">
                          <div>
                            <p className="text-xs text-voltech-muted mb-1">Veces Usado</p>
                            <p className="text-lg font-bold text-white">{cupon.usos || 0} {cupon.limite_usos === 'limitado' && <span className="text-xs text-voltech-muted">/ {cupon.max_usos}</span>}</p>
                          </div>
                          <div>
                            <p className="text-xs text-voltech-muted mb-1">Descuento Total</p>
                            <p className="text-lg font-bold text-voltech-success">${(cupon.descuento_total || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-voltech-muted mb-1">Tasa de Conversión</p>
                            <p className="text-lg font-bold text-voltech-cyan">{cupon.usos > 0 ? ((cupon.usos / (cupon.max_usos || 100)) * 100).toFixed(1) : 0}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-voltech-muted mb-1">Estado</p>
                            <p className={`text-sm font-medium ${new Date(cupon.fecha_vencimiento) < new Date() ? 'text-voltech-error' : cupon.estado === 'activo' ? 'text-voltech-success' : 'text-voltech-muted'}`}>
                              {new Date(cupon.fecha_vencimiento) < new Date() ? 'Expirado' : cupon.estado === 'activo' ? 'Vigente' : 'Inactivo'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ✅ PESTAÑA 5: PUBLICIDAD/BANNERS CON SUBIDA DE IMAGEN */}
        {activeTab === 'publicidad' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-voltech-cyan" />
                  Gestión de Publicidad
                </h2>
                <p className="text-sm text-voltech-muted">Crea y gestiona banners publicitarios para el catálogo</p>
              </div>
              <button
                onClick={() => setShowPublicidadForm(true)}
                className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nueva Publicidad
              </button>
            </div>

            {/* Formulario Crear/Editar Publicidad */}
            <AnimatePresence>
              {showPublicidadForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {publicidadEditando ? 'Editar Publicidad' : 'Crear Nueva Publicidad'}
                      </h3>
                      <button onClick={resetPublicidadForm} className="p-2 hover:bg-voltech-border rounded-lg">
                        <X className="w-5 h-5 text-voltech-muted" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-voltech-muted mb-2">Título *</label>
                          <input
                            type="text"
                            value={formDataPublicidad.titulo}
                            onChange={(e) => setFormDataPublicidad({...formDataPublicidad, titulo: e.target.value})}
                            className="input-voltech w-full rounded-lg px-4 py-2"
                            placeholder="Ej: Tienda Hermana - Ropa Deportiva"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-voltech-muted mb-2">URL de Destino</label>
                          <input
                            type="text"
                            value={formDataPublicidad.url_destino}
                            onChange={(e) => setFormDataPublicidad({...formDataPublicidad, url_destino: e.target.value})}
                            className="input-voltech w-full rounded-lg px-4 py-2"
                            placeholder="https://tiendahermana.com/ropadeportiva"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-voltech-muted mb-2">Agregar Imagen *</label>
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileInput}
                            className="hidden"
                          />
                          <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                              isDragOver 
                                ? 'border-voltech-cyan bg-voltech-cyan/10' 
                                : 'border-voltech-border hover:border-voltech-cyan/50'
                            }`}
                          >
                            {imagenPreview ? (
                              <div className="space-y-3">
                                <img src={imagenPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                                <p className="text-sm text-voltech-muted">Haz clic para cambiar la imagen</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3">
                                <div className="p-3 rounded-full bg-voltech-cyan/20">
                                  <Upload className="w-6 h-6 text-voltech-cyan" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">Arrastra una imagen o haz clic para seleccionar</p>
                                  <p className="text-xs text-voltech-muted mt-1">Recomendado: 300x300px para sidebar, 728x90px para banner superior (Máx. 5MB)</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-voltech-muted mb-2">Lado de Visualización</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="lado"
                                checked={formDataPublicidad.lado === 'izquierdo'}
                                onChange={() => setFormDataPublicidad({...formDataPublicidad, lado: 'izquierdo'})}
                                className="w-4 h-4 text-voltech-cyan"
                              />
                              <span className="text-sm text-white">Izquierdo</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="lado"
                                checked={formDataPublicidad.lado === 'derecho'}
                                onChange={() => setFormDataPublicidad({...formDataPublicidad, lado: 'derecho'})}
                                className="w-4 h-4 text-voltech-cyan"
                              />
                              <span className="text-sm text-white">Derecho</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="lado"
                                checked={formDataPublicidad.lado === 'ambos'}
                                onChange={() => setFormDataPublicidad({...formDataPublicidad, lado: 'ambos'})}
                                className="w-4 h-4 text-voltech-cyan"
                              />
                              <span className="text-sm text-white">Ambos lados</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-voltech-muted mb-2">Posición/Espacio</label>
                          <select
                            value={formDataPublicidad.posicion}
                            onChange={(e) => setFormDataPublicidad({...formDataPublicidad, posicion: e.target.value})}
                            className="input-voltech w-full rounded-lg px-4 py-2"
                          >
                            <option value="sidebar">Sidebar (barra lateral)</option>
                            <option value="banner_superior">Banner Superior</option>
                            <option value="entre_productos">Entre productos (cada 4 productos)</option>
                            <option value="footer">Footer (pie de página)</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-voltech-muted mb-2">Fecha Inicio *</label>
                            <input
                              type="date"
                              value={formDataPublicidad.fecha_inicio}
                              onChange={(e) => setFormDataPublicidad({...formDataPublicidad, fecha_inicio: e.target.value})}
                              className="input-voltech w-full rounded-lg px-4 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-voltech-muted mb-2">Hora Inicio</label>
                            <input
                              type="time"
                              value={formDataPublicidad.hora_inicio}
                              onChange={(e) => setFormDataPublicidad({...formDataPublicidad, hora_inicio: e.target.value})}
                              className="input-voltech w-full rounded-lg px-4 py-2"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-voltech-muted mb-2">Fecha Fin *</label>
                            <input
                              type="date"
                              value={formDataPublicidad.fecha_fin}
                              onChange={(e) => setFormDataPublicidad({...formDataPublicidad, fecha_fin: e.target.value})}
                              className="input-voltech w-full rounded-lg px-4 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-voltech-muted mb-2">Hora Fin</label>
                            <input
                              type="time"
                              value={formDataPublicidad.hora_fin}
                              onChange={(e) => setFormDataPublicidad({...formDataPublicidad, hora_fin: e.target.value})}
                              className="input-voltech w-full rounded-lg px-4 py-2"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-voltech-muted mb-2">Prioridad</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="prioridad"
                                checked={formDataPublicidad.prioridad === 'normal'}
                                onChange={() => setFormDataPublicidad({...formDataPublicidad, prioridad: 'normal'})}
                                className="w-4 h-4 text-voltech-cyan"
                              />
                              <span className="text-sm text-white">Normal</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="prioridad"
                                checked={formDataPublicidad.prioridad === 'alta'}
                                onChange={() => setFormDataPublicidad({...formDataPublicidad, prioridad: 'alta'})}
                                className="w-4 h-4 text-voltech-cyan"
                              />
                              <span className="text-sm text-white">Alta</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="prioridad"
                                checked={formDataPublicidad.prioridad === 'urgente'}
                                onChange={() => setFormDataPublicidad({...formDataPublicidad, prioridad: 'urgente'})}
                                className="w-4 h-4 text-voltech-cyan"
                              />
                              <span className="text-sm text-white">Urgente</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-white mb-3">Mostrar en:</h4>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formDataPublicidad.mostrar_en.inicio}
                                onChange={(e) => setFormDataPublicidad({
                                  ...formDataPublicidad,
                                  mostrar_en: {...formDataPublicidad.mostrar_en, inicio: e.target.checked}
                                })}
                                className="w-4 h-4 rounded border-voltech-border text-voltech-cyan"
                              />
                              <span className="text-sm text-white">Página de inicio</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formDataPublicidad.mostrar_en.catalogo}
                                onChange={(e) => setFormDataPublicidad({
                                  ...formDataPublicidad,
                                  mostrar_en: {...formDataPublicidad.mostrar_en, catalogo: e.target.checked}
                                })}
                                className="w-4 h-4 rounded border-voltech-border text-voltech-cyan"
                              />
                              <span className="text-sm text-white">Catálogo de productos</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formDataPublicidad.mostrar_en.streaming}
                                onChange={(e) => setFormDataPublicidad({
                                  ...formDataPublicidad,
                                  mostrar_en: {...formDataPublicidad.mostrar_en, streaming: e.target.checked}
                                })}
                                className="w-4 h-4 rounded border-voltech-border text-voltech-cyan"
                              />
                              <span className="text-sm text-white">Streaming</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formDataPublicidad.mostrar_en.ofertas}
                                onChange={(e) => setFormDataPublicidad({
                                  ...formDataPublicidad,
                                  mostrar_en: {...formDataPublicidad.mostrar_en, ofertas: e.target.checked}
                                })}
                                className="w-4 h-4 rounded border-voltech-border text-voltech-cyan"
                              />
                              <span className="text-sm text-white">Ofertas</span>
                            </label>
                          </div>
                        </div>

                        <div className="bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-white mb-3">Dispositivos:</h4>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formDataPublicidad.dispositivos.desktop}
                                onChange={(e) => setFormDataPublicidad({
                                  ...formDataPublicidad,
                                  dispositivos: {...formDataPublicidad.dispositivos, desktop: e.target.checked}
                                })}
                                className="w-4 h-4 rounded border-voltech-border text-voltech-cyan"
                              />
                              <span className="text-sm text-white flex items-center gap-2"><Monitor className="w-4 h-4" /> Desktop</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formDataPublicidad.dispositivos.movil}
                                onChange={(e) => setFormDataPublicidad({
                                  ...formDataPublicidad,
                                  dispositivos: {...formDataPublicidad.dispositivos, movil: e.target.checked}
                                })}
                                className="w-4 h-4 rounded border-voltech-border text-voltech-cyan"
                              />
                              <span className="text-sm text-white flex items-center gap-2"><Smartphone className="w-4 h-4" /> Móvil</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formDataPublicidad.dispositivos.tablet}
                                onChange={(e) => setFormDataPublicidad({
                                  ...formDataPublicidad,
                                  dispositivos: {...formDataPublicidad.dispositivos, tablet: e.target.checked}
                                })}
                                className="w-4 h-4 rounded border-voltech-border text-voltech-cyan"
                              />
                              <span className="text-sm text-white flex items-center gap-2"><Tablet className="w-4 h-4" /> Tablet</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-voltech-muted mb-2">Frecuencia de Rotación</label>
                          <select
                            value={formDataPublicidad.rotacion}
                            onChange={(e) => setFormDataPublicidad({...formDataPublicidad, rotacion: parseInt(e.target.value)})}
                            className="input-voltech w-full rounded-lg px-4 py-2"
                          >
                            <option value={5}>Cada 5 segundos</option>
                            <option value={10}>Cada 10 segundos</option>
                            <option value={15}>Cada 15 segundos</option>
                          </select>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={guardarPublicidad}
                            className="flex-1 px-4 py-2 bg-voltech-cyan text-white rounded-lg hover:bg-voltech-cyan/80 flex items-center justify-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            {publicidadEditando ? 'Guardar Cambios' : 'Crear Publicidad'}
                          </button>
                          <button
                            onClick={resetPublicidadForm}
                            className="px-4 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-voltech-muted hover:text-white"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Lista de Publicidades */}
            <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-voltech-border">
                <h3 className="text-lg font-bold text-white">Publicidades Creadas</h3>
              </div>
              
              <div className="divide-y divide-voltech-border">
                {publicidad.length === 0 ? (
                  <div className="p-12 text-center">
                    <Megaphone className="w-16 h-16 text-voltech-muted mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-semibold text-white mb-2">No hay publicidades creadas</h3>
                    <p className="text-voltech-muted text-sm">Crea tu primera campaña publicitaria</p>
                  </div>
                ) : (
                  publicidad.map(pub => (
                    <div key={pub.id} className="p-6 hover:bg-voltech-dark/30 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-bold text-white">{pub.titulo}</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              pub.estado === 'activo' 
                                ? 'bg-voltech-success/20 text-voltech-success' 
                                : 'bg-voltech-warning/20 text-voltech-warning'
                            }`}>
                              {pub.estado === 'activo' ? 'Activo' : 'Inactivo'}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs bg-voltech-cyan/20 text-voltech-cyan capitalize">
                              {pub.posicion.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-voltech-muted mb-3">
                            <span className="flex items-center gap-1">
                              <span className="capitalize">{pub.lado}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(pub.fecha_inicio).toLocaleDateString('es-VE')} - {new Date(pub.fecha_fin).toLocaleDateString('es-VE')}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4 text-voltech-cyan" />
                              <span className="text-voltech-muted">Impresiones:</span>
                              <span className="font-bold text-white">{pub.impresiones || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-voltech-success" />
                              <span className="text-voltech-muted">Clicks:</span>
                              <span className="font-bold text-white">{pub.clics || 0}</span>
                              {pub.clics > 0 && pub.impresiones > 0 && (
                                <span className="text-voltech-success">({((pub.clics / pub.impresiones) * 100).toFixed(1)}%)</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => toggleEstadoPublicidad(pub)}
                            className={`p-2 rounded-lg transition-colors ${
                              pub.estado === 'activo' 
                                ? 'hover:bg-voltech-warning/20 text-voltech-warning' 
                                : 'hover:bg-voltech-success/20 text-voltech-success'
                            }`}
                            title={pub.estado === 'activo' ? 'Desactivar' : 'Activar'}
                          >
                            {pub.estado === 'activo' ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => editarPublicidad(pub)}
                            className="p-2 hover:bg-voltech-cyan/20 rounded-lg text-voltech-cyan"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => eliminarPublicidad(pub.id)}
                            className="p-2 hover:bg-voltech-error/20 rounded-lg text-voltech-error"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}