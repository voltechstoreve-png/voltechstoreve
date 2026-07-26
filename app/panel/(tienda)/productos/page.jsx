'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Package, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Image as ImageIcon,
  Save,
  Minus,
  Upload,
  Eye,
  EyeOff,
  Globe,
  LayoutGrid,
  Table,
  Download,
  Database,
  MonitorPlay,
  Tag,
  Layers,
  Calendar,
  Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [carteras, setCarteras] = useState([]);
  const [equipo, setEquipo] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [showCarterasModal, setShowCarterasModal] = useState(false);
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
  
  const [items, setItems] = useState([{
    id: Date.now(),
    tipo: 'fisico',
    imagen: '',
    imagenFile: null,
    sku: '',
    fecha: new Date().toISOString().split('T')[0],
    comprador: '',
    plataforma: '',
    plataformas: [],
    categoria: '',
    marca: '',
    cantidad: 1,
    metodoPago: 'efectivo',
    cartera: '',
    precioMayor: 0,
    precioDetal: 0,
    precioBs: 0,
    total: 0,
    monedaCompra: 'usd',
    duracion: '',
    tipoOferta: '',
    esCombo: false,
    plataformasCombo: [],
  }]);

  const [editData, setEditData] = useState({
    tipo: 'fisico',
    precioDetal: 0,
    precioOferta: 0,
    estado: 'nuevo',
    descripcion: '',
    publicado: false,
    imagen: '',
    duracion: '',
    tipoOferta: '',
    plataforma: '',
    plataformasCombo: [],
  });

  const [nuevaCartera, setNuevaCartera] = useState({ nombre: '', tipo: 'pago_movil', datos: '' });
  const [nuevoCampo, setNuevoCampo] = useState({ tipo: '', valor: '' });
  const [showNuevoCampo, setShowNuevoCampo] = useState({ tipo: '', show: false });

  useEffect(() => {
    const productosGuardados = localStorage.getItem('voltech_productos');
    const carterasGuardadas = localStorage.getItem('voltech_carteras');
    const equipoGuardado = localStorage.getItem('voltech_equipo');
    const tasaGuardada = localStorage.getItem('voltech_tasa_bcv');
    const categoriasGuardadas = localStorage.getItem('voltech_categorias');
    const marcasGuardadas = localStorage.getItem('voltech_marcas');

    if (productosGuardados) {
      const prods = JSON.parse(productosGuardados);
      setProductos(prods);
      const cats = [...new Set(prods.map(p => p.categoria).filter(Boolean))];
      const mar = [...new Set(prods.map(p => p.marca).filter(Boolean))];
      setCategorias(cats);
      setMarcas(mar);
    }
    if (carterasGuardadas) setCarteras(JSON.parse(carterasGuardadas));
    if (equipoGuardado) setEquipo(JSON.parse(equipoGuardado));
    if (tasaGuardada) {
      const tasaData = JSON.parse(tasaGuardada);
      setTasaBCV(tasaData.tasa);
      setUsarTasaBCV(tasaData.usarBCV);
      setTasaPersonalizada(tasaData.tasaPersonalizada || tasaData.tasa);
    }
    if (categoriasGuardadas) setCategorias(JSON.parse(categoriasGuardadas));
    if (marcasGuardadas) setMarcas(JSON.parse(marcasGuardadas));

    if (!equipoGuardado) {
      const adminDefault = [{ id: 1, nombre: 'Administrador', rol: 'Admin', email: 'admin@voltech.store' }];
      setEquipo(adminDefault);
      localStorage.setItem('voltech_equipo', JSON.stringify(adminDefault));
    }

    if (!carterasGuardadas) {
      const carterasDefault = [
        { id: 1, nombre: 'Pago Móvil Principal', tipo: 'pago_movil', datos: '0412-1234567 - 12345678 - 0102' },
        { id: 2, nombre: 'Zelle', tipo: 'zelle', datos: 'voltech@email.com' },
        { id: 3, nombre: 'Binance', tipo: 'cripto', datos: 'voltech@binance.com' },
      ];
      setCarteras(carterasDefault);
      localStorage.setItem('voltech_carteras', JSON.stringify(carterasDefault));
    }
  }, []);

  const generarSKU = (plataforma, categoria, marca, existente = 0) => {
    const plat = (plataforma || '').substring(0, 3).toUpperCase();
    const cat = (categoria || '').substring(0, 3).toUpperCase();
    const mar = marca ? marca.substring(0, 3).toUpperCase() : 'STR';
    const num = String(existente).padStart(3, '0');
    return `${plat}-${cat}-${mar}-${num}`;
  };

  const obtenerSiguienteNumero = (plataforma, categoria, marca) => {
    if (!plataforma || !categoria) return 0;
    const base = `${plataforma.substring(0, 3).toUpperCase()}-${categoria.substring(0, 3).toUpperCase()}-${marca ? marca.substring(0, 3).toUpperCase() : 'STR'}`;
    const existentes = productos.filter(p => p.sku && p.sku.startsWith(base));
    return existentes.length;
  };

  const actualizarSKU = (index) => {
    const item = items[index];
    if (item.plataforma && item.categoria && (item.tipo === 'streaming' || item.marca)) {
      const siguienteNum = obtenerSiguienteNumero(item.plataforma, item.categoria, item.marca);
      const nuevoSKU = generarSKU(item.plataforma, item.categoria, item.marca, siguienteNum);
      const nuevosItems = [...items];
      nuevosItems[index].sku = nuevoSKU;
      setItems(nuevosItems);
    }
  };

  const calcularTotal = (index) => {
    const item = items[index];
    const total = item.precioMayor * item.cantidad;
    const nuevosItems = [...items];
    nuevosItems[index].total = total;
    setItems(nuevosItems);
  };

  const calcularPrecioCruzado = (index, campo, valor) => {
    const tasa = usarTasaBCV ? tasaBCV : tasaPersonalizada;
    const nuevosItems = [...items];
    const valorNum = parseFloat(valor) || 0;
    
    if (campo === 'precioMayor') {
      nuevosItems[index].precioMayor = valorNum;
      nuevosItems[index].precioBs = parseFloat((valorNum * tasa).toFixed(2));
    } else if (campo === 'precioDetal') {
      nuevosItems[index].precioDetal = valorNum;
      nuevosItems[index].precioBs = parseFloat((valorNum * tasa).toFixed(2));
    } else if (campo === 'precioBs') {
      nuevosItems[index].precioBs = valorNum;
      nuevosItems[index].precioDetal = parseFloat((valorNum / tasa).toFixed(2));
    }
    
    setItems(nuevosItems);
    calcularTotal(index);
  };

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const nuevosItems = [...items];
    nuevosItems[index][name] = value;
    setItems(nuevosItems);
    
    if (['plataforma', 'categoria', 'marca'].includes(name)) {
      setTimeout(() => actualizarSKU(index), 100);
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

  const handleEditImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData({ ...editData, imagen: reader.result });
        toast.success('Imagen actualizada');
      };
      reader.readAsDataURL(file);
    }
  };

  const agregarItem = () => {
    const nuevoItem = {
      id: Date.now(),
      tipo: 'fisico',
      imagen: '',
      imagenFile: null,
      sku: '',
      cantidad: 1,
      precioMayor: 0,
      precioDetal: 0,
      precioBs: 0,
      total: 0,
      plataforma: '',
      plataformas: [],
      fecha: new Date().toISOString().split('T')[0],
      duracion: '',
      tipoOferta: '',
      esCombo: false,
      plataformasCombo: [],
    };
    setItems([...items, nuevoItem]);
  };

  const eliminarItem = (index) => {
    if (items.length > 1) {
      const nuevosItems = items.filter((_, i) => i !== index);
      setItems(nuevosItems);
    } else {
      toast.error('Debe haber al menos un producto');
    }
  };

  const abrirNuevoCampo = (tipo) => {
    setShowNuevoCampo({ tipo, show: true });
    setNuevoCampo({ tipo, valor: '' });
  };

  const guardarNuevoCampo = () => {
    if (!nuevoCampo.valor.trim()) {
      toast.error('Ingresa un valor');
      return;
    }

    if (nuevoCampo.tipo === 'categoria') {
      if (!categorias.includes(nuevoCampo.valor)) {
        const nuevasCategorias = [...categorias, nuevoCampo.valor];
        setCategorias(nuevasCategorias);
        localStorage.setItem('voltech_categorias', JSON.stringify(nuevasCategorias));
        toast.success('Categoría agregada');
      } else {
        toast.error('Esta categoría ya existe');
      }
    } else if (nuevoCampo.tipo === 'marca') {
      if (!marcas.includes(nuevoCampo.valor)) {
        const nuevasMarcas = [...marcas, nuevoCampo.valor];
        setMarcas(nuevasMarcas);
        localStorage.setItem('voltech_marcas', JSON.stringify(nuevasMarcas));
        toast.success('Marca agregada');
      } else {
        toast.error('Esta marca ya existe');
      }
    }
    
    setShowNuevoCampo({ tipo: '', show: false });
    setNuevoCampo({ tipo: '', valor: '' });
  };

  const abrirComboModal = () => {
    const plataformasDisponibles = productos
      .filter(p => p.tipo === 'streaming' && !p.esCombo)
      .map(p => p.plataforma);
    setComboPlataformas(plataformasDisponibles);
    setShowComboModal(true);
  };

  const crearCombo = () => {
    if (!comboNombre || comboPlataformas.length < 2) {
      toast.error('Selecciona al menos 2 plataformas y ponle nombre al combo');
      return;
    }

    const nuevoCombo = {
      id: Date.now(),
      tipo: 'streaming',
      plataforma: comboNombre,
      categoria: 'COMBO',
      esCombo: true,
      plataformasCombo: comboPlataformas,
      precioDetal: 0,
      duracion: '1 mes',
      tipoOferta: `Pack ${comboPlataformas.length} plataformas`,
      cantidad: 100,
      publicado: false,
      estado: 'combo',
      fechaCreacion: new Date().toISOString(),
      sku: generarSKU(comboNombre, 'COMBO', '', 0),
    };

    const productosActualizados = [...productos, nuevoCombo];
    setProductos(productosActualizados);
    localStorage.setItem('voltech_productos', JSON.stringify(productosActualizados));
    toast.success(`Combo "${comboNombre}" creado exitosamente`);
    setShowComboModal(false);
    setComboNombre('');
    setComboPlataformas([]);
  };

  const guardarProductos = () => {
    let productosGuardados = 0;
    let productosActualizados = 0;
    const nuevosProductos = [];

    items.forEach((item, index) => {
      if (!item.plataforma || !item.categoria || (item.tipo === 'fisico' && !item.marca)) {
        toast.error(`El item ${index + 1} tiene campos obligatorios vacíos`);
        return;
      }

      const productoExistente = productos.find(p => 
        p.plataforma?.toLowerCase() === item.plataforma.toLowerCase() &&
        p.categoria?.toLowerCase() === item.categoria.toLowerCase() &&
        p.id !== item.id
      );

      if (productoExistente) {
        const productoActualizado = {
          ...productoExistente,
          cantidad: productoExistente.cantidad + item.cantidad,
          precioMayor: item.precioMayor,
          precioDetal: item.precioDetal || item.precioMayor,
          precioBs: item.precioBs,
          fecha: item.fecha,
          tipo: item.tipo,
          duracion: item.duracion,
          tipoOferta: item.tipoOferta,
          imagen: item.imagen || productoExistente.imagen,
        };
        nuevosProductos.push(productoActualizado);
        productosActualizados++;
      } else {
        const nuevoProducto = {
          ...item,
          id: Date.now() + index,
          precioDetal: item.precioDetal || item.precioMayor,
          precioOferta: 0,
          estado: 'nuevo',
          descripcion: '',
          publicado: false,
          fechaCreacion: new Date().toISOString(),
        };
        nuevosProductos.push(nuevoProducto);
        productosGuardados++;
      }
    });

    if (productosGuardados > 0 || productosActualizados > 0) {
      let productosFinales = [...productos];
      
      nuevosProductos.forEach(p => {
        const index = productosFinales.findIndex(existing => 
          existing.plataforma === p.plataforma && 
          existing.categoria === p.categoria
        );
        
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
      localStorage.setItem('voltech_categorias', JSON.stringify(nuevasCategorias));
      localStorage.setItem('voltech_marcas', JSON.stringify(nuevasMarcas));

      const mensaje = productosActualizados > 0 
        ? `${productosGuardados} nuevo(s) y ${productosActualizados} actualizado(s)`
        : `${productosGuardados} producto(s) guardado(s)`;
      
      toast.success(mensaje);
      
      setItems([{
        id: Date.now(),
        tipo: 'fisico',
        imagen: '',
        imagenFile: null,
        sku: '',
        fecha: new Date().toISOString().split('T')[0],
        comprador: '',
        plataforma: '',
        plataformas: [],
        categoria: '',
        marca: '',
        cantidad: 1,
        metodoPago: 'efectivo',
        cartera: '',
        precioMayor: 0,
        precioDetal: 0,
        precioBs: 0,
        total: 0,
        monedaCompra: 'usd',
        duracion: '',
        tipoOferta: '',
        esCombo: false,
        plataformasCombo: [],
      }]);
      setShowForm(false);
    }
  };

  const abrirEdicion = (producto) => {
    setEditandoId(producto.id);
    setEditData({
      tipo: producto.tipo || 'fisico',
      precioDetal: producto.precioDetal || producto.precioMayor,
      precioOferta: producto.precioOferta || 0,
      estado: producto.estado || 'nuevo',
      descripcion: producto.descripcion || '',
      publicado: producto.publicado || false,
      imagen: producto.imagen || '',
      duracion: producto.duracion || '',
      tipoOferta: producto.tipoOferta || '',
      plataforma: producto.plataforma || '',
      plataformasCombo: producto.plataformasCombo || [],
    });
  };

  const guardarEdicion = (id) => {
    const productosActualizados = productos.map(p => 
      p.id === id 
        ? { ...p, ...editData }
        : p
    );
    setProductos(productosActualizados);
    localStorage.setItem('voltech_productos', JSON.stringify(productosActualizados));
    toast.success('Producto actualizado');
    setEditandoId(null);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
  };

  const togglePublicado = (id) => {
    const productosActualizados = productos.map(p => 
      p.id === id 
        ? { ...p, publicado: !p.publicado }
        : p
    );
    setProductos(productosActualizados);
    localStorage.setItem('voltech_productos', JSON.stringify(productosActualizados));
    const producto = productos.find(p => p.id === id);
    toast.success(`Producto ${producto.publicado ? 'ocultado' : 'publicado'} en la tienda`);
  };

  const eliminarProducto = (id) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      const productosActualizados = productos.filter(p => p.id !== id);
      setProductos(productosActualizados);
      localStorage.setItem('voltech_productos', JSON.stringify(productosActualizados));
      toast.success('Producto eliminado');
    }
  };

  const agregarCartera = () => {
    if (!nuevaCartera.nombre || !nuevaCartera.datos) {
      toast.error('Completa todos los campos');
      return;
    }
    const nueva = { ...nuevaCartera, id: Date.now() };
    const carterasActualizadas = [...carteras, nueva];
    setCarteras(carterasActualizadas);
    localStorage.setItem('voltech_carteras', JSON.stringify(carterasActualizadas));
    setNuevaCartera({ nombre: '', tipo: 'pago_movil', datos: '' });
    toast.success('Cartera agregada');
  };

  const eliminarCartera = (id) => {
    const carterasActualizadas = carteras.filter(c => c.id !== id);
    setCarteras(carterasActualizadas);
    localStorage.setItem('voltech_carteras', JSON.stringify(carterasActualizadas));
    toast.success('Cartera eliminada');
  };

  const guardarTasa = () => {
    const tasaData = {
      tasa: usarTasaBCV ? tasaBCV : tasaPersonalizada,
      usarBCV: usarTasaBCV,
      tasaPersonalizada,
    };
    localStorage.setItem('voltech_tasa_bcv', JSON.stringify(tasaData));
    toast.success('Tasa actualizada');
  };

  const generarPDFCatalogo = () => {
    const productosPublicados = productos.filter(p => p.publicado);
    const contenido = `
      CATALOGO VOLTECH STORE
      ======================
      Fecha: ${new Date().toLocaleDateString()}
      
      Total Productos: ${productosPublicados.length}
      
      ${productosPublicados.map(p => `
      ${p.plataforma} ${p.tipo === 'streaming' ? '(Streaming)' : ''} ${p.esCombo ? '(Combo)' : ''}
      SKU: ${p.sku}
      Categoría: ${p.categoria}
      Precio Detal: $${(p.precioDetal || p.precioMayor).toFixed(2)}
      (Bs ${p.precioBs.toFixed(2)})
      Stock: ${p.cantidad} unidades
      Duración: ${p.duracion || 'N/A'}
      Oferta: ${p.tipoOferta || 'N/A'}
      ---
      `).join('\n')}
    `;
    
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
    p.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProductos = productos.length;
  const stockBajo = productos.filter(p => p.cantidad <= 2).length;
  const agotados = productos.filter(p => p.cantidad === 0).length;
  const valorInventario = productos.reduce((acc, p) => acc + (p.precioMayor * p.cantidad), 0);

  return (
    <div className="space-y-6">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' },
          success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } },
        }}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Productos</h1>
          <p className="text-sm text-voltech-muted mt-1">Gestiona tu catálogo e inventario</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generarPDFCatalogo}
            className="px-4 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-cyan transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Catálogo
          </button>
          <button
            onClick={() => setShowCarterasModal(!showCarterasModal)}
            className="px-4 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-cyan transition-all flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Carteras
          </button>
          <Link
            href="/panel/compras"
            className="px-4 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-cyan transition-all flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Compras
          </Link>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCarterasModal && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Mis Carteras</h3>
                <button onClick={() => setShowCarterasModal(false)} className="p-1 rounded hover:bg-voltech-border">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {carteras.map((cartera) => (
                  <div key={cartera.id} className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{cartera.nombre}</p>
                      <p className="text-xs text-voltech-muted">{cartera.datos}</p>
                    </div>
                    <button
                      onClick={() => eliminarCartera(cartera.id)}
                      className="p-2 rounded-lg hover:bg-voltech-error/10 text-voltech-muted hover:text-voltech-error transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-voltech-border pt-4 space-y-3">
                <h4 className="text-xs font-semibold text-voltech-muted">Agregar Nueva Cartera</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={nuevaCartera.nombre}
                    onChange={(e) => setNuevaCartera({ ...nuevaCartera, nombre: e.target.value })}
                    className="input-voltech rounded-lg px-3 py-2 text-sm"
                  />
                  <select
                    value={nuevaCartera.tipo}
                    onChange={(e) => setNuevaCartera({ ...nuevaCartera, tipo: e.target.value })}
                    className="input-voltech rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="pago_movil">Pago Móvil</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="zelle">Zelle</option>
                    <option value="binance">Binance</option>
                    <option value="efectivo">Efectivo</option>
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Datos"
                      value={nuevaCartera.datos}
                      onChange={(e) => setNuevaCartera({ ...nuevaCartera, datos: e.target.value })}
                      className="input-voltech rounded-lg px-3 py-2 text-sm flex-1"
                    />
                    <button
                      onClick={agregarCartera}
                      className="px-3 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg hover:bg-voltech-cyan/30 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-cyan/20">
              <Package className="w-5 h-5 text-voltech-cyan" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Total Productos</p>
              <p className="text-xl font-bold text-white">{totalProductos}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-warning/20">
              <AlertTriangle className="w-5 h-5 text-voltech-warning" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Stock Bajo</p>
              <p className="text-xl font-bold text-white">{stockBajo}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-error/20">
              <X className="w-5 h-5 text-voltech-error" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Agotados</p>
              <p className="text-xl font-bold text-white">{agotados}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-success/20">
              <TrendingUp className="w-5 h-5 text-voltech-success" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Valor Inventario</p>
              <p className="text-xl font-bold text-white">${valorInventario.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Tasa de Cambio</h3>
            <p className="text-xs text-voltech-muted">Configura la tasa para calcular precios en Bs</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={usarTasaBCV}
                onChange={(e) => setUsarTasaBCV(e.target.checked)}
                className="w-4 h-4 rounded border-voltech-border bg-voltech-dark text-voltech-cyan"
              />
              <span className="text-xs text-voltech-muted">Usar tasa BCV</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-voltech-muted">Tasa:</span>
              <input
                type="number"
                step="0.01"
                value={usarTasaBCV ? tasaBCV : tasaPersonalizada}
                onChange={(e) => usarTasaBCV ? setTasaBCV(parseFloat(e.target.value)) : setTasaPersonalizada(parseFloat(e.target.value))}
                className="input-voltech w-24 rounded-lg px-3 py-1 text-sm"
              />
              <span className="text-xs text-voltech-muted">Bs/$</span>
            </div>
            <button
              onClick={guardarTasa}
              className="px-3 py-1 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-xs hover:bg-voltech-cyan/30 transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-voltech-cyan" />
                  Nuevo Producto{items.length > 1 && `s (${items.length} items)`}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setItems([{
                      id: Date.now(),
                      tipo: 'fisico',
                      imagen: '',
                      imagenFile: null,
                      sku: '',
                      fecha: new Date().toISOString().split('T')[0],
                      comprador: '',
                      plataforma: '',
                      plataformas: [],
                      categoria: '',
                      marca: '',
                      cantidad: 1,
                      metodoPago: 'efectivo',
                      cartera: '',
                      precioMayor: 0,
                      precioDetal: 0,
                      precioBs: 0,
                      total: 0,
                      monedaCompra: 'usd',
                      duracion: '',
                      tipoOferta: '',
                      esCombo: false,
                      plataformasCombo: [],
                    }]);
                  }}
                  className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {items.map((item, itemIndex) => (
                  <div key={item.id} className="border border-voltech-border rounded-lg p-4 relative">
                    {items.length > 1 && (
                      <button
                        onClick={() => eliminarItem(itemIndex)}
                        className="absolute top-2 right-2 p-2 rounded-lg hover:bg-voltech-error/10 text-voltech-muted hover:text-voltech-error transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                    
                    <h3 className="text-sm font-semibold text-voltech-muted mb-4">
                      Producto {itemIndex + 1}
                    </h3>

                    <div className="mb-4">
                      <label className="block text-xs text-voltech-muted mb-2 ml-1">Tipo de Producto</label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const nuevosItems = [...items];
                            nuevosItems[itemIndex].tipo = 'fisico';
                            setItems(nuevosItems);
                          }}
                          className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                            item.tipo === 'fisico'
                              ? 'bg-voltech-cyan/20 border-voltech-cyan text-voltech-cyan'
                              : 'bg-voltech-dark border-voltech-border text-voltech-muted hover:border-voltech-cyan'
                          }`}
                        >
                          <Package className="w-4 h-4" />
                          Físico
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nuevosItems = [...items];
                            nuevosItems[itemIndex].tipo = 'streaming';
                            setItems(nuevosItems);
                          }}
                          className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                            item.tipo === 'streaming'
                              ? 'bg-voltech-purple/20 border-voltech-purple text-voltech-purple'
                              : 'bg-voltech-dark border-voltech-border text-voltech-muted hover:border-voltech-purple'
                          }`}
                        >
                          <MonitorPlay className="w-4 h-4" />
                          Streaming
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-3">
                        <label className="block text-xs text-voltech-muted mb-1 ml-1">Imagen/Video</label>
                        <div className="flex items-center gap-4">
                          <label className="flex-1 cursor-pointer">
                            <div className="border-2 border-dashed border-voltech-border rounded-lg p-4 text-center hover:border-voltech-cyan transition-colors">
                              {item.imagen ? (
                                <div className="flex items-center gap-3">
                                  <img src={item.imagen} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                                  <span className="text-sm text-voltech-muted">Cambiar imagen</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2 text-voltech-muted">
                                  <Upload className="w-5 h-5" />
                                  <span className="text-sm">Haz clic para subir imagen/video</span>
                                </div>
                              )}
                            </div>
                            <input
                              type="file"
                              accept="image/*,video/*"
                              onChange={(e) => handleImageUpload(itemIndex, e)}
                              className="hidden"
                            />
                          </label>
                          {item.imagen && (
                            <a href={item.imagen} target="_blank" rel="noopener noreferrer" className="p-3 bg-voltech-dark border border-voltech-border rounded-lg hover:border-voltech-cyan transition-colors">
                              <Eye className="w-5 h-5 text-voltech-cyan" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-voltech-muted mb-1 ml-1">SKU (automático)</label>
                        <input
                          type="text"
                          value={item.sku}
                          readOnly
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm font-mono text-voltech-cyan bg-voltech-dark/50"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="block text-xs text-voltech-muted mb-1 ml-1">Plataforma Streaming *</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={item.plataforma}
                            onChange={(e) => handleChange(itemIndex, { target: { name: 'plataforma', value: e.target.value } })}
                            className="input-voltech flex-1 rounded-lg px-4 py-2 text-sm"
                            placeholder={item.tipo === 'streaming' ? 'Ej: Netflix Premium' : 'Ej: Audífonos JBL'}
                            list={`plataformas-list-${item.id}`}
                          />
                          <datalist id={`plataformas-list-${item.id}`}>
                            {productos.filter(p => p.tipo === 'streaming').map(p => (
                              <option key={p.id} value={p.plataforma} />
                            ))}
                          </datalist>
                          {item.tipo === 'streaming' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (item.plataforma.trim()) {
                                  const nuevosItems = [...items];
                                  const nuevaPlataforma = item.plataforma.trim();
                                  if (!nuevosItems[itemIndex].plataformas.includes(nuevaPlataforma)) {
                                    nuevosItems[itemIndex].plataformas.push(nuevaPlataforma);
                                  }
                                  nuevosItems[itemIndex].plataforma = '';
                                  setItems(nuevosItems);
                                  toast.success('Plataforma agregada');
                                }
                              }}
                              className="px-3 py-2 bg-voltech-purple/20 text-voltech-purple rounded-lg hover:bg-voltech-purple/30 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {item.plataformas && item.plataformas.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.plataformas.map((plat, idx) => (
                              <span key={idx} className="text-xs bg-voltech-purple/20 text-voltech-purple px-2 py-1 rounded-full flex items-center gap-1">
                                {plat}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nuevosItems = [...items];
                                    nuevosItems[itemIndex].plataformas = nuevosItems[itemIndex].plataformas.filter((_, i) => i !== idx);
                                    setItems(nuevosItems);
                                  }}
                                  className="text-voltech-error hover:text-voltech-error/70"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-voltech-muted mb-1 ml-1">Categoría *</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={item.categoria}
                            onChange={(e) => handleChange(itemIndex, { target: { name: 'categoria', value: e.target.value } })}
                            className="input-voltech flex-1 rounded-lg px-4 py-2 text-sm"
                            placeholder="Ej: STREAMING"
                            list={`categorias-list-${item.id}`}
                          />
                          <datalist id={`categorias-list-${item.id}`}>
                            {categorias.map(c => (
                              <option key={c} value={c} />
                            ))}
                          </datalist>
                          <button
                            onClick={() => abrirNuevoCampo('categoria')}
                            className="px-3 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg hover:bg-voltech-cyan/30 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {item.tipo === 'fisico' && (
                        <div>
                          <label className="block text-xs text-voltech-muted mb-1 ml-1">Marca *</label>
                          <div className="flex gap-2">
                            <select
                              value={item.marca}
                              onChange={(e) => handleChange(itemIndex, { target: { name: 'marca', value: e.target.value } })}
                              className="input-voltech flex-1 rounded-lg px-4 py-2 text-sm"
                            >
                              <option value="">-- Selecciona --</option>
                              {marcas.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => abrirNuevoCampo('marca')}
                              className="px-3 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg hover:bg-voltech-cyan/30 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {item.tipo === 'streaming' && (
                        <>
                          <div>
                            <label className="block text-xs text-voltech-muted mb-1 ml-1">Duración</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={item.duracion}
                                onChange={(e) => {
                                  const nuevosItems = [...items];
                                  nuevosItems[itemIndex].duracion = e.target.value;
                                  setItems(nuevosItems);
                                }}
                                className="input-voltech flex-1 rounded-lg px-4 py-2 text-sm"
                                placeholder="Ej: 1 mes, 15 días, 3 meses..."
                              />
                              <Calendar className="w-5 h-5 text-voltech-muted self-center" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-voltech-muted mb-1 ml-1">Tipo de Oferta</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={item.tipoOferta}
                                onChange={(e) => {
                                  const nuevosItems = [...items];
                                  nuevosItems[itemIndex].tipoOferta = e.target.value;
                                  setItems(nuevosItems);
                                }}
                                className="input-voltech flex-1 rounded-lg px-4 py-2 text-sm"
                                placeholder="Ej: Pack 3 plataformas, 2x1, 5% descuento..."
                              />
                              <Percent className="w-5 h-5 text-voltech-muted self-center" />
                            </div>
                          </div>

                          {!item.esCombo && (
                            <div className="lg:col-span-3">
                              <button
                                onClick={abrirComboModal}
                                className="w-full py-3 bg-voltech-purple/20 border border-voltech-purple rounded-lg text-voltech-purple hover:bg-voltech-purple/30 transition-colors flex items-center justify-center gap-2"
                              >
                                <Layers className="w-4 h-4" />
                                Crear Combo con Plataformas Existentes
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      <div>
                        <label className="block text-xs text-voltech-muted mb-1 ml-1">Fecha</label>
                        <input
                          type="date"
                          value={item.fecha}
                          onChange={(e) => handleChange(itemIndex, { target: { name: 'fecha', value: e.target.value } })}
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-voltech-muted mb-1 ml-1">Comprador (Equipo)</label>
                        <select
                          value={item.comprador}
                          onChange={(e) => handleChange(itemIndex, { target: { name: 'comprador', value: e.target.value } })}
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                        >
                          <option value="">-- Selecciona --</option>
                          {equipo.map(e => (
                            <option key={e.id} value={e.nombre}>{e.nombre} ({e.rol})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-voltech-muted mb-1 ml-1">Cantidad</label>
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => {
                            handleChange(itemIndex, { target: { name: 'cantidad', value: e.target.value } });
                            calcularTotal(itemIndex);
                          }}
                          min="0"
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-voltech-muted mb-1 ml-1">Moneda de compra</label>
                        <select
                          value={item.monedaCompra}
                          onChange={(e) => handleChange(itemIndex, { target: { name: 'monedaCompra', value: e.target.value } })}
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                        >
                          <option value="usd">Dólares ($)</option>
                          <option value="bs">Bolívares (Bs)</option>
                        </select>
                      </div>

                      {item.tipo === 'fisico' && (
                        <div>
                          <label className="block text-xs text-voltech-muted mb-1 ml-1">Precio Mayor ($) <span className="text-voltech-warning">(Tu costo)</span></label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.precioMayor}
                            onChange={(e) => calcularPrecioCruzado(itemIndex, 'precioMayor', e.target.value)}
                            className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs text-voltech-muted mb-1 ml-1">Precio Detal ($) <span className="text-voltech-success">(Venta al público)</span></label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.precioDetal}
                          onChange={(e) => calcularPrecioCruzado(itemIndex, 'precioDetal', e.target.value)}
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                          placeholder="Precio de venta"
                        />
                        {item.tipo === 'fisico' && item.precioMayor > 0 && item.precioDetal > 0 && (
                          <p className="text-xs text-voltech-success mt-1">
                            Ganancia: ${(item.precioDetal - item.precioMayor).toFixed(2)} 
                            ({((item.precioDetal - item.precioMayor) / item.precioMayor * 100).toFixed(0)}%)
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-voltech-muted mb-1 ml-1">Precio (Bs)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.precioBs}
                          onChange={(e) => calcularPrecioCruzado(itemIndex, 'precioBs', e.target.value)}
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-voltech-muted mb-1 ml-1">Total</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.total}
                          readOnly
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm font-bold text-voltech-success bg-voltech-dark/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-voltech-muted mb-1 ml-1">Método de Pago</label>
                        <select
                          value={item.metodoPago}
                          onChange={(e) => handleChange(itemIndex, { target: { name: 'metodoPago', value: e.target.value } })}
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                        >
                          <option value="efectivo">Efectivo</option>
                          <option value="pago_movil">Pago Móvil</option>
                          <option value="transferencia">Transferencia</option>
                          <option value="zelle">Zelle</option>
                          <option value="binance">Binance</option>
                          <option value="otro">Otro</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-voltech-muted mb-1 ml-1">Cartera</label>
                        <select
                          value={item.cartera}
                          onChange={(e) => handleChange(itemIndex, { target: { name: 'cartera', value: e.target.value } })}
                          className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                        >
                          <option value="">-- Selecciona --</option>
                          {carteras.map(c => (
                            <option key={c.id} value={c.nombre}>{c.nombre}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={agregarItem}
                  className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-cyan transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Otro Producto
                </button>
                <button
                  onClick={guardarProductos}
                  className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Guardar {items.length > 1 ? `${items.length} Productos` : 'Producto'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showComboModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-voltech-surface border border-voltech-border rounded-2xl w-full max-w-lg"
            >
              <div className="border-b border-voltech-border p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-voltech-purple" />
                  Crear Combo de Plataformas
                </h2>
                <button onClick={() => setShowComboModal(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Nombre del Combo *</label>
                  <input
                    type="text"
                    value={comboNombre}
                    onChange={(e) => setComboNombre(e.target.value)}
                    className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                    placeholder="Ej: Pack Entretenimiento, Super Combo..."
                  />
                </div>

                <div>
                  <label className="block text-xs text-voltech-muted mb-2 ml-1">Selecciona las Plataformas (mínimo 2)</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-voltech-border rounded-lg p-3">
                    {comboPlataformas.length === 0 ? (
                      <p className="text-sm text-voltech-muted text-center py-4">No hay plataformas disponibles para crear combo</p>
                    ) : (
                      comboPlataformas.map((plataforma) => (
                        <label key={plataforma} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-voltech-border/50 rounded">
                          <input
                            type="checkbox"
                            value={plataforma}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setComboPlataformas([...comboPlataformas, plataforma]);
                              } else {
                                setComboPlataformas(comboPlataformas.filter(p => p !== plataforma));
                              }
                            }}
                            className="w-4 h-4 rounded border-voltech-border bg-voltech-dark text-voltech-purple"
                          />
                          <span className="text-sm text-white">{plataforma}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-voltech-muted mt-2">
                    Seleccionadas: {comboPlataformas.length}
                  </p>
                </div>

                <button
                  onClick={crearCombo}
                  disabled={comboPlataformas.length < 2 || !comboNombre}
                  className="w-full btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Layers className="w-4 h-4" />
                  Crear Combo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar productos por nombre, SKU o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-voltech w-full rounded-lg pl-10 pr-4 py-3 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setVista('tabla')}
            className={`p-3 rounded-lg transition-colors ${
              vista === 'tabla' ? 'bg-voltech-cyan/20 text-voltech-cyan' : 'bg-voltech-surface border border-voltech-border text-voltech-muted hover:text-white'
            }`}
          >
            <Table className="w-5 h-5" />
          </button>
          <button
            onClick={() => setVista('grid')}
            className={`p-3 rounded-lg transition-colors ${
              vista === 'grid' ? 'bg-voltech-cyan/20 text-voltech-cyan' : 'bg-voltech-surface border border-voltech-border text-voltech-muted hover:text-white'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {vista === 'tabla' ? (
        <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-voltech-dark border-b border-voltech-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Plataforma</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Categoría</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Duración</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Oferta</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Precio Detal $</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Precio Bs</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Estado</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted">Publicado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="text-center py-12 text-voltech-muted">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No hay productos registrados</p>
                      <p className="text-xs mt-1">Haz clic en "Nuevo Producto" para comenzar</p>
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((producto) => (
                    <tr key={producto.id} className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-voltech-cyan">{producto.sku}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {producto.imagen ? (
                            <img src={producto.imagen} alt={producto.plataforma} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-voltech-dark flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-voltech-muted" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-white">{producto.plataforma}</p>
                            {producto.esCombo && (
                              <p className="text-xs text-voltech-purple">Combo: {producto.plataformasCombo?.join(', ')}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {producto.tipo === 'streaming' ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-voltech-purple/20 text-voltech-purple flex items-center gap-1 w-fit">
                            <MonitorPlay className="w-3 h-3" />
                            Streaming
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-voltech-cyan/20 text-voltech-cyan flex items-center gap-1 w-fit">
                            <Package className="w-3 h-3" />
                            Físico
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-voltech-muted">{producto.categoria}</td>
                      <td className="px-4 py-3 text-sm text-voltech-muted">{producto.duracion || '-'}</td>
                      <td className="px-4 py-3 text-sm text-voltech-muted">{producto.tipoOferta || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${
                          producto.cantidad === 0 ? 'text-voltech-error' :
                          producto.cantidad <= 2 ? 'text-voltech-warning' : 'text-voltech-success'
                        }`}>
                          {producto.cantidad}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">${(producto.precioDetal || producto.precioMayor).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-voltech-muted">Bs {producto.precioBs.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          producto.estado === 'nuevo' ? 'bg-voltech-success/20 text-voltech-success' :
                          producto.estado === 'oferta' ? 'bg-voltech-warning/20 text-voltech-warning' :
                          producto.estado === 'kit' ? 'bg-voltech-cyan/20 text-voltech-cyan' :
                          producto.estado === 'combo' ? 'bg-voltech-purple/20 text-voltech-purple' :
                          producto.estado === 'promocion' ? 'bg-voltech-warning/20 text-voltech-warning' :
                          'bg-voltech-error/20 text-voltech-error'
                        }`}>
                          {producto.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => togglePublicado(producto.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            producto.publicado 
                              ? 'bg-voltech-success/20 text-voltech-success hover:bg-voltech-success/30' 
                              : 'bg-voltech-dark text-voltech-muted hover:bg-voltech-border'
                          }`}
                          title={producto.publicado ? 'Ocultar de la tienda' : 'Publicar en la tienda'}
                        >
                          {producto.publicado ? <Globe className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {editandoId === producto.id ? (
                            <>
                              <button
                                onClick={() => guardarEdicion(producto.id)}
                                className="p-2 rounded-lg bg-voltech-success/20 text-voltech-success hover:bg-voltech-success/30 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelarEdicion}
                                className="p-2 rounded-lg bg-voltech-error/20 text-voltech-error hover:bg-voltech-error/30 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => abrirEdicion(producto)}
                                className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => eliminarProducto(producto.id)}
                                className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {productosFiltrados.length === 0 ? (
            <div className="col-span-full text-center py-12 text-voltech-muted">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay productos registrados</p>
              <p className="text-xs mt-1">Haz clic en "Nuevo Producto" para comenzar</p>
            </div>
          ) : (
            productosFiltrados.map((producto) => (
              <div key={producto.id} className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden hover:border-voltech-cyan/50 transition-all">
                <div className="relative h-48 bg-voltech-dark">
                  {producto.imagen ? (
                    <img src={producto.imagen} alt={producto.plataforma} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-voltech-muted opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => togglePublicado(producto.id)}
                      className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${
                        producto.publicado 
                          ? 'bg-voltech-success/80 text-white' 
                          : 'bg-voltech-dark/80 text-voltech-muted'
                      }`}
                    >
                      {producto.publicado ? <Globe className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="absolute top-2 left-2">
                    {producto.tipo === 'streaming' ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-voltech-purple/80 text-white flex items-center gap-1">
                        <MonitorPlay className="w-3 h-3" />
                        Streaming
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-voltech-cyan/80 text-white flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Físico
                      </span>
                    )}
                  </div>
                  {producto.esCombo && (
                    <div className="absolute top-12 left-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-voltech-warning/80 text-white flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        Combo
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2">
                    <span className={`text-xs px-2 py-1 rounded-full backdrop-blur-sm ${
                      producto.estado === 'nuevo' ? 'bg-voltech-success/80 text-white' :
                      producto.estado === 'oferta' ? 'bg-voltech-warning/80 text-white' :
                      producto.estado === 'kit' ? 'bg-voltech-cyan/80 text-white' :
                      producto.estado === 'combo' ? 'bg-voltech-purple/80 text-white' :
                      producto.estado === 'promocion' ? 'bg-voltech-warning/80 text-white' :
                      'bg-voltech-error/80 text-white'
                    }`}>
                      {producto.estado}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-white mb-1 truncate">{producto.plataforma}</h3>
                  <p className="text-xs text-voltech-muted mb-2">{producto.categoria}</p>
                  {producto.duracion && (
                    <p className="text-xs text-voltech-purple mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {producto.duracion}
                    </p>
                  )}
                  {producto.tipoOferta && (
                    <p className="text-xs text-voltech-warning mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {producto.tipoOferta}
                    </p>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-lg font-bold text-white">${(producto.precioDetal || producto.precioMayor).toFixed(2)}</p>
                      <p className="text-xs text-voltech-muted">Bs {producto.precioBs.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-voltech-muted">Stock</p>
                      <p className={`text-lg font-bold ${
                        producto.cantidad === 0 ? 'text-voltech-error' :
                        producto.cantidad <= 2 ? 'text-voltech-warning' : 'text-voltech-success'
                      }`}>
                        {producto.cantidad}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirEdicion(producto)}
                      className="flex-1 py-2 bg-voltech-dark border border-voltech-border rounded-lg text-xs text-voltech-muted hover:text-voltech-cyan hover:border-voltech-cyan transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarProducto(producto.id)}
                      className="py-2 px-3 bg-voltech-dark border border-voltech-border rounded-lg text-xs text-voltech-muted hover:text-voltech-error hover:border-voltech-error transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {editandoId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-voltech-surface border border-voltech-border rounded-xl p-6 sticky bottom-6"
        >
          <h3 className="text-lg font-bold text-white mb-4">Editando Producto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-3">
              <label className="block text-xs text-voltech-muted mb-1 ml-1">Imagen/Video</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-voltech-border rounded-lg p-4 text-center hover:border-voltech-cyan transition-colors">
                    {editData.imagen ? (
                      <div className="flex items-center gap-3">
                        <img src={editData.imagen} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                        <span className="text-sm text-voltech-muted">Cambiar imagen</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-voltech-muted">
                        <Upload className="w-5 h-5" />
                        <span className="text-sm">Haz clic para subir imagen/video</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleEditImageUpload}
                    className="hidden"
                  />
                </label>
                {editData.imagen && (
                  <a href={editData.imagen} target="_blank" rel="noopener noreferrer" className="p-3 bg-voltech-dark border border-voltech-border rounded-lg hover:border-voltech-cyan transition-colors">
                    <Eye className="w-5 h-5 text-voltech-cyan" />
                  </a>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs text-voltech-muted mb-1 ml-1">Precio Detal ($)</label>
              <input
                type="number"
                step="0.01"
                value={editData.precioDetal}
                onChange={(e) => setEditData({ ...editData, precioDetal: parseFloat(e.target.value) })}
                className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-voltech-muted mb-1 ml-1">Precio Oferta ($)</label>
              <input
                type="number"
                step="0.01"
                value={editData.precioOferta}
                onChange={(e) => setEditData({ ...editData, precioOferta: parseFloat(e.target.value) })}
                className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-voltech-muted mb-1 ml-1">Estado</label>
              <div className="flex gap-2">
                {['nuevo', 'oferta', 'kit', 'agotado'].map((estado) => (
                  <button
                    key={estado}
                    onClick={() => setEditData({ ...editData, estado })}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      editData.estado === estado
                        ? estado === 'nuevo' ? 'bg-voltech-success text-white' :
                          estado === 'oferta' ? 'bg-voltech-warning text-white' :
                          estado === 'kit' ? 'bg-voltech-cyan text-white' :
                          'bg-voltech-error text-white'
                        : 'bg-voltech-dark border border-voltech-border text-voltech-muted hover:border-voltech-muted'
                    }`}
                  >
                    {estado.charAt(0).toUpperCase() + estado.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3">
              <label className="block text-xs text-voltech-muted mb-1 ml-1">Descripción</label>
              <textarea
                value={editData.descripcion}
                onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
                className="input-voltech w-full rounded-lg px-4 py-2 text-sm h-20 resize-none"
                placeholder="Descripción del producto..."
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => guardarEdicion(editandoId)}
              className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Guardar Cambios
            </button>
            <button
              onClick={cancelarEdicion}
              className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-error transition-all flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showNuevoCampo.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-voltech-surface border border-voltech-border rounded-2xl w-full max-w-md"
            >
              <div className="border-b border-voltech-border p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                  Agregar {showNuevoCampo.tipo === 'categoria' ? 'Categoría' : 'Campo'}
                </h2>
                <button onClick={() => setShowNuevoCampo({ tipo: '', show: false })} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Nombre</label>
                  <input
                    type="text"
                    value={nuevoCampo.valor}
                    onChange={(e) => setNuevoCampo({ ...nuevoCampo, valor: e.target.value })}
                    className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                    placeholder="Ingresa el nombre"
                    autoFocus
                  />
                </div>

                <button
                  onClick={guardarNuevoCampo}
                  className="w-full btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}