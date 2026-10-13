'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Search, Eye, Package, Calendar, X, ArrowLeft, 
  Plus, Save, ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function ComprasPage() {
  const [productos, setProductos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [carteras, setCarteras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [usuarioActual, setUsuarioActual] = useState('Administrador');

  // Modal de registro de compra
  const [showModalCompra, setShowModalCompra] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [formCompra, setFormCompra] = useState({
    cantidad: 1,
    precioUnitario: 0,
    proveedor: '',
    comprador: '',
    cartera: '',
    metodoPago: 'efectivo',
    fecha: new Date().toISOString().split('T')[0]
  });

  // ✅ Cargar productos, compras reales, carteras, proveedores, métodos y usuario
  useEffect(() => {
    const cargarDatos = async () => {
      let prodsData = [];
      let comprasData = [];
      let carterasData = [];
      let provsData = [];
      let sData = {};

      if (supabase) {
        const [
          { data: p },
          { data: c },
          { data: cart },
          { data: prov },
          { data: s }
        ] = await Promise.all([
          supabase.from('productos').select('*').order('creado_en', { ascending: false }),
          supabase.from('compras').select('*').order('fecha', { ascending: false }),
          supabase.from('carteras').select('*'),
          supabase.from('proveedores').select('*'),
          supabase.from('settings').select('clave, valor')
        ]);

        if (p) prodsData = p;
        if (c) comprasData = c;
        if (cart) carterasData = cart;
        if (prov) provsData = prov;
        if (s) {
          s.forEach(item => {
            let v = item.valor;
            if (typeof v === 'string') {
              try { v = JSON.parse(v); } catch (e) {}
            }
            sData[item.clave] = v;
          });
        }
      }

      // Fallbacks a localStorage
      if (prodsData.length === 0) {
        const saved = localStorage.getItem('voltech_productos');
        if (saved) prodsData = JSON.parse(saved);
      }

      // Métodos de pago desde settings
      const metodosRaw = sData.pagos || {};
      let metodosLista = [];
      if (Array.isArray(metodosRaw)) metodosLista = metodosRaw;
      else if (metodosRaw && typeof metodosRaw === 'object') {
        metodosLista = Object.entries(metodosRaw).map(([key, m]) => ({ id: key, ...(m || {}) }));
      }

      // Usuario actual
      let usuario = 'Administrador';
      try {
        const raw = localStorage.getItem('voltech_usuario') || localStorage.getItem('usuario') || localStorage.getItem('voltech_user');
        if (raw) {
          const u = JSON.parse(raw);
          usuario = u.nombre || u.name || u.email || 'Administrador';
        }
      } catch (e) {}

      setProductos(prodsData);
      setCompras(comprasData);
      setCarteras(carterasData.filter(c => c.activo !== false));
      setProveedores(provsData);
      setMetodosPago(metodosLista.filter(m => m.activo !== false && m.activa !== false));
      setUsuarioActual(usuario);
      setFormCompra(prev => ({ ...prev, comprador: usuario }));
    };

    cargarDatos();
  }, []);

  // ✅ Solo productos físicos (no streaming, no combos)
  const productosFisicos = productos.filter(p =>
    (p.tipo === 'fisico' || p.tipo === 'kit' || !p.tipo) &&
    p.disponibilidad !== 'combo' &&
    (p.categoria || '').toUpperCase() !== 'STREAMING' &&
    (p.categoria || '').toUpperCase() !== 'COMBO'
  );

  // Búsqueda
  const productosFiltrados = productosFisicos.filter(p => {
    const t = searchTerm.toLowerCase();
    return (p.plataforma || p.producto || '').toLowerCase().includes(t) ||
           (p.sku || '').toLowerCase().includes(t) ||
           (p.marca || '').toLowerCase().includes(t) ||
           (p.categoria || '').toLowerCase().includes(t);
  });

  // ✅ Agrupar compras REALES por producto_id
  const comprasPorProducto = useMemo(() => {
    const grupos = {};
    compras.forEach(c => {
      const key = c.producto_id || c.productoId;
      if (!key) return;
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(c);
    });
    Object.values(grupos).forEach(arr => {
      arr.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    });
    return grupos;
  }, [compras]);

  const abrirModalCompra = (producto) => {
    setProductoSeleccionado(producto);
    setFormCompra({
      cantidad: 1,
      precioUnitario: producto.precioMayor || 0,
      proveedor: producto.proveedor || '',
      comprador: usuarioActual,
      cartera: '',
      metodoPago: 'efectivo',
      fecha: new Date().toISOString().split('T')[0]
    });
    setShowModalCompra(true);
  };

  // ✅ REGISTRAR COMPRA: crea fila en `compras` + suma stock al producto
  const registrarCompra = async () => {
    if (!productoSeleccionado) return;
    if (!formCompra.cantidad || Number(formCompra.cantidad) <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }
    if (!formCompra.precioUnitario || Number(formCompra.precioUnitario) <= 0) {
      toast.error('El precio unitario debe ser mayor a 0');
      return;
    }

    const cantNum = Number(formCompra.cantidad);
    const precioNum = Number(formCompra.precioUnitario);

    const nuevaCompra = {
      producto_id: productoSeleccionado.id,
      producto_nombre: productoSeleccionado.plataforma || productoSeleccionado.producto,
      sku: productoSeleccionado.sku || '',
      fecha: formCompra.fecha,
      cantidad: cantNum,
      precioUnitario: precioNum,
      precioTotal: cantNum * precioNum,
      proveedor: formCompra.proveedor || '',
      comprador: formCompra.comprador || usuarioActual,
      cartera: formCompra.cartera || '',
      metodoPago: formCompra.metodoPago || 'efectivo'
    };

    try {
      if (supabase) {
        // 1. Guardar la compra en la tabla `compras`
        const { error: errC } = await supabase.from('compras').insert(nuevaCompra);
        if (errC) throw errC;

        // 2. Sumar stock al producto (y actualizar proveedor/precio si cambió)
        const nuevoStock = (productoSeleccionado.cantidad || 0) + cantNum;
        await supabase.from('productos')
          .update({
            cantidad: nuevoStock,
            proveedor: formCompra.proveedor || productoSeleccionado.proveedor,
            precioMayor: precioNum || productoSeleccionado.precioMayor,
            preciomayor: precioNum || productoSeleccionado.precioMayor
          })
          .eq('id', productoSeleccionado.id);
      }

      // 3. Actualizar estado local
      setCompras([nuevaCompra, ...compras]);
      setProductos(productos.map(p =>
        p.id === productoSeleccionado.id
          ? {
              ...p,
              cantidad: (p.cantidad || 0) + cantNum,
              proveedor: formCompra.proveedor || p.proveedor,
              precioMayor: precioNum || p.precioMayor,
              preciomayor: precioNum || p.precioMayor
            }
          : p
      ));

      toast.success(`✅ Compra registrada: +${cantNum} unidades`);
      setShowModalCompra(false);
      setProductoSeleccionado(null);

      // Notificar al resto de la app (panel, catálogo, etc.)
      window.dispatchEvent(new CustomEvent('voltech-data-updated'));
    } catch (e) {
      console.error('Error registrando compra:', e);
      toast.error('Error al registrar: ' + e.message);
    }
  };

  // Opciones para selects
  const opcionesProveedores = proveedores
    .map(pr => ({ value: pr.nombre || pr.name || pr.razon_social || '', label: pr.nombre || pr.name || pr.razon_social || '' }))
    .filter(o => o.value);

  const opcionesCarteras = carteras
    .map(c => ({ value: c.nombre, label: c.nombre }))
    .filter(o => o.value);

  const opcionesMetodosPago = metodosPago.length > 0
    ? metodosPago.map(m => ({
        value: m.id || String(m.nombre || '').toLowerCase().replace(/\s+/g, '_'),
        label: m.nombre || m.id || ''
      }))
    : [
        { value: 'efectivo', label: 'Efectivo' },
        { value: 'pago_movil', label: 'Pago Móvil' },
        { value: 'transferencia', label: 'Transferencia' },
        { value: 'binance', label: 'Binance' }
      ];

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
          <p className="text-sm text-voltech-muted mt-1">
            Aquí registras las compras reales para sumar stock. Los productos "Compra al momento" aparecen con stock 0 listos para su primera compra.
          </p>
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
          placeholder="Buscar por producto, SKU, marca o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-voltech w-full rounded-lg pl-10 pr-4 py-3 text-sm"
        />
      </div>

      <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
        {productosFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50 text-voltech-muted" />
            <p className="text-voltech-muted font-medium">No hay productos físicos</p>
            <p className="text-xs text-voltech-muted mt-1 mb-4">Crea productos primero en Productos para poder registrar compras.</p>
            <Link href="/panel/productos" className="inline-flex items-center gap-2 px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors">
              <Package className="w-4 h-4" /> Ir a Productos
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-voltech-dark border-b border-voltech-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Modelo / Variante</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted">Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Proveedor actual</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Costo unit.</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-voltech-muted">Compras</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map(p => {
                  const historial = comprasPorProducto[p.id] || [];
                  const totalComprado = historial.reduce((s, c) => s + (Number(c.cantidad) || 0), 0);
                  return (
                    <Fragment key={p.id}>
                      <tr className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors">
                        <td className="px-4 py-3 text-xs text-voltech-cyan font-mono whitespace-nowrap">{p.sku || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.imagen ? (
                              <img src={p.imagen} alt={p.plataforma} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-voltech-dark flex items-center justify-center"><Package className="w-5 h-5 text-voltech-muted" /></div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-white">{p.plataforma || p.producto}</p>
                              <p className="text-xs text-voltech-muted">{p.marca || '—'} • {p.categoria || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-voltech-muted">
                          {p.modelo && <span className="inline-block mr-1">{p.modelo}</span>}
                          {p.variante && <span className="inline-block mr-1">• {p.variante}</span>}
                          {Array.isArray(p.potencia) && p.potencia.length > 0 && (
                            <span className="text-voltech-warning">{p.potencia.join(', ')}</span>
                          )}
                          {!p.modelo && !p.variante && !(p.potencia?.length > 0) && '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <p className={`text-sm font-bold ${(p.cantidad || 0) === 0 ? 'text-voltech-error' : (p.cantidad || 0) <= 2 ? 'text-voltech-warning' : 'text-voltech-success'}`}>
                            {p.cantidad || 0}
                          </p>
                          {p.disponibilidad === 'bajo_pedido' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-voltech-warning/20 text-voltech-warning">🛒 Al momento</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-voltech-muted">{p.proveedor || '—'}</td>
                        <td className="px-4 py-3 text-right text-sm text-voltech-muted">${(p.precioMayor || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          {historial.length > 0 ? (
                            <button
                              onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                              className="text-xs py-1.5 px-3 bg-voltech-cyan/20 text-voltech-cyan rounded-lg hover:bg-voltech-cyan/30 transition-colors inline-flex items-center gap-1.5"
                            >
                              <Eye className="w-4 h-4" />
                              <span>{expandedId === p.id ? 'Ver menos' : `Ver (${historial.length})`}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-voltech-muted">Sin compras</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => abrirModalCompra(p)}
                            className="text-xs py-1.5 px-3 bg-voltech-success/20 text-voltech-success rounded-lg hover:bg-voltech-success/30 transition-colors inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Registrar Compra</span>
                          </button>
                        </td>
                      </tr>

                      {expandedId === p.id && historial.length > 0 && (
                        <tr className="bg-voltech-dark/40 border-b border-voltech-border">
                          <td colSpan={8} className="px-4 py-4">
                            <p className="text-xs font-semibold text-voltech-cyan mb-3 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Historial de Compras — {p.plataforma || p.producto}
                              <span className="text-voltech-muted ml-2">(total comprado: {totalComprado} unid.)</span>
                            </p>
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
                                  {historial.map(h => (
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
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Registrar Compra */}
      <AnimatePresence>
        {showModalCompra && productoSeleccionado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModalCompra(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-voltech-surface border border-voltech-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-voltech-surface border-b border-voltech-border p-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-voltech-cyan" />
                  Registrar Compra
                </h2>
                <button onClick={() => setShowModalCompra(false)} className="p-2 rounded-lg hover:bg-voltech-border">
                  <X className="w-5 h-5 text-voltech-muted" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Producto */}
                <div className="flex items-center gap-3 p-3 bg-voltech-dark/50 rounded-lg border border-voltech-border">
                  {productoSeleccionado.imagen ? (
                    <img src={productoSeleccionado.imagen} alt="" className="w-14 h-14 rounded-lg object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-voltech-dark flex items-center justify-center"><Package className="w-6 h-6 text-voltech-muted" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{productoSeleccionado.plataforma || productoSeleccionado.producto}</p>
                    <p className="text-xs text-voltech-muted">{productoSeleccionado.marca || '—'} • {productoSeleccionado.categoria || '—'}</p>
                    <p className="text-xs text-voltech-cyan font-mono mt-0.5">{productoSeleccionado.sku || 'Sin SKU'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-voltech-muted">Stock actual</p>
                    <p className={`text-lg font-bold ${(productoSeleccionado.cantidad || 0) === 0 ? 'text-voltech-error' : 'text-voltech-success'}`}>
                      {productoSeleccionado.cantidad || 0}
                    </p>
                  </div>
                </div>

                {/* Cantidad y Precio */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Cantidad a comprar *</label>
                    <input
                      type="number"
                      min="1"
                      value={formCompra.cantidad}
                      onChange={(e) => setFormCompra({ ...formCompra, cantidad: e.target.value })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Precio unitario ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formCompra.precioUnitario}
                      onChange={(e) => setFormCompra({ ...formCompra, precioUnitario: e.target.value })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                    />
                  </div>
                </div>

                {/* Total calculado */}
                {Number(formCompra.cantidad) > 0 && Number(formCompra.precioUnitario) > 0 && (
                  <div className="p-3 bg-voltech-success/10 border border-voltech-success/30 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-voltech-muted">Total de la compra:</span>
                    <span className="text-lg font-bold text-voltech-success">
                      ${(Number(formCompra.cantidad) * Number(formCompra.precioUnitario)).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Fecha */}
                <div>
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Fecha de compra</label>
                  <input
                    type="date"
                    value={formCompra.fecha}
                    onChange={(e) => setFormCompra({ ...formCompra, fecha: e.target.value })}
                    className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                  />
                </div>

                {/* Proveedor */}
                <div>
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Proveedor</label>
                  <select
                    value={formCompra.proveedor}
                    onChange={(e) => setFormCompra({ ...formCompra, proveedor: e.target.value })}
                    className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                  >
                    <option value="">-- Sin especificar --</option>
                    {opcionesProveedores.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {/* Comprador */}
                <div>
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Comprador</label>
                  <input
                    type="text"
                    value={formCompra.comprador}
                    onChange={(e) => setFormCompra({ ...formCompra, comprador: e.target.value })}
                    className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                  />
                </div>

                {/* Método de pago y Cartera */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Método de pago</label>
                    <select
                      value={formCompra.metodoPago}
                      onChange={(e) => setFormCompra({ ...formCompra, metodoPago: e.target.value })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                    >
                      {opcionesMetodosPago.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Cartera</label>
                    <select
                      value={formCompra.cartera}
                      onChange={(e) => setFormCompra({ ...formCompra, cartera: e.target.value })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                    >
                      <option value="">-- Sin cartera --</option>
                      {opcionesCarteras.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowModalCompra(false)}
                    className="flex-1 px-4 py-2.5 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={registrarCompra}
                    className="flex-1 px-4 py-2.5 bg-voltech-success text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-voltech-success/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Registrar Compra
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}