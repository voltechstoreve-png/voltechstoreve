// hooks/useVoltech.js
import { useState, useEffect } from 'react';
// ✅ Helper: guarda en localStorage solo si hay espacio disponible
const setLocalSafe = (clave, valor) => {
  try {
    localStorage.setItem(clave, valor);
  } catch (e) {
    console.warn('⚠️ localStorage lleno, se omite caché de', clave);
  }
};

// 1. Hook para Productos
export function useProductos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductos = async () => {
      if (supabase) {
        // ✅ QUITADO: categoria_promo (no existe en la tabla)
        // ✅ QUITADO: .eq('publicado', true) para no filtrar productos con null
        const { data, error } = await supabase
          .from('productos')
          .select('id, tipo, disponibilidad, sku, fecha, fechaCreacion, creado_en, plataforma, producto, categoria, marca, modelo, variante, potencia, cantidad, descripcion, descripcion_detallada, duracion, estado, publicado, porcentaje_comision, productos_kit, precio_costo_total, precio_individual_total, esCombo, plataformasCombo, especificaciones, colores, caracteristicas, precioMayor, preciomayor, precioDetal, preciodetal, precioBs, preciobs, precioOferta, precio_oferta, tipoOferta, proveedor, comprador, imagen, precios_proveedor')
          .order('creado_en', { ascending: false });

        if (error) {
          console.error('❌ ERROR SUPABASE:', error.message);
        }

        if (!error && data) {
          // Filtrar solo los que NO sean explícitamente false (incluye null y true)
          const visibles = data.filter(p => p.publicado !== false);
          setProductos(visibles);
          setLocalSafe('voltech_productos', JSON.stringify(visibles));
        } else {
          const cached = localStorage.getItem('voltech_productos');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              setProductos(Array.isArray(parsed) ? parsed.filter(p => p.publicado !== false) : []);
            } catch (e) {}
          }
        }
      } else {
        const cached = localStorage.getItem('voltech_productos');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setProductos(Array.isArray(parsed) ? parsed.filter(p => p.publicado !== false) : []);
          } catch (e) {}
        }
      }
      setLoading(false);
    };
    fetchProductos();
  }, []);

  return { productos, loading };
}

// 2. Hook para Configuración (Settings)
export function useSettings() {
  const [settings, setSettings] = useState({
    tienda: {
      nombre: 'VOLTECH STORE.VE',
      email: '',
      telefono: '',
      direccion: '',
      instagramUrl: '',
      facebookUrl: '',
      tiktokUrl: '',
      whatsappUrl: '',
      logo: ''
    },
    pagos: {},
    carteras: [],
    envios: {
      puntosEntrega: [],
      deliveryGratisDesde: 0,
      costoEnvioNacional: 0,
      montoMinimoEnvioGratis: 0,
      descripcionEnvioNacional: '',
      tiempo: '',
      notas: ''
    },
    politicas: {
      terminos: '',
      terminos_streaming: '',
      privacidad: ''
    },
    colores: {
      primario: '#22d3ee',
      secundario: '#a855f7',
      acento: '#3b82f6',
      fondo: '#0a0a0f',
      texto: '#ffffff',
      difuminado: 'horizontal'
    },
    whatsapp: {
      plantilla_compra: '',
      cierre_compra: 'Quiero comprar ✅'
    },
    oferta_relampago: {
      activo: false,
      texto: '',
      descuento_pct: 0,
      duracion_horas: 2,
      inicio: '',
      fin: ''
    },
    oferta_inferior: {
      activo: false,
      texto: '',
      descuento_pct: 0
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      let settingsObj = null;
      
      if (supabase) {
        const { data, error } = await supabase.from('settings').select('clave, valor');
        if (!error && data && data.length > 0) {
          settingsObj = {};
          data.forEach(item => { settingsObj[item.clave] = item.valor; });
          setLocalSafe('voltech_settings', JSON.stringify(settingsObj));
        }
      }
      
      if (!settingsObj) {
        const cached = localStorage.getItem('voltech_settings');
        if (cached) settingsObj = JSON.parse(cached);
      }
      
      if (settingsObj) {
        setSettings(prev => ({
          ...prev,
          tienda: { ...prev.tienda, ...settingsObj.tienda },
          pagos: { ...prev.pagos, ...(settingsObj.pagos || {}) },
          carteras: settingsObj.carteras || prev.carteras,
          envios: { ...prev.envios, ...(settingsObj.envios || {}) },
          politicas: { ...prev.politicas, ...(settingsObj.politicas || {}) },
          colores: { ...prev.colores, ...(settingsObj.colores || {}) },
          whatsapp: { ...prev.whatsapp, ...(settingsObj.whatsapp || {}) },
          oferta_relampago: { ...prev.oferta_relampago, ...(settingsObj.oferta_relampago || {}) },
          oferta_inferior: { ...prev.oferta_inferior, ...(settingsObj.oferta_inferior || {}) }
        }));
      }
    };
    fetchSettings();
  }, []);

  return { settings };
}

// 3. Hook para Tasa BCV
export function useTasaBCV() {
  const [tasa, setTasa] = useState(36.5);
  useEffect(() => {
    const cached = localStorage.getItem('voltech_tasa_bcv');
    if (cached) setTasa(JSON.parse(cached).tasa || 36.5);
  }, []);
  const updateTasa = (nuevaTasa) => {
    setTasa(nuevaTasa);
    setLocalSafe('voltech_tasa_bcv', JSON.stringify({ tasa: nuevaTasa }));
  };
  return { tasa, setTasa: updateTasa };
}

// 4. Hook para Usuario Logueado
export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    const userLogged = getUser(); // ✅ Detecta app vs navegador automáticamente
    if (userLogged) setCurrentUser(userLogged);
  }, []);
  return { currentUser, setCurrentUser };
}