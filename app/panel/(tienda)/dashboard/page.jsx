'use client';


import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  AlertTriangle,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Clock,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const [productos, setProductos] = useState([]);
  const [equipo, setEquipo] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [stats, setStats] = useState({
    ventasHoy: 0,
    ventasMes: 0,
    pedidos: 0,
    clientesActivos: 0,
    productosPublicados: 0,
    valorInventario: 0,
    stockBajo: 0,
    agotados: 0,
    ingresosHoy: 0,
  });

  useEffect(() => {
    const productosGuardados = localStorage.getItem('voltech_productos');
    const equipoGuardado = localStorage.getItem('voltech_equipo');
    const ventasGuardadas = localStorage.getItem('voltech_ventas');

    if (productosGuardados) {
      const prods = JSON.parse(productosGuardados);
      setProductos(prods);
      
      const valorInv = prods.reduce((acc, p) => acc + (p.precioMayor * p.cantidad), 0);
      const publicados = prods.filter(p => p.publicado).length;
      const stockBajo = prods.filter(p => p.cantidad > 0 && p.cantidad <= 2).length;
      const agotados = prods.filter(p => p.cantidad === 0).length;

      setStats(prev => ({
        ...prev,
        productosPublicados: publicados,
        valorInventario: valorInv,
        stockBajo: stockBajo,
        agotados: agotados,
      }));
    }

    if (equipoGuardado) {
      const eq = JSON.parse(equipoGuardado);
      setEquipo(eq);
      setStats(prev => ({
        ...prev,
        clientesActivos: eq.filter(m => m.activo).length,
      }));
    }

    if (ventasGuardadas) {
      const vts = JSON.parse(ventasGuardadas);
      setVentas(vts);
      const hoy = new Date().toISOString().split('T')[0];
      const ventasHoy = vts.filter(v => v.fecha === hoy);
      const ingresosHoy = ventasHoy.reduce((acc, v) => acc + (v.montoAbonado || v.total || 0), 0);
      setStats(prev => ({
        ...prev,
        ventasHoy: ventasHoy.length,
        ingresosHoy: ingresosHoy,
      }));
    }
  }, []);

  const ventasSemanales = [
    { dia: 'Lun', ventas: 120 },
    { dia: 'Mar', ventas: 180 },
    { dia: 'Mié', ventas: 90 },
    { dia: 'Jue', ventas: 250 },
    { dia: 'Vie', ventas: 320 },
    { dia: 'Sáb', ventas: 410 },
    { dia: 'Dom', ventas: 280 },
  ];

  const productosMasVendidos = productos
    .filter(p => p.publicado)
    .map(p => ({
      nombre: (p.plataforma || p.producto || '').length > 10 ? (p.plataforma || p.producto || '').substring(0, 10) + '...' : (p.plataforma || p.producto || ''),
      ventas: p.cantidad
    }))
    .sort((a, b) => b.ventas - a.ventas)
    .slice(0, 5);

  const ultimosMovimientos = productos
    .slice(-5)
    .reverse()
    .map(p => ({
      plataforma: p.plataforma,
      producto: p.producto,
      accion: p.fecha ? 'Actualizado' : 'Creado',
      fecha: p.fecha || 'Reciente',
      cantidad: p.cantidad,
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-voltech-muted mt-1">Resumen general de tu tienda</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-voltech-muted">Última actualización</p>
          <p className="text-sm text-white">Hace un momento</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-voltech-cyan to-blue-500">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs text-voltech-success">
              <ArrowUpRight className="w-3 h-3" />
              +12.5%
            </div>
          </div>
          <p className="text-xs text-voltech-muted mb-1">Valor Inventario</p>
          <p className="text-2xl font-bold text-white">${stats.valorInventario.toFixed(2)}</p>
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-voltech-purple to-pink-500">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs text-voltech-success">
              <ArrowUpRight className="w-3 h-3" />
              {stats.productosPublicados}
            </div>
          </div>
          <p className="text-xs text-voltech-muted mb-1">Productos Publicados</p>
          <p className="text-2xl font-bold text-white">{stats.productosPublicados}</p>
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs text-voltech-success">
              <ArrowUpRight className="w-3 h-3" />
              Activos
            </div>
          </div>
          <p className="text-xs text-voltech-muted mb-1">Miembros Equipo</p>
          <p className="text-2xl font-bold text-white">{stats.clientesActivos}</p>
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs text-voltech-error">
              <ArrowDownRight className="w-3 h-3" />
              {stats.agotados}
            </div>
          </div>
          <p className="text-xs text-voltech-muted mb-1">Productos Agotados</p>
          <p className="text-2xl font-bold text-white">{stats.agotados}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Actividad Semanal</h3>
              <p className="text-xs text-voltech-muted">Últimos 7 días</p>
            </div>
            <span className="text-xs bg-voltech-cyan/20 text-voltech-cyan px-2 py-1 rounded">
              En vivo
            </span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ventasSemanales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="dia" stroke="#a0a0b0" fontSize={12} />
              <YAxis stroke="#a0a0b0" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#12121a', 
                  border: '1px solid #1e1e2e',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="ventas" 
                stroke="#00d4ff" 
                strokeWidth={2}
                dot={{ fill: '#00d4ff', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Productos en Inventario</h3>
              <p className="text-xs text-voltech-muted">Top 5 por stock</p>
            </div>
            <span className="text-xs bg-voltech-purple/20 text-voltech-purple px-2 py-1 rounded">
              Top 5
            </span>
          </div>
          {productosMasVendidos.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-voltech-muted">
              <p className="text-sm">Agrega productos para ver estadísticas</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={productosMasVendidos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="nombre" stroke="#a0a0b0" fontSize={12} />
                <YAxis stroke="#a0a0b0" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#12121a', 
                    border: '1px solid #1e1e2e',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="ventas" 
                  fill="#bf00ff"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-voltech-warning" />
            <h3 className="text-lg font-semibold text-white">Alertas</h3>
            <span className="ml-auto text-xs bg-voltech-error/20 text-voltech-error px-2 py-1 rounded">
              {stats.stockBajo + stats.agotados}
            </span>
          </div>
          <div className="space-y-3">
            {stats.agotados > 0 && (
              <div className="p-3 rounded-lg bg-voltech-error/10 border border-voltech-error/30">
                <p className="text-sm text-white font-medium">{stats.agotados} producto(s) agotado(s)</p>
                <p className="text-xs text-voltech-muted mt-1">Requieren reposición inmediata</p>
              </div>
            )}
            {stats.stockBajo > 0 && (
              <div className="p-3 rounded-lg bg-voltech-warning/10 border border-voltech-warning/30">
                <p className="text-sm text-white font-medium">{stats.stockBajo} producto(s) con stock bajo</p>
                <p className="text-xs text-voltech-muted mt-1">Considera hacer un pedido pronto</p>
              </div>
            )}
            {stats.stockBajo === 0 && stats.agotados === 0 && (
              <div className="p-3 rounded-lg bg-voltech-success/10 border border-voltech-success/30">
                <p className="text-sm text-white font-medium">¡Todo en orden!</p>
                <p className="text-xs text-voltech-muted mt-1">No hay alertas pendientes</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-voltech-surface border border-voltech-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-voltech-cyan" />
              <h3 className="text-lg font-semibold text-white">Últimos Movimientos</h3>
            </div>
            <span className="text-xs text-voltech-muted">{ultimosMovimientos.length} registros</span>
          </div>
          <div className="space-y-3">
            {ultimosMovimientos.length === 0 ? (
              <p className="text-sm text-voltech-muted text-center py-4">
                No hay movimientos recientes. Agrega productos para comenzar.
              </p>
            ) : (
              ultimosMovimientos.map((mov, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-voltech-border/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-voltech-cyan to-voltech-purple flex items-center justify-center text-white font-bold text-sm">
                      {(mov.plataforma || mov.producto || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{mov.plataforma || mov.producto}</p>
                      <p className="text-xs text-voltech-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {mov.fecha}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-voltech-cyan">{mov.accion}</p>
                    <p className="text-xs text-voltech-muted">Stock: {mov.cantidad}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}