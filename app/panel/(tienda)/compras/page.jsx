'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; // ✅ NUEVO: Conexión a Supabase
import { 
  Search, 
  Eye, 
  Package, 
  Calendar, 
  User, 
  Building, 
  CreditCard,
  X,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function ComprasPage() {
  const [productos, setProductos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const cargarCompras = async () => {
      let comprasData = [];

      // ✅ 1. INTENTAR OBTENER DATOS DESDE SUPABASE
      if (supabase) {
        const { data, error } = await supabase
          .from('compras')
          .select('*')
          .order('fecha', { ascending: false });

        if (!error && data && data.length > 0) {
          comprasData = data.map(c => ({ ...c, esFallback: false }));
        }
      }

      // ✅ 2. FALLBACK A LOCALSTORAGE (Si Supabase está vacío o falla)
      if (comprasData.length === 0) {
        const productosGuardados = localStorage.getItem('voltech_productos');
        if (productosGuardados) {
          const prods = JSON.parse(productosGuardados);
          setProductos(prods);
          
          const todasLasCompras = [];
          
          prods.forEach(producto => {
            if (producto.historial && producto.historial.length > 0) {
              producto.historial.forEach((compra, index) => {
                todasLasCompras.push({
                  ...compra,
                  id: `${producto.id}-hist-${index}`,
                  productoId: producto.id,
                  producto: producto.plataforma || producto.producto,
                  plataforma: producto.plataforma || producto.producto,
                  sku: producto.sku,
                  categoria: producto.categoria,
                  marca: producto.marca,
                  imagen: producto.imagen,
                  esFallback: true
                });
              });
            } else {
              todasLasCompras.push({
                id: `${producto.id}-current`,
                productoId: producto.id,
                producto: producto.plataforma || producto.producto,
                plataforma: producto.plataforma || producto.producto,
                sku: producto.sku,
                categoria: producto.categoria,
                marca: producto.marca,
                imagen: producto.imagen,
                fecha: producto.fecha || new Date().toISOString().split('T')[0],
                cantidad: producto.cantidad || 0,
                precioUnitario: producto.precioMayor || 0,
                precioTotal: (producto.precioMayor || 0) * (producto.cantidad || 0),
                proveedor: producto.proveedor,
                comprador: producto.comprador,
                metodoPago: producto.metodoPago,
                cartera: producto.cartera,
                esFallback: true
              });
            }
          });
          
          todasLasCompras.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
          comprasData = todasLasCompras;
        }
      }

      setCompras(comprasData);
    };

    cargarCompras();
  }, []);

  const comprasFiltradas = compras.filter(c =>
    (c.producto || c.plataforma || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.comprador && c.comprador.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.proveedor && c.proveedor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ✅ Agrupa por SKU/producto: última compra + historial completo
  const comprasAgrupadas = useMemo(() => {
    const grupos = {};
    compras.forEach(c => {
      const key = c.sku || c.productoId || (c.producto || c.plataforma || 'SIN-SKU');
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(c);
    });
    return Object.entries(grupos)
      .map(([key, arr]) => {
        arr.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        const ultima = arr[0];
        const totalUnidades = arr.reduce((s, x) => s + (Number(x.cantidad) || 0), 0);
        return { key, historial: arr, ultima, totalUnidades };
      })
      .sort((a, b) => new Date(b.ultima.fecha) - new Date(a.ultima.fecha));
  }, [compras]);

  const gruposFiltrados = comprasAgrupadas.filter(g =>
    (g.ultima.producto || g.ultima.plataforma || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.key || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.ultima.comprador && g.ultima.comprador.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (g.ultima.proveedor && g.ultima.proveedor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' },
          success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } },
        }}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Compras / Inventario</h1>
          <p className="text-sm text-voltech-muted mt-1">Historial completo de todas las compras y actualizaciones</p>
        </div>
        <Link
          href="/panel/productos"
          className="px-4 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-cyan transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Ir a Productos
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar por producto, SKU, comprador o proveedor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-voltech w-full rounded-lg pl-10 pr-4 py-3 text-sm"
        />
      </div>

      <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
        {gruposFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50 text-voltech-muted" />
            <p className="text-voltech-muted font-medium">No hay compras registradas</p>
            <p className="text-xs text-voltech-muted mt-1 mb-4">Las compras aparecerán aquí cuando agregues o actualices productos.</p>
            <Link href="/panel/productos" className="inline-flex items-center gap-2 px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors">
              <Package className="w-4 h-4" /> Ir a gestionar Productos
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-voltech-dark border-b border-voltech-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Última Compra</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Comprador</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Proveedor</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted">Cant.</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Monto Mayor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Cartera</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>
                </tr>
              </thead>

              {gruposFiltrados.map(g => (
                <tbody key={g.key}>
                  <tr className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-voltech-cyan font-mono whitespace-nowrap">{g.key}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {g.ultima.imagen ? (
                          <img src={g.ultima.imagen} alt={g.ultima.producto} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-voltech-dark flex items-center justify-center"><Package className="w-5 h-5 text-voltech-muted" /></div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-white">{g.ultima.producto}</p>
                          <p className="text-xs text-voltech-muted">{g.ultima.marca} • {g.ultima.categoria}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white whitespace-nowrap">{g.ultima.fecha}</td>
                    <td className="px-4 py-3 text-sm text-voltech-muted">{g.ultima.comprador || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-voltech-muted">{g.ultima.proveedor || 'N/A'}</td>
                    <td className="px-4 py-3 text-center">
                      <p className="text-sm font-bold text-white">{g.ultima.cantidad}</p>
                      <p className="text-[10px] text-voltech-muted">acum: {g.totalUnidades}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-voltech-success font-semibold">${(g.ultima.precioUnitario || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-voltech-muted">{g.ultima.cartera || 'N/A'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setExpandedId(expandedId === g.key ? null : g.key)}
                        className="text-xs py-1.5 px-3 bg-voltech-cyan/20 text-voltech-cyan rounded-lg hover:bg-voltech-cyan/30 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{expandedId === g.key ? 'Ver menos' : `Ver más (${g.historial.length})`}</span>
                      </button>
                    </td>
                  </tr>

                  {expandedId === g.key && (
                    <tr className="bg-voltech-dark/40 border-b border-voltech-border">
                      <td colSpan={9} className="px-4 py-4">
                        <p className="text-xs font-semibold text-voltech-cyan mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" /> Historial de Compras — {g.key}</p>
                        <div className="overflow-x-auto rounded-lg border border-voltech-border">
                          <table className="w-full min-w-[760px]">
                            <thead className="bg-voltech-dark border-b border-voltech-border">
                              <tr>
                                <th className="text-left px-3 py-2 text-[10px] font-semibold text-voltech-muted">Fecha</th>
                                <th className="text-left px-3 py-2 text-[10px] font-semibold text-voltech-muted">Comprador</th>
                                <th className="text-left px-3 py-2 text-[10px] font-semibold text-voltech-muted">Proveedor</th>
                                <th className="text-center px-3 py-2 text-[10px] font-semibold text-voltech-muted">Cant.</th>
                                <th className="text-right px-3 py-2 text-[10px] font-semibold text-voltech-muted">Precio Unit.</th>
                                <th className="text-right px-3 py-2 text-[10px] font-semibold text-voltech-muted">Total</th>
                                <th className="text-left px-3 py-2 text-[10px] font-semibold text-voltech-muted">Cartera</th>
                                <th className="text-left px-3 py-2 text-[10px] font-semibold text-voltech-muted">Método</th>
                              </tr>
                            </thead>
                            <tbody>
                              {g.historial.map(h => (
                                <tr key={h.id} className="border-b border-voltech-border/50 last:border-b-0 hover:bg-voltech-border/20">
                                  <td className="px-3 py-2 text-xs text-white whitespace-nowrap">{h.fecha}</td>
                                  <td className="px-3 py-2 text-xs text-voltech-muted">{h.comprador || 'N/A'}</td>
                                  <td className="px-3 py-2 text-xs text-voltech-muted">{h.proveedor || 'N/A'}</td>
                                  <td className="px-3 py-2 text-center text-xs text-white">{h.cantidad}</td>
                                  <td className="px-3 py-2 text-right text-xs text-voltech-muted">${(h.precioUnitario || 0).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right text-xs text-voltech-success font-semibold">${(h.precioTotal || 0).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-xs text-voltech-muted">{h.cartera || 'N/A'}</td>
                                  <td className="px-3 py-2 text-xs text-voltech-muted">{h.metodoPago || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              ))}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}