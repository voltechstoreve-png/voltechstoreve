'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, TrendingUp, ShoppingCart, DollarSign,
  Calendar, Users, Package, ArrowUpRight
} from 'lucide-react';

export default function DashboardVentasPage() {
  const [stats, setStats] = useState({
    ventasHoy: 0,
    ventasSemana: 0,
    ventasMes: 0,
    ingresosHoy: 0,
    ingresosSemana: 0,
    ingresosMes: 0,
    totalClientes: 0,
    productosVendidos: 0
  });

  const [ventasRecientes, setVentasRecientes] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      let ventas = [], clientes = [];

      if (supabase) {
        const [{ data: vData }, { data: cData }] = await Promise.all([
          supabase.from('ventas').select('*').order('fechaRegistro', { ascending: false }).limit(10),
          supabase.from('clientes').select('*')
        ]);
        if (vData) ventas = vData;
        if (cData) clientes = cData;
      } else {
        ventas = JSON.parse(localStorage.getItem('voltech_ventas') || '[]');
        clientes = JSON.parse(localStorage.getItem('voltech_clientes') || '[]');
      }

      const hoy = new Date().toISOString().split('T')[0];
      const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const ventasHoy = ventas.filter(v => v.fecha === hoy);
      const ventasSemana = ventas.filter(v => v.fecha >= hace7Dias);
      const ventasMes = ventas.filter(v => v.fecha >= hace30Dias);

      setStats({
        ventasHoy: ventasHoy.length,
        ventasSemana: ventasSemana.length,
        ventasMes: ventasMes.length,
        ingresosHoy: ventasHoy.reduce((sum, v) => sum + (v.total || 0), 0),
        ingresosSemana: ventasSemana.reduce((sum, v) => sum + (v.total || 0), 0),
        ingresosMes: ventasMes.reduce((sum, v) => sum + (v.total || 0), 0),
        totalClientes: clientes.length,
        productosVendidos: ventas.reduce((sum, v) => sum + (v.productos?.length || 0), 0)
      });

      setVentasRecientes(ventas.slice(0, 5));
    };

    cargarDatos();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Ventas</h1>
        <p className="text-sm text-voltech-muted mt-1">Análisis de ventas y rendimiento</p>
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
              <p className="text-xs text-voltech-muted">Ventas este Mes</p>
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
              <p className="text-xs text-voltech-muted">Total Clientes</p>
              <p className="text-xl font-bold text-white">{stats.totalClientes}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-warning/20">
              <Users className="w-5 h-5 text-voltech-warning" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Últimas Ventas</h3>
          <div className="space-y-3">
            {ventasRecientes.length === 0 ? (
              <p className="text-center text-voltech-muted py-8">No hay ventas registradas</p>
            ) : (
              ventasRecientes.map(venta => (
                <div key={venta.id} className="flex items-center justify-between p-3 bg-voltech-dark/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-voltech-success/20">
                      <ArrowUpRight className="w-4 h-4 text-voltech-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{venta.cliente}</p>
                      <p className="text-xs text-voltech-muted">{venta.fecha}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-voltech-success">${venta.total?.toFixed(2)}</p>
                    <p className="text-xs text-voltech-muted">{venta.productos?.length || 0} productos</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Resumen Semanal</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-voltech-dark/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-voltech-cyan" />
                <span className="text-sm text-white">Ventas esta semana</span>
              </div>
              <span className="text-sm font-bold text-white">{stats.ventasSemana}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-voltech-dark/50 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-voltech-success" />
                <span className="text-sm text-white">Ingresos esta semana</span>
              </div>
              <span className="text-sm font-bold text-voltech-success">${stats.ingresosSemana.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-voltech-dark/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-voltech-purple" />
                <span className="text-sm text-white">Productos vendidos</span>
              </div>
              <span className="text-sm font-bold text-white">{stats.productosVendidos}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}