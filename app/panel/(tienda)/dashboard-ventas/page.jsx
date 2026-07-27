'use client';


import { useState, useEffect } from 'react';
import { 
  BarChart,
  LineChart,
  PieChart,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Calendar,
  AlertTriangle,
  ShoppingCart,
  PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function DashboardVentasPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [ventasProductos, setVentasProductos] = useState([]);
  const [ventasStreaming, setVentasStreaming] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carteras, setCarteras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userLogged = localStorage.getItem('voltech_user');
    if (userLogged) {
      setCurrentUser(JSON.parse(userLogged));
    }

    // ✅ CORRECCIÓN: Cargar ventas de productos de AMBAS fuentes
    const ventasProductosGuardadas = localStorage.getItem('voltech_ventas_productos');
    const ventasLegacy = localStorage.getItem('voltech_ventas'); // Clave antigua
    
    let todasVentasProductos = [];
    
    if (ventasProductosGuardadas) {
      const ventas = JSON.parse(ventasProductosGuardadas);
      todasVentasProductos = [...todasVentasProductos, ...ventas];
    }
    
    if (ventasLegacy) {
      const ventas = JSON.parse(ventasLegacy);
      // Filtrar solo las que sean tipo producto o no tengan tipo definido (asumir producto)
      const ventasProductosLegacy = ventas.filter(v => !v.tipo || v.tipo === 'producto' || v.tipo === 'fisico');
      todasVentasProductos = [...todasVentasProductos, ...ventasProductosLegacy];
    }
    
    // Agregar tipo 'producto' a cada venta y eliminar duplicados por ID
    const ventasUnicasProductos = [...new Map(todasVentasProductos.map(v => [v.id, { ...v, tipo: 'producto' }])).values()];
    setVentasProductos(ventasUnicasProductos);

    // Cargar ventas de streaming
    const ventasStreamingGuardadas = localStorage.getItem('voltech_ventas_streaming');
    if (ventasStreamingGuardadas) {
      const ventas = JSON.parse(ventasStreamingGuardadas);
      // Agregar tipo 'streaming' a cada venta
      const ventasConTipo = ventas.map(v => ({ ...v, tipo: 'streaming' }));
      setVentasStreaming(ventasConTipo);
    }

    // Cargar clientes
    const clientesGuardados = localStorage.getItem('voltech_clientes');
    if (clientesGuardados) {
      setClientes(JSON.parse(clientesGuardados));
    }

    // Cargar carteras
    const carterasGuardadas = localStorage.getItem('voltech_carteras');
    if (carterasGuardadas) {
      setCarteras(JSON.parse(carterasGuardadas));
    }

    setLoading(false);
  }, []);

  const isAdmin = currentUser?.rol === 'admin';

  // ✅ FUNCIÓN AUXILIAR: Obtener el nombre de la cartera (maneja tanto 'cartera' como 'carteraId')
  const obtenerNombreCartera = (venta) => {
    if (venta.cartera) return venta.cartera; // Formato antiguo o directo
    if (venta.carteraId) {
      // Buscar el nombre usando el ID guardado
      const carteraEncontrada = carteras.find(c => c.id === venta.carteraId || c.nombre === venta.carteraId);
      return carteraEncontrada ? carteraEncontrada.nombre : venta.carteraId;
    }
    return 'Sin cartera';
  };

  // Combinar todas las ventas y ordenar por fecha
  const todasLasVentas = [...ventasProductos, ...ventasStreaming].sort((a, b) => 
    new Date(b.fecha || b.fechaRegistro) - new Date(a.fecha || a.fechaRegistro)
  );

  // Estadísticas generales
  const totalVentas = todasLasVentas.length;
  const totalIngresos = todasLasVentas.reduce((sum, venta) => sum + (venta.total || 0), 0);
  const clientesUnicos = new Set(todasLasVentas.map(venta => venta.cliente)).size;
  
  const hoy = new Date().toDateString();
  const ventasHoy = todasLasVentas.filter(venta => 
    new Date(venta.fecha || venta.fechaRegistro).toDateString() === hoy
  ).length;
  
  const ventaMasAlta = todasLasVentas.reduce((max, venta) => 
    (venta.total > (max?.total || 0)) ? venta : max, null);
  
  // Calcular ventas por vendedor
  const ventasPorVendedor = todasLasVentas.reduce((acc, venta) => {
    const vendedor = venta.vendedor || 'Sin vendedor';
    acc[vendedor] = (acc[vendedor] || 0) + 1;
    return acc;
  }, {});

  const vendedorTop = Object.entries(ventasPorVendedor).reduce((a, b) => 
    a[1] > b[1] ? a : b, ['', 0]);

  // Calcular distribución por tipo
  const totalProductos = ventasProductos.length;
  const totalStreaming = ventasStreaming.length;
  const porcentajeProductos = totalVentas > 0 ? Math.round((totalProductos / totalVentas) * 100) : 0;
  const porcentajeStreaming = totalVentas > 0 ? Math.round((totalStreaming / totalVentas) * 100) : 0;

  // ✅ Calcular ingresos por cartera usando la función auxiliar
  const ingresosPorCartera = todasLasVentas.reduce((acc, venta) => {
    const nombreCartera = obtenerNombreCartera(venta);
    acc[nombreCartera] = (acc[nombreCartera] || 0) + (venta.total || 0);
    return acc;
  }, {});

  // Obtener descripción del producto/servicio
  const getDescripcionProducto = (venta) => {
    if (venta.tipo === 'streaming') {
      // Para streaming, mostrar la plataforma
      if (venta.plataformas && venta.plataformas.length > 0) {
        return venta.plataformas[0].plataforma || 'Streaming';
      }
      return 'Servicio Streaming';
    } else {
      // Para productos, mostrar el nombre del primer producto
      if (venta.productos && venta.productos.length > 0) {
        return venta.productos[0].nombre || venta.productos[0].plataforma || 'Producto';
      }
      return 'Producto Físico';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-voltech-cyan mx-auto mb-4"></div>
          <p className="text-voltech-muted">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' },
        success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } },
      }} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard de Ventas</h1>
          <p className="text-sm text-voltech-muted mt-1">Vista general de tu actividad de ventas</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Filtro por fecha
          </button>
          <button className="px-4 py-2 bg-voltech-purple/20 text-voltech-purple rounded-lg text-sm hover:bg-voltech-purple/30 transition-colors flex items-center gap-2">
            <Users className="w-4 h-4" /> Filtro por vendedor
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-cyan/20">
              <DollarSign className="w-5 h-5 text-voltech-cyan" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Ingresos totales</p>
              <p className="text-lg font-bold text-white">${totalIngresos.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-purple/20">
              <BarChart className="w-5 h-5 text-voltech-purple" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Total de Ventas</p>
              <p className="text-lg font-bold text-white">{totalVentas}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-success/20">
              <Users className="w-5 h-5 text-voltech-success" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Clientes únicos</p>
              <p className="text-lg font-bold text-white">{clientesUnicos}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-warning/20">
              <TrendingUp className="w-5 h-5 text-voltech-warning" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Ventas hoy</p>
              <p className="text-lg font-bold text-white">{ventasHoy}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-error/20">
              <AlertTriangle className="w-5 h-5 text-voltech-error" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Venta más alta</p>
              <p className="text-lg font-bold text-white">${ventaMasAlta?.total ? ventaMasAlta.total.toFixed(2) : '0.00'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico de Ventas por Tipo */}
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6 col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-voltech-cyan/20">
                <BarChart className="w-5 h-5 text-voltech-cyan" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Ventas por Tipo</h3>
                <p className="text-xs text-voltech-muted">Distribución de ventas entre productos y streaming</p>
              </div>
            </div>
          </div>
          
          <div className="h-64 flex items-center justify-center">
            <div className="w-full h-full flex flex-col items-center justify-center gap-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-voltech-purple/20 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-voltech-purple" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Ventas Productos</p>
                    <p className="text-xs text-voltech-muted">{totalProductos} ventas ({porcentajeProductos}%)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-voltech-cyan/20 flex items-center justify-center">
                    <PlayCircle className="w-6 h-6 text-voltech-cyan" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Ventas Streaming</p>
                    <p className="text-xs text-voltech-muted">{totalStreaming} ventas ({porcentajeStreaming}%)</p>
                  </div>
                </div>
              </div>
              
              {/* Barra de progreso visual */}
              <div className="w-full max-w-md h-4 bg-voltech-dark rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-voltech-purple transition-all duration-500"
                  style={{ width: `${porcentajeProductos}%` }}
                ></div>
                <div 
                  className="h-full bg-voltech-cyan transition-all duration-500"
                  style={{ width: `${porcentajeStreaming}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Ventas por Vendedor */}
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-voltech-success/20">
                <Users className="w-5 h-5 text-voltech-success" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Ventas por Vendedor</h3>
                <p className="text-xs text-voltech-muted">Desglose de ventas por miembro del equipo</p>
              </div>
            </div>
          </div>
          
          <div className="h-64 flex items-center justify-center">
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              {Object.entries(ventasPorVendedor).map(([vendedor, count], index) => (
                <div key={vendedor} className="flex items-center gap-3 w-full px-4">
                  <div className="w-10 h-10 rounded-full bg-voltech-cyan/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-voltech-cyan" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{vendedor}</p>
                    <p className="text-xs text-voltech-muted">{count} ventas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-voltech-cyan">{count}</p>
                  </div>
                </div>
              ))}
              {Object.keys(ventasPorVendedor).length === 0 && (
                <p className="text-sm text-voltech-muted">No hay ventas registradas</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Ventas Recientes */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-voltech-cyan/20">
              <Clock className="w-5 h-5 text-voltech-cyan" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ventas Recientes</h3>
              <p className="text-xs text-voltech-muted">Últimas transacciones realizadas</p>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-voltech-dark border-b border-voltech-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Producto/Servicio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Método de Pago</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Cartera</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Vendedor</th>
              </tr>
            </thead>
            <tbody>
              {todasLasVentas.slice(0, 10).map((venta, index) => (
                <tr key={`${venta.id || index}-${venta.tipo}`} className="border-b border-voltech-border hover:bg-voltech-border/30">
                  <td className="px-4 py-3 text-sm text-white">
                    {new Date(venta.fecha || venta.fechaRegistro).toLocaleDateString('es-VE')}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{venta.cliente || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit ${
                      venta.tipo === 'streaming' 
                        ? 'bg-voltech-cyan/20 text-voltech-cyan' 
                        : 'bg-voltech-purple/20 text-voltech-purple'
                    }`}>
                      {venta.tipo === 'streaming' ? (
                        <><PlayCircle className="w-3 h-3" /> Streaming</>
                      ) : (
                        <><ShoppingCart className="w-3 h-3" /> Producto</>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    {getDescripcionProducto(venta)}
                  </td>
                  <td className="px-4 py-3 text-sm text-voltech-muted">
                    {venta.metodoPago ? venta.metodoPago.replace('_', ' ') : 'N/A'}
                  </td>
                  {/* ✅ CORRECCIÓN: Usar la función auxiliar para mostrar el nombre de la cartera */}
                  <td className="px-4 py-3 text-sm text-voltech-muted">
                    {obtenerNombreCartera(venta)}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-voltech-success">
                    ${(venta.total || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-voltech-muted">{venta.vendedor || 'N/A'}</td>
                </tr>
              ))}
              {todasLasVentas.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-voltech-muted">
                    No hay ventas registradas aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen por Cartera */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-voltech-success/20">
              <DollarSign className="w-5 h-5 text-voltech-success" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Resumen por Cartera</h3>
              <p className="text-xs text-voltech-muted">Distribución de ingresos por cartera</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(ingresosPorCartera).map(([cartera, monto], index) => (
            <div key={index} className="bg-voltech-dark/50 border border-voltech-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-voltech-cyan/20 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-voltech-cyan" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{cartera}</p>
                    <p className="text-xs text-voltech-muted">Cartera {index + 1}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-voltech-success">${monto.toFixed(2)}</span>
              </div>
              <div className="h-2 bg-voltech-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-voltech-cyan transition-all duration-500" 
                  style={{ width: `${totalIngresos > 0 ? (monto / totalIngresos) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          ))}
          {Object.keys(ingresosPorCartera).length === 0 && (
            <div className="col-span-3 text-center py-8 text-voltech-muted">
              No hay ingresos registrados por cartera
            </div>
          )}
        </div>
      </div>
    </div>
  );
}