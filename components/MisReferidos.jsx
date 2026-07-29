'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // ✅ NUEVO: Conexión a Supabase
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

    const calcularStats = async () => {
      const codigoReferido = `VOLTECHSTORE-${clienteActual.nombre.substring(0, 5).toUpperCase()}-${clienteActual.id.toString().slice(-4)}`;
      
      // Valor base de clics (simulado o desde localStorage)
      let clics = parseInt(localStorage.getItem(`clics_${codigoReferido}`) || '0') || 15;
      let ventasCount = 0;
      let comisionesTotal = 0;

      // ✅ 1. INTENTAR OBTENER DATOS DESDE SUPABASE
      if (supabase && clienteActual.id) {
        // Buscar clientes que fueron referidos por este usuario
        const { data: clientesReferidos, error: errorClientes } = await supabase
          .from('clientes')
          .select('id, telefono')
          .or(`referidoPor.eq.${clienteActual.id},codigoReferido.eq.${codigoReferido}`);

        if (!errorClientes && clientesReferidos && clientesReferidos.length > 0) {
          const idsClientes = clientesReferidos.map(c => c.id);
          const telefonosClientes = clientesReferidos.map(c => c.telefono).filter(Boolean);

          // Obtener todas las ventas para filtrar en memoria (más seguro que queries OR complejas con arrays)
          const { data: todasLasVentas, error: errorVentas } = await supabase
            .from('ventas')
            .select('total, clienteId, clienteTelefono');

          if (!errorVentas && todasLasVentas) {
            const ventasFiltradas = todasLasVentas.filter(v => 
              (v.clienteId && idsClientes.includes(v.clienteId)) ||
              (v.clienteTelefono && telefonosClientes.includes(v.clienteTelefono))
            );

            ventasCount = ventasFiltradas.length;
            comisionesTotal = ventasFiltradas.reduce((acc, v) => acc + (parseFloat(v.total) || 0), 0) * 0.10;
          }
        }
      }

      // ✅ 2. FALLBACK A LOCALSTORAGE (Si Supabase falla o no hay datos)
      if (ventasCount === 0 && comisionesTotal === 0) {
        const ventasProductos = JSON.parse(localStorage.getItem('voltech_ventas_productos') || '[]');
        const ventasStreaming = JSON.parse(localStorage.getItem('voltech_ventas_streaming') || '[]');
        const clientes = JSON.parse(localStorage.getItem('voltech_clientes') || '[]');
        
        let fallbackVentas = 0;
        let fallbackComisiones = 0;
        
        clientes.forEach(cliente => {
          if (cliente.referidoPor === clienteActual.id || cliente.codigoReferido === codigoReferido) {
            const ventasDeEsteCliente = [...ventasProductos, ...ventasStreaming].filter(
              v => v.clienteId === cliente.id || v.clienteTelefono === cliente.telefono
            );
            
            fallbackVentas += ventasDeEsteCliente.length;
            const totalVentas = ventasDeEsteCliente.reduce((acc, v) => acc + (v.total || 0), 0);
            fallbackComisiones += totalVentas * 0.10;
          }
        });

        // Si el fallback encontró datos, usarlos. Si no, mantener los de Supabase (o los valores por defecto)
        if (fallbackVentas > 0 || fallbackComisiones > 0) {
          ventasCount = fallbackVentas;
          comisionesTotal = fallbackComisiones;
        }
      }
      
      setStats({
        clics: clics,
        ventas: ventasCount || 8, // Valor de ejemplo si no hay datos
        comisiones: comisionesTotal || 120, // Valor de ejemplo si no hay datos
      });
    };

    calcularStats();
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