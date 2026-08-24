'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/app/context/PermissionsContext';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import {
  Store, CreditCard, Truck, FileText, Database, Save, Download, Upload,
  Plus, Trash2, MapPin, Eye, EyeOff, ArrowUp, Info,
  Image as ImageIcon, Palette, AlertCircle, Sparkles, Wallet
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
    tienda: { nombre: 'VOLTECH STORE', email: 'voltechstore.ve@gmail.com', telefono: '0412-1234567', direccion: 'Caracas, Venezuela', instagramUrl: 'https://instagram.com/voltechstore', facebookUrl: 'https://facebook.com/voltechstore', tiktokUrl: 'https://tiktok.com/@voltechstore', whatsappUrl: 'https://wa.me/584121234567', logo: '' },
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
          return merged;
        });
      }
    };
    cargarAjustes();
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
                  <label className="block text-xs text-voltech-muted mb-2">Tipo de Difuminado</label>
                  <select value={settings.colores.difuminado} onChange={(e) => updateColor('difuminado', e.target.value)} className="input-voltech w-full rounded-lg px-3 py-2 text-sm">
                    <option value="horizontal">↔️ Horizontal</option><option value="vertical">↕️ Vertical</option><option value="diagonal">↗️ Diagonal</option><option value="radial">⭕ Radial</option><option value="none">❌ Sólido</option>
                  </select>
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
              <label className="block text-xs text-voltech-muted mb-1">✍️ Cierre del mensaje</label>
              <select value={cierreCompra} onChange={(e) => updateSetting('whatsapp', 'cierre_compra', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                <option value="Quiero comprar ✅">Quiero comprar ✅</option>
                <option value="Quiero más información 🙋">Quiero más información 🙋</option>
                <option value="Quiero aprovechar la oferta 🔥">Quiero aprovechar la oferta 🔥</option>
              </select>
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