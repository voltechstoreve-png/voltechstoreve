'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Package,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  Percent,
  Clock
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
    ingresosHoy: 0,
    ingresosMes: 0,
    comisionesPagadas: 0,
    comisionesPendientes: 0,
    valorInventario: 0,
  });

  // ✅ NUEVO: Detectar móvil para ajustar gráficos
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const cargarDatos = async () => {
      let productosData = [];
      let ventasData = [];
      let comisionesData = [];

      if (supabase) {
        const { data: prodsData } = await supabase.from('productos').select('*').eq('publicado', true);
        if (prodsData) productosData = prodsData;

        const { data: vtsData } = await supabase.from('ventas').select('*');
        if (vtsData) ventasData = vtsData;

        const { data: comData } = await supabase.from('comisiones_pendientes').select('*');
        if (comData) comisionesData = comData;
      }

      if (productosData.length === 0) {
        const productosGuardados = localStorage.getItem('voltech_productos');
        if (productosGuardados) productosData = JSON.parse(productosGuardados);
      }

      if (ventasData.length === 0) {
        const ventasGuardadas = localStorage.getItem('voltech_ventas');
        if (ventasGuardadas) ventasData = JSON.parse(ventasGuardadas);
      }

      if (comisionesData.length === 0) {
        const comGuardadas = localStorage.getItem('voltech_comisiones_pendientes');
        if (comGuardadas) comisionesData = JSON.parse(comGuardadas);
      }

      setProductos(productosData);
      setVentas(ventasData);

      const inversion = productosData.reduce((acc, p) => acc + (Number(p.precioMayor || 0) * Number(p.cantidad || 0)), 0);
      const valorVenta = productosData.reduce((acc, p) => acc + (Number(p.precioDetal || p.precioMayor || 0) * Number(p.cantidad || 0)), 0);
      const ganancia = valorVenta - inversion;
      const margen = inversion > 0 ? (ganancia / inversion) * 100 : 0;
      const conMargen = productosData.filter(p => Number(p.precioDetal || 0) > Number(p.precioMayor || 0)).length;

      const ingresosTotales = ventasData.reduce((acc, v) => acc + Number(v.montoAbonado || v.total || 0), 0);

      // ✅ Métricas financieras trasladadas desde Dashboard Ventas
      const hoyStr = new Date().toISOString().split('T')[0];
      const mesAct = new Date().getMonth();
      const anioAct = new Date().getFullYear();
      const ventasHoyArr = ventasData.filter(v => (v.fechaRegistro || v.fecha || '').split('T')[0] === hoyStr);
      const ventasMesArr = ventasData.filter(v => { const f = new Date(v.fechaRegistro || v.fecha); return !isNaN(f.getTime()) && f.getMonth() === mesAct && f.getFullYear() === anioAct; });
      const ingresosHoy = ventasHoyArr.reduce((s, v) => s + Number(v.total || 0), 0);
      const ingresosMes = ventasMesArr.reduce((s, v) => s + Number(v.total || 0), 0);
      const comisionesPagadas = comisionesData.filter(c => c.estado === 'pagada').reduce((s, c) => s + Number(c.monto_comision || 0), 0);
      const comisionesPendientes = comisionesData.filter(c => c.estado === 'pendiente').reduce((s, c) => s + Number(c.monto_comision || 0), 0);

      // ✅ Valor Inventario (trasladado desde Dashboard general)
      const valorInventario = productosData.reduce((acc, p) => acc + ((Number(p.precioMayor || 0)) * (Number(p.cantidad || 0))), 0);

      setStats({
        inversionTotal: inversion,
        valorVentaTotal: valorVenta,
        gananciaPotencial: ganancia,
        margenPromedio: margen,
        productosConMargen: conMargen,
        ingresosTotales: ingresosTotales,
        ventasTotales: ventasData.length,
        ingresosHoy,
        ingresosMes,
        comisionesPagadas,
        comisionesPendientes,
        valorInventario,
      });
    };

    cargarDatos();
  }, []);

  const datosMargenes = productos
    .filter(p => Number(p.precioDetal || 0) > 0)
    .map(p => {
      const pDetal = Number(p.precioDetal || 0);
      const pMayor = Number(p.precioMayor || 0);
      const cant = Number(p.cantidad || 0);
      return {
        nombre: (p.plataforma || p.producto || 'Sin nombre').length > 15 
          ? (p.plataforma || p.producto || 'Sin nombre').substring(0, 15) + '...' 
          : (p.plataforma || p.producto || 'Sin nombre'),
        margen: pMayor > 0 ? ((pDetal - pMayor) / pMayor * 100) : 0,
        ganancia: (pDetal - pMayor) * cant,
      };
    })
    .sort((a, b) => b.margen - a.margen)
    .slice(0, 6);

  const categoriasData = {};
  productos.forEach(p => {
    const cat = p.categoria || 'Sin categoría';
    if (!categoriasData[cat]) {
      categoriasData[cat] = 0;
    }
    categoriasData[cat] += Number(p.precioMayor || 0) * Number(p.cantidad || 0);
  });

  const datosCategorias = Object.entries(categoriasData).map(([name, value]) => ({ name, value }));
  const COLORS = ['#00d4ff', '#bf00ff', '#00ff88', '#ff9500', '#ff3366', '#9500ff'];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard Finanzas</h1>
          <p className="text-xs sm:text-sm text-voltech-muted mt-1">Análisis de inversión, márgenes y ganancias</p>
        </div>
      </div>

      {/* ✅ TARJETA DESTACADA: Valor Inventario (trasladada desde Dashboard general) */}
      <div className="bg-gradient-to-r from-voltech-cyan/10 via-voltech-surface to-voltech-purple/10 border border-voltech-cyan/30 rounded-2xl p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs md:text-sm font-medium text-voltech-muted leading-tight">💰 Valor Total del Inventario</p>
            <p className="text-2xl md:text-3xl font-bold text-white mt-1 truncate">${Number(stats.valorInventario).toFixed(2)}</p>
            <p className="text-[10px] md:text-xs text-voltech-muted mt-1">Suma de (precio mayor × stock) de todos los productos</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-voltech-cyan to-blue-500 shrink-0 flex items-center justify-center shadow-lg shadow-voltech-cyan/20">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Inversión Total</p>
              <p className="text-base md:text-xl font-bold text-white mt-0.5 truncate">${Number(stats.inversionTotal).toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-cyan/10 md:bg-voltech-cyan/20 text-voltech-cyan shrink-0 flex items-center justify-center"><DollarSign className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Valor de Venta</p>
              <p className="text-base md:text-xl font-bold text-white mt-0.5 truncate">${Number(stats.valorVentaTotal).toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-purple/10 md:bg-voltech-purple/20 text-voltech-purple shrink-0 flex items-center justify-center"><Package className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Ganancia Potencial</p>
              <p className="text-base md:text-xl font-bold text-voltech-success mt-0.5 truncate">${Number(stats.gananciaPotencial).toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-success/10 md:bg-voltech-success/20 text-voltech-success shrink-0 flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Margen Promedio</p>
              <p className="text-base md:text-xl font-bold text-white mt-0.5 truncate">{Number(stats.margenPromedio).toFixed(1)}%</p>
            </div>
            <div className="p-2 rounded-lg bg-orange-500/10 md:bg-orange-500/20 text-orange-400 shrink-0 flex items-center justify-center"><Calculator className="w-5 h-5" /></div>
          </div>
        </div>
      </div>

      {/* ✅ Métricas financieras (solo admin/socio) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Ingresos Hoy</p>
              <p className="text-base md:text-xl font-bold text-voltech-success mt-0.5 truncate">${Number(stats.ingresosHoy).toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-success/10 md:bg-voltech-success/20 text-voltech-success shrink-0 flex items-center justify-center"><DollarSign className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Ingresos Mes</p>
              <p className="text-base md:text-xl font-bold text-voltech-success mt-0.5 truncate">${Number(stats.ingresosMes).toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-success/10 md:bg-voltech-success/20 text-voltech-success shrink-0 flex items-center justify-center"><DollarSign className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Comis. Pagadas</p>
              <p className="text-base md:text-xl font-bold text-voltech-purple mt-0.5 truncate">${Number(stats.comisionesPagadas).toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-purple/10 md:bg-voltech-purple/20 text-voltech-purple shrink-0 flex items-center justify-center"><Percent className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Comis. Pendientes</p>
              <p className="text-base md:text-xl font-bold text-voltech-warning mt-0.5 truncate">${Number(stats.comisionesPendientes).toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-warning/10 md:bg-voltech-warning/20 text-voltech-warning shrink-0 flex items-center justify-center"><Clock className="w-5 h-5" /></div>
          </div>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <BarChart3 className="w-5 h-5 text-voltech-cyan shrink-0" />
              <h3 className="text-base sm:text-lg font-semibold text-white truncate">Márgenes por Producto</h3>
            </div>
            <span className="text-xs bg-voltech-cyan/20 text-voltech-cyan px-2 py-1 rounded shrink-0">
              % Ganancia
            </span>
          </div>
          {datosMargenes.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-voltech-muted">
              <p className="text-sm">Agrega precios detal para ver márgenes</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 220 : 250}>
              <BarChart data={datosMargenes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis type="number" stroke="#a0a0b0" fontSize={12} />
                <YAxis dataKey="nombre" type="category" stroke="#a0a0b0" fontSize={isMobile ? 9 : 11} width={isMobile ? 70 : 100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#12121a', 
                    border: '1px solid #1e1e2e',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => `${Number(value).toFixed(1)}%`}
                />
                <Bar dataKey="margen" fill="#00d4ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <PieChart className="w-5 h-5 text-voltech-purple shrink-0" />
              <h3 className="text-base sm:text-lg font-semibold text-white truncate">Inversión por Categoría</h3>
            </div>
          </div>
          {datosCategorias.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-voltech-muted">
              <p className="text-sm">Agrega productos para ver distribución</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
                <RePieChart>
                  <Pie
                    data={datosCategorias}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 40 : 60}
                    outerRadius={isMobile ? 65 : 90}
                    paddingAngle={5}
                    dataKey="value"
                    label={isMobile ? false : ({ name, percent }) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
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
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                  />
                </RePieChart>
              </ResponsiveContainer>
              {isMobile && (
                <div className="mt-3 space-y-1.5">
                  {datosCategorias.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="flex items-center gap-1.5 text-slate-300 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate">{entry.name}</span>
                      </span>
                      <span className="text-slate-200 font-bold shrink-0">${Number(entry.value).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* TABLA DE MÁRGENES */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-voltech-border">
          <h3 className="text-lg font-semibold text-white">Detalle de Márgenes por Producto</h3>
          <p className="text-xs text-voltech-muted mt-1">Comparación entre precio mayor (costo) y detal (venta)</p>
        </div>

        {/* ✅ Vista Card Móvil (< md) */}
        <div className="block md:hidden space-y-3 p-3">
          {productos.length === 0 ? (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-center">
              <Package className="w-8 h-8 mx-auto mb-2 text-slate-500" />
              <p className="text-xs text-slate-400">No hay productos registrados</p>
            </div>
          ) : (
            productos.map((producto) => {
              const precioDetal = Number(producto.precioDetal || producto.precioMayor || 0);
              const precioMayor = Number(producto.precioMayor || 0);
              const cantidad = Number(producto.cantidad || 0);
              const gananciaUnid = precioDetal - precioMayor;
              const margen = precioMayor > 0 ? (gananciaUnid / precioMayor * 100) : 0;
              const gananciaTotal = gananciaUnid * cantidad;
              return (
                <div key={producto.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-100 truncate">{producto.plataforma || producto.producto || 'Sin nombre'}</h4>
                      <p className="text-[10px] text-slate-400 truncate">{producto.marca || 'N/A'}</p>
                    </div>
                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold ${cantidad === 0 ? 'bg-rose-500/20 text-rose-300' : cantidad <= 2 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>Stock: {cantidad}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-700/40 grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-slate-400 block">Precio Mayor:</span><span className="text-slate-200">${precioMayor.toFixed(2)}</span></div>
                    <div><span className="text-slate-400 block">Precio Detal:</span><span className="text-slate-200">${precioDetal.toFixed(2)}</span></div>
                    <div><span className="text-slate-400 block">Ganancia/Unid:</span><span className={`font-bold ${gananciaUnid >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>${gananciaUnid.toFixed(2)}</span></div>
                    <div><span className="text-slate-400 block">Margen:</span><span className={`font-bold ${margen > 50 ? 'text-emerald-300' : margen > 20 ? 'text-cyan-300' : margen > 0 ? 'text-amber-300' : 'text-rose-300'}`}>{margen.toFixed(1)}%</span></div>
                  </div>
                  <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Ganancia Total:</span>
                    <span className={`font-bold ${gananciaTotal >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>${gananciaTotal.toFixed(2)}</span>
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
                  const precioDetal = Number(producto.precioDetal || producto.precioMayor || 0);
                  const precioMayor = Number(producto.precioMayor || 0);
                  const cantidad = Number(producto.cantidad || 0);
                  const gananciaUnid = precioDetal - precioMayor;
                  const margen = precioMayor > 0 ? (gananciaUnid / precioMayor * 100) : 0;
                  const gananciaTotal = gananciaUnid * cantidad;

                  return (
                    <tr key={producto.id} className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white">{producto.plataforma || producto.producto || 'Sin nombre'}</p>
                        <p className="text-xs text-voltech-muted">{producto.marca || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${
                          cantidad === 0 ? 'text-voltech-error' :
                          cantidad <= 2 ? 'text-voltech-warning' : 'text-voltech-success'
                        }`}>
                          {cantidad}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-voltech-muted">${precioMayor.toFixed(2)}</td>
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