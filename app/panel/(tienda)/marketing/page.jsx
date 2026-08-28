'use client';

import BannerCard from '@/components/BannerCard';
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
import CustomSelect from '@/components/CustomSelect';
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

const PLANTILLA_COMPRA_DEFAULT = `¡Hola! Quiero comprar: {{producto}}
Precio: {{precio}}
Bs {{bs}}
🔗 Ver producto: {{url}}
¿Cómo procedo?`;
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
  const [categoriasPromo, setCategoriasPromo] = useState([]);
  const [showCategoriasPromoModal, setShowCategoriasPromoModal] = useState(false);
  const [nuevaCategoriaPromo, setNuevaCategoriaPromo] = useState('');
  const [publicidadEditando, setPublicidadEditando] = useState(null);
  const [imagenPreview, setImagenPreview] = useState('');
  const [imagenesExtra, setImagenesExtra] = useState([]);
  const [bgImageIndex, setBgImageIndex] = useState(0);
  const [portadaRatio, setPortadaRatio] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [modoDosImagenes, setModoDosImagenes] = useState(false);
  const [equipo, setEquipo] = useState([]);
  const [plantillaCompra, setPlantillaCompra] = useState(PLANTILLA_COMPRA_DEFAULT);
  useEffect(() => {
  if (typeof window !== 'undefined') setPlantillaCompra(localStorage.getItem('voltech_plantilla_compra') || PLANTILLA_COMPRA_DEFAULT);
  }, []);
  
  const [formDataPublicidad, setFormDataPublicidad] = useState({
    titulo: '', descripcion: '', url_destino: '', url_imagen: '', url_video: '', lado: 'izquierdo', posicion: 'sidebar',
    anunciante: '', costo_por_click: 0.10, telefono_anunciante: '',
    fecha_inicio: '', duracion_dias: 30, fecha_fin: '', hora_inicio: '00:00', hora_fin: '23:59', prioridad: 'normal',
    mostrar_en: { inicio: true, catalogo: true, streaming: false, ofertas: false },
    dispositivos: { desktop: true, movil: true, tablet: true }, rotacion: 5, estado: 'activo',
    ubicacion_web: 'oculta', ubicacion_movil: 'arriba', url_fondo: '',
    texto_boton: 'VER OFERTA', color_boton: '#22d3ee',
    color_titulo: '#ffffff', color_descripcion: '#ffffff', color_precio: '#34d399',
    whatsapp_destinos: [], precio_manual: '', descuento_pct: 0,
    saludo_whatsapp: '¡Hola! Te escribo del catálogo 👋',
    cierre_whatsapp: 'Quiero comprar ✅',
    tipo_destino: 'url_externa', producto_id: '', categoria_promo: ''
    });
  const [masVendidosConfig, setMasVendidosConfig] = useState({
    activo: false, titulo: '🔥 Los Favoritos de Nuestros Clientes', cantidad_maxima: 3,
    descripcion_1: '🚚 Envíos rápidos a todo el país en 24-48h',
    descripcion_2: '️ Garantía de 3 días en todos nuestros productos'
  });

  // ✅ CÁLCULO AUTOMÁTICO DE FECHA FIN DE PUBLICIDAD
  useEffect(() => {
    if (formDataPublicidad.fecha_inicio && formDataPublicidad.duracion_dias) {
      const fecha = new Date(formDataPublicidad.fecha_inicio + 'T00:00:00');
      fecha.setDate(fecha.getDate() + parseInt(formDataPublicidad.duracion_dias));
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      setFormDataPublicidad(prev => ({ ...prev, fecha_fin: `${year}-${month}-${day}` }));
    }
  }, [formDataPublicidad.fecha_inicio, formDataPublicidad.duracion_dias]);

  // ✅ CÁLCULO AUTOMÁTICO DE FECHA FIN DE PUBLICIDAD
  useEffect(() => {
    if (formDataPublicidad.fecha_inicio && formDataPublicidad.duracion_dias) {
      const fecha = new Date(formDataPublicidad.fecha_inicio + 'T00:00:00');
      fecha.setDate(fecha.getDate() + parseInt(formDataPublicidad.duracion_dias));
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      setFormDataPublicidad(prev => ({ ...prev, fecha_fin: `${year}-${month}-${day}` }));
    }
  }, [formDataPublicidad.fecha_inicio, formDataPublicidad.duracion_dias]);

  // ✅ CÁLCULO AUTOMÁTICO DE FECHA FIN DE PUBLICIDAD
  useEffect(() => {
    if (formDataPublicidad.fecha_inicio && formDataPublicidad.duracion_dias) {
      const fecha = new Date(formDataPublicidad.fecha_inicio + 'T00:00:00');
      fecha.setDate(fecha.getDate() + parseInt(formDataPublicidad.duracion_dias));
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      setFormDataPublicidad(prev => ({ ...prev, fecha_fin: `${year}-${month}-${day}` }));
    }
  }, [formDataPublicidad.fecha_inicio, formDataPublicidad.duracion_dias]);

  // ✅ CÁLCULO AUTOMÁTICO DE FECHA FIN DE PUBLICIDAD
  useEffect(() => {
    if (formDataPublicidad.fecha_inicio && formDataPublicidad.duracion_dias) {
      const fecha = new Date(formDataPublicidad.fecha_inicio + 'T00:00:00');
      fecha.setDate(fecha.getDate() + parseInt(formDataPublicidad.duracion_dias));
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      setFormDataPublicidad(prev => ({ ...prev, fecha_fin: `${year}-${month}-${day}` }));
    }
  }, [formDataPublicidad.fecha_inicio, formDataPublicidad.duracion_dias]);

  useEffect(() => {
const cargarDatos = async () => {
let plts = [], cpons = [], pubs = [], prods = [], clts = [], etqs = [], mvConfig = [], catsPromo = [];
if (supabase) {
const safe = (q) => q.then(r => r.data).catch(() => null);
const [pData, cData, puData, prData, clData, etData, mvData, eqData, usData, cpData] = await Promise.all([
safe(supabase.from('plantillas').select('*')),
safe(supabase.from('cupones').select('*')),
safe(supabase.from('publicidad').select('*')),
safe(supabase.from('productos').select('*')),
safe(supabase.from('clientes').select('*')),
safe(supabase.from('settings').select('valor').eq('clave', 'etiquetas').single()),
safe(supabase.from('marketing_config').select('valor').eq('clave', 'mas_vendidos').single()),
safe(supabase.from('equipo').select('*')),
safe(supabase.from('usuarios').select('*')),
safe(supabase.from('settings').select('valor').eq('clave', 'categorias_promo').single()),
]);
if (pData) plts = pData; if (cData) cpons = cData; if (puData) pubs = puData;
if (prData) prods = prData; if (clData) clts = clData; if (etData?.valor) etqs = etData.valor;
if (mvData?.valor) mvConfig = mvData.valor;
if (cpData?.valor) catsPromo = cpData.valor;
const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
const refCode = urlParams.get('ref') || urlParams.get('v');
if (refCode) {
setAutoReferrer(refCode.toUpperCase());
localStorage.setItem('voltech_ref', JSON.stringify({ codigo: refCode.toUpperCase(), fecha: new Date().toISOString() }));
const urlLimpia = new URL(window.location.href);
urlLimpia.searchParams.delete('ref');
urlLimpia.searchParams.delete('v');
window.history.replaceState({}, '', urlLimpia);
}}
if (plts.length === 0) { const d = localStorage.getItem('voltech_plantillas'); if (d) plts = JSON.parse(d); }
if (cpons.length === 0) { const d = localStorage.getItem('voltech_cupones'); if (d) cpons = JSON.parse(d); }
if (pubs.length === 0) { const d = localStorage.getItem('voltech_publicidad'); if (d) pubs = JSON.parse(d); }
if (prods.length === 0) { const d = localStorage.getItem('voltech_productos'); if (d) prods = JSON.parse(d); }
if (clts.length === 0) { const d = localStorage.getItem('voltech_clientes'); if (d) clts = JSON.parse(d); }
if (etqs.length === 0) { const d = localStorage.getItem('voltech_etiquetas'); if (d) etqs = JSON.parse(d); }
if (Object.keys(mvConfig).length === 0) { const d = localStorage.getItem('voltech_mas_vendidos_config'); if (d) mvConfig = JSON.parse(d); }
if (Object.keys(mvConfig).length > 0) setMasVendidosConfig(mvConfig);
if (catsPromo.length === 0) { const d = localStorage.getItem('voltech_categorias_promo'); if (d) catsPromo = JSON.parse(d); }
if (catsPromo.length > 0) setCategoriasPromo(catsPromo);
let clientesFiltrados = clts;
if (!esAdmin && !esSocio && usuarioActual?.nombre) {
clientesFiltrados = clts.filter(c => c.registradoPor === usuarioActual.nombre);
}
const idsVistos = new Set();
pubs = pubs.filter(p => {
if (!p || !p.id || idsVistos.has(p.id)) return false;
idsVistos.add(p.id);
return true;
});
localStorage.setItem('voltech_publicidad', JSON.stringify(pubs));
setPlantillas(plts); setCupones(cpons); setPublicidad(pubs);
setProductos(prods); setClientes(clientesFiltrados); setEtiquetas(etqs);
};
cargarDatos();
}, [esAdmin, esSocio, usuarioActual]);

  const [alertasVencimiento, setAlertasVencimiento] = useState([]);

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

    // ✅ Comprime a JPEG (máx 1280px) para que el upsert a Supabase no falle por peso
    const comprimirImagen = (dataUrl) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
    const max = 1280;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
    });
    const handleImageUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no debe pesar más de 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = async () => { const url = await comprimirImagen(reader.result); setImagenPreview(url); setFormDataPublicidad(prev => ({...prev, url_imagen: url})); };
    reader.readAsDataURL(file);
    };

  // ✅ Cargar VARIAS imágenes; la primera se vuelve PORTADA automáticamente
  const handleImagenesExtra = (files) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return; }
      if (file.size > 5 * 1024 * 1024) { toast.error('Cada imagen máximo 5MB'); return; }
      const reader = new FileReader();
      reader.onloadend = async () => {
      const url = await comprimirImagen(reader.result);
      setImagenesExtra(prev => [...prev, url]);
      setImagenPreview(prev => prev || url);
      setFormDataPublicidad(prev => prev.url_imagen ? prev : { ...prev, url_imagen: url });
      };
      reader.readAsDataURL(file);
    });
  };
  // ✅ Sin duplicados: usa Set para garantizar una sola miniatura por imagen
  const todasImagenes = Array.from(new Set([formDataPublicidad.url_imagen, ...imagenesExtra].filter(Boolean)));
  const toggleDestino = (m) => {
  setFormDataPublicidad(prev => {
    const cur = prev.whatsapp_destinos || [];
    const existe = cur.some(d => d.telefono === m.telefono);
    return { ...prev, whatsapp_destinos: existe ? cur.filter(d => d.telefono !== m.telefono) : [...cur, { nombre: m.nombre, telefono: m.telefono }] };
    });
   };
    const quitarImagen = (img) => {
    setImagenesExtra(prev => prev.filter(x => x !== img));
    if (formDataPublicidad.url_imagen === img) { setImagenPreview(''); setFormDataPublicidad(p => ({ ...p, url_imagen: '' })); }
    if (formDataPublicidad.url_fondo === img) setFormDataPublicidad(p => ({ ...p, url_fondo: '' }));
  };

    // ✅ Detecta si la Portada es ANCHA (banner) o CUADRADA
  const portadaAncha = portadaRatio >= 1.5;
  // ✅ Switch "2 imágenes" para rellenar espacios en PC
  // ✅ % de ancho dinámico: cuadrada 50% / banner 70%
  // ✅ Imágenes que se muestran en PC (1 o 2 según el switch)
  const imgsPC = (modoDosImagenes ? todasImagenes.slice(0, 2) : [imagenPreview]).filter(Boolean);
  // ✅ Precio base numérico + precio final con descuento
  const precioBaseNum = parseFloat(String(formDataPublicidad.precio_manual || '').replace(/[^0-9.]/g, '')) || 0;
  const descuentoPct = Math.min(100, Math.max(0, Number(formDataPublicidad.descuento_pct) || 0));
  const precioFinalNum = precioBaseNum * (1 - descuentoPct / 100);
  // ✅ Mensaje de WhatsApp que verá el cliente al tocar el botón
  const mensajePublicidadWA = (() => {
  const saludo = (formDataPublicidad.saludo_whatsapp || '').trim() || '¡Hola! Te escribo del catálogo 👋';
  const titulo = (formDataPublicidad.titulo || '').trim();
  const cierre = (formDataPublicidad.cierre_whatsapp || '').trim() || 'Quiero comprar ✅';
  // ✅ URL completa de la publicidad (manual o de producto)
  let url = '';
  if (typeof window !== 'undefined' && formDataPublicidad.url_destino) {
  url = formDataPublicidad.url_destino.startsWith('http')
  ? formDataPublicidad.url_destino
  : `${window.location.origin}${formDataPublicidad.url_destino.startsWith('/') ? '' : '/'}${formDataPublicidad.url_destino}`;
  }
  let m = `${saludo}
  📢 *${titulo}*
  `;
  if (precioBaseNum > 0) {
  m += descuentoPct > 0
  ? `💰 Precio de oferta: *$${precioFinalNum.toFixed(2)}* (antes $${precioBaseNum.toFixed(2)})
  `
  : `💰 Precio: *$${precioBaseNum.toFixed(2)}*
  `;
  }
  if (url) m += `🔗 ${url}
  `;
  m += cierre;
  return m;
  })();  // ✅ % dinámico de altura vertical para la tarjeta MÓVIL según la proporción de la imagen:
  // Cuadrada (≈1:1) → 70% imagen / 30% texto · Banner (≥1.5) → 50%/50% · Intermedio → proporcional (ej. 64%/36%)
  const imagePercent = portadaRatio <= 1.1 ? 70 : portadaRatio >= 1.5 ? 50 : Math.round(70 - ((portadaRatio - 1.1) / 0.4) * 20);
  const textPercent = 100 - imagePercent;
  // ✅ PC: % de ANCHO de la imagen — Cuadrada 50% · Banner 70% · Intermedio 51–69% proporcional
  const imgPct = portadaRatio <= 1.1 ? 50 : portadaRatio >= 1.5 ? 70 : Math.round(50 + ((portadaRatio - 1.1) / 0.4) * 20);
  const textPct = 100 - imgPct;
  // ✅ Zona de imagen: mín 50% / máx 70% según la portada. El texto ocupa el resto.
  const imgPctPC = Math.min(70, Math.max(50, Math.round(50 + (portadaRatio - 1) * 20)));
  const textPctPC = 100 - imgPctPC;
  const imgPctMovil = Math.min(70, Math.max(50, Math.round(70 - (portadaRatio - 1) * 20)));
  const textPctMovil = 100 - imgPctMovil;
  useEffect(() => {
    if (!imagenPreview) { setPortadaRatio(1); return; }
    const img = new Image();
    img.onload = () => setPortadaRatio(img.naturalWidth / (img.naturalHeight || 1));
    img.src = imagenPreview;
  }, [imagenPreview]);

  const agregarCategoriaPromo = async () => {
    if (!nuevaCategoriaPromo.trim()) return toast.error('Ingresa un nombre');
    if (categoriasPromo.includes(nuevaCategoriaPromo)) return toast.error('Esta categoría ya existe');
    const nuevas = [...categoriasPromo, nuevaCategoriaPromo];
    setCategoriasPromo(nuevas);
    if (supabase) await supabase.from('settings').upsert({ clave: 'categorias_promo', valor: nuevas }, { onConflict: 'clave' });
    localStorage.setItem('voltech_categorias_promo', JSON.stringify(nuevas));
    setNuevaCategoriaPromo('');
    toast.success('Categoría agregada');
  };

  const eliminarCategoriaPromo = async (cat) => {
    if (!confirm(`¿Eliminar "${cat}"?`)) return;
    const nuevas = categoriasPromo.filter(c => c !== cat);
    setCategoriasPromo(nuevas);
    if (supabase) await supabase.from('settings').upsert({ clave: 'categorias_promo', valor: nuevas }, { onConflict: 'clave' });
    localStorage.setItem('voltech_categorias_promo', JSON.stringify(nuevas));
    toast.success('Categoría eliminada');
  };

  // ✅ Limpia TODO el formulario al crear una publicidad NUEVA (evita que quede la vieja)
  const abrirNuevaPublicidad = () => {
    setPublicidadEditando(null);
    setFormDataPublicidad({
      titulo: '', descripcion: '', url_destino: '', url_imagen: '', url_video: '', lado: 'izquierdo', posicion: 'sidebar',
      anunciante: '', costo_por_click: 0.10, telefono_anunciante: '',
      fecha_inicio: '', duracion_dias: 30, fecha_fin: '', hora_inicio: '00:00', hora_fin: '23:59', prioridad: 'normal',
      mostrar_en: { inicio: true, catalogo: true, streaming: false, ofertas: false },
      dispositivos: { desktop: true, movil: true, tablet: true }, rotacion: 5, estado: 'activo',
      ubicacion_web: 'arriba', ubicacion_movil: 'arriba', url_fondo: '',
      texto_boton: 'VER OFERTA', color_boton: '#22d3ee',
      color_titulo: '#ffffff', color_descripcion: '#ffffff', color_precio: '#34d399',
      precio_manual: '', descuento_pct: 0,
    saludo_whatsapp: '¡Hola! Te escribo del catálogo 👋',
    cierre_whatsapp: 'Quiero comprar ✅',
    tipo_destino: 'url_externa', producto_id: '', categoria_promo: ''
    });
    setImagenPreview('');
    setImagenPreview('');
    setImagenesExtra([]);
    setModoDosImagenes(false);
    setPortadaRatio(1);
    setShowPublicidadForm(true);
  };

  const guardarPublicidad = async () => {
    if (!esAdmin) return toast.error('Solo el administrador puede gestionar publicidad');
    if (!formDataPublicidad.titulo || !formDataPublicidad.url_imagen || !formDataPublicidad.fecha_inicio || !formDataPublicidad.fecha_fin) {
    return toast.error('Título, imagen y fechas son obligatorios');
    }
    if (!(formDataPublicidad.saludo_whatsapp || '').trim() || !(formDataPublicidad.cierre_whatsapp || '').trim() || !(formDataPublicidad.url_destino || '').trim()) {
    return toast.error('El saludo, la URL de destino y el cierre del mensaje son obligatorios');
}
const portadaComp = await comprimirImagen(formDataPublicidad.url_imagen);
const extrasComp = [];
for (const im of imagenesExtra) { if (im && im !== formDataPublicidad.url_imagen) extrasComp.push(await comprimirImagen(im)); }
const nuevaPublicidad = { id: publicidadEditando ? publicidadEditando.id : `pub-${Date.now()}`, ...formDataPublicidad, url_imagen: portadaComp, precio_manual: precioBaseNum > 0 ? `$${precioFinalNum.toFixed(2)}` : formDataPublicidad.precio_manual, precio_original: descuentoPct > 0 ? precioBaseNum : null, descuento_pct: descuentoPct, mensaje_whatsapp: mensajePublicidadWA, imagenes: [portadaComp, ...extrasComp].filter(Boolean), url_fondo: formDataPublicidad.url_fondo || '', fecha_creacion: new Date().toISOString() };
    if (supabase) {
try {
const { error } = await supabase.from('publicidad').upsert(nuevaPublicidad, { onConflict: 'id' });
if (error) { console.error('No se sincronizó con Supabase:', error.message); toast.error('⚠️ Supabase: ' + error.message); }
} catch (e) {
console.warn('Supabase no disponible, guardado solo en este navegador:', e.message);
}
}
    const actualizadas = publicidadEditando
      ? publicidad.map(p => p.id === publicidadEditando.id ? nuevaPublicidad : p)
      : [...publicidad.filter(p => p.id !== nuevaPublicidad.id), nuevaPublicidad];  
    setPublicidad(actualizadas); localStorage.setItem('voltech_publicidad', JSON.stringify(actualizadas));
    toast.success('Publicidad guardada'); setShowPublicidadForm(false); setPublicidadEditando(null); setImagenesExtra([]); setImagenPreview('');
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
                  <CustomSelect
                    value={formDataPlantilla.categoria}
                    onChange={(v) => setFormDataPlantilla({ ...formDataPlantilla, categoria: v })}
                    options={[
                      { value: 'mensaje', label: 'Mensaje' },
                      { value: 'oferta', label: 'Oferta' },
                      { value: 'contacto', label: 'Contacto' }
                    ]}
                    placeholder="Categoría"
                    className="w-full"
                  />
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
                      <CustomSelect
                        value={productoSeleccionado ? String(productoSeleccionado.id) : ''}
                        onChange={(v) => { const prod = productos.find(p => String(p.id) === String(v)); setProductoSeleccionado(prod || null); setPrecioPromocion(''); }}
                        options={[
                          { value: '', label: 'Buscar producto...' },
                          ...productos.filter(p => p.cantidad > 0).map(p => ({ value: String(p.id), label: `${p.plataforma || p.producto || p.nombre || 'Sin nombre'} - $${Number(p.precioDetal || 0).toFixed(2)}` }))
                        ]}
                        placeholder="Buscar producto..."
                        className="w-full"
                      />
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
                            <CustomSelect
                              value={plantillaWhatsappSeleccionada}
                              onChange={setPlantillaWhatsappSeleccionada}
                              options={[
                                { value: '', label: 'Sin plantilla' },
                                ...plantillas.filter(p => p.tipo === 'whatsapp').map(p => ({ value: String(p.id), label: `${p.nombre}${p.esGlobal ? ' ⭐' : ''}` }))
                              ]}
                              placeholder="Sin plantilla"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-voltech-muted mb-2">3. Plantilla de Contacto (Opcional)</label>
                            <CustomSelect
                              value={plantillaContactoWaSeleccionada}
                              onChange={setPlantillaContactoWaSeleccionada}
                              options={[
                                { value: '', label: 'Sin plantilla' },
                                ...plantillasInfoContacto.map(p => ({ value: String(p.id), label: `${p.nombre}${p.esGlobal ? ' ⭐' : ''}` }))
                              ]}
                              placeholder="Sin plantilla"
                              className="w-full"
                            />
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
                  <CustomSelect
                    value={formDataPlantilla.categoria}
                    onChange={(v) => setFormDataPlantilla({ ...formDataPlantilla, categoria: v })}
                    options={[
                      { value: 'mensaje', label: 'Mensaje' },
                      { value: 'oferta', label: 'Oferta' },
                      { value: 'contacto', label: 'Contacto' }
                    ]}
                    placeholder="Categoría"
                    className="w-full"
                  />
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
                      <CustomSelect
                        value={productoMarketplace ? String(productoMarketplace.id) : ''}
                        onChange={(v) => { const prod = productos.find(p => String(p.id) === String(v)); setProductoMarketplace(prod || null); setPrecioPromocionMarketplace(''); }}
                        options={[
                          { value: '', label: 'Buscar producto...' },
                          ...productos.map(p => ({ value: String(p.id), label: `${p.plataforma || p.producto || p.nombre || 'Sin nombre'} - $${Number(p.precioDetal || 0).toFixed(2)}` }))
                        ]}
                        placeholder="Buscar producto..."
                        className="w-full"
                      />
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
                            <CustomSelect
                              value={plantillaMarketplaceSeleccionada}
                              onChange={setPlantillaMarketplaceSeleccionada}
                              options={[
                                { value: '', label: 'Sin plantilla' },
                                ...plantillas.filter(p => p.tipo === 'marketplace').map(p => ({ value: String(p.id), label: `${p.nombre}${p.esGlobal ? ' ⭐' : ''}` }))
                              ]}
                              placeholder="Sin plantilla"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-voltech-muted mb-2">3. Plantilla de Contacto (Opcional)</label>
                            <CustomSelect
                              value={plantillaContactoMpSeleccionada}
                              onChange={setPlantillaContactoMpSeleccionada}
                              options={[
                                { value: '', label: 'Sin plantilla' },
                                ...plantillasInfoContacto.map(p => ({ value: String(p.id), label: `${p.nombre}${p.esGlobal ? ' ⭐' : ''}` }))
                              ]}
                              placeholder="Sin plantilla"
                              className="w-full"
                            />
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
                                                <CustomSelect
                          value={formDataCupon.tipo_descuento}
                          onChange={(v) => setFormDataCupon({...formDataCupon, tipo_descuento: v})}
                          disabled={formDataCupon.tipo_aplicacion === 'producto_gratis'}
                          options={[
                            { value: 'porcentaje', label: 'Porcentaje (%)' },
                            { value: 'monto_fijo', label: 'Monto Fijo ($)' },
                            ...(formDataCupon.tipo_aplicacion === 'producto_gratis' ? [{ value: 'gratis', label: 'Gratis (100% off)' }] : [])
                          ]}
                          placeholder="Selecciona tipo"
                          className="w-full"
                        />                    
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
                        <CustomSelect
                          value={formDataCupon.limite_usos}
                          onChange={(v) => setFormDataCupon({...formDataCupon, limite_usos: v})}
                          options={[
                            { value: 'ilimitado', label: 'Ilimitado' },
                            { value: 'limitado', label: 'Limitado' }
                          ]}
                          placeholder="Selecciona límite"
                          className="w-full"
                        />
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
                <button onClick={abrirNuevaPublicidad} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2"><Plus className="w-4 h-4" /> Nueva Publicidad</button>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
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
                      <CustomSelect
                        label="🎯 Destino de la Publicidad"
                        value={formDataPublicidad.tipo_destino}
                        onChange={(v) => {
                          setFormDataPublicidad({
                            ...formDataPublicidad,
                            tipo_destino: v,
                            url_destino: '',
                            producto_id: ''
                          });
                        }}
                        options={[
                          { value: 'url_externa', label: '🌐 URL Externa (banner, no entra en Ofertas)' },
                          { value: 'producto', label: '📦 Producto (físico) → Ofertas / Productos' },
                          { value: 'streaming', label: '📺 Streaming → Ofertas / Streaming' },
                          { value: 'kit', label: '🎁 Kit (producto) → Ofertas / Productos' },
                          { value: 'combo_streaming', label: '🎬 Combo Streaming → Ofertas / Streaming' }
                        ]}
                        placeholder="Selecciona destino"
                        className="w-full mb-3"
                      />
                      
                      {formDataPublicidad.tipo_destino === 'url_externa' && (
                        <input type="text" value={formDataPublicidad.url_destino} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, url_destino: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2" placeholder="https://..." />
                      )}
                      
                      {formDataPublicidad.tipo_destino === 'producto' && (
                        <CustomSelect
                          value={formDataPublicidad.producto_id}
                          onChange={(v) => {
                            const prod = productos.find(p => p.id === v);
                            setFormDataPublicidad(prev => ({
                              ...prev,
                              producto_id: v,
                              url_destino: prod ? `/catalogo?producto=${prod.id}` : '',
                              url_imagen: prod?.imagen || prev.url_imagen,
                              titulo: prev.titulo || (prod?.producto || prod?.plataforma || prev.titulo),
                              descripcion: prev.descripcion || (prod?.descripcion || ''),
                              precio_manual: prev.precio_manual || (prod ? `$${Number(prod.precioDetal || 0).toFixed(2)}` : ''),
                            }));
                            if (prod?.imagen) setImagenPreview(prod.imagen);
                          }}
                          options={productos.filter(p => p.tipo === 'fisico' && !p.esCombo && p.disponibilidad !== 'kit' && (p.categoria || '').toUpperCase() !== 'KIT' && p.publicado !== false).map(p => ({ value: p.id, label: `${p.plataforma || p.producto || p.nombre || 'Sin nombre'} - $${Number(p.precioDetal || 0).toFixed(2)}` }))}
                          placeholder="Seleccionar producto..."
                          className="w-full"
                        />
                      )}
                      
                      {formDataPublicidad.tipo_destino === 'streaming' && (
                        <CustomSelect
                          value={formDataPublicidad.producto_id}
                          onChange={(v) => {
                            const prod = productos.find(p => p.id === v);
                            setFormDataPublicidad(prev => ({
                              ...prev,
                              producto_id: v,
                              url_destino: prod ? `/catalogo?producto=${prod.id}` : '',
                              url_imagen: prod?.imagen || prev.url_imagen,
                              titulo: prev.titulo || (prod?.plataforma || prev.titulo),
                              descripcion: prev.descripcion || (prod?.descripcion || ''),
                              precio_manual: prev.precio_manual || (prod ? `$${Number(prod.precioDetal || 0).toFixed(2)}` : ''),
                            }));
                            if (prod?.imagen) setImagenPreview(prod.imagen);
                          }}
                          options={productos.filter(p => p.tipo === 'streaming' && !p.esCombo && p.publicado !== false).map(p => ({ value: p.id, label: `${p.plataforma || 'Sin nombre'} - $${Number(p.precioDetal || 0).toFixed(2)}` }))}
                          placeholder="Seleccionar plataforma..."
                          className="w-full"
                        />
                      )}
                      
                      {formDataPublicidad.tipo_destino === 'kit' && (
                        <CustomSelect
                          value={formDataPublicidad.producto_id}
                          onChange={(v) => {
                            const prod = productos.find(p => p.id === v);
                            setFormDataPublicidad(prev => ({
                              ...prev,
                              producto_id: v,
                              url_destino: prod ? `/catalogo?producto=${prod.id}` : '',
                              url_imagen: prod?.imagen || prev.url_imagen,
                              titulo: prev.titulo || (prod?.plataforma || prev.titulo),
                              descripcion: prev.descripcion || (prod?.descripcion || ''),
                              precio_manual: prev.precio_manual || (prod ? `$${Number(prod.precioDetal || 0).toFixed(2)}` : ''),
                            }));
                            if (prod?.imagen) setImagenPreview(prod.imagen);
                          }}
                          options={productos.filter(p => (p.tipo === 'kit' || p.disponibilidad === 'kit' || (p.categoria || '').toUpperCase() === 'KIT') && p.publicado !== false).map(p => ({ value: p.id, label: `${p.plataforma || 'Sin nombre'} - $${Number(p.precioDetal || 0).toFixed(2)}` }))}
                          placeholder="Seleccionar kit..."
                          className="w-full"
                        />
                      )}
                      
                      {formDataPublicidad.tipo_destino === 'combo_streaming' && (
                        <CustomSelect
                          value={formDataPublicidad.producto_id}
                          onChange={(v) => {
                            const prod = productos.find(p => p.id === v);
                            setFormDataPublicidad(prev => ({
                              ...prev,
                              producto_id: v,
                              url_destino: prod ? `/catalogo?producto=${prod.id}` : '',
                              url_imagen: prod?.imagen || prev.url_imagen,
                              titulo: prev.titulo || (prod?.plataforma || prev.titulo),
                              descripcion: prev.descripcion || (prod?.descripcion || ''),
                              precio_manual: prev.precio_manual || (prod ? `$${Number(prod.precioDetal || 0).toFixed(2)}` : ''),
                            }));
                            if (prod?.imagen) setImagenPreview(prod.imagen);
                          }}
                          options={productos.filter(p => p.esCombo && p.publicado !== false).map(p => ({ value: p.id, label: `${p.plataforma || 'Sin nombre'} - $${Number(p.precioDetal || 0).toFixed(2)}` }))}
                          placeholder="Seleccionar combo..."
                          className="w-full"
                        />
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-voltech-muted mb-2">🏷️ Categoría de Promoción</label>
                      <div className="flex gap-2">
                        <CustomSelect
                          value={formDataPublicidad.categoria_promo}
                          onChange={(v) => setFormDataPublicidad({...formDataPublicidad, categoria_promo: v})}
                          options={[
                            { value: '', label: 'Sin categoría' },
                            ...categoriasPromo.map(cat => ({ value: cat, label: cat }))
                          ]}
                          placeholder="Sin categoría"
                          className="flex-1"
                        />
                        <button onClick={() => setShowCategoriasPromoModal(true)} className="px-3 py-2 bg-voltech-purple/20 text-voltech-purple rounded-lg hover:bg-voltech-purple/30 transition-colors">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-voltech-muted mt-1">Ej: Promo del día, Descuento Exclusivo, Oferta Flash...</p>
                    </div>                  
                    <div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                      <label className="block text-sm font-medium text-voltech-muted mb-1">💰 Precio base ($)</label>
                      <input type="number" step="0.01" min="0" value={precioBaseNum || ''} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, precio_manual: e.target.value ? `$${Number(e.target.value).toFixed(2)}` : ''})} className="input-voltech w-full rounded-lg px-4 py-2" placeholder="0.00" />
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-voltech-muted mb-1">🏷️ Descuento (%)</label>
                      <input type="number" min="0" max="100" value={formDataPublicidad.descuento_pct || 0} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, descuento_pct: parseInt(e.target.value) || 0})} className="input-voltech w-full rounded-lg px-4 py-2" placeholder="0" />
                      </div>
                      </div>
                      {precioBaseNum > 0 && (
                      <div className="mb-4 p-3 rounded-lg bg-voltech-dark/30 border border-voltech-border flex items-center gap-3">
                      {descuentoPct > 0 ? (<>
                      <span className="text-gray-400 line-through text-sm">${precioBaseNum.toFixed(2)}</span>
                      <span className="text-emerald-400 font-black text-lg">${precioFinalNum.toFixed(2)}</span>
                      <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">−{descuentoPct}%</span>
                      </>) : (
                      <span className="text-emerald-400 font-black text-lg">${precioBaseNum.toFixed(2)}</span>
                      )}
                      </div>
                      )}
                      </div>
                      <div>
                      <div className="mb-4">
                      <label className="block text-sm font-medium text-voltech-muted mb-1">📲 Enviar a WhatsApp de (opcional)</label>
                      <p className="text-xs text-voltech-muted mb-2">Si eliges miembros, el botón abrirá WhatsApp a uno al azar.</p>
                      <div className="border border-voltech-border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[46px_1fr_1fr] gap-2 items-center px-3 py-2 bg-voltech-dark/60 border-b border-voltech-border">
                    <span className="text-[10px] font-bold text-voltech-muted uppercase tracking-wider">Check</span>
                    <span className="text-[10px] font-bold text-voltech-muted uppercase tracking-wider">Nombre</span>
                    <span className="text-[10px] font-bold text-voltech-muted uppercase tracking-wider">Teléfono</span>
                    </div>
                    <div className="max-h-44 overflow-y-auto">
                    {equipo.map(m => {
                    const sel = (formDataPublicidad.whatsapp_destinos || []).some(d => d.telefono === m.telefono);
                    return (
                    <label key={m.id} className={`grid grid-cols-[46px_1fr_1fr] gap-2 items-center px-3 py-2.5 cursor-pointer border-b border-voltech-border/60 last:border-b-0 transition-colors ${sel ? 'bg-voltech-cyan/10' : 'hover:bg-voltech-dark/40'}`}>
                    <input type="checkbox" checked={sel} onChange={() => toggleDestino(m)} className="w-4 h-4 rounded border-voltech-border text-voltech-cyan justify-self-center" />
                    <span className="text-sm text-white truncate">{m.nombre}</span>
                    <span className="text-xs text-voltech-muted font-mono truncate">{m.telefono}</span>
                    </label>
                    );
                    })}
                    {equipo.length === 0 && (
                    <p className="px-3 py-3 text-xs text-voltech-muted">No hay miembros en el equipo. Regístralos en Sistema → Equipo.</p>
                    )}
                    </div>
                    </div>
                    </div>
                    <div className="mb-4">
                    <label className="block text-sm font-medium text-voltech-muted mb-1">👋 Saludo del mensaje *</label>
                    <input type="text" value={formDataPublicidad.saludo_whatsapp || ''} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, saludo_whatsapp: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Ej: ¡Hola! Te escribo del catálogo 👋" />
                    </div>
                    <div className="mb-4">
                    <label className="block text-sm font-medium text-voltech-muted mb-1">✍️ Cierre del mensaje *</label>
                    <input type="text" value={formDataPublicidad.cierre_whatsapp || ''} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, cierre_whatsapp: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Ej: Quiero comprar ✅" />
                    <div className="flex gap-1 mt-2 flex-wrap">
                    {['Quiero comprar ✅', 'Quiero más información 🙋', 'Quiero aprovechar la oferta 🔥'].map(c => (
                    <button key={c} type="button" onClick={() => setFormDataPublicidad({...formDataPublicidad, cierre_whatsapp: c})} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${formDataPublicidad.cierre_whatsapp === c ? 'bg-voltech-cyan text-voltech-dark' : 'bg-voltech-border/50 text-voltech-muted hover:bg-voltech-border'}`}>{c}</button>
                    ))}
                    </div>
                    </div>                    <div className="mb-4">
                    <label className="block text-sm font-medium text-voltech-muted mb-2">👁️ Vista previa del mensaje de WhatsApp</label>
                    <BurbujaWA texto={mensajePublicidadWA} nombre="Cliente" />
                    </div>
                    <label className="block text-sm font-medium text-voltech-muted mb-2">🖼️ Imágenes del Banner * <span className="text-[10px]">(agrega todas las que quieras)</span></label>
                      <div onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleImagenesExtra(e.dataTransfer.files); }} onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer ${isDragOver ? 'border-voltech-cyan bg-voltech-cyan/10' : 'border-voltech-border'}`}>
                        <div className="flex flex-col items-center gap-2"><Upload className="w-6 h-6 text-voltech-muted" /><p className="text-sm text-voltech-muted">Arrastra o haz clic (puedes elegir varias)</p></div>
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => { handleImagenesExtra(e.target.files); e.target.value = ''; }} className="hidden" />
                      {todasImagenes.length > 0 && (
                        <div className="flex gap-3 flex-wrap mt-3">
                          {todasImagenes.map((img, i) => {
                            const esPortada = formDataPublicidad.url_imagen === img;
                            const esFondo = formDataPublicidad.url_fondo === img;
                            return (
                            <div key={i} className="w-28">
                              <div className="relative">
                                <img src={img} alt={`Img ${i+1}`} className={`w-28 h-28 object-cover rounded-lg border-2 ${esPortada ? 'border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]' : esFondo ? 'border-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.6)]' : 'border-voltech-border'}`} />
                                <button type="button" title="Quitar" onClick={() => quitarImagen(img)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-600"><X className="w-3 h-3" /></button>
                              </div>
                            <div className="flex gap-1 mt-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (esPortada) {
                                    setImagenPreview('');
                                    setFormDataPublicidad(p => ({ ...p, url_imagen: '' }));
                                  } else {
                                    setImagenPreview(img);
                                    setFormDataPublicidad(p => ({ ...p, url_imagen: img }));
                                  }
                                }}
                                className={`flex-1 text-[9px] px-1.5 py-1 rounded-full transition-all ${esPortada ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(34,211,238,0.6)]' : 'bg-gray-800/80 text-gray-400 opacity-70 hover:opacity-100'}`}
                              >
                                Portada
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (esFondo) {
                                    setBgImageIndex(0);
                                    setFormDataPublicidad(p => ({ ...p, url_fondo: '' }));
                                  } else {
                                    setBgImageIndex(i);
                                    setFormDataPublicidad(p => ({ ...p, url_fondo: img }));
                                  }
                                }}
                                className={`flex-1 text-[9px] px-1.5 py-1 rounded-full transition-all ${esFondo ? 'bg-fuchsia-500 text-white font-bold shadow-[0_0_10px_rgba(217,70,239,0.6)]' : 'bg-gray-800/80 text-gray-400 opacity-70 hover:opacity-100'}`}
                              >
                                Fondo
                              </button>
                           </div>
                          </div>
                        )})}
                      </div>
                    )}
                    </div>
                    </div>
                    <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-voltech-muted mb-2">🔘 Texto del Botón (CTA)</label>
                        <input type="text" value={formDataPublicidad.texto_boton} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, texto_boton: e.target.value.toUpperCase()})} className="input-voltech w-full rounded-lg px-4 py-2" placeholder="VER OFERTA" />
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {['VER OFERTA', 'COMPRA YA', 'VER MÁS', 'APROVECHAR', 'QUIERO UNO'].map(txt => (
                            <button key={txt} type="button" onClick={() => setFormDataPublicidad({...formDataPublicidad, texto_boton: txt})} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${formDataPublicidad.texto_boton === txt ? 'bg-voltech-cyan text-voltech-dark' : 'bg-voltech-border/50 text-voltech-muted hover:bg-voltech-border'}`}>{txt}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-voltech-muted mb-2">🎨 Color del Botón</label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={formDataPublicidad.color_boton || '#22d3ee'} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, color_boton: e.target.value})} className="w-12 h-10 rounded-lg border border-voltech-border cursor-pointer bg-transparent" />
                          <input type="text" value={formDataPublicidad.color_boton || '#22d3ee'} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, color_boton: e.target.value})} className="input-voltech flex-1 rounded-lg px-3 py-2 text-sm font-mono" placeholder="#22d3ee" />
                        </div>
                        <div className="flex gap-1 mt-2">
                          {['#22d3ee', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map(c => (
                            <button key={c} type="button" onClick={() => setFormDataPublicidad({...formDataPublicidad, color_boton: c})} className="w-6 h-6 rounded-full border-2 border-voltech-border hover:scale-110 transition-transform" style={{ backgroundColor: c }} title={c} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* 🎛️ Switch "2 imágenes" + colores de texto */}
                    <div className="sm:col-span-2 bg-voltech-dark/30 border border-voltech-border rounded-lg p-3 space-y-3">
                      <label className="flex items-center justify-between gap-2 cursor-pointer">
                        <span className="text-xs font-medium text-voltech-muted">🖼️ Modo 2 Imágenes (rellena espacios en PC)</span>
                        <button type="button" onClick={() => setModoDosImagenes(!modoDosImagenes)} className={`relative w-10 h-5 rounded-full transition-colors ${modoDosImagenes ? 'bg-voltech-cyan' : 'bg-slate-700'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${modoDosImagenes ? 'left-5' : 'left-0.5'}`} />
                        </button>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-voltech-muted mb-1">Color Título</label>
                          <input type="color" value={formDataPublicidad.color_titulo || '#ffffff'} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, color_titulo: e.target.value})} className="w-full h-8 rounded-lg border border-voltech-border cursor-pointer bg-transparent" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-voltech-muted mb-1">Color Descripción</label>
                          <input type="color" value={formDataPublicidad.color_descripcion || '#ffffff'} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, color_descripcion: e.target.value})} className="w-full h-8 rounded-lg border border-voltech-border cursor-pointer bg-transparent" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-voltech-muted mb-1">Color Precio</label>
                          <input type="color" value={formDataPublicidad.color_precio || '#34d399'} onChange={(e) => setFormDataPublicidad({...formDataPublicidad, color_precio: e.target.value})} className="w-full h-8 rounded-lg border border-voltech-border cursor-pointer bg-transparent" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <CustomSelect
                        label="🖥️ Ubicación en WEB"
                        value={formDataPublicidad.ubicacion_web || 'oculta'}
                        onChange={(v) => setFormDataPublicidad({...formDataPublicidad, ubicacion_web: v})}
                        options={[
                          { value: 'oculta', label: 'No mostrar en web' },
                          { value: 'arriba', label: '⬆️ Banner superior' },
                          { value: 'abajo', label: '⬇️ Banner inferior' }
                        ]}
                        placeholder="Selecciona ubicación"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <CustomSelect
                        label="📱 Ubicación en MÓVIL"
                        value={formDataPublicidad.ubicacion_movil || 'oculta'}
                        onChange={(v) => setFormDataPublicidad({...formDataPublicidad, ubicacion_movil: v})}
                        options={[
                          { value: 'oculta', label: 'No mostrar en móvil' },
                          { value: 'arriba', label: '⬆️ Banner superior' },
                          { value: 'abajo', label: '⬇️ Final de página' }
                        ]}
                        placeholder="Selecciona ubicación"
                        className="w-full"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  </div>

                  {/* 👁️ VISTA PREVIA EN VIVO DEL BANNER */}
                  <div className="mt-6 space-y-3 lg:col-span-2">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2"><Eye className="w-4 h-4 text-voltech-cyan" /> Vista Previa en Vivo</h4>
                    <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
                      {/* 🖥️ PC: imagen al ALTO, ancho auto (máx 70%) */}
                      <div className="w-full lg:flex-1 lg:max-w-[800px]">
                        <p className="text-xs text-voltech-muted mb-1">🖥️ Así se verá en PC <span className="text-voltech-cyan ml-1">• Imagen al alto · ancho auto (máx 70%)</span></p>
                        <div className="relative w-full h-[260px] overflow-hidden rounded-2xl border border-voltech-border bg-black shadow-2xl flex">
                          {modoDosImagenes && imgsPC.length >= 2 ? (
                            /* 🟢 Ancho dinámico para que la imagen vertical llene la altura sin vacíos */
                            <div className="h-full max-w-[70%] shrink-0 bg-black flex items-center justify-start overflow-hidden">
                              <img 
                                src={imgsPC[0]} 
                                alt="" 
                                className="h-full w-auto object-cover shrink-0" 
                              />
                              <img 
                                src={imgsPC[1]} 
                                alt="" 
                                className="h-full w-auto object-contain bg-white shrink-0" 
                              />
                            </div>
                          ) : (
                            <div className="h-full max-w-[70%] bg-black flex items-center justify-center" style={{ aspectRatio: `${portadaRatio || 1}` }}>
                              {imagenPreview ? (
                                <img src={imagenPreview} alt="" className="w-full h-full object-contain" />
                              ) : (
                                <ImageIcon className="w-12 h-12 opacity-40 text-voltech-muted" />
                              )}
                            </div>
                          )}
                          <div className="relative h-full flex-1 bg-black">
                            {formDataPublicidad.url_fondo && <img src={formDataPublicidad.url_fondo} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                            <div className="absolute inset-0 bg-black/60"></div>
                            <div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center gap-2 p-4">
                              <h2 className="text-lg lg:text-xl font-extrabold text-white drop-shadow leading-tight line-clamp-2" style={{ color: formDataPublicidad.color_titulo || '#fff' }}>{formDataPublicidad.titulo || 'Título del anuncio'}</h2>
                              {formDataPublicidad.descripcion && <p className="text-xs drop-shadow line-clamp-2" style={{ color: formDataPublicidad.color_descripcion || '#fff' }}>{formDataPublicidad.descripcion}</p>}
                              {precioBaseNum > 0 && descuentoPct > 0 && <p className="text-gray-400 line-through text-sm drop-shadow">${precioBaseNum.toFixed(2)}</p>}
                              {precioBaseNum > 0 && <p className="text-emerald-400 font-black text-lg drop-shadow" style={{ color: formDataPublicidad.color_precio || '#34d399' }}>${precioFinalNum.toFixed(2)}{descuentoPct > 0 && <span className="ml-2 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">−{descuentoPct}%</span>}</p>}
                              <span className="px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg" style={{ backgroundColor: formDataPublicidad.color_boton || '#22d3ee', color: '#0a0a0a' }}>{formDataPublicidad.texto_boton || 'VER OFERTA'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 📱 Móvil: Banner Horizontal idéntico al catálogo (HBO MAX / Netflix) */}
                      <div className="w-full max-w-[420px] flex-shrink-0">
                        <p className="text-xs text-voltech-muted mb-1">📱 Así se verá en Móvil <span className="text-voltech-cyan ml-1">• Horizontal imagen izq + texto der</span></p>
                        <div className="w-full rounded-2xl overflow-hidden bg-black border border-slate-800/80 flex flex-row items-center h-44 shadow-2xl">
                          {/* 1. LADO IZQUIERDO: Multimedia */}
                          <div className="h-full max-w-[70%] relative flex items-center justify-center bg-black overflow-hidden shrink-0" style={{ aspectRatio: `${portadaRatio || 1}` }}>
                            {modoDosImagenes && imgsPC.length >= 2 ? (
                            <div className="w-full h-full flex overflow-x-auto overflow-y-hidden no-scrollbar snap-x snap-mandatory">
                            <div className="w-full h-full shrink-0 snap-center flex items-center justify-center bg-black">
                            <img src={imgsPC[0]} alt="" className="max-h-full max-w-full object-contain" />
                            </div>
                            <div className="w-full h-full shrink-0 snap-center flex items-center justify-center bg-black">
                            <img src={imgsPC[1]} alt="" className="max-h-full max-w-full object-contain" />
                            </div>
                            </div>
                            ) : formDataPublicidad.url_video ? (
                              <video src={formDataPublicidad.url_video} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                            ) : imagenPreview ? (
                              <img src={imagenPreview} alt={formDataPublicidad.titulo || ''} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-8 h-8 opacity-40 text-voltech-muted" />
                            )}
                          </div>
                          {/* 2. LADO DERECHO: Fondo Negro + Texto + Botón */}
                          <div className="relative flex-1 h-full p-3 flex flex-col justify-center items-center text-center gap-1 bg-black overflow-hidden shrink-0">
                            {formDataPublicidad.url_fondo && (
                              <img src={formDataPublicidad.url_fondo} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none" />
                            )}
                            <p className="text-xs font-black tracking-wide uppercase drop-shadow leading-tight line-clamp-2 w-full z-10" style={{ color: formDataPublicidad.color_titulo || '#fff' }}>
                              {formDataPublicidad.titulo || 'Título'}
                            </p>
                            {formDataPublicidad.descripcion && (
                              <p className="text-[10px] drop-shadow line-clamp-1 z-10" style={{ color: formDataPublicidad.color_descripcion || '#fff' }}>
                                {formDataPublicidad.descripcion}
                              </p>
                            )}
                            {precioBaseNum > 0 && descuentoPct > 0 && <p className="text-gray-400 line-through text-[10px] drop-shadow z-10">${precioBaseNum.toFixed(2)}</p>}
                            {precioBaseNum > 0 && (
                            <p className="font-black text-xs drop-shadow z-10" style={{ color: formDataPublicidad.color_precio || '#34d399' }}>
                            ${precioFinalNum.toFixed(2)}
                            </p>
                            )}
                            <span
                              className="mt-1 px-3 py-1.5 rounded-lg font-black transition-transform active:scale-95 text-[9px] uppercase shadow-md z-10 truncate max-w-full"
                              style={{ backgroundColor: formDataPublicidad.color_boton || '#22d3ee', color: '#0a0a0a' }}
                            >
                              {formDataPublicidad.texto_boton || 'VER OFERTA'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                <button onClick={guardarPublicidad} className="flex-1 px-4 py-2 bg-voltech-cyan text-white rounded-lg">Guardar</button>
                <button onClick={() => { setShowPublicidadForm(false); setPublicidadEditando(null); }} className="px-4 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-voltech-muted">Cancelar</button>
                </div>
                </div>
                )}
                <div className="p-6 border-b border-voltech-border">
                <h3 className="text-lg font-bold text-white">Publicidades Creadas</h3>              <div className="divide-y divide-voltech-border">
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
                            {(() => { const vencida = pub.fecha_fin && new Date(pub.fecha_fin + 'T23:59') < new Date(); return (<span className={vencida ? 'text-voltech-error font-bold' : pub.estado === 'activo' ? 'text-voltech-success' : 'text-voltech-muted'}>{vencida ? '⏰ Vencida' : pub.estado === 'activo' ? 'Activo' : 'Inactivo'}</span>); })()}
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
                            <button onClick={() => { setPublicidadEditando(pub); setImagenPreview(pub.url_imagen || ''); setImagenesExtra((pub.imagenes || []).slice(1)); setModoDosImagenes(!!pub.modo_2_imagenes); setFormDataPublicidad(prev => ({ ...prev, ...pub, ubicacion_web: pub.ubicacion_web || 'oculta', ubicacion_movil: pub.ubicacion_movil || 'arriba' })); setShowPublicidadForm(true); }} className="p-2 hover:bg-voltech-cyan/20 rounded-lg text-voltech-cyan">
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
                          <CustomSelect
                            label="🖥️ Ubicación en WEB"
                            value={masVendidosConfig.ubicacion_web || 'oculta'}
                            onChange={(v) => setMasVendidosConfig({...masVendidosConfig, ubicacion_web: v})}
                            options={[
                              { value: 'oculta', label: 'No mostrar en web' },
                              { value: 'izquierda', label: '⬅️ Columna izquierda' },
                              { value: 'derecha', label: '➡️ Columna derecha' }
                            ]}
                            placeholder="Selecciona ubicación"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <CustomSelect
                            label="📱 Ubicación en MÓVIL"
                            value={masVendidosConfig.ubicacion_movil || 'oculta'}
                            onChange={(v) => setMasVendidosConfig({...masVendidosConfig, ubicacion_movil: v})}
                            options={[
                              { value: 'oculta', label: 'No mostrar en móvil' },
                              { value: 'arriba', label: '⬆️ Banner superior (junto a publicidad)' },
                              { value: 'abajo', label: '⬇️ Final de página' }
                            ]}
                            placeholder="Selecciona ubicación"
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-voltech-muted mb-1">Título de la Sección</label>
                          <input type="text" value={masVendidosConfig.titulo} onChange={(e) => setMasVendidosConfig({...masVendidosConfig, titulo: e.target.value})} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                        </div>
                        <div>
                          <CustomSelect
                            label="Cantidad Máxima"
                            value={String(masVendidosConfig.cantidad_maxima)}
                            onChange={(v) => setMasVendidosConfig({...masVendidosConfig, cantidad_maxima: parseInt(v)})}
                            options={[
                              { value: '1', label: '1' },
                              { value: '2', label: '2' },
                              { value: '3', label: '3' },
                              { value: '4', label: '4' },
                              { value: '5', label: '5' },
                              { value: '6', label: '6' }
                            ]}
                            placeholder="Selecciona cantidad"
                            className="w-full"
                          />
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

      {/* ✅ Modal de gestión de Categorías de Promoción */}
      <AnimatePresence>
        {showCategoriasPromoModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-voltech-surface border border-voltech-border rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Tag className="w-5 h-5 text-voltech-purple" /> Categorías de Promoción
                  </h3>
                  <button onClick={() => setShowCategoriasPromoModal(false)} className="p-2 rounded-lg hover:bg-voltech-border">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-6 p-4 bg-voltech-dark/50 rounded-lg border border-voltech-border">
                  <h4 className="text-sm font-semibold text-voltech-cyan mb-3">Agregar Nueva</h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={nuevaCategoriaPromo}
                      onChange={(e) => setNuevaCategoriaPromo(e.target.value)}
                      placeholder="Ej: Promo del día, Oferta Flash..."
                      className="input-voltech flex-1 rounded-lg px-4 py-2 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && agregarCategoriaPromo()}
                    />
                    <button onClick={agregarCategoriaPromo} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Agregar
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-voltech-purple mb-3">Categorías Existentes</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {categoriasPromo.map((cat, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-voltech-dark/50 p-3 rounded-lg border border-voltech-border">
                        <span className="text-sm text-white flex-1">{cat}</span>
                        <button 
                          onClick={() => eliminarCategoriaPromo(cat)}
                          className="p-2 text-voltech-error hover:bg-voltech-error/10 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {categoriasPromo.length === 0 && (
                      <p className="text-xs text-voltech-muted text-center py-4">No hay categorías creadas</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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