'use client';


import { useState, useEffect } from 'react';
import { 
  Store, 
  CreditCard, 
  Truck, 
  FileText, 
  Database, 
  Save, 
  Download, 
  Upload,
  Plus,
  Trash2,
  MapPin,
  Eye,
  EyeOff,
  ChevronDown,
  ArrowUp,
  Info
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function AjustesPage() {
  const [settings, setSettings] = useState({
    tienda: {
      nombre: 'VOLTECH STORE',
      email: 'voltechstore.ve@gmail.com',
      telefono: '0412-1234567',
      direccion: 'Caracas, Venezuela',
      instagramUrl: 'https://instagram.com/voltechstore',
      facebookUrl: 'https://facebook.com/voltechstore',
      tiktokUrl: 'https://tiktok.com/@voltechstore',
      whatsappUrl: 'https://wa.me/584121234567',
    },
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
    envios: {
      puntosEntrega: ['Plaza Venezuela', 'Sambil Chacao', 'CC Ciudad Caracas', 'Metro Los Símbolos'],
      deliveryGratisDesde: 5.00,
      costoEnvioNacional: 3.00,
      montoMinimoEnvioGratis: 50.00,
      descripcionEnvioNacional: 'Envíos menores a $50: cobro a destino',
      tipo: 'nacional',
      empresas: ['MRW', 'Tealca', 'Zoom', 'Domesa'],
      tiempo: '24-48 horas',
      notas: 'Los envíos se realizan de lunes a viernes',
    },
    politicas: {
      terminos: '1. POLÍTICA DE PAGO ANTICIPADO: Para garantizar la disponibilidad de inventario y el procesamiento logístico con nuestros proveedores, todo despacho se gestionará exclusivamente previa recepción y conciliación del pago total.\n2. PRESENTACIÓN: Es obligatorio presentar este comprobante para cualquier reclamo.\n3. TIEMPO DE GARANTÍA: El producto tiene una garantía de 3 días continuos.\n4. EXCLUSIONES: No cubre daños físicos, humedad, sobrecargas o sellos removidos.\n5. EMPAQUE: Es obligatorio conservar la caja y accesorios originales en buen estado.\n6. GESTIÓN DE CAMBIOS: Sujeto a revisión técnica(24-48h). Es condición indispensable la entrega del producto defectuoso en su empaque original; no se entregará un reemplazo sin la verificación previa del equipo anterior.\n7. REEMBOLSOS Y CONFORMIDAD: Al recibir, el cliente acepta el estado del producto. Bajo ninguna circunstancia se realizará la devolución de dinero; se procederá exclusivamente al cambio por un producto igual o de similares características.',
      privacidad: 'Tus datos están protegidos y no serán compartidos con terceros.',
    }
  });

  const [nuevoPunto, setNuevoPunto] = useState('');
  const [nuevoMetodo, setNuevoMetodo] = useState('');
  const [nuevaCartera, setNuevaCartera] = useState('');
  const [mostrarTerminos, setMostrarTerminos] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Estados para secciones colapsables
  const [expandedSections, setExpandedSections] = useState({
    datosTienda: true,
    envios: true,
    metodosPago: false,
    carteras: false,
    terminos: true,
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('voltech_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(prev => {
        const merged = {
          ...prev,
          tienda: { ...prev.tienda, ...parsed.tienda },
          envios: { ...prev.envios, ...parsed.envios },
          politicas: { ...prev.politicas, ...parsed.politicas },
        };
        
        if (parsed.pagos) {
          const migratedPagos = {};
          Object.entries(parsed.pagos).forEach(([key, value]) => {
            if (typeof value === 'boolean') {
              migratedPagos[key] = { 
                activo: value, 
                publico: value,
                nombre: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
              };
            } else {
              migratedPagos[key] = {
                activo: value.activo ?? true,
                publico: value.publico ?? true,
                nombre: value.nombre || key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
              };
            }
          });
          merged.pagos = migratedPagos;
        }
        
        if (parsed.carteras) {
          merged.carteras = parsed.carteras;
        }
        
        return merged;
      });
    }
    
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSave = () => {
    localStorage.setItem('voltech_settings', JSON.stringify(settings));
    toast.success('Ajustes guardados correctamente');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = () => {
    const data = {
      productos: localStorage.getItem('voltech_productos'),
      equipo: localStorage.getItem('voltech_equipo'),
      carteras: localStorage.getItem('voltech_carteras'),
      settings: localStorage.getItem('voltech_settings'),
      fecha: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voltech_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup exportado correctamente');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.productos) localStorage.setItem('voltech_productos', data.productos);
        if (data.equipo) localStorage.setItem('voltech_equipo', data.equipo);
        if (data.carteras) localStorage.setItem('voltech_carteras', data.carteras);
        if (data.settings) {
          localStorage.setItem('voltech_settings', data.settings);
          setSettings(prev => ({ ...prev, ...JSON.parse(data.settings) }));
        }
        toast.success('Datos importados correctamente. Recarga la página.');
      } catch (error) {
        toast.error('Error al leer el archivo de backup');
      }
    };
    reader.readAsText(file);
  };

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value }
    }));
  };

  const agregarPuntoEntrega = () => {
    if (!nuevoPunto.trim()) return;
    if (settings.envios.puntosEntrega.includes(nuevoPunto)) {
      toast.error('Este punto ya existe');
      return;
    }
    setSettings(prev => ({
      ...prev,
      envios: { ...prev.envios, puntosEntrega: [...prev.envios.puntosEntrega, nuevoPunto] }
    }));
    setNuevoPunto('');
    toast.success('Punto de entrega agregado');
  };

  const eliminarPuntoEntrega = (index) => {
    setSettings(prev => ({
      ...prev,
      envios: { ...prev.envios, puntosEntrega: prev.envios.puntosEntrega.filter((_, i) => i !== index) }
    }));
    toast.success('Punto eliminado');
  };

  const agregarMetodoPago = () => {
    if (!nuevoMetodo.trim()) return;
    const id = nuevoMetodo.toLowerCase().replace(/\s+/g, '_');
    if (Object.keys(settings.pagos).includes(id)) {
      toast.error('Este método ya existe');
      return;
    }
    
    setSettings(prev => ({
      ...prev,
      pagos: {
        ...prev.pagos,
        [id]: { 
          activo: true, 
          publico: true,
          nombre: nuevoMetodo 
        }
      }
    }));
    setNuevoMetodo('');
    toast.success('Método de pago agregado');
  };

  const eliminarMetodoPago = (id) => {
    setSettings(prev => {
      const { [id]: _, ...rest } = prev.pagos;
      return { ...prev, pagos: rest };
    });
    toast.success('Método eliminado');
  };

  const actualizarMetodoPago = (id, campo, valor) => {
    setSettings(prev => ({
      ...prev,
      pagos: {
        ...prev.pagos,
        [id]: {
          ...prev.pagos[id],
          [campo]: valor
        }
      }
    }));
  };

  const agregarCartera = () => {
    if (!nuevaCartera.trim()) return;
    if (settings.carteras.some(c => c.nombre === nuevaCartera)) {
      toast.error('Esta cartera ya existe');
      return;
    }
    
    const id = nuevaCartera.toLowerCase().replace(/\s+/g, '_');
    setSettings(prev => ({
      ...prev,
      carteras: [
        ...prev.carteras,
        { id, nombre: nuevaCartera, activo: true }
      ]
    }));
    setNuevaCartera('');
    toast.success('Cartera agregada');
  };

  const eliminarCartera = (id) => {
    setSettings(prev => ({
      ...prev,
      carteras: prev.carteras.filter(c => c.id !== id)
    }));
    toast.success('Cartera eliminada');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
          <h1 className="text-2xl font-bold text-white">Ajustes</h1>
          <p className="text-sm text-voltech-muted mt-1">Configura tu tienda y preferencias</p>
        </div>
        <button onClick={() => { handleSave(); scrollToTop(); }} className="px-4 py-2 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center gap-2">
          <Save className="w-4 h-4" /> Guardar Cambios
        </button>
      </div>

      {/* Datos de la Tienda - COLAPSABLE */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <button 
          onClick={() => toggleSection('datosTienda')}
          className="w-full flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-voltech-cyan/20"><Store className="w-5 h-5 text-voltech-cyan" /></div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white">Datos de la Tienda</h3>
              <p className="text-xs text-voltech-muted">Información pública de tu negocio</p>
            </div>
          </div>
          <div className={`p-2 rounded-lg transition-transform ${expandedSections.datosTienda ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-voltech-muted" />
          </div>
        </button>
        
        {expandedSections.datosTienda && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
            <div>
              <label className="block text-xs text-voltech-muted mb-2 ml-1">Nombre de la tienda</label>
              <input type="text" value={settings.tienda.nombre} onChange={(e) => updateSetting('tienda', 'nombre', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-voltech-muted mb-2 ml-1">Correo electrónico</label>
              <input type="email" value={settings.tienda.email} onChange={(e) => updateSetting('tienda', 'email', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-voltech-muted mb-2 ml-1">Teléfono de contacto</label>
              <input type="text" value={settings.tienda.telefono} onChange={(e) => updateSetting('tienda', 'telefono', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-voltech-muted mb-2 ml-1">Dirección general</label>
              <input type="text" value={settings.tienda.direccion} onChange={(e) => updateSetting('tienda', 'direccion', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-voltech-muted mb-2 ml-1">Instagram (URL completa)</label>
              <input type="url" value={settings.tienda.instagramUrl} onChange={(e) => updateSetting('tienda', 'instagramUrl', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" placeholder="https://instagram.com/..." />
            </div>
            <div>
              <label className="block text-xs text-voltech-muted mb-2 ml-1">TikTok (URL completa)</label>
              <input type="url" value={settings.tienda.tiktokUrl} onChange={(e) => updateSetting('tienda', 'tiktokUrl', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" placeholder="https://tiktok.com/@..." />
            </div>
            <div>
              <label className="block text-xs text-voltech-muted mb-2 ml-1">Facebook (URL completa)</label>
              <input type="url" value={settings.tienda.facebookUrl} onChange={(e) => updateSetting('tienda', 'facebookUrl', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" placeholder="https://facebook.com/..." />
            </div>
            <div>
              <label className="block text-xs text-voltech-muted mb-2 ml-1">WhatsApp (URL completa)</label>
              <input type="url" value={settings.tienda.whatsappUrl} onChange={(e) => updateSetting('tienda', 'whatsappUrl', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" placeholder="https://wa.me/58..." />
            </div>
          </div>
        )}
      </div>

      {/* Envíos y Entregas - COLAPSABLE */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <button 
          onClick={() => toggleSection('envios')}
          className="w-full flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-voltech-warning/20"><Truck className="w-5 h-5 text-voltech-warning" /></div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white">Envíos y Entregas</h3>
              <p className="text-xs text-voltech-muted">Configura las opciones de entrega</p>
            </div>
          </div>
          <div className={`p-2 rounded-lg transition-transform ${expandedSections.envios ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-voltech-muted" />
          </div>
        </button>
        
        {expandedSections.envios && (
          <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
            {/* Puntos de entrega */}
            <div>
              <label className="block text-xs text-voltech-muted mb-2">Puntos de entrega en Caracas</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {settings.envios.puntosEntrega.map((punto, index) => (
                  <span key={index} className="inline-flex items-center gap-2 bg-voltech-dark/50 border border-voltech-border px-3 py-1.5 rounded-lg text-sm text-white">
                    <MapPin className="w-3 h-3 text-voltech-cyan" />
                    {punto}
                    <button onClick={() => eliminarPuntoEntrega(index)} className="text-voltech-error hover:text-voltech-error/70"><Trash2 className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevoPunto}
                  onChange={(e) => setNuevoPunto(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && agregarPuntoEntrega()}
                  className="input-voltech flex-1 rounded-lg px-4 py-2 text-sm"
                  placeholder="Ej: Plaza Venezuela, Sambil Chacao..."
                />
                <button onClick={agregarPuntoEntrega} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg hover:bg-voltech-cyan/30 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </div>
            </div>

            {/* Entrega Local (Caracas) */}
            <div className="p-4 bg-voltech-cyan/5 border border-voltech-cyan/20 rounded-lg">
              <h4 className="text-sm font-semibold text-voltech-cyan mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Entrega Local (Caracas)
              </h4>
              <div>
                <label className="block text-xs text-voltech-muted mb-2">Delivery GRATIS a partir de ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.envios.deliveryGratisDesde}
                  onChange={(e) => updateSetting('envios', 'deliveryGratisDesde', parseFloat(e.target.value) || 0)}
                  className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                />
                <p className="text-xs text-voltech-muted mt-1">El cliente no paga delivery local si su compra supera este monto.</p>
              </div>
            </div>

            {/* Envío Nacional */}
            <div className="p-4 bg-voltech-purple/5 border border-voltech-purple/20 rounded-lg">
              <h4 className="text-sm font-semibold text-voltech-purple mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Envío Nacional (Resto de Venezuela)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-voltech-muted mb-2">Costo de envío nacional ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.envios.costoEnvioNacional}
                    onChange={(e) => updateSetting('envios', 'costoEnvioNacional', parseFloat(e.target.value) || 0)}
                    className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                  />
                  <p className="text-xs text-voltech-muted mt-1">Costo fijo a cualquier destino en Venezuela.</p>
                </div>
                <div>
                  <label className="block text-xs text-voltech-muted mb-2">Envío nacional GRATIS si supera ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.envios.montoMinimoEnvioGratis || 50}
                    onChange={(e) => updateSetting('envios', 'montoMinimoEnvioGratis', parseFloat(e.target.value) || 0)}
                    className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                  />
                  <p className="text-xs text-voltech-muted mt-1">Si la compra nacional supera este monto, el envío será GRATIS.</p>
                </div>
              </div>
              
              {/* ✅ NUEVO: Descripción editable del envío nacional */}
              <div>
                <label className="block text-xs text-voltech-muted mb-2">Descripción del envío nacional</label>
                <input
                  type="text"
                  value={settings.envios.descripcionEnvioNacional || 'Envíos menores a $50: cobro a destino'}
                  onChange={(e) => updateSetting('envios', 'descripcionEnvioNacional', e.target.value)}
                  className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                  placeholder="Ej: Envíos menores a $50: cobro a destino"
                />
                <p className="text-xs text-voltech-muted mt-1">Este texto aparecerá en el comprobante de venta y en la tienda pública.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-voltech-muted mb-2">Tiempo estimado</label>
                <input type="text" value={settings.envios.tiempo} onChange={(e) => updateSetting('envios', 'tiempo', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-voltech-muted mb-2">Notas adicionales</label>
                <input type="text" value={settings.envios.notas} onChange={(e) => updateSetting('envios', 'notas', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Métodos de Pago - COLAPSABLE */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <button 
          onClick={() => toggleSection('metodosPago')}
          className="w-full flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-voltech-purple/20"><CreditCard className="w-5 h-5 text-voltech-purple" /></div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white">Métodos de Pago</h3>
              <p className="text-xs text-voltech-muted">Selecciona y configura los métodos que aceptas</p>
            </div>
          </div>
          <div className={`p-2 rounded-lg transition-transform ${expandedSections.metodosPago ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-voltech-muted" />
          </div>
        </button>
        
        {expandedSections.metodosPago && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex gap-2 mb-4">
              <input type="text" value={nuevoMetodo} onChange={(e) => setNuevoMetodo(e.target.value)} className="input-voltech flex-1 rounded-lg px-4 py-2 text-sm" placeholder="Ej: Zelle, PayPal" />
              <button onClick={agregarMetodoPago} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg hover:bg-voltech-cyan/30 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(settings.pagos).map(([key, method]) => (
                <div key={key} className="p-4 rounded-lg bg-voltech-dark/50 border border-voltech-border hover:border-voltech-purple/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-white">{method.nombre || key}</p>
                      <p className="text-xs text-voltech-muted">Configuración de método de pago</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-voltech-muted">Público</span>
                        <input 
                          type="checkbox" 
                          checked={method.publico} 
                          onChange={(e) => actualizarMetodoPago(key, 'publico', e.target.checked)}
                          className="w-4 h-4 rounded border-voltech-border bg-voltech-dark text-voltech-purple"
                        />
                      </label>
                      <button onClick={() => eliminarMetodoPago(key)} className="text-voltech-error hover:text-voltech-error/70">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1">Activo</label>
                      <input 
                        type="checkbox" 
                        checked={method.activo} 
                        onChange={(e) => actualizarMetodoPago(key, 'activo', e.target.checked)}
                        className="w-5 h-5 rounded border-voltech-border bg-voltech-dark text-voltech-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1">Nombre</label>
                      <input 
                        type="text" 
                        value={method.nombre || key}
                        onChange={(e) => actualizarMetodoPago(key, 'nombre', e.target.value)}
                        className="input-voltech w-full rounded-lg px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gestión de Carteras - COLAPSABLE */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <button 
          onClick={() => toggleSection('carteras')}
          className="w-full flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-voltech-success/20"><FileText className="w-5 h-5 text-voltech-success" /></div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white">Gestión de Carteras</h3>
              <p className="text-xs text-voltech-muted">Administra las carteras para registrar ingresos</p>
            </div>
          </div>
          <div className={`p-2 rounded-lg transition-transform ${expandedSections.carteras ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-voltech-muted" />
          </div>
        </button>
        
        {expandedSections.carteras && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex gap-2 mb-4">
              <input type="text" value={nuevaCartera} onChange={(e) => setNuevaCartera(e.target.value)} className="input-voltech flex-1 rounded-lg px-4 py-2 text-sm" placeholder="Ej: Banco de Venezuela, Binance Wallet 2" />
              <button onClick={agregarCartera} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg hover:bg-voltech-cyan/30 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {settings.carteras.map((cartera) => (
                <div key={cartera.id} className="p-4 rounded-lg bg-voltech-dark/50 border border-voltech-border hover:border-voltech-purple/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-white">{cartera.nombre}</p>
                      <p className="text-xs text-voltech-muted">Cartera para registrar ingresos</p>
                    </div>
                    <button onClick={() => eliminarCartera(cartera.id)} className="text-voltech-error hover:text-voltech-error/70">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1">Activa</label>
                      <input 
                        type="checkbox" 
                        checked={cartera.activo} 
                        onChange={(e) => {
                          const updated = settings.carteras.map(c => 
                            c.id === cartera.id ? { ...c, activo: e.target.checked } : c
                          );
                          setSettings(prev => ({ ...prev, carteras: updated }));
                        }}
                        className="w-5 h-5 rounded border-voltech-border bg-voltech-dark text-voltech-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1">Nombre</label>
                      <input 
                        type="text" 
                        value={cartera.nombre}
                        onChange={(e) => {
                          const updated = settings.carteras.map(c => 
                            c.id === cartera.id ? { ...c, nombre: e.target.value } : c
                          );
                          setSettings(prev => ({ ...prev, carteras: updated }));
                        }}
                        className="input-voltech w-full rounded-lg px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Términos y Condiciones - COLAPSABLE */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <button 
          onClick={() => toggleSection('terminos')}
          className="w-full flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-voltech-cyan/20"><FileText className="w-5 h-5 text-voltech-cyan" /></div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white">Términos y Condiciones</h3>
              <p className="text-xs text-voltech-muted">Configura los términos que aparecen en el comprobante de venta</p>
            </div>
          </div>
          <div className={`p-2 rounded-lg transition-transform ${expandedSections.terminos ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-voltech-muted" />
          </div>
        </button>
        
        {expandedSections.terminos && (
          <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-voltech-muted">Editar términos:</label>
              <button onClick={() => setMostrarTerminos(!mostrarTerminos)} className="text-voltech-cyan hover:text-voltech-cyan/70">
                {mostrarTerminos ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-xs text-voltech-muted mb-2">Ejemplo de formato:</p>
              <div className="p-3 bg-voltech-dark/50 border border-voltech-border rounded-lg text-xs text-voltech-muted font-mono">
                1. POLÍTICA DE PAGO ANTICIPADO: Para garantizar la disponibilidad de inventario...
                <br />
                2. PRESENTACIÓN: Es obligatorio presentar este comprobante para cualquier reclamo.
                <br />
                3. TIEMPO DE GARANTÍA: El producto tiene una garantía de 3 días continuos.
                <br />
                4. EXCLUSIONES: No cubre daños físicos, humedad, sobrecargas o sellos removidos.
                <br />
                5. EMPAQUE: Es obligatorio conservar la caja y accesorios originales en buen estado.
                <br />
                6. GESTIÓN DE CAMBIOS: Sujeto a revisión técnica(24-48h). Es condición indispensable...
                <br />
                7. REEMBOLSOS Y CONFORMIDAD: Al recibir, el cliente acepta el estado del producto...
              </div>
            </div>
            
            {mostrarTerminos ? (
              <textarea
                value={settings.politicas.terminos}
                onChange={(e) => updateSetting('politicas', 'terminos', e.target.value)}
                className="input-voltech w-full rounded-lg px-4 py-3 text-sm min-h-[200px]"
                placeholder="Escribe los términos y condiciones que aparecerán en los comprobantes de venta..."
              />
            ) : (
              <div className="p-4 bg-voltech-dark/50 border border-voltech-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-voltech-cyan" />
                  <p className="text-xs text-voltech-muted">Los términos y condiciones están ocultos. Haz clic en el ojo para editarlos.</p>
                </div>
                <p className="text-xs text-voltech-muted font-mono whitespace-pre-wrap">{settings.politicas.terminos}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Backup y Datos */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-voltech-cyan/20"><Database className="w-5 h-5 text-voltech-cyan" /></div>
          <div>
            <h3 className="text-lg font-bold text-white">Backup y Datos</h3>
            <p className="text-xs text-voltech-muted">Exporta o restaura la información de tu tienda</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-voltech-dark/50 border border-voltech-border rounded-lg">
            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2"><Download className="w-4 h-4 text-voltech-cyan" /> Exportar datos</h4>
            <p className="text-xs text-voltech-muted mb-4">Descarga una copia de seguridad de todos tus datos en formato JSON.</p>
            <button onClick={handleExport} className="w-full py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Exportar a JSON
            </button>
          </div>
          <div className="p-4 bg-voltech-dark/50 border border-voltech-border rounded-lg">
            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2"><Upload className="w-4 h-4 text-voltech-purple" /> Importar datos</h4>
            <p className="text-xs text-voltech-muted mb-4">Restaura datos desde un archivo de backup previamente exportado.</p>
            <label className="w-full py-2 bg-voltech-purple/20 text-voltech-purple rounded-lg text-sm hover:bg-voltech-purple/30 transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" /> Importar desde JSON
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Botón Volver Arriba */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-full shadow-lg hover:shadow-xl transition-all z-50"
          title="Volver arriba"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}