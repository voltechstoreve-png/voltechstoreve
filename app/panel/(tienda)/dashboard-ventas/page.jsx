'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/app/context/PermissionsContext';
import { 
  BarChart, TrendingUp, ShoppingCart, DollarSign,
  Calendar, Users, Package, ArrowUpRight, Trophy, 
  Medal, Award, Target, Percent, ShoppingBag,
  TrendingDown, Activity, CheckCircle, Clock, MonitorPlay
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
  const [comisiones, setComisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referidosResumen, setReferidosResumen] = useState({ total: 0, top: null });  

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      let ventas = [], ventasStreaming = [], clientes = [], usuarios = [], coms = [];

      try {
        if (supabase) {
          console.log('🔄 Cargando desde Supabase...');
          const [{ data: vData, error: vError }, { data: vsData, error: vsError }, { data: cData }, { data: uData }, { data: comData }] = await Promise.all([
            supabase.from('ventas').select('*').order('fecharegistro', { ascending: false }),
            supabase.from('ventas_streaming').select('*').order('fecharegistro', { ascending: false }),
            supabase.from('clientes').select('*'),
            supabase.from('usuarios').select('*'),
            supabase.from('comisiones_pendientes').select('*')
          ]);
          
          if (vError) console.warn('⚠️ Error Supabase ventas:', vError.message);
          if (vsError) console.warn('⚠️ Error Supabase ventas_streaming:', vsError.message);

          ventas = vData || [];
          ventasStreaming = vsData || [];
          clientes = cData || [];
          usuarios = uData || [];
          coms = comData || [];
          console.log('✅ Datos cargados:', ventas.length, 'productos,', ventasStreaming.length, 'streaming');
        } else {
          ventas = JSON.parse(localStorage.getItem('voltech_ventas') || '[]');
          ventasStreaming = JSON.parse(localStorage.getItem('voltech_ventas_streaming') || '[]');
          clientes = JSON.parse(localStorage.getItem('voltech_clientes') || '[]');
          usuarios = JSON.parse(localStorage.getItem('voltech_equipo') || '[]');
          coms = JSON.parse(localStorage.getItem('voltech_comisiones_pendientes') || '[]');
        }

        // ✅ COMBINAR ventas de productos y streaming
        const todasLasVentas = [
          ...ventas.map(v => ({ ...v, tipo: 'producto' })),
          ...ventasStreaming.map(v => ({ ...v, tipo: 'streaming' }))
        ].sort((a, b) => new Date(b.fechaRegistro || b.fecha) - new Date(a.fechaRegistro || a.fecha));

        setComisiones(coms);
        setEquipo(usuarios);

        const hoy = new Date();
        const mesActual = hoy.getMonth();
        const anioActual = hoy.getFullYear();
        const hoyStr = hoy.toISOString().split('T')[0];
        const hace7DiasStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const ventasHoy = todasLasVentas.filter(v => {
          const fechaStr = (v.fechaRegistro || v.fecha || '').split('T')[0];
          return fechaStr === hoyStr;
        });

        const ventasSemana = todasLasVentas.filter(v => {
          const fechaStr = (v.fechaRegistro || v.fecha || '').split('T')[0];
          return fechaStr >= hace7DiasStr && fechaStr <= hoyStr;
        });

        const ventasMes = todasLasVentas.filter(v => {
          const fecha = new Date(v.fechaRegistro || v.fecha);
          return !isNaN(fecha.getTime()) && fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
        });

        const totalIngresosHoy = ventasHoy.reduce((sum, v) => sum + Number(v.total || 0), 0);
        const totalIngresosSemana = ventasSemana.reduce((sum, v) => sum + Number(v.total || 0), 0);
        const totalIngresosMes = ventasMes.reduce((sum, v) => sum + Number(v.total || 0), 0);

        const comPagadas = coms.filter(c => c.estado === 'pagada').reduce((sum, c) => sum + Number(c.monto_comision || 0), 0);
        const comPendientes = coms.filter(c => c.estado === 'pendiente').reduce((sum, c) => sum + Number(c.monto_comision || 0), 0);

        // Calcular productos vendidos (solo de ventas de productos físicos)
        const totalProductosVendidos = ventas.reduce((sum, v) => {
          if (v.productos && Array.isArray(v.productos)) {
            return sum + v.productos.reduce((pSum, p) => pSum + (Number(p.cantidad) || 1), 0);
          }
          return sum + 1;
        }, 0);

        const metaMonto = 5000;
        const porcentajeMeta = metaMonto > 0 ? (totalIngresosMes / metaMonto) * 100 : 0;

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
          metaVentas: 100,
          metaMonto: metaMonto,
          porcentajeMeta
        });

        // ✅ Mostrar últimas 10 ventas (combinadas)
        setVentasRecientes(todasLasVentas.slice(0, 10));

        // ✅ Calcular ranking incluyendo ventas de streaming
        const rankingCalculado = usuarios.map(member => {
          // Ventas de productos
          const memberSalesProductos = ventas.filter(v => 
            v.vendedor?.toLowerCase() === member.nombre.toLowerCase() || 
            v.vendedorId === member.id
          );
          
          // Ventas de streaming
          const memberSalesStreaming = ventasStreaming.filter(v => 
            v.vendedor?.toLowerCase() === member.nombre.toLowerCase()
          );
          
          // Combinar ambas
          const todasMemberSales = [...memberSalesProductos, ...memberSalesStreaming];
          
          const totalVentas = todasMemberSales.length;
          const montoTotal = todasMemberSales.reduce((sum, v) => sum + Number(v.total || 0), 0);
          
          const memberCommissions = coms.filter(c => 
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

    const handleActualizacion = () => cargarDatos();
    window.addEventListener('voltech-data-updated', handleActualizacion);

    return () => {
      window.removeEventListener('voltech-data-updated', handleActualizacion);
    };
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-voltech-muted">Referidos Equipo</p>
              <p className="text-xl font-bold text-white">{referidosResumen.total}</p>
              {referidosResumen.top && <p className="text-[10px] text-voltech-cyan mt-0.5">🏆 {referidosResumen.top.nombre} ({referidosResumen.top.cantidad})</p>}
            </div>
            <div className="p-2 rounded-lg bg-voltech-purple/20">
              <Users className="w-5 h-5 text-voltech-purple" />
            </div>
          </div>
        </div>
      </div>

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
                    <div className="flex-shrink-0 w-10">
                      {getRankIcon(index)}
                    </div>

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
                        
                        <div className="text-right hidden sm:block">
                          <p className="text-lg font-bold text-voltech-cyan">{member.totalVentas}</p>
                          <p className="text-[10px] text-voltech-muted uppercase tracking-wider">Ventas</p>
                        </div>
                      </div>

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

      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
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
                    {venta.tipo === 'streaming' ? <MonitorPlay className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
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
                    {venta.tipo === 'streaming' && venta.plataformas && (
                      <p className="text-xs text-voltech-muted mt-1">
                        {venta.plataformas.map(p => p.plataforma).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-voltech-success">${Number(venta.total || 0).toFixed(2)}</p>
                  <p className="text-xs text-voltech-muted">
                    {venta.tipo === 'streaming' ? 'Streaming' : (venta.productos?.length || 1) + ' prod.'}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}