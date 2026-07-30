'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/app/context/PermissionsContext';
import { 
  BarChart, TrendingUp, ShoppingCart, DollarSign,
  Calendar, Users, Package, ArrowUpRight, Trophy, 
  Medal, Award, Target, Percent, ShoppingBag,
  TrendingDown, Activity, CheckCircle, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardVentasPage() {
  const { usuarioActual, esAdmin, esSocio } = usePermissions();
  
  const [stats, setStats] = useState({
    ventasHoy: 0,
    ventasSemana: 0,
    ventasMes: 0,
    ingresosHoy: 0,
    ingresosSemana: 0,
    ingresosMes: 0,
    totalClientes: 0,
    productosVendidos: 0,
    comisionesPagadas: 0,
    comisionesPendientes: 0,
    metaVentas: 100,
    metaMonto: 5000,
    porcentajeMeta: 0
  });

  const [ventasRecientes, setVentasRecientes] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [equipo, setEquipo] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      let ventas = [], clientes = [], usuarios = [], comisiones = [], metas = [];

      try {
        if (supabase) {
          const [{ data: vData }, { data: cData }, { data: uData }, { data: comData }, { data: mData }] = await Promise.all([
            supabase.from('ventas').select('*').order('fechaRegistro', { ascending: false }).limit(50),
            supabase.from('clientes').select('*'),
            supabase.from('usuarios').select('*'),
            supabase.from('comisiones_pendientes').select('*'),
            supabase.from('metas_ventas').select('*').eq('mes', new Date().toISOString().slice(0, 7))
          ]);
          
          if (vData) ventas = vData;
          if (cData) clientes = cData;
          if (uData) usuarios = uData;
          if (comData) comisiones = comData;
          if (mData) metas = mData;
        } else {
          // Fallback a localStorage
          ventas = JSON.parse(localStorage.getItem('voltech_ventas') || '[]');
          clientes = JSON.parse(localStorage.getItem('voltech_clientes') || '[]');
          usuarios = JSON.parse(localStorage.getItem('voltech_equipo') || '[]');
          comisiones = JSON.parse(localStorage.getItem('voltech_comisiones_pendientes') || '[]');
          metas = JSON.parse(localStorage.getItem('voltech_metas_ventas') || '[]');
        }

        // Fechas para filtros
        const hoy = new Date().toISOString().split('T')[0];
        const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const mesActual = new Date().toISOString().slice(0, 7);

        // Filtrar ventas por período
        const ventasHoy = ventas.filter(v => {
          const fechaVenta = v.fecha || (v.fechaRegistro ? v.fechaRegistro.split('T')[0] : '');
          return fechaVenta === hoy;
        });

        const ventasSemana = ventas.filter(v => {
          const fechaVenta = v.fecha || (v.fechaRegistro ? v.fechaRegistro.split('T')[0] : '');
          return fechaVenta >= hace7Dias;
        });

        const ventasMes = ventas.filter(v => {
          const fechaRegistro = v.fechaRegistro || (v.fecha ? `${v.fecha}T00:00:00` : '');
          return fechaRegistro.startsWith(mesActual);
        });

        // Calcular totales
        const totalIngresosHoy = ventasHoy.reduce((sum, v) => sum + Number(v.total || 0), 0);
        const totalIngresosSemana = ventasSemana.reduce((sum, v) => sum + Number(v.total || 0), 0);
        const totalIngresosMes = ventasMes.reduce((sum, v) => sum + Number(v.total || 0), 0);

        // Calcular comisiones
        const comPagadas = comisiones.filter(c => c.estado === 'pagada').reduce((sum, c) => sum + Number(c.monto_comision || 0), 0);
        const comPendientes = comisiones.filter(c => c.estado === 'pendiente').reduce((sum, c) => sum + Number(c.monto_comision || 0), 0);

        // Calcular meta
        const metaGlobal = metas.find(m => m.vendedor_nombre === 'GLOBAL') || { meta_ventas: 100, meta_monto: 5000 };
        const porcentajeMeta = metaGlobal.meta_monto > 0 ? (totalIngresosMes / metaGlobal.meta_monto) * 100 : 0;

        // Calcular productos vendidos
        const totalProductosVendidos = ventas.reduce((sum, v) => {
          if (v.productos && Array.isArray(v.productos)) {
            return sum + v.productos.reduce((pSum, p) => pSum + (Number(p.cantidad) || 1), 0);
          }
          return sum + 1;
        }, 0);

        setStats({
          ventasHoy: ventasHoy.length,
          ventasSemana: ventasSemana.length,
          ventasMes: ventasMes.length,
          ingresosHoy: totalIngresosHoy,
          ingresosSemana: totalIngresosSemana,
          ingresosMes: totalIngresosMes,
          totalClientes: clientes.length,
          productosVendidos: totalProductosVendidos,
          comisionesPagadas: comPagadas,
          comisionesPendientes: comPendientes,
          metaVentas: metaGlobal.meta_ventas || 100,
          metaMonto: metaGlobal.meta_monto || 5000,
          porcentajeMeta
        });

        setVentasRecientes(ventas.slice(0, 10));
        setEquipo(usuarios);

        // ✅ CALCULAR RANKING DE VENDEDORES
        const rankingCalculado = usuarios.map(member => {
          const memberSales = ventas.filter(v => 
            v.vendedor?.toLowerCase() === member.nombre.toLowerCase() || 
            v.vendedorId === member.id
          );
          
          const totalVentas = memberSales.length;
          const montoTotal = memberSales.reduce((sum, v) => sum + Number(v.total || 0), 0);
          
          // Calcular comisión acumulada
          const memberCommissions = comisiones.filter(c => 
            c.miembroId === member.id && c.estado === 'pendiente'
          );
          const comisionAcumulada = memberCommissions.reduce((sum, c) => sum + Number(c.monto_comision || 0), 0);

          return { 
            ...member, 
            totalVentas, 
            montoTotal, 
            comisionAcumulada 
          };
        }).sort((a, b) => b.totalVentas - a.totalVentas);

        setRanking(rankingCalculado);
      } catch (error) {
        console.error('Error cargando dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-orange-400" />;
    return <span className="text-sm font-bold text-voltech-muted w-6 text-center">{index + 1}</span>;
  };

  const maxVentas = ranking.length > 0 && ranking[0].totalVentas > 0 ? ranking[0].totalVentas : 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-voltech-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-voltech-muted">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Ventas</h1>
        <p className="text-sm text-voltech-muted mt-1">Análisis de rendimiento y ranking de vendedores</p>
      </div>

      {/* TARJETAS DE MÉTRICAS PRINCIPALES - 2 FILAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fila 1 */}
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-voltech-muted">Ventas Hoy</p>
              <p className="text-xl font-bold text-white">{stats.ventasHoy}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-cyan/20">
              <ShoppingCart className="w-5 h-5 text-voltech-cyan" />
            </div>
          </div>
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-voltech-muted">Ingresos Hoy</p>
              <p className="text-xl font-bold text-voltech-success">${stats.ingresosHoy.toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-success/20">
              <DollarSign className="w-5 h-5 text-voltech-success" />
            </div>
          </div>
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-voltech-muted">Ventas Mes</p>
              <p className="text-xl font-bold text-white">{stats.ventasMes}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-purple/20">
              <BarChart className="w-5 h-5 text-voltech-purple" />
            </div>
          </div>
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-voltech-muted">Ingresos Mes</p>
              <p className="text-xl font-bold text-voltech-success">${stats.ingresosMes.toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-success/20">
              <DollarSign className="w-5 h-5 text-voltech-success" />
            </div>
          </div>
        </div>

        {/* Fila 2 */}
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-voltech-muted">Comis. Pagadas</p>
              <p className="text-xl font-bold text-voltech-purple">${stats.comisionesPagadas.toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-purple/20">
              <Percent className="w-5 h-5 text-voltech-purple" />
            </div>
          </div>
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-voltech-muted">Comis. Pendientes</p>
              <p className="text-xl font-bold text-voltech-warning">${stats.comisionesPendientes.toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-warning/20">
              <Clock className="w-5 h-5 text-voltech-warning" />
            </div>
          </div>
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-voltech-muted">Total Clientes</p>
              <p className="text-xl font-bold text-white">{stats.totalClientes}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-cyan/20">
              <Users className="w-5 h-5 text-voltech-cyan" />
            </div>
          </div>
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-voltech-muted">Productos Vendidos</p>
              <p className="text-xl font-bold text-white">{stats.productosVendidos}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-success/20">
              <Package className="w-5 h-5 text-voltech-success" />
            </div>
          </div>
        </div>
      </div>

      {/*  SECCIÓN: RANKING DE VENDEDORES */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-bold text-white">Ranking de Vendedores</h3>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-voltech-muted bg-voltech-dark px-3 py-1 rounded-full">
              {ranking.length} miembros activos
            </span>
            <div className="text-xs text-voltech-muted">
              Total acumulado: <span className="text-voltech-success font-bold">${stats.ingresosMes.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {ranking.length === 0 ? (
          <div className="text-center py-12 text-voltech-muted">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aún no hay ventas registradas para mostrar el ranking.</p>
            <p className="text-xs mt-2">Agrega miembros al equipo y registra ventas para ver el ranking.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ranking.map((member, index) => {
              const porcentajeProgreso = maxVentas > 0 ? (member.totalVentas / maxVentas) * 100 : 0;
              const esTop3 = index < 3;
              
              return (
                <motion.div 
                  key={member.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border transition-all ${
                    esTop3 
                      ? 'bg-gradient-to-r from-voltech-dark to-voltech-surface border-voltech-cyan/30' 
                      : 'bg-voltech-dark/50 border-voltech-border hover:border-voltech-cyan/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Icono de Ranking */}
                    <div className="flex-shrink-0 w-10">
                      {getRankIcon(index)}
                    </div>

                    {/* Info del Vendedor */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-voltech-cyan to-voltech-purple flex items-center justify-center text-white font-bold text-sm">
                            {member.nombre?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white truncate">
                              {member.nombre}
                              {esTop3 && <span className="ml-2 text-xs text-yellow-400">⭐ TOP</span>}
                            </p>
                            <p className="text-xs text-voltech-muted capitalize">{member.rol || 'Vendedor'}</p>
                          </div>
                        </div>
                        
                        {/* Métricas principales */}
                        <div className="text-right hidden sm:block">
                          <p className="text-lg font-bold text-voltech-cyan">{member.totalVentas}</p>
                          <p className="text-[10px] text-voltech-muted uppercase tracking-wider">Ventas</p>
                        </div>
                      </div>

                      {/* Barra de Progreso */}
                      <div className="w-full bg-voltech-border/50 rounded-full h-2 mb-3">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                            index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                            index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                            'bg-voltech-cyan'
                          }`}
                          style={{ width: `${porcentajeProgreso}%` }}
                        ></div>
                      </div>

                      {/* Detalles en fila inferior */}
                      <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                        <span className="text-voltech-muted">
                          Monto: <span className="text-voltech-success font-semibold">${member.montoTotal.toFixed(2)}</span>
                        </span>
                        <span className="text-voltech-muted">
                          Comisión Acum: <span className="text-voltech-purple font-semibold">${member.comisionAcumulada.toFixed(2)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ÚLTIMAS VENTAS Y RESUMEN SEMANAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Últimas Ventas */}
        <div className="lg:col-span-2 bg-voltech-surface border border-voltech-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-voltech-cyan" /> Últimas Ventas
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {ventasRecientes.length === 0 ? (
              <div className="text-center py-12 text-voltech-muted">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay ventas registradas aún.</p>
              </div>
            ) : (
              ventasRecientes.map((venta, idx) => (
                <motion.div 
                  key={venta.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-3 bg-voltech-dark/50 rounded-lg border border-voltech-border hover:border-voltech-cyan/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      venta.tipo === 'streaming' 
                        ? 'bg-voltech-purple/20 text-voltech-purple' 
                        : 'bg-voltech-success/20 text-voltech-success'
                    }`}>
                      {venta.tipo === 'streaming' ? <TrendingUp className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{venta.cliente || 'Cliente General'}</p>
                      <p className="text-xs text-voltech-muted">
                        {venta.fecha || (venta.fechaRegistro ? venta.fechaRegistro.split('T')[0] : 'Reciente')} 
                        {venta.vendedor && <span className="ml-2 text-voltech-cyan">• {venta.vendedor}</span>}
                      </p>
                      {venta.productos && Array.isArray(venta.productos) && (
                        <p className="text-xs text-voltech-muted mt-1">
                          {venta.productos.map(p => p.nombre || p.producto).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-voltech-success">${Number(venta.total || 0).toFixed(2)}</p>
                    <p className="text-xs text-voltech-muted">
                      {venta.productos?.length || 1} prod.
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Resumen Semanal */}
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-voltech-purple" /> Resumen Semanal
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-voltech-dark/50 rounded-lg">
              <div className="flex items-center gap-3">
                <BarChart className="w-5 h-5 text-voltech-cyan" />
                <span className="text-sm text-voltech-muted">Ventas esta semana</span>
              </div>
              <span className="text-sm font-bold text-white">{stats.ventasSemana}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-voltech-dark/50 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-voltech-success" />
                <span className="text-sm text-voltech-muted">Ingresos semana</span>
              </div>
              <span className="text-sm font-bold text-voltech-success">${stats.ingresosSemana.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-voltech-dark/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-voltech-purple" />
                <span className="text-sm text-voltech-muted">Productos vendidos</span>
              </div>
              <span className="text-sm font-bold text-white">{stats.productosVendidos}</span>
            </div>

            <div className="border-t border-voltech-border pt-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-voltech-muted">Meta del mes:</span>
                <span className="text-sm font-bold text-white">${stats.metaMonto.toFixed(2)}</span>
              </div>
              <div className="w-full bg-voltech-border/50 rounded-full h-3 mb-2">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ${
                    stats.porcentajeMeta >= 100 
                      ? 'bg-gradient-to-r from-voltech-success to-green-400' 
                      : stats.porcentajeMeta >= 50
                      ? 'bg-gradient-to-r from-voltech-cyan to-blue-500'
                      : 'bg-gradient-to-r from-voltech-warning to-orange-500'
                  }`}
                  style={{ width: `${Math.min(stats.porcentajeMeta, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-voltech-muted text-center">
                {stats.porcentajeMeta.toFixed(1)}% completado
              </p>
            </div>

            {ranking.length > 0 && ranking[0].totalVentas > 0 && (
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-bold text-yellow-400">Líder del mes</span>
                </div>
                <p className="text-sm text-white font-bold">{ranking[0].nombre}</p>
                <p className="text-xs text-voltech-muted">
                  {ranking[0].totalVentas} ventas • ${ranking[0].montoTotal.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}