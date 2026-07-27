'use client';


import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Package,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';

export default function FinanzasPage() {
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [stats, setStats] = useState({
    inversionTotal: 0,
    valorVentaTotal: 0,
    gananciaPotencial: 0,
    margenPromedio: 0,
    productosConMargen: 0,
    ingresosTotales: 0,
    ventasTotales: 0,
  });

  useEffect(() => {
    const productosGuardados = localStorage.getItem('voltech_productos');
    const ventasGuardadas = localStorage.getItem('voltech_ventas');
    
    if (productosGuardados) {
      const prods = JSON.parse(productosGuardados);
      setProductos(prods);

      const inversion = prods.reduce((acc, p) => acc + (p.precioMayor * p.cantidad), 0);
      const valorVenta = prods.reduce((acc, p) => acc + ((p.precioDetal || p.precioMayor) * p.cantidad), 0);
      const ganancia = valorVenta - inversion;
      const margen = inversion > 0 ? (ganancia / inversion) * 100 : 0;
      const conMargen = prods.filter(p => (p.precioDetal || 0) > p.precioMayor).length;

      setStats(prev => ({
        ...prev,
        inversionTotal: inversion,
        valorVentaTotal: valorVenta,
        gananciaPotencial: ganancia,
        margenPromedio: margen,
        productosConMargen: conMargen,
      }));
    }

    if (ventasGuardadas) {
      const vts = JSON.parse(ventasGuardadas);
      setVentas(vts);
      const ingresosTotales = vts.reduce((acc, v) => acc + (v.montoAbonado || v.total || 0), 0);
      setStats(prev => ({
        ...prev,
        ingresosTotales: ingresosTotales,
        ventasTotales: vts.length,
      }));
    }
  }, []);

  const datosMargenes = productos
    .filter(p => (p.precioDetal || 0) > 0)
    .map(p => ({
      nombre: (p.plataforma || p.producto || '').length > 15 ? (p.plataforma || p.producto || '').substring(0, 15) + '...' : (p.plataforma || p.producto || ''),
      margen: p.precioMayor > 0 ? ((p.precioDetal - p.precioMayor) / p.precioMayor * 100) : 0,
      ganancia: ((p.precioDetal || 0) - p.precioMayor) * p.cantidad,
    }))
    .sort((a, b) => b.margen - a.margen)
    .slice(0, 6);

  const categoriasData = {};
  productos.forEach(p => {
    const cat = p.categoria || 'Sin categoría';
    if (!categoriasData[cat]) {
      categoriasData[cat] = 0;
    }
    categoriasData[cat] += p.precioMayor * p.cantidad;
  });

  const datosCategorias = Object.entries(categoriasData).map(([name, value]) => ({ name, value }));
  const COLORS = ['#00d4ff', '#bf00ff', '#00ff88', '#ff9500', '#ff3366', '#9500ff'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Finanzas</h1>
          <p className="text-sm text-voltech-muted mt-1">Análisis de inversión, márgenes y ganancias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-voltech-cyan to-blue-500">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-voltech-muted mb-1">Inversión Total</p>
          <p className="text-2xl font-bold text-white">${stats.inversionTotal.toFixed(2)}</p>
          <p className="text-xs text-voltech-muted mt-1">Precio mayor × stock</p>
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-voltech-purple to-pink-500">
              <Package className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-voltech-muted mb-1">Valor de Venta</p>
          <p className="text-2xl font-bold text-white">${stats.valorVentaTotal.toFixed(2)}</p>
          <p className="text-xs text-voltech-muted mt-1">Precio detal × stock</p>
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs text-voltech-success">
              <ArrowUpRight className="w-3 h-3" />
              Potencial
            </div>
          </div>
          <p className="text-xs text-voltech-muted mb-1">Ganancia Potencial</p>
          <p className="text-2xl font-bold text-voltech-success">${stats.gananciaPotencial.toFixed(2)}</p>
          <p className="text-xs text-voltech-muted mt-1">Si se vende todo el stock</p>
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
              <Calculator className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-voltech-muted mb-1">Margen Promedio</p>
          <p className="text-2xl font-bold text-white">{stats.margenPromedio.toFixed(1)}%</p>
          <p className="text-xs text-voltech-muted mt-1">{stats.productosConMargen} productos con margen</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-voltech-cyan" />
              <h3 className="text-lg font-semibold text-white">Márgenes por Producto</h3>
            </div>
            <span className="text-xs bg-voltech-cyan/20 text-voltech-cyan px-2 py-1 rounded">
              % Ganancia
            </span>
          </div>
          {datosMargenes.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-voltech-muted">
              <p className="text-sm">Agrega precios detal para ver márgenes</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={datosMargenes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis type="number" stroke="#a0a0b0" fontSize={12} />
                <YAxis dataKey="nombre" type="category" stroke="#a0a0b0" fontSize={11} width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#12121a', 
                    border: '1px solid #1e1e2e',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => `${value.toFixed(1)}%`}
                />
                <Bar dataKey="margen" fill="#00d4ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-voltech-purple" />
              <h3 className="text-lg font-semibold text-white">Inversión por Categoría</h3>
            </div>
          </div>
          {datosCategorias.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-voltech-muted">
              <p className="text-sm">Agrega productos para ver distribución</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={datosCategorias}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {datosCategorias.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#12121a', 
                    border: '1px solid #1e1e2e',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => `$${value.toFixed(2)}`}
                />
              </RePieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-voltech-border">
          <h3 className="text-lg font-semibold text-white">Detalle de Márgenes por Producto</h3>
          <p className="text-xs text-voltech-muted mt-1">Comparación entre precio mayor (costo) y detal (venta)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-voltech-dark border-b border-voltech-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Producto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Precio Mayor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Precio Detal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Ganancia/Unid</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Margen %</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Ganancia Total</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-voltech-muted">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay productos registrados</p>
                  </td>
                </tr>
              ) : (
                productos.map((producto) => {
                  const precioDetal = producto.precioDetal || producto.precioMayor;
                  const gananciaUnid = precioDetal - producto.precioMayor;
                  const margen = producto.precioMayor > 0 ? (gananciaUnid / producto.precioMayor * 100) : 0;
                  const gananciaTotal = gananciaUnid * producto.cantidad;

                  return (
                    <tr key={producto.id} className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white">{producto.plataforma || producto.producto}</p>
                        <p className="text-xs text-voltech-muted">{producto.marca}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${
                          producto.cantidad === 0 ? 'text-voltech-error' :
                          producto.cantidad <= 2 ? 'text-voltech-warning' : 'text-voltech-success'
                        }`}>
                          {producto.cantidad}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-voltech-muted">${producto.precioMayor.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-white">${precioDetal.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${gananciaUnid >= 0 ? 'text-voltech-success' : 'text-voltech-error'}`}>
                          ${gananciaUnid.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${
                          margen > 50 ? 'text-voltech-success' :
                          margen > 20 ? 'text-voltech-cyan' :
                          margen > 0 ? 'text-voltech-warning' : 'text-voltech-error'
                        }`}>
                          {margen.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${gananciaTotal >= 0 ? 'text-voltech-success' : 'text-voltech-error'}`}>
                          ${gananciaTotal.toFixed(2)}
                        </span>
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
  );
}