'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/app/context/PermissionsContext';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import CustomSelect from '@/components/CustomSelect';
import {
  Store, CreditCard, Truck, FileText, Database, Save, Download, Upload,
  Plus, Trash2, MapPin, Eye, EyeOff, ArrowUp, Info,
  Image as ImageIcon, Palette, AlertCircle, Sparkles, Wallet,
  Zap, Clock, ToggleLeft, ToggleRight, X, Edit3
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

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

const PLANTILLA_COMPRA_DEFAULT = `¡Hola! Te escribo del catálogo \u{1F44B} quiero comprar [TipoCompra]
[Icono] [Producto]
\u{1F4B0} [Precio]
\u{1F4B5} [Bs]
\u{1F517} [Url]`;

export default function AjustesPage() {
  const { esAdmin } = usePermissions();
  const [activeTab, setActiveTab] = useState('tienda');
  const [settings, setSettings] = useState({
    tienda: { nombre: 'VOLTECH STORE', email: '', telefono: '', direccion: '', instagramUrl: '', facebookUrl: '', tiktokUrl: '', whatsappUrl: '', logo: '' },
    pagos: {
      efectivo: { activo: true, publico: true, nombre: 'Efectivo' },
      pago_movil: { activo: true, publico: true, nombre: 'Pago Móvil' },
      transferencia_bs: { activo: true, publico: true, nombre: 'Transferencia (Bs)' },
      transferencia_usd: { activo: true, publico: true, nombre: 'Transferencia ($)' },
      binance: { activo: true, publico: true, nombre: 'Binance' },
    },
    carteras: [
      { id: 'caja_principal', nombre: 'Caja Principal', activo: true },
      { id: 'caja_chica', nombre: 'Caja Chica', activo: true },
      { id: 'banco_mercantil', nombre: 'Banco Mercantil', activo: true },
      { id: 'banco_provincial', nombre: 'Banco Provincial', activo: true },
      { id: 'binance', nombre: 'Binance', activo: true },
    ],
    envios: { puntosEntrega: ['Plaza Venezuela', 'Sambil Chacao', 'CC Ciudad Caracas', 'Metro Los Símbolos'], deliveryGratisDesde: 5.00, costoEnvioNacional: 3.00, montoMinimoEnvioGratis: 50.00, descripcionEnvioNacional: 'Envíos menores a $50: cobro a destino', tiempo: '24-48 horas', notas: 'Los envíos se realizan de lunes a viernes' },
    politicas: { terminos: '1. POLÍTICA DE PAGO ANTICIPADO: Para garantizar la disponibilidad de inventario y el procesamiento logístico con nuestros proveedores, todo despacho se gestionará exclusivamente previa recepción y conciliación del pago total.\n2. PRESENTACIÓN: Es obligatorio presentar este comprobante para cualquier reclamo.\n3. TIEMPO DE GARANTÍA: El producto tiene una garantía de 3 días continuos.\n4. EXCLUSIONES: No cubre daños físicos, humedad, sobrecargas o sellos removidos.\n5. EMPAQUE: Es obligatorio conservar la caja y accesorios originales en buen estado.\n6. GESTIÓN DE CAMBIOS: Sujeto a revisión técnica(24-48h). Es condición indispensable la entrega del producto defectuoso en su empaque original; no se entregará un reemplazo sin la verificación previa del equipo anterior.\n7. REEMBOLSOS Y CONFORMIDAD: Al recibir, el cliente acepta el estado del producto. Bajo ninguna circunstancia se realizará la devolución de dinero; se procederá exclusivamente al cambio por un producto igual o de similares características.', terminos_streaming: '1. ENTREGA DIGITAL: Las cuentas y suscripciones se entregan vía WhatsApp o correo electrónico en un plazo máximo de 15 minutos tras confirmar el pago.\n2. DURACIÓN: El tiempo de la suscripción comienza a contar desde el momento de la entrega de credenciales.\n3. GARANTÍA DE CUENTA: Ofrecemos garantía completa durante toda la duración contratada. Si la cuenta presenta fallas, se reemplaza de inmediato sin costo.\n4. MAL USO: Queda anulado el soporte si el cliente comparte credenciales, modifica la contraseña o el correo asociado, o incumple las normas de la plataforma (Netflix, Disney+, HBO, etc.).\n5. DEVOLUCIONES: No se realizan reembolsos una vez entregadas las credenciales. Solo aplica cambio de cuenta por fallas técnicas comprobadas.\n6. PAGO ANTICIPADO: Todas las plataformas streaming se entregan únicamente tras la verificación del pago. Sin excepciones.', privacidad: 'Tus datos están protegidos y no serán compartidos con terceros.' },
    colores: { primario: '#00ff88', secundario: '#8b5cf6', acento: '#06b6d4', fondo: '#0a0a0f', texto: '#ffffff', difuminado: 'horizontal' },
    whatsapp: { plantilla_compra: PLANTILLA_COMPRA_DEFAULT, cierre_compra: 'Quiero comprar ✅' },
    oferta_relampago: { activo: false, texto: '⚡ 10% de descuento en toda la tienda solo por hoy', descuento_pct: 10, duracion_horas: 2, inicio: '', fin: '' },
    oferta_inferior: { activo: false, texto: '', descuento_pct: 0 },
  });

  const [nuevoPunto, setNuevoPunto] = useState('');
  const [nuevoMetodo, setNuevoMetodo] = useState('');
  const [nuevaCartera, setNuevaCartera] = useState('');
  const [mostrarTerminos, setMostrarTerminos] = useState(false);
  const [mostrarTerminosStreaming, setMostrarTerminosStreaming] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [ofertasBanners, setOfertasBanners] = useState([]);
  const [showOfertaForm, setShowOfertaForm] = useState(false);
  const [ofertaEditando, setOfertaEditando] = useState(null);
  const [formDataOferta, setFormDataOferta] = useState({
    tipo_oferta: 'opcional', // 'opcional' | 'recompensa_opinion' | 'descuento_todo' | 'descuento_streaming'
    posicion: 'superior',
    texto: '', descuento_pct: 0, monto: 0,
    modo_descuento: 'pct', // 'pct' | 'monto' | 'tickets' (solo para recompensa_opinion)
    recompensa_tickets: 2,
    categoria_aplica: '',
    fecha_inicio: '', duracion_dias: 1, fecha_fin: '',
    hora_inicio: '00:00', hora_fin: '23:59',
  });

  useEffect(() => {
    const cargarAjustes = async () => {
      let datosCargados = null;
      if (supabase) {
        const { data, error } = await supabase.from('settings').select('clave, valor');
        if (!error && data && data.length > 0) {
          datosCargados = {};
          data.forEach(item => { datosCargados[item.clave] = item.valor; });
        }
      }
      if (!datosCargados) {
        const savedSettings = localStorage.getItem('voltech_settings');
        if (savedSettings) datosCargados = JSON.parse(savedSettings);
      }
      if (datosCargados) {
        setSettings(prev => {
          // ✅ Si existe whatsapp_numero o telefono_tienda en la BD, priorizarlo
          const telefonoBD = datosCargados.whatsapp_numero || datosCargados.telefono_tienda || prev.tienda.telefono;
          const merged = { ...prev,
            tienda: { ...prev.tienda, ...datosCargados.tienda, telefono: telefonoBD },
            envios: { ...prev.envios, ...datosCargados.envios },
            politicas: { ...prev.politicas, ...datosCargados.politicas },
          };
          if (datosCargados.pagos) {
            const migratedPagos = {};
            Object.entries(datosCargados.pagos).forEach(([key, value]) => {
              if (typeof value === 'boolean') migratedPagos[key] = { activo: value, publico: value, nombre: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) };
              else migratedPagos[key] = { activo: value.activo ?? true, publico: value.publico ?? true, nombre: value.nombre || key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) };
            });
            merged.pagos = migratedPagos;
          }
          if (datosCargados.carteras) merged.carteras = datosCargados.carteras;
          if (datosCargados.colores) merged.colores = { ...prev.colores, ...datosCargados.colores };
          if (datosCargados.whatsapp) merged.whatsapp = { ...prev.whatsapp, ...datosCargados.whatsapp };
          if (datosCargados.oferta_relampago) merged.oferta_relampago = { ...prev.oferta_relampago, ...datosCargados.oferta_relampago };
          if (datosCargados.oferta_inferior) merged.oferta_inferior = { ...prev.oferta_inferior, ...datosCargados.oferta_inferior };
          return merged;
        });
      }
    };
    cargarAjustes();
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ Cargar Ofertas/Banners desde Supabase o localStorage
  useEffect(() => {
    const cargarOfertas = async () => {
      let arr = null;
      if (supabase) {
        const { data } = await supabase.from('settings').select('valor').eq('clave', 'ofertas_banners').maybeSingle();
        if (data?.valor) arr = typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor;
      }
      if (!arr) { try { arr = JSON.parse(localStorage.getItem('voltech_ofertas_banners') || 'null'); } catch (e) {} }
      if (Array.isArray(arr)) setOfertasBanners(arr);
    };
    cargarOfertas();
    const h = () => cargarOfertas();
    window.addEventListener('voltech-data-updated', h);
    return () => window.removeEventListener('voltech-data-updated', h);
  }, []);

  // ✅ Auto-calcula fecha_fin = fecha_inicio + duración
  useEffect(() => {
    if (formDataOferta.fecha_inicio && formDataOferta.duracion_dias) {
      const f = new Date(formDataOferta.fecha_inicio + 'T00:00:00');
      f.setDate(f.getDate() + (parseInt(formDataOferta.duracion_dias) || 0));
      const y = f.getFullYear(), m = String(f.getMonth() + 1).padStart(2, '0'), d = String(f.getDate()).padStart(2, '0');
      setFormDataOferta(prev => ({ ...prev, fecha_fin: `${y}-${m}-${d}` }));
    }
  }, [formDataOferta.fecha_inicio, formDataOferta.duracion_dias]);

  // ✅ Categorías existentes en el sistema (para el selector de banners superiores)
  const [categoriasSistema, setCategoriasSistema] = useState([]);
  useEffect(() => {
    const cargarCats = async () => {
      let prods = [];
      if (supabase) {
        const { data } = await supabase.from('productos').select('categoria');
        if (data && data.length) prods = data;
      }
      if (!prods.length) {
        try { prods = JSON.parse(localStorage.getItem('voltech_productos') || '[]'); } catch (e) {}
      }
      setCategoriasSistema(
        [...new Set((prods || []).map(p => p.categoria).filter(c => c && c.toUpperCase() !== 'STREAMING'))].sort()
      );
    };
    cargarCats();
    const h = () => cargarCats();
    window.addEventListener('voltech-data-updated', h);
    return () => window.removeEventListener('voltech-data-updated', h);
  }, []);

  const handleSave = async () => {
    if (!esAdmin) { toast.error('Solo el administrador puede modificar los ajustes'); return; }
    try {
      if (supabase) {
        const settingsToSave = [
          { clave: 'tienda', valor: settings.tienda },
          { clave: 'whatsapp_numero', valor: settings.tienda.telefono }, // ✅ Clave específica para el Catálogo
          { clave: 'telefono_tienda', valor: settings.tienda.telefono }, // ✅ Respaldo
          { clave: 'pagos', valor: settings.pagos },
          { clave: 'carteras', valor: settings.carteras },
          { clave: 'envios', valor: settings.envios },
          { clave: 'politicas', valor: settings.politicas },
          { clave: 'colores', valor: settings.colores },
          { clave: 'whatsapp', valor: settings.whatsapp },
          { clave: 'oferta_relampago', valor: settings.oferta_relampago },
          { clave: 'oferta_inferior', valor: settings.oferta_inferior },
        ];
        const { error } = await supabase.from('settings').upsert(settingsToSave, { onConflict: 'clave' });
        if (error) throw error;
      }
      localStorage.setItem('voltech_settings', JSON.stringify(settings));
      toast.success('Ajustes guardados correctamente');
      window.dispatchEvent(new CustomEvent('settings-updated', { detail: settings }));
    } catch (error) {
      console.error('Error al guardar en Supabase:', error);
      localStorage.setItem('voltech_settings', JSON.stringify(settings));
      toast.error('Error de conexión. Guardado solo en modo local.');
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleExport = () => {
    const data = { productos: localStorage.getItem('voltech_productos'), equipo: localStorage.getItem('voltech_equipo'), carteras: localStorage.getItem('voltech_carteras'), settings: localStorage.getItem('voltech_settings'), fecha: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `voltech_backup_${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup exportado correctamente');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target);
        if (data.productos) localStorage.setItem('voltech_productos', data.productos);
        if (data.equipo) localStorage.setItem('voltech_equipo', data.equipo);
        if (data.carteras) localStorage.setItem('voltech_carteras', data.carteras);
        if (data.settings) { localStorage.setItem('voltech_settings', data.settings); setSettings(prev => ({ ...prev, ...JSON.parse(data.settings) })); }
        toast.success('Datos importados correctamente. Recarga la página.');
      } catch (error) { toast.error('Error al leer el archivo de backup'); }
    };
    reader.readAsText(file);
  };

  const updateSetting = (section, key, value) => setSettings(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
  const updateColor = (key, value) => setSettings(prev => ({ ...prev, colores: { ...prev.colores, [key]: value } }));

  const handleLogoUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('La imagen no debe pesar más de 2MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setLogoPreview(reader.result); setSettings(prev => ({ ...prev, tienda: { ...prev.tienda, logo: reader.result } })); };
    reader.readAsDataURL(file);
  };
  const handleDrop = (e) => { e.preventDefault(); setIsDragOver(false); handleLogoUpload(e.dataTransfer.files[0]); };
  const handleFileInput = (e) => handleLogoUpload(e.target.files[0]);

  const agregarPuntoEntrega = () => {
    if (!nuevoPunto.trim()) return;
    if (settings.envios.puntosEntrega.includes(nuevoPunto)) { toast.error('Este punto ya existe'); return; }
    setSettings(prev => ({ ...prev, envios: { ...prev.envios, puntosEntrega: [...prev.envios.puntosEntrega, nuevoPunto] } }));
    setNuevoPunto(''); toast.success('Punto de entrega agregado');
  };
  const eliminarPuntoEntrega = (index) => { setSettings(prev => ({ ...prev, envios: { ...prev.envios, puntosEntrega: prev.envios.puntosEntrega.filter((_, i) => i !== index) } })); toast.success('Punto eliminado'); };

  const agregarMetodoPago = () => {
    if (!nuevoMetodo.trim()) return;
    const id = nuevoMetodo.toLowerCase().replace(/\s+/g, '_');
    if (Object.keys(settings.pagos).includes(id)) { toast.error('Este método ya existe'); return; }
    setSettings(prev => ({ ...prev, pagos: { ...prev.pagos, [id]: { activo: true, publico: true, nombre: nuevoMetodo } } }));
    setNuevoMetodo(''); toast.success('Método de pago agregado');
  };
  const eliminarMetodoPago = (id) => { setSettings(prev => { const { [id]: _, ...rest } = prev.pagos; return { ...prev, pagos: rest }; }); toast.success('Método eliminado'); };
  const actualizarMetodoPago = (id, campo, valor) => setSettings(prev => ({ ...prev, pagos: { ...prev.pagos, [id]: { ...prev.pagos[id], [campo]: valor } } }));

  const agregarCartera = () => {
    if (!nuevaCartera.trim()) return;
    if (settings.carteras.some(c => c.nombre === nuevaCartera)) { toast.error('Esta cartera ya existe'); return; }
    const id = nuevaCartera.toLowerCase().replace(/\s+/g, '_');
    setSettings(prev => ({ ...prev, carteras: [...prev.carteras, { id, nombre: nuevaCartera, activo: true }] }));
    setNuevaCartera(''); toast.success('Cartera agregada');
  };
  const eliminarCartera = (id) => { setSettings(prev => ({ ...prev, carteras: prev.carteras.filter(c => c.id !== id) })); toast.success('Cartera eliminada'); };

  const aplicarColoresGlobales = () => {
    const root = document.documentElement;
    root.style.setProperty('--color-primario', settings.colores.primario);
    root.style.setProperty('--color-secundario', settings.colores.secundario);
    root.style.setProperty('--color-acento', settings.colores.acento);
    toast.success('Colores aplicados (vista previa). Guarda para aplicar permanentemente.');
  };
  const getGradientStyle = () => {
    const { primario, secundario, difuminado } = settings.colores;
    switch (difuminado) {
      case 'horizontal': return { background: `linear-gradient(90deg, ${primario}, ${secundario})` };
      case 'vertical': return { background: `linear-gradient(180deg, ${primario}, ${secundario})` };
      case 'radial': return { background: `radial-gradient(circle, ${primario}, ${secundario})` };
      case 'diagonal': return { background: `linear-gradient(135deg, ${primario}, ${secundario})` };
      default: return { background: primario };
    }
  };

  // ⚡ ACTIVAR Oferta Relámpago: establece inicio=ahora, fin=ahora+horas
  const activarOfertaRelampago = () => {
    const now = new Date();
    const horas = Number(settings.oferta_relampago.duracion_horas) || 2;
    const fin = new Date(now.getTime() + horas * 60 * 60 * 1000);
    setSettings(prev => ({
      ...prev,
      oferta_relampago: {
        ...prev.oferta_relampago,
        activo: true,
        inicio: now.toISOString(),
        fin: fin.toISOString(),
      }
    }));
    toast.success(`⚡ Oferta activada por ${horas} hora(s)`);
  };

  const desactivarOfertaRelampago = () => {
    setSettings(prev => ({
      ...prev,
      oferta_relampago: { ...prev.oferta_relampago, activo: false, inicio: '', fin: '' }
    }));
    toast.success('Oferta desactivada');
  };

  // ═══════════════ GESTOR DE OFERTAS / BANNERS ═══════════════
  const resetFormOferta = () => setFormDataOferta({ tipo_oferta: 'opcional', posicion: 'superior', texto: '', descuento_pct: 0, monto: 0, modo_descuento: 'pct', recompensa_tickets: 2, categoria_aplica: '', fecha_inicio: '', duracion_dias: 1, fecha_fin: '', hora_inicio: '00:00', hora_fin: '23:59' });

  const persistirOfertas = async (arr) => {
    setOfertasBanners(arr);
    if (supabase) await supabase.from('settings').upsert({ clave: 'ofertas_banners', valor: arr }, { onConflict: 'clave' });
    localStorage.setItem('voltech_ofertas_banners', JSON.stringify(arr));
    window.dispatchEvent(new CustomEvent('voltech-data-updated'));
  };

  const estadoOferta = (o) => {
    const now = new Date();
    const inicio = new Date(`${o.fecha_inicio}T${o.hora_inicio || '00:00'}`);
    const fin = new Date(`${o.fecha_fin}T${o.hora_fin || '23:59'}`);
    if (now < inicio) return 'programada';
    if (now > fin) return 'expirada';
    return 'activa';
  };

  const guardarOferta = async () => {
    if (!formDataOferta.texto.trim()) { toast.error('Escribe el texto del anuncio'); return; }
    if (!formDataOferta.fecha_inicio) { toast.error('Selecciona la fecha de inicio'); return; }
    
    if (ofertaEditando) {
      await persistirOfertas(ofertasBanners.map(o => o.id === ofertaEditando.id ? { ...o, ...formDataOferta } : o));
      toast.success('Oferta actualizada');
    } else {
      await persistirOfertas([...ofertasBanners, { id: `of-${Date.now()}`, activo: true, creado_en: new Date().toISOString(), ...formDataOferta }]);
      toast.success('Oferta creada y sincronizada al catálogo');
    }
    setShowOfertaForm(false); setOfertaEditando(null); resetFormOferta();
  };

  const toggleOferta = async (id) => {
    await persistirOfertas(ofertasBanners.map(o => o.id === id ? { ...o, activo: !o.activo } : o));
    toast.success('Estado actualizado');
  };

  const eliminarOferta = async (id) => {
    if (!confirm('¿Eliminar esta oferta?')) return;
    await persistirOfertas(ofertasBanners.filter(o => o.id !== id));
    toast.success('Oferta eliminada');
  };

  const cierreCompra = settings.whatsapp?.cierre_compra || 'Quiero comprar ✅';
      // ✅ Si la plantilla guardada es la vieja ("oferta/descuento"), muestra la nueva dinámica
      const plantillaGuardada = settings.whatsapp?.plantilla_compra || PLANTILLA_COMPRA_DEFAULT;
      const plantillaActual = plantillaGuardada.includes('aprovechar la oferta') ? PLANTILLA_COMPRA_DEFAULT : plantillaGuardada;
      const previewMensaje = (() => {
      let m = plantillaActual;
      m = m.split('[TipoCompra]').join('este producto')
      .split('[Icono]').join('\u{1F4E6}')
      .split('[Plataforma]').join('AUDIFONO INALAMBRICO')
      .split('[Producto]').join('AUDIFONO INALAMBRICO')      .split('[Precio]').join('$10.00')
      .split('[Bs]').join('Bs 365.00')
      .split('[Url]').join(typeof window !== 'undefined' ? `${window.location.origin}/catalogo?producto=123` : 'localhost:3000/catalogo?producto=123')
      .split('{{producto}}').join('AUDIFONO INALAMBRICO')
      .split('{{precio}}').join('$10.00')
      .split('{{bs}}').join('Bs 365.00')
      .split('{{url}}').join(typeof window !== 'undefined' ? `${window.location.origin}/catalogo?producto=123` : 'localhost:3000/catalogo?producto=123')
      .replace(/\uFFFD/g, '');
    if (m.includes('{{cierre}}')) m = m.split('{{cierre}}').join(cierreCompra); else m = m + '\n' + cierreCompra;
    return m;
  })();

  const tabs = [
    { id: 'tienda', icon: Store, label: 'Tienda' },
    { id: 'colores', icon: Palette, label: 'Colores' },
    { id: 'envios', icon: Truck, label: 'Envíos' },
    { id: 'pagos', icon: CreditCard, label: 'Pagos' },
    { id: 'carteras', icon: Wallet, label: 'Carteras' },
    { id: 'ofertas_relampago', icon: Zap, label: 'Banners Ofertas' },
    { id: 'terminos', icon: FileText, label: 'Términos' },
    { id: 'whatsapp', icon: WhatsAppIcon, label: 'WhatsApp' },
    { id: 'backup', icon: Database, label: 'Backup' },
  ];

  return (
    <div className="space-y-6">
      <Toaster position="top-right" toastOptions={{ style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' } }} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Ajustes</h1>
          <p className="text-xs sm:text-sm text-voltech-muted mt-1">Configura tu tienda y preferencias</p>
        </div>
        {esAdmin && (
          <button onClick={() => { handleSave(); scrollToTop(); }} className="w-full sm:w-auto shrink-0 justify-center px-4 py-2.5 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-xl text-xs sm:text-sm font-semibold hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center gap-2">
            <Save className="w-4 h-4" /> Guardar Cambios
          </button>
        )}
      </div>

      {!esAdmin && (
        <div className="bg-voltech-warning/10 border border-voltech-warning/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-voltech-warning flex-shrink-0 mt-0.5" />
          <div><p className="text-sm text-voltech-warning font-medium">Solo lectura</p><p className="text-xs text-voltech-muted mt-1">No tienes permisos para modificar los ajustes.</p></div>
        </div>
      )}

      <div className="border-b border-voltech-border">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:gap-6 w-full gap-y-2 pb-2 md:pb-1 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`justify-center md:justify-start py-2.5 md:py-0 md:pb-3 flex items-center gap-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap rounded-lg md:rounded-none border-b-2 ${activeTab === tab.id ? 'text-voltech-cyan bg-voltech-cyan/10 border-transparent md:bg-transparent md:border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {activeTab === 'tienda' && (
          <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6 space-y-6">
            <div>
              <label className="block text-xs text-voltech-muted mb-2">Logo de la Tienda</label>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileInput} className="hidden" />
              <div onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragOver ? 'border-voltech-cyan bg-voltech-cyan/10' : 'border-voltech-border hover:border-voltech-cyan/50'}`}>
                {logoPreview || settings.tienda.logo ? (
                  <div className="space-y-3"><img src={logoPreview || settings.tienda.logo} alt="Logo" className="max-h-32 mx-auto rounded-lg object-contain" /><p className="text-sm text-voltech-muted">Haz clic para cambiar el logo</p></div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-voltech-cyan/20"><ImageIcon className="w-6 h-6 text-voltech-cyan" /></div>
                    <div><p className="text-sm font-medium text-white">Arrastra una imagen o haz clic</p><p className="text-xs text-voltech-muted mt-1">PNG o SVG fondo transparente (Máx. 2MB)</p></div>
                  </div>
                )}
              </div>
              {settings.tienda.logo && (<button onClick={() => { setLogoPreview(''); setSettings(prev => ({ ...prev, tienda: { ...prev.tienda, logo: '' } })); }} className="mt-2 text-xs text-voltech-error flex items-center gap-1"><Trash2 className="w-3 h-3" /> Eliminar logo</button>)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs text-voltech-muted mb-2 ml-1">Nombre de la tienda</label><input type="text" value={settings.tienda.nombre} onChange={(e) => updateSetting('tienda', 'nombre', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" /></div>
              <div><label className="block text-xs text-voltech-muted mb-2 ml-1">Correo electrónico</label><input type="email" value={settings.tienda.email} onChange={(e) => updateSetting('tienda', 'email', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" /></div>
              <div><label className="block text-xs text-voltech-muted mb-2 ml-1">Teléfono de contacto</label><input type="text" value={settings.tienda.telefono} onChange={(e) => updateSetting('tienda', 'telefono', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" /></div>
              <div><label className="block text-xs text-voltech-muted mb-2 ml-1">Dirección general</label><input type="text" value={settings.tienda.direccion} onChange={(e) => updateSetting('tienda', 'direccion', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" /></div>
              <div><label className="block text-xs text-voltech-muted mb-2 ml-1">Instagram (URL)</label><input type="url" value={settings.tienda.instagramUrl} onChange={(e) => updateSetting('tienda', 'instagramUrl', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" /></div>
              <div><label className="block text-xs text-voltech-muted mb-2 ml-1">TikTok (URL)</label><input type="url" value={settings.tienda.tiktokUrl} onChange={(e) => updateSetting('tienda', 'tiktokUrl', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" /></div>
              <div><label className="block text-xs text-voltech-muted mb-2 ml-1">Facebook (URL)</label><input type="url" value={settings.tienda.facebookUrl} onChange={(e) => updateSetting('tienda', 'facebookUrl', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" /></div>
              <div><label className="block text-xs text-voltech-muted mb-2 ml-1">WhatsApp (URL)</label><input type="url" value={settings.tienda.whatsappUrl} onChange={(e) => updateSetting('tienda', 'whatsappUrl', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" /></div>
            </div>
          </div>
        )}

        {activeTab === 'colores' && (
          <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
            <div className="bg-voltech-dark/30 border border-voltech-border rounded-lg p-4">
              <p className="text-xs text-voltech-muted mb-4 flex items-center gap-2"><Info className="w-4 h-4" /> Selecciona los colores. Los cambios se aplican al guardar.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['primario','secundario','acento','fondo','texto'].map(k => (
                  <div key={k}>
                    <label className="block text-xs text-voltech-muted mb-2 capitalize">Color {k}</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={settings.colores[k]} onChange={(e) => updateColor(k, e.target.value)} className="w-12 h-12 rounded-lg border border-voltech-border cursor-pointer" />
                      <input type="text" value={settings.colores[k]} onChange={(e) => updateColor(k, e.target.value)} className="input-voltech flex-1 rounded-lg px-3 py-2 text-sm font-mono" />
                    </div>
                  </div>
                ))}
                <div>
                  <CustomSelect
                    label="Tipo de Difuminado"
                    value={settings.colores.difuminado}
                    onChange={(v) => updateColor('difuminado', v)}
                    options={[
                      { value: 'horizontal', label: '↔️ Horizontal' },
                      { value: 'vertical', label: '↕️ Vertical' },
                      { value: 'diagonal', label: '↗️ Diagonal' },
                      { value: 'radial', label: '⭕ Radial' },
                      { value: 'none', label: '❌ Sólido' }
                    ]}
                    placeholder="Selecciona tipo"
                    className="w-full"
                  />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-voltech-border">
                <p className="text-xs text-voltech-muted mb-3 flex items-center gap-2"><Sparkles className="w-3 h-3" /> Vista Previa del Gradiente:</p>
                <div className="flex flex-wrap gap-3">
                  <div className="px-4 py-3 rounded-lg text-white font-medium shadow-lg" style={getGradientStyle()}>Botón con Gradiente</div>
                  <div className="px-4 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: settings.colores.primario }}>Color Sólido</div>
                </div>
              </div>
              <button onClick={aplicarColoresGlobales} className="mt-4 px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 flex items-center gap-2"><Eye className="w-4 h-4" /> Aplicar Vista Previa</button>
            </div>
          </div>
        )}

        {activeTab === 'envios' && (
          <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6 space-y-6">
            <div>
              <label className="block text-xs text-voltech-muted mb-2">Puntos de entrega en Caracas</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {settings.envios.puntosEntrega.map((punto, index) => (
                  <span key={index} className="inline-flex items-center gap-2 bg-voltech-dark/50 border border-voltech-border px-3 py-1.5 rounded-lg text-sm text-white"><MapPin className="w-3 h-3 text-voltech-cyan" />{punto}<button onClick={() => eliminarPuntoEntrega(index)} className="text-voltech-error"><Trash2 className="w-3 h-3" /></button></span>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" value={nuevoPunto} onChange={(e) => setNuevoPunto(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && agregarPuntoEntrega()} className="input-voltech w-full sm:flex-1 rounded-lg px-4 py-2 text-sm" placeholder="Ej: Plaza Venezuela..." />
                <button onClick={agregarPuntoEntrega} className="w-full sm:w-auto px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg hover:bg-voltech-cyan/30 flex items-center gap-2"><Plus className="w-4 h-4" /> Agregar</button>
              </div>
            </div>
            <div className="p-4 bg-voltech-cyan/5 border border-voltech-cyan/20 rounded-lg">
              <h4 className="text-sm font-semibold text-voltech-cyan mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Entrega Local (Caracas)</h4>
              <label className="block text-xs text-voltech-muted mb-2">Delivery GRATIS a partir de ($)</label>
              <input type="number" step="0.01" value={settings.envios.deliveryGratisDesde} onChange={(e) => updateSetting('envios', 'deliveryGratisDesde', parseFloat(e.target.value) || 0)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" />
            </div>
            <div className="p-4 bg-voltech-purple/5 border border-voltech-purple/20 rounded-lg space-y-4">
              <h4 className="text-sm font-semibold text-voltech-purple flex items-center gap-2"><Truck className="w-4 h-4" /> Envío Nacional</h4>
              <div><label className="block text-xs text-voltech-muted mb-2">Costo de Envío Nacional ($)</label><input type="number" step="0.01" value={settings.envios.costoEnvioNacional || 3} onChange={(e) => updateSetting('envios', 'costoEnvioNacional', parseFloat(e.target.value) || 0)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" /></div>
              <div><label className="block text-xs text-voltech-muted mb-2">Envío nacional GRATIS si supera ($)</label><input type="number" step="0.01" value={settings.envios.montoMinimoEnvioGratis || 50} onChange={(e) => updateSetting('envios', 'montoMinimoEnvioGratis', parseFloat(e.target.value) || 0)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" /></div>
              <div><label className="block text-xs text-voltech-muted mb-2">Descripción del envío nacional</label><input type="text" value={settings.envios.descripcionEnvioNacional || ''} onChange={(e) => updateSetting('envios', 'descripcionEnvioNacional', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs text-voltech-muted mb-2">Tiempo estimado</label><input type="text" value={settings.envios.tiempo} onChange={(e) => updateSetting('envios', 'tiempo', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" /></div>
              <div><label className="block text-xs text-voltech-muted mb-2">Notas adicionales</label><input type="text" value={settings.envios.notas} onChange={(e) => updateSetting('envios', 'notas', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" /></div>
            </div>
          </div>
        )}

        {activeTab === 'pagos' && (
          <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="text" value={nuevoMetodo} onChange={(e) => setNuevoMetodo(e.target.value)} className="input-voltech w-full sm:flex-1 rounded-lg px-4 py-2 text-sm" placeholder="Ej: Zelle, PayPal" />
              <button onClick={agregarMetodoPago} className="w-full sm:w-auto px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg hover:bg-voltech-cyan/30 flex items-center gap-2"><Plus className="w-4 h-4" /> Agregar</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(settings.pagos).map(([key, method]) => (
                <div key={key} className="p-4 rounded-lg bg-voltech-dark/50 border border-voltech-border">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-white">{method.nombre || key}</p>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer"><span className="text-xs text-voltech-muted">Público</span><input type="checkbox" checked={method.publico} onChange={(e) => actualizarMetodoPago(key, 'publico', e.target.checked)} className="w-4 h-4 rounded border-voltech-border" /></label>
                      <button onClick={() => eliminarMetodoPago(key)} className="text-voltech-error"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-voltech-muted mb-1">Activo</label><input type="checkbox" checked={method.activo} onChange={(e) => actualizarMetodoPago(key, 'activo', e.target.checked)} className="w-5 h-5 rounded border-voltech-border" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1">Nombre</label><input type="text" value={method.nombre || key} onChange={(e) => actualizarMetodoPago(key, 'nombre', e.target.value)} className="input-voltech w-full rounded-lg px-2 py-1.5 text-sm" /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'carteras' && (
          <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="text" value={nuevaCartera} onChange={(e) => setNuevaCartera(e.target.value)} className="input-voltech w-full sm:flex-1 rounded-lg px-4 py-2 text-sm" placeholder="Ej: Banco de Venezuela" />
              <button onClick={agregarCartera} className="w-full sm:w-auto px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg hover:bg-voltech-cyan/30 flex items-center gap-2"><Plus className="w-4 h-4" /> Agregar</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {settings.carteras.map((cartera) => (
                <div key={cartera.id} className="p-4 rounded-lg bg-voltech-dark/50 border border-voltech-border">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-white">{cartera.nombre}</p>
                    <button onClick={() => eliminarCartera(cartera.id)} className="text-voltech-error"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-voltech-muted mb-1">Activa</label><input type="checkbox" checked={cartera.activo} onChange={(e) => setSettings(prev => ({ ...prev, carteras: prev.carteras.map(c => c.id === cartera.id ? { ...c, activo: e.target.checked } : c) }))} className="w-5 h-5 rounded border-voltech-border" /></div>
                    <div><label className="block text-xs text-voltech-muted mb-1">Nombre</label><input type="text" value={cartera.nombre} onChange={(e) => setSettings(prev => ({ ...prev, carteras: prev.carteras.map(c => c.id === cartera.id ? { ...c, nombre: e.target.value } : c) }))} className="input-voltech w-full rounded-lg px-2 py-1.5 text-sm" /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ofertas_relampago' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Ofertas y Banners</h2>
                <p className="text-sm text-voltech-muted mt-1">Crea promociones sincronizadas con el catálogo</p>
              </div>
              <button onClick={() => { resetFormOferta(); setOfertaEditando(null); setShowOfertaForm(!showOfertaForm); }} className="w-full sm:w-auto shrink-0 justify-center px-4 py-2.5 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Plus className="w-4 h-4" /> Crear Oferta
              </button>
            </div>

            {showOfertaForm && (
              <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-voltech-muted mb-2">📍 Posición del Banner</label>
                    <CustomSelect
                      value={formDataOferta.posicion}
                      onChange={(v) => setFormDataOferta({ ...formDataOferta, posicion: v })}
                      options={[
                        { value: 'superior', label: '⬆️ Banner Superior (fijo/informativo)' },
                        { value: 'inferior', label: '⬇️ Banner Inferior (Oferta Relámpago)' }
                      ]}
                      placeholder="Selecciona posición"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-voltech-muted mb-2">📝 Texto del anuncio <span className="text-voltech-cyan font-mono">({formDataOferta.texto.length}/80)</span></label>
                    <input type="text" maxLength={80} value={formDataOferta.texto} onChange={(e) => setFormDataOferta({ ...formDataOferta, texto: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Ej: 🚚 Delivery GRATIS en Caracas" />
                  </div>
                </div>

                {/* 🎁 TIPO DE RECOMPENSA (solo cuando es Banner Inferior) */}
                {formDataOferta.posicion === 'inferior' && (
                  <div>
                    <label className="block text-xs text-voltech-muted mb-2">🎁 Tipo de Recompensa</label>
                    <CustomSelect
                      value={formDataOferta.tipo_oferta || 'opcional'}
                      onChange={(v) => setFormDataOferta({ ...formDataOferta, tipo_oferta: v, modo_descuento: 'pct' })}
                      options={[
                        { value: 'opcional', label: '➖ OPCIONAL (solo anuncio)' },
                        { value: 'recompensa_opinion', label: '🎁 RECOMPENSA POR OPINIÓN' },
                        { value: 'descuento_todo', label: '🛒 DESCUENTO DE TODOS LOS PRODUCTOS' },
                        { value: 'descuento_streaming', label: '📺 DESCUENTO DE PLATAFORMAS STREAMING' }
                      ]}
                      placeholder="Selecciona tipo"
                      className="w-full"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formDataOferta.posicion === 'inferior' && formDataOferta.tipo_oferta !== 'opcional' && (
                    <div>
                      <label className="block text-xs text-voltech-muted mb-2">
                        {formDataOferta.tipo_oferta === 'recompensa_opinion' ? '🎁 Forma de recompensa' : '💸 Forma de descuento'}
                      </label>
                      <CustomSelect
                        value={formDataOferta.modo_descuento || 'pct'}
                        onChange={(v) => setFormDataOferta({ ...formDataOferta, modo_descuento: v })}
                        options={formDataOferta.tipo_oferta === 'recompensa_opinion' ? [
                          { value: 'pct', label: '💰 % de descuento' },
                          { value: 'monto', label: '💵 Monto fijo ($)' },
                          { value: 'tickets', label: '🎟️ Tickets de sorteo' }
                        ] : [
                          { value: 'pct', label: '💰 % de descuento' },
                          { value: 'monto', label: '💵 Monto fijo ($)' }
                        ]}
                        placeholder="Selecciona forma"
                        className="w-full"
                      />
                    </div>
                  )}
                  {(formDataOferta.modo_descuento || 'pct') === 'pct' && (
                    <div>
                      <label className="block text-xs text-voltech-muted mb-2">💰 Descuento (%)</label>
                      <input type="number" min="0" max="100" value={formDataOferta.descuento_pct} onChange={(e) => setFormDataOferta({ ...formDataOferta, descuento_pct: parseInt(e.target.value) || 0 })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                    </div>
                  )}
                  {(formDataOferta.modo_descuento || 'pct') === 'monto' && (
                    <div>
                      <label className="block text-xs text-voltech-muted mb-2">💵 Monto ($)</label>
                      <input type="number" min="0" step="0.01" value={formDataOferta.monto} onChange={(e) => setFormDataOferta({ ...formDataOferta, monto: parseFloat(e.target.value) || 0 })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                    </div>
                  )}
                  {formDataOferta.tipo_oferta === 'recompensa_opinion' && (formDataOferta.modo_descuento || 'pct') === 'tickets' && (
                    <div>
                      <label className="block text-xs text-voltech-muted mb-2">🎟️ Cantidad de tickets</label>
                      <input type="number" min="1" value={formDataOferta.recompensa_tickets || 2} onChange={(e) => setFormDataOferta({ ...formDataOferta, recompensa_tickets: parseInt(e.target.value) || 2 })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                    </div>
                  )}
                  {formDataOferta.tipo_oferta === 'descuento_categoria' && (
                    <div>
                      <label className="block text-xs text-voltech-muted mb-2">🎯 Categoría</label>
                      <CustomSelect
                        value={formDataOferta.categoria_aplica || ''}
                        onChange={(v) => setFormDataOferta({ ...formDataOferta, categoria_aplica: v })}
                        options={categoriasSistema.map(c => ({ value: c, label: c }))}
                        placeholder="Selecciona categoría"
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs text-voltech-muted mb-2">📅 Fecha Inicio</label>
                    <input type="date" value={formDataOferta.fecha_inicio} onChange={(e) => setFormDataOferta({ ...formDataOferta, fecha_inicio: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-voltech-muted mb-2">⏳ Duración (días)</label>
                    <input type="number" min="1" value={formDataOferta.duracion_dias} onChange={(e) => setFormDataOferta({ ...formDataOferta, duracion_dias: parseInt(e.target.value) || 1 })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-voltech-muted mb-2">📅 Fecha Fin (auto)</label>
                    <input type="date" value={formDataOferta.fecha_fin} readOnly className="input-voltech w-full rounded-lg px-4 py-2 text-sm bg-voltech-dark/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-voltech-muted mb-2">🕐 Hora Inicio</label>
                    <input type="time" value={formDataOferta.hora_inicio} onChange={(e) => setFormDataOferta({ ...formDataOferta, hora_inicio: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-voltech-muted mb-2">🕘 Hora Fin</label>
                    <input type="time" value={formDataOferta.hora_fin} onChange={(e) => setFormDataOferta({ ...formDataOferta, hora_fin: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={guardarOferta} className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {ofertaEditando ? 'Guardar Cambios' : 'Registrar Oferta'}</button>
                  <button onClick={() => { setShowOfertaForm(false); setOfertaEditando(null); resetFormOferta(); }} className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white">Cancelar</button>
                </div>
              </div>
            )}

            <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-voltech-border"><h3 className="text-sm font-bold text-white">Historial de Ofertas</h3></div>

              {/* ✅ Vista Card Móvil (< md) */}
              <div className="block md:hidden space-y-3 p-3">
                {ofertasBanners.length === 0 ? (
                  <div className="bg-voltech-dark/50 border border-voltech-border rounded-2xl p-6 text-center">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-voltech-muted opacity-40" />
                    <p className="text-xs text-voltech-muted">No hay ofertas creadas</p>
                  </div>
                ) : (
                  ofertasBanners.map(o => {
                    const est = estadoOferta(o);
                    return (
                      <div key={o.id} className="bg-voltech-dark/50 border border-voltech-border rounded-2xl p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium text-white flex-1 min-w-0 break-words">{o.texto}</p>
                          <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${est === 'activa' ? 'bg-voltech-success/20 text-voltech-success' : est === 'programada' ? 'bg-voltech-cyan/20 text-voltech-cyan' : 'bg-voltech-error/20 text-voltech-error'}`}>{est}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-voltech-purple/20 text-voltech-purple">
                            {o.tipo_oferta === 'recompensa_opinion' ? '🎁 Opinión' : o.tipo_oferta === 'descuento_categoria' ? '🏷️ Categoría' : o.tipo_oferta === 'descuento_streaming' ? '📺 Streaming' : '🛒 Todo'}
                          </span>
                          {o.descuento_pct > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-voltech-success/20 text-voltech-success">💰 {o.descuento_pct}%</span>}
                          {o.monto > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-voltech-success/20 text-voltech-success">💵 ${o.monto}</span>}
                        </div>
                        <p className="text-[10px] text-voltech-muted">📅 {o.fecha_inicio} → {o.fecha_fin} · 🕐 {o.hora_inicio} a {o.hora_fin}</p>
                        <div className="flex items-center gap-2 pt-2 border-t border-voltech-border/50">
                          <button onClick={() => toggleOferta(o.id)} className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-voltech-muted py-2 rounded-lg bg-voltech-border/50 hover:bg-voltech-border transition-colors">
                            <Eye size={14} /> {o.activo ? 'Desactivar' : 'Activar'}
                          </button>
                          <button onClick={() => { setOfertaEditando(o); setFormDataOferta({ tipo_oferta: o.tipo_oferta || (o.posicion === 'inferior' ? 'recompensa_opinion' : 'opcional'), posicion: o.posicion, texto: o.texto, descuento_pct: o.descuento_pct, monto: o.monto, modo_descuento: o.modo_descuento || (o.tipo_recompensa || 'pct'), recompensa_tickets: o.recompensa_tickets || 2, categoria_aplica: o.categoria_aplica || '', fecha_inicio: o.fecha_inicio, duracion_dias: o.duracion_dias, fecha_fin: o.fecha_fin, hora_inicio: o.hora_inicio, hora_fin: o.hora_fin }); setShowOfertaForm(true); }} className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-voltech-cyan py-2 rounded-lg bg-voltech-cyan/10 border border-voltech-cyan/30 hover:bg-voltech-cyan/20 transition-colors">
                            <Edit3 size={14} /> Editar
                          </button>
                          <button onClick={() => eliminarOferta(o.id)} className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-voltech-error py-2 rounded-lg bg-voltech-error/10 border border-voltech-error/30 hover:bg-voltech-error/20 transition-colors">
                            <Trash2 size={14} /> Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ✅ Vista Tabla Desktop (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-voltech-dark border-b border-voltech-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Texto</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Posición</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Descuento</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Vigencia</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Estado</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ofertasBanners.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-10 text-voltech-muted"><Zap className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>No hay ofertas creadas</p></td></tr>
                    ) : (
                      ofertasBanners.map(o => {
                        const est = estadoOferta(o);
                        return (
                          <tr key={o.id} className="border-b border-voltech-border hover:bg-voltech-border/30">
                            <td className="px-4 py-3 text-sm text-white">{o.texto}</td>
                            <td className="px-4 py-3 text-sm text-voltech-muted">
                              {o.tipo_oferta === 'recompensa_opinion' ? '🎁 Opinión' : o.tipo_oferta === 'descuento_categoria' ? '🏷️ Categoría' : o.tipo_oferta === 'descuento_streaming' ? '📺 Streaming' : '🛒 Todo'}
                            </td>
                            <td className="px-4 py-3 text-sm text-voltech-success">{o.descuento_pct > 0 ? `${o.descuento_pct}%` : o.monto > 0 ? `$${o.monto}` : '—'}</td>
                            <td className="px-4 py-3 text-xs text-voltech-muted">{o.fecha_inicio} → {o.fecha_fin}<br />{o.hora_inicio} a {o.hora_fin}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${est === 'activa' ? 'bg-voltech-success/20 text-voltech-success' : est === 'programada' ? 'bg-voltech-cyan/20 text-voltech-cyan' : 'bg-voltech-error/20 text-voltech-error'}`}>{est}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => toggleOferta(o.id)} className="p-2 hover:bg-voltech-border rounded text-voltech-muted" title="Activar/Desactivar"><Eye className="w-4 h-4" /></button>
                                <button onClick={() => { setOfertaEditando(o); setFormDataOferta({ tipo_oferta: o.tipo_oferta || (o.posicion === 'inferior' ? 'recompensa_opinion' : 'opcional'), posicion: o.posicion, texto: o.texto, descuento_pct: o.descuento_pct, monto: o.monto, modo_descuento: o.modo_descuento || (o.tipo_recompensa || 'pct'), recompensa_tickets: o.recompensa_tickets || 2, categoria_aplica: o.categoria_aplica || '', fecha_inicio: o.fecha_inicio, duracion_dias: o.duracion_dias, fecha_fin: o.fecha_fin, hora_inicio: o.hora_inicio, hora_fin: o.hora_fin }); setShowOfertaForm(true); }} className="p-2 hover:bg-voltech-border rounded text-voltech-cyan" title="Editar"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => eliminarOferta(o.id)} className="p-2 hover:bg-voltech-border rounded text-voltech-error" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'terminos' && (
          <div className="space-y-6">
            {/* 📦 TÉRMINOS GENERALES (FÍSICOS Y KITS) */}
            <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-voltech-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-voltech-cyan/20"><Store className="w-4 h-4 text-voltech-cyan" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-white">📦 Términos Generales</h3>
                    <p className="text-xs text-voltech-muted">Para productos físicos y kits · Se muestra en el carrito al finalizar pedido</p>
                  </div>
                </div>
                <button onClick={() => setMostrarTerminos(!mostrarTerminos)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-cyan">
                  {mostrarTerminos ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mostrarTerminos ? (
                <textarea value={settings.politicas.terminos} onChange={(e) => updateSetting('politicas', 'terminos', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm min-h-[220px] font-mono" />
              ) : (
                <div className="p-4 bg-voltech-dark/50 border border-voltech-border rounded-lg max-h-[220px] overflow-y-auto"><p className="text-xs text-voltech-muted font-mono whitespace-pre-wrap">{settings.politicas.terminos}</p></div>
              )}
            </div>

            {/* 📺 TÉRMINOS STREAMING (DIGITALES) */}
            <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-voltech-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-voltech-purple/20"><Store className="w-4 h-4 text-voltech-purple" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-white">📺 Términos Streaming</h3>
                    <p className="text-xs text-voltech-muted">Para plataformas digitales · Se muestra en el carrito cuando solo hay streaming</p>
                  </div>
                </div>
                <button onClick={() => setMostrarTerminosStreaming(!mostrarTerminosStreaming)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-purple">
                  {mostrarTerminosStreaming ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mostrarTerminosStreaming ? (
                <textarea value={settings.politicas.terminos_streaming || ''} onChange={(e) => updateSetting('politicas', 'terminos_streaming', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm min-h-[220px] font-mono" placeholder="Escribe aquí los términos para productos streaming..." />
              ) : (
                <div className="p-4 bg-voltech-dark/50 border border-voltech-border rounded-lg max-h-[220px] overflow-y-auto"><p className="text-xs text-voltech-muted font-mono whitespace-pre-wrap">{settings.politicas.terminos_streaming || 'Aún no hay términos streaming configurados.'}</p></div>
              )}
            </div>

            {/* 🔒 POLÍTICA DE PRIVACIDAD */}
            <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">🔒 Política de Privacidad</h3>
              <textarea value={settings.politicas.privacidad} onChange={(e) => updateSetting('politicas', 'privacidad', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm min-h-[100px]" />
            </div>
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><WhatsAppIcon className="w-5 h-5 text-[#25D366]" /> Plantilla de Compra (botón WhatsApp del catálogo)</h3>
            <p className="text-xs text-voltech-muted">Edita el mensaje que recibe el cliente al pulsar "WhatsApp" en un producto. Variables: <code className="text-voltech-cyan">[Producto]</code> <code className="text-voltech-cyan">[Precio]</code> <code className="text-voltech-cyan">[Bs]</code> <code className="text-voltech-cyan">[Url]</code></p>
            <textarea value={plantillaActual} onChange={(e) => updateSetting('whatsapp', 'plantilla_compra', e.target.value)} rows={6} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" />
            <div>
              <CustomSelect
                label="✍️ Cierre del mensaje"
                value={cierreCompra}
                onChange={(v) => updateSetting('whatsapp', 'cierre_compra', v)}
                options={[
                  { value: 'Quiero comprar ✅', label: 'Quiero comprar ✅' },
                  { value: 'Quiero más información 🙋', label: 'Quiero más información 🙋' },
                  { value: 'Quiero aprovechar la oferta 🔥', label: 'Quiero aprovechar la oferta 🔥' }
                ]}
                placeholder="Selecciona cierre"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-voltech-muted mb-2">👁️ Vista previa del mensaje</label>
              <BurbujaWA texto={previewMensaje} nombre="Cliente" />
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-voltech-dark/50 border border-voltech-border rounded-lg">
                <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2"><Download className="w-4 h-4 text-voltech-cyan" /> Exportar datos</h4>
                <p className="text-xs text-voltech-muted mb-4">Copia de seguridad en JSON.</p>
                <button onClick={handleExport} className="w-full py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Exportar a JSON</button>
              </div>
              <div className="p-4 bg-voltech-dark/50 border border-voltech-border rounded-lg">
                <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2"><Upload className="w-4 h-4 text-voltech-purple" /> Importar datos</h4>
                <p className="text-xs text-voltech-muted mb-4">Restaura desde un backup.</p>
                <label className="w-full py-2 bg-voltech-purple/20 text-voltech-purple rounded-lg text-sm hover:bg-voltech-purple/30 flex items-center justify-center gap-2 cursor-pointer"><Upload className="w-4 h-4" /> Importar desde JSON<input type="file" accept=".json" onChange={handleImport} className="hidden" /></label>
              </div>
            </div>
          </div>
        )}
      </div>

      {showScrollTop && (<button onClick={scrollToTop} className="fixed bottom-6 right-6 p-3 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-full shadow-lg z-50" title="Volver arriba"><ArrowUp className="w-5 h-5" /></button>)}
    </div>
  );
}