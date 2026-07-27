'use client';


import { useState, useEffect } from 'react';
import Link from 'next/link';
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
            cantidad: producto.cantidad,
            precioUnitario: producto.precioMayor,
            precioTotal: producto.precioMayor * producto.cantidad,
            proveedor: producto.proveedor,
            comprador: producto.comprador,
            metodoPago: producto.metodoPago,
            cartera: producto.cartera,
            esFallback: true
          });
        }
      });
      
      todasLasCompras.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setCompras(todasLasCompras);
    }
  }, []);

  const comprasFiltradas = compras.filter(c =>
    (c.producto || c.plataforma || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.comprador && c.comprador.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.proveedor && c.proveedor.toLowerCase().includes(searchTerm.toLowerCase()))
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

      <div className="space-y-4">
        {comprasFiltradas.length === 0 ? (
          <div className="bg-voltech-surface border border-voltech-border rounded-xl p-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50 text-voltech-muted" />
            <p className="text-voltech-muted font-medium">No hay compras registradas</p>
            <p className="text-xs text-voltech-muted mt-1 mb-4">Las compras aparecerán aquí cuando agregues o actualices productos.</p>
            <Link
              href="/panel/productos"
              className="inline-flex items-center gap-2 px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors"
            >
              <Package className="w-4 h-4" />
              Ir a gestionar Productos
            </Link>
          </div>
        ) : (
          comprasFiltradas.map((compra) => (
            <motion.div
              key={compra.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden hover:border-voltech-cyan/50 transition-all"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-voltech-cyan/20">
                      <Calendar className="w-5 h-5 text-voltech-cyan" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{compra.fecha}</p>
                      <div className="flex items-center gap-3 text-xs text-voltech-muted mt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {compra.comprador || 'N/A'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" /> {compra.proveedor || 'N/A'}
                        </span>
                        {compra.esFallback && (
                          <>
                            <span>•</span>
                            <span className="text-voltech-warning">Último estado</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedId(expandedId === compra.id ? null : compra.id)}
                    className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {expandedId === compra.id ? 'Ocultar' : 'Ver Detalles'}
                  </button>
                </div>

                <div className="border-t border-voltech-border pt-4">
                  <div className="flex items-center gap-3">
                    {compra.imagen ? (
                      <img src={compra.imagen} alt={compra.producto} className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-voltech-dark flex items-center justify-center">
                        <Package className="w-6 h-6 text-voltech-muted" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white">{compra.producto}</h3>
                      <p className="text-xs text-voltech-muted">{compra.marca} • {compra.categoria}</p>
                      <p className="text-xs text-voltech-cyan font-mono mt-1">{compra.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-voltech-muted">Cantidad</p>
                      <p className="text-lg font-bold text-white">{compra.cantidad} unid.</p>
                      <p className="text-sm text-voltech-success">${compra.precioTotal?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === compra.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-voltech-border mt-4 pt-4 space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-voltech-muted flex items-center gap-1">
                            <CreditCard className="w-3 h-3" /> Método de Pago
                          </p>
                          <p className="text-sm text-white">{compra.metodoPago || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-voltech-muted">Cartera</p>
                          <p className="text-sm text-white">{compra.cartera || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-voltech-dark/50 rounded-lg p-4">
                          <p className="text-xs text-voltech-muted">Cantidad</p>
                          <p className="text-xl font-bold text-white">{compra.cantidad}</p>
                          <p className="text-xs text-voltech-muted">unidades</p>
                        </div>
                        <div className="bg-voltech-dark/50 rounded-lg p-4">
                          <p className="text-xs text-voltech-muted">Precio Unitario</p>
                          <p className="text-xl font-bold text-white">${compra.precioUnitario?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div className="bg-voltech-cyan/10 border border-voltech-cyan/30 rounded-lg p-4">
                          <p className="text-xs text-voltech-muted">Total</p>
                          <p className="text-xl font-bold text-voltech-cyan">${compra.precioTotal?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Link
                          href="/panel/productos"
                          className="flex-1 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-xs text-white hover:border-voltech-cyan transition-colors flex items-center justify-center gap-2"
                        >
                          <Package className="w-3 h-3" />
                          Ver en Productos
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}