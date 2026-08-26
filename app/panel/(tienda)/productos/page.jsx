  'use client';

  import { useState, useEffect, useMemo, useRef, Fragment } from 'react';
  import Link from 'next/link';
  import { supabase } from '@/lib/supabase';
  import { usePermissions } from '@/app/context/PermissionsContext';
 import { 
  Plus, Search, Edit, Trash2, X, Package, DollarSign, TrendingUp,
  AlertTriangle, CheckCircle, Image as ImageIcon, Save, Minus,
  Upload, Eye, EyeOff, Globe, LayoutGrid, Table, Download,
  Database, MonitorPlay, Tag, Layers, Calendar, Percent, Gift,
  ChevronDown, MoreVertical, Filter, ShoppingCart
} from 'lucide-react';
  import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

  // ✅ COMPONENTE CUSTOM SELECT UNIFICADO CON PALETA VOLTECH
  const CustomSelect = ({ label, value, onChange, options, placeholder = '-- Selecciona --', disabled = false, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (ref.current && !ref.current.contains(e.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
      <div className={`relative min-w-0 ${className}`} ref={ref}>
        {label && <label className="block text-xs text-voltech-muted mb-1 ml-1">{label}</label>}
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full min-w-0 bg-voltech-dark border border-voltech-cyan/30 rounded-md px-3 md:px-4 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-voltech-cyan'
          }`}
        >
          <span className={`${selectedOption ? 'text-white' : 'text-voltech-muted'} truncate flex-1 min-w-0`}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-voltech-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        
        {isOpen && !disabled && (
          <div className="absolute top-full left-0 w-full mt-1 bg-voltech-dark border border-voltech-cyan/30 rounded-md z-50 max-h-60 overflow-y-auto shadow-xl">
            {options.length === 0 ? (
              <div className="px-4 py-2 text-sm text-voltech-muted">No hay opciones disponibles</div>
            ) : (
              options.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => { 
                    onChange(opt.value); 
                    setIsOpen(false); 
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                    value === opt.value 
                      ? 'bg-voltech-purple text-white' 
                      : 'bg-voltech-surface text-white hover:bg-voltech-purple'
                  }`}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  const normalizarTexto = (texto) => {
    if (!texto) return '';
    return texto.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  };

  export default function ProductosPage() {
    const { tienePermiso } = usePermissions();
    
    const [productos, setProductos] = useState([]);
    const [carteras, setCarteras] = useState([]);
    const [equipo, setEquipo] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [metodosPago, setMetodosPago] = useState([]);
    const [usuarioActual, setUsuarioActual] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [vista, setVista] = useState('tabla');
    const [searchTerm, setSearchTerm] = useState('');
    const [tasaBCV, setTasaBCV] = useState(36.50);
    const [usarTasaBCV, setUsarTasaBCV] = useState(true);
    const [tasaPersonalizada, setTasaPersonalizada] = useState(36.50);
    const [showComboModal, setShowComboModal] = useState(false);
    const [comboPlataformas, setComboPlataformas] = useState([]);
    const [comboNombre, setComboNombre] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [showBulkCommissionModal, setShowBulkCommissionModal] = useState(false);
    const [bulkCommissionPercent, setBulkCommissionPercent] = useState(5);
    
    const [showGestionModal, setShowGestionModal] = useState(false);
    const [gestionTipo, setGestionTipo] = useState('');
    const [gestionValor, setGestionValor] = useState('');
    const [gestionSubtipo, setGestionSubtipo] = useState('');
    const [editCatMarca, setEditCatMarca] = useState({ tipo: '', valorOriginal: '', valorNuevo: '' });
    const [busquedaKit, setBusquedaKit] = useState('');
    const [nuevoCampo, setNuevoCampo] = useState({ tipo: '', valor: '' });
    const [showNuevoCampo, setShowNuevoCampo] = useState({ tipo: '', show: false });

    // ✅ Subidor múltiple de imágenes (edición)
    const [imagenesExtraEdit, setImagenesExtraEdit] = useState([]);
    const [isDragOverEdit, setIsDragOverEdit] = useState(false);
    const fileInputEditRef = useRef(null);
    const fileInputItemRefs = useRef({});

    const [items, setItems] = useState([{
      id: crypto.randomUUID(),
      tipo: 'fisico',
      disponibilidad: 'stock',
      imagen: '',
      imagenFile: null,
      sku: '',
      fecha: new Date().toISOString().split('T')[0],
      comprador: '',
      proveedor: '',
      plataforma: '',
      categoria: '',
      marca: '',
      cantidad: 1,
      metodoPago: 'efectivo',
      cartera: '',
      precioMayor: 0,
      precioDetal: 0,
      precioOferta: 0,
      estado: 'nuevo',
      precioBs: 0,
      total: 0,
      monedaCompra: 'usd',
      duracion: '',
      tipoOferta: '',
      esCombo: false,
      plataformasCombo: [],
      porcentaje_comision: 5,
      productos_kit: [],
      precio_costo_total: 0,
      precio_individual_total: 0,
      descripcion_detallada: ''
    }]);

    const [editData, setEditData] = useState({
      tipo: 'fisico',
      precioDetal: 0,
      precioOferta: 0,
      estado: 'nuevo',
      descripcion: '',
      descripcion_detallada: '',
      publicado: false,
      imagen: '',
      duracion: '',
      tipoOferta: '',
      plataforma: '',
      plataformasCombo: [],
      porcentaje_comision: 5,
      productos_kit: [],
      precio_costo_total: 0,
      precio_individual_total: 0
    });

    // ✅ Funciones de SKU (definidas antes del useEffect)
    const prefijoSKU = (texto) => {
      const t = (texto || '').toString().trim().toUpperCase();
      return (t.substring(0, 3) || 'XXX').padEnd(3, 'X');
    };

    const generarSKU = (plataforma, categoria, marca, num) => {
      return `${prefijoSKU(plataforma)}-${prefijoSKU(categoria)}-${prefijoSKU(marca)}-${String(num).padStart(3, '0')}`;
    };

    const obtenerSiguienteNumero = (plataforma, categoria, marca, lista) => {
      const base = `${prefijoSKU(plataforma)}-${prefijoSKU(categoria)}-${prefijoSKU(marca)}`;
      const usados = (lista && lista.length > 0 ? lista : productos)
        .filter(p => p.sku && String(p.sku).startsWith(base + '-'))
        .map(p => parseInt(String(p.sku).split('-').pop(), 10))
        .filter(n => !isNaN(n));
      let n = 1;
      while (usados.includes(n)) n++;
      return n;
    };

    useEffect(() => {
      const cargarDatos = async () => {
        let pData = [], cData = [], sData = {};

        if (supabase) {
          const [{ data: p, error: eP }, { data: c, error: eC }, { data: s, error: eS }, { data: prv, error: ePrv }] = await Promise.all([
            supabase.from('productos').select('*'),
            supabase.from('carteras').select('*'),
            supabase.from('settings').select('clave, valor'),
            supabase.from('proveedores').select('*')
          ]);
        
          if (eP) console.error('❌ Error cargando productos:', eP.message);
          if (eC) console.error('❌ Error cargando carteras:', eC.message);
          if (eS) console.error('❌ Error cargando settings:', eS.message);
          if (ePrv) console.error('❌ Error cargando proveedores:', ePrv.message);
          if (p) pData = p;
          if (c) cData = c;
          // 🔧 FIX: parsear JSON aunque venga como string
          if (s) {
            s.forEach(item => {
              let v = item.valor;
              if (typeof v === 'string') {
                try { v = JSON.parse(v); } catch (e) {}
              }
              sData[item.clave] = v;
            });
          }
          if (prv) setProveedores(prv);
        }

        // ✅ MÉTODOS DE PAGO: Ajustes los guarda como OBJETO en 'pagos' { efectivo: {...}, ... }
        const metodosRaw = sData.pagos || sData.metodos_pago || sData.metodosPago || {};
        let metodosLista = [];
        if (Array.isArray(metodosRaw)) {
          metodosLista = metodosRaw;
        } else if (metodosRaw && typeof metodosRaw === 'object') {
          metodosLista = Object.entries(metodosRaw).map(([key, m]) => ({ id: key, ...(m || {}) }));
        }
        setMetodosPago(metodosLista.filter(m => m.activo !== false && m.activa !== false));

        if (pData.length === 0) {
          const productosGuardados = localStorage.getItem('voltech_productos');
          if (productosGuardados) pData = JSON.parse(productosGuardados);
        }
        if (cData.length === 0) {
          const carterasGuardadas = localStorage.getItem('voltech_carteras');
          if (carterasGuardadas) cData = JSON.parse(carterasGuardadas);
        }

        if (pData.length > 0 && pData.some(p => !p.sku && p.plataforma)) {
          const usadosPorBase = {};
          pData.forEach(p => {
            if (p.sku) {
              const partes = String(p.sku).split('-');
              const num = parseInt(partes.pop(), 10);
              if (!isNaN(num)) {
                const base = partes.join('-');
                (usadosPorBase[base] = usadosPorBase[base] || []).push(num);
              }
            }
          });
          let cambio = false;
          pData.forEach(p => {
            if (!p.sku && p.plataforma) {
              const base = `${prefijoSKU(p.plataforma)}-${prefijoSKU(p.categoria)}-${prefijoSKU(p.marca)}`;
              const usados = usadosPorBase[base] || [];
              let n = 1;
              while (usados.includes(n)) n++;
              p.sku = `${base}-${String(n).padStart(3, '0')}`;
              usados.push(n);
              cambio = true;
            }
          });
          if (cambio) {
            localStorage.setItem('voltech_productos', JSON.stringify(pData));
            if (supabase) supabase.from('productos').upsert(pData, { onConflict: 'id' }).then(({ error }) => {
              if (error) console.error('Error completando SKUs:', error);
              else console.log('✅ SKUs completados y guardados en Supabase');
            });
          }
        }

        const equipoGuardado = localStorage.getItem('voltech_equipo');
        const eqData = equipoGuardado ? JSON.parse(equipoGuardado) : [{ id: crypto.randomUUID(), nombre: 'Administrador', rol: 'Admin', email: 'admin@voltech.store' }];
        
        const catsData = sData.categorias || (localStorage.getItem('voltech_categorias') ? JSON.parse(localStorage.getItem('voltech_categorias')) : []);
        const marData = sData.marcas || (localStorage.getItem('voltech_marcas') ? JSON.parse(localStorage.getItem('voltech_marcas')) : []);
        const tasaData = sData.tasa_bcv || (localStorage.getItem('voltech_tasa_bcv') ? JSON.parse(localStorage.getItem('voltech_tasa_bcv')) : { tasa: 36.50, usarBCV: true, tasaPersonalizada: 36.50 });

        const catsBase = Array.isArray(catsData) ? catsData : [];
        const marBase = Array.isArray(marData) ? marData : [];
        const catsFinal = [...new Set([...catsBase, ...pData.map(p => p.categoria).filter(Boolean)])];
        const marFinal = [...new Set([...marBase, ...pData.map(p => p.marca).filter(Boolean)])];

        // 🔧 FIX: aceptar varios nombres de clave
        const carterasRaw = sData.carteras || sData.carteras_config || sData.carterasAjustes || [];
        const carterasDeAjustes = Array.isArray(carterasRaw)
          ? carterasRaw.filter(ct => ct.activo !== false && ct.activa !== false)
          : [];
        const carterasFinal = carterasDeAjustes.length > 0 ? carterasDeAjustes : cData;

        setProductos(pData);
        setCarteras(carterasFinal);
        setEquipo(eqData);
        setCategorias(catsFinal);
        setMarcas(marFinal);
        setTasaBCV(tasaData.tasa || 36.50);
        setUsarTasaBCV(tasaData.usarBCV !== undefined ? tasaData.usarBCV : true);
        setTasaPersonalizada(tasaData.tasaPersonalizada || tasaData.tasa || 36.50);

        if (!equipoGuardado) {
          localStorage.setItem('voltech_equipo', JSON.stringify(eqData));
        }
      };

      cargarDatos();
    }, []);

    useEffect(() => {
      const detectarUsuario = async () => {
        let nombre = '';
        try {
          if (supabase && supabase.auth) {
            const { data } = await supabase.auth.getSession();
            const u = data?.session?.user;
            if (u) {
              nombre = u.user_metadata?.nombre || u.user_metadata?.name || u.user_metadata?.full_name || u.email || '';
            }
          }
        } catch (e) {}
        if (!nombre) {
          try {
            const raw = localStorage.getItem('voltech_usuario') || localStorage.getItem('usuario') || localStorage.getItem('voltech_user');
            if (raw) {
              const p = JSON.parse(raw);
              nombre = p.nombre || p.name || p.email || raw;
            }
          } catch (e) {}
        }
        setUsuarioActual(nombre || 'Administrador');
      };
      detectarUsuario();
    }, []);

    const actualizarSKU = (index) => {
      const item = items[index];
      if (item.plataforma && item.categoria) {
        const siguienteNum = obtenerSiguienteNumero(item.plataforma, item.categoria, item.marca, productos);
        const nuevoSKU = generarSKU(item.plataforma, item.categoria, item.marca, siguienteNum);
        const nuevosItems = [...items];
        nuevosItems[index].sku = nuevoSKU;
        setItems(nuevosItems);
      }
    };
    
    const handleChange = (index, name, value) => {
      const nuevosItems = [...items];
      const item = nuevosItems[index];

      if (name === 'tipo') {
        item.plataforma = '';
        item.categoria = '';
        item.marca = '';
        item.sku = '';
        if (value === 'streaming') {
          item.categoria = 'STREAMING';
          item.marca = 'Voltech';
        } else if (value === 'kit') {
          item.categoria = 'KIT';
          item.marca = 'Voltech';
        }
      }

      item[name] = value;

      if (name === 'disponibilidad' && value === 'bajo_pedido') {
        item.metodoPago = 'por_comprar';
        item.cartera = 'por_comprar';
        item.cantidad = 0;
      } else if (name === 'disponibilidad' && value === 'stock' && item.metodoPago === 'por_comprar') {
        item.metodoPago = 'efectivo';
        item.cartera = '';
      }

      if (item.tipo === 'fisico') {
        if (name === 'plataforma' && value) {
          const registros = productos.filter(p => p.tipo === 'fisico' && normalizarTexto(p.plataforma) === normalizarTexto(value));
          const prod = registros.find(p => p.categoria && p.marca) || registros[0];
          if (prod) {
            if (prod.categoria) item.categoria = prod.categoria;
            if (prod.marca) item.marca = prod.marca;
          }
        }
        
        if (name === 'categoria' && value) {
          let candidatos = productos.filter(p => p.tipo === 'fisico' && p.categoria && normalizarTexto(p.categoria) === normalizarTexto(value));
          if (item.marca) candidatos = candidatos.filter(p => normalizarTexto(p.marca) === normalizarTexto(item.marca));
          if (candidatos.length === 1) {
            item.plataforma = candidatos[0].plataforma;
            if (candidatos[0].marca) item.marca = candidatos[0].marca;
          }
        }

        if (name === 'marca' && value) {
          let candidatos = productos.filter(p => p.tipo === 'fisico' && p.marca && normalizarTexto(p.marca) === normalizarTexto(value));
          if (item.categoria) candidatos = candidatos.filter(p => normalizarTexto(p.categoria) === normalizarTexto(item.categoria));
          if (candidatos.length === 1) {
            item.plataforma = candidatos[0].plataforma;
            if (candidatos[0].categoria) item.categoria = candidatos[0].categoria;
          }
        }
      }

      const tasa = usarTasaBCV ? tasaBCV : tasaPersonalizada;
      const qty = parseInt(item.cantidad) || 1;
      let precioUnitario = 0;

      if (item.tipo === 'kit') {
        precioUnitario = parseFloat(item.precioDetal) || 0;
      } else {
        precioUnitario = (parseFloat(item.precioOferta) > 0) ? parseFloat(item.precioOferta) : (parseFloat(item.precioDetal) || 0);
      }

      item.total = precioUnitario * qty;
      item.precioBs = precioUnitario * tasa;

      setItems(nuevosItems);

      if (['plataforma', 'categoria', 'marca', 'tipo'].includes(name)) {
        setTimeout(() => {
          const itemActualizado = nuevosItems[index];
          if (itemActualizado.plataforma && itemActualizado.categoria) {
            const siguientesItems = [...nuevosItems];
            const siguienteNum = obtenerSiguienteNumero(itemActualizado.plataforma, itemActualizado.categoria, itemActualizado.marca, productos);
            const nuevoSKU = generarSKU(itemActualizado.plataforma, itemActualizado.categoria, itemActualizado.marca, siguienteNum);
            siguientesItems[index].sku = nuevoSKU;
            setItems(siguientesItems);
          }
        }, 100);
      }
    };

    const toggleProductoKit = (index, producto) => {
      const nuevosItems = [...items];
      const kitActual = nuevosItems[index].productos_kit || [];
      const existe = kitActual.find(p => p.producto_id === producto.id);
      
      if (existe) {
        nuevosItems[index].productos_kit = kitActual.filter(p => p.producto_id !== producto.id);
      } else {
        nuevosItems[index].productos_kit = [...kitActual, {
          producto_id: producto.id,
          sku: producto.sku,
          nombre: producto.plataforma || producto.producto,
          cantidad: 1,
          precio_costo: producto.precioMayor || 0,
          precio_venta: producto.precioDetal || 0,
          imagen: producto.imagen
        }];
      }
      
      const kitActualizado = nuevosItems[index].productos_kit;
      const costoTotal = kitActualizado.reduce((sum, p) => sum + (p.precio_costo * p.cantidad), 0);
      const ventaTotal = kitActualizado.reduce((sum, p) => sum + (p.precio_venta * p.cantidad), 0);
      
      nuevosItems[index].precio_costo_total = costoTotal;
      nuevosItems[index].precio_individual_total = ventaTotal;
      if (nuevosItems[index].precioDetal === 0) {
        nuevosItems[index].precioDetal = parseFloat((ventaTotal * 0.9).toFixed(2));
      }
      
      setItems(nuevosItems);
    };

    const actualizarCantidadKit = (index, productoId, nuevaCantidad) => {
      if (nuevaCantidad < 1) return;
      const nuevosItems = [...items];
      const kitActual = nuevosItems[index].productos_kit || [];
      const producto = kitActual.find(p => p.producto_id === productoId);
      if (producto) {
        producto.cantidad = nuevaCantidad;
        const costoTotal = kitActual.reduce((sum, p) => sum + (p.precio_costo * p.cantidad), 0);
        const ventaTotal = kitActual.reduce((sum, p) => sum + (p.precio_venta * p.cantidad), 0);
        nuevosItems[index].productos_kit = kitActual;
        nuevosItems[index].precio_costo_total = costoTotal;
        nuevosItems[index].precio_individual_total = ventaTotal;
        setItems(nuevosItems);
      }
    };

    const handleImageUpload = (index, e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const nuevosItems = [...items];
          nuevosItems[index].imagen = reader.result;
          nuevosItems[index].imagenFile = file;
          setItems(nuevosItems);
          toast.success('Imagen cargada');
        };
        reader.readAsDataURL(file);
      }
    };

    // ✅ Subidor múltiple NUEVO PRODUCTO (por item)
  const handleImagenesItem = (index, files) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return; }
      if (file.size > 5 * 1024 * 1024) { toast.error('Cada imagen máximo 5MB'); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        const nuevosItems = [...items];
        const item = nuevosItems[index];
        const arr = Array.isArray(item.imagenes) ? item.imagenes : (item.imagen ? [item.imagen] : []);
        if (!arr.includes(reader.result)) arr.push(reader.result);
        item.imagenes = arr;
        if (!item.imagen) item.imagen = reader.result;
        setItems(nuevosItems);
      };
      reader.readAsDataURL(file);
    });
  };

  const quitarImagenItem = (index, img) => {
    const nuevosItems = [...items];
    const item = nuevosItems[index];
    const arr = (item.imagenes || []).filter(x => x !== img);
    item.imagenes = arr;
    if (item.imagen === img) item.imagen = arr[0] || '';
    setItems(nuevosItems);
  };

  const setPortadaItem = (index, img) => {
    const nuevosItems = [...items];
    nuevosItems[index].imagen = img;
    setItems(nuevosItems);
  };

  // ✅ Subidor múltiple EDICIÓN
  const handleImagenesEdit = (files) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return; }
      if (file.size > 5 * 1024 * 1024) { toast.error('Cada imagen máximo 5MB'); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenesExtraEdit(prev => prev.includes(reader.result) ? prev : [...prev, reader.result]);
        setEditData(prev => prev.imagen ? prev : { ...prev, imagen: reader.result });
      };
      reader.readAsDataURL(file);
    });
  };

  const quitarImagenEdit = (img) => {
    setImagenesExtraEdit(prev => prev.filter(x => x !== img));
    setEditData(prev => {
      if (prev.imagen === img) {
        const restante = imagenesExtraEdit.filter(x => x !== img);
        return { ...prev, imagen: restante[0] || '' };
      }
      return prev;
    });
  };

  const setPortadaEdit = (img) => {
    setEditData(prev => ({ ...prev, imagen: img }));
  };

  const todasImagenesEdit = Array.from(new Set([editData.imagen, ...imagenesExtraEdit].filter(Boolean)));

    const agregarItem = () => {
      setItems([...items, {
        id: crypto.randomUUID(),
        tipo: 'fisico',
        disponibilidad: 'stock',  
        imagen: '',
        imagenFile: null,
        sku: '',
        cantidad: 1,
        precioMayor: 0,
        precioDetal: 0,
        precioOferta: 0,
        estado: 'nuevo',
        precioBs: 0,
        total: 0,
        plataforma: '',
        categoria: '',
        marca: '',
        proveedor: '',
        comprador: '',
        metodoPago: 'efectivo',
        cartera: '',
        monedaCompra: 'usd',
        duracion: '',
        tipoOferta: '',
        esCombo: false,
        plataformasCombo: [],
        porcentaje_comision: 5,
        productos_kit: [],
        precio_costo_total: 0,
        precio_individual_total: 0,
        descripcion_detallada: ''
      }]);
    };

    const eliminarItem = (index) => {
      if (items.length > 1) {
        setItems(items.filter((_, i) => i !== index));
      } else {
        toast.error('Debe haber al menos un producto');
      }
    };

    const abrirGestionModal = (tipo, subtipo = null) => {
      setGestionTipo(tipo);
      setGestionSubtipo(subtipo || tipo);
      setGestionValor('');
      setShowGestionModal(true);
    };

    const agregarDesdeGestion = async () => {
      if (!gestionValor.trim()) {
        toast.error('Ingresa un valor');
        return;
      }

      if (gestionTipo === 'categoria') {
        if (!categorias.includes(gestionValor)) {
          const nuevasCategorias = [...categorias, gestionValor];
          setCategorias(nuevasCategorias);
          if (supabase) await supabase.from('settings').upsert({ clave: 'categorias', valor: nuevasCategorias }, { onConflict: 'clave' });
          localStorage.setItem('voltech_categorias', JSON.stringify(nuevasCategorias));
          toast.success('Categoría agregada');
        } else {
          toast.error('Esta categoría ya existe');
        }
      } else if (gestionTipo === 'marca') {
        if (!marcas.includes(gestionValor)) {
          const nuevasMarcas = [...marcas, gestionValor];
          setMarcas(nuevasMarcas);
          if (supabase) await supabase.from('settings').upsert({ clave: 'marcas', valor: nuevasMarcas }, { onConflict: 'clave' });
          localStorage.setItem('voltech_marcas', JSON.stringify(nuevasMarcas));
          toast.success('Marca agregada');
        } else {
          toast.error('Esta marca ya existe');
        }
      } else if (gestionTipo === 'plataforma') {
        const catGestion = gestionSubtipo === 'streaming' ? 'STREAMING' : gestionSubtipo === 'kit' ? 'KIT' : '';
        const marcaGestion = gestionSubtipo === 'streaming' || gestionSubtipo === 'kit' ? 'Voltech' : '';
        const skuGenerado = generarSKU(
          gestionValor,
          catGestion,
          marcaGestion,
          obtenerSiguienteNumero(gestionValor, catGestion, marcaGestion, productos)
        );

        const nuevoProducto = {
          id: crypto.randomUUID(),
          tipo: gestionSubtipo,
          plataforma: gestionValor,
          producto: gestionValor,
          categoria: catGestion,
          marca: marcaGestion,
          sku: skuGenerado,
          cantidad: 0,
          precioDetal: 0,
          precioMayor: 0,
          precioBs: 0,
          estado: 'nuevo',
          publicado: false,
          porcentaje_comision: 5,
          fechaCreacion: new Date().toISOString(),
          creado_en: new Date().toISOString(),
          productos_kit: [],
          precio_costo_total: 0,
          precio_individual_total: 0,
          esCombo: false,
          plataformasCombo: [],
          especificaciones: null,
          colores: null,
          caracteristicas: null,
          precio_oferta: 0,
          tipoOferta: ''
        };

        if (supabase) {
          const { error } = await supabase.from('productos').insert(nuevoProducto);
          if (error) {
            console.error('Error al guardar:', error);
            toast.error('Error al guardar en BD: ' + error.message);
            return;
          }
        }

        const nuevosProductos = [...productos, nuevoProducto];
        setProductos(nuevosProductos);
        localStorage.setItem('voltech_productos', JSON.stringify(nuevosProductos));

        if (items.length > 0) {
          const nuevosItems = [...items];
          nuevosItems[0].plataforma = gestionValor;
          if (gestionSubtipo === 'streaming') {
            nuevosItems[0].categoria = 'STREAMING';
            nuevosItems[0].marca = 'Voltech';
          } else if (gestionSubtipo === 'kit') {
            nuevosItems[0].categoria = 'KIT';
            nuevosItems[0].marca = 'Voltech';
          }
          setItems(nuevosItems);
        }

        toast.success(`"${gestionValor}" creado con SKU ${skuGenerado}`);
      }
      
      setGestionValor('');
    };

    const eliminarDesdeGestion = async (tipo, valor) => {
      if (!confirm(`¿Estás seguro de eliminar "${valor}"?`)) return;

      if (tipo === 'categoria') {
        const nuevas = categorias.filter(c => c !== valor);
        setCategorias(nuevas);
        if (supabase) await supabase.from('settings').upsert({ clave: 'categorias', valor: nuevas }, { onConflict: 'clave' });
        localStorage.setItem('voltech_categorias', JSON.stringify(nuevas));
        toast.success('Categoría eliminada');
      } else if (tipo === 'marca') {
        const nuevas = marcas.filter(m => m !== valor);
        setMarcas(nuevas);
        if (supabase) await supabase.from('settings').upsert({ clave: 'marcas', valor: nuevas }, { onConflict: 'clave' });
        localStorage.setItem('voltech_marcas', JSON.stringify(nuevas));
        toast.success('Marca eliminada');
      } else if (tipo === 'plataforma') {
        const productoAEliminar = productos.find(p => p.plataforma === valor && p.tipo === gestionSubtipo);
        if (productoAEliminar && supabase) {
          await supabase.from('productos').delete().eq('id', productoAEliminar.id);
        }
        const nuevosProductos = productos.filter(p => !(p.plataforma === valor && p.tipo === gestionSubtipo));
        setProductos(nuevosProductos);
        localStorage.setItem('voltech_productos', JSON.stringify(nuevosProductos));
        toast.success(`"${valor}" eliminado`);
      }
    };

    const eliminarCatMarca = (tipo, valor) => {
      if (tipo === 'categoria') {
        const nuevas = categorias.filter(c => c !== valor);
        setCategorias(nuevas);
        if (supabase) supabase.from('settings').upsert({ clave: 'categorias', valor: nuevas }, { onConflict: 'clave' });
        localStorage.setItem('voltech_categorias', JSON.stringify(nuevas));
      } else {
        const nuevas = marcas.filter(m => m !== valor);
        setMarcas(nuevas);
        if (supabase) supabase.from('settings').upsert({ clave: 'marcas', valor: nuevas }, { onConflict: 'clave' });
        localStorage.setItem('voltech_marcas', JSON.stringify(nuevas));
      }
      toast.success(`${tipo === 'categoria' ? 'Categoría' : 'Marca'} eliminada`);
    };

    const guardarEdicionCatMarca = () => {
      if (!editCatMarca.valorNuevo.trim() || editCatMarca.valorNuevo === editCatMarca.valorOriginal) {
        setEditCatMarca({ tipo: '', valorOriginal: '', valorNuevo: '' });
        return;
      }
      
      if (editCatMarca.tipo === 'categoria') {
        const nuevas = categorias.map(c => c === editCatMarca.valorOriginal ? editCatMarca.valorNuevo : c);
        setCategorias(nuevas);
        if (supabase) supabase.from('settings').upsert({ clave: 'categorias', valor: nuevas }, { onConflict: 'clave' });
        localStorage.setItem('voltech_categorias', JSON.stringify(nuevas));
      } else {
        const nuevas = marcas.map(m => m === editCatMarca.valorOriginal ? editCatMarca.valorNuevo : m);
        setMarcas(nuevas);
        if (supabase) supabase.from('settings').upsert({ clave: 'marcas', valor: nuevas }, { onConflict: 'clave' });
        localStorage.setItem('voltech_marcas', JSON.stringify(nuevas));
      }
      setEditCatMarca({ tipo: '', valorOriginal: '', valorNuevo: '' });
      toast.success('Actualizado correctamente');
    };

    const abrirComboModal = () => {
      setComboPlataformas(productos.filter(p => p.tipo === 'streaming' && !p.esCombo).map(p => p.plataforma));
      setShowComboModal(true);
    };

    const crearCombo = async () => {
      if (!comboNombre || comboPlataformas.length < 2) {
        toast.error('Selecciona al menos 2 plataformas y ponle nombre al combo');
        return;
      }

      const nuevoCombo = {
        id: crypto.randomUUID(),
        tipo: 'streaming',
        plataforma: comboNombre,
        categoria: 'COMBO',
        esCombo: true,
        plataformasCombo: comboPlataformas,
        precioDetal: 0,
        preciodetal: 0,
        duracion: '1 mes',
        tipoOferta: `Pack ${comboPlataformas.length} plataformas`,
        cantidad: 100,
        publicado: false,
        estado: 'combo',
        fechaCreacion: new Date().toISOString(),
        sku: generarSKU(comboNombre, 'COMBO', '', obtenerSiguienteNumero(comboNombre, 'COMBO', '', productos)),
        porcentaje_comision: 5,
      };

      if (supabase) {
        await supabase.from('productos').insert(nuevoCombo);
      }

      const productosActualizados = [...productos, nuevoCombo];
      setProductos(productosActualizados);
      localStorage.setItem('voltech_productos', JSON.stringify(productosActualizados));
      toast.success(`Combo "${comboNombre}" creado exitosamente`);
      setShowComboModal(false);
      setComboNombre('');
      setComboPlataformas([]);
    };

    const asignarComisionMasiva = async () => {
      if (selectedProducts.length === 0) {
        toast.error('Selecciona al menos un producto');
        return;
      }

      const productosActualizados = productos.map(p => {
        if (selectedProducts.includes(p.id)) {
          return { ...p, porcentaje_comision: bulkCommissionPercent };
        }
        return p;
      });

      if (supabase) {
        const updates = selectedProducts.map(id => 
          supabase.from('productos').update({ porcentaje_comision: bulkCommissionPercent }).eq('id', id)
        );
        await Promise.all(updates);
      }

      setProductos(productosActualizados);
      localStorage.setItem('voltech_productos', JSON.stringify(productosActualizados));
      toast.success(`Comisión del ${bulkCommissionPercent}% asignada a ${selectedProducts.length} productos`);
      setShowBulkCommissionModal(false);
      setSelectedProducts([]);
      setBulkCommissionPercent(5);
    };

    const toggleProductSelection = (id) => {
      setSelectedProducts(selectedProducts.includes(id) ? selectedProducts.filter(pid => pid !== id) : [...selectedProducts, id]);
    };

    const selectAll = () => {
      setSelectedProducts(selectedProducts.length === productosFiltrados.length ? [] : productosFiltrados.map(p => p.id));
    };

    const eliminarSeleccionados = async () => {
      if (selectedProducts.length === 0) {
        toast.error('Selecciona al menos un producto');
        return;
      }
      if (!confirm(`¿Eliminar ${selectedProducts.length} producto(s) seleccionado(s)?`)) return;
      
      try {
        if (supabase) {
          await supabase.from('productos').delete().in('id', selectedProducts);
        }
        const nuevosProductos = productos.filter(p => !selectedProducts.includes(p.id));
        setProductos(nuevosProductos);
        localStorage.setItem('voltech_productos', JSON.stringify(nuevosProductos));
        toast.success(`${selectedProducts.length} producto(s) eliminado(s)`);
        setSelectedProducts([]);
      } catch (error) {
        console.error('Error eliminando productos:', error);
        toast.error('Error al eliminar productos');
      }
    };

    const guardarProductos = async () => {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.tipo === 'kit') {
          if (!it.plataforma || (it.productos_kit || []).length === 0) {
            toast.error(`El Kit ${i + 1} debe tener un nombre y al menos 1 producto del inventario`);
            return;
          }
        } else {
          if (!it.plataforma || !it.categoria || (it.tipo === 'fisico' && !it.marca)) {
            toast.error(`El item ${i + 1} está incompleto: nombre, categoría y marca son obligatorios`);
            return;
          }
          if (it.disponibilidad !== 'bajo_pedido' && !(parseFloat(it.cantidad) > 0)) {
            toast.error(`El item ${i + 1}: cantidad mayor a 0, o márcalo como "Compra al momento"`);
            return;
          }
          if (!((parseFloat(it.precioDetal) > 0) || (parseFloat(it.precioOferta) > 0))) {
            toast.error(`El item ${i + 1} debe tener un precio de venta (Detal u Oferta)`);
            return;
          }
        }
      }

      let productosGuardados = 0;
      let productosActualizados = 0;
      const nuevosProductos = [];

      items.forEach((item, index) => {
        const mismoCombo = productos.find(p =>
          normalizarTexto(p.plataforma) === normalizarTexto(item.plataforma) &&
          normalizarTexto(p.categoria || '') === normalizarTexto(item.categoria || '') &&
          normalizarTexto(p.marca || '') === normalizarTexto(item.marca || '') &&
          (p.tipo || 'fisico') === (item.tipo || 'fisico') &&
          p.id !== item.id
        );
        const cascaron = productos.find(p =>
          normalizarTexto(p.plataforma) === normalizarTexto(item.plataforma) &&
          (p.tipo || 'fisico') === (item.tipo || 'fisico') &&
          !p.categoria && !p.marca &&
          p.id !== item.id
        );
        const productoExistente = mismoCombo || cascaron;

        const baseEsperada = `${prefijoSKU(item.plataforma)}-${prefijoSKU(item.categoria)}-${prefijoSKU(item.marca)}`;
        if (!item.sku || !String(item.sku).startsWith(baseEsperada + '-')) {
          item.sku = generarSKU(item.plataforma, item.categoria, item.marca, obtenerSiguienteNumero(item.plataforma, item.categoria, item.marca, productos));
        }

        const imagenesArr = Array.from(new Set([item.imagen, ...(item.imagenes || [])].filter(Boolean)));
        const productoData = {
          tipo: item.tipo,
          disponibilidad: item.disponibilidad || 'stock',
          imagen: item.imagen || null,
          sku: item.sku,
          fecha: item.fecha,
          fechaCreacion: new Date().toISOString(),
          creado_en: new Date().toISOString(),
          plataforma: item.plataforma,
          producto: item.plataforma,
          categoria: item.categoria,
          marca: item.marca,
          cantidad: item.cantidad,
          descripcion: '',
          descripcion_detallada: item.descripcion_detallada || '',
          duracion: item.duracion || '',
          estado: item.estado || 'nuevo',
          publicado: false,
          porcentaje_comision: item.porcentaje_comision || 5,
          productos_kit: item.productos_kit || [],
          precio_costo_total: item.precio_costo_total || 0,
          precio_individual_total: item.precio_individual_total || 0,
          esCombo: item.esCombo || false,
          plataformasCombo: item.plataformasCombo || [],
          especificaciones: null,
          colores: null,
          caracteristicas: null,
          precioMayor: item.precioMayor || 0,
          preciomayor: item.precioMayor || 0,
          precioDetal: item.precioDetal || item.precioMayor || 0,
          preciodetal: item.precioDetal || item.precioMayor || 0,
          precioBs: item.precioBs || 0,
          preciobs: item.precioBs || 0,
          precioOferta: item.precioOferta || 0,
          precio_oferta: item.precioOferta || 0,
          tipoOferta: item.tipoOferta || '',
          proveedor: item.proveedor || '',
          comprador: item.comprador || usuarioActual || 'Administrador'
        };

        if (productoExistente) {
          const productoActualizado = {
            ...productoExistente,
            ...productoData,
            id: productoExistente.id,
            cantidad: item.tipo !== 'kit' ? (productoExistente.cantidad || 0) + item.cantidad : item.cantidad,
          };
          nuevosProductos.push(productoActualizado);
          productosActualizados++;
        } else {
          const nuevoProducto = {
            ...productoData,
            id: item.id || crypto.randomUUID(),
          };
          nuevosProductos.push(nuevoProducto);
          productosGuardados++;
        }
      });

      if (productosGuardados > 0 || productosActualizados > 0) {
        try {
          if (supabase) {
            console.log('🔄 Guardando en Supabase:', nuevosProductos);
            const { data, error } = await supabase.from('productos').upsert(nuevosProductos, { onConflict: 'id' });
            
            if (error) {
              console.error('❌ Error Supabase:', error);
              toast.error('Error al guardar en base de datos: ' + error.message);
              return;
            }
            console.log('✅ Guardado en Supabase:', data);
          }

          let productosFinales = [...productos];
          nuevosProductos.forEach(p => {
            const index = productosFinales.findIndex(existing => existing.id === p.id);
            if (index !== -1) {
              productosFinales[index] = p;
            } else {
              productosFinales.push(p);
            }
          });

          setProductos(productosFinales);
          localStorage.setItem('voltech_productos', JSON.stringify(productosFinales));

          const nuevasCategorias = [...categorias];
          const nuevasMarcas = [...marcas];
          nuevosProductos.forEach(p => {
            if (p.categoria && !nuevasCategorias.includes(p.categoria)) {
              nuevasCategorias.push(p.categoria);
            }
            if (p.marca && !nuevasMarcas.includes(p.marca)) {
              nuevasMarcas.push(p.marca);
            }
          });
          setCategorias(nuevasCategorias);
          setMarcas(nuevasMarcas);
          if (supabase) {
            await supabase.from('settings').upsert({ clave: 'categorias', valor: nuevasCategorias }, { onConflict: 'clave' });
            await supabase.from('settings').upsert({ clave: 'marcas', valor: nuevasMarcas }, { onConflict: 'clave' });
          }
          localStorage.setItem('voltech_categorias', JSON.stringify(nuevasCategorias));
          localStorage.setItem('voltech_marcas', JSON.stringify(nuevasMarcas));

          const mensaje = productosActualizados > 0 
            ? `${productosGuardados} nuevo(s) y ${productosActualizados} actualizado(s)`
            : `${productosGuardados} producto(s) guardado(s)`;
          
          toast.success(mensaje);
          
          setItems([{
            id: crypto.randomUUID(),
            tipo: 'fisico',
            disponibilidad: 'stock',
            imagen: '',
            imagenFile: null,
            sku: '',
            fecha: new Date().toISOString().split('T')[0],
            comprador: '',
            proveedor: '',
            plataforma: '',
            categoria: '',
            marca: '',
            cantidad: 1,
            metodoPago: 'efectivo',
            cartera: '',
            precioMayor: 0,
            precioDetal: 0,
            precioOferta: 0,
            estado: 'nuevo',
            precioBs: 0,
            total: 0,
            monedaCompra: 'usd',
            duracion: '',
            tipoOferta: '',
            esCombo: false,
            plataformasCombo: [],
            porcentaje_comision: 5,
            productos_kit: [],
            precio_costo_total: 0,
            precio_individual_total: 0,
            descripcion_detallada: ''
          }]);
          setShowForm(false);
        } catch (error) {
          console.error('Error guardando productos:', error);
          toast.error('Error: ' + error.message);
        }
      }
    };
    
  const abrirEdicion = (producto) => {
    setEditandoId(producto.id);
    // ✅ Cargar imágenes extras desde el array guardado
    const extras = Array.isArray(producto.imagenes)
      ? producto.imagenes.filter(img => img && img !== producto.imagen)
      : [];
    setImagenesExtraEdit(extras);
    setEditData({
      tipo: producto.tipo || 'fisico',
      precioDetal: producto.precioDetal || producto.precioMayor,
      precioOferta: producto.precioOferta || 0,
      estado: producto.estado || 'nuevo',
      descripcion: producto.descripcion || '',
      descripcion_detallada: producto.descripcion_detallada || '',
      publicado: producto.publicado || false,
      imagen: producto.imagen || '',
      imagenes: producto.imagenes || (producto.imagen ? [producto.imagen] : []),
      duracion: producto.duracion || '',
      tipoOferta: producto.tipoOferta || '',
      plataforma: producto.plataforma || '',
      plataformasCombo: producto.plataformasCombo || [],
      porcentaje_comision: producto.porcentaje_comision || 5,
      productos_kit: producto.productos_kit || [],
      precio_costo_total: producto.precio_costo_total || 0,
      precio_individual_total: producto.precio_individual_total || 0
    });
  };
      const guardarEdicion = async (id) => {
    const imagenesFinal = [editData.imagen, ...imagenesExtraEdit].filter(Boolean);
    const dataFinal = {
      ...editData,
      imagenes: Array.from(new Set(imagenesFinal)),
    };
    if (supabase) {
      await supabase.from('productos').update(dataFinal).eq('id', id);
    }
    const productosActualizados = productos.map(p => 
      p.id === id ? { ...p, ...dataFinal } : p
    );
    setProductos(productosActualizados);
    localStorage.setItem('voltech_productos', JSON.stringify(productosActualizados));
    toast.success('Producto actualizado');
    setEditandoId(null);
    setImagenesExtraEdit([]);
  };
    const cancelarEdicion = () => {
      setEditandoId(null);
    };

    const togglePublicado = async (id) => {
      const producto = productos.find(p => p.id === id);
      const nuevoEstado = !producto.publicado;
      
      if (supabase) {
        await supabase.from('productos').update({ publicado: nuevoEstado }).eq('id', id);
      }
      
      const productosActualizados = productos.map(p => 
        p.id === id ? { ...p, publicado: nuevoEstado } : p
      );
      setProductos(productosActualizados);
      localStorage.setItem('voltech_productos', JSON.stringify(productosActualizados));
      toast.success(`Producto ${nuevoEstado ? 'publicado' : 'ocultado'} en la tienda`);
    };

    const eliminarProducto = async (id) => {
      if (confirm('¿Estás seguro de eliminar este producto?')) {
        if (supabase) {
          await supabase.from('productos').delete().eq('id', id);
        }
        const productosActualizados = productos.filter(p => p.id !== id);
        setProductos(productosActualizados);
        localStorage.setItem('voltech_productos', JSON.stringify(productosActualizados));
        toast.success('Producto eliminado');
      }
    };

    const guardarTasa = async () => {
      const tasaData = { tasa: usarTasaBCV ? tasaBCV : tasaPersonalizada, usarBCV: usarTasaBCV, tasaPersonalizada };
      if (supabase) await supabase.from('settings').upsert({ clave: 'tasa_bcv', valor: tasaData }, { onConflict: 'clave' });
      localStorage.setItem('voltech_tasa_bcv', JSON.stringify(tasaData));
      toast.success('Tasa actualizada');
    };

    const generarPDFCatalogo = () => {
      const productosPublicados = productos.filter(p => p.publicado);
      const contenido = `CATALOGO VOLTECH STORE\n======================\nFecha: ${new Date().toLocaleDateString()}\n\nTotal Productos: ${productosPublicados.length}\n\n${productosPublicados.map(p => `${p.plataforma} ${p.tipo === 'streaming' ? '(Streaming)' : ''} ${p.esCombo ? '(Combo)' : ''}\nSKU: ${p.sku}\nCategoría: ${p.categoria}\nMarca: ${p.marca || 'N/A'}\nEstado: ${p.estado || 'nuevo'}\nPrecio Detal: $${(p.precioDetal || p.precioMayor).toFixed(2)}\n${p.precioOferta > 0 ? `Precio Oferta: $${p.precioOferta.toFixed(2)}\n` : ''}(Bs ${p.precioBs.toFixed(2)})\nStock: ${p.cantidad} unidades\nDuración: ${p.duracion || 'N/A'}\nOferta: ${p.tipoOferta || 'N/A'}\nComisión: ${p.porcentaje_comision || 5}%\n---`).join('\n')}`;
      const blob = new Blob([contenido], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `catalogo_voltech_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Catálogo descargado');
    };

    const productosFiltrados = productos.filter(p =>
      p.plataforma?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.marca?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalProductos = productos.length;
    const stockBajo = productos.filter(p => p.cantidad <= 2).length;
    const agotados = productos.filter(p => p.cantidad === 0).length;
    const valorInventario = productos.reduce((acc, p) => acc + (parseFloat(p.precioMayor || 0) * (p.cantidad || 0)), 0);

    const getEstadoBadge = (estado) => {
      const estilos = { nuevo: 'bg-voltech-success/20 text-voltech-success', oferta: 'bg-voltech-warning/20 text-voltech-warning', kit: 'bg-voltech-cyan/20 text-voltech-cyan', agotado: 'bg-voltech-error/20 text-voltech-error', combo: 'bg-voltech-purple/20 text-voltech-purple' };
      return estilos[estado] || estilos.nuevo;
    };

    const productosParaKit = productos.filter(p => p.tipo === 'fisico' && p.cantidad > 0 && (p.plataforma?.toLowerCase().includes(busquedaKit.toLowerCase()) || p.sku?.toLowerCase().includes(busquedaKit.toLowerCase())));

    const productosFisicos = [...new Set(productos.filter(p => p.tipo === 'fisico').map(p => p.plataforma).filter(Boolean))];
    const plataformasStreaming = [...new Set(productos.filter(p => p.tipo === 'streaming').map(p => p.plataforma).filter(Boolean))];
    const nombresKits = [...new Set(productos.filter(p => p.tipo === 'kit').map(p => p.plataforma).filter(Boolean))];

    const categoriasFisico = useMemo(() => {
      return [...new Set(productos.filter(p => p.tipo === 'fisico').map(p => p.categoria).filter(Boolean))];
    }, [productos]);

    const marcasFisico = useMemo(() => {
      return [...new Set(productos.filter(p => p.tipo === 'fisico').map(p => p.marca).filter(Boolean))];
    }, [productos]);

    const getProductosFisicosFiltrados = (categoria, marca) => {
      return productosFisicos.filter(nombre => {
        const registros = productos.filter(x => x.tipo === 'fisico' && normalizarTexto(x.plataforma) === normalizarTexto(nombre));
        if (registros.length === 0) return false;
        return registros.some(prod =>
          (!categoria || !prod.categoria || normalizarTexto(prod.categoria) === normalizarTexto(categoria)) &&
          (!marca || !prod.marca || normalizarTexto(prod.marca) === normalizarTexto(marca))
        );
      });
    };

    const getCategoriasFiltradas = (marca) => {
      const asociadas = marca
        ? [...new Set(
            productos
              .filter(p => p.tipo === 'fisico' && p.categoria && normalizarTexto(p.marca) === normalizarTexto(marca))
              .map(p => p.categoria)
          )]
        : [];
      return [...new Set([...asociadas, ...categorias])];
    };

    const getMarcasFiltradas = (categoria) => {
      const asociadas = categoria
        ? [...new Set(
            productos
              .filter(p => p.tipo === 'fisico' && p.marca && normalizarTexto(p.categoria) === normalizarTexto(categoria))
              .map(p => p.marca)
          )]
        : [];
      return [...new Set([...asociadas, ...marcas])];
    };

    const opcionesProveedores = proveedores
      .map(pr => pr.nombre || pr.name || pr.razon_social || pr.proveedor || '')
      .filter(Boolean)
      .map(n => ({ value: n, label: n }));

    // ✅ Opciones de Métodos de Pago sincronizadas con Ajustes
    const opcionesMetodosPago = metodosPago.length > 0
      ? metodosPago.map(m => ({
          value: m.id || String(m.nombre || '').toLowerCase().replace(/\s+/g, '_'),
          label: m.nombre || m.id || ''
        }))
      : [
          { value: 'efectivo', label: 'Efectivo' },
          { value: 'pago_movil', label: 'Pago Móvil' },
          { value: 'transferencia', label: 'Transferencia' },
          { value: 'binance', label: 'Binance' },
        ];

    return (
      <div className="space-y-6">
        <Toaster position="top-right" toastOptions={{ style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' }, success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } }, error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } } }} />

        <div className="relative z-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Productos</h1>
            <p className="text-sm text-voltech-muted mt-1">Gestiona tu catálogo e inventario</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button onClick={generarPDFCatalogo} className="flex-1 sm:flex-none px-4 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-cyan transition-all flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Catálogo</button>
            <Link href="/panel/compras" className={`flex-1 sm:flex-none px-4 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-cyan transition-all flex items-center justify-center gap-2 ${!tienePermiso('puedeVerConfiguracion') ? 'hidden' : ''}`}><Database className="w-4 h-4" /> Compras</Link>
            {!showForm && tienePermiso('puedeVerInventarioCompleto') && (
              <button onClick={() => setShowForm(true)} className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Nuevo Producto</button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showGestionModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-voltech-surface border border-voltech-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">
                      Gestionar {gestionTipo === 'categoria' ? 'Categorías' : gestionTipo === 'marca' ? 'Marcas' : 'Nombres de Producto'}
                    </h3>
                    <button onClick={() => { setShowGestionModal(false); setGestionTipo(''); }} className="p-2 rounded-lg hover:bg-voltech-border"><X className="w-5 h-5" /></button>
                  </div>
                  
                  <div className="mb-6 p-4 bg-voltech-dark/50 rounded-lg border border-voltech-border">
                    <h4 className="text-sm font-semibold text-voltech-cyan mb-3">Agregar Nuevo</h4>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={gestionValor}
                        onChange={(e) => setGestionValor(e.target.value)}
                        placeholder="Ingresa el nombre..."
                        className="input-voltech flex-1 rounded-lg px-4 py-2 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && agregarDesdeGestion()}
                      />
                      <button onClick={agregarDesdeGestion} className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Agregar
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-voltech-purple mb-3">
                      {gestionTipo === 'categoria' ? 'Categorías Existentes' : gestionTipo === 'marca' ? 'Marcas Existentes' : 'Nombres Existentes'}
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {(gestionTipo === 'categoria' ? categorias : gestionTipo === 'marca' ? marcas : 
                        (gestionSubtipo === 'streaming' ? plataformasStreaming : 
                        gestionSubtipo === 'kit' ? nombresKits : productosFisicos)
                      ).map((valor, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-voltech-dark/50 p-3 rounded-lg border border-voltech-border">
                          <span className="text-sm text-white flex-1">{valor}</span>
                          <button 
                            onClick={() => eliminarDesdeGestion(gestionTipo, valor)}
                            className="p-2 text-voltech-error hover:bg-voltech-error/10 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(gestionTipo === 'categoria' ? categorias : gestionTipo === 'marca' ? marcas : 
                        (gestionSubtipo === 'streaming' ? plataformasStreaming : 
                        gestionSubtipo === 'kit' ? nombresKits : productosFisicos)
                      ).length === 0 && (
                        <p className="text-xs text-voltech-muted text-center py-4">No hay registros</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-voltech-cyan/20"><Package className="w-5 h-5 text-voltech-cyan" /></div>
              <div><p className="text-xs text-voltech-muted">Total Productos</p><p className="text-xl font-bold text-white">{totalProductos}</p></div>
            </div>
          </div>
          <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-voltech-warning/20"><AlertTriangle className="w-5 h-5 text-voltech-warning" /></div>
              <div><p className="text-xs text-voltech-muted">Stock Bajo</p><p className="text-xl font-bold text-white">{stockBajo}</p></div>
            </div>
          </div>
          <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-voltech-error/20"><X className="w-5 h-5 text-voltech-error" /></div>
              <div><p className="text-xs text-voltech-muted">Agotados</p><p className="text-xl font-bold text-white">{agotados}</p></div>
            </div>
          </div>
          <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-voltech-success/20"><TrendingUp className="w-5 h-5 text-voltech-success" /></div>
              <div><p className="text-xs text-voltech-muted">Valor Inventario</p><p className="text-xl font-bold text-white">{tienePermiso('puedeVerInventarioCompleto') ? `$${valorInventario.toFixed(2)}` : '---'}</p></div>
            </div>
          </div>
        </div>

        {tienePermiso('puedeVerConfiguracion') && (
          <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div><h3 className="text-sm font-semibold text-white">Tasa de Cambio</h3><p className="text-xs text-voltech-muted">Configura la tasa para calcular precios en Bs</p></div>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={usarTasaBCV} onChange={(e) => setUsarTasaBCV(e.target.checked)} className="w-4 h-4 rounded border-voltech-border bg-voltech-dark text-voltech-cyan" /><span className="text-xs text-voltech-muted">Usar tasa BCV</span></label>
                <div className="flex items-center gap-2"><span className="text-xs text-voltech-muted">Tasa:</span><input type="number" step="0.01" value={usarTasaBCV ? tasaBCV : tasaPersonalizada} onChange={(e) => usarTasaBCV ? setTasaBCV(parseFloat(e.target.value)) : setTasaPersonalizada(parseFloat(e.target.value))} className="input-voltech w-20 md:w-24 rounded-lg px-2 md:px-3 py-1 text-sm min-w-0" /><span className="text-xs text-voltech-muted shrink-0">Bs/$</span></div>
                <button onClick={guardarTasa} className="px-3 py-1 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-xs hover:bg-voltech-cyan/30 transition-colors">Guardar</button>
              </div>
            </div>
          </div>
        )}

        {selectedProducts.length > 0 && tienePermiso('puedeVerInventarioCompleto') && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-voltech-purple/20 border border-voltech-purple rounded-xl p-3 md:p-4 flex flex-col gap-2 w-full max-w-full md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <CheckCircle className="w-5 h-5 text-voltech-purple shrink-0" />
              <span className="text-sm text-white font-medium truncate">{selectedProducts.length} producto(s) seleccionado(s)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:flex md:items-center">
              <button onClick={() => setShowBulkCommissionModal(true)} className="text-xs py-2 px-2 text-center w-full md:w-auto md:text-sm md:px-4 md:py-2 bg-voltech-purple text-white rounded-lg font-medium hover:bg-voltech-purple/80 transition-colors flex items-center justify-center gap-1.5"><Percent className="w-4 h-4 shrink-0" /> Asignar % Comisión</button>
              <button onClick={eliminarSeleccionados} className="text-xs py-2 px-2 text-center w-full md:w-auto md:text-sm md:px-4 md:py-2 bg-voltech-error/20 text-voltech-error rounded-lg font-medium hover:bg-voltech-error/30 transition-colors flex items-center justify-center gap-1.5"><Trash2 className="w-4 h-4 shrink-0" /> Eliminar Seleccionados</button>
              <button onClick={() => setSelectedProducts([])} className="col-span-2 md:col-span-1 w-full md:w-auto px-2 py-2 bg-voltech-surface border border-voltech-border text-voltech-muted rounded-lg text-xs md:text-sm hover:text-white transition-colors flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {showBulkCommissionModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-voltech-surface border border-voltech-border rounded-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Percent className="w-5 h-5 text-voltech-purple" /> Asignar Comisión Masiva</h3>
                <p className="text-sm text-voltech-muted mb-4">Asignando a {selectedProducts.length} producto(s)</p>
                <div className="mb-6">
                  <label className="block text-xs text-voltech-muted mb-2">Porcentaje de Comisión (%)</label>
                  <input type="number" step="0.01" value={bulkCommissionPercent} onChange={(e) => setBulkCommissionPercent(parseFloat(e.target.value))} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" placeholder="5" />
                </div>
                <div className="flex gap-3">
                  <button onClick={asignarComisionMasiva} className="flex-1 btn-neon text-white font-bold py-3 rounded-lg">Asignar Comisión</button>
                  <button onClick={() => { setShowBulkCommissionModal(false); setBulkCommissionPercent(5); }} className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-voltech-muted hover:text-white">Cancelar</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-voltech-cyan" />Nuevo Producto{items.length > 1 && `s (${items.length} items)`}</h2>
                  <button onClick={() => { setShowForm(false); setItems([{ id: crypto.randomUUID(), tipo: 'fisico', imagen: '', imagenFile: null, sku: '', fecha: new Date().toISOString().split('T')[0], comprador: '', proveedor: '', plataforma: '', categoria: '', marca: '', cantidad: 1, metodoPago: 'efectivo', cartera: '', precioMayor: 0, precioDetal: 0, precioOferta: 0, estado: 'nuevo', precioBs: 0, total: 0, monedaCompra: 'usd', duracion: '', tipoOferta: '', esCombo: false, plataformasCombo: [], porcentaje_comision: 5, productos_kit: [], precio_costo_total: 0, precio_individual_total: 0, descripcion_detallada: '' }]); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-6">
                  {items.map((item, itemIndex) => {
                    const categoriasDisponibles = item.tipo === 'fisico' 
                      ? getCategoriasFiltradas(item.marca)
                      : [];
                    const marcasDisponibles = item.tipo === 'fisico'
                      ? getMarcasFiltradas(item.categoria)
                      : [];
                    const productosDisponibles = item.tipo === 'fisico'
                      ? getProductosFisicosFiltrados(item.categoria, item.marca)
                      : (item.tipo === 'streaming' ? plataformasStreaming : nombresKits);

                    return (
                    <div key={item.id} className="border border-voltech-border rounded-lg p-4 relative">
                      {items.length > 1 && (<button onClick={() => eliminarItem(itemIndex)} className="absolute top-2 right-2 p-2 rounded-lg hover:bg-voltech-error/10 text-voltech-muted hover:text-voltech-error transition-colors"><Minus className="w-4 h-4" /></button>)}
                      <h3 className="text-sm font-semibold text-voltech-muted mb-4">Producto {itemIndex + 1}</h3>
                      
                      <div className="mb-4">
                        <label className="block text-xs text-voltech-muted mb-2 ml-1">Tipo de Producto</label>
                        <div className="grid grid-cols-3 gap-1.5 w-full md:flex md:gap-3">
                          <button type="button" onClick={() => handleChange(itemIndex, 'tipo', 'fisico')} className={`flex-1 py-2 md:py-3 px-1 md:px-3 rounded-lg border flex items-center justify-center gap-1 md:gap-2 transition-all text-xs md:text-sm ${item.tipo === 'fisico' ? 'bg-voltech-cyan/20 border-voltech-cyan text-voltech-cyan' : 'bg-voltech-dark border-voltech-border text-voltech-muted hover:border-voltech-cyan'}`}><Package className="w-3 h-3 md:w-4 md:h-4 shrink-0" /><span className="truncate">Físico</span></button>
                          <button type="button" onClick={() => handleChange(itemIndex, 'tipo', 'streaming')} className={`flex-1 py-2 md:py-3 px-1 md:px-3 rounded-lg border flex items-center justify-center gap-1 md:gap-2 transition-all text-xs md:text-sm ${item.tipo === 'streaming' ? 'bg-voltech-purple/20 border-voltech-purple text-voltech-purple' : 'bg-voltech-dark border-voltech-border text-voltech-muted hover:border-voltech-purple'}`}><MonitorPlay className="w-3 h-3 md:w-4 md:h-4 shrink-0" /><span className="truncate">Streaming</span></button>
                          <button type="button" onClick={() => handleChange(itemIndex, 'tipo', 'kit')} className={`flex-1 py-2 md:py-3 px-1 md:px-3 rounded-lg border flex items-center justify-center gap-1 md:gap-2 transition-all text-xs md:text-sm ${item.tipo === 'kit' ? 'bg-voltech-cyan/20 border-voltech-cyan text-voltech-cyan' : 'bg-voltech-dark border-voltech-border text-voltech-muted hover:border-voltech-cyan'}`}><Gift className="w-3 h-3 md:w-4 md:h-4 shrink-0" /><span className="truncate">Kit</span></button>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-xs text-voltech-muted mb-2 ml-1">📦 Disponibilidad / Stock</label>
                        <div className="grid grid-cols-2 gap-1.5 w-full">
                          <button type="button" onClick={() => handleChange(itemIndex, 'disponibilidad', 'stock')} className={`py-2 px-2 rounded-lg border flex items-center justify-center gap-2 transition-all text-xs md:text-sm ${item.disponibilidad !== 'bajo_pedido' ? 'bg-voltech-success/20 border-voltech-success text-voltech-success' : 'bg-voltech-dark border-voltech-border text-voltech-muted hover:border-voltech-success'}`}>
                            <Package className="w-4 h-4 shrink-0" /><span className="truncate">📦 Stock físico</span>
                          </button>
                          <button type="button" onClick={() => handleChange(itemIndex, 'disponibilidad', 'bajo_pedido')} className={`py-2 px-2 rounded-lg border flex items-center justify-center gap-2 transition-all text-xs md:text-sm ${item.disponibilidad === 'bajo_pedido' ? 'bg-voltech-warning/20 border-voltech-warning text-voltech-warning' : 'bg-voltech-dark border-voltech-border text-voltech-muted hover:border-voltech-warning'}`}>
                            <ShoppingCart className="w-4 h-4 shrink-0" /><span className="truncate">🛒 Compra al momento</span>
                          </button>
                        </div>
                        {item.disponibilidad === 'bajo_pedido' && (
                          <p className="text-[10px] text-voltech-warning mt-1">ℹ️ Se publicará en el catálogo aunque el stock sea 0. Lo compras al proveedor cuando se venda.</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                              <div className="lg:col-span-3">
                        <label className="block text-xs text-voltech-muted mb-1 ml-1">
                          🖼️ Imágenes del Producto <span className="text-[10px]">(agrega todas las que quieras)</span>
                        </label>
                        <div
                          onDragOver={(e) => { e.preventDefault(); }}
                          onDrop={(e) => { e.preventDefault(); handleImagenesItem(itemIndex, e.dataTransfer.files); }}
                          onClick={() => fileInputItemRefs.current[itemIndex]?.click()}
                          className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer border-voltech-border hover:border-voltech-cyan transition-colors"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-6 h-6 text-voltech-muted" />
                            <p className="text-sm text-voltech-muted">Arrastra o haz clic (puedes elegir varias)</p>
                          </div>
                        </div>
                        <input
                          ref={(el) => (fileInputItemRefs.current[itemIndex] = el)}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => { handleImagenesItem(itemIndex, e.target.files); e.target.value = ''; }}
                          className="hidden"
                        />
                        {(item.imagenes?.length || 0) > 0 && (
                          <div className="flex gap-3 flex-wrap mt-3">
                            {(item.imagenes || []).map((img, i) => {
                              const esPortada = item.imagen === img;
                              return (
                                <div key={i} className="w-28">
                                  <div className="relative">
                                    <img
                                      src={img}
                                      alt={`Img ${i + 1}`}
                                      className={`w-28 h-28 object-cover rounded-lg border-2 ${esPortada ? 'border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]' : 'border-voltech-border'}`}
                                    />
                                    <button
                                      type="button"
                                      title="Quitar"
                                      onClick={() => quitarImagenItem(itemIndex, img)}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setPortadaItem(itemIndex, img)}
                                    className={`w-full text-[9px] px-1.5 py-1 rounded-full transition-all mt-1.5 ${esPortada ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(34,211,238,0.6)]' : 'bg-gray-800/80 text-gray-400 opacity-70 hover:opacity-100'}`}
                                  >
                                    {esPortada ? '★ Portada' : 'Portada'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                        <div><label className="block text-xs text-voltech-muted mb-1 ml-1">SKU (automático)</label><input type="text" value={item.sku} readOnly className="input-voltech w-full rounded-lg px-4 py-2 text-sm font-mono text-voltech-cyan bg-voltech-dark/50" /></div>
                        
                        <div className="flex flex-col gap-1 w-full lg:col-span-2">
                          <label className="text-xs text-voltech-muted font-medium">
                            {item.tipo === 'streaming' ? 'Nombre Plataforma *' : item.tipo === 'kit' ? 'Nombre del Kit *' : 'Nombre del Producto *'}
                          </label>
                          <div className="flex items-center gap-2 w-full min-w-0">
                            <CustomSelect
                              value={item.plataforma}
                              onChange={(value) => handleChange(itemIndex, 'plataforma', value)}
                              options={productosDisponibles.map(nombre => ({ value: nombre, label: nombre }))}
                              placeholder="-- Selecciona --"
                              className="flex-1 min-w-0"
                            />
                            <button 
                              type="button" 
                              onClick={() => abrirGestionModal('plataforma', item.tipo)} 
                              className="h-[42px] w-[42px] flex items-center justify-center shrink-0 rounded-md bg-voltech-cyan/10 text-voltech-cyan border border-voltech-cyan/30 hover:bg-voltech-cyan/20 transition-all"
                              title="Gestionar"
                            >
                              <Plus className="w-5 h-5"/>
                            </button>
                          </div>
                        </div>
                        
                        {item.tipo === 'fisico' ? (
                          <div className="flex flex-col gap-1 w-full">
                            <label className="text-xs text-voltech-muted font-medium">Categoría *</label>
                            <div className="flex items-center gap-2 w-full min-w-0">
                              <CustomSelect
                                value={item.categoria}
                                onChange={(value) => handleChange(itemIndex, 'categoria', value)}
                                options={categoriasDisponibles.map(cat => ({ value: cat, label: cat }))}
                                placeholder="-- Selecciona --"
                                className="flex-1 min-w-0"
                              />
                              <button 
                                type="button" 
                                onClick={() => abrirGestionModal('categoria')} 
                                className="h-[42px] w-[42px] flex items-center justify-center shrink-0 rounded-md bg-voltech-cyan/10 text-voltech-cyan border border-voltech-cyan/30 hover:bg-voltech-cyan/20 transition-all"
                                title="Gestionar"
                              >
                                <Plus className="w-5 h-5"/>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 w-full">
                            <label className="text-xs text-voltech-muted font-medium">Categoría (Fija)</label>
                            <input type="text" value={item.categoria} readOnly className="input-voltech w-full rounded-md px-4 py-2 text-sm bg-voltech-dark/50 cursor-not-allowed border border-voltech-border" />
                          </div>
                        )}

                        {item.tipo === 'fisico' && (
                          <div className="flex flex-col gap-1 w-full">
                            <label className="text-xs text-voltech-muted font-medium">Marca *</label>
                            <div className="flex items-center gap-2 w-full min-w-0">
                              <CustomSelect
                                value={item.marca}
                                onChange={(value) => handleChange(itemIndex, 'marca', value)}
                                options={marcasDisponibles.map(marca => ({ value: marca, label: marca }))}
                                placeholder="-- Selecciona --"
                                className="flex-1 min-w-0"
                              />
                              <button 
                                type="button" 
                                onClick={() => abrirGestionModal('marca')} 
                                className="h-[42px] w-[42px] flex items-center justify-center shrink-0 rounded-md bg-voltech-cyan/10 text-voltech-cyan border border-voltech-cyan/30 hover:bg-voltech-cyan/20 transition-all"
                                title="Gestionar"
                              >
                                <Plus className="w-5 h-5"/>
                              </button>
                            </div>
                          </div>
                        )}

                        {item.tipo === 'kit' && (
                          <div className="lg:col-span-3 space-y-3">
                            <label className="block text-xs text-voltech-muted mb-1 ml-1">Seleccionar Productos del Inventario</label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
                              <input type="text" value={busquedaKit} onChange={(e) => setBusquedaKit(e.target.value)} placeholder="Buscar por nombre o SKU..." className="input-voltech w-full rounded-lg pl-10 pr-4 py-2 text-sm" />
                            </div>
                            <div className="max-h-60 overflow-y-auto border border-voltech-border rounded-lg bg-voltech-dark/30 p-2 space-y-2">
                              {((productosParaKit && productosParaKit.length > 0) ? productosParaKit : (productos || []).filter(p => p.tipo !== 'streaming' && !p.esCombo && !p.esKit && ((p.plataforma || p.producto || '').toLowerCase().includes((busquedaKit || '').toLowerCase()) || (p.sku || '').toLowerCase().includes((busquedaKit || '').toLowerCase())))).map((prod, idx) => {
                                const enKit = (item.productos_kit || []).find(p => p.producto_id === prod.id);
                                return (
                                  <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${enKit ? 'bg-voltech-cyan/10 border-voltech-cyan' : 'bg-voltech-surface border-voltech-border hover:border-voltech-cyan/50'}`}>
                                    <div className="flex items-center gap-3 flex-1">
                                      <input type="checkbox" checked={!!enKit} onChange={() => toggleProductoKit(itemIndex, prod)} className="w-4 h-4 rounded border-voltech-border text-voltech-cyan" />
                                      {prod.imagen ? <img src={prod.imagen} alt={prod.plataforma} className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-voltech-dark flex items-center justify-center"><ImageIcon className="w-5 h-5 text-voltech-muted" /></div>}
                                      <div>
                                        <p className="text-sm font-medium text-white">{prod.plataforma || prod.producto}</p>
                                        <p className="text-xs text-voltech-muted">SKU: {prod.sku} | Stock: {prod.cantidad}</p>
                                      </div>
                                    </div>
                                    {enKit && (
                                      <div className="flex items-center gap-2">
                                        <button onClick={() => actualizarCantidadKit(itemIndex, prod.id, enKit.cantidad - 1)} className="p-1 hover:bg-voltech-border rounded"><Minus className="w-3 h-3" /></button>
                                        <span className="text-sm font-bold w-6 text-center">{enKit.cantidad}</span>
                                        <button onClick={() => actualizarCantidadKit(itemIndex, prod.id, enKit.cantidad + 1)} className="p-1 hover:bg-voltech-border rounded"><Plus className="w-3 h-3" /></button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {((productosParaKit && productosParaKit.length > 0) ? productosParaKit : (productos || []).filter(p => p.tipo !== 'streaming' && !p.esCombo && !p.esKit)).length === 0 && <p className="text-center text-xs text-voltech-muted py-4">No se encontraron productos</p>}
                            </div>
                          </div>
                        )}

                        <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Cantidad</label><input type="number" value={item.cantidad} onChange={(e) => handleChange(itemIndex, 'cantidad', e.target.value)} min="0" className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                        
                        {item.tipo === 'kit' && (item.productos_kit || []).length > 0 && (
                          <div className="lg:col-span-3 bg-voltech-dark/50 border border-voltech-border rounded-lg p-4 space-y-2">
                            <h4 className="text-sm font-bold text-voltech-cyan flex items-center gap-2"><DollarSign className="w-4 h-4" /> Resumen Financiero del Kit</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div><p className="text-xs text-voltech-muted">Inversión Total:</p><p className="font-bold text-white">${(item.precio_costo_total || 0).toFixed(2)}</p></div>
                              <div><p className="text-xs text-voltech-muted">Valor Individual:</p><p className="font-bold text-white">${(item.precio_individual_total || 0).toFixed(2)}</p></div>
                              <div>
                                <label className="text-xs text-voltech-muted block">Precio del Kit ($):</label>
                                <input type="number" step="0.01" value={item.precioDetal} onChange={(e) => handleChange(itemIndex, 'precioDetal', e.target.value)} className="input-voltech w-full rounded px-2 py-1 text-sm font-bold text-voltech-success" />
                              </div>
                              <div><p className="text-xs text-voltech-muted">Ganancia Estimada:</p><p className="font-bold text-voltech-success">${(item.precioDetal - (item.precio_costo_total || 0)).toFixed(2)}</p></div>
                            </div>
                          </div>
                        )}

                        {item.tipo !== 'kit' && (
                          <>
                            {item.tipo === 'fisico' && tienePermiso('puedeVerInventarioCompleto') && (<div><label className="block text-xs text-voltech-muted mb-1 ml-1">Precio Mayor ($) <span className="text-voltech-warning">(Tu costo)</span></label><input type="number" step="0.01" value={item.precioMayor} onChange={(e) => handleChange(itemIndex, 'precioMayor', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>)}
                            <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Precio Detal ($) <span className="text-voltech-success">(Venta al público)</span></label><input type="number" step="0.01" value={item.precioDetal} onChange={(e) => handleChange(itemIndex, 'precioDetal', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Precio de venta" />{item.tipo === 'fisico' && tienePermiso('puedeVerInventarioCompleto') && item.precioMayor > 0 && item.precioDetal > 0 && (<p className="text-xs text-voltech-success mt-1">Ganancia: ${(item.precioDetal - item.precioMayor).toFixed(2)} ({((item.precioDetal - item.precioMayor) / item.precioMayor * 100).toFixed(0)}%)</p>)}</div>
                          </>
                        )}
                        
                        <div>
                          <CustomSelect
                            label="Estado"
                            value={item.estado}
                            onChange={(value) => handleChange(itemIndex, 'estado', value)}
                            options={[
                              { value: 'nuevo', label: 'Nuevo' },
                              { value: 'oferta', label: 'Oferta' },
                              { value: 'kit', label: 'Kit' },
                              { value: 'agotado', label: 'Agotado' }
                            ]}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-voltech-muted mb-1 ml-1">Precio Oferta ($) <span className="text-voltech-warning">(Opcional)</span></label>
                          <input type="number" step="0.01" value={item.precioOferta} onChange={(e) => handleChange(itemIndex, 'precioOferta', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="0.00" />
                        </div>

                        <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Precio (Bs)</label><input type="number" step="0.01" value={item.precioBs} readOnly className="input-voltech w-full rounded-lg px-4 py-2 text-sm font-bold text-voltech-cyan bg-voltech-dark/50" /></div>
                        <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Total</label><input type="number" step="0.01" value={item.total} readOnly className="input-voltech w-full rounded-lg px-4 py-2 text-sm font-bold text-voltech-success bg-voltech-dark/50" /></div>
                        
                        {/* ✅ DATOS DE COMPRA: NO aplican en Kits (se arman con inventario existente) */}
                        {item.tipo !== 'kit' && (
                          <>
                            <div>
                              <CustomSelect
                                label="Método de Pago"
                                value={item.metodoPago}
                                onChange={(value) => handleChange(itemIndex, 'metodoPago', value)}
                                options={[...opcionesMetodosPago, { value: 'por_comprar', label: '🛒 Se compra al momento' }]}
                              />
                            </div>
                            <div>
                              <CustomSelect
                                label="Cartera"
                                value={item.cartera}
                                onChange={(value) => handleChange(itemIndex, 'cartera', value)}
                                options={[{ value: '', label: '-- Selecciona --' }, ...carteras.map(c => ({ value: c.nombre, label: c.nombre })), { value: 'por_comprar', label: '🛒 Por comprar (al momento)' }]}
                              />
                            </div>
                            {tienePermiso('puedeVerInventarioCompleto') && (
                              <div>
                                <CustomSelect
                                  label="Proveedor (Compra)"
                                  value={item.proveedor}
                                  onChange={(value) => handleChange(itemIndex, 'proveedor', value)}
                                  options={[{ value: '', label: '-- Selecciona --' }, ...opcionesProveedores]}
                                />
                              </div>
                            )}
                            {tienePermiso('puedeVerInventarioCompleto') && (
                              <div>
                                <label className="block text-xs text-voltech-muted mb-1 ml-1">Comprador (automático)</label>
                                <input type="text" value={usuarioActual || 'Administrador'} readOnly className="input-voltech w-full rounded-lg px-4 py-2 text-sm bg-voltech-dark/50 cursor-not-allowed" />
                              </div>
                            )}
                          </>
                        )}

                        <div><label className="block text-xs text-voltech-muted mb-1 ml-1">% Comisión por Venta</label><input type="number" step="0.01" value={item.porcentaje_comision} onChange={(e) => handleChange(itemIndex, 'porcentaje_comision', e.target.value)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                        
                        <div className="lg:col-span-3">
                          <label className="block text-xs text-voltech-muted mb-1 ml-1">Descripción Detallada (para Chatbot)</label>
                          <textarea 
                            value={item.descripcion_detallada || ''} 
                            onChange={(e) => handleChange(itemIndex, 'descripcion_detallada', e.target.value)} 
                            className="input-voltech w-full rounded-lg px-4 py-2 text-sm h-24 resize-none" 
                            placeholder="Ej: Batería de 5000mAh, carga rápida 25W, resistencia al agua IP68, incluye cargador y cable USB-C..."
                          />
                          <p className="text-xs text-voltech-muted mt-1">Esta información será usada por el chatbot para responder preguntas de los clientes</p>
                        </div>
                      </div>
                    </div>
                  );})}
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
                  <button onClick={agregarItem} className="w-full sm:w-auto px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-cyan transition-all flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Agregar Otro Producto</button>
                  <button onClick={guardarProductos} className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Save className="w-5 h-5" />Guardar {items.length > 1 ? `${items.length} Productos` : 'Producto'}</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showComboModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-2xl w-full max-w-lg">
                <div className="border-b border-voltech-border p-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2"><Layers className="w-5 h-5 text-voltech-purple" />Crear Combo de Plataformas</h2>
                  <button onClick={() => setShowComboModal(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Nombre del Combo *</label><input type="text" value={comboNombre} onChange={(e) => setComboNombre(e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" placeholder="Ej: Pack Entretenimiento, Super Combo..." /></div>
                  <div><label className="block text-xs text-voltech-muted mb-2 ml-1">Selecciona las Plataformas (mínimo 2)</label><div className="space-y-2 max-h-48 overflow-y-auto border border-voltech-border rounded-lg p-3">{comboPlataformas.length === 0 ? (<p className="text-sm text-voltech-muted text-center py-4">No hay plataformas disponibles para crear combo</p>) : (comboPlataformas.map((plataforma) => (<label key={plataforma} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-voltech-border/50 rounded"><input type="checkbox" value={plataforma} onChange={(e) => { if (e.target.checked) { setComboPlataformas([...comboPlataformas, plataforma]); } else { setComboPlataformas(comboPlataformas.filter(p => p !== plataforma)); } }} className="w-4 h-4 rounded border-voltech-border bg-voltech-dark text-voltech-purple" /><span className="text-sm text-white">{plataforma}</span></label>)))}</div><p className="text-xs text-voltech-muted mt-2">Seleccionadas: {comboPlataformas.length}</p></div>
                  <button onClick={crearCombo} disabled={comboPlataformas.length < 2 || !comboNombre} className="w-full btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Layers className="w-4 h-4" />Crear Combo</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
            <input type="text" placeholder="Buscar por nombre, SKU, categoría o marca..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-voltech w-full rounded-lg pl-10 pr-4 py-3 text-sm" />
          </div>
          <div className="flex gap-2 shrink-0 justify-center sm:justify-end">
            <button onClick={() => setVista('tabla')} className={`flex-1 sm:flex-none px-4 py-3 sm:p-3 rounded-lg transition-colors ${vista === 'tabla' ? 'bg-voltech-cyan/20 text-voltech-cyan' : 'bg-voltech-surface border border-voltech-border text-voltech-muted hover:text-white'}`} title="Vista tabla">
              <Table className="w-5 h-5 inline sm:block" />
              <span className="sm:hidden text-xs ml-2">Tabla</span>
            </button>
            <button onClick={() => setVista('grid')} className={`flex-1 sm:flex-none px-4 py-3 sm:p-3 rounded-lg transition-colors ${vista === 'grid' ? 'bg-voltech-cyan/20 text-voltech-cyan' : 'bg-voltech-surface border border-voltech-border text-voltech-muted hover:text-white'}`} title="Vista grid">
              <LayoutGrid className="w-5 h-5 inline sm:block" />
              <span className="sm:hidden text-xs ml-2">Grid</span>
            </button>
          </div>
        </div>

        {vista === 'tabla' ? (
          <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden w-full">
            {/* ✅ Vista Card Móvil (< md) */}
            <div className="block md:hidden space-y-3 p-3">
              {productosFiltrados.length === 0 ? (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-center">
                  <Package className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                  <p className="text-xs text-slate-400">No hay productos registrados</p>
                  <p className="text-[10px] text-slate-500 mt-1">Haz clic en "Nuevo Producto" para comenzar</p>
                </div>
              ) : (
                productosFiltrados.map((producto) => {
                  const isSelected = selectedProducts.includes(producto.id);
                  const isEditing = editandoId === producto.id;
                  return (
                    <div key={producto.id} className={`bg-slate-800/60 border rounded-2xl p-4 space-y-3 ${isSelected ? 'border-purple-500' : 'border-slate-700/50'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          {producto.imagen ? (
                            <img src={producto.imagen} alt={producto.plataforma} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                              <ImageIcon className="w-6 h-6 text-slate-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-100 truncate">{producto.plataforma}</h4>
                            <p className="text-[10px] text-slate-400 font-mono truncate">{producto.sku || 'N/A'}</p>
                          </div>
                        </div>
                        {tienePermiso('puedeVerInventarioCompleto') && (
                          <input type="checkbox" checked={isSelected} onChange={() => toggleProductSelection(producto.id)} className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-cyan-400 shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${producto.tipo === 'streaming' ? 'bg-purple-500/20 text-purple-300' : producto.tipo === 'kit' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                          {producto.tipo === 'streaming' ? '📺 Streaming' : producto.tipo === 'kit' ? '🎁 Kit' : '📦 Físico'}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${getEstadoBadge(producto.estado)}`}>
                          {producto.estado ? producto.estado.charAt(0).toUpperCase() + producto.estado.slice(1) : 'Nuevo'}
                        </span>
                        {producto.esCombo && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">🎯 Combo</span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-700/40 grid grid-cols-2 gap-2 text-[11px]">
                        <div><span className="text-slate-400 block">Categoría:</span><span className="text-slate-200 truncate block">{producto.categoria || 'N/A'}</span></div>
                        <div><span className="text-slate-400 block">Marca:</span><span className="text-slate-200 truncate block">{producto.marca || 'N/A'}</span></div>
                        <div><span className="text-slate-400 block">Stock:</span><span className={`${producto.cantidad === 0 ? 'text-rose-300' : producto.cantidad <= 2 ? 'text-amber-300' : 'text-emerald-300'} font-bold`}>{producto.cantidad} unid.</span></div>
                        <div><span className="text-slate-400 block">Comisión:</span><span className="text-purple-300 font-bold">{producto.porcentaje_comision || 5}%</span></div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/40">
                        <div>
                          {producto.precioOferta > 0 && producto.estado === 'oferta' ? (
                            <>
                              <p className="text-[10px] text-slate-500 line-through">${Number(producto.precioDetal || producto.precioMayor || 0).toFixed(2)}</p>
                              <p className="text-sm font-bold text-amber-300">${Number(producto.precioOferta || 0).toFixed(2)}</p>
                            </>
                          ) : (
                            <p className="text-sm font-bold text-slate-100">${Number(producto.precioDetal || producto.precioMayor || 0).toFixed(2)}</p>
                          )}
                          <p className="text-[10px] text-slate-400">Bs {producto.precioBs.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => togglePublicado(producto.id)} className={`p-1.5 rounded-lg transition-colors ${producto.publicado ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'}`} title={producto.publicado ? 'Ocultar' : 'Publicar'}>
                            {producto.publicado ? <Globe size={14} /> : <EyeOff size={14} />}
                          </button>
                          {tienePermiso('puedeVerInventarioCompleto') && (
                            <>
                              <button onClick={() => abrirEdicion(producto)} className="p-1.5 text-slate-400 hover:text-cyan-400" title="Editar"><Edit size={14} /></button>
                              <button onClick={() => eliminarProducto(producto.id)} className="p-1.5 text-slate-400 hover:text-rose-400" title="Eliminar"><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* ✅ FORMULARIO INLINE DE EDICIÓN (MÓVIL) */}
                      {editandoId === producto.id && tienePermiso('puedeVerInventarioCompleto') && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          className="bg-voltech-surface border-2 border-voltech-cyan rounded-xl p-4 space-y-3 mt-2"
                        >
                          <h4 className="text-sm font-bold text-voltech-cyan flex items-center gap-2">
                            <Edit className="w-4 h-4" /> Editando: {producto.plataforma}
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-voltech-muted">Precio Detal ($)</label>
                              <input type="number" step="0.01" value={editData.precioDetal} onChange={(e) => setEditData({ ...editData, precioDetal: parseFloat(e.target.value) || 0 })} className="input-voltech w-full rounded px-2 py-1.5 text-sm" />
                            </div>
                            <div>
                              <label className="text-xs text-voltech-muted">Precio Oferta ($)</label>
                              <input type="number" step="0.01" value={editData.precioOferta} onChange={(e) => setEditData({ ...editData, precioOferta: parseFloat(e.target.value) || 0 })} className="input-voltech w-full rounded px-2 py-1.5 text-sm" />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-voltech-muted">Descripción</label>
                            <textarea value={editData.descripcion} onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })} className="input-voltech w-full rounded px-2 py-1.5 text-sm h-16" />
                          </div>
                                                  <div className="col-span-2">
                          <label className="text-xs text-voltech-muted">🖼️ Imágenes del Producto <span className="text-[10px]">(múltiples + portada)</span></label>
                          <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragOverEdit(true); }}
                            onDragLeave={() => setIsDragOverEdit(false)}
                            onDrop={(e) => { e.preventDefault(); setIsDragOverEdit(false); handleImagenesEdit(e.dataTransfer.files); }}
                            onClick={() => fileInputEditRef.current?.click()}
                            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${isDragOverEdit ? 'border-voltech-cyan bg-voltech-cyan/10' : 'border-voltech-border'}`}
                          >
                            <Upload className="w-5 h-5 text-voltech-muted mx-auto" />
                            <p className="text-xs text-voltech-muted mt-1">Arrastra o haz clic (varias imágenes)</p>
                          </div>
                          <input ref={fileInputEditRef} type="file" accept="image/*" multiple onChange={(e) => { handleImagenesEdit(e.target.files); e.target.value = ''; }} className="hidden" />
                          {todasImagenesEdit.length > 0 && (
                            <div className="flex gap-2 flex-wrap mt-2">
                              {todasImagenesEdit.map((img, i) => {
                                const esPortada = editData.imagen === img;
                                return (
                                  <div key={i} className="w-20">
                                    <div className="relative">
                                      <img src={img} alt={`Img ${i+1}`} className={`w-20 h-20 object-cover rounded border-2 ${esPortada ? 'border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'border-voltech-border'}`} />
                                      <button type="button" onClick={() => quitarImagenEdit(img)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]"><X className="w-2.5 h-2.5" /></button>
                                    </div>
                                    <button type="button" onClick={() => setPortadaEdit(img)} className={`w-full text-[8px] px-1 py-0.5 rounded-full mt-1 ${esPortada ? 'bg-cyan-500 text-black font-bold' : 'bg-gray-800/80 text-gray-400'}`}>
                                      {esPortada ? '★ Portada' : 'Portada'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                          <div className="flex gap-2 pt-2">
                            <button onClick={() => guardarEdicion(producto.id)} className="flex-1 bg-voltech-cyan text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1"><Save className="w-4 h-4" /> Guardar</button>
                            <button onClick={cancelarEdicion} className="flex-1 bg-voltech-surface border border-voltech-border text-voltech-muted py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 hover:text-white"><X className="w-4 h-4" /> Cancelar</button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* ✅ Vista Tabla Desktop (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[760px] md:min-w-0">
                <thead className="bg-voltech-dark border-b border-voltech-border">
                  <tr>
                    {tienePermiso('puedeVerInventarioCompleto') && (<th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted"><input type="checkbox" checked={selectedProducts.length === productosFiltrados.length && productosFiltrados.length > 0} onChange={selectAll} className="w-4 h-4 rounded border-voltech-border bg-voltech-dark text-voltech-cyan" /></th>)}
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">SKU</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Producto</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Categoría</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Marca</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Stock</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Precio</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">% Comisión</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted">Publicado</th>
                    {tienePermiso('puedeVerInventarioCompleto') && (<th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>)}
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.length === 0 ? (
                    <tr><td colSpan={tienePermiso('puedeVerInventarioCompleto') ? 12 : 10} className="text-center py-12 text-voltech-muted"><Package className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No hay productos registrados</p><p className="text-xs mt-1">Haz clic en "Nuevo Producto" para comenzar</p></td></tr>
                  ) : (
                    productosFiltrados.map((producto) => (
                      <Fragment key={producto.id}>
                        <tr className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors">
                          {tienePermiso('puedeVerInventarioCompleto') && (<td className="px-4 py-3 text-center"><input type="checkbox" checked={selectedProducts.includes(producto.id)} onChange={() => toggleProductSelection(producto.id)} className="w-4 h-4 rounded border-voltech-border bg-voltech-dark text-voltech-cyan" /></td>)}
                          <td className="px-4 py-3"><span className="text-xs font-mono whitespace-nowrap text-voltech-cyan">{producto.sku}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {producto.imagen ? (<img src={producto.imagen} alt={producto.plataforma} className="w-10 h-10 rounded-lg object-cover" />) : (<div className="w-10 h-10 rounded-lg bg-voltech-dark flex items-center justify-center"><ImageIcon className="w-5 h-5 text-voltech-muted" /></div>)}
                              <div><p className="text-sm font-medium text-white">{producto.plataforma}</p>{producto.esCombo && (<p className="text-xs text-voltech-purple">Combo: {producto.plataformasCombo?.join(', ')}</p>)}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">{producto.tipo === 'streaming' ? (<span className="text-xs px-2 py-1 rounded-full bg-voltech-purple/20 text-voltech-purple flex items-center gap-1 w-fit whitespace-nowrap"><MonitorPlay className="w-3 h-3" />Streaming</span>) : producto.tipo === 'kit' ? (<span className="text-xs px-2 py-1 rounded-full bg-voltech-cyan/20 text-voltech-cyan flex items-center gap-1 w-fit whitespace-nowrap"><Gift className="w-3 h-3" />Kit</span>) : (<span className="text-xs px-2 py-1 rounded-full bg-voltech-cyan/20 text-voltech-cyan flex items-center gap-1 w-fit whitespace-nowrap"><Package className="w-3 h-3" />Físico</span>)}</td>
                          <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${getEstadoBadge(producto.estado)}`}>{producto.estado ? producto.estado.charAt(0).toUpperCase() + producto.estado.slice(1) : 'Nuevo'}</span></td>
                          <td className="px-4 py-3 text-sm text-voltech-muted">{producto.categoria}</td>
                          <td className="px-4 py-3 text-sm text-voltech-muted">{producto.marca || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-medium ${producto.cantidad === 0 ? 'text-voltech-error' : producto.cantidad <= 2 ? 'text-voltech-warning' : 'text-voltech-success'}`}>{producto.cantidad}</span>
                            {producto.disponibilidad === 'bajo_pedido' && <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-voltech-warning/20 text-voltech-warning">🛒 Al momento</span>}
                          </td>
                          <td className="px-4 py-3">
                            {producto.precioOferta > 0 && producto.estado === 'oferta' ? (
                              <div className="flex flex-col"><span className="text-xs text-gray-400 line-through">$${Number(producto.precioDetal || producto.precioMayor || 0).toFixed(2)}</span><span className="text-sm font-bold text-voltech-warning">${parseFloat(producto.precioOferta || 0).toFixed(2)}</span></div>
                            ) : (<span className="text-sm text-white">$${Number(producto.precioDetal || producto.precioMayor || 0).toFixed(2)}</span>)}
                          </td>
                          <td className="px-4 py-3">{tienePermiso('puedeVerInventarioCompleto') ? (<input type="number" step="0.01" value={producto.porcentaje_comision || 5} onChange={(e) => { const nuevosProductos = productos.map(p => p.id === producto.id ? { ...p, porcentaje_comision: parseFloat(e.target.value) } : p); setProductos(nuevosProductos); localStorage.setItem('voltech_productos', JSON.stringify(nuevosProductos)); }} className="input-voltech w-20 rounded-lg px-2 py-1 text-sm" />) : (<span className="text-sm text-voltech-muted">{producto.porcentaje_comision || 5}%</span>)}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => togglePublicado(producto.id)} className={`p-2 rounded-lg transition-colors ${producto.publicado ? 'bg-voltech-success/20 text-voltech-success hover:bg-voltech-success/30' : 'bg-voltech-dark text-voltech-muted hover:bg-voltech-border'}`} title={producto.publicado ? 'Ocultar de la tienda' : 'Publicar en la tienda'}>{producto.publicado ? <Globe className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                          </td>
                          {tienePermiso('puedeVerInventarioCompleto') && (
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => abrirEdicion(producto)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => eliminarProducto(producto.id)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          )}
                        </tr>

                        {/* ✅ FORMULARIO INLINE DE EDICIÓN (DESKTOP) */}
                        {editandoId === producto.id && tienePermiso('puedeVerInventarioCompleto') && (
                          <tr className="bg-voltech-cyan/5 border-b border-voltech-border">
                            <td colSpan={tienePermiso('puedeVerInventarioCompleto') ? 12 : 10} className="p-4">
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-voltech-surface border-2 border-voltech-cyan rounded-xl p-4"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-bold text-voltech-cyan flex items-center gap-2">
                                    <Edit className="w-4 h-4" /> Editando: {producto.plataforma}
                                  </h4>
                                  <button onClick={cancelarEdicion} className="p-1 hover:bg-voltech-border rounded"><X className="w-4 h-4 text-voltech-muted" /></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-xs text-voltech-muted mb-1">Precio Detal ($)</label>
                                    <input type="number" step="0.01" value={editData.precioDetal} onChange={(e) => setEditData({ ...editData, precioDetal: parseFloat(e.target.value) || 0 })} className="input-voltech w-full rounded px-3 py-2 text-sm" />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-voltech-muted mb-1">Precio Oferta ($)</label>
                                    <input type="number" step="0.01" value={editData.precioOferta} onChange={(e) => setEditData({ ...editData, precioOferta: parseFloat(e.target.value) || 0 })} className="input-voltech w-full rounded px-3 py-2 text-sm" />
                                  </div>
                                  <div className="md:col-span-3">
                                    <label className="block text-xs text-voltech-muted mb-1">Descripción</label>
                                    <textarea value={editData.descripcion} onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })} className="input-voltech w-full rounded px-3 py-2 text-sm h-20" />
                                  </div>
                                                                  <div className="md:col-span-3">
                                  <label className="block text-xs text-voltech-muted mb-1">🖼️ Imágenes del Producto <span className="text-[10px]">(múltiples + portada)</span></label>
                                  <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragOverEdit(true); }}
                                    onDragLeave={() => setIsDragOverEdit(false)}
                                    onDrop={(e) => { e.preventDefault(); setIsDragOverEdit(false); handleImagenesEdit(e.dataTransfer.files); }}
                                    onClick={() => fileInputEditRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer ${isDragOverEdit ? 'border-voltech-cyan bg-voltech-cyan/10' : 'border-voltech-border'}`}
                                  >
                                    <Upload className="w-5 h-5 text-voltech-muted mx-auto" />
                                    <p className="text-xs text-voltech-muted mt-1">Arrastra o haz clic para agregar varias imágenes</p>
                                  </div>
                                  <input ref={fileInputEditRef} type="file" accept="image/*" multiple onChange={(e) => { handleImagenesEdit(e.target.files); e.target.value = ''; }} className="hidden" />
                                  {todasImagenesEdit.length > 0 && (
                                    <div className="flex gap-3 flex-wrap mt-3">
                                      {todasImagenesEdit.map((img, i) => {
                                        const esPortada = editData.imagen === img;
                                        return (
                                          <div key={i} className="w-28">
                                            <div className="relative">
                                              <img src={img} alt={`Img ${i+1}`} className={`w-28 h-28 object-cover rounded-lg border-2 ${esPortada ? 'border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]' : 'border-voltech-border'}`} />
                                              <button type="button" onClick={() => quitarImagenEdit(img)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"><X className="w-3 h-3" /></button>
                                            </div>
                                            <button type="button" onClick={() => setPortadaEdit(img)} className={`w-full text-[9px] px-1.5 py-1 rounded-full mt-1.5 ${esPortada ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(34,211,238,0.6)]' : 'bg-gray-800/80 text-gray-400 opacity-70 hover:opacity-100'}`}>
                                              {esPortada ? '★ Portada' : 'Portada'}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                </div>
                                <div className="flex gap-3 mt-4 pt-3 border-t border-voltech-border">
                                  <button onClick={() => guardarEdicion(producto.id)} className="flex-1 bg-voltech-cyan text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all"><Save className="w-4 h-4" /> Guardar Cambios</button>
                                  <button onClick={cancelarEdicion} className="px-6 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white transition-all flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))
                  )}
                  </tbody>
                </table>  
              </div>
              </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {productosFiltrados.length === 0 ? (
              <div className="col-span-full text-center py-12 text-voltech-muted"><Package className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No hay productos registrados</p><p className="text-xs mt-1">Haz clic en "Nuevo Producto" para comenzar</p></div>
            ) : (
              productosFiltrados.map((producto) => (
                <div key={producto.id} className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden hover:border-voltech-cyan/50 transition-all">
                  <div className="relative h-48 bg-voltech-dark">
                    {producto.imagen ? (<img src={producto.imagen} alt={producto.plataforma} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-12 h-12 text-voltech-muted opacity-50" /></div>)}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button onClick={() => togglePublicado(producto.id)} className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${producto.publicado ? 'bg-voltech-success/80 text-white' : 'bg-voltech-dark/80 text-voltech-muted'}`}>{producto.publicado ? <Globe className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                    </div>
                    <div className="absolute top-2 left-2">{producto.tipo === 'streaming' ? (<span className="text-xs px-2 py-1 rounded-full bg-voltech-purple/80 text-white flex items-center gap-1"><MonitorPlay className="w-3 h-3" />Streaming</span>) : producto.tipo === 'kit' ? (<span className="text-xs px-2 py-1 rounded-full bg-voltech-cyan/80 text-white flex items-center gap-1"><Gift className="w-3 h-3" />Kit</span>) : (<span className="text-xs px-2 py-1 rounded-full bg-voltech-cyan/80 text-white flex items-center gap-1"><Package className="w-3 h-3" />Físico</span>)}</div>
                    {producto.esCombo && (<div className="absolute top-12 left-2"><span className="text-xs px-2 py-1 rounded-full bg-voltech-warning/80 text-white flex items-center gap-1"><Layers className="w-3 h-3" />Combo</span></div>)}
                    <div className="absolute bottom-2 left-2"><span className={`text-xs px-2 py-1 rounded-full backdrop-blur-sm ${getEstadoBadge(producto.estado)}`}>{producto.estado ? producto.estado.charAt(0).toUpperCase() + producto.estado.slice(1) : 'Nuevo'}</span></div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-white mb-1 truncate">{producto.plataforma}</h3>
                    <p className="text-xs text-voltech-muted mb-2">{producto.categoria}{producto.marca ? ` • ${producto.marca}` : ''}</p>
                    {producto.duracion && (<p className="text-xs text-voltech-purple mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> {producto.duracion}</p>)}
                    {producto.tipoOferta && (<p className="text-xs text-voltech-warning mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> {producto.tipoOferta}</p>)}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        {producto.precioOferta > 0 && producto.estado === 'oferta' ? (
                          <><p className="text-xs text-gray-400 line-through">${Number(producto.precioDetal || producto.precioMayor || 0).toFixed(2)}</p><p className="text-lg font-bold text-voltech-warning">${Number(producto.precioOferta || 0).toFixed(2)}</p></>
                        ) : (<p className="text-lg font-bold text-white">${Number(producto.precioDetal || producto.precioMayor || 0).toFixed(2)}</p>)}
                        <p className="text-xs text-voltech-muted">Bs {producto.precioBs.toFixed(2)}</p>
                      </div>
                      <div className="text-right"><p className="text-xs text-voltech-muted">Comisión</p><p className="text-sm font-bold text-voltech-purple">{producto.porcentaje_comision || 5}%</p></div>
                    </div>
                    {tienePermiso('puedeVerInventarioCompleto') && (<div className="flex gap-2"><button onClick={() => abrirEdicion(producto)} className="flex-1 py-2 bg-voltech-dark border border-voltech-border rounded-lg text-xs text-voltech-muted hover:text-voltech-cyan hover:border-voltech-cyan transition-colors flex items-center justify-center gap-1"><Edit className="w-3 h-3" />Editar</button><button onClick={() => eliminarProducto(producto.id)} className="py-2 px-3 bg-voltech-dark border border-voltech-border rounded-lg text-xs text-voltech-muted hover:text-voltech-error hover:border-voltech-error transition-colors"><Trash2 className="w-3 h-3" /></button></div>)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <AnimatePresence>
          {showNuevoCampo.show && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-2xl w-full max-w-md">
                <div className="border-b border-voltech-border p-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Agregar {showNuevoCampo.tipo === 'categoria' ? 'Categoría' : showNuevoCampo.tipo === 'marca' ? 'Marca' : 'Nombre de Producto'}</h2>
                  <button onClick={() => setShowNuevoCampo({ tipo: '', show: false })} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Nombre</label><input type="text" value={nuevoCampo.valor} onChange={(e) => setNuevoCampo({ ...nuevoCampo, valor: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" placeholder="Ingresa el nombre" autoFocus /></div>
                  <button onClick={() => { /* Legacy */ }} className="w-full btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Agregar</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }