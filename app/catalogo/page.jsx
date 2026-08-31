'use client';

import BannerCard from '@/components/BannerCard';
import { useState, useEffect, useRef, useMemo } from 'react';
import CustomSelect from '@/components/CustomSelect';
import { useTheme } from '@/app/context/ThemeContext';
import { useProductos, useSettings, useTasaBCV, useAuth } from '@/hooks/useVoltech';
import { supabase } from '@/lib/supabase';
import { 
  Search, ShoppingCart, MessageCircle, X, Plus, Minus, Trash2, 
  MapPin, Tag, Star, Gift, CheckCircle, Package, TrendingUp, 
  Sun, Moon, Play, Clock, Zap, Truck,
  Sparkles, Trophy, AlertCircle, Ticket, Copy, Users, LayoutDashboard, LogIn,
  MessageSquare, ThumbsUp, Upload, Percent, Share2,
  Image as ImageIcon, FileText, Info, Menu, ChevronDown,
User, Settings, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import ChatbotWidget from '@/components/ChatbotWidget';
import WhatsAppIcon from '@/components/WhatsAppIcon';

// ✅ Abre WhatsApp NATIVO en móvil o WhatsApp Web en PC (conserva emojis)
  const abrirWhatsAppNat = (numero, texto) => {
const limpio = String(numero || '').replace(/\D/g, '');
const cod = encodeURIComponent(texto);
const esMovil = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
if (esMovil) {
// ✅ MÓVIL: abre la APP de WhatsApp directamente (deep link)
window.location.href = `https://wa.me/${limpio}?text=${cod}`;
} else {
// ✅ PC: abre WhatsApp Web/App de escritorio directo (sin página intermedia)
window.open(`https://web.whatsapp.com/send?phone=${limpio}&text=${cod}`, '_blank');
}
};

// ✅ CARRUSEL DE IMÁGENES: portada primero + flechas ‹ › + puntitos (para tarjetas y modal)
const CarruselImagen = ({ imagenes, alt, className = '', objectFit = 'cover', iconoVacio = null }) => {
  const [idx, setIdx] = useState(0);
  const todas = (imagenes || []).filter(Boolean);
  if (todas.length === 0) {
    return iconoVacio || <Package className="w-12 h-12 text-slate-300" />;
  }
  const actual = todas[Math.min(idx, todas.length - 1)];
  return (
    <>
      <img
        src={actual}
        alt={alt}
        className={className}
        style={{ objectFit }}
        onError={(e) => { e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2UyZThmMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOWE5YWE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2luIEltYWdlbjwvdGV4dD48L3N2Zz4='; }}
      />
      {todas.length > 1 && (
        <>
          <button type="button" onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + todas.length) % todas.length); }} className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-black/80">‹</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % todas.length); }} className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-black/80">›</button>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 flex gap-1 bg-black/30 rounded-full px-1.5 py-0.5">
            {todas.map((_, i) => (
              <span key={i} className={`h-1 rounded-full transition-all ${i === Math.min(idx, todas.length - 1) ? 'w-3 bg-voltech-cyan' : 'w-1 bg-white/60'}`} />
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default function CatalogoPage() {
  const [activeSection, setActiveSection] = useState('productos');
  
  const { productos } = useProductos();
  const { settings } = useSettings();
  const { tasa: tasaBCV, setTasa: setTasaBCV } = useTasaBCV();
  const { currentUser, setCurrentUser } = useAuth();

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('retiro');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [customerLocation, setCustomerLocation] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showPreciosMayor, setShowPreciosMayor] = useState(false);
  const { darkMode, setDarkMode } = useTheme();
  
  const [agenciaEnvio, setAgenciaEnvio] = useState('MRW');
  const [oficinaDestino, setOficinaDestino] = useState('');
  const [autoReferrer, setAutoReferrer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [sorteoActivo, setSorteoActivo] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [ticketGenerado, setTicketGenerado] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [formDataSorteo, setFormDataSorteo] = useState({
    nombre: '', apellido: '', telefono: '', correo: '', producto_votado_id: null,
    codigoCompra: '', codigoReferido: ''
  });
  const [bonusTickets, setBonusTickets] = useState({ compra: 0, referido: 0 });
  const [loadingSorteo, setLoadingSorteo] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
  const [productosVotacion, setProductosVotacion] = useState([]);
  const [showWinners, setShowWinners] = useState(false);
  
  const [opiniones, setOpiniones] = useState([]);
  const [showOpinionForm, setShowOpinionForm] = useState(false);
  const [formDataOpinion, setFormDataOpinion] = useState({
    nombre: '', telefono: '', rating: 5, comentario: '', producto: '', foto: null,
    donde_nos_conocio: ''
  });
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showBannerSorteo, setShowBannerSorteo] = useState(true);

  const [publicidad, setPublicidad] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [masVendidosConfig, setMasVendidosConfig] = useState(null);
  const [whatsappNumero, setWhatsappNumero] = useState('584125378515'); // Número por defecto
  
const [showTermsModal, setShowTermsModal] = useState(false);
const [terminosAceptados, setTerminosAceptados] = useState(false);
const [verTerminosCompletos, setVerTerminosCompletos] = useState(false);
const [showMobileMenu, setShowMobileMenu] = useState(false);
const [showUserMenu, setShowUserMenu] = useState(false);
const [ofertasTab, setOfertasTab] = useState('productos');
const [clienteNombre, setClienteNombre] = useState('');
const [clienteTelefono, setClienteTelefono] = useState('');
const bannerRef = useRef(null);
const [bannerIdx, setBannerIdx] = useState(0);
const [isPaused, setIsPaused] = useState(false);

// ⚡ OFERTA RELÁMPAGO (configurada en Ajustes)
const [ofertaRelampago, setOfertaRelampago] = useState(null);
useEffect(() => {
  const cargarOferta = async () => {
    let cfg = null;
    if (supabase) {
      try {
        const { data } = await supabase.from('settings').select('valor').eq('clave', 'oferta_relampago').maybeSingle();
        if (data?.valor) cfg = typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor;
      } catch (e) {}
    }
    if (!cfg) { try { cfg = JSON.parse(localStorage.getItem('voltech_oferta_relampago') || 'null'); } catch (e) {} }
    setOfertaRelampago(cfg);
  };
  cargarOferta();
  const h = () => cargarOferta();
  window.addEventListener('voltech-data-updated', h);
  return () => window.removeEventListener('voltech-data-updated', h);
}, []);
const ofertaActiva = useMemo(() => {
  if (!ofertaRelampago || !ofertaRelampago.activo) return null;
  const now = new Date();
  if (ofertaRelampago.inicio && now < new Date(ofertaRelampago.inicio)) return null;
  if (ofertaRelampago.fin && now > new Date(ofertaRelampago.fin)) return null;
  return ofertaRelampago;
}, [ofertaRelampago]);

// 🔴 NUEVO ESTADO: Guarda la relación de aspecto dinámica de cada imagen
const [ratios, setRatios] = useState({});

useEffect(() => {
  if (!publicidad.length) return;
  let mounted = true;
  publicidad.filter(p => p.url_imagen).forEach(p => {
    const img = new Image();
    img.onload = () => { 
      if (mounted) {
        setRatios(r => ({ ...r, [p.id]: img.naturalWidth / (img.naturalHeight || 1) }));
      }
    };
    img.src = p.url_imagen;
  });
  return () => { mounted = false; };
}, [publicidad]);
  const scrollBanner = (dir) => {
    const el = bannerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };
  const onBannerScroll = () => {
    const el = bannerRef.current;
    if (!el) return;
    setBannerIdx(Math.round(el.scrollLeft / el.clientWidth));
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let refCode = urlParams.get('ref') || urlParams.get('v');
    if (!refCode && window.location.hash) {
    refCode = window.location.hash.replace(/^#\/?/, '').replace(/^ref=/i, '');
    }
    if (refCode) {
    refCode = refCode.toUpperCase();
    setAutoReferrer(refCode);
    sessionStorage.setItem('voltech_ref_detectado', refCode);
    localStorage.setItem('voltech_ref', JSON.stringify({ codigo: refCode, fecha: new Date().toISOString() }));
    // ✅ INTERNO: el cliente SIEMPRE ve el link original (se limpia la URL)
    const url = new URL(window.location.href);
    url.searchParams.delete('ref');
    url.searchParams.delete('v');
    window.history.replaceState({}, '', url.pathname + url.search);
    } else {
    try {
    const guardado = JSON.parse(localStorage.getItem('voltech_ref') || 'null');
    if (guardado?.codigo) setAutoReferrer(guardado.codigo);
    } catch (e) {}
    }
    const participantesGuardados = localStorage.getItem('voltech_participantes');
    const opinionesGuardadas = localStorage.getItem('voltech_opiniones');
    const cartGuardado = localStorage.getItem('voltech_cart');

    if (cartGuardado) setCart(JSON.parse(cartGuardado));
    if (participantesGuardados) setParticipantes(JSON.parse(participantesGuardados));
    if (opinionesGuardadas) setOpiniones(JSON.parse(opinionesGuardadas));
  }, []);

  useEffect(() => {
    const cargarDatosExtras = async () => {
      let pubs = [], vts = [], mvConfig = null, ops = [];
      
      if (supabase) {
        try {
        const [{ data: pData }, { data: vData }, { data: mvData }, { data: settingsData }] = await Promise.all([
          supabase.from('publicidad').select('*').eq('estado', 'activo'),
          supabase.from('ventas').select('*'),
          supabase.from('marketing_config').select('valor').eq('clave', 'mas_vendidos').single(),
          supabase.from('settings').select('clave, valor').in('clave', ['telefono_tienda', 'whatsapp_numero', 'tienda'])
        ]);
        if (pData) pubs = pData;
        if (vData) vts = vData;
        if (mvData?.valor) mvConfig = mvData.valor;
        
        // ✅ Normaliza: quita símbolos, y si empieza en 0 le pone 58
        const normalizarWa = (val) => {
          let d = String(val || '').replace(/\D/g, '');
          if (d.startsWith('0')) d = '58' + d;
          else if (!d.startsWith('58')) d = '58' + d;
          return d;
        };
        // ✅ PRIORIDAD 1: Ajustes → Tienda (o claves sueltas)
        const tiendaVal = settingsData?.find(s => s.clave === 'tienda')?.valor || {};
        const telefonoSetting = settingsData?.find(s => s.clave === 'telefono_tienda' || s.clave === 'whatsapp_numero');
        const rawNumero = telefonoSetting?.valor || tiendaVal.whatsapp || tiendaVal.telefono || tiendaVal.whatsappUrl || '';
        if (rawNumero) {
        setWhatsappNumero(normalizarWa(rawNumero));
        } else {
        // ✅ PRIORIDAD 2: tabla equipo (Admin)
        const { data: equipoData } = await supabase.from('equipo').select('*').eq('rol', 'Admin').limit(1);
        if (equipoData && equipoData.length > 0 && equipoData[0].telefono) {
        setWhatsappNumero(normalizarWa(equipoData[0].telefono));
        }
        }
        // ✅ OPINIONES desde Supabase (visibles para todo el público)
        try {
        const { data: opData } = await supabase.from('opiniones').select('*');
        if (opData && opData.length > 0) ops = opData;
        } catch (opErr) { console.warn('⚠️ Opiniones no disponibles en Supabase:', opErr.message); }        } catch (e) {
        console.warn('⚠️ Supabase no disponible, usando respaldo local:', e.message);
        }
        }
        // ✅ Si Supabase no trajo nada (RLS, error o sin conexión), usa el respaldo local
        if (pubs.length === 0) {
        try { 
        pubs = JSON.parse(localStorage.getItem('voltech_publicidad') || '[]').filter(p => p.estado === 'activo');
        } catch (e) {}
        } 
        if (vts.length === 0) {
      const localVts = localStorage.getItem('voltech_ventas');
      if (localVts) vts = JSON.parse(localVts);
     }      if (!mvConfig) {
        const localMv = localStorage.getItem('voltech_mas_vendidos_config');
        if (localMv) mvConfig = JSON.parse(localMv);
      }
      
      const now = new Date();
      const filtradas = pubs.filter(p => {
        if (p.mostrar_en && p.mostrar_en.catalogo === false) return false;
        if (p.fecha_inicio && p.fecha_fin) {
          const start = new Date(p.fecha_inicio + 'T' + (p.hora_inicio || '00:00'));
          const end = new Date(p.fecha_fin + 'T' + (p.hora_fin || '23:59'));
          if (now < start || now > end) return false;
        }
        return true;
      });

  setPublicidad(filtradas);
  setVentas(vts);
  setMasVendidosConfig(mvConfig);
  if (ops.length > 0) {
  setOpiniones(ops);
  localStorage.setItem('voltech_opiniones', JSON.stringify(ops));
  }
  };cargarDatosExtras();
  const handleActualizacion = () => cargarDatosExtras();
  window.addEventListener('voltech-data-updated', handleActualizacion);
  return () => window.removeEventListener('voltech-data-updated', handleActualizacion);
  }, []);

  useEffect(() => {
    if (productos.length === 0) return;

    const sorteosGuardados = localStorage.getItem('voltech_sorteos');
    const votosGuardados = localStorage.getItem('voltech_sorteo_votos');

    if (sorteosGuardados) {
      const sorteos = JSON.parse(sorteosGuardados);
      const activo = sorteos.find(s => s.estado === 'activo');
      if (activo) {
        setSorteoActivo(activo);
        if (activo.tipo_sorteo === 'votacion' && activo.productos_candidatos) {
          const candidatos = productos.filter(p => activo.productos_candidatos.includes(p.id));
          setProductosVotacion(candidatos);
        }
      }
    }
    
    if (votosGuardados) {
      const sorteos = JSON.parse(localStorage.getItem('voltech_sorteos') || '[]');
      const activo = sorteos.find(s => s.estado === 'activo');
      if (activo && activo.tipo_sorteo === 'votacion') {
        const votos = JSON.parse(votosGuardados);
        const votosSorteo = votos[activo.id] || {};
        setProductosVotacion(prev => prev.map(p => ({ ...p, votos: votosSorteo[p.id] || 0 })));
      }
    }
  }, [productos]);

    useEffect(() => {
    localStorage.setItem('voltech_cart', JSON.stringify(cart));
    setTerminosAceptados(false);
    }, [cart]);

  // ✅ NUEVO: Contar visitas públicas (NO cuenta logueados), 1 por sesión
  useEffect(() => {
    const yaContada = sessionStorage.getItem('voltech_visita_contada');
    const logueado = localStorage.getItem('voltech_user');
    if (!yaContada && !logueado && supabase) {
      sessionStorage.setItem('voltech_visita_contada', '1');
      const ref = sessionStorage.getItem('voltech_ref_detectado') || new URLSearchParams(window.location.search).get('ref');
    supabase
      .from('visitas_publicas')
      .insert({ ref_code: ref ? ref.toUpperCase() : null })
        .then(({ error }) => { if (error) console.warn('No se registró visita:', error.message); });
    }
  }, []);
    useEffect(() => {
    if (productos.length === 0) return;
    const prodId = new URLSearchParams(window.location.search).get('producto');
    if (prodId) {
      const prod = productos.find(p => String(p.id) === String(prodId));
      if (prod) {
        setActiveSection(prod.tipo === 'streaming' ? 'streaming' : 'productos');
        setSelectedProduct(prod);
      }
    }
  }, [productos]);

  useEffect(() => {
    if (!sorteoActivo) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(sorteoActivo.fecha_fin).getTime();
      const distance = end - now;
      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
        return;
      }
      setTimeLeft({
        dias: Math.floor(distance / (1000 * 60 * 60 * 24)),
        horas: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutos: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        segundos: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sorteoActivo]);

const productosMasVendidos = useMemo(() => {
if (!productos.length) return [];
const conteo = {};
(ventas || []).forEach(v => {
if (v.productos && Array.isArray(v.productos)) {
v.productos.forEach(p => {
conteo[p.productoId] = (conteo[p.productoId] || 0) + (Number(p.cantidad) || 1);
});
}
});
// ✅ SOLO productos que tengan ventas reales; si aún no hay ventas, muestra publicados
const conVentas = productos.filter(p => (conteo[p.id] || 0) > 0);
const base = conVentas.length > 0 ? conVentas : productos.filter(p => p.publicado);
return base
.map(p => ({ ...p, vendidos: conteo[p.id] || 0 }))
.sort((a, b) => b.vendidos - a.vendidos)
.slice(0, masVendidosConfig?.cantidad_maxima || 6);
}, [productos, ventas, masVendidosConfig]);
  const tieneSoloProductosDigitales = cart.length > 0 && cart.every(item => item.tipo === 'streaming' || item.categoria?.toUpperCase() === 'STREAMING');
  
  const getPrecioPub = (pub) => {
if (pub.precio_manual) return pub.precio_manual;
const prod = productos.find(pr => `/catalogo?producto=${pr.id}` === pub.url_destino);
return prod ? `$${Number(prod.precioDetal || 0).toFixed(2)}` : null;
};
const calcularPrecioBs = (precioUsd) => {
    const precio = Number(precioUsd) || 0;
    return (precio * tasaBCV).toFixed(2);
  };

  const getPrecioMostrar = (producto) => {
    const precioOferta = Number(producto.precio_oferta || producto.precioOferta) || 0;
    const precioDetal = Number(producto.precioDetal || producto.precio_detal) || 0;
    
    if (precioOferta > 0 && precioOferta < precioDetal) {
      return { precioPrincipal: precioOferta, precioTachado: precioDetal, tieneOferta: true };
    }
    return { precioPrincipal: precioDetal, precioTachado: null, tieneOferta: false };
  };

  const getImagenProducto = (p) => {
    if (p.imagen) return p.imagen;
    if (Array.isArray(p.imagenes) && p.imagenes.length > 0) return p.imagenes[0];
    if (Array.isArray(p.productos_kit) && p.productos_kit.length > 0) {
      for (const item of p.productos_kit) {
        const prod = (productos || []).find(x => x.id === item.producto_id);
        if (prod && prod.imagen) return prod.imagen;
      }
    }
    if (p.esCombo && Array.isArray(p.plataformasCombo) && p.plataformasCombo.length > 0) {
      for (const nombre of p.plataformasCombo) {
        const prod = (productos || []).find(x => (x.plataforma === nombre || x.producto === nombre) && x.imagen);
        if (prod) return prod.imagen;
      }
    }
    return '';
  };

  const addToCart = (producto) => {
    const existingItem = cart.find(item => item.id === producto.id);
    if (existingItem) {
      setCart(cart.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCart([...cart, { ...producto, cantidad: 1 }]);
    }
    toast.success('Producto agregado al carrito');
  };

  const removeFromCart = (productoId) => {
    setCart(cart.filter(item => item.id !== productoId));
    toast.success('Producto eliminado');
  };

  const updateQuantity = (productoId, cantidad) => {
    if (cantidad <= 0) removeFromCart(productoId);
    else setCart(cart.map(item => item.id === productoId ? { ...item, cantidad } : item));
  };

  const applyCoupon = () => {
    if (!couponCode.trim()) { toast.error('Ingresa un código'); return; }
    
    const cupones = JSON.parse(localStorage.getItem('voltech_cupones') || '[]');
    const cupon = cupones.find(c => c.codigo === couponCode.toUpperCase() && c.estado === 'activo' && new Date(c.fecha_vencimiento) > new Date());

    if (!cupon) { toast.error('Cupón inválido o expirado'); return; }

    const subtotal = cart.reduce((sum, item) => sum + (getPrecioMostrar(item).precioPrincipal * item.cantidad), 0);
    
    if (cupon.monto_minimo && subtotal < cupon.monto_minimo) {
      toast.error(`Monto mínimo de compra: $${cupon.monto_minimo.toFixed(2)}`);
      return;
    }

    if (cupon.excluir_ofertas) {
      const tieneOfertas = cart.some(item => item.precio_oferta || item.precioOferta);
      if (tieneOfertas) {
        toast.error('Este cupón no aplica a productos que ya tienen oferta');
        return;
      }
    }

    let descuentoCalculado = 0;
    let mensajeExito = '';

    const tipoAplicacion = cupon.tipo_aplicacion || (cupon.aplica_a === 'especificos' ? 'varios_productos' : 'todos');
    const targetIds = cupon.producto_ids || cupon.productos_especificos || [];

    if (tipoAplicacion === 'todos') {
      if (cupon.tipo_descuento === 'gratis' || cupon.es_gratis) {
        descuentoCalculado = subtotal;
        mensajeExito = '¡Compra 100% GRATIS con este cupón!';
      } else if (cupon.tipo_descuento === 'porcentaje') {
        descuentoCalculado = subtotal * ((cupon.valor_descuento || cupon.valor || 0) / 100);
        mensajeExito = `Cupón ${cupon.codigo} aplicado: -$${descuentoCalculado.toFixed(2)}`;
      } else {
        descuentoCalculado = Math.min(cupon.valor_descuento || cupon.valor || 0, subtotal);
        mensajeExito = `Cupón ${cupon.codigo} aplicado: -$${descuentoCalculado.toFixed(2)}`;
      }
    } else {
      const productosAplicables = cart.filter(item => targetIds.includes(item.id));
      
      if (productosAplicables.length === 0) {
        toast.error('Este cupón no es válido para los productos en tu carrito');
        return;
      }

      const subtotalAplicable = productosAplicables.reduce((sum, item) => sum + (getPrecioMostrar(item).precioPrincipal * item.cantidad), 0);

      if (cupon.tipo_descuento === 'gratis' || cupon.es_gratis || tipoAplicacion === 'producto_gratis') {
        descuentoCalculado = subtotalAplicable;
        const nombres = productosAplicables.map(p => p.producto || p.plataforma).join(', ');
        mensajeExito = `Producto(s) GRATIS: ${nombres}`;
      } else if (cupon.tipo_descuento === 'porcentaje') {
        descuentoCalculado = subtotalAplicable * ((cupon.valor_descuento || cupon.valor || 0) / 100);
        mensajeExito = `Cupón ${cupon.codigo} aplicado: -$${descuentoCalculado.toFixed(2)}`;
      } else {
        descuentoCalculado = Math.min(cupon.valor_descuento || cupon.valor || 0, subtotalAplicable);
        mensajeExito = `Cupón ${cupon.codigo} aplicado: -$${descuentoCalculado.toFixed(2)}`;
      }
    }

    setAppliedCoupon({ ...cupon, descuentoCalculado, mensajeExito });
    toast.success(mensajeExito);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Cupón eliminado');
  };

  const removeAutoReferrer = () => {
    setAutoReferrer(null);
    const url = new URL(window.location);
    url.searchParams.delete('ref');
    window.history.replaceState({}, '', url);
    toast.success('Referido eliminado');
  };

  const calcularEnvio = () => {
    if (tieneSoloProductosDigitales) return 0;
    const subtotal = cart.reduce((sum, item) => sum + (getPrecioMostrar(item).precioPrincipal * item.cantidad), 0);
    if (deliveryMethod === 'retiro') return 0;
    if (deliveryMethod === 'delivery') {
      const gratisDesde = settings.envios?.deliveryGratisDesde || 5;
      return subtotal >= gratisDesde ? 0 : 2;
    }
if (deliveryMethod === 'nacional') {
// ✅ NACIONAL: GRATIS si supera el monto mínimo; si no, COBRO A DESTINO (no se suma al total)
return 0;
}
return 0;
};
// ✅ Helper: estado del envío nacional
const envioNacionalInfo = () => {
const subtotal = cart.reduce((sum, item) => sum + ((getPrecioMostrar(item).precioPrincipal || 0) * item.cantidad), 0);
const gratisDesde = Number(settings.envios?.montoMinimoEnvioGratis || 50);
const costo = Number(settings.envios?.costoEnvioNacional || 3);
if (subtotal >= gratisDesde) return { gratis: true, texto: 'GRATIS' };
return { gratis: false, costo, texto: `Cobro a destino ($${costo.toFixed(2)})` };
};

  const calculateTotal = () => {
    let subtotal = cart.reduce((sum, item) => sum + (getPrecioMostrar(item).precioPrincipal * item.cantidad), 0);
    const descuentoCupon = appliedCoupon ? appliedCoupon.descuentoCalculado : 0;
    const descuentoOferta = ofertaActiva ? subtotal * ((Number(ofertaActiva.descuento_pct) || 0) / 100) : 0;
    return Math.max(0, subtotal - descuentoCupon - descuentoOferta + calcularEnvio());
  };

  const finalizarPedido = async () => {
      if (cart.length === 0) { toast.error('Carrito vacío'); return; }
      if (!clienteNombre.trim() || !clienteTelefono.trim()) { toast.error('Ingresa tu nombre y teléfono para procesar el pedido'); return; }
      if (!paymentMethod) { toast.error('Selecciona método de pago'); return; }      if (!terminosAceptados) { toast.error('Debes aceptar los Términos y Condiciones para finalizar tu pedido'); return; }
      if (!tieneSoloProductosDigitales) {
      if (deliveryMethod === 'retiro' && !selectedAddress) { toast.error('Selecciona punto de retiro'); return; }
      if (deliveryMethod === 'delivery' && !customerLocation) { toast.error('Ingresa tu ubicación'); return; }
      if (deliveryMethod === 'nacional' && !oficinaDestino) { toast.error('Ingresa la oficina destino'); return; }
    }

    const total = calculateTotal();
    const envio = calcularEnvio();
    let mensaje = `¡Hola! Quiero realizar el siguiente pedido:\n\n`;
    cart.forEach(item => {
      const precioInfo = getPrecioMostrar(item);
      const subtotal = precioInfo.precioPrincipal * item.cantidad;
      mensaje += `• ${item.plataforma || item.producto} x${item.cantidad} - $${subtotal.toFixed(2)}\n`;
    });
    
    const subtotalSinEnvio = cart.reduce((sum, item) => sum + (getPrecioMostrar(item).precioPrincipal * item.cantidad), 0);
    mensaje += `\n Subtotal: $${subtotalSinEnvio.toFixed(2)}`;
    
    if (appliedCoupon) {
      mensaje += `\n 🎟️ Cupón: ${appliedCoupon.codigo} (-$${appliedCoupon.descuentoCalculado.toFixed(2)})`;
    }
    if (ofertaActiva) {
      const descRel = subtotalSinEnvio * (Number(ofertaActiva.descuento_pct) || 0) / 100;
      mensaje += `\n ⚡ Oferta Relámpago (${ofertaActiva.descuento_pct}%): -$${descRel.toFixed(2)}`;
    }
    if (autoReferrer) {
      mensaje += `\n Referido por: ${autoReferrer}`;
    }
    if (deliveryMethod === 'nacional') {
    const infoNac = envioNacionalInfo();
    mensaje += `
    Envío Nacional: ${infoNac.gratis ? 'GRATIS' : infoNac.texto + ' (lo pagas al recibir)'}`;
    } else {
    mensaje += `
    Envío: ${envio === 0 ? 'GRATIS' : '$' + envio.toFixed(2)}`;
    }
    mensaje += `\n💵 TOTAL: $${total.toFixed(2)} (Bs ${calcularPrecioBs(total)})\n`;
    
    if (!tieneSoloProductosDigitales) {
      if (deliveryMethod === 'retiro') mensaje += `\n Entrega: Retiro en ${selectedAddress}`;
      else if (deliveryMethod === 'delivery') mensaje += `\n Entrega: Delivery a ${customerLocation}`;
      else if (deliveryMethod === 'nacional') mensaje += `\n Envío Nacional: ${agenciaEnvio} - ${oficinaDestino}`;
    } else {
      mensaje += `\n Entrega: Digital / WhatsApp`;
    }
    mensaje += `
    💳 Pago: ${paymentMethod}`;
    // ✅ SINCRONIZA: crea el pedido en el panel como PENDIENTE (origen WEB)
    try {
      if (supabase) {
        const hoy = new Date();
        const dia = String(hoy.getDate()).padStart(2, '0');
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const fechaHoy = hoy.toISOString().split('T')[0];
        // Vendedor: referido interno o aleatorio del equipo
        let vendedorWeb = '';
        const { data: eq } = await supabase.from('usuarios').select('*').eq('activo', true);
        const equipoActivo = eq || [];
        if (autoReferrer) {
          vendedorWeb = (equipoActivo.find(m => `VOLTECHSTORE-${(m.nombre || '').substring(0, 5).toUpperCase()}-${String(m.id).slice(-4)}` === autoReferrer) || {}).nombre || '';
        }
        if (!vendedorWeb && equipoActivo.length) vendedorWeb = equipoActivo[Math.floor(Math.random() * equipoActivo.length)].nombre;
        const fisicos = cart.filter(i => i.tipo !== 'streaming' && (i.categoria || '').toUpperCase() !== 'STREAMING');
        const streamings = cart.filter(i => i.tipo === 'streaming' || (i.categoria || '').toUpperCase() === 'STREAMING');
        if (fisicos.length) {
          const { count: cF } = await supabase.from('ventas').select('*', { count: 'exact', head: true }).eq('fecha', fechaHoy).eq('origen', 'web');
          const subF = fisicos.reduce((s, i) => s + ((getPrecioMostrar(i).precioPrincipal || 0) * i.cantidad), 0);
          await supabase.from('ventas').insert({
            id: `web-${Date.now()}`, numeroOrden: `W-${dia}-${mes}-${String((cF || 0) + 1).padStart(3, '0')}`, fecha: fechaHoy,
            vendedor: vendedorWeb, cliente: clienteNombre.trim(), telefono: clienteTelefono.trim(),
            productos: fisicos.map(i => ({ productoId: i.id, sku: i.sku || '', nombre: i.producto || i.plataforma, categoria: i.categoria, marca: i.marca, cantidad: i.cantidad, precioUnitario: getPrecioMostrar(i).precioPrincipal, total: (getPrecioMostrar(i).precioPrincipal || 0) * i.cantidad, tipo: 'fisico', esKit: false })),
            subtotal: subF, total: subF, total_con_descuento: subF, descuento_aplicado: 0,
            enCuotas: false, montoAbonado: 0, montoPendiente: subF, metodoPago: paymentMethod, carteraId: '',
            porcentaje_comision: 5, estado: 'pendiente', origen: 'web', stock_descontado: false,
            fechaRegistro: new Date().toISOString(), tipo: 'producto'
          });
        }
        if (streamings.length) {
          const { count: cS } = await supabase.from('ventas_streaming').select('*', { count: 'exact', head: true }).eq('fecha', fechaHoy).eq('origen', 'web');
          const subS = streamings.reduce((s, i) => s + ((getPrecioMostrar(i).precioPrincipal || 0) * i.cantidad), 0);
          await supabase.from('ventas_streaming').insert({
            id: `webs-${Date.now()}`, numeroOrden: `W-${dia}-${mes}-${String((cS || 0) + 1).padStart(3, '0')}`, fecha: fechaHoy,
            vendedor: vendedorWeb, cliente: clienteNombre.trim(), telefono: clienteTelefono.trim(),
            plataformas: streamings.map(i => ({ plataforma: i.plataforma || i.producto, cantidad: i.cantidad, precioDetal: getPrecioMostrar(i).precioPrincipal, fechaVencimiento: '', diasDisponibles: 30 })),
            subtotal: subS, total: subS, metodoPago: paymentMethod, cartera: '',
            estado: 'pendiente', origen: 'web', fechaRegistro: new Date().toISOString()
          });
        }
      }
    } catch (e) { console.warn('⚠️ No se sincronizó el pedido:', e.message); }
    abrirWhatsAppNat(whatsappNumero, mensaje);
    toast.success('Pedido enviado ✅ Lo verás en el panel como Pendiente');
    };

const comprarRapido = (producto) => {
const precioInfo = getPrecioMostrar(producto);
let s = {}; try { s = JSON.parse(localStorage.getItem('voltech_settings') || '{}'); } catch (e) {}
const wa = s.whatsapp || {};
const esStreaming = producto.tipo === 'streaming' || (producto.categoria || '').toUpperCase() === 'STREAMING';
const nombreItem = esStreaming ? (producto.plataforma || producto.producto || 'Plataforma') : (producto.producto || producto.plataforma || 'Producto');
const urlProd = `${window.location.origin}/catalogo?producto=${producto.id}`;
const plantillaGuardada = wa.plantilla_compra || '';
// ✅ Si la plantilla guardada es la vieja ("oferta/descuento"), usa la nueva dinámica
const plantilla = (plantillaGuardada && !plantillaGuardada.includes('aprovechar la oferta')) ? plantillaGuardada : `¡Hola! Te escribo del catálogo 👋 quiero comprar [TipoCompra]
[Icono] [Producto]
💰 [Precio]
💵 [Bs]
🔗 [Url]`;
const cierre = wa.cierre_compra || 'Quiero comprar ✅';
let mensaje = plantilla
.split('[TipoCompra]').join(esStreaming ? 'esta plataforma streaming' : 'este producto')
.split('[Icono]').join(esStreaming ? '🎬' : '📦')
.split('[Plataforma]').join(nombreItem)
.split('[Producto]').join(nombreItem)
.split('[Precio]').join(`$${precioInfo.precioPrincipal.toFixed(2)}`)
.split('[Bs]').join(`Bs ${calcularPrecioBs(precioInfo.precioPrincipal)}`)
.split('[Url]').join(urlProd)
.split('{{producto}}').join(nombreItem)
.split('{{precio}}').join(`$${precioInfo.precioPrincipal.toFixed(2)}`)
.split('{{bs}}').join(`Bs ${calcularPrecioBs(precioInfo.precioPrincipal)}`)
.split('{{url}}').join(urlProd);
mensaje = mensaje.includes('{{cierre}}') ? mensaje.split('{{cierre}}').join(cierre) : mensaje + '\n' + cierre;
abrirWhatsAppNat(whatsappNumero, mensaje);
};
  const categorias = [...new Set((productos || []).filter(p => p.categoria && p.categoria.toUpperCase() !== 'STREAMING').map(p => p.categoria).filter(Boolean))].sort();
  const marcas = [...new Set((productos || []).map(p => p.marca).filter(Boolean))].sort();
  const plataformas = [...new Set((productos || []).filter(p => p.tipo === 'streaming' && p.plataforma).map(p => p.plataforma).filter(Boolean))].sort();
  const puntosEntrega = settings.envios?.puntosEntrega || settings.tienda?.direcciones || [];
  const metodosPagoActivos = settings.pagos ? Object.entries(settings.pagos).filter(([_, a]) => a).map(([m]) => m) : ['efectivo', 'pago_movil'];
  const opinionesAprobadas = opiniones.filter(o => o.estado === 'aprobada');

  const generarTicket = () => `VOLT-${Math.floor(1000 + Math.random() * 9000)}`;

  const validarCodigoCompra = async (codigo) => {
    if (!codigo.trim()) return null;
    const ventasData = JSON.parse(localStorage.getItem('voltech_ventas') || '[]');
    return ventasData.find(v => (v.numero_orden === codigo || v.id === codigo) && v.estado === 'Pagado') || null;
  };

  const validarCodigoReferido = async (codigo) => {
    if (!codigo.trim()) return null;
    const clientesData = JSON.parse(localStorage.getItem('voltech_clientes') || '[]');
    return clientesData.find(c => {
      const codigoCliente = `VOLTECHSTORE-${c.nombre.substring(0, 5).toUpperCase()}-${c.id.toString().slice(-4)}`;
      return codigoCliente === codigo.toUpperCase();
    }) || null;
  };

  const calcularBonusTickets = async () => {
    let bonus = { compra: 0, referido: 0 };
    if (formDataSorteo.codigoCompra) {
      const venta = await validarCodigoCompra(formDataSorteo.codigoCompra);
      if (venta) bonus.compra = 2;
    }
    if (formDataSorteo.codigoReferido) {
      const referidor = await validarCodigoReferido(formDataSorteo.codigoReferido);
      if (referidor) bonus.referido = 2;
    }
    setBonusTickets(bonus);
  };

  useEffect(() => { calcularBonusTickets(); }, [formDataSorteo.codigoCompra, formDataSorteo.codigoReferido]);

  const validarFormularioSorteo = () => {
    if (!formDataSorteo.nombre.trim()) return 'El nombre es obligatorio';
    if (!formDataSorteo.apellido.trim()) return 'El apellido es obligatorio';
    if (!formDataSorteo.telefono.trim()) return 'El número de contacto es obligatorio';
    if (sorteoActivo?.tipo_sorteo === 'votacion' && !formDataSorteo.producto_votado_id) return 'Debes seleccionar un producto para votar';
    const telefonoLimpio = formDataSorteo.telefono.replace(/\D/g, '');
    if (telefonoLimpio.length < 10) return 'El teléfono debe tener al menos 10 dígitos';
    const duplicado = participantes.find(p => p.sorteo_id === sorteoActivo?.id && p.telefono === formDataSorteo.telefono);
    if (duplicado) return `Ya estás registrado. Tu ticket es: ${duplicado.numero_ticket}`;
    return null;
  };

  const handleSubmitSorteo = (e) => {
    e.preventDefault();
    const error = validarFormularioSorteo();
    if (error) { toast.error(error); return; }
    
    setLoadingSorteo(true);
    setTimeout(async () => {
      const ticketsBase = sorteoActivo.configuracion?.ticketsBase || 1;
      const totalTickets = ticketsBase + bonusTickets.compra + bonusTickets.referido;
      const ticketsGenerados = [];
      for (let i = 0; i < totalTickets; i++) ticketsGenerados.push(generarTicket());
      
      const nuevoParticipante = {
        id: `part-${Date.now()}`, sorteo_id: sorteoActivo.id,
        nombre: formDataSorteo.nombre.trim(), apellido: formDataSorteo.apellido.trim(),
        telefono: formDataSorteo.telefono.trim(), correo: formDataSorteo.correo.trim(),
        numero_ticket: ticketsGenerados[0], todos_los_tickets: ticketsGenerados,
        producto_votado_id: formDataSorteo.producto_votado_id,
        codigo_compra: formDataSorteo.codigoCompra || null,
        codigo_referido: formDataSorteo.codigoReferido || null,
        tickets_bonus: bonusTickets.compra + bonusTickets.referido,
        created_at: new Date().toISOString()
      };
      
      const participantesExistentes = JSON.parse(localStorage.getItem('voltech_participantes') || '[]');
      participantesExistentes.push(nuevoParticipante);
      localStorage.setItem('voltech_participantes', JSON.stringify(participantesExistentes));
      setParticipantes(participantesExistentes);
      
      if (sorteoActivo.tipo_sorteo === 'votacion' && formDataSorteo.producto_votado_id) {
        const votosExistentes = JSON.parse(localStorage.getItem('voltech_sorteo_votos') || '{}');
        if (!votosExistentes[sorteoActivo.id]) votosExistentes[sorteoActivo.id] = {};
        if (!votosExistentes[sorteoActivo.id][formDataSorteo.producto_votado_id]) votosExistentes[sorteoActivo.id][formDataSorteo.producto_votado_id] = 0;
        votosExistentes[sorteoActivo.id][formDataSorteo.producto_votado_id] += totalTickets;
        localStorage.setItem('voltech_sorteo_votos', JSON.stringify(votosExistentes));
        setProductosVotacion(prev => prev.map(p => ({ ...p, votos: p.id === formDataSorteo.producto_votado_id ? (p.votos || 0) + totalTickets : (p.votos || 0) })));
      }
      
      if (formDataSorteo.codigoReferido) {
        const referidor = await validarCodigoReferido(formDataSorteo.codigoReferido);
        if (referidor) {
          const clientesData = JSON.parse(localStorage.getItem('voltech_clientes') || '[]');
          const clienteIndex = clientesData.findIndex(c => c.id === referidor.id);
          if (clienteIndex !== -1) {
            clientesData[clienteIndex].referidos_contador = (clientesData[clienteIndex].referidos_contador || 0) + 1;
            localStorage.setItem('voltech_clientes', JSON.stringify(clientesData));
            toast.success(`¡${referidor.nombre} ganó un bonus por referido!`);
          }
        }
      }
      
      setTicketGenerado(ticketsGenerados);
      setShowTicketModal(true);
      setFormDataSorteo({ nombre: '', apellido: '', telefono: '', correo: '', producto_votado_id: null, codigoCompra: '', codigoReferido: '' });
      setBonusTickets({ compra: 0, referido: 0 });
      setLoadingSorteo(false);
      toast.success(`¡Registro exitoso! Tienes ${totalTickets} tickets`);
    }, 800);
  };

  const copiarTicket = () => {
    navigator.clipboard.writeText(Array.isArray(ticketGenerado) ? ticketGenerado.join(', ') : ticketGenerado);
    toast.success('Tickets copiados');
  };

  const handleSubmitOpinion = async (e) => {
    e.preventDefault();
    if (!formDataOpinion.nombre || !formDataOpinion.comentario) { toast.error('Nombre y comentario son obligatorios'); return; }
    
    if (formDataOpinion.telefono) {
      const clientesData = JSON.parse(localStorage.getItem('voltech_clientes') || '[]');
      const clienteExistente = clientesData.find(c => c.telefono === formDataOpinion.telefono);
      
      if (!clienteExistente) {
        const nuevoCliente = {
          id: `cliente-${Date.now()}`,
          nombre: formDataOpinion.nombre,
          telefono: formDataOpinion.telefono,
          referidos_contador: 0
        };
        clientesData.push(nuevoCliente);
        localStorage.setItem('voltech_clientes', JSON.stringify(clientesData));
      }
    }
    
    const nuevaOpinion = { id: `opinion-${Date.now()}`, ...formDataOpinion, estado: 'pendiente', fecha: new Date().toISOString() };
    const opinionesExistentes = JSON.parse(localStorage.getItem('voltech_opiniones') || '[]');
    opinionesExistentes.push(nuevaOpinion);
    localStorage.setItem('voltech_opiniones', JSON.stringify(opinionesExistentes));
    setOpiniones(opinionesExistentes);
    // ✅ GUARDAR EN SUPABASE (así llega al panel y al público)
    if (supabase) {
    const { error: opErr } = await supabase.from('opiniones').insert(nuevaOpinion);
    if (opErr) console.warn('⚠️ No se guardó la opinión en Supabase:', opErr.message);
    }
    setFormDataOpinion({ nombre: '', telefono: '', rating: 5, comentario: '', producto: '', foto: null, donde_nos_conocio: '' });
    setShowOpinionForm(false);
    toast.success('Opinión enviada. Será publicada tras aprobación.');
  };

  const handleFileChange = (file) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) { toast.error('La imagen no debe pesar más de 2MB'); return; }
      if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return; }
      const reader = new FileReader();
      reader.onloadend = () => setFormDataOpinion({...formDataOpinion, foto: reader.result});
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileChange(e.dataTransfer.files[0]);
  };

  // ✅ ACTUALIZADO: Incluir 'kit' en el filtro para que aparezcan en el catálogo
  const productosFiltrados = (productos || []).filter(p => {
  const searchTermLower = searchTerm.toLowerCase();
  const match = (p.producto || '').toLowerCase().includes(searchTermLower) || 
                (p.marca || '').toLowerCase().includes(searchTermLower) || 
                (p.categoria || '').toLowerCase().includes(searchTermLower) ||
                (p.descripcion_detallada || '').toLowerCase().includes(searchTermLower);
  const precioActual = getPrecioMostrar(p).precioPrincipal;
  const min = precioMin === '' ? 0 : parseFloat(precioMin);
  const max = precioMax === '' ? Infinity : parseFloat(precioMax);
    return match && (!filterCategory || p.categoria === filterCategory) && (!filterBrand || p.marca === filterBrand) && (p.tipo === 'fisico' || p.tipo === 'kit') && !p.esCombo && precioActual >= min && precioActual <= max;
     });
  const streamingFiltrados = (productos || []).filter(p => {
    const searchTermLower = searchTerm.toLowerCase();
    const match = (p.plataforma || '').toLowerCase().includes(searchTermLower) ||
                  (p.descripcion_detallada || '').toLowerCase().includes(searchTermLower);
    return match && (!filterPlatform || p.plataforma === filterPlatform) && p.tipo === 'streaming';
  });

// ✅ Agrega al carrito aplicando el descuento de la oferta/publicidad
const agregarOfertaAlCarrito = (p) => {
const prod = p.prodVinculado || p;
const info = getPrecioMostrar(prod);
let precioFinal = info.precioPrincipal;
let precioOriginal = info.precioTachado || info.precioPrincipal;
if (p.esPublicidad) {
const baseManual = Number(String(p.precio_manual || '').replace(/[^0-9.]/g, '')) || 0;
if (baseManual > 0) {
precioOriginal = baseManual;
precioFinal = p.descuento_pct > 0 ? baseManual * (1 - Number(p.descuento_pct) / 100) : baseManual;
} else if (p.descuento_pct > 0) {
precioFinal = precioOriginal * (1 - Number(p.descuento_pct) / 100);
}
}
const existente = cart.find(i => i.id === prod.id);
if (existente) {
setCart(cart.map(i => i.id === prod.id ? { ...i, cantidad: i.cantidad + 1, precio_oferta: precioFinal, precioOferta: precioFinal, precioDetal: precioOriginal } : i));
} else {
setCart([...cart, { ...prod, cantidad: 1, precio_oferta: precioFinal, precioOferta: precioFinal, precioDetal: precioOriginal }]);
}
setShowCart(true);
toast.success(`🛒 "${prod.producto || prod.plataforma}" agregado con precio de oferta`);
};
// ✅ Click en oferta: externo→link · todo lo demás→carrito con descuento
const manejarClickOferta = (p) => {
if (p.esPublicidad) {
registrarClickPub(p);
if (p.esExterno) { window.open(p.url_destino, '_blank'); return; }
if (p.prodVinculado) { agregarOfertaAlCarrito(p); return; }
if (p.url_destino) { window.location.href = p.url_destino; }
return;
}
agregarOfertaAlCarrito(p);
};  const esItemStreaming = (p) => p.tipo === 'streaming' || (p.categoria || '').toUpperCase() === 'STREAMING' || p.modalidad === 'combo' || p.esComboStreaming || p.esCombo;
  const ofertasBase = (productos || []).filter(p => p.publicado && (p.estado === 'oferta' || Number(p.precio_oferta || p.precioOferta) > 0));
  // ✅ Solo entran a Ofertas las publicidades con destino interno (producto / streaming / kit / combo_streaming)
  // Las URL externas NO entran en Ofertas (solo banner)
  const tiposInternos = ['producto', 'streaming', 'kit', 'combo_streaming'];
  const pubsComoOferta = (publicidad || [])
  .filter(pub => tiposInternos.includes(pub.tipo_destino) || (pub.url_destino && /[?&]producto=/.test(pub.url_destino)))
  .map(pub => {
  const prodVinculado = (pub.producto_id ? productos.find(pr => String(pr.id) === String(pub.producto_id)) : null)
    || productos.find(pr => `/catalogo?producto=${pr.id}` === pub.url_destino)
    || null;
  const esExterno = !!pub.url_destino && /^https?:\/\//i.test(pub.url_destino) && !pub.url_destino.includes(typeof window !== 'undefined' ? window.location.origin : '');
  const tipoFinal = prodVinculado ? (prodVinculado.esCombo ? 'streaming' : prodVinculado.tipo)
    : (pub.tipo_destino === 'streaming' || pub.tipo_destino === 'combo_streaming' ? 'streaming' : 'fisico');
  const todasImagenes = Array.from(new Set([
    pub.url_imagen,
    ...(Array.isArray(pub.imagenes) ? pub.imagenes : [])
  ].filter(Boolean)));
  return {
  ...pub,
  esPublicidad: true,
  esExterno,
  prodVinculado,
  id: `pub-${pub.id}`,
  producto: pub.titulo,
  plataforma: pub.titulo,
  imagen: todasImagenes[0] || '',
  imagenes: todasImagenes,
  tipo: tipoFinal,
  categoria_promo: pub.categoria_promo || '',
  };
  }).filter(p => !ofertasBase.some(o => o.id === p.id));
  const ofertas = [...ofertasBase, ...pubsComoOferta];
  const ofertasProductos = ofertas.filter(p => !esItemStreaming(p));
const ofertasStreaming = ofertas.filter(p => esItemStreaming(p));
  const bg = darkMode ? 'bg-slate-950' : 'bg-slate-50';
  const text = darkMode ? 'text-slate-100' : 'text-slate-900';
  const cardBg = darkMode ? 'bg-slate-900' : 'bg-white';
  const cardBorder = darkMode ? 'border-slate-800' : 'border-slate-200';
  const inputBg = darkMode ? 'bg-slate-800 text-slate-100 border-slate-700' : 'bg-white text-slate-900 border-slate-300';
  const mutedText = darkMode ? 'text-slate-400' : 'text-slate-600';
  const headerBg = darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200';
  const totalVotos = productosVotacion.reduce((sum, p) => sum + (p.votos || 0), 0);

const productosAgrupados = useMemo(() => {
const grupos = {};
productosFiltrados.forEach(p => {
const cat = (p.categoria || 'OTROS').toUpperCase();
(grupos[cat] = grupos[cat] || []).push(p);
});
Object.keys(grupos).forEach(k => {
grupos[k].sort((a, b) => (a.producto || a.plataforma || '').localeCompare(b.producto || b.plataforma || '', 'es', { sensitivity: 'base' }));
});
return Object.entries(grupos).sort((a, b) => a[0].localeCompare(b[0], 'es', { sensitivity: 'base' }));
}, [productosFiltrados]);

const streamingAgrupados = useMemo(() => {
const grupos = {};
streamingFiltrados.forEach(p => {
const cat = (p.categoria || 'STREAMING').toUpperCase();
(grupos[cat] = grupos[cat] || []).push(p);
});
Object.keys(grupos).forEach(k => {
grupos[k].sort((a, b) => (a.plataforma || '').localeCompare(b.plataforma || '', 'es', { sensitivity: 'base' }));
});
return Object.entries(grupos).sort((a, b) => a[0].localeCompare(b[0], 'es', { sensitivity: 'base' }));
}, [streamingFiltrados]);
      const renderProductCard = (p, idx = 0) => {
      const precioInfo = getPrecioMostrar(p);
      const todasImagenes = Array.from(new Set([
        p.imagen,
        ...(Array.isArray(p.imagenes) ? p.imagenes : []),
        ...(Array.isArray(p.productos_kit) ? p.productos_kit.map(k => k.imagen).filter(Boolean) : [])
      ].filter(Boolean)));
      return (
      <div key={p.id || p.producto || `prod-${idx}`} onClick={() => setSelectedProduct(p)} className={`${cardBg} rounded-xl shadow-md border ${cardBorder} overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between cursor-pointer group`}>
        <div className="aspect-square bg-slate-900 flex items-center justify-center overflow-hidden relative">
          <CarruselImagen
            imagenes={todasImagenes}
            alt={p.producto || p.plataforma}
            className="w-full h-full group-hover:scale-105 transition-transform duration-300"
            iconoVacio={<Package className="w-12 h-12 text-slate-300" />}
          />
          {p.categoria_promo && <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-0.5 rounded-full text-[9px] font-bold shadow-md z-10">{p.categoria_promo}</div>}
          {precioInfo.tieneOferta && <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md">OFERTA</div>}
          {p.tipo === 'kit' && !p.categoria_promo && <div className="absolute top-2 left-2 bg-voltech-cyan text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md">KIT</div>}
          {p.disponibilidad === 'bajo_pedido' && <div className="absolute bottom-2 left-2 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold shadow-md">🛒 BAJO PEDIDO</div>}
          </div>
        <div className="p-3 flex flex-col flex-1">
          <div className="mb-1"><p className={`text-[10px] font-medium uppercase tracking-wide ${mutedText} truncate`}>{p.marca} • {p.categoria}</p></div>
          <h3 className={`font-semibold text-sm mb-2 line-clamp-2 leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{p.producto}</h3>
          <div className="mt-auto space-y-2">
            <div>
              {precioInfo.tieneOferta && <p className="text-xs text-gray-400 line-through">${precioInfo.precioTachado?.toFixed(2)}</p>}
              <p className={`text-xl font-bold ${precioInfo.tieneOferta ? 'text-red-600' : darkMode ? 'text-white' : 'text-slate-900'}`}>${precioInfo.precioPrincipal?.toFixed(2)}</p>
              <p className={`text-xs font-medium ${mutedText}`}>Bs {calcularPrecioBs(precioInfo.precioPrincipal)}</p>
            </div>
            <div className="flex gap-1.5 pt-1">
            <button onClick={(e) => { e.stopPropagation(); addToCart(p); }} className="w-full bg-purple-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-1">
            <ShoppingCart className="w-3 h-3 flex-shrink-0" /> Agregar al Carrito
            </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const registrarClickPub = async (pub) => {
try {
const nuevosClicks = (pub.clicks || 0) + 1;
setPublicidad(prev => prev.map(p => p.id === pub.id ? { ...p, clicks: nuevosClicks } : p));
if (supabase) await supabase.from('publicidad').update({ clicks: nuevosClicks }).eq('id', pub.id);
} catch (e) { console.error('Error registrando click:', e); }
};
// ✅ Detecta si un link es interno (misma tienda) o externo
const esLinkInterno = (url) => {
if (!url) return true;
if (url.startsWith('/')) return true;
try { return new URL(url).origin === window.location.origin; } catch { return true; }
};
// ✅ Click en publi:
// - URL externa manual (http...) → abre en nueva pestaña
// - tipo_destino = producto / streaming / kit / combo_streaming (o url_destino con ?producto=) → agrega al carrito con descuento y lo abre
// - Sin destino → va a la sección Ofertas
const manejarClickPub = (e, pub) => {
registrarClickPub(pub);
const destinos = pub.whatsapp_destinos || [];
if (destinos.length > 0) {
e.preventDefault();
const al = destinos[Math.floor(Math.random() * destinos.length)];
const msg = pub.mensaje_whatsapp || `¡Hola! 👋 Vi la publicidad "${pub.titulo}" y quiero más información.`;
abrirWhatsAppNat(al.telefono, msg);
return;
}
const url = pub.url_destino || '';
const esExterna = !!url && /^https?:\/\//i.test(url) && !url.includes(typeof window !== 'undefined' ? window.location.origin : '');
if (esExterna) {
e.preventDefault();
window.open(url, '_blank');
return;
}
// ✅ Prioridad 1: campo producto_id (nuevo del Marketing)
// Prioridad 2: extraer prodId de url_destino (/catalogo?producto=X)
const prodIdFromField = pub.producto_id;
const prodIdFromUrl = (url.match(/[?&]producto=([^&]+)/) || [])[1];
const prodIdFinal = prodIdFromField || prodIdFromUrl;
if (prodIdFinal) {
e.preventDefault();
const prod = productos.find(p => String(p.id) === String(prodIdFinal));
if (prod) {
const info = getPrecioMostrar(prod);
let precioFinal = info.precioPrincipal;
let precioOriginal = info.precioTachado || info.precioPrincipal;
const baseManual = Number(String(pub.precio_manual || '').replace(/[^0-9.]/g, '')) || 0;
if (baseManual > 0) {
precioOriginal = baseManual;
precioFinal = pub.descuento_pct > 0 ? baseManual * (1 - Number(pub.descuento_pct) / 100) : baseManual;
} else if (pub.descuento_pct > 0) {
precioFinal = precioOriginal * (1 - Number(pub.descuento_pct) / 100);
}
const existente = cart.find(i => i.id === prod.id);
if (existente) {
setCart(cart.map(i => i.id === prod.id ? { ...i, cantidad: i.cantidad + 1, precio_oferta: precioFinal, precioOferta: precioFinal, precioDetal: precioOriginal } : i));
} else {
setCart([...cart, { ...prod, cantidad: 1, precio_oferta: precioFinal, precioOferta: precioFinal, precioDetal: precioOriginal }]);
}
setShowCart(true);
toast.success(`🛒 "${prod.producto || prod.plataforma}" agregado al carrito`);
return;
}
}
if (!url) {
e.preventDefault();
setActiveSection('ofertas');
window.scrollTo({ top: 0, behavior: 'smooth' });
return;
}
if (esLinkInterno(url)) {
e.preventDefault();
window.location.href = url;
}
};

  const renderPubCard = (pub) => (
    <a
      key={pub.id}
      href={pub.url_destino || '#'}
      target={esLinkInterno(pub.url_destino) ? '_self' : '_blank'}
      onClick={(e) => manejarClickPub(e, pub)}
      className={`block ${cardBg} border ${cardBorder} rounded-xl overflow-hidden hover:border-voltech-cyan/50 transition-all grHoup`}
    >
      <div className="bg-voltech-dark relative overflow-hidden">
        {pub.url_video ? (
          <video src={pub.url_video} className="w-full aspect-video object-cover" autoPlay muted loop playsInline />
        ) : pub.url_imagen ? (
          <img 
            src={pub.url_imagen} 
            alt={pub.titulo} 
            className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="w-full aspect-video flex items-center justify-center text-voltech-muted">
            <ImageIcon className="w-12 h-12 opacity-50" />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-bold text-white truncate">{pub.titulo}</p>
        {pub.descripcion && <p className="text-xs text-voltech-muted mt-1 line-clamp-2">{pub.descripcion}</p>}
        <button className="mt-2 w-full bg-voltech-cyan/20 text-voltech-cyan text-xs font-semibold py-1.5 rounded hover:bg-voltech-cyan/30 transition-colors">
          {pub.texto_boton || 'Ver Oferta'}
        </button>
      </div>
    </a>
  );

  const pubsIzquierda = publicidad.filter(p => p.lado === 'izquierdo' || p.lado === 'ambos');
  const pubsDerecha = publicidad.filter(p => p.lado === 'derecho' || p.lado === 'ambos');
  const hayMasVendidos = masVendidosConfig?.activo && productosMasVendidos.length > 0;
  const haySidebarIzq = productos.length > 0 && (pubsIzquierda.length > 0 || hayMasVendidos);

  return (    <div className={`min-h-screen ${bg} ${text} flex flex-col transition-colors duration-300`}>
      <Toaster position="top-right" toastOptions={{ style: { background: darkMode ? '#1e293b' : '#fff', color: darkMode ? '#fff' : '#000', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` } }} />

      {sorteoActivo && activeSection !== 'sorteos' && showBannerSorteo && (
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white px-4 py-2 relative">
          <button 
            onClick={() => setShowBannerSorteo(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <div>
                <p className="font-bold text-sm">{sorteoActivo.titulo}</p>
                <p className="text-xs opacity-90"> Termina en: {timeLeft.dias}d {timeLeft.horas}h {timeLeft.minutos}m</p>
              </div>
            </div>
            <button onClick={() => setActiveSection('sorteos')} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">Participar →</button>
          </div>
        </div>
      )}

      {ofertaActiva && (
        <div className="bg-gradient-to-r from-voltech-cyan via-voltech-purple to-voltech-cyan text-white px-4 py-2 overflow-hidden">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">
            <Zap className="w-4 h-4 shrink-0 animate-pulse" />
            <p className="text-xs sm:text-sm font-bold truncate">{ofertaActiva.texto || `⚡ ${ofertaActiva.descuento_pct}% de descuento por tiempo limitado`}</p>
          </div>
        </div>
      )}

      <header className={`${headerBg} backdrop-blur-lg shadow-sm sticky top-0 z-40 border-b transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className={`md:hidden p-2 rounded-lg ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                <Menu className="w-5 h-5" />
              </button>
              <h1 className={`text-sm sm:text-base font-bold tracking-tight truncate max-w-[130px] sm:max-w-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>VOLTECH <span className="text-purple-600">STOREVE</span></h1>
            </div>

            <nav className="hidden md:flex gap-6">
              {['productos', 'streaming', 'ofertas', 'opiniones', 'sorteos'].map(s => (
                <button key={s} onClick={() => setActiveSection(s)} className={`text-sm font-medium capitalize transition-colors ${activeSection === s ? 'text-purple-600 border-b-2 border-purple-600 pb-1' : darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>{s}</button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
{currentUser && (
currentUser.rol?.toLowerCase() === 'admin' ||
currentUser.rol?.toLowerCase() === 'vendedor' ||
currentUser.rol?.toLowerCase() === 'socio'
) && (
<div className="relative">
<button
onClick={() => setShowUserMenu(!showUserMenu)}
className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-800/50 transition-colors"
title="Menú de usuario"
>
<div className="w-9 h-9 rounded-full bg-cyan-400 flex items-center justify-center text-slate-900 font-bold text-sm">
{(currentUser.nombre || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
</div>
<div className="hidden sm:block text-left">
<p className="text-sm font-semibold text-white leading-tight">{currentUser.nombre}</p>
<p className="text-xs text-slate-400">{currentUser.rol}</p>
</div>
<ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
</button>
<AnimatePresence>
{showUserMenu && (
<>
<div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
<motion.div
initial={{ opacity: 0, y: -8 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -8 }}
className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
>
<div className="p-3 border-b border-slate-700">
<p className="text-sm font-semibold text-white">{currentUser.nombre}</p>
<p className="text-xs text-slate-400 truncate">{currentUser.email || 'sin correo'}</p>
</div>
<div className="py-1">
<button onClick={() => { setShowUserMenu(false); window.location.href = '/panel/dashboard-ventas'; }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
<LayoutDashboard className="w-4 h-4" /> Ir al Panel
</button>
<button onClick={() => { setShowUserMenu(false); window.location.href = '/panel/perfil'; }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
<User className="w-4 h-4" /> Mi Perfil
</button>
{(currentUser.rol?.toLowerCase() === 'admin' || currentUser.rol?.toLowerCase() === 'socio') && (
<button onClick={() => { setShowUserMenu(false); window.location.href = '/panel/configuracion'; }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
<Settings className="w-4 h-4" /> Configuración
</button>
)}
</div>
<div className="border-t border-slate-700 py-1">
<button onClick={() => { localStorage.removeItem('voltech_user'); window.location.href = '/'; }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 transition-colors">
<LogOut className="w-4 h-4" /> Cerrar Sesión
</button>
</div>
</motion.div>
</>
)}
</AnimatePresence>
</div>
)}
              {!currentUser && (
                <button onClick={() => setShowCart(true)} className={`relative p-2 ${darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                  <ShoppingCart className="w-6 h-6" />
                  {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{cart.length}</span>}
                </button>
              )}
            </div>
          </div>
          
          <AnimatePresence>
            {showMobileMenu && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden overflow-hidden mb-3">
                <div className="grid grid-cols-2 gap-2">
                  {['productos', 'streaming', 'ofertas', 'opiniones', 'sorteos'].map(s => (
                    <button key={s} onClick={() => { setActiveSection(s); setShowMobileMenu(false); }} className={`px-3 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors ${activeSection === s ? 'bg-purple-600 text-white' : darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center max-w-4xl">
            <div className="relative flex-1 min-w-[200px]">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              <input type="text" placeholder={activeSection === 'productos' ? 'Buscar productos...' : activeSection === 'streaming' ? 'Buscar plataformas...' : 'Buscar...'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${inputBg}`} />
            </div>
          
            {activeSection === 'streaming' && (
              <div className="relative w-full md:w-56">
                <select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="w-full appearance-none bg-[#14101f]/90 border border-purple-500/40 text-slate-200 text-sm font-medium rounded-xl pl-4 pr-10 py-2.5 cursor-pointer outline-none transition-all hover:border-purple-400/70 hover:bg-[#1a1428] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40 focus:shadow-[0_0_18px_rgba(168,85,247,0.35)] [color-scheme:dark]"
                >
                  <option value="">Todas las plataformas</option>
                  {plataformas.map(p => <option key={p} value={p} className="bg-[#14101f] text-slate-200">{p}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
              </div>
            )}
            {activeSection === 'productos' && (
              <div className="relative w-full md:w-56">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full appearance-none bg-[#14101f]/90 border border-purple-500/40 text-slate-200 text-sm font-medium rounded-xl pl-4 pr-10 py-2.5 cursor-pointer outline-none transition-all hover:border-purple-400/70 hover:bg-[#1a1428] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40 focus:shadow-[0_0_18px_rgba(168,85,247,0.35)] [color-scheme:dark]"
                >
                  <option value="">Todas las categorías</option>
                  {(categorias || []).map(c => typeof c === 'string' ? <option key={c} value={c} className="bg-[#14101f] text-slate-200">{c}</option> : <option key={c.id || c.nombre} value={c.id || c.nombre} className="bg-[#14101f] text-slate-200">{c.nombre || c.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
{/* ✅ HERO BANNER: oculto en la sección Ofertas */}
{activeSection !== 'ofertas' && (() => {
  const pubsActivas = publicidad.filter(p => !p.dispositivos || p.dispositivos.movil !== false);
  const mvMovilActivo = hayMasVendidos && (masVendidosConfig?.ubicacion_movil || 'arriba') === 'arriba';
  const totalSlides = pubsActivas.length + (mvMovilActivo ? 1 : 0);
  if (totalSlides === 0) return null;

  return (
    <div className="mb-8">
      {/* 🖥️ DESKTOP: Mantiene altura fija pero ajusta la imagen con su Aspect Ratio natural */}
      <div className="hidden lg:block relative">
        {pubsActivas.length > 0 && (
          <div className={`grid gap-4 w-full ${pubsActivas.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {(pubsActivas.length === 1 ? [0] : [0, 1]).map(offset => {
              const pub = pubsActivas[(bannerIdx + offset) % pubsActivas.length];
              if (!pub) return null;
              const aspect = ratios[pub.id] || 1;
              const img1 = (pub.imagenes && pub.imagenes[0]) || pub.url_imagen;
              const img2 = (pub.imagenes && pub.imagenes[1]) || pub.url_imagen_2;
              const esModo2 = (pub.modo_2_imagenes === true || pub.modo2Imagenes === true || pub.tipo_disposicion === '35_35_30' || (pub.imagenes && pub.imagenes.length >= 2)) && !!img2 && img2 !== img1;
              
              return (
                <a
                key={pub.id + '-' + offset}
                href={pub.url_destino || '#'}
                target={esLinkInterno(pub.url_destino) ? '_self' : '_blank'}
                onClick={(e) => manejarClickPub(e, pub)}
                className="relative w-full h-[280px] rounded-2xl overflow-hidden border border-voltech-border bg-black shadow-xl flex"
              >
                  {esModo2 ? (
                    <div className="h-full w-[70%] bg-black flex overflow-hidden">
                      <div className="w-1/2 h-full bg-black overflow-hidden"><img src={img1} alt={pub.titulo} className="w-full h-full object-cover" /></div>
                      <div className="w-1/2 h-full bg-black overflow-hidden"><img src={img2} alt={pub.titulo} className="w-full h-full object-cover" /></div>
                    </div>
                  ) : (
                    <div
                      className="h-full max-w-[70%] bg-black flex items-center justify-center overflow-hidden"
                      style={{ aspectRatio: `${aspect}` }}
                    >
                      {pub.url_video ? (
                        <video src={pub.url_video} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                      ) : img1 ? (
                        <img src={img1} alt={pub.titulo} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-12 h-12 opacity-40 text-voltech-muted" />
                      )}
                    </div>
                  )}        
                  
                  <div className="relative h-full flex-1 bg-black">
                    {pub.url_fondo && <img src={pub.url_fondo} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-black/60"></div>
                    <div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center gap-2 p-4">
                      <h2 className="font-bold text-white text-sm md:text-base drop-shadow leading-tight line-clamp-2">{pub.titulo}</h2>
                      {pub.descripcion && <p className="text-[10px] text-white/90 drop-shadow line-clamp-2">{pub.descripcion}</p>}
                      {pub.precio_original > 0 && <p className="text-gray-400 line-through text-sm drop-shadow">${Number(pub.precio_original).toFixed(2)}</p>}
                      {getPrecioPub(pub) && <p className="text-emerald-400 font-black text-base drop-shadow">{getPrecioPub(pub)}{pub.descuento_pct > 0 && <span className="ml-2 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">−{pub.descuento_pct}%</span>}</p>}
                      <span className="inline-block px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg" style={{ backgroundColor: pub.color_boton || '#22d3ee', color: '#0a0a0a' }}>
                        {pub.texto_boton || 'VER OFERTA'}
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {pubsActivas.length > 1 && (
          <>
            <button onClick={() => setBannerIdx((bannerIdx - 1 + pubsActivas.length) % pubsActivas.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-voltech-dark/80 text-white hover:text-voltech-cyan transition-colors z-10 flex items-center justify-center">‹</button>
            <button onClick={() => setBannerIdx((bannerIdx + 1) % pubsActivas.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-voltech-dark/80 text-white hover:text-voltech-cyan transition-colors z-10 flex items-center justify-center">›</button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {pubsActivas.map((_, i) => (
                <button key={i} onClick={() => setBannerIdx(i)} className={`h-1.5 rounded-full transition-all ${i === (bannerIdx % pubsActivas.length) ? 'w-6 bg-voltech-cyan' : 'w-2 bg-slate-600'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 📱 MÓVIL: Banner Único Horizontal con Look Estilo PC (HBO MAX / Netflix) */}
      <div className="lg:hidden relative mb-6" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)}>
        <div ref={bannerRef} onScroll={onBannerScroll} className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory rounded-2xl">
          {pubsActivas.map(pub => {
            const img1 = (pub.imagenes && pub.imagenes[0]) || pub.url_imagen;
            const img2 = (pub.imagenes && pub.imagenes[1]) || pub.url_imagen_2;
            const esModo2 = (pub.modo_2_imagenes === true || pub.modo2Imagenes === true || pub.tipo_disposicion === '35_35_30') && !!img2 && img2 !== img1;
            
            return (
              <a
              key={pub.id}
              href={pub.url_destino || '#'}
              target={esLinkInterno(pub.url_destino) ? '_self' : '_blank'}
              onClick={(e) => manejarClickPub(e, pub)}
              className="shrink-0 w-full snap-start rounded-2xl overflow-hidden bg-black border border-slate-800/80 flex flex-row items-center h-44 shadow-2xl"
              >
                {/* 1. LADO IZQUIERDO: Multimedia */}
                <div className={`${pub.tipo_disposicion === '35_35_30' ? 'h-full w-[70%] max-w-[70%]' : 'h-full w-[55%] max-w-[55%]'} relative flex items-center justify-center bg-black overflow-hidden shrink-0`}>
                  {esModo2 ? (
                    <div className="w-full h-full flex overflow-x-auto overflow-y-hidden no-scrollbar snap-x snap-mandatory">
                      <div className="w-full h-full shrink-0 snap-center bg-black">
                        <img src={(pub.imagenes && pub.imagenes[0]) || pub.url_imagen} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-full h-full shrink-0 snap-center bg-black">
                        <img src={(pub.imagenes && pub.imagenes[1]) || pub.url_imagen_2} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  ) : pub.url_video ? (
                    <video src={pub.url_video} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                  ) : pub.url_imagen ? (
                    <img src={pub.url_imagen} alt={pub.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 opacity-40 text-voltech-muted" />
                  )}
                </div>

                {/* 2. LADO DERECHO: Fondo Negro Puro + Texto + Botón */}
                <div className="relative flex-1 h-full p-3 flex flex-col justify-center items-center text-center gap-1 bg-black overflow-hidden shrink-0">
                  {pub.url_fondo && (
                    <img src={pub.url_fondo} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none" />
                  )}
                  
                  <p className="text-xs font-black text-white tracking-wide uppercase drop-shadow leading-tight line-clamp-2 w-full z-10">
                    {pub.titulo}
                  </p>
                  
                  {pub.descripcion && (
                    <p className="text-[10px] text-slate-300 drop-shadow line-clamp-1 z-10">
                      {pub.descripcion}
                    </p>
                  )}
                  
                  {pub.precio_original > 0 && (
                    <p className="text-gray-400 line-through text-[10px] drop-shadow z-10">${Number(pub.precio_original).toFixed(2)}</p>
                  )}
                  {getPrecioPub(pub) && (
                    <p className="text-emerald-400 font-black text-xs drop-shadow z-10 flex items-center gap-1 justify-center">
                      {getPrecioPub(pub)}
                      {pub.descuento_pct > 0 && (
                        <span className="text-[8px] bg-red-500 text-white px-1 py-0.5 rounded-full font-black">
                          −{pub.descuento_pct}%
                        </span>
                      )}
                    </p>
                  )}

                  <span
                    className="mt-1 px-3 py-1.5 rounded-lg font-black transition-transform active:scale-95 text-[9px] uppercase shadow-md z-10 truncate max-w-full"
                    style={{ backgroundColor: pub.color_boton || '#22d3ee', color: '#0a0a0a' }}
                  >
                    {pub.texto_boton || 'VER OFERTA'}
                  </span>
                </div>
              </a>
            );
          })}
          
          {/* Slide de Más Vendidos en Móvil (si aplica) */}
          {mvMovilActivo && (
            <div className={`shrink-0 w-full snap-start rounded-2xl overflow-hidden border ${cardBorder} ${cardBg} p-4`}>
              <h3 className={`text-sm font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>🔥 {masVendidosConfig?.titulo || 'Los Favoritos de Nuestros Clientes'}</h3>
              <div className="space-y-2">
                {productosMasVendidos.slice(0, masVendidosConfig?.cantidad_maxima || 3).map(p => {
                  const pi = getPrecioMostrar(p);
                  return (
                    <div key={p.id} onClick={() => setSelectedProduct(p)} className={`flex items-center gap-3 p-2 rounded-lg border ${cardBorder} hover:border-voltech-cyan/50 cursor-pointer transition-all`}>
                      <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {p.imagen ? <img src={p.imagen} alt={p.producto} className="w-full h-full object-contain" /> : <Package className="w-5 h-5 text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{p.producto}</p>
                        <p className={`text-xs ${mutedText}`}>${pi.precioPrincipal?.toFixed(2)}</p>
                      </div>
                      {p.vendidos > 0 ? <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">🔥 {p.vendidos}</span> : <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
              <div className={`mt-3 space-y-0.5 text-[10px] ${mutedText}`}>
                {masVendidosConfig?.descripcion_1 && <p>{masVendidosConfig.descripcion_1}</p>}
                {masVendidosConfig?.descripcion_2 && <p>{masVendidosConfig.descripcion_2}</p>}
              </div>
            </div>
          )}
        </div>
        
        {/* Indicadores (Puntitos) */}
        {totalSlides > 1 && (
          <div className="mt-2.5 flex justify-center gap-1.5 z-10">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? 'w-6 bg-voltech-cyan' : 'w-2 bg-slate-700'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
})()}      
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">
          
          {/* ✅ SIDEBAR IZQUIERDO: SOLO si hay publicidad activa */}
          <aside className="hidden lg:block col-span-1 lg:col-span-2 space-y-4 order-2 lg:order-1">
           <div className={`${cardBg} border ${cardBorder} rounded-xl p-4`}>
            <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          <Tag className="w-4 h-4 text-purple-600" /> Rango de Precio ($)
            </h3>
           <div className="flex items-center gap-2">
           <input type="number" min="0" placeholder="Mín" value={precioMin} onChange={(e) => setPrecioMin(e.target.value)} className={`w-full px-2 py-1.5 border rounded-lg text-xs ${inputBg}`} />
          <span className={mutedText}>—</span>
          <input type="number" min="0" placeholder="Máx" value={precioMax} onChange={(e) => setPrecioMax(e.target.value)} className={`w-full px-2 py-1.5 border rounded-lg text-xs ${inputBg}`} />
             </div>
          {(precioMin !== '' || precioMax !== '') && (
          <button onClick={() => { setPrecioMin(''); setPrecioMax(''); }} className={`mt-2 text-xs ${mutedText} hover:text-purple-600`}>✕ Limpiar rango</button>
           )}
          </div>
             {hayMasVendidos && (
                <div className={`${cardBg} border ${cardBorder} rounded-xl p-3`}>
                  <h3 className={`text-sm font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{masVendidosConfig.titulo}</h3>
                  <div className="space-y-2">
                    {productosMasVendidos.slice(0, masVendidosConfig.cantidad_maxima || 3).map(p => {
                      const precioInfo = getPrecioMostrar(p);
                      return (
                        <div key={p.id} onClick={() => setSelectedProduct(p)} className={`flex items-center gap-2 p-1.5 rounded-lg border ${cardBorder} hover:border-voltech-cyan/50 cursor-pointer transition-all`}>
                          <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {p.imagen ? <img src={p.imagen} alt={p.producto} className="w-full h-full object-contain" /> : <Package className="w-5 h-5 text-slate-300" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{p.producto}</p>
                            <p className={`text-[10px] ${mutedText}`}>${precioInfo.precioPrincipal?.toFixed(2)}</p>
                          </div>
                          {p.vendidos > 0 ? <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">🔥 {p.vendidos} vendidos</span> : <Trophy className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                  <div className={`mt-2 space-y-0.5 text-[10px] ${mutedText}`}>
                    {masVendidosConfig.descripcion_1 && <p>{masVendidosConfig.descripcion_1}</p>}
                    {masVendidosConfig.descripcion_2 && <p>{masVendidosConfig.descripcion_2}</p>}
                  </div>
                </div>
              )}
            </aside>

          <div className="col-span-1 lg:col-span-10 xl:col-span-10 order-1 lg:order-2">
{activeSection === 'productos' && (
<div>
<h2 className={`text-2xl md:text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Productos</h2>
{productosAgrupados.length > 0 ? (
productosAgrupados.map(([cat, items]) => (
<div key={cat} className="mb-10">
<h3 className={`text-lg md:text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
<Tag className="w-5 h-5 text-purple-600" /> {cat}
<span className={`text-xs font-normal ${mutedText}`}>({items.length})</span>
</h3>
<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 w-full">
{items.map((p, idx) => renderProductCard(p, idx))}
</div>
</div>
))
) : (
<div className="text-center py-20">
<Package className={`w-16 h-16 mx-auto mb-3 opacity-30 ${mutedText}`} />
<p className={`text-lg ${mutedText}`}>No hay productos disponibles</p>
<p className={`text-sm ${mutedText} mt-2`}>Total en sistema: {(productos || []).length}</p>
</div>
)}
</div>
)}
            {activeSection === 'streaming' && (
              <div>
                <h2 className={`text-2xl md:text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Streaming</h2>
                {streamingAgrupados.map(([cat, items]) => (
                <div key={cat} className="mb-10">
                <h3 className={`text-lg md:text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <Play className="w-5 h-5 text-purple-600" /> {cat}
                <span className={`text-xs font-normal ${mutedText}`}>({items.length})</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 w-full">
      {items.map((p, idx) => {
      const precioInfo = getPrecioMostrar(p);
      return (
      <div key={p.id || p.plataforma || `stream-${idx}`} onClick={() => setSelectedProduct(p)} className={`flex flex-col justify-between h-full ${darkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl shadow-md border overflow-hidden hover:shadow-xl hover:border-slate-700 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group`}>
      <div className="relative w-full aspect-[16/9] bg-slate-950 flex items-center justify-center overflow-hidden rounded-t-2xl">
        <CarruselImagen
          imagenes={Array.from(new Set([p.imagen, ...(Array.isArray(p.imagenes) ? p.imagenes : [])].filter(Boolean)))}
          alt={p.plataforma}
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          iconoVacio={<Play className="w-10 h-10 text-white/80" />}
        />
        {p.categoria_promo && <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-0.5 rounded-full text-[9px] font-bold shadow-md z-10">{p.categoria_promo}</div>}
        {precioInfo.tieneOferta && <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md z-10">OFERTA</div>}
        {p.disponibilidad === 'bajo_pedido' && <div className="absolute bottom-2 left-2 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold shadow-md z-10">🛒 BAJO PEDIDO</div>}
        </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className={`font-semibold text-sm mb-2 line-clamp-2 leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{p.plataforma}</h3>
        <div className="mt-auto space-y-2">
          <div>
            {precioInfo.tieneOferta && <p className="text-xs text-gray-400 line-through">${precioInfo.precioTachado?.toFixed(2)}</p>}
            <p className={`text-xl font-bold ${precioInfo.tieneOferta ? 'text-red-600' : darkMode ? 'text-white' : 'text-slate-900'}`}>${precioInfo.precioPrincipal}</p>
            <p className={`text-xs font-medium ${mutedText}`}>Bs {calcularPrecioBs(precioInfo.precioPrincipal)}</p>
          </div>
          <div className="flex items-center gap-1.5 w-full mt-auto pt-3">
        <button onClick={(e) => { e.stopPropagation(); addToCart(p); }} className="w-full inline-flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs py-2 px-2 rounded-xl transition-all shadow-sm">
                <ShoppingCart className="w-4 h-4 shrink-0" />
                <span>Agregar al Carrito</span>
                </button>
                </div>
                </div>
                </div>
                </div>
                );
                })}
                </div>
                </div>
                ))}
                {streamingAgrupados.length === 0 && <div className={`text-center py-20 col-span-full ${mutedText}`}><Play className="w-16 h-16 mx-auto mb-3 opacity-30" /><p className="text-lg">No hay plataformas disponibles</p></div>}
              </div>
            )}

            {activeSection === 'ofertas' && (
              <div>
                <h2 className={`text-2xl md:text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}> Ofertas Especiales</h2>
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <button onClick={() => setOfertasTab('productos')} className={`flex-1 px-6 py-3 rounded-xl font-semibold text-sm transition-all border-2 flex items-center justify-center gap-2 ${ofertasTab === 'productos' ? 'border-voltech-cyan bg-voltech-cyan/10 text-voltech-cyan' : `${cardBorder} ${mutedText} hover:border-voltech-cyan/50`}`}>
                  <Package className="w-4 h-4" /> Productos ({ofertasProductos.length})
                  </button>
                  <button onClick={() => setOfertasTab('streaming')} className={`flex-1 px-6 py-3 rounded-xl font-semibold text-sm transition-all border-2 flex items-center justify-center gap-2 ${ofertasTab === 'streaming' ? 'border-voltech-purple bg-voltech-purple/10 text-voltech-purple' : `${cardBorder} ${mutedText} hover:border-voltech-purple/50`}`}>
                  <Play className="w-4 h-4" /> Streaming ({ofertasStreaming.length})
                  </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 w-full">
                  {(ofertasTab === 'productos' ? ofertasProductos : ofertasStreaming).length > 0 ? (
                  (ofertasTab === 'productos' ? ofertasProductos : ofertasStreaming).map((p, idx) => {
                  const precioInfo = getPrecioMostrar(p);
                  return (
                  <div key={p.id || p.producto || p.plataforma || `oferta-${idx}`} onClick={() => manejarClickOferta(p)} className={`flex flex-col justify-between h-full ${darkMode ? 'bg-gradient-to-br from-orange-900/30 to-red-900/30 border-red-800' : 'bg-gradient-to-br from-orange-50 to-red-50 border-red-200'} rounded-2xl shadow-md border-2 overflow-hidden relative hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer group`}>
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md z-10">OFERTA</div>
                          {p.categoria_promo && <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-0.5 rounded-full text-[9px] font-bold shadow-md z-20">{p.categoria_promo}</div>}
                          <div className={`relative w-full overflow-hidden rounded-t-2xl flex items-center justify-center ${(p.tipo === 'streaming' || (p.categoria || '').toUpperCase() === 'STREAMING') ? 'aspect-[16/9] bg-slate-950' : 'aspect-square bg-slate-900'}`}>
                            <CarruselImagen
                              imagenes={Array.from(new Set([p.imagen, ...(Array.isArray(p.imagenes) ? p.imagenes : [])].filter(Boolean)))}
                              alt={p.producto || p.plataforma}
                              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                              iconoVacio={<Package className="w-12 h-12 text-slate-300" />}
                            />
                          </div>
                          <div className="p-3 flex flex-col flex-1">
                            <h3 className={`font-semibold text-sm mb-2 line-clamp-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{p.producto || p.plataforma}</h3>
                          <div className="mb-3">
                          {(precioInfo.precioTachado || (p.esPublicidad && p.precio_original > 0)) && <p className="text-xs text-gray-400 line-through">${precioInfo.precioTachado ? precioInfo.precioTachado.toFixed(2) : Number(p.precio_original).toFixed(2)}</p>}
                          <p className={`text-xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{p.esPublicidad && p.precio_manual ? p.precio_manual : `$${(precioInfo.precioPrincipal || 0).toFixed ? (precioInfo.precioPrincipal || 0).toFixed(2) : precioInfo.precioPrincipal}`}</p>
                          <p className={`text-xs ${mutedText}`}>Bs {calcularPrecioBs(p.esPublicidad && p.precio_manual ? (parseFloat(String(p.precio_manual).replace(/[^0-9.]/g, '')) || 0) : (precioInfo.precioPrincipal || 0))}</p>
                          </div>
                          <div className="flex items-center gap-1.5 w-full mt-auto pt-3">
                          <button onClick={(e) => { e.stopPropagation(); manejarClickOferta(p); }} className="w-full inline-flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs py-2 px-2 rounded-xl transition-all shadow-sm">
                          <ShoppingCart className="w-4 h-4 shrink-0" />
                          <span>{p.esPublicidad && p.esExterno ? 'Ver Oferta Externa' : 'Compra Ya'}</span>
                          </button>
                          </div>                            
                            </div>
                              </div>
                              );
                              })
                            ) : (
                    <div className="col-span-full text-center py-20">
                      <Zap className={`w-16 h-16 mx-auto mb-3 opacity-30 ${mutedText}`} />
                    <p className={`text-lg ${mutedText}`}>No hay ofertas de {ofertasTab === 'productos' ? 'productos' : 'streaming'} disponibles</p>
                    <p className={`text-sm ${mutedText} mt-2`}>Activa una oferta o una publicidad con destino interno para verla aquí</p>                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'opiniones' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>⭐ Opiniones de Clientes</h2>
                  <button onClick={() => setShowOpinionForm(!showOpinionForm)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Dejar Opinión</button>
                </div>

                {showOpinionForm && (
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`${cardBg} border ${cardBorder} rounded-2xl shadow-lg p-6 mb-8`}>
                    <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Escribe tu opinión</h3>
                    <form onSubmit={handleSubmitOpinion} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Nombre *</label>
                          <input type="text" value={formDataOpinion.nombre} onChange={(e) => setFormDataOpinion({...formDataOpinion, nombre: e.target.value})} className={`w-full px-4 py-2 border rounded-lg ${inputBg}`} required />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Teléfono (opcional)</label>
                          <input type="tel" value={formDataOpinion.telefono} onChange={(e) => setFormDataOpinion({...formDataOpinion, telefono: e.target.value})} className={`w-full px-4 py-2 border rounded-lg ${inputBg}`} />
                        </div>
                      </div>
                      
                      {/* ✅ NUEVO CAMPO: ¿Dónde nos conoció? */}
                      <div>
                        <CustomSelect
                          label="¿Dónde nos conoció?"
                          value={formDataOpinion.donde_nos_conocio}
                          onChange={(v) => setFormDataOpinion({...formDataOpinion, donde_nos_conocio: v})}
                          options={[
                            { value: 'Instagram', label: 'Instagram' },
                            { value: 'TikTok', label: 'TikTok' },
                            { value: 'Facebook', label: 'Facebook' },
                            { value: 'WhatsApp', label: 'WhatsApp' },
                            { value: 'Google', label: 'Google' },
                            { value: 'Recomendación', label: 'Recomendación de amigo/familiar' },
                            { value: 'Otro', label: 'Otro' }
                          ]}
                          placeholder="Selecciona una opción"
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Producto (opcional)</label>
                        <input type="text" value={formDataOpinion.producto} onChange={(e) => setFormDataOpinion({...formDataOpinion, producto: e.target.value})} className={`w-full px-4 py-2 border rounded-lg ${inputBg}`} placeholder="Nombre del producto" />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Calificación *</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} type="button" onClick={() => setFormDataOpinion({...formDataOpinion, rating: star})} className="p-1">
                              <Star className={`w-8 h-8 ${star <= formDataOpinion.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Comentario *</label>
                        <textarea value={formDataOpinion.comentario} onChange={(e) => setFormDataOpinion({...formDataOpinion, comentario: e.target.value})} rows={4} className={`w-full px-4 py-2 border rounded-lg ${inputBg}`} required />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Imagen/Video</label>
                        <input type="file" ref={fileInputRef} accept="image/*" onChange={(e) => handleFileChange(e.target.files[0])} className="hidden" />
                        {!formDataOpinion.foto ? (
                          <div onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragOver ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : `${darkMode ? 'border-slate-700 hover:border-slate-600' : 'border-slate-300 hover:border-slate-400'}`}`}>
                            <div className="flex flex-col items-center gap-3">
                              <div className={`p-3 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}><Upload className={`w-6 h-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} /></div>
                              <div><p className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Haz clic para subir imagen/video</p><p className={`text-xs ${mutedText} mt-1`}>Arrastra y suelta o selecciona un archivo (Máx. 2MB)</p></div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative inline-block">
                            <img src={formDataOpinion.foto} alt="Vista previa" className="w-full max-w-sm h-48 object-contain p-2 bg-voltech-dark rounded-xl border border-voltech-border" />
                            <button type="button" onClick={() => setFormDataOpinion({...formDataOpinion, foto: null})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-red-600 shadow-lg"><X className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setShowOpinionForm(false)} className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-200 hover:bg-slate-300'}`}>Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Enviar Opinión</button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {opinionesAprobadas.length === 0 ? (
                  <div className="text-center py-20"><MessageSquare className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-slate-700' : 'text-slate-300'}`} /><p className={mutedText}>No hay opiniones publicadas aún</p><p className={`text-sm ${mutedText} mt-2`}>¡Sé el primero en dejar una opinión!</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {opinionesAprobadas.map(opinion => (
                      <div key={opinion.id} className={`${cardBg} border ${cardBorder} rounded-xl shadow-md p-6`}>
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">{opinion.nombre.charAt(0).toUpperCase()}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{opinion.nombre}</h4>
                              <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(star => (<Star key={star} className={`w-4 h-4 ${star <= opinion.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />))}</div>
                            </div>
                            {opinion.producto && <p className={`text-xs ${mutedText} mb-2`}>Producto: {opinion.producto}</p>}
                            {opinion.donde_nos_conocio && <p className={`text-xs ${mutedText} mb-2`}>Nos conoció por: {opinion.donde_nos_conocio}</p>}
                            {opinion.foto && (
                              <div className="mb-3">
                                <img src={opinion.foto} alt={opinion.producto || 'Foto del producto'} className="w-full max-w-xs h-48 object-contain p-2 bg-voltech-dark rounded-lg border border-voltech-border cursor-pointer hover:opacity-90 transition-opacity" onClick={() => { const imgWindow = window.open('', '_blank'); imgWindow.document.write(`<html><head><title>${opinion.producto || 'Foto'}</title><style>body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #000; } img { max-width: 100%; max-height: 100vh; object-fit: contain; }</style></head><body><img src="${opinion.foto}" /></body></html>`); }} />
                              </div>
                            )}
                            <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-3`}>{opinion.comentario}</p>
                            <p className={`text-xs ${mutedText}`}>{new Date(opinion.fecha).toLocaleDateString('es-VE')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'sorteos' && (
              <div>
                {!sorteoActivo ? (
                  <div className="text-center py-20"><Gift className={`w-20 h-20 mx-auto mb-4 ${darkMode ? 'text-slate-700' : 'text-slate-300'}`} /><h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>No hay sorteos activos</h2><p className={mutedText}>Vuelve pronto para participar en nuestros próximos sorteos.</p></div>
                ) : (
                  <div>
                    <div className="flex gap-4 mb-6 border-b border-voltech-border">
                      <button 
                        onClick={() => setShowWinners(false)}
                        className={`pb-3 px-4 font-medium transition-colors ${!showWinners ? 'text-purple-600 border-b-2 border-purple-600' : mutedText}`}
                      >
                        Sorteo Activo
                      </button>
                      <button 
                        onClick={() => setShowWinners(true)}
                        className={`pb-3 px-4 font-medium transition-colors flex items-center gap-2 ${showWinners ? 'text-purple-600 border-b-2 border-purple-600' : mutedText}`}
                      >
                        <Trophy className="w-4 h-4" /> Ganadores
                      </button>
                    </div>

                    {!showWinners ? (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-7 space-y-6">
                          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${cardBg} border ${cardBorder} rounded-2xl shadow-lg overflow-hidden`}>
                            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-6 text-white text-center relative overflow-hidden">
                              <div className="absolute inset-0 bg-black/20"></div>
                              <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-3"><Sparkles className="w-4 h-4" /><span className="text-sm font-semibold">{sorteoActivo.tipo_sorteo === 'votacion' ? '🔥 VOTACIÓN COMUNITARIA' : '🎁 SORTEO ACTIVO'}</span></div>
                                <h1 className="text-2xl md:text-4xl font-bold mb-2">{sorteoActivo.titulo}</h1>
                                <p className="text-white/90">{sorteoActivo.tipo_sorteo === 'votacion' ? 'Selecciona tu producto favorito y participa' : (sorteoActivo.descripcion || '¡Participa y gana!')}</p>
                              </div>
                            </div>
                          </motion.div>

                          {sorteoActivo.tipo_sorteo === 'fijo' && sorteoActivo.producto_id && (
                            <div className={`${cardBg} border ${cardBorder} rounded-2xl shadow-lg p-6`}>
                              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}><Gift className="w-5 h-5 text-purple-600" /> Premio del Sorteo</h2>
                              {(() => {
                                const prod = productos.find(p => p.id === sorteoActivo.producto_id);
                                if (!prod) return <p className={mutedText}>Producto no disponible</p>;
                                return (
                                  <div className="flex flex-col md:flex-row gap-6">
                                    <div className="w-full md:w-1/2 aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center overflow-hidden">{prod.imagen ? <img src={prod.imagen} alt={prod.producto} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2UyZThmMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOWE5YWE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2luIEltYWdlbjwvdGV4dD48L3N2Zz4='; }} /> : <Gift className="w-24 h-24 text-slate-300" />}</div>
                                    <div className="flex-1">
                                      <p className={`text-xs font-medium uppercase tracking-wide ${mutedText} mb-2`}>{prod.marca} • {prod.categoria}</p>
                                      <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{prod.producto}</h3>
                                      <p className={`text-sm mb-4 ${mutedText}`}>{prod.descripcion || 'Producto de alta calidad'}</p>
                                      <div className="mb-4"><p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>${prod.precioDetal}</p><p className={`text-sm ${mutedText}`}>Valor del producto</p></div>
                                      <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg"><Trophy className="w-4 h-4" /><span className="text-sm font-semibold">¡Podría ser tuyo!</span></div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {sorteoActivo.tipo_sorteo === 'votacion' && productosVotacion.length > 0 && (
                            <div className={`${cardBg} border ${cardBorder} rounded-2xl shadow-lg p-6`}>
                              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}><ThumbsUp className="w-5 h-5 text-purple-600" /> Selecciona tu Producto Favorito</h2>
                              <div className="space-y-3">
                                {productosVotacion.map((prod) => {
                                  const votos = prod.votos || 0;
                                  const porcentaje = totalVotos > 0 ? (votos / totalVotos * 100).toFixed(1) : 0;
                                  const isSelected = formDataSorteo.producto_votado_id === prod.id;
                                  return (
                                    <div key={prod.id} onClick={() => setFormDataSorteo({...formDataSorteo, producto_votado_id: prod.id})} className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : `${cardBorder} hover:border-purple-400`}`}>
                                      <div className="flex items-center gap-4">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-purple-600 bg-purple-600' : 'border-slate-400'}`}>{isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}</div>
                                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">{prod.imagen ? <img src={prod.imagen} alt={prod.producto} className="w-full h-full object-contain p-2 rounded-lg" onError={(e) => { e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2UyZThmMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOWE5YWE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2luIEltYWdlbjwvdGV4dD48L3N2Zz4='; }} /> : <Package className="w-8 h-8 text-slate-300" />}</div>
                                        <div className="flex-1"><h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{prod.producto}</h4><p className={`text-sm ${mutedText}`}>{prod.marca} • {prod.categoria}</p></div>
                                        <div className="text-right">
                                          <div className="flex items-center gap-2"><span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{porcentaje}%</span></div>
                                          <p className={`text-xs ${mutedText}`}>{votos} {votos === 1 ? 'voto' : 'votos'}</p>
                                          <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden"><div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500" style={{ width: `${porcentaje}%` }}></div></div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div className={`${cardBg} border ${cardBorder} rounded-2xl shadow-lg p-4`}>
                              <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}><Clock className="w-4 h-4 text-purple-600" /> Tiempo Restante</h3>
                              <div className="grid grid-cols-4 gap-2">
                                {[{ valor: timeLeft.dias, label: 'D' }, { valor: timeLeft.horas, label: 'H' }, { valor: timeLeft.minutos, label: 'M' }, { valor: timeLeft.segundos, label: 'S' }].map((item, idx) => (
                                  <div key={idx} className={`${darkMode ? 'bg-slate-800' : 'bg-slate-100'} rounded-lg p-2 text-center`}>
                                    <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{String(item.valor).padStart(2, '0')}</div>
                                    <div className={`text-[10px] ${mutedText}`}>{item.label}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className={`${cardBg} border ${cardBorder} rounded-2xl shadow-lg p-4`}>
                              <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}><Users className="w-4 h-4 text-purple-600" /> Participantes</h3>
                              <div className="text-center py-2">
                                <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{participantes.filter(p => p.sorteo_id === sorteoActivo.id).length}</div>
                                <p className={`text-xs ${mutedText}`}>{sorteoActivo.tipo_sorteo === 'votacion' ? 'votos totales' : 'tickets'}</p>
                              </div>
                              <div className="mt-2 flex items-center justify-center gap-1 text-xs text-green-600"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Activo</div>
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-5">
                          <div className={`${cardBg} border ${cardBorder} rounded-2xl shadow-lg p-6 sticky top-24`}>
                            <h2 className={`text-xl font-bold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}><Ticket className="w-5 h-5 text-purple-600" /> {sorteoActivo.tipo_sorteo === 'votacion' ? 'Vota y Participa' : 'Regístrate para Participar'}</h2>
                            <p className={`${mutedText} mb-6 text-sm`}>{sorteoActivo.tipo_sorteo === 'votacion' ? 'Completa tus datos y tu voto sumará para el premio ganador.' : 'Llena el formulario y recibe tu número de ticket único.'}</p>

                            <form onSubmit={handleSubmitSorteo} className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                <div><label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Nombre *</label><input type="text" value={formDataSorteo.nombre} onChange={(e) => setFormDataSorteo({ ...formDataSorteo, nombre: e.target.value })} className={`w-full px-3 py-2.5 border rounded-lg text-sm ${inputBg}`} placeholder="Tu nombre" required /></div>
                                <div><label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Apellido *</label><input type="text" value={formDataSorteo.apellido} onChange={(e) => setFormDataSorteo({ ...formDataSorteo, apellido: e.target.value })} className={`w-full px-3 py-2.5 border rounded-lg text-sm ${inputBg}`} placeholder="Tu apellido" required /></div>
                              </div>
                              <div>
                                <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Número de Contacto (WhatsApp) *</label>
                                <input type="tel" value={formDataSorteo.telefono} onChange={(e) => setFormDataSorteo({ ...formDataSorteo, telefono: e.target.value })} className={`w-full px-3 py-2.5 border rounded-lg text-sm ${inputBg}`} placeholder="0412-1234567" required />
                              </div>
                              
                              <div className="border-t border-voltech-border pt-4 space-y-3">
                                <h4 className="text-xs font-semibold text-voltech-cyan">🚀 Aumenta tus Chances</h4>
                                <div>
                                  <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Código de Compra (Opcional)</label>
                                  <input type="text" value={formDataSorteo.codigoCompra} onChange={(e) => setFormDataSorteo({ ...formDataSorteo, codigoCompra: e.target.value.toUpperCase() })} className={`w-full px-3 py-2.5 border rounded-lg text-sm ${inputBg}`} placeholder="Ej: 23-07-004" />
                                  {bonusTickets.compra > 0 && <p className="text-xs text-voltech-success mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> +{bonusTickets.compra} tickets bonus</p>}
                                </div>
                                <div>
                                  <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Código de Referido (Opcional)</label>
                                  <input type="text" value={formDataSorteo.codigoReferido} onChange={(e) => setFormDataSorteo({ ...formDataSorteo, codigoReferido: e.target.value.toUpperCase() })} className={`w-full px-3 py-2.5 border rounded-lg text-sm ${inputBg}`} placeholder="Ej: VOLTECHSTORE-JESUS" />
                                  {bonusTickets.referido > 0 && <p className="text-xs text-voltech-success mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> +{bonusTickets.referido} tickets bonus</p>}
                                </div>
                              </div>

                              <div className={`${darkMode ? 'bg-purple-900/20' : 'bg-purple-50'} border border-purple-500/30 rounded-lg p-4`}>
                                <p className="text-xs font-semibold text-purple-600 mb-2"> Resumen de Tickets:</p>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between"><span className={mutedText}>Base:</span><span className="text-white font-medium">{sorteoActivo.configuracion?.ticketsBase || 1} ticket</span></div>
                                  {bonusTickets.compra > 0 && <div className="flex justify-between"><span className={mutedText}>Por compra:</span><span className="text-voltech-success font-medium">+{bonusTickets.compra} tickets</span></div>}
                                  {bonusTickets.referido > 0 && <div className="flex justify-between"><span className={mutedText}>Por referido:</span><span className="text-voltech-success font-medium">+{bonusTickets.referido} tickets</span></div>}
                                  <div className="border-t border-purple-500/30 pt-1 mt-1 flex justify-between"><span className="text-white font-bold">TOTAL:</span><span className="text-purple-600 font-bold">{(sorteoActivo.configuracion?.ticketsBase || 1) + bonusTickets.compra + bonusTickets.referido} tickets</span></div>
                                </div>
                              </div>

                              <div className={`p-3 rounded-lg ${darkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'} border`}>
                                <div className="flex gap-2">
                                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                  <div className={`text-xs ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                                    <ul className="list-disc list-inside space-y-0.5"><li>Solo 1 participación por persona</li><li>Mayor de edad</li><li>Contacto por WhatsApp</li></ul>
                                  </div>
                                </div>
                              </div>

                              <button type="submit" disabled={loadingSorteo} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg">
                                {loadingSorteo ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Procesando...</>) : sorteoActivo.tipo_sorteo === 'votacion' ? (<><ThumbsUp className="w-5 h-5" />VOTAR Y GENERAR TICKETS</>) : (<><Ticket className="w-5 h-5" />OBTENER MIS TICKETS</>)}
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}> Últimos Ganadores</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className={`${cardBg} border ${cardBorder} rounded-xl p-6`}>
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold">MG</div>
                                <div>
                                  <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>María G.</h4>
                                  <p className="text-xs text-voltech-muted">@maria_fit</p>
                                </div>
                              </div>
                              <Trophy className="w-6 h-6 text-yellow-500" />
                            </div>
                            <div className="space-y-2 text-sm">
                              <p><span className={mutedText}>Premio:</span> <span className={darkMode ? 'text-white' : 'text-slate-900'}>Combo Audífonos + Cable USB</span></p>
                              <p><span className={mutedText}>Sorteo:</span> <span className={darkMode ? 'text-white' : 'text-slate-900'}>Junio 2026</span></p>
                              <p><span className={mutedText}>Ticket:</span> <span className="font-mono text-voltech-cyan">#VOLT-4521</span></p>
                            </div>
                          </div>
                          
                          <div className={`${cardBg} border ${cardBorder} rounded-xl p-6`}>
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">JV</div>
                                <div>
                                  <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>José V.</h4>
                                </div>
                              </div>
                              <Trophy className="w-6 h-6 text-yellow-500" />
                            </div>
                            <div className="space-y-2 text-sm">
                              <p><span className={mutedText}>Premio:</span> <span className={darkMode ? 'text-white' : 'text-slate-900'}>Cuenta Netflix 1 mes</span></p>
                              <p><span className={mutedText}>Sorteo:</span> <span className={darkMode ? 'text-white' : 'text-slate-900'}>Mayo 2026</span></p>
                              <p><span className={mutedText}>Ticket:</span> <span className="font-mono text-voltech-cyan">#VOLT-3892</span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-900'} text-white mt-16 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">{settings.tienda?.nombre || 'VOLTECHSTOREVE'}</h3>
              <p className="text-slate-400 text-sm">{settings.tienda?.direccion || 'Caracas, Venezuela'}</p>
              <p className="text-slate-400 text-sm mt-2">{settings.tienda?.email}</p>
              
              <button 
                onClick={() => setShowTermsModal(true)} 
                className="mt-4 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
              >
                <FileText className="w-4 h-4" /> Términos y Condiciones
              </button>
            </div>
            <div>
              <h4 className="font-bold mb-4"> Redes Sociales</h4>
              <div className="space-y-2 text-sm">
                {settings.tienda?.instagramUrl && <a href={settings.tienda.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-pink-400 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg> Instagram</a>}
                {settings.tienda?.tiktokUrl && <a href={settings.tienda.tiktokUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg> TikTok</a>}
                {settings.tienda?.facebookUrl && <a href={settings.tienda.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> Facebook</a>}
                <button onClick={() => abrirWhatsAppNat(whatsappNumero, '¡Hola VOLTECH! 👋 Quiero más información.')} className="flex items-center gap-2 text-slate-400 hover:text-green-400 transition-colors"><WhatsAppIcon className="w-4 h-4" /> WhatsApp</button>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4"> Entregas</h4>
              <div className="text-sm text-slate-400 space-y-2">
                <p><strong className="text-white">Retiro en:</strong></p>
                {puntosEntrega.length > 0 ? puntosEntrega.map((p, i) => <p key={i}>• {p}</p>) : <p>Consultar puntos disponibles</p>}
                <p className="mt-3"><strong className="text-white">Delivery:</strong> GRATIS desde ${settings.envios?.deliveryGratisDesde || 5}</p>
                <p><strong className="text-white">Envío Nacional:</strong> {settings.envios?.descripcionEnvioNacional || `cobro a destino · GRATIS desde $${settings.envios?.montoMinimoEnvioGratis || 50}`}</p>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4"> Métodos de Pago</h4>
              <div className="text-sm text-slate-400 space-y-1">
                {metodosPagoActivos.map(m => <p key={m}>• {m.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>)}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-6 text-center text-sm text-slate-500">© {new Date().getFullYear()} {settings.tienda?.nombre || 'VOLTECHSTOREVE'}. Todos los derechos reservados.</div>
        </div>
      </footer>

      {/* Modal de Términos y Condiciones */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-[90] flex items-center justify-center p-4" onClick={() => setShowTermsModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`${cardBg} border ${cardBorder} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
              <div className={`sticky top-0 ${cardBg} border-b ${cardBorder} p-6 flex justify-between items-center z-10`}>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Términos y Condiciones
                </h3>
                <button onClick={() => setShowTermsModal(false)} className="p-2 hover:bg-voltech-border rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 space-y-4 text-sm leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-purple-600 mb-1">1. Política de Pago Anticipado</h4>
                    <p className={mutedText}>Para garantizar la disponibilidad de inventario y el procesamiento logístico con nuestros proveedores, todo despacho se gestionará exclusivamente previa recepción y conciliación del pago total.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-600 mb-1">2. Presentación</h4>
                    <p className={mutedText}>Es obligatorio presentar este comprobante para cualquier reclamo.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-600 mb-1">3. Tiempo de Garantía</h4>
                    <p className={mutedText}>El producto tiene una garantía de 3 días continuos.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-600 mb-1">4. Exclusiones</h4>
                    <p className={mutedText}>No cubre daños físicos, humedad, sobrecargas o sellos removidos.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-600 mb-1">5. Empaque</h4>
                    <p className={mutedText}>Es obligatorio conservar la caja y accesorios originales en buen estado.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-600 mb-1">6. Gestión de Cambios</h4>
                    <p className={mutedText}>Sujeto a revisión técnica (24-48h). Es condición indispensable la entrega del producto defectuoso en su empaque original; no se entregará un reemplazo sin la verificación previa del equipo anterior.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-600 mb-1">7. Reembolsos y Conformidad</h4>
                    <p className={mutedText}>Al recibir, el cliente acepta el estado del producto. Bajo ninguna circunstancia se realizará la devolución de dinero; se procederá exclusivamente al cambio por un producto igual o de similares características.</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-voltech-border text-center">
                  <button onClick={() => setShowTermsModal(false)} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">Entendido</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Producto - ACTUALIZADO */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`${cardBg} border ${cardBorder} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
              <div className={`sticky top-0 ${cardBg} border-b ${cardBorder} p-4 flex justify-between items-center z-10`}>
                <h3 className="text-xl font-bold truncate pr-4">{selectedProduct.producto || selectedProduct.plataforma}</h3>
                <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-voltech-border rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                <div className="space-y-4">
                  <div className={`w-full rounded-xl overflow-hidden flex items-center justify-center relative ${selectedProduct.tipo === 'streaming' ? 'bg-black' : 'bg-transparent'}`} style={{ minHeight: '280px' }}>
                    <CarruselImagen
                      imagenes={Array.from(new Set([
                        selectedProduct.imagen,
                        ...(Array.isArray(selectedProduct.imagenes) ? selectedProduct.imagenes : []),
                        ...(Array.isArray(selectedProduct.productos_kit) ? selectedProduct.productos_kit.map(k => k.imagen).filter(Boolean) : [])
                      ].filter(Boolean)))}
                      alt={selectedProduct.producto || selectedProduct.plataforma}
                      className="w-full h-auto max-h-[420px] object-contain mx-auto"
                      objectFit="contain"
                      iconoVacio={<Package className="w-24 h-24 text-slate-300" />}
                    />
                    {selectedProduct.categoria_promo && <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md z-20">{selectedProduct.categoria_promo}</div>}
                    {getPrecioMostrar(selectedProduct).tieneOferta && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">OFERTA</div>
                )}
                {selectedProduct.disponibilidad === 'bajo_pedido' && (
                <div className="absolute bottom-4 left-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">🛒 BAJO PEDIDO</div>
                )}
                </div>
                  {selectedProduct.colores && selectedProduct.colores.length > 0 && (
                    <div className="flex gap-2 justify-center">
                      {selectedProduct.colores.map((color, idx) => (
                        <div key={idx} className="w-8 h-8 rounded-full border-2 border-voltech-border cursor-pointer hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: color }} title={color} />
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-voltech-muted uppercase tracking-wide">{selectedProduct.marca} • {selectedProduct.categoria || selectedProduct.tipo}</p>
                    <h2 className="text-3xl font-bold mt-1">{selectedProduct.producto || selectedProduct.plataforma}</h2>
                  </div>
                  
                  <div className="flex items-baseline gap-3 flex-wrap">
                    {getPrecioMostrar(selectedProduct).tieneOferta && (
                      <span className="text-lg text-gray-400 line-through">${getPrecioMostrar(selectedProduct).precioTachado?.toFixed(2)}</span>
                    )}
                    <span className={`text-3xl font-bold ${getPrecioMostrar(selectedProduct).tieneOferta ? 'text-red-600' : ''}`}>
                      ${getPrecioMostrar(selectedProduct).precioPrincipal?.toFixed(2)}
                    </span>
                    <span className="text-sm text-voltech-muted">Bs {calcularPrecioBs(getPrecioMostrar(selectedProduct).precioPrincipal)}</span>
                  </div>

                  <div className="text-sm text-voltech-muted space-y-2">
                    <p>{selectedProduct.descripcion || 'Sin descripción disponible.'}</p>
                    {selectedProduct.tipo === 'streaming' && selectedProduct.duracion && (
                    <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> Duración: {selectedProduct.duracion}</p>
                    )}
                    {selectedProduct.disponibilidad === 'bajo_pedido' && (
                    <p className="flex items-center gap-2 text-amber-500 text-xs mt-1">
                    <ShoppingCart className="w-4 h-4" /> Bajo pedido 
                    </p>
                    )}
                    </div>

                  {/* ✅ NUEVO: Mostrar contenido del Kit o descripción detallada */}
                  {selectedProduct.tipo === 'kit' && selectedProduct.productos_kit && selectedProduct.productos_kit.length > 0 ? (
                    <div className={`${darkMode ? 'bg-slate-800' : 'bg-slate-50'} border ${cardBorder} rounded-lg p-4`}>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4 text-voltech-cyan" />
                        Contenido del Kit
                      </h4>
                      <ul className="list-disc list-inside text-sm text-voltech-muted space-y-1">
                        {selectedProduct.productos_kit.map((item, idx) => (
                          <li key={idx}>{item.nombre || item.producto} (x{item.cantidad})</li>
                        ))}
                      </ul>
                    </div>
                  ) : selectedProduct.descripcion_detallada ? (
                    <div className={`${darkMode ? 'bg-slate-800' : 'bg-slate-50'} border ${cardBorder} rounded-lg p-4`}>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4 text-voltech-cyan" />
                        Especificaciones Técnicas
                      </h4>
                      <p className="text-sm text-voltech-muted whitespace-pre-line">
                        {selectedProduct.descripcion_detallada}
                      </p>
                    </div>
                  ) : null}

                  {selectedProduct.caracteristicas && Array.isArray(selectedProduct.caracteristicas) && (
                    <div>
                      <h4 className="font-semibold mb-2">Características:</h4>
                      <ul className="list-disc list-inside text-sm text-voltech-muted space-y-1">
                        {selectedProduct.caracteristicas.map((carac, idx) => (
                          <li key={idx}>{carac}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-2 w-full mt-auto pt-3">
                  <button
                  onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                  className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  <span>Agregar al Carrito</span>
                  </button>
                </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Ticket */}
      <AnimatePresence>
        {showTicketModal && ticketGenerado && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={() => setShowTicketModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`${cardBg} border ${cardBorder} rounded-2xl shadow-2xl max-w-md w-full p-8`} onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4"><CheckCircle className="w-10 h-10 text-green-600" /></div>
                <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}> ¡Registro Exitoso!</h2>
                <p className={`${mutedText} mb-6`}>{sorteoActivo.tipo_sorteo === 'votacion' ? 'Tu voto ha sido registrado' : 'Ya estás participando en el sorteo'}</p>
                <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'} border-2 border-dashed rounded-xl p-6 mb-6`}>
                  <p className={`text-xs ${mutedText} mb-2`}>TUS TICKETS:</p>
                  <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-4 break-all`}>{Array.isArray(ticketGenerado) ? ticketGenerado.join(', ') : ticketGenerado}</div>
                  <button onClick={copiarTicket} className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"><Copy className="w-4 h-4" />Copiar tickets</button>
                  
                  <div className="border-t border-voltech-border pt-4 mt-4">
                    <p className={`text-xs ${mutedText} mb-2`}> TU CÓDIGO DE REFERIDO PERSONAL:</p>
                    <div className="flex items-center justify-center gap-2 bg-voltech-dark rounded-lg p-3 border border-voltech-border">
                      <span className="text-sm font-mono font-bold text-voltech-cyan break-all">
                        VOLTECHSTORE-{formDataSorteo.nombre.substring(0, 4).toUpperCase()}-{formDataSorteo.telefono.slice(-4)}
                      </span>
                      <button 
                        onClick={() => {
                          const codigo = `VOLTECHSTORE-${formDataSorteo.nombre.substring(0, 4).toUpperCase()}-${formDataSorteo.telefono.slice(-4)}`;
                          navigator.clipboard.writeText(codigo);
                          toast.success('¡Código copiado!');
                        }} 
                        className="p-2 hover:bg-voltech-border rounded transition-colors flex-shrink-0"
                        title="Copiar código"
                      >
                        <Copy className="w-4 h-4 text-voltech-muted" />
                      </button>
                    </div>
                    <p className="text-[10px] text-voltech-muted mt-2">¡Compártelo! Si alguien participa con tu código, ambos ganan tickets extra.</p>
                  </div>
                </div>
                <div className={`text-sm ${mutedText} mb-6 space-y-1`}>
                  <p> Fecha del sorteo:</p>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{new Date(sorteoActivo?.fecha_fin).toLocaleDateString('es-VE')}</p>
                  <p className="mt-3">Guarda este número. Si eres el ganador, te contactaremos al teléfono registrado.</p>
                </div>
                <button onClick={() => setShowTicketModal(false)} className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">✓ Entendido</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Carrito */}
      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setShowCart(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`${darkMode ? 'bg-slate-900' : 'bg-white'} w-full max-w-md h-full overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
              <div className={`sticky top-0 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-b p-4 flex justify-between items-center z-10`}>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}> Carrito</h2>
                <button onClick={() => setShowCart(false)} className={darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8"><ShoppingCart className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-slate-700' : 'text-slate-300'}`} /><p className={mutedText}>Carrito vacío</p></div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6">
                      {cart.map(item => {
                        const precioInfo = getPrecioMostrar(item);
                        return (
                          <div key={item.id} className={`${darkMode ? 'bg-slate-800' : 'bg-slate-50'} p-3 rounded-lg`}>
                            <div className="flex gap-3">
                              <div className={`w-16 h-16 rounded flex items-center justify-center flex-shrink-0 overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>{item.imagen ? <img src={item.imagen} className="w-full h-full object-contain p-2" onError={(e) => { e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2UyZThmMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOWE5YWE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2luIEltYWdlbjwvdGV4dD48L3N2Zz4='; }} /> : <Package className={`w-8 h-8 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />}</div>
                              <div className="flex-1 min-w-0">
                                <h3 className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.producto || item.plataforma}</h3>
                                <div className="flex items-center gap-2">
                                  {precioInfo.tieneOferta && <span className="text-[10px] text-gray-400 line-through">${precioInfo.precioTachado?.toFixed(2)}</span>}
                                  <span className={`text-sm font-bold ${precioInfo.tieneOferta ? 'text-red-600' : darkMode ? 'text-white' : 'text-slate-900'}`}>${((precioInfo.precioPrincipal || 0) * item.cantidad).toFixed(2)}</span>
                                </div>
                                {item.tipo === 'streaming' && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Digital</span>}
                                <div className="flex items-center gap-2 mt-1">
                                  <button onClick={() => updateQuantity(item.id, item.cantidad - 1)} className={`p-1 rounded ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}><Minus className="w-3 h-3" /></button>
                                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.cantidad}</span>
                                  <button onClick={() => updateQuantity(item.id, item.cantidad + 1)} className={`p-1 rounded ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}><Plus className="w-3 h-3" /></button>
                                  <button onClick={() => removeFromCart(item.id)} className="ml-auto p-1 text-red-500"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!tieneSoloProductosDigitales ? (
                      <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}> Método de Entrega</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => setDeliveryMethod('retiro')} className={`p-2 rounded-lg border-2 text-xs transition-colors ${deliveryMethod === 'retiro' ? 'border-purple-600 bg-purple-50 text-purple-700' : darkMode ? 'border-slate-700 text-slate-300 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'}`}> Retiro</button>
                          <button onClick={() => setDeliveryMethod('delivery')} className={`p-2 rounded-lg border-2 text-xs transition-colors ${deliveryMethod === 'delivery' ? 'border-purple-600 bg-purple-50 text-purple-700' : darkMode ? 'border-slate-700 text-slate-300 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'}`}> Delivery</button>
                          <button onClick={() => setDeliveryMethod('nacional')} className={`p-2 rounded-lg border-2 text-xs transition-colors ${deliveryMethod === 'nacional' ? 'border-purple-600 bg-purple-50 text-purple-700' : darkMode ? 'border-slate-700 text-slate-300 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'}`}> 📬 Nacional</button>
                        </div>
                        
                        {deliveryMethod === 'retiro' && (
                          <div className="mt-3">
                            {puntosEntrega.length > 0 ? (
                              <CustomSelect
                                value={selectedAddress}
                                onChange={setSelectedAddress}
                                options={puntosEntrega.map(d => ({ value: d, label: d }))}
                                placeholder="Selecciona punto de retiro"
                                className="w-full"
                              />
                            ) : (
                              <div className={`p-3 rounded-lg text-xs border ${darkMode ? 'bg-yellow-900/20 text-yellow-300 border-yellow-800' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>⚠️ No hay puntos de retiro configurados. Ve a <strong>Ajustes → Envíos y Entregas</strong> para agregarlos.</div>
                            )}
                          </div>
                        )}
                        
                        {deliveryMethod === 'delivery' && (
                          <>
                            <input type="text" value={customerLocation} onChange={(e) => setCustomerLocation(e.target.value)} placeholder="Tu ubicación exacta" className={`w-full mt-3 px-3 py-2 border rounded-lg text-sm ${inputBg}`} />
                            {cart.reduce((s, i) => s + ((getPrecioMostrar(i).precioPrincipal || 0) * i.cantidad), 0) >= (settings.envios?.deliveryGratisDesde || 5) && (<p className="text-xs text-green-600 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Envío GRATIS (supera ${settings.envios?.deliveryGratisDesde || 5})</p>)}
                          </>
                        )}

                        {deliveryMethod === 'nacional' && (
                            <div className="mt-3 space-y-2">
                            <div className={`p-2.5 rounded-lg text-[10px] leading-relaxed border ${envioNacionalInfo().gratis ? (darkMode ? 'bg-green-900/20 text-green-300 border-green-800' : 'bg-green-50 text-green-700 border-green-200') : (darkMode ? 'bg-yellow-900/20 text-yellow-300 border-yellow-800' : 'bg-yellow-50 text-yellow-700 border-yellow-200')}`}>
                            🚚 {envioNacionalInfo().gratis
                            ? `¡Envío nacional GRATIS por tu compra de $${settings.envios?.montoMinimoEnvioGratis || 50} o más!`
                            : (settings.envios?.descripcionEnvioNacional || `Envíos menores a $${settings.envios?.montoMinimoEnvioGratis || 50}: cobro a destino`)}
                            </div>
                            <CustomSelect
                              value={agenciaEnvio}
                              onChange={setAgenciaEnvio}
                              options={[
                                { value: 'MRW', label: 'MRW' },
                                { value: 'ZOOM', label: 'ZOOM' },
                                { value: 'Tealca', label: 'Tealca' },
                                { value: 'Domesa', label: 'Domesa' },
                                { value: 'Otra', label: 'Otra' }
                              ]}
                              placeholder="Selecciona agencia"
                              className="w-full"
                            />
                            <input type="text" value={oficinaDestino} onChange={(e) => setOficinaDestino(e.target.value)} placeholder="Ej: Oficina MRW Centro, Valencia" className={`w-full px-3 py-2 border rounded-lg text-sm ${inputBg}`} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`mb-4 p-3 rounded-lg border ${darkMode ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
                        <p className={`text-sm font-medium flex items-center gap-2 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}><Truck className="w-4 h-4" /> Entrega: Envío Digital / WhatsApp</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Los productos digitales se entregan directamente por WhatsApp</p>
                      </div>
                    )}

                    <div className="mb-4 grid grid-cols-1 gap-2">
                    <label className={`block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}> Tus Datos *</label>
                    <input type="text" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Nombre y apellido *" className={`w-full px-3 py-2 border rounded-lg text-sm ${inputBg}`} />
                    <input type="tel" value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} placeholder="Teléfono (WhatsApp) *" className={`w-full px-3 py-2 border rounded-lg text-sm ${inputBg}`} />
                    </div>
                    <div className="mb-4">
                      <CustomSelect
                        label="Método de Pago"
                        value={paymentMethod}
                        onChange={setPaymentMethod}
                        options={metodosPagoActivos.map(m => ({
                          value: m,
                          label: m.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                        }))}
                        placeholder="Selecciona método"
                        className="w-full"
                      />
                    </div>

                    <div className="mb-4">
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}> Cupón de Descuento</label>
                      {appliedCoupon ? (
                        <div className="flex items-center gap-2">
                          <div className={`flex-1 px-3 py-2 border-2 border-green-500 rounded-lg text-sm ${darkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
                            <span className="font-mono font-bold text-green-600">{appliedCoupon.codigo}</span>
                            <span className="text-xs text-green-600 ml-2">
                              (-${appliedCoupon.descuentoCalculado.toFixed(2)})
                            </span>
                          </div>
                          <button 
                            onClick={removeCoupon}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                            title="Quitar cupón"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={couponCode} 
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
                            placeholder="Código" 
                            className={`flex-1 px-3 py-2 border rounded-lg text-sm ${inputBg}`} 
                          />
                          <button onClick={applyCoupon} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">Aplicar</button>
                        </div>
                      )}
                      
                    {/* ✅ Referido ahora es 100% interno: el cliente no lo ve (sigue yendo en el mensaje al equipo) */}                    </div>

                    {(() => {
                          const hayStreaming = cart.some(item => item.tipo === 'streaming' || (item.categoria || '').toUpperCase() === 'STREAMING');
                          const hayFisicos = cart.some(item => item.tipo !== 'streaming' && (item.categoria || '').toUpperCase() !== 'STREAMING');
                          const terminosFisicos = settings.politicas?.terminos || '';
                          const terminosStreaming = settings.politicas?.terminos_streaming || '';
                          return (
                            <div className={`mb-4 p-3 rounded-lg border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                              <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={terminosAceptados}
                                  onChange={(e) => setTerminosAceptados(e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-600 text-purple-600 focus:ring-purple-500 mt-0.5 flex-shrink-0"
                                />
                                <span className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-700'} leading-relaxed`}>
                                  He leído y acepto los{' '}
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}
                                    className="text-purple-600 font-semibold hover:underline"
                                  >
                                    Términos y Condiciones
                                  </button>
                                  {hayStreaming && hayFisicos && ' (aplican tanto para productos físicos como digitales)'}
                                  {hayStreaming && !hayFisicos && ' para productos streaming'}
                                  {!hayStreaming && hayFisicos && ' para productos físicos'}
                                </span>
                              </label>
<div className={`mt-2 text-[10px] ${mutedText} border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} pt-2`}>
<div className={`${verTerminosCompletos ? 'max-h-56 overflow-y-auto pr-1' : 'max-h-14 overflow-hidden'} space-y-2`}>
{(hayFisicos || (!hayStreaming && !hayFisicos)) && terminosFisicos && (
<div>
<p className="font-semibold text-purple-600 mb-1">📦 Productos Físicos:</p>
<p className="whitespace-pre-line">{terminosFisicos}</p>
</div>
)}
{hayStreaming && terminosStreaming && (
<div>
<p className="font-semibold text-purple-600 mb-1">📺 Streaming:</p>
<p className="whitespace-pre-line">{terminosStreaming}</p>
</div>
)}
</div>
<button
type="button"
onClick={() => setVerTerminosCompletos(!verTerminosCompletos)}
className="mt-1.5 text-purple-600 font-semibold hover:underline"
>
{verTerminosCompletos ? '▲ Ver menos' : '▼ Ver más'}
</button>
</div>                            </div>
                          );
                        })()}
                        <div className={`border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'} pt-4 mb-4 space-y-1 text-sm`}>
                        <div className="flex justify-between"><span className={mutedText}>Subtotal:</span><span className={darkMode ? 'text-white' : 'text-slate-900'}>${cart.reduce((s, i) => s + ((getPrecioMostrar(i).precioPrincipal || 0) * i.cantidad), 0).toFixed(2)}</span></div>
                        {appliedCoupon && (
                        <div className="flex justify-between text-green-600">
                        <span>Descuento ({appliedCoupon.codigo}):</span>
                        <span>-${appliedCoupon.descuentoCalculado.toFixed(2)}</span>
                        </div>
                        )}
                        {ofertaActiva && (
                        <div className="flex justify-between text-purple-400">
                        <span>⚡ Oferta Relámpago ({ofertaActiva.descuento_pct}%):</span>
                        <span>-${(cart.reduce((s, i) => s + ((getPrecioMostrar(i).precioPrincipal || 0) * i.cantidad), 0) * (Number(ofertaActiva.descuento_pct) || 0) / 100).toFixed(2)}</span>
                        </div>
                        )}
                        <div className="flex justify-between"><span className={mutedText}>Envío:</span><span className={darkMode ? 'text-white' : 'text-slate-900'}>{deliveryMethod === 'nacional' ? (envioNacionalInfo().gratis ? 'GRATIS' : envioNacionalInfo().texto) : (calcularEnvio() === 0 ? 'GRATIS' : '$' + calcularEnvio().toFixed(2))}</span></div>
                        <div className={`flex justify-between font-bold text-lg border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'} pt-2 mt-2`}><span className={darkMode ? 'text-white' : 'text-slate-900'}>Total:</span><span className={darkMode ? 'text-white' : 'text-slate-900'}>${calculateTotal().toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className={mutedText}>Bs:</span><span className={mutedText}>Bs {calcularPrecioBs(calculateTotal())}</span></div>
                      </div>

                    <button onClick={finalizarPedido} className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md mb-2">
                      <WhatsAppIcon className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">Finalizar por WhatsApp</span>
                    </button>
                    <button onClick={() => setCart([])} className={`w-full py-2 rounded-lg text-sm transition-colors ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>Vaciar Carrito</button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ CHATBOT WIDGET: se oculta mientras el carrito está abierto para no estorbar al finalizar */}
      {!showCart && (
      <ChatbotWidget
      productos={productos}
      whatsappNumber={whatsappNumero}
      />
      )}
    </div>
  );
};