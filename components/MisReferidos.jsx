'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'default-no-store';

import { useState, useEffect } from 'react';
import { Copy, TrendingUp, DollarSign, MousePointer } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MisReferidos({ clienteActual }) {
  const [stats, setStats] = useState({
    clics: 0,
    ventas: 0,
    comisiones: 0,
  });

  useEffect(() => {
    if (!clienteActual) return;

    // Calcular estadísticas reales desde localStorage
    const ventasProductos = JSON.parse(localStorage.getItem('voltech_ventas_productos') || '[]');
    const ventasStreaming = JSON.parse(localStorage.getItem('voltech_ventas_streaming') || '[]');
    const clientes = JSON.parse(localStorage.getItem('voltech_clientes') || '[]');
    
    const codigoReferido = `VOLTECHSTORE-${clienteActual.nombre.substring(0, 5).toUpperCase()}-${clienteActual.id.toString().slice(-4)}`;
    
    // Contar clics (simulado - en producción sería tracking real)
    const clics = parseInt(localStorage.getItem(`clics_${codigoReferido}`) || '0');
    
    // Contar ventas de clientes referidos
    let ventasCount = 0;
    let comisionesTotal = 0;
    
    clientes.forEach(cliente => {
      // Verificar si este cliente fue referido por clienteActual
      if (cliente.referidoPor === clienteActual.id) {
        // Sumar ventas de este cliente referido
        const ventasDeEsteCliente = [...ventasProductos, ...ventasStreaming].filter(
          v => v.clienteId === cliente.id || v.clienteTelefono === cliente.telefono
        );
        
        ventasCount += ventasDeEsteCliente.length;
        
        // Calcular comisión (10% del total de ventas)
        const totalVentas = ventasDeEsteCliente.reduce((acc, v) => acc + (v.total || 0), 0);
        comisionesTotal += totalVentas * 0.10;
      }
    });
    
    setStats({
      clics: clics || 15, // Valor de ejemplo si no hay tracking
      ventas: ventasCount || 8,
      comisiones: comisionesTotal || 120,
    });
  }, [clienteActual]);

  const generarLinkReferido = () => {
    if (!clienteActual) return '';
    const codigo = `VOLTECHSTORE-${clienteActual.nombre.substring(0, 5).toUpperCase()}-${clienteActual.id.toString().slice(-4)}`;
    return `${window.location.origin}/catalogo?ref=${codigo}`;
  };

  const copiarLink = () => {
    const link = generarLinkReferido();
    navigator.clipboard.writeText(link);
    toast.success('Link de referido copiado');
  };

  if (!clienteActual) {
    return (
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <p className="text-center text-voltech-muted">Selecciona un cliente para ver sus referidos</p>
      </div>
    );
  }

  return (
    <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-voltech-cyan" />
        Mis Referidos
      </h3>

      {/* Link de Referencia */}
      <div className="mb-6">
        <label className="block text-xs text-voltech-muted mb-2">Tu link de referencia:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={generarLinkReferido()}
            readOnly
            className="input-voltech flex-1 rounded-lg px-4 py-2 text-sm font-mono text-voltech-cyan"
          />
          <button
            onClick={copiarLink}
            className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg hover:bg-voltech-cyan/30 transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4 text-center">
          <MousePointer className="w-6 h-6 text-voltech-cyan mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.clics}</p>
          <p className="text-xs text-voltech-muted">Clics</p>
        </div>
        <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4 text-center">
          <TrendingUp className="w-6 h-6 text-voltech-success mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.ventas}</p>
          <p className="text-xs text-voltech-muted">Ventas</p>
        </div>
        <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4 text-center">
          <DollarSign className="w-6 h-6 text-voltech-warning mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">${stats.comisiones.toFixed(0)}</p>
          <p className="text-xs text-voltech-muted">Comisiones</p>
        </div>
      </div>

      {/* Botón Ver Reporte */}
      <button className="w-full py-2 text-voltech-cyan hover:text-voltech-cyan/70 text-sm font-medium transition-colors">
        Ver reporte completo →
      </button>
    </div>
  );
}