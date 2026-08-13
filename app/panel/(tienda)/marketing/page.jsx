'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/app/context/PermissionsContext';
import { useNotificaciones } from '@/app/context/NotificationContext';
import ModalWhatsApp from '@/components/ModalWhatsApp';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { 
  MessageSquare, Send, Users, Gift, Copy, Plus, Search, Trash2, 
  Edit3, Save, X, CheckCircle, ShoppingCart, Tag, FileText, 
  ChevronDown, ChevronUp, Share2, Ticket, Percent, Calendar,
  TrendingUp, DollarSign, Package, Megaphone, Store, Image as ImageIcon,
  Eye, Monitor, Smartphone, Tablet, Clock, Upload, AlertCircle, Repeat, Sparkles,
  Phone, Instagram, Globe, Truck, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

// ✅ Abre WhatsApp en la app (móvil) o WhatsApp Web (PC)
function abrirWhatsApp(numero, texto) {
  const limpio = (numero || '').replace(/\D/g, '');
  const cod = encodeURIComponent(texto);
  const esMovil = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
  const url = esMovil
    ? `https://wa.me/58${limpio}?text=${cod}`
    : `https://web.whatsapp.com/send?phone=58${limpio}&text=${cod}`;
  window.open(url, '_blank');
}

// ✅ Interpreta *negrita* y _cursiva_
function formatearWA(texto) {
  return (texto || '').split('\n').map((linea, i) => (
    <p key={i} className="min-h-[1em] whitespace-pre-wrap break-words">
      {linea.split(/(\*[^*]+\*|_[^_]+_)/g).map((seg, j) => {
        if (seg.length > 2 && seg.startsWith('*') && seg.endsWith('*')) return <strong key={j}>{seg.slice(1, -1)}</strong>;
        if (seg.length > 2 && seg.startsWith('_') && seg.endsWith('_')) return <em key={j}>{seg.slice(1, -1)}</em>;
        return seg;
      })}
    </p>
  ));
}

// ✅ Burbuja estilo WhatsApp (verde)
function BurbujaWA({ texto, nombre }) {
  return (
    <div className="rounded-xl overflow-hidden border border-voltech-border">
      <div className="bg-[#202c33] px-4 py-2.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-voltech-cyan to-voltech-purple flex items-center justify-center text-white text-xs font-bold">{(nombre || 'C').charAt(0)}</div>
        <div><p className="text-sm font-semibold text-[#25D366]">{nombre || 'Cliente'}</p><p className="text-[10px] text-emerald-400">en línea</p></div>
      </div>
      <div className="bg-[#0b141a] p-3">
        <div className="flex justify-end">
          <div className="bg-[#005c4b] rounded-lg rounded-tr-none p-3 text-[13px] text-gray-100 shadow w-fit max-w-[95%]">
            {formatearWA(texto)}
            <p className="text-[9px] text-gray-400 text-right mt-1"><span className="text-[#53bdeb]">{'\u2713\u2713'}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BurbujaMessenger({ texto, nombre }) {
  return (
    <div className="rounded-xl overflow-hidden border border-voltech-border bg-[#242526]">
      <div className="px-4 py-2.5 flex items-center gap-3 border-b border-voltech-border">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0084FF] to-[#A033FF] flex items-center justify-center text-white text-xs font-bold">{(nombre || 'V').charAt(0)}</div>
        <div><p className="text-sm font-semibold text-white">{nombre || 'Voltech'}</p><p className="text-[10px] text-[#0084FF]">Activo ahora</p></div>
      </div>
      <div className="p-3">
        <div className="flex justify-end">
          <div className="bg-gradient-to-br from-[#0084FF] to-[#0068CF] rounded-2xl rounded-tr-sm p-3 text-[13px] text-white shadow w-fit max-w-[95%]">
            {formatearWA(texto)}
            <p className="text-[9px] text-blue-200 text-right mt-1">Visto 👍</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketingPage() {
  
  // ✅ ROLES: admin gestiona todo, socio gestiona, vendedor solo usa/ve
  const { esAdmin, esSocio, esVendedor, usuarioActual } = usePermissions();
  const { agregarNotificacion } = useNotificaciones();
  const puedeGestionar = esAdmin || esSocio;
  const [activeTab, setActiveTab] = useState('whatsapp');
  
  const [masVendidosOpen, setMasVendidosOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const [cuponesOpen, setCuponesOpen] = useState(false);
  // ❌ ELIMINADO: calendarioMes y calendarioAnio (vive en Alertas)

  const [plantillas, setPlantillas] = useState([]);
  const [showPlantillaForm, setShowPlantillaForm] = useState(false);
  const [plantillaEditando, setPlantillaEditando] = useState(null);
  const [filtroTipoPlantilla, setFiltroTipoPlantilla] = useState('todas');
  const [formDataPlantilla, setFormDataPlantilla] = useState({
    nombre: '', tipo: 'whatsapp', categoria: 'mensaje', contenido: '', esGlobal: false,
  });

  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [precioPromocion, setPrecioPromocion] = useState('');
  const [plantillaWhatsappSeleccionada, setPlantillaWhatsappSeleccionada] = useState('');
  const [plantillaContactoWaSeleccionada, setPlantillaContactoWaSeleccionada] = useState('');
  const [clientesSeleccionados, setClientesSeleccionados] = useState([]);
  const [filtroEtiqueta, setFiltroEtiqueta] = useState('');
  const [busquedaClientes, setBusquedaClientes] = useState('');
  const [mensajePersonalizadoWa, setMensajePersonalizadoWa] = useState('');
  const [destinatariosOpenWa, setDestinatariosOpenWa] = useState(false);
  const [managerOpenWa, setManagerOpenWa] = useState(false);
  const [managerOpenMp, setManagerOpenMp] = useState(false);
  const [historialEnvios, setHistorialEnvios] = useState({});
  const [historialDetallado, setHistorialDetallado] = useState([]);

  const [productoMarketplace, setProductoMarketplace] = useState(null);
  const [precioPromocionMarketplace, setPrecioPromocionMarketplace] = useState('');
  const [plantillaMarketplaceSeleccionada, setPlantillaMarketplaceSeleccionada] = useState('');
  const [plantillaContactoMpSeleccionada, setPlantillaContactoMpSeleccionada] = useState('');
  const [textoMarketplace, setTextoMarketplace] = useState('');

  const [cupones, setCupones] = useState([]);
  const [showCuponForm, setShowCuponForm] = useState(false);
  const [cuponEditando, setCuponEditando] = useState(null);
  const [busquedaProductoCupon, setBusquedaProductoCupon] = useState('');
  
  const [formDataCupon, setFormDataCupon] = useState({
    titulo: '', descripcion: '', codigo: '', 
    tipo_descuento: 'porcentaje',
    valor_descuento: 20, 
    tipo_aplicacion: 'todos',
    producto_ids: [], 
    excluir_ofertas: false, 
    monto_minimo: 0, 
    fecha_inicio: '', 
    duracion_dias: 30, 
    fecha_vencimiento: '',
    limite_usos: 'ilimitado', 
    max_usos: 100, 
    uso_por_cliente: 'una_vez', 
    estado: 'activo',
    usos: 0,
    descuento_total: 0
  });

  const [publicidad, setPublicidad] = useState([]);
  const [showPublicidadForm, setShowPublicidadForm] = useState(false);
  const [resumenData, setResumenData] = useState({ abierto: false, texto: '', telefono: '', titulo: '', cliente: '' });
  const [publicidadEditando, setPublicidadEditando] = useState(null);
  const [imagenPreview, setImagenPreview] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formDataPublicidad, setFormDataPublicidad] = useState({
    titulo: '', descripcion: '', url_destino: '', url_imagen: '', url_video: '', texto_boton: 'Ver Oferta', lado: 'izquierdo', posicion: 'sidebar',
    anunciante: '', costo_por_click: 0.10, telefono_anunciante: '',
    fecha_inicio: '', duracion_dias: 30, fecha_fin: '', hora_inicio: '00:00', hora_fin: '23:59', prioridad: 'normal',
    mostrar_en: { inicio: true, catalogo: true, streaming: false, ofertas: false },
    dispositivos: { desktop: true, movil: true, tablet: true }, rotacion: 5, estado: 'activo'
  });

  const [masVendidosConfig, setMasVendidosConfig] = useState({
    activo: false, titulo: '🔥 Los Favoritos de Nuestros Clientes', cantidad_maxima: 3,
    descripcion_1: '🚚 Envíos rápidos a todo el país en 24-48h',
    descripcion_2: '️ Garantía de 3 días en todos nuestros productos'
  });

  // ❌ ELIMINADO: campanasCalendario state
  const [alertasVencimiento, setAlertasVencimiento] = useState([]);

  // ✅ CÁLCULO AUTOMÁTICO DE FECHA DE VENCIMIENTO
  useEffect(() => {
    if (formDataCupon.fecha_inicio && formDataCupon.duracion_dias) {
      const fecha = new Date(formDataCupon.fecha_inicio);
      fecha.setDate(fecha.getDate() + parseInt(formDataCupon.duracion_dias));
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      const hours = String(fecha.getHours()).padStart(2, '0');
      const minutes = String(fecha.getMinutes()).padStart(2, '0');
      setFormDataCupon(prev => ({ ...prev, fecha_vencimiento: `${year}-${month}-${day}T${hours}:${minutes}` }));
    }
  }, [formDataCupon.fecha_inicio, formDataCupon.duracion_dias]);

  useEffect(() => {
    const cargarHistorial = async () => {
      const hoy = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('envios_marketing')
        .select('cliente_id')
        .gte('fecha_envio', `${hoy}T00:00:00`);
      
      if (!error && data) {
        const conteo = {};
        data.forEach(envio => {
          conteo[envio.cliente_id] = (conteo[envio.cliente_id] || 0) + 1;
        });
        setHistorialEnvios(conteo);
      }

      const { data: histDet, error: histErr } = await supabase
        .from('envios_marketing')
        .select('cliente_id, producto_id, fecha_envio')
        .order('fecha_envio', { ascending: false })
        .limit(10);
      
      if (!histErr && histDet) setHistorialDetallado(histDet);
    };
    cargarHistorial();
  }, []);

  useEffect(() => {
    if (formDataPublicidad.fecha_inicio && formDataPublicidad.duracion_dias) {
      const fecha = new Date(formDataPublicidad.fecha_inicio);
      fecha.setDate(fecha.getDate() + parseInt(formDataPublicidad.duracion_dias));
      setFormDataPublicidad(prev => ({ ...prev, fecha_fin: fecha.toISOString().split('T')[0] }));
    }
  }, [formDataPublicidad.fecha_inicio, formDataPublicidad.duracion_dias]);

  // ✅ ALERTAS DE VENCIMIENTO: solo cupones (publicidad se movió a Alertas)
  useEffect(() => {
    const alertas = [];
    const hoy = new Date();
    cupones.forEach(cupon => {
      if (cupon.estado === 'activo' && cupon.fecha_vencimiento) {
        const fin = new Date(cupon.fecha_vencimiento);
        const dias = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
        if (dias <= 3 && dias >= 0) alertas.push({ tipo: 'Cupón', titulo: cupon.titulo, dias, fecha: cupon.fecha_vencimiento });
      }
    });
    setAlertasVencimiento(alertas);
  }, [cupones]);

  useEffect(() => {
    const cargarDatos = async () => {
      let plts = [], cpons = [], pubs = [], prods = [], clts = [], etqs = [], mvConfig = {};
      if (supabase) {
        const [{ data: pData }, { data: cData }, { data: puData }, { data: prData }, { data: clData }, { data: etData }, { data: mvData }] = await Promise.all([
          supabase.from('plantillas').select('*'), supabase.from('cupones').select('*'),
          supabase.from('publicidad').select('*'), supabase.from('productos').select('*'),
          supabase.from('clientes').select('*'), supabase.from('settings').select('valor').eq('clave', 'etiquetas').single(),
          supabase.from('marketing_config').select('valor').eq('clave', 'mas_vendidos').single()
        ]);
        if (pData) plts = pData; if (cData) cpons = cData; if (puData) pubs = puData;
        if (prData) prods = prData; if (clData) clts = clData; if (etData?.valor) etqs = etData.valor;
        if (mvData?.valor) mvConfig = mvData.valor;
      }
      if (plts.length === 0) { const d = localStorage.getItem('voltech_plantillas'); if (d) plts = JSON.parse(d); }
      if (cpons.length === 0) { const d = localStorage.getItem('voltech_cupones'); if (d) cpons = JSON.parse(d); }
      if (pubs.length === 0) { const d = localStorage.getItem('voltech_publicidad'); if (d) pubs = JSON.parse(d); }
      if (prods.length === 0) { const d = localStorage.getItem('voltech_productos'); if (d) prods = JSON.parse(d); }
      if (clts.length === 0) { const d = localStorage.getItem('voltech_clientes'); if (d) clts = JSON.parse(d); }
      if (etqs.length === 0) { const d = localStorage.getItem('voltech_etiquetas'); if (d) etqs = JSON.parse(d); }
      if (Object.keys(mvConfig).length === 0) { const d = localStorage.getItem('voltech_mas_vendidos_config'); if (d) mvConfig = JSON.parse(d); }

      if (Object.keys(mvConfig).length > 0) setMasVendidosConfig(mvConfig);

      // ✅ VENDEDOR solo ve SUS clientes; admin/socio ven todos
      let clientesFiltrados = clts;
      if (!esAdmin && !esSocio && usuarioActual?.nombre) {
        clientesFiltrados = clts.filter(c => c.registradoPor === usuarioActual.nombre);
      }

      setPlantillas(plts); setCupones(cpons); setPublicidad(pubs);
      setProductos(prods); setClientes(clientesFiltrados); setEtiquetas(etqs);
      // ❌ ELIMINADO: construcción de campanasCalendario
    };
    cargarDatos();
  }, [esAdmin, esSocio, usuarioActual]);

  useEffect(() => {
    if (!productoSeleccionado || clientesSeleccionados.length === 0) {
      setMensajePersonalizadoWa('');
      return;
    }
    
    const primerCliente = clientes.find(c => String(c.id) === String(clientesSeleccionados[0]));
    const nombreCliente = primerCliente ? primerCliente.nombre : '{{nombre_cliente}}';
    const nombreProducto = productoSeleccionado.nombre || productoSeleccionado.plataforma || 'Producto';
    const precioProducto = precioPromocion ? parseFloat(precioPromocion).toFixed(2) : (Number(productoSeleccionado.precioDetal) || 0).toFixed(2);
    
    let mensaje = `¡Hola ${nombreCliente}! \n\n`;
    
    if (plantillaWhatsappSeleccionada) {
      const plantilla = plantillas.find(p => String(p.id) === String(plantillaWhatsappSeleccionada));
      if (plantilla && plantilla.nombre) {
        mensaje += ` *${plantilla.nombre}* 🔥\n\n`;
      }
    }
    
    mensaje += ` *Producto:* ${nombreProducto}\n`;
    mensaje += `💰 *Precio Especial:* $${precioProducto}\n`;
    mensaje += `🔗 *Ver promoción:* ${window.location.origin}/catalogo?producto=${productoSeleccionado.id}\n\n`;
    
    if (plantillaWhatsappSeleccionada) {
      const plantilla = plantillas.find(p => String(p.id) === String(plantillaWhatsappSeleccionada));
      if (plantilla && plantilla.contenido && plantilla.contenido.trim() !== '' && plantilla.contenido.trim() !== 'Sin plantilla') {
        mensaje += `${plantilla.contenido}\n\n`;
      }
    }
    
    if (plantillaContactoWaSeleccionada) {
      const plantilla = plantillas.find(p => String(p.id) === String(plantillaContactoWaSeleccionada));
      if (plantilla && plantilla.contenido && plantilla.contenido.trim() !== '' && plantilla.contenido.trim() !== 'Sin plantilla') {
        mensaje += `${plantilla.contenido}`;
      }
    } else {
      mensaje += `📲 ¡Escríbenos para coordinar tu entrega y aprovechar esta oferta!`;
    }
    
    setMensajePersonalizadoWa(mensaje.trim());
  }, [productoSeleccionado, precioPromocion, plantillaWhatsappSeleccionada, plantillaContactoWaSeleccionada, clientesSeleccionados, clientes, plantillas]);

  useEffect(() => {
    if (!productoMarketplace) {
      setTextoMarketplace('');
      return;
    }
    
    const nombreProducto = productoMarketplace.nombre || productoMarketplace.plataforma || 'Producto';
    const precioProducto = precioPromocionMarketplace ? parseFloat(precioPromocionMarketplace).toFixed(2) : (Number(productoMarketplace.precioDetal) || 0).toFixed(2);
    
    let mensaje = '';
    
    if (plantillaMarketplaceSeleccionada) {
      const plantilla = plantillas.find(p => String(p.id) === String(plantillaMarketplaceSeleccionada));
      if (plantilla && plantilla.nombre) {
        mensaje += `${plantilla.nombre.toUpperCase()}\n\n`;
      }
    }
    
    mensaje += ` ${nombreProducto.toUpperCase()} 🔥\n`;
    mensaje += ` PRECIO: $${precioProducto}\n\n`;
    
    if (plantillaMarketplaceSeleccionada) {
      const plantilla = plantillas.find(p => String(p.id) === String(plantillaMarketplaceSeleccionada));
      if (plantilla && plantilla.contenido && plantilla.contenido.trim() !== '' && plantilla.contenido.trim() !== 'Sin plantilla') {
        mensaje += `${plantilla.contenido}\n\n`;
      }
    }
    
    mensaje += `📍 ENTREGAS Y CONTACTO:\n`;
    if (plantillaContactoMpSeleccionada) {
      const plantilla = plantillas.find(p => String(p.id) === String(plantillaContactoMpSeleccionada));
      if (plantilla && plantilla.contenido && plantilla.contenido.trim() !== '' && plantilla.contenido.trim() !== 'Sin plantilla') {
        mensaje += `${plantilla.contenido}`;
      } else {
        mensaje += `Entregas personales o envíos a todo el país. ¡Escríbenos al DM!`;
      }
    } else {
      mensaje += `Entregas personales o envíos a todo el país. ¡Escríbenos al DM!`;
    }
    
    setTextoMarketplace(mensaje.trim());
  }, [productoMarketplace, precioPromocionMarketplace, plantillaMarketplaceSeleccionada, plantillaContactoMpSeleccionada, plantillas]);

  const handleImageUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no debe pesar más de 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setImagenPreview(reader.result); setFormDataPublicidad({...formDataPublicidad, url_imagen: reader.result}); };
    reader.readAsDataURL(file);
  };

  const guardarPublicidad = async () => {
    if (!esAdmin) return toast.error('Solo el administrador puede gestionar publicidad');
    if (!formDataPublicidad.titulo || !formDataPublicidad.url_imagen || !formDataPublicidad.fecha_inicio || !formDataPublicidad.fecha_fin) {
      return toast.error('Título, imagen y fechas son obligatorios');
    }
    const nuevaPublicidad = { id: publicidadEditando ? publicidadEditando.id : `pub-${Date.now()}`, ...formDataPublicidad, fecha_creacion: new Date().toISOString() };
    if (supabase) { const { error } = await supabase.from('publicidad').upsert(nuevaPublicidad, { onConflict: 'id' }); if (error) toast.error('Error: ' + error.message); }
    const actualizadas = publicidadEditando ? publicidad.map(p => p.id === publicidadEditando.id ? nuevaPublicidad : p) : [...publicidad, nuevaPublicidad];
    setPublicidad(actualizadas); localStorage.setItem('voltech_publicidad', JSON.stringify(actualizadas));
    toast.success('Publicidad guardada'); setShowPublicidadForm(false); setPublicidadEditando(null);
  };

    const construirResumen = (pub) => {
    const clicks = pub.clicks || 0;
    const monto = clicks * (pub.costo_por_click || 0);
    return `📊 *RESUMEN DE PUBLICIDAD*\n\n*🏢 Anunciante:* ${pub.anunciante || pub.titulo}\n*📢 Campaña:* ${pub.titulo}\n\n👆 *Clicks:* ${clicks}\n💵 *Costo por click:* $${Number(pub.costo_por_click || 0).toFixed(2)}\n💰 *Total a pagar:* $${monto.toFixed(2)}\n\n📅 ${new Date().toLocaleDateString('es-VE')}\n\n¡Gracias por confiar en VOLTECH STOREVE!`;
  };

  const enviarResumenPub = (pub) => {
    setResumenData({ abierto: true, texto: construirResumen(pub), telefono: pub.telefono_anunciante || '', titulo: 'Resumen de Publicidad', cliente: pub.anunciante || pub.titulo });
  };

  const enviarResumenDiario = () => {
    const activas = publicidad.filter(p => p.estado === 'activo');
    if (activas.length === 0) { toast.error('No hay publicidades activas'); return; }
    let total = 0;
    let msg = `📊 *RESUMEN DIARIO DE PUBLICIDAD*\n📅 ${new Date().toLocaleDateString('es-VE')}\n\n`;
    activas.forEach(p => { const c = p.clicks || 0; const m = c * (p.costo_por_click || 0); total += m; msg += `• *${p.titulo}*${p.anunciante ? ` (${p.anunciante})` : ''}: ${c} clicks = $${m.toFixed(2)}\n`; });
    msg += `\n💰 *TOTAL DEL DÍA:* $${total.toFixed(2)}`;
    setResumenData({ abierto: true, texto: msg, telefono: '', titulo: 'Resumen Diario de Publicidad', cliente: 'VOLTECH STOREVE' });
    if (agregarNotificacion) agregarNotificacion({ tipo: 'resumen_publicidad', titulo: '📊 Resumen diario generado', mensaje: `Total del día: $${total.toFixed(2)} en ${activas.length} campañas`, detalle: 'Resumen copiado al portapapeles', usuario_id: 'admin' });
  };

  const programarRecordatorio = () => {
    if (agregarNotificacion) {
      agregarNotificacion({ tipo: 'recordatorio_resumen', titulo: '⏰ Recordatorio: enviar resumen diario', mensaje: 'No olvides enviar el resumen de clicks a tus anunciantes', detalle: 'Publicidad → Resumen Diario', usuario_id: 'admin' });
      toast.success('Recordatorio creado');
    }
  };

  const guardarCupon = async () => {
    if (!puedeGestionar) return toast.error('Solo admin/socio pueden crear cupones');
    if (!formDataCupon.titulo || !formDataCupon.descripcion || !formDataCupon.fecha_inicio || !formDataCupon.fecha_vencimiento) {
      return toast.error('Completa los campos obligatorios (Título, Descripción, Fechas)');
    }
    if (formDataCupon.tipo_aplicacion !== 'todos' && formDataCupon.producto_ids.length === 0) {
      return toast.error('Debes seleccionar al menos un producto para este tipo de cupón');
    }

    const codigo = formDataCupon.codigo || generarCodigoUnico(formDataCupon.titulo);
    const nuevoCupon = {
      id: cuponEditando ? cuponEditando.id : crypto.randomUUID(),
      titulo: formDataCupon.titulo,
      descripcion: formDataCupon.descripcion,
      codigo: codigo,
      tipo_descuento: formDataCupon.tipo_descuento,
      valor_descuento: formDataCupon.valor_descuento,
      tipo_aplicacion: formDataCupon.tipo_aplicacion,
      producto_ids: formDataCupon.producto_ids,
      excluir_ofertas: formDataCupon.excluir_ofertas,
      monto_minimo: formDataCupon.monto_minimo,
      fecha_inicio: formDataCupon.fecha_inicio,
      duracion_dias: formDataCupon.duracion_dias,
      fecha_vencimiento: formDataCupon.fecha_vencimiento,
      limite_usos: formDataCupon.limite_usos,
      max_usos: formDataCupon.max_usos,
      uso_por_cliente: formDataCupon.uso_por_cliente,
      estado: formDataCupon.estado,
      usos: cuponEditando?.usos || 0,
      descuento_total: cuponEditando?.descuento_total || 0,
      fecha_creacion: cuponEditando?.fecha_creacion || new Date().toISOString(),
      creado_por: cuponEditando?.creado_por || usuarioActual?.nombre || 'Admin'
    };

    if (supabase) {
      const { error } = await supabase.from('cupones').upsert(nuevoCupon, { onConflict: 'id' });
      if (error) {
        toast.error('Error al guardar: ' + error.message);
        return;
      }
    }

    const actualizados = cuponEditando 
      ? cupones.map(c => c.id === cuponEditando.id ? nuevoCupon : c)
      : [...cupones, nuevoCupon];
    
    setCupones(actualizados);
    localStorage.setItem('voltech_cupones', JSON.stringify(actualizados));
    toast.success(cuponEditando ? 'Cupón actualizado' : `Cupón creado: ${codigo}`);
    setShowCuponForm(false);
    setCuponEditando(null);
    setBusquedaProductoCupon('');
    setFormDataCupon({
      titulo: '', descripcion: '', codigo: '', 
      tipo_descuento: 'porcentaje', valor_descuento: 20, tipo_aplicacion: 'todos',
      producto_ids: [], excluir_ofertas: false, monto_minimo: 0, 
      fecha_inicio: '', duracion_dias: 30, fecha_vencimiento: '',
      limite_usos: 'ilimitado', max_usos: 100, uso_por_cliente: 'una_vez', estado: 'activo',
      usos: 0, descuento_total: 0
    });
  };

  const generarCodigoUnico = (titulo) => {
    const codigoBase = titulo.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${codigoBase}-${random}`;
  };

  const guardarPlantilla = async () => {
    if (!puedeGestionar) return toast.error('Solo admin/socio pueden crear plantillas');
    if (!formDataPlantilla.nombre || !formDataPlantilla.contenido) return toast.error('Nombre y contenido son obligatorios');
    const nuevaPlantilla = { id: plantillaEditando ? plantillaEditando.id : Date.now().toString(), ...formDataPlantilla, esGlobal: !!(formDataPlantilla.esGlobal && esAdmin), creadoPor: usuarioActual?.nombre || 'Desconocido', fechaCreacion: new Date().toISOString() };
    if (supabase) await supabase.from('plantillas').upsert(nuevaPlantilla, { onConflict: 'id' });
    const actualizadas = plantillaEditando ? plantillas.map(p => p.id === plantillaEditando.id ? nuevaPlantilla : p) : [...plantillas, nuevaPlantilla];
    setPlantillas(actualizadas); localStorage.setItem('voltech_plantillas', JSON.stringify(actualizadas));
    toast.success('Plantilla guardada'); setFormDataPlantilla({ nombre: '', tipo: 'whatsapp', categoria: 'mensaje', contenido: '' });
    setShowPlantillaForm(false); setPlantillaEditando(null);
  };

  const eliminarPlantilla = async (id) => {
    if (!puedeGestionar) return toast.error('Solo admin/socio pueden eliminar plantillas');
    if (!confirm('¿Eliminar esta plantilla?')) return;
    if (supabase) await supabase.from('plantillas').delete().eq('id', id);
    const actualizadas = plantillas.filter(p => p.id !== id);
    setPlantillas(actualizadas); localStorage.setItem('voltech_plantillas', JSON.stringify(actualizadas));
    toast.success('Plantilla eliminada');
  };

  const editarCupon = (cupon) => {
    if (!puedeGestionar) return toast.error('Solo admin/socio pueden editar cupones');
    setCuponEditando(cupon);
    setFormDataCupon({
      titulo: cupon.titulo,
      descripcion: cupon.descripcion,
      codigo: cupon.codigo,
      tipo_descuento: cupon.tipo_descuento || 'porcentaje',
      valor_descuento: cupon.valor_descuento || 20,
      tipo_aplicacion: cupon.tipo_aplicacion || 'todos',
      producto_ids: cupon.producto_ids || [],
      excluir_ofertas: cupon.excluir_ofertas || false,
      monto_minimo: cupon.monto_minimo || 0,
      fecha_inicio: cupon.fecha_inicio,
      duracion_dias: cupon.duracion_dias || 30,
      fecha_vencimiento: cupon.fecha_vencimiento,
      limite_usos: cupon.limite_usos || 'ilimitado',
      max_usos: cupon.max_usos || 100,
      uso_por_cliente: cupon.uso_por_cliente || 'una_vez',
      estado: cupon.estado || 'activo'
    });
    setShowCuponForm(true);
    setCuponesOpen(true);
  };

  const eliminarCupon = async (id) => {
    if (!puedeGestionar) return toast.error('Solo admin/socio pueden eliminar cupones');
    if (!confirm('¿Estás seguro de eliminar este cupón?')) return;
    if (supabase) await supabase.from('cupones').delete().eq('id', id);
    const actualizados = cupones.filter(c => c.id !== id);
    setCupones(actualizados);
    localStorage.setItem('voltech_cupones', JSON.stringify(actualizados));
    toast.success('Cupón eliminado');
  };

  const toggleEstadoCupon = async (cupon) => {
    if (!puedeGestionar) return toast.error('Solo admin/socio pueden activar/desactivar cupones');
    const nuevoEstado = cupon.estado === 'activo' ? 'inactivo' : 'activo';
    if (supabase) {
      await supabase.from('cupones').update({ estado: nuevoEstado }).eq('id', cupon.id);
    }
    const actualizados = cupones.map(c => c.id === cupon.id ? { ...c, estado: nuevoEstado } : c);
    setCupones(actualizados);
    localStorage.setItem('voltech_cupones', JSON.stringify(actualizados));
    toast.success(nuevoEstado === 'activo' ? 'Cupón activado' : 'Cupón desactivado');
  };

  const copiarCodigo = (codigo) => {
    navigator.clipboard.writeText(codigo);
    toast.success('Código copiado');
  };

  const toggleProductoCupon = (productoId, isSingle) => {
    if (isSingle) {
      setFormDataCupon({ ...formDataCupon, producto_ids: [productoId] });
    } else {
      const actuales = formDataCupon.producto_ids;
      setFormDataCupon({ 
        ...formDataCupon, 
        producto_ids: actuales.includes(productoId) 
          ? actuales.filter(id => id !== productoId) 
          : [...actuales, productoId] 
      });
    }
  };

  const handleTipoAplicacionChange = (value) => {
    if (value === 'producto_gratis') {
      setFormDataCupon(prev => ({ 
        ...prev, 
        tipo_aplicacion: value, 
        tipo_descuento: 'gratis', 
        valor_descuento: 100 
      }));
    } else {
      setFormDataCupon(prev => ({ 
        ...prev, 
        tipo_aplicacion: value,
        tipo_descuento: prev.tipo_descuento === 'gratis' ? 'porcentaje' : prev.tipo_descuento 
      }));
    }
  };

  const registrarEnvio = async (clienteId, tipo, productoId, plantillaId) => {
    const envio = { cliente_id: String(clienteId), vendedor_id: usuarioActual?.nombre || 'Admin', tipo, producto_id: String(productoId), plantilla_id: String(plantillaId), fecha_envio: new Date().toISOString() };
    if (supabase) await supabase.from('envios_marketing').insert(envio);
    setHistorialEnvios(prev => ({ ...prev, [clienteId]: (prev[clienteId] || 0) + 1 }));
  };

  const filtrarClientes = () => {
    let resultado = clientes;
    if (filtroEtiqueta) resultado = resultado.filter(c => c.etiquetas?.includes(filtroEtiqueta));
    if (busquedaClientes) {
      const busqueda = busquedaClientes.toLowerCase();
      resultado = resultado.filter(c => c.nombre.toLowerCase().includes(busqueda) || (c.telefono && c.telefono.includes(busqueda)));
    }
    return resultado;
  };

  const toggleClienteSeleccion = (clienteId) => {
    const enviosHoy = historialEnvios[clienteId] || 0;
    if (enviosHoy >= 2) {
      toast.error('Este cliente ya alcanzó el límite de 2 envíos hoy');
      return;
    }
    setClientesSeleccionados(prev => prev.includes(clienteId) ? prev.filter(id => id !== clienteId) : [...prev, clienteId]);
  };

  const lanzarDifusion = async () => {
    if (clientesSeleccionados.length === 0) return toast.error('Selecciona al menos un cliente');
    if (!mensajePersonalizadoWa) return toast.error('Genera el mensaje primero');
    
    const primerCliente = clientes.find(c => String(c.id) === String(clientesSeleccionados[0]));
    if (primerCliente) {
      abrirWhatsApp(primerCliente.telefono, mensajePersonalizadoWa);
      
      for (const clienteId of clientesSeleccionados) {
        await registrarEnvio(clienteId, 'whatsapp', productoSeleccionado?.id, plantillaWhatsappSeleccionada);
      }
      toast.success(`¡Difusión iniciada para ${clientesSeleccionados.length} clientes!`);
      setClientesSeleccionados([]);
    }
  };

  const plantillasFiltradas = filtroTipoPlantilla === 'todas' ? plantillas : plantillas.filter(p => p.tipo === filtroTipoPlantilla);
  const plantillasInfoContacto = plantillas.filter(p => p.tipo === 'info_contacto');

  // ❌ ELIMINADO: diasDelMes, primerDiaSemana, diasArray, diasVacios (del calendario)

  const urlDestinoType = ((formDataPublicidad.url_destino || '').startsWith('/producto/') || (formDataPublicidad.url_destino || '').startsWith('/catalogo?producto=')) ? 'producto' : 'manual';

  const productosParaCupon = productos.filter(p => 
    (p.plataforma || p.nombre || '').toLowerCase().includes(busquedaProductoCupon.toLowerCase()) ||
    (p.marca || '').toLowerCase().includes(busquedaProductoCupon.toLowerCase())
  );

  // ✅ TABS POR ROL: vendedor SIN Publicidad ni Más Vendidos; Calendario ELIMINADO
  const tabsDisponibles = [
    { id: 'whatsapp', icon: WhatsAppIcon, label: 'WhatsApp' },
    { id: 'marketplace', icon: FileText, label: 'Marketplace' },
    { id: 'cupones', icon: Ticket, label: 'Cupones' },
    ...((esAdmin || esSocio) ? [
      { id: 'publicidad', icon: Megaphone, label: 'Publicidad' },
      { id: 'mas-vendidos', icon: TrendingUp, label: 'Más Vendidos' },
    ] : []),
  ];

  return (
    <div className="space-y-6">
      <Toaster position="top-right" toastOptions={{ style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' } }} />
      

      {alertasVencimiento.length > 0 && (
        <div className="bg-gradient-to-r from-voltech-warning/20 to-voltech-error/20 border border-voltech-warning/50 rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-5 h-5 text-voltech-warning" /><h3 className="text-sm font-bold text-white">️ Campañas por Vencer</h3></div>
          <div className="space-y-2">
            {alertasVencimiento.map((alerta, idx) => (
              <div key={idx} className="flex items-center justify-between bg-voltech-dark/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-voltech-purple/20 text-voltech-purple">{alerta.tipo}</span>
                  <p className="text-sm text-white font-medium">{alerta.titulo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${alerta.dias === 0 ? 'text-voltech-error' : alerta.dias <= 1 ? 'text-voltech-warning' : 'text-voltech-success'}`}>{alerta.dias === 0 ? '¡Vence hoy!' : `${alerta.dias} días`}</span>
                  <Calendar className="w-4 h-4 text-voltech-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Panel de Marketing</h1><p className="text-sm text-voltech-muted mt-1">Gestiona tus campañas, mensajes y cupones</p></div>
      </div>

      <div className="border-b border-voltech-border">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:gap-6 w-full gap-y-2 pb-2 md:pb-1">
          {tabsDisponibles.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`justify-center md:justify-start py-2.5 md:py-0 md:pb-3 flex items-center gap-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap rounded-lg md:rounded-none border-b-2 ${activeTab === tab.id ? 'text-voltech-cyan bg-voltech-cyan/10 border-transparent md:bg-transparent md:border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        
        {activeTab === 'whatsapp' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div><h2 className="text-xl font-bold text-white">Gestión de WhatsApp</h2><p className="text-sm text-voltech-muted mt-1">Crea y envía mensajes por WhatsApp</p></div>
              <div className="flex gap-2">
                <button onClick={() => setWhatsappOpen(!whatsappOpen)} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2"><Plus className="w-4 h-4" /> Nueva Difusión</button>
                {puedeGestionar && (<button onClick={() => { setFormDataPlantilla({ ...formDataPlantilla, tipo: 'whatsapp' }); setShowPlantillaForm(!showPlantillaForm); }} className="px-4 py-2 bg-voltech-purple/20 text-voltech-purple rounded-lg text-sm hover:bg-voltech-purple/30 transition-colors flex items-center gap-2"><Plus className="w-4 h-4" /> Plantilla WhatsApp</button>)}
              </div>
            </div>

            {showPlantillaForm && puedeGestionar && (
              <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                  <div className="flex items-center gap-3"><WhatsAppIcon className="w-5 h-5 text-[#25D366]" /><h3 className="text-lg font-semibold text-white">Nueva Plantilla de WhatsApp</h3></div>
                  <button onClick={() => { setShowPlantillaForm(false); setPlantillaEditando(null); }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 px-2.5 py-1 rounded-lg transition-colors"><span>✕</span> Cerrar</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" value={formDataPlantilla.nombre} onChange={(e) => setFormDataPlantilla({ ...formDataPlantilla, nombre: e.target.value, tipo: 'whatsapp' })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Nombre del texto" />
                  <select value={formDataPlantilla.categoria} onChange={(e) => setFormDataPlantilla({ ...formDataPlantilla, categoria: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="mensaje">Mensaje</option><option value="oferta">Oferta</option><option value="contacto">Contacto</option></select>
                </div>
                <textarea value={formDataPlantilla.contenido} onChange={(e) => setFormDataPlantilla({ ...formDataPlantilla, contenido: e.target.value, tipo: 'whatsapp' })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm h-24 resize-none" placeholder="Contenido del mensaje..." />
                {esAdmin && (<label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formDataPlantilla.esGlobal} onChange={(e) => setFormDataPlantilla({ ...formDataPlantilla, esGlobal: e.target.checked })} className="w-4 h-4 rounded border-voltech-border text-voltech-cyan" /><span className="text-xs text-voltech-muted">⭐ Plantilla Global / Oficial</span></label>)}
                <div className="flex gap-2">
                  <button onClick={guardarPlantilla} className="px-4 py-2 bg-voltech-success/20 text-voltech-success rounded-lg text-sm hover:bg-voltech-success/30 flex items-center gap-2"><Save className="w-4 h-4" /> Guardar</button>
                  <button onClick={() => { setShowPlantillaForm(false); setPlantillaEditando(null); }} className="px-4 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
                </div>
              </div>
            )}

            {whatsappOpen && (
            <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
              <div className="p-4 bg-voltech-dark/30 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><WhatsAppIcon className="w-5 h-5 text-[#25D366]" /><h3 className="text-lg font-semibold text-white">Nueva Difusión por WhatsApp</h3></div>
                  <button onClick={() => setWhatsappOpen(false)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 px-2.5 py-1 rounded-lg transition-colors"><span>✕</span> Cerrar</button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-voltech-muted mb-2">1. Seleccionar Producto</label>
                      <select value={productoSeleccionado ? String(productoSeleccionado.id) : ''} onChange={(e) => { const prod = productos.find(p => String(p.id) === String(e.target.value)); setProductoSeleccionado(prod || null); setPrecioPromocion(''); }} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                        <option value="">Buscar producto...</option>
                        {productos.filter(p => p.cantidad > 0).map(p => (<option key={p.id} value={String(p.id)}>{p.plataforma || p.producto || p.nombre || 'Sin nombre'} - ${Number(p.precioDetal || 0).toFixed(2)}</option>))}
                      </select>
                    </div>
                    {productoSeleccionado && (
                      <>
                        <div>
                          <label className="text-xs text-voltech-muted block mb-1">💰 Precio para esta promoción (opcional):</label>
                          <input type="number" step="0.01" placeholder={Number(productoSeleccionado.precioDetal || 0).toFixed(2)} value={precioPromocion} onChange={(e) => setPrecioPromocion(e.target.value)} className="input-voltech w-full rounded px-3 py-1.5 text-xs" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-voltech-muted mb-2">2. Plantilla WhatsApp (Opcional)</label>
                            <select value={plantillaWhatsappSeleccionada} onChange={(e) => setPlantillaWhatsappSeleccionada(e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                              <option value="">Sin plantilla</option>
                              {plantillas.filter(p => p.tipo === 'whatsapp').map(p => (<option key={p.id} value={String(p.id)}>{p.nombre}{p.esGlobal ? ' ⭐' : ''}</option>))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-voltech-muted mb-2">3. Plantilla de Contacto (Opcional)</label>
                            <select value={plantillaContactoWaSeleccionada} onChange={(e) => setPlantillaContactoWaSeleccionada(e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                              <option value="">Sin plantilla</option>
                              {plantillasInfoContacto.map(p => (<option key={p.id} value={String(p.id)}>{p.nombre}{p.esGlobal ? ' ⭐' : ''}</option>))}
                            </select>
                          </div>
                        </div>
                        <div className="border border-voltech-border rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between p-3 bg-voltech-dark/30">
                            <span className="text-sm font-medium text-white flex items-center gap-2"><Users className="w-4 h-4 text-voltech-cyan" /> Destinatarios ({clientesSeleccionados.length} elegidos)</span>
                          </div>
                          <div className="p-3 space-y-2 border-t border-voltech-border">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
                              <input type="text" placeholder="Buscar por nombre o teléfono..." value={busquedaClientes} onChange={(e) => setBusquedaClientes(e.target.value)} className="input-voltech w-full rounded-lg pl-10 pr-4 py-2 text-sm" />
                            </div>
                            <label className="flex items-center gap-2 p-2 rounded bg-voltech-dark/50 cursor-pointer hover:bg-voltech-dark/70">
                              <input type="checkbox" className="w-4 h-4 rounded border-voltech-border text-voltech-cyan"
                                checked={filtrarClientes().length > 0 && filtrarClientes().every(c => clientesSeleccionados.includes(c.id))}
                                onChange={(e) => {
                                  const elegibles = filtrarClientes().filter(c => (historialEnvios[c.id] || 0) < 2);
                                  setClientesSeleccionados(e.target.checked ? [...new Set([...clientesSeleccionados, ...elegibles.map(c => c.id)])] : clientesSeleccionados.filter(id => !filtrarClientes().some(c => c.id === id)));
                                }} />
                              <span className="text-xs text-voltech-muted">Seleccionar Todos</span>
                            </label>
                            <div className="max-h-48 overflow-y-auto space-y-2">
                              {filtrarClientes().map(cliente => {
                                const enviosHoy = historialEnvios[cliente.id] || 0;
                                const puedeEnviar = enviosHoy < 2;
                                return (
                                  <label key={cliente.id} className={`flex items-start gap-3 p-2 rounded transition-colors ${!puedeEnviar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-voltech-dark/50'} ${clientesSeleccionados.includes(cliente.id) ? 'bg-voltech-cyan/10' : ''}`}>
                                    <input type="checkbox" checked={clientesSeleccionados.includes(cliente.id)} disabled={!puedeEnviar} onChange={() => toggleClienteSeleccion(cliente.id)} className="w-4 h-4 rounded border-voltech-border text-voltech-cyan mt-1" />
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm text-white font-medium">{cliente.nombre}</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${puedeEnviar ? 'bg-voltech-success/20 text-voltech-success' : 'bg-voltech-error/20 text-voltech-error'}`}>{puedeEnviar ? `${enviosHoy}/2 envíos` : 'Límite'}</span>
                                      </div>
                                      <p className="text-xs text-voltech-muted">📱 {cliente.telefono}</p>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="lg:col-span-5 space-y-3">
                    {productoSeleccionado ? (
                      <>
                        <label className="block text-sm font-medium text-voltech-muted">Vista Previa del Mensaje</label>
                        <BurbujaWA texto={mensajePersonalizadoWa} nombre={clientes.find(c => String(c.id) === String(clientesSeleccionados[0]))?.nombre || 'Cliente'} />
                        <div className="flex gap-3">
                          <button onClick={() => { navigator.clipboard.writeText(mensajePersonalizadoWa); toast.success('Mensaje copiado'); }} disabled={!mensajePersonalizadoWa} className="px-4 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-voltech-muted hover:text-white disabled:opacity-50">Copiar</button>
                          <button onClick={lanzarDifusion} disabled={clientesSeleccionados.length === 0 || !mensajePersonalizadoWa} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"><WhatsAppIcon className="w-4 h-4" /> Lanzar Difusión ({clientesSeleccionados.length})</button>
                        </div>
                      </>
                    ) : (
                      <div className="p-6 text-center text-sm text-voltech-muted bg-voltech-dark/30 border border-voltech-border rounded-lg">Selecciona un producto para ver la vista previa.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}

            <div className="bg-voltech-surface border border-voltech-border rounded-xl">
              <div className="p-6 border-b border-voltech-border"><h3 className="text-lg font-bold text-white flex items-center gap-2"><WhatsAppIcon className="w-5 h-5 text-[#25D366]" /> Mensajes Creados</h3></div>
              {plantillas.filter(p => p.tipo === 'whatsapp').length === 0 ? (
                <div className="p-12 text-center"><MessageSquare className="w-16 h-16 text-voltech-muted mx-auto mb-4 opacity-30" /><h3 className="text-lg font-semibold text-white mb-2">No hay mensajes</h3><p className="text-voltech-muted text-sm">Crea tu primer texto para WhatsApp</p></div>
              ) : (
                <div className="divide-y divide-voltech-border">
                  {plantillas.filter(p => p.tipo === 'whatsapp').map(p => (
                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-voltech-dark/30">
                      <div><p className="text-sm font-medium text-white">{p.nombre} {p.esGlobal && <span className="text-voltech-warning">⭐</span>}</p><p className="text-xs text-voltech-muted line-clamp-1">{p.contenido}</p><p className="text-[10px] text-voltech-muted">👤 {p.creadoPor || 'Desconocido'}</p></div>
                      {puedeGestionar && (<div className="flex gap-1"><button onClick={() => { setFormDataPlantilla(p); setPlantillaEditando(p); setShowPlantillaForm(true); }} className="p-2 text-voltech-cyan hover:bg-voltech-cyan/10 rounded"><Edit3 className="w-4 h-4" /></button><button onClick={() => eliminarPlantilla(p.id)} className="p-2 text-voltech-error hover:bg-voltech-error/10 rounded"><Trash2 className="w-4 h-4" /></button></div>)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-voltech-surface border border-voltech-border rounded-xl">
              <div className="p-6 border-b border-voltech-border"><h3 className="text-lg font-bold text-white">Historial de Envíos Recientes</h3></div>
              <div className="divide-y divide-voltech-border">
                {historialDetallado.length === 0 ? (
                  <div className="p-6 text-center text-sm text-voltech-muted">No hay envíos registrados aún.</div>
                ) : (
                  historialDetallado.map((envio, idx) => {
                    const cliente = clientes.find(c => String(c.id) === String(envio.cliente_id));
                    const prod = productos.find(p => String(p.id) === String(envio.producto_id));
                    return (
                      <div key={idx} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-voltech-cyan/20 flex items-center justify-center text-voltech-cyan text-xs font-bold">{cliente?.nombre?.charAt(0) || '?'}</div>
                          <div>
                            <p className="text-sm text-white font-medium">{cliente?.nombre || 'Cliente Desconocido'}</p>
                            <p className="text-xs text-voltech-muted">{new Date(envio.fecha_envio).toLocaleString('es-VE')} • {prod?.plataforma || 'Producto'}</p>
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
        
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div><h2 className="text-xl font-bold text-white">Gestión de Marketplace</h2><p className="text-sm text-voltech-muted mt-1">Genera textos listos para publicar</p></div>
              <div className="flex gap-2">
                <button onClick={() => setMarketplaceOpen(!marketplaceOpen)} className="px-4 py-2 bg-voltech-purple/20 text-voltech-purple rounded-lg text-sm hover:bg-voltech-purple/30 transition-colors flex items-center gap-2"><Plus className="w-4 h-4" /> Crear Publicación</button>
                {puedeGestionar && (<button onClick={() => { setFormDataPlantilla({ ...formDataPlantilla, tipo: 'marketplace' }); setShowPlantillaForm(!showPlantillaForm); }} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2"><Plus className="w-4 h-4" /> Plantilla Marketplace</button>)}
              </div>
            </div>

            {showPlantillaForm && puedeGestionar && (
              <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                  <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-voltech-purple" /><h3 className="text-lg font-semibold text-white">Nueva Plantilla de Marketplace</h3></div>
                  <button onClick={() => { setShowPlantillaForm(false); setPlantillaEditando(null); }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 px-2.5 py-1 rounded-lg transition-colors"><span>✕</span> Cerrar</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" value={formDataPlantilla.nombre} onChange={(e) => setFormDataPlantilla({ ...formDataPlantilla, nombre: e.target.value, tipo: 'marketplace' })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Nombre del texto" />
                  <select value={formDataPlantilla.categoria} onChange={(e) => setFormDataPlantilla({ ...formDataPlantilla, categoria: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="mensaje">Mensaje</option><option value="oferta">Oferta</option><option value="contacto">Contacto</option></select>
                </div>
                <textarea value={formDataPlantilla.contenido} onChange={(e) => setFormDataPlantilla({ ...formDataPlantilla, contenido: e.target.value, tipo: 'marketplace' })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm h-24 resize-none" placeholder="Contenido del texto..." />
                {esAdmin && (<label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formDataPlantilla.esGlobal} onChange={(e) => setFormDataPlantilla({ ...formDataPlantilla, esGlobal: e.target.checked })} className="w-4 h-4 rounded border-voltech-border text-voltech-cyan" /><span className="text-xs text-voltech-muted">⭐ Plantilla Global / Oficial</span></label>)}
                <div className="flex gap-2">
                  <button onClick={guardarPlantilla} className="px-4 py-2 bg-voltech-success/20 text-voltech-success rounded-lg text-sm hover:bg-voltech-success/30 flex items-center gap-2"><Save className="w-4 h-4" /> Guardar</button>
                  <button onClick={() => { setShowPlantillaForm(false); setPlantillaEditando(null); }} className="px-4 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
                </div>
              </div>
            )}

            {marketplaceOpen && (
            <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
              <div className="p-4 bg-voltech-dark/30 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-voltech-purple" /><h3 className="text-lg font-semibold text-white">Generador de Textos para Marketplace</h3></div>
                  <button onClick={() => setMarketplaceOpen(false)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 px-2.5 py-1 rounded-lg transition-colors"><span>✕</span> Cerrar</button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-voltech-muted mb-2">1. Seleccionar Producto</label>
                      <select value={productoMarketplace ? String(productoMarketplace.id) : ''} onChange={(e) => { const prod = productos.find(p => String(p.id) === String(e.target.value)); setProductoMarketplace(prod || null); setPrecioPromocionMarketplace(''); }} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                        <option value="">Buscar producto...</option>
                        {productos.map(p => (<option key={p.id} value={String(p.id)}>{p.plataforma || p.producto || p.nombre || 'Sin nombre'} - ${Number(p.precioDetal || 0).toFixed(2)}</option>))}
                      </select>
                    </div>
                    {productoMarketplace && (
                      <>
                        <div>
                          <label className="text-xs text-voltech-muted block mb-1">💰 Precio para esta promoción (opcional):</label>
                          <input type="number" step="0.01" placeholder={Number(productoMarketplace.precioDetal || 0).toFixed(2)} value={precioPromocionMarketplace} onChange={(e) => setPrecioPromocionMarketplace(e.target.value)} className="input-voltech w-full rounded px-3 py-1.5 text-xs" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-voltech-muted mb-2">2. Plantilla Marketplace (Opcional)</label>
                            <select value={plantillaMarketplaceSeleccionada} onChange={(e) => setPlantillaMarketplaceSeleccionada(e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                              <option value="">Sin plantilla</option>
                              {plantillas.filter(p => p.tipo === 'marketplace').map(p => (<option key={p.id} value={String(p.id)}>{p.nombre}{p.esGlobal ? ' ⭐' : ''}</option>))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-voltech-muted mb-2">3. Plantilla de Contacto (Opcional)</label>
                            <select value={plantillaContactoMpSeleccionada} onChange={(e) => setPlantillaContactoMpSeleccionada(e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                              <option value="">Sin plantilla</option>
                              {plantillasInfoContacto.map(p => (<option key={p.id} value={String(p.id)}>{p.nombre}{p.esGlobal ? ' ⭐' : ''}</option>))}
                            </select>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="lg:col-span-5 space-y-3">
                    {productoMarketplace ? (
                      <>
                        <label className="block text-sm font-medium text-voltech-muted">Vista Previa (Messenger)</label>
                        <BurbujaMessenger texto={textoMarketplace} nombre="Voltech" />
                        <button onClick={() => { navigator.clipboard.writeText(textoMarketplace); toast.success('Copiado'); }} disabled={!textoMarketplace} className="w-full h-12 px-4 py-2 bg-voltech-purple/20 text-voltech-purple rounded-xl text-sm font-medium hover:bg-voltech-purple/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                          <Copy className="w-4 h-4" /> Copiar Texto
                        </button>
                      </>
                    ) : (
                      <div className="p-6 text-center text-sm text-voltech-muted bg-voltech-dark/30 border border-voltech-border rounded-lg">Selecciona un producto para ver la vista previa.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}

            <div className="bg-voltech-surface border border-voltech-border rounded-xl">
              <div className="p-6 border-b border-voltech-border"><h3 className="text-lg font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-voltech-purple" /> Textos Creados</h3></div>
              {plantillas.filter(p => p.tipo === 'marketplace').length === 0 ? (
                <div className="p-12 text-center"><FileText className="w-16 h-16 text-voltech-muted mx-auto mb-4 opacity-30" /><h3 className="text-lg font-semibold text-white mb-2">No hay textos</h3><p className="text-voltech-muted text-sm">Crea tu primer texto para Marketplace</p></div>
              ) : (
                <div className="divide-y divide-voltech-border">
                  {plantillas.filter(p => p.tipo === 'marketplace').map(p => (
                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-voltech-dark/30">
                      <div><p className="text-sm font-medium text-white">{p.nombre} {p.esGlobal && <span className="text-voltech-warning">⭐</span>}</p><p className="text-xs text-voltech-muted line-clamp-1">{p.contenido}</p><p className="text-[10px] text-voltech-muted">👤 {p.creadoPor || 'Desconocido'}</p></div>
                      {puedeGestionar && (<div className="flex gap-1"><button onClick={() => { setFormDataPlantilla(p); setPlantillaEditando(p); setShowPlantillaForm(true); }} className="p-2 text-voltech-cyan hover:bg-voltech-cyan/10 rounded"><Edit3 className="w-4 h-4" /></button><button onClick={() => eliminarPlantilla(p.id)} className="p-2 text-voltech-error hover:bg-voltech-error/10 rounded"><Trash2 className="w-4 h-4" /></button></div>)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'cupones' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div><h2 className="text-xl font-bold text-white">Gestión de Cupones</h2><p className="text-sm text-voltech-muted mt-1">Crea y gestiona cupones de descuento</p></div>
              {puedeGestionar && (
                <button onClick={() => { setCuponEditando(null); setShowCuponForm(true); setCuponesOpen(true); }} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Crear Nuevo Cupón
                </button>
              )}
            </div>

            {showCuponForm && puedeGestionar && (
              <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden p-6">
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
                    <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-voltech-cyan" /> 
                      Información del Cupón
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-voltech-muted mb-1">Título *</label>
                        <input 
                          type="text" 
                          value={formDataCupon.titulo} 
                          onChange={(e) => setFormDataCupon({...formDataCupon, titulo: e.target.value})} 
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm" 
                          placeholder="Ej: Lanzamiento iPhone 15" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-voltech-muted mb-1">Código (opcional)</label>
                        <input 
                          type="text" 
                          value={formDataCupon.codigo} 
                          onChange={(e) => setFormDataCupon({...formDataCupon, codigo: e.target.value.toUpperCase().replace(/\s/g, '')})} 
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm" 
                          placeholder="Se genera automáticamente" 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-voltech-muted mb-1">Descripción *</label>
                        <textarea 
                          value={formDataCupon.descripcion} 
                          onChange={(e) => setFormDataCupon({...formDataCupon, descripcion: e.target.value})} 
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm h-20 resize-none" 
                          placeholder="20% de descuento en iPhone 15 - Edición limitada" 
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <Percent className="w-4 h-4 text-voltech-success" /> 
                      Configuración del Descuento
                    </h4>
                    
                    <div className="mb-4">
                      <label className="block text-xs text-voltech-muted mb-2">Tipo de Cupón (Aplicación)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formDataCupon.tipo_aplicacion === 'todos' ? 'bg-voltech-cyan/10 border-voltech-cyan' : 'bg-voltech-dark/30 border-voltech-border hover:border-voltech-cyan/50'}`}>
                          <input type="radio" name="tipo_aplicacion" checked={formDataCupon.tipo_aplicacion === 'todos'} onChange={() => handleTipoAplicacionChange('todos')} className="w-4 h-4 text-voltech-cyan" />
                          <div>
                            <span className="text-sm text-white font-medium">Todos los productos</span>
                            <p className="text-[10px] text-voltech-muted">Válido para cualquier artículo del carrito</p>
                          </div>
                        </label>
                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formDataCupon.tipo_aplicacion === 'producto_especifico' ? 'bg-voltech-cyan/10 border-voltech-cyan' : 'bg-voltech-dark/30 border-voltech-border hover:border-voltech-cyan/50'}`}>
                          <input type="radio" name="tipo_aplicacion" checked={formDataCupon.tipo_aplicacion === 'producto_especifico'} onChange={() => handleTipoAplicacionChange('producto_especifico')} className="w-4 h-4 text-voltech-cyan" />
                          <div>
                            <span className="text-sm text-white font-medium">1 Producto específico</span>
                            <p className="text-[10px] text-voltech-muted">Válido solo para un producto seleccionado</p>
                          </div>
                        </label>
                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formDataCupon.tipo_aplicacion === 'varios_productos' ? 'bg-voltech-cyan/10 border-voltech-cyan' : 'bg-voltech-dark/30 border-voltech-border hover:border-voltech-cyan/50'}`}>
                          <input type="radio" name="tipo_aplicacion" checked={formDataCupon.tipo_aplicacion === 'varios_productos'} onChange={() => handleTipoAplicacionChange('varios_productos')} className="w-4 h-4 text-voltech-cyan" />
                          <div>
                            <span className="text-sm text-white font-medium">Varios productos</span>
                            <p className="text-[10px] text-voltech-muted">Válido para una lista de productos seleccionados</p>
                          </div>
                        </label>
                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formDataCupon.tipo_aplicacion === 'producto_gratis' ? 'bg-voltech-cyan/10 border-voltech-cyan' : 'bg-voltech-dark/30 border-voltech-border hover:border-voltech-cyan/50'}`}>
                          <input type="radio" name="tipo_aplicacion" checked={formDataCupon.tipo_aplicacion === 'producto_gratis'} onChange={() => handleTipoAplicacionChange('producto_gratis')} className="w-4 h-4 text-voltech-cyan" />
                          <div>
                            <span className="text-sm text-white font-medium">Producto 100% Gratis</span>
                            <p className="text-[10px] text-voltech-muted">Hace que el producto seleccionado sea gratis</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {formDataCupon.tipo_aplicacion !== 'todos' && (
                      <div className="border-t border-voltech-border pt-4 mb-4">
                        <label className="block text-xs text-voltech-muted mb-2">
                          {formDataCupon.tipo_aplicacion === 'producto_especifico' ? 'Buscar y seleccionar el producto:' : 'Buscar y seleccionar los productos:'}
                        </label>
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
                          <input 
                            type="text" 
                            value={busquedaProductoCupon} 
                            onChange={(e) => setBusquedaProductoCupon(e.target.value)} 
                            placeholder="Escribir nombre, plataforma o marca..." 
                            className="input-voltech w-full rounded-lg pl-10 pr-4 py-2 text-sm" 
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-2 border border-voltech-border rounded-lg p-2 bg-voltech-surface">
                          {productosParaCupon.map(prod => {
                            const isSelected = formDataCupon.producto_ids.includes(prod.id);
                            const isSingle = formDataCupon.tipo_aplicacion === 'producto_especifico' || formDataCupon.tipo_aplicacion === 'producto_gratis';
                            return (
                              <label key={prod.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${isSelected ? 'bg-voltech-cyan/10 border border-voltech-cyan/30' : 'hover:bg-voltech-dark/50'}`}>
                                <input type={isSingle ? 'radio' : 'checkbox'} name="producto_seleccionado" checked={isSelected} onChange={() => toggleProductoCupon(prod.id, isSingle)} className="w-4 h-4 rounded border-voltech-border text-voltech-cyan" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white truncate">{prod.plataforma || prod.nombre || 'Sin nombre'}</p>
                                  <p className="text-xs text-voltech-muted">${Number(prod.precioDetal || prod.precioMayor || 0).toFixed(2)} • {prod.marca || 'Sin marca'}</p>
                                </div>
                              </label>
                            );
                          })}
                          {productosParaCupon.length === 0 && <p className="text-xs text-voltech-muted text-center py-2">No se encontraron productos</p>}
                        </div>
                        <p className="text-xs text-voltech-cyan mt-2">{formDataCupon.producto_ids.length} producto(s) seleccionado(s)</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs text-voltech-muted mb-1">Tipo de Descuento</label>
                        <select 
                          value={formDataCupon.tipo_descuento} 
                          disabled={formDataCupon.tipo_aplicacion === 'producto_gratis'} 
                          onChange={(e) => setFormDataCupon({...formDataCupon, tipo_descuento: e.target.value})} 
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="porcentaje">Porcentaje (%)</option>
                          <option value="monto_fijo">Monto Fijo ($)</option>
                          {formDataCupon.tipo_aplicacion === 'producto_gratis' && <option value="gratis">Gratis (100% off)</option>}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-voltech-muted mb-1">
                          {formDataCupon.tipo_descuento === 'porcentaje' ? 'Valor (%)' : formDataCupon.tipo_descuento === 'monto_fijo' ? 'Valor ($)' : 'Valor'} *
                        </label>
                        <input 
                          type="number" 
                          disabled={formDataCupon.tipo_aplicacion === 'producto_gratis'} 
                          value={formDataCupon.valor_descuento} 
                          onChange={(e) => setFormDataCupon({...formDataCupon, valor_descuento: parseFloat(e.target.value) || 0})} 
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed" 
                          placeholder={formDataCupon.tipo_descuento === 'porcentaje' ? '20' : '10.00'} 
                        />
                      </div>
                    </div>

                    <div className="bg-voltech-dark/30 border border-voltech-border rounded-lg p-4 space-y-4">
                      <div className="border-t border-voltech-border pt-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formDataCupon.excluir_ofertas} 
                            onChange={(e) => setFormDataCupon({...formDataCupon, excluir_ofertas: e.target.checked})} 
                            className="w-4 h-4 rounded border-voltech-border text-voltech-cyan" 
                          />
                          <div>
                            <span className="text-sm text-white font-medium">Excluir productos que ya tienen oferta activa</span>
                            <p className="text-xs text-voltech-muted">El cupón no se aplicará a productos que ya tengan un precio de oferta configurado.</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-voltech-warning" /> 
                      Validez y Límites
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs text-voltech-muted mb-1">Fecha y Hora de Inicio *</label>
                        <input 
                          type="datetime-local" 
                          value={formDataCupon.fecha_inicio} 
                          onChange={(e) => setFormDataCupon({...formDataCupon, fecha_inicio: e.target.value})} 
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-voltech-muted mb-1">Duración (días)</label>
                        <input 
                          type="number" 
                          min="1" 
                          value={formDataCupon.duracion_dias} 
                          onChange={(e) => setFormDataCupon({...formDataCupon, duracion_dias: parseInt(e.target.value) || 0})} 
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm" 
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs text-voltech-muted mb-1">Fecha y Hora de Vencimiento (Auto)</label>
                      <input 
                        type="datetime-local" 
                        value={formDataCupon.fecha_vencimiento} 
                        readOnly 
                        className="input-voltech w-full rounded-lg px-4 py-2 text-sm bg-voltech-dark/50" 
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-voltech-muted mb-1">Límite de Usos Totales</label>
                        <select 
                          value={formDataCupon.limite_usos} 
                          onChange={(e) => setFormDataCupon({...formDataCupon, limite_usos: e.target.value})} 
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                        >
                          <option value="ilimitado">Ilimitado</option>
                          <option value="limitado">Limitado</option>
                        </select>
                      </div>
                      {formDataCupon.limite_usos === 'limitado' && (
                        <div>
                          <label className="block text-xs text-voltech-muted mb-1">Máximo de Usos</label>
                          <input 
                            type="number" 
                            value={formDataCupon.max_usos} 
                            onChange={(e) => setFormDataCupon({...formDataCupon, max_usos: parseInt(e.target.value) || 0})} 
                            className="input-voltech w-full rounded-lg px-4 py-2 text-sm" 
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-voltech-border">
                    <button 
                      onClick={() => { setShowCuponForm(false); setCuponEditando(null); setBusquedaProductoCupon(''); }} 
                      className="px-6 py-3 rounded-lg font-medium bg-voltech-surface border border-voltech-border text-voltech-muted hover:text-white hover:border-voltech-cyan/50 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={guardarCupon} 
                      className="btn-neon flex-1 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" /> 
                      {cuponEditando ? 'Guardar Cambios' : 'Generar y Publicar Cupón'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-voltech-border">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-voltech-purple" /> 
                  Cupones Creados
                </h3>
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
                    const aplicaTexto = () => {
                      if (cupon.tipo_aplicacion === 'todos') return 'Todos los productos';
                      if (cupon.tipo_aplicacion === 'producto_gratis') return 'Producto 100% Gratis';
                      const count = (cupon.producto_ids || []).length;
                      return cupon.tipo_aplicacion === 'producto_especifico' ? '1 producto específico' : `${count} productos específicos`;
                    };
                    
                    const descuentoTexto = cupon.es_gratis || cupon.tipo_descuento === 'gratis' 
                      ? '100% GRATIS' 
                      : cupon.tipo_descuento === 'porcentaje' 
                        ? `${cupon.valor_descuento || cupon.valor}%` 
                        : `$${Number(cupon.valor_descuento || cupon.valor || 0).toFixed(2)}`;
                    
                    const estaVencido = new Date(cupon.fecha_vencimiento) < new Date();
                    const estaAgotado = cupon.limite_usos === 'limitado' && (cupon.usos || 0) >= (cupon.max_usos || 0);
                    const estadoDisplay = estaVencido ? 'Expirado' : estaAgotado ? 'Agotado' : cupon.estado === 'activo' ? 'Activo' : 'Inactivo';
                    const estadoColor = estaVencido || estaAgotado ? 'text-voltech-error' : cupon.estado === 'activo' ? 'text-voltech-success' : 'text-voltech-muted';
                    
                    return (
                      <div key={cupon.id} className="p-6 hover:bg-voltech-dark/30 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h4 className="text-lg font-bold text-white">{cupon.titulo}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColor === 'text-voltech-success' ? 'bg-voltech-success/20 text-voltech-success' : estadoColor === 'text-voltech-error' ? 'bg-voltech-error/20 text-voltech-error' : 'bg-voltech-muted/20 text-voltech-muted'}`}>
                                {estadoDisplay}
                              </span>
                              {cupon.excluir_ofertas && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-voltech-warning/20 text-voltech-warning flex items-center gap-1">
                                  <X className="w-3 h-3" /> Excluye ofertas
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-voltech-muted mb-2">{cupon.descripcion}</p>
                            {cupon.creado_por && <p className="text-[10px] text-voltech-muted mb-3">👤 Creado por: {cupon.creado_por}</p>}
                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Ticket className="w-4 h-4 text-voltech-cyan" />
                                <span className="font-mono font-bold text-voltech-cyan">{cupon.codigo}</span>
                                <button onClick={() => copiarCodigo(cupon.codigo)} className="p-1 hover:bg-voltech-border rounded">
                                  <Copy className="w-3 h-3 text-voltech-muted" />
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <Percent className="w-4 h-4 text-voltech-success" />
                                <span className="text-voltech-success font-bold">{descuentoTexto}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-voltech-purple" />
                                <span className="text-voltech-muted">{aplicaTexto()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-voltech-warning" />
                                <span className="text-voltech-muted">
                                  {new Date(cupon.fecha_inicio).toLocaleDateString('es-VE')} - {new Date(cupon.fecha_vencimiento).toLocaleDateString('es-VE')}
                                </span>
                              </div>
                            </div>
                          </div>
                          {puedeGestionar && (
                            <div className="flex items-center gap-2 ml-4">
                              <button 
                                onClick={() => toggleEstadoCupon(cupon)} 
                                className={`p-2 rounded-lg transition-colors ${cupon.estado === 'activo' ? 'hover:bg-voltech-warning/20 text-voltech-warning' : 'hover:bg-voltech-success/20 text-voltech-success'}`} 
                                title={cupon.estado === 'activo' ? 'Desactivar' : 'Activar'}
                              >
                                {cupon.estado === 'activo' ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => editarCupon(cupon)} 
                                className="p-2 hover:bg-voltech-cyan/20 rounded-lg transition-colors text-voltech-cyan" 
                                title="Editar"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => eliminarCupon(cupon.id)} 
                                className="p-2 hover:bg-voltech-error/20 rounded-lg transition-colors text-voltech-error" 
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-voltech-border">
                          <div>
                            <p className="text-xs text-voltech-muted mb-1">Veces Usado</p>
                            <p className="text-lg font-bold text-white">
                              {cupon.usos || 0} 
                              {cupon.limite_usos === 'limitado' && <span className="text-xs text-voltech-muted"> / {cupon.max_usos}</span>}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-voltech-muted mb-1">Descuento Total</p>
                            <p className="text-lg font-bold text-voltech-success">${Number(cupon.descuento_total || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-voltech-muted mb-1">Tasa de Conversión</p>
                            <p className="text-lg font-bold text-voltech-cyan">
                              {cupon.usos > 0 ? ((cupon.usos / (cupon.max_usos || 100)) * 100).toFixed(1) : 0}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-voltech-muted mb-1">Estado</p>
                            <p className={`text-sm font-medium ${estaVencido || estaAgotado ? 'text-voltech-error' : cupon.estado === 'activo' ? 'text-voltech-success' : 'text-voltech-muted'}`}>
                              {estaVencido ? 'Expirado' : estaAgotado ? 'Agotado' : cupon.estado === 'activo' ? 'Vigente' : 'Inactivo'}
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

        {activeTab === 'publicidad' && (esAdmin || esSocio) && (
                    <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Gestión de Publicidad</h2>
              </div>
              {esAdmin && (
                <button onClick={() => { setPublicidadEditando(null); setShowPublicidadForm(true); }} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2"><Plus className="w-4 h-4" /> Nueva Publicidad</button>
              )}
            </div>
            {showPublicidadForm && esAdmin && (
              <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">{publicidadEditando ? 'Editar Publicidad' : 'Crear Nueva Publicidad'}</h3>
                  <button onClick={() => { setShowPublicidadForm(false); setPublicidadEditando(null); }} className="p-2 hover:bg-voltech-border rounded-lg">
                    <X className="w-5 h-5 text-voltech-muted" />
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-voltech-muted mb-2">Título *</label>
                      <input type="text" value={formDataPublicidad.titulo} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, titulo: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-voltech-muted mb-2">Descripción</label>
                      <textarea value={formDataPublicidad.descripcion} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, descripcion: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 h-20" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-voltech-muted mb-2">URL de Destino</label>
                      <div className="space-y-2 mb-2">
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input type="radio" checked={urlDestinoType === 'manual'} onChange={() => setFormDataPublicidad({...formDataPublicidad, url_destino: ''})} /> URL Manual
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input type="radio" checked={urlDestinoType === 'producto'} onChange={() => setFormDataPublicidad({...formDataPublicidad, url_destino: '/catalogo?producto='})} /> Seleccionar producto
                        </label>
                      </div>
                      {urlDestinoType === 'producto' ? (
                        <select value={formDataPublicidad.url_destino} onChange={(e) => {
                          const val = e.target.value;
                          const prod = productos.find(p => `/catalogo?producto=${p.id}` === val);
                          setFormDataPublicidad(prev => ({
                            ...prev,
                            url_destino: val,
                            url_imagen: prod?.imagen || prev.url_imagen,
                            titulo: prev.titulo || (prod?.producto || prod?.plataforma || prev.titulo),
                          }));
                          if (prod?.imagen) setImagenPreview(prod.imagen);
                        }} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                          <option value="/catalogo?producto=">Seleccionar producto...</option>
                          {productos.filter(p => p.publicado !== false).map(p => (<option key={p.id} value={`/catalogo?producto=${p.id}`}>{p.plataforma || p.producto || p.nombre || 'Sin nombre'} - ${Number(p.precioDetal || 0).toFixed(2)}</option>))}
                        </select>
                      ) : (
                        <input type="text" value={formDataPublicidad.url_destino} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, url_destino: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2" placeholder="https://..." />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-voltech-muted mb-2">Agregar Imagen *</label>
                      <div onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDrop={(e) => { e.preventDefault(); handleImageUpload(e.dataTransfer.files[0]); }} onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer ${isDragOver ? 'border-voltech-cyan bg-voltech-cyan/10' : 'border-voltech-border'}`}>
                        {imagenPreview ? <img src={imagenPreview} alt="Preview" className="max-h-48 mx-auto" /> : <div className="flex flex-col items-center gap-2"><Upload className="w-6 h-6 text-voltech-muted" /><p className="text-sm text-voltech-muted">Arrastra o haz clic</p></div>}
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0])} className="hidden" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-voltech-muted mb-2">Fecha Inicio *</label>
                        <input type="date" value={formDataPublicidad.fecha_inicio} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, fecha_inicio: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-voltech-muted mb-2">Duración (días)</label>
                        <input type="number" min="1" value={formDataPublicidad.duracion_dias} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, duracion_dias: parseInt(e.target.value) || 0})} className="input-voltech w-full rounded-lg px-4 py-2" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-voltech-muted mb-2">Fecha Fin (Auto)</label>
                      <input type="date" value={formDataPublicidad.fecha_fin} readOnly className="input-voltech w-full rounded-lg px-4 py-2 bg-voltech-dark/50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-voltech-muted mb-2">Video (URL, opcional)</label>
                      <input type="text" value={formDataPublicidad.url_video} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, url_video: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2" placeholder="https://.../video.mp4" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-voltech-muted mb-2">Texto del Botón</label>
                      <input type="text" value={formDataPublicidad.texto_boton} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, texto_boton: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2" placeholder="Ver Oferta / Ir a la tienda / Conseguir descuento" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-voltech-muted mb-2">Ubicación en el catálogo</label>
                      <select value={formDataPublicidad.lado} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, lado: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                        <option value="izquierdo">Izquierda</option>
                        <option value="derecho">Derecha</option>
                        <option value="ambos">Ambos lados</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-voltech-muted mb-2">Anunciante (cliente)</label>
                        <input type="text" value={formDataPublicidad.anunciante} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, anunciante: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2" placeholder="Nombre del cliente" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-voltech-muted mb-2">Costo por click ($)</label>
                        <input type="number" step="0.01" value={formDataPublicidad.costo_por_click} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, costo_por_click: parseFloat(e.target.value) || 0})} className="input-voltech w-full rounded-lg px-4 py-2" placeholder="0.10" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-voltech-muted mb-2">Teléfono del anunciante</label>
                      <input type="tel" value={formDataPublicidad.telefono_anunciante} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, telefono_anunciante: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2" placeholder="0412-1234567" />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button onClick={guardarPublicidad} className="flex-1 px-4 py-2 bg-voltech-cyan text-white rounded-lg">Guardar</button>
                      <button onClick={() => { setShowPublicidadForm(false); setPublicidadEditando(null); }} className="px-4 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-voltech-muted">Cancelar</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-voltech-surface border border-voltech-border rounded-xl">
              <div className="p-6 border-b border-voltech-border">
                <h3 className="text-lg font-bold text-white">Publicidades Creadas</h3>
              </div>
              <div className="divide-y divide-voltech-border">
                {publicidad.length === 0 ? (
                  <div className="p-12 text-center">
                    <Megaphone className="w-16 h-16 text-voltech-muted mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-semibold text-white mb-2">No hay publicidades</h3>
                    <p className="text-voltech-muted text-sm">Crea tu primera campaña publicitaria</p>
                  </div>
                ) : (
                  publicidad.map(pub => (
                    <div key={pub.id} className="p-6 hover:bg-voltech-dark/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-white">{pub.titulo}</h4>
                          <div className="flex gap-4 mt-2 text-sm flex-wrap">
                            <span className={pub.estado === 'activo' ? 'text-voltech-success' : 'text-voltech-muted'}>{pub.estado === 'activo' ? 'Activo' : 'Inactivo'}</span>
                            <span className="text-voltech-muted">{new Date(pub.fecha_inicio).toLocaleDateString('es-VE')} - {new Date(pub.fecha_fin).toLocaleDateString('es-VE')}</span>
                            <span className="text-voltech-cyan font-semibold">👆 {pub.clicks || 0} clicks</span>
                            <span className="text-voltech-success font-bold">💵 ${((pub.clicks || 0) * (pub.costo_por_click || 0)).toFixed(2)}</span>
                            {pub.anunciante && <span className="text-voltech-purple">🏢 {pub.anunciante}</span>}
                          </div>
                        </div>
                        {esAdmin && (
                          <div className="flex gap-2">
                            <button onClick={() => enviarResumenPub(pub)} className="p-2 hover:bg-voltech-success/20 rounded-lg text-voltech-success" title="Enviar resumen al anunciante">
                              <WhatsAppIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setPublicidadEditando(pub); setShowPublicidadForm(true); }} className="p-2 hover:bg-voltech-cyan/20 rounded-lg text-voltech-cyan">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={async () => { 
                              if(!confirm('¿Eliminar esta publicidad?')) return;
                              try {
                                if (supabase) {
                                  const { error } = await supabase.from('publicidad').delete().eq('id', pub.id);
                                  if (error) throw error;
                                }
                                const nuevas = publicidad.filter(p => p.id !== pub.id);
                                setPublicidad(nuevas);
                                localStorage.setItem('voltech_publicidad', JSON.stringify(nuevas));
                                toast.success('Publicidad eliminada');
                              } catch (err) {
                                console.error('Error al eliminar:', err);
                                toast.error('Error al eliminar: ' + (err.message || 'intenta de nuevo'));
                              }
                            }} className="p-2 hover:bg-voltech-error/20 rounded-lg text-voltech-error" title="Eliminar">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mas-vendidos' && (esAdmin || esSocio) && (
          <div className="space-y-4">
            <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
              <button onClick={() => setMasVendidosOpen(!masVendidosOpen)} className="w-full flex items-center justify-between p-4 bg-voltech-dark/30 hover:bg-voltech-dark/50 transition-colors">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-voltech-cyan" />
                  <h3 className="text-lg font-bold text-white">Configuración de "Más Vendidos"</h3>
                </div>
                {masVendidosOpen ? <ChevronUp className="w-5 h-5 text-voltech-muted" /> : <ChevronDown className="w-5 h-5 text-voltech-muted" />}
              </button>
              <AnimatePresence>
                {masVendidosOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="p-6 space-y-4 border-t border-voltech-border">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={masVendidosConfig.activo} onChange={(e) => setMasVendidosConfig({...masVendidosConfig, activo: e.target.checked})} className="w-5 h-5 rounded border-voltech-border text-voltech-cyan" />
                        <span className="text-sm font-medium text-white">Activar sección en el catálogo</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-voltech-muted mb-1">Título de la Sección</label>
                          <input type="text" value={masVendidosConfig.titulo} onChange={(e) => setMasVendidosConfig({...masVendidosConfig, titulo: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-voltech-muted mb-1">Cantidad Máxima</label>
                          <select value={masVendidosConfig.cantidad_maxima} onChange={(e) => setMasVendidosConfig({...masVendidosConfig, cantidad_maxima: parseInt(e.target.value)})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-voltech-muted mb-1">Descripción 1</label>
                          <input type="text" value={masVendidosConfig.descripcion_1} onChange={(e) => setMasVendidosConfig({...masVendidosConfig, descripcion_1: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-voltech-muted mb-1">Descripción 2</label>
                          <input type="text" value={masVendidosConfig.descripcion_2} onChange={(e) => setMasVendidosConfig({...masVendidosConfig, descripcion_2: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                        </div>
                      </div>
                      <button onClick={async () => { if (supabase) await supabase.from('marketing_config').upsert({ clave: 'mas_vendidos', valor: masVendidosConfig }, { onConflict: 'clave' }); localStorage.setItem('voltech_mas_vendidos_config', JSON.stringify(masVendidosConfig)); toast.success('Configuración guardada'); }} className="w-full py-2 bg-voltech-cyan text-white rounded-lg flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Actualizar y Guardar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-voltech-cyan" /> Vista Previa
              </h3>
              <div className="bg-voltech-dark/50 border border-voltech-border rounded-xl p-4 max-w-md">
                <h4 className="text-sm font-bold text-white mb-3">{masVendidosConfig.titulo}</h4>
                {[1, 2, 3, 4, 5].slice(0, masVendidosConfig.cantidad_maxima).map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2 mb-2 rounded bg-voltech-surface">
                    <div className="w-10 h-10 bg-voltech-border rounded flex items-center justify-center">
                      <Package className="w-5 h-5 text-voltech-muted" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-white">Producto {i}</p>
                      <p className="text-[10px] text-voltech-muted">$XX.XX</p>
                    </div>
                  </div>
                ))}
                {masVendidosConfig.descripcion_1 && <p className="text-xs text-voltech-muted mt-2">{masVendidosConfig.descripcion_1}</p>}
                {masVendidosConfig.descripcion_2 && <p className="text-xs text-voltech-muted">{masVendidosConfig.descripcion_2}</p>}
              </div>
            </div>
          </div>
        )}
        {/* ❌ ELIMINADO: todo el tab 'calendario' (vive ahora en /panel/alertas) */}
      </div>

      {/* ✅ Modal para enviar resumen por WhatsApp */}
      <ModalWhatsApp
        abierto={resumenData.abierto}
        textoFijo={resumenData.texto}
        titulo={resumenData.titulo || 'Resumen de Publicidad'}
        telefono={resumenData.telefono || ''}
        nombreCliente={resumenData.cliente || ''}
        onClose={() => setResumenData({ abierto: false, texto: '', telefono: '', titulo: '', cliente: '' })}
      />
    </div>
  );
}