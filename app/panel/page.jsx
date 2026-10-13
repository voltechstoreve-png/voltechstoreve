'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Package, DollarSign, TrendingUp, AlertTriangle, 
  ShoppingCart, Users, Calendar, ArrowUpRight
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProductos: 0,
    productosPublicados: 0,
    stockBajo: 0,
    agotados: 0,
    valorInventario: 0,
    miembrosEquipo: 0,
    ventasHoy: 0,
    ingresosHoy: 0
  });

  useEffect(() => {
    const cargarDatos = async () => {
      let productos = [], ventas = [], equipo = [];

      if (supabase) {
        const [{ data: pData }, { data: vData }, { data: eData }] = await Promise.all([
          supabase.from('productos').select('*'),
          supabase.from('ventas').select('*'),
          supabase.from('usuarios').select('*')
        ]);
        if (pData) productos = pData;
        if (vData) ventas = vData;
        if (eData) equipo = eData;
      } else {
        productos = JSON.parse(localStorage.getItem('voltech_productos') || '[]');
        ventas = JSON.parse(localStorage.getItem('voltech_ventas') || '[]');
        equipo = JSON.parse(localStorage.getItem('voltech_equipo') || '[]');
      }

      const hoy = new Date().toISOString().split('T')[0];
      const ventasHoy = ventas.filter(v => v.fecha === hoy);

      setStats({
        totalProductos: productos.length,
        productosPublicados: productos.filter(p => p.publicado).length,
        stockBajo: productos.filter(p => p.cantidad <= 2 && p.cantidad > 0).length,
        agotados: productos.filter(p => p.cantidad === 0).length,
        valorInventario: productos.reduce((sum, p) => sum + ((p.precioMayor || 0) * (p.cantidad || 0)), 0),
        miembrosEquipo: equipo.length,
        ventasHoy: ventasHoy.length,
        ingresosHoy: ventasHoy.reduce((sum, v) => sum + (v.total || 0), 0)
      });
    };

    cargarDatos();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-voltech-muted mt-1">Resumen general de tu tienda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-voltech-muted">Valor Inventario</p>
              <p className="text-xl font-bold text-white">${stats.valorInventario.toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-cyan/20">
              <DollarSign className="w-5 h-5 text-voltech-cyan" />
            </div>
          </div>
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-voltech-muted">Productos Publicados</p>
              <p className="text-xl font-bold text-white">{stats.productosPublicados}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-purple/20">
              <Package className="w-5 h-5 text-voltech-purple" />
            </div>
          </div>
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-voltech-muted">Miembros Equipo</p>
              <p className="text-xl font-bold text-white">{stats.miembrosEquipo}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-success/20">
              <Users className="w-5 h-5 text-voltech-success" />
            </div>
          </div>
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-voltech-muted">Productos Agotados</p>
              <p className="text-xl font-bold text-white">{stats.agotados}</p>
            </div>
            <div className="p-2 rounded-lg bg-voltech-error/20">
              <AlertTriangle className="w-5 h-5 text-voltech-error" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Accesos Rápidos</h3>
          <div className="grid grid-cols-2 gap-4">
            <a href="/panel/productos" className="p-4 bg-voltech-dark/50 border border-voltech-border rounded-lg hover:border-voltech-cyan transition-colors">
              <Package className="w-6 h-6 text-voltech-cyan mb-2" />
              <p className="text-sm font-medium text-white">Productos</p>
            </a>
            <a href="/panel/ventas-productos" className="p-4 bg-voltech-dark/50 border border-voltech-border rounded-lg hover:border-voltech-success transition-colors">
              <ShoppingCart className="w-6 h-6 text-voltech-success mb-2" />
              <p className="text-sm font-medium text-white">Ventas</p>
            </a>
            <a href="/panel/finanzas" className="p-4 bg-voltech-dark/50 border border-voltech-border rounded-lg hover:border-voltech-purple transition-colors">
              <TrendingUp className="w-6 h-6 text-voltech-purple mb-2" />
              <p className="text-sm font-medium text-white">Finanzas</p>
            </a>
            <a href="/panel/equipo" className="p-4 bg-voltech-dark/50 border border-voltech-border rounded-lg hover:border-voltech-warning transition-colors">
              <Users className="w-6 h-6 text-voltech-warning mb-2" />
              <p className="text-sm font-medium text-white">Equipo</p>
            </a>
          </div>
        </div>

        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Últimos Movimientos</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-voltech-dark/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-voltech-success/20">
                  <ArrowUpRight className="w-4 h-4 text-voltech-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Productos Actualizados</p>
                  <p className="text-xs text-voltech-muted">Hace un momento</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-voltech-dark/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-voltech-cyan/20">
                  <Calendar className="w-4 h-4 text-voltech-cyan" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Ventas Hoy</p>
                  <p className="text-xs text-voltech-muted">{stats.ventasHoy} ventas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}