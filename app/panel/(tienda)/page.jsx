'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // ✅ NUEVO: Conexión a Supabase
import { 
  Search, 
  ShoppingCart, 
  MessageCircle, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  MapPin, 
  CreditCard, 
  Tag, 
  Star, 
  Gift,
  Filter,
  ChevronDown,
  CheckCircle,
  User,
  LayoutDashboard,
  Eye,
  EyeOff,
  TrendingUp,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function TiendaPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeSection, setActiveSection] = useState('productos');
  const [productos, setProductos] = useState([]);
  const [settings, setSettings] = useState({});
  const [tasaBCV, setTasaBCV] = useState(36.5);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('local');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [customerLocation, setCustomerLocation] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showAdminStats, setShowAdminStats] = useState(false);
  const [showPreciosMayor, setShowPreciosMayor] = useState(false);

  // ✅ ACTUALIZADO: Carga desde Supabase con fallback a localStorage
  useEffect(() => {
    const cargarDatos = async () => {
      const userLogged = localStorage.getItem('voltech_user');
      if (userLogged) {
        setCurrentUser(JSON.parse(userLogged));
      }

      let prods = [], settingsData = {}, tasaData = 36.5;

      // 1. Intentar cargar desde Supabase
      if (supabase) {
        const [{ data: pData }, { data: sData }, { data: tData }] = await Promise.all([
          supabase.from('productos').select('*').eq('publicado', true),
          supabase.from('settings').select('clave, valor'),
          supabase.from('settings').select('valor').eq('clave', 'tasaBCV').single()
        ]);

        if (pData) prods = pData;
        if (sData) {
          sData.forEach(item => { settingsData[item.clave] = item.valor; });
        }
        if (tData?.valor) tasaData = tData.valor;
      }

      // 2. Fallback a localStorage si no hay datos de Supabase
      if (prods.length === 0) {
        const productosGuardados = localStorage.getItem('voltech_productos');
        if (productosGuardados) prods = JSON.parse(productosGuardados).filter(p => p.publicado);
      }
      if (Object.keys(settingsData).length === 0) {
        const settingsGuardados = localStorage.getItem('voltech_settings');
        if (settingsGuardados) settingsData = JSON.parse(settingsGuardados);
      }
      if (tasaData === 36.5) {
        const tasaGuardada = localStorage.getItem('voltech_tasa_bcv');
        if (tasaGuardada) tasaData = JSON.parse(tasaGuardada).tasa || 36.5;
      }

      setProductos(prods);
      setSettings(settingsData);
      setTasaBCV(tasaData);

      const cartGuardado = localStorage.getItem('voltech_cart');
      if (cartGuardado) {
        setCart(JSON.parse(cartGuardado));
      }
    };

    cargarDatos();
  }, []);

  useEffect(() => {
    localStorage.setItem('voltech_cart', JSON.stringify(cart));
  }, [cart]);

  const calcularPrecioBs = (precioUsd) => {
    return (precioUsd * tasaBCV).toFixed(2);
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
    toast.success('Producto eliminado del carrito');
  };

  const updateQuantity = (productoId, cantidad) => {
    if (cantidad <= 0) {
      removeFromCart(productoId);
    } else {
      setCart(cart.map(item => item.id === productoId ? { ...item, cantidad } : item));
    }
  };

  // ✅ ACTUALIZADO: Busca cupones en Supabase y fallback a localStorage (corrige el bug original que buscaba en sorteos)
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Ingresa un código de cupón');
      return;
    }

    let cuponEncontrado = null;

    // 1. Intentar buscar en Supabase
    if (supabase) {
      const { data } = await supabase
        .from('cupones')
        .select('*')
        .eq('codigo', couponCode.toUpperCase())
        .eq('estado', 'activo')
        .single();
      
      if (data && new Date(data.fecha_vencimiento) > new Date()) {
        cuponEncontrado = data;
      }
    }

    // 2. Fallback a localStorage
    if (!cuponEncontrado) {
      const cuponesGuardados = localStorage.getItem('voltech_cupones');
      if (cuponesGuardados) {
        const cupones = JSON.parse(cuponesGuardados);
        cuponEncontrado = cupones.find(c => 
          c.codigo === couponCode.toUpperCase() && 
          c.estado === 'activo' && 
          new Date(c.fecha_vencimiento) > new Date()
        );
      }
    }

    if (cuponEncontrado) {
      setAppliedCoupon(cuponEncontrado);
      const descuentoTexto = cuponEncontrado.tipo_descuento === 'porcentaje' 
        ? `${cuponEncontrado.valor}%` 
        : `$${cuponEncontrado.valor}`;
      toast.success(`Cupón aplicado: ${descuentoTexto} de descuento`);
    } else {
      toast.error('Cupón inválido o expirado');
    }
  };

  // ✅ ACTUALIZADO: Soporta tanto porcentaje como monto fijo
  const calculateTotal = () => {
    let subtotal = cart.reduce((sum, item) => {
      const precio = item.precioDetal || 0;
      return sum + (precio * item.cantidad);
    }, 0);

    if (appliedCoupon) {
      if (appliedCoupon.tipo_descuento === 'porcentaje') {
        subtotal = subtotal * (1 - appliedCoupon.valor / 100);
      } else {
        subtotal = Math.max(0, subtotal - appliedCoupon.valor);
      }
    }

    return subtotal;
  };

  const finalizarPedido = () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (!paymentMethod) {
      toast.error('Selecciona un método de pago');
      return;
    }

    const total = calculateTotal();
    const totalBs = calcularPrecioBs(total);

    let mensaje = `¡Hola! Quiero realizar el siguiente pedido:\n\n`;
    
    cart.forEach(item => {
      const precioUnitario = item.precioDetal || 0;
      const subtotal = precioUnitario * item.cantidad;
      mensaje += `• ${item.plataforma || item.producto} x${item.cantidad} - $${subtotal.toFixed(2)}\n`;
    });

    mensaje += `\nSubtotal: $${total.toFixed(2)} (Bs ${totalBs})\n`;
    
    if (appliedCoupon) {
      const descuentoTexto = appliedCoupon.tipo_descuento === 'porcentaje' 
        ? `${appliedCoupon.valor}%` 
        : `$${appliedCoupon.valor}`;
      mensaje += `Cupón aplicado: ${appliedCoupon.codigo} (${descuentoTexto} descuento)\n`;
    }

    mensaje += `\nMétodo de entrega: ${deliveryMethod === 'local' ? 'Retiro en tienda' : 'Delivery'}\n`;
    
    if (deliveryMethod === 'local') {
      mensaje += `Dirección de retiro: ${selectedAddress}\n`;
    } else {
      mensaje += `Ubicación de entrega: ${customerLocation}\n`;
    }

    mensaje += `\nMétodo de pago: ${paymentMethod}\n`;
    mensaje += `\n¿Cómo procedo con el pago?`;

    const telefonoTienda = settings.tienda?.telefono || settings.tienda?.whatsapp || '04121234567';
    const telefonoLimpio = telefonoTienda.replace(/\D/g, '');
    const url = `https://wa.me/58${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
    
    window.open(url, '_blank');
    toast.success('Pedido enviado por WhatsApp');
  };

  const comprarRapido = (producto) => {
    const precio = producto.precioDetal || 0;
    const precioBs = calcularPrecioBs(precio);

    let mensaje = `¡Hola! Quiero comprar:\n\n`;
    mensaje += `• ${producto.plataforma || producto.producto}\n`;
    mensaje += `Precio: $${precio.toFixed(2)} (Bs ${precioBs})\n\n`;
    mensaje += `¿Cómo procedo con el pago?`;

    const telefonoTienda = settings.tienda?.telefono || settings.tienda?.whatsapp || '04121234567';
    const telefonoLimpio = telefonoTienda.replace(/\D/g, '');
    const url = `https://wa.me/58${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
    
    window.open(url, '_blank');
  };

  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = 
      (p.producto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.marca || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const coincideCategoria = !filterCategory || p.categoria === filterCategory;
    const coincideMarca = !filterBrand || p.marca === filterBrand;
    
    return coincideBusqueda && coincideCategoria && coincideMarca && p.tipo === 'fisico' && !p.esCombo;
  });

  const streamingFiltrados = productos.filter(p => {
    const coincideBusqueda = 
      (p.plataforma || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const coincidePlataforma = !filterPlatform || p.plataforma === filterPlatform;
    
    return coincideBusqueda && coincidePlataforma && p.tipo === 'streaming' && !p.esCombo;
  });

  const kits = productos.filter(p => p.tipo === 'fisico' && p.esCombo);
  const combos = productos.filter(p => p.tipo === 'streaming' && p.esCombo);

  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
  const marcas = [...new Set(productos.map(p => p.marca).filter(Boolean))];
  const plataformas = [...new Set(productos.filter(p => p.tipo === 'streaming').map(p => p.plataforma).filter(Boolean))];

  const handleLogout = () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('voltech_user');
      setCurrentUser(null);
      toast.success('Sesión cerrada correctamente');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: { background: '#fff', color: '#000', border: '1px solid #e5e7eb' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">VOLTECH STORE</h1>
            
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => setActiveSection('productos')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'productos' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Productos
              </button>
              <button
                onClick={() => setActiveSection('streaming')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'streaming' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Streaming
              </button>
              <button
                onClick={() => setActiveSection('ofertas')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'ofertas' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Ofertas
              </button>
              <button
                onClick={() => setActiveSection('opiniones')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'opiniones' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Opiniones
              </button>
              <button
                onClick={() => setActiveSection('sorteos')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'sorteos' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sorteos
              </button>
            </nav>

            <div className="flex items-center gap-4">
              {/* Botón Admin Stats (solo si está logueado) */}
              {currentUser && (
                <button
                  onClick={() => setShowAdminStats(!showAdminStats)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                  title="Estadísticas Admin"
                >
                  <TrendingUp className="w-5 h-5" />
                </button>
              )}

              {/* Botón Carrito */}
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <ShoppingCart className="w-6 h-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>

              {/* Usuario logueado */}
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push('/panel/dashboard')}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="text-sm font-medium">Panel</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 hover:text-red-600"
                    title="Cerrar sesión"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Iniciar Sesión</span>
                </button>
              )}
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={activeSection === 'productos' ? 'Buscar productos, marcas, categorías...' : 'Buscar plataformas...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </header>

      {/* Panel de Estadísticas Admin (solo visible si está logueado) */}
      <AnimatePresence>
        {currentUser && showAdminStats && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-purple-50 border-b border-purple-200"
          >
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-purple-900">Panel de Administración</h3>
                <button
                  onClick={() => setShowPreciosMayor(!showPreciosMayor)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {showPreciosMayor ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreciosMayor ? 'Ocultar Precios Mayor' : 'Mostrar Precios Mayor'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600">Productos Publicados</p>
                  <p className="text-2xl font-bold text-purple-600">{productos.length}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600">Valor Inventario</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${productos.reduce((sum, p) => sum + ((p.precioMayor || 0) * (p.cantidad || 0)), 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600">Items en Carrito</p>
                  <p className="text-2xl font-bold text-blue-600">{cart.length}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600">Tasa BCV</p>
                  <p className="text-2xl font-bold text-orange-600">Bs {tasaBCV}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* SECCIÓN PRODUCTOS */}
        {activeSection === 'productos' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Productos</h2>
            
            {/* Filtros */}
            <div className="flex flex-wrap gap-4 mb-6">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las marcas</option>
                {marcas.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Grid de productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productosFiltrados.map(producto => (
                <div key={producto.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {producto.imagen && (
                    <img 
                      src={producto.imagen} 
                      alt={producto.producto}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{producto.producto}</h3>
                    <p className="text-sm text-gray-600 mb-2">{producto.marca}</p>
                    <p className="text-xs text-gray-500 mb-3">{producto.categoria}</p>
                    
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-gray-900">${producto.precioDetal?.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Bs {calcularPrecioBs(producto.precioDetal)}</p>
                      
                      {/* Precio Mayor (solo admin) */}
                      {currentUser && showPreciosMayor && producto.precioMayor && (
                        <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                          <p className="text-xs text-purple-600">Precio Mayor: ${producto.precioMayor.toFixed(2)}</p>
                          <p className="text-xs text-purple-600">Ganancia: ${((producto.precioDetal || 0) - producto.precioMayor).toFixed(2)}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => comprarRapido(producto)}
                        className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </button>
                      <button
                        onClick={() => addToCart(producto)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Carrito
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Kits */}
            {kits.length > 0 && (
              <div className="mt-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Kits Especiales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {kits.map(kit => (
                    <div key={kit.id} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-md overflow-hidden">
                      <div className="p-6">
                        <h4 className="font-bold text-xl text-gray-900 mb-2">{kit.producto}</h4>
                        <p className="text-sm text-gray-600 mb-4">{kit.descripcion}</p>
                        
                        <div className="mb-4">
                          <p className="text-3xl font-bold text-blue-600">${kit.precioDetal?.toFixed(2)}</p>
                          <p className="text-lg text-gray-600">Bs {calcularPrecioBs(kit.precioDetal)}</p>
                          
                          {currentUser && showPreciosMayor && kit.precioMayor && (
                            <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                              <p className="text-sm text-purple-600">Precio Mayor: ${kit.precioMayor.toFixed(2)}</p>
                              <p className="text-sm text-purple-600">Ganancia: ${((kit.precioDetal || 0) - kit.precioMayor).toFixed(2)}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => comprarRapido(kit)}
                            className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Comprar por WhatsApp
                          </button>
                          <button
                            onClick={() => addToCart(kit)}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Agregar al Carrito
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN STREAMING */}
        {activeSection === 'streaming' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Streaming</h2>
            
            {/* Filtros */}
            <div className="flex flex-wrap gap-4 mb-6">
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las plataformas</option>
                {plataformas.map(plat => (
                  <option key={plat} value={plat}>{plat}</option>
                ))}
              </select>
            </div>

            {/* Grid de plataformas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {streamingFiltrados.map(producto => (
                <div key={producto.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {producto.imagen && (
                    <img 
                      src={producto.imagen} 
                      alt={producto.plataforma}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{producto.plataforma}</h3>
                    {producto.duracion && (
                      <p className="text-sm text-gray-600 mb-2">Duración: {producto.duracion}</p>
                    )}
                    
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-gray-900">${producto.precioDetal?.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Bs {calcularPrecioBs(producto.precioDetal)}</p>
                      
                      {currentUser && showPreciosMayor && producto.precioMayor && (
                        <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                          <p className="text-xs text-purple-600">Precio Mayor: ${producto.precioMayor.toFixed(2)}</p>
                          <p className="text-xs text-purple-600">Ganancia: ${((producto.precioDetal || 0) - producto.precioMayor).toFixed(2)}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => comprarRapido(producto)}
                        className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        WhatsApp
                      </button>
                      <button
                        onClick={() => addToCart(producto)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Carrito
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Combos */}
            {combos.length > 0 && (
              <div className="mt-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Combos Streaming</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {combos.map(combo => (
                    <div key={combo.id} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-md overflow-hidden">
                      <div className="p-6">
                        <h4 className="font-bold text-xl text-gray-900 mb-2">{combo.producto}</h4>
                        <p className="text-sm text-gray-600 mb-4">{combo.descripcion}</p>
                        
                        {combo.plataformasCombo && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Incluye:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {combo.plataformasCombo.map((plat, idx) => (
                                <li key={idx}>{plat}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="mb-4">
                          <p className="text-3xl font-bold text-purple-600">${combo.precioDetal?.toFixed(2)}</p>
                          <p className="text-lg text-gray-600">Bs {calcularPrecioBs(combo.precioDetal)}</p>
                          
                          {currentUser && showPreciosMayor && combo.precioMayor && (
                            <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                              <p className="text-sm text-purple-600">Precio Mayor: ${combo.precioMayor.toFixed(2)}</p>
                              <p className="text-sm text-purple-600">Ganancia: ${((combo.precioDetal || 0) - combo.precioMayor).toFixed(2)}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => comprarRapido(combo)}
                            className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Comprar por WhatsApp
                          </button>
                          <button
                            onClick={() => addToCart(combo)}
                            className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Agregar al Carrito
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN OFERTAS */}
        {activeSection === 'ofertas' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Ofertas Especiales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productos
                .filter(p => p.publicado && p.tipoOferta)
                .map(producto => (
                  <div key={producto.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-md overflow-hidden">
                    <div className="p-6">
                      <div className="inline-block bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold mb-3">
                        {producto.tipoOferta}
                      </div>
                      <h3 className="font-bold text-xl text-gray-900 mb-2">{producto.producto || producto.plataforma}</h3>
                      
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 line-through">
                          ${producto.precioMayor?.toFixed(2)}
                        </p>
                        <p className="text-3xl font-bold text-red-600">${producto.precioDetal?.toFixed(2)}</p>
                        <p className="text-lg text-gray-600">Bs {calcularPrecioBs(producto.precioDetal)}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => comprarRapido(producto)}
                          className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Comprar
                        </button>
                        <button
                          onClick={() => addToCart(producto)}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Carrito
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* SECCIÓN OPINIONES */}
        {activeSection === 'opiniones' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Opiniones de Clientes</h2>
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Próximamente podrás dejar tu opinión sobre nuestros productos y servicios.</p>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Dejar Opinión
              </button>
            </div>
          </div>
        )}

        {/* SECCIÓN SORTEOS */}
        {activeSection === 'sorteos' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Sorteos Activos</h2>
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Gift className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Participa en nuestros sorteos y gana descuentos especiales.</p>
              <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                Ver Sorteos
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Carrito lateral */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex justify-end"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="bg-white w-full max-w-md h-full overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Carrito de Compras</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Tu carrito está vacío</p>
                  </div>
                ) : (
                  <>
                    {/* Items del carrito */}
                    <div className="space-y-4 mb-6">
                      {cart.map(item => (
                        <div key={item.id} className="flex gap-4 bg-gray-50 p-4 rounded-lg">
                          {item.imagen && (
                            <img 
                              src={item.imagen} 
                              alt={item.producto || item.plataforma}
                              className="w-20 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {item.producto || item.plataforma}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              ${(item.precioDetal * item.cantidad).toFixed(2)}
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-medium">{item.cantidad}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="ml-auto p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Método de entrega */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Método de Entrega
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setDeliveryMethod('local')}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            deliveryMethod === 'local' 
                              ? 'border-blue-600 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <MapPin className="w-5 h-5 mx-auto mb-1" />
                          <p className="text-sm font-medium">Local</p>
                        </button>
                        <button
                          onClick={() => setDeliveryMethod('delivery')}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            deliveryMethod === 'delivery' 
                              ? 'border-blue-600 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <MapPin className="w-5 h-5 mx-auto mb-1" />
                          <p className="text-sm font-medium">Delivery</p>
                        </button>
                      </div>

                      {deliveryMethod === 'local' && settings.tienda?.direcciones && (
                        <select
                          value={selectedAddress}
                          onChange={(e) => setSelectedAddress(e.target.value)}
                          className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Selecciona dirección de retiro</option>
                          {settings.tienda.direcciones.map((dir, idx) => (
                            <option key={idx} value={dir}>{dir}</option>
                          ))}
                        </select>
                      )}

                      {deliveryMethod === 'delivery' && (
                        <input
                          type="text"
                          value={customerLocation}
                          onChange={(e) => setCustomerLocation(e.target.value)}
                          placeholder="Ingresa tu ubicación"
                          className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      )}
                    </div>

                    {/* Método de pago */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Método de Pago
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Selecciona método de pago</option>
                        {settings.pagos && Object.entries(settings.pagos)
                          .filter(([_, activo]) => activo)
                          .map(([metodo]) => (
                            <option key={metodo} value={metodo}>
                              {metodo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Cupón */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Código de Cupón
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Ingresa tu cupón"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                        />
                        <button
                          onClick={applyCoupon}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Aplicar
                        </button>
                      </div>
                      {appliedCoupon && (
                        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Cupón aplicado: {appliedCoupon.tipo_descuento === 'porcentaje' ? `${appliedCoupon.valor}%` : `$${appliedCoupon.valor}`} descuento
                        </p>
                      )}
                    </div>

                    {/* Total */}
                    <div className="border-t border-gray-200 pt-4 mb-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">${calculateTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Bs:</span>
                        <span className="font-medium">Bs {calcularPrecioBs(calculateTotal())}</span>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="space-y-2">
                      <button
                        onClick={finalizarPedido}
                        className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Finalizar Pedido por WhatsApp
                      </button>
                      <button
                        onClick={() => setCart([])}
                        className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Vaciar Carrito
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}