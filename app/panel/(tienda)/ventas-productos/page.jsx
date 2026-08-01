'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/app/context/PermissionsContext';
import { 
  ShoppingCart, DollarSign, TrendingUp, Users, Plus, X, Save, Search,
  Calendar, CreditCard, Tag, MessageCircle, Edit3, Trash2, CheckCircle,
  Truck, ChevronDown, Package, ExternalLink, FileText, Bell, AlertTriangle, ArrowUpRight,
  Box, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function VentasProductosPage() {
  const router = useRouter();
  const { esVendedor, usuarioActual } = usePermissions();
  
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [kits, setKits] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [equipo, setEquipo] = useState([]);
  const [carteras, setCarteras] = useState([]);
  const [settings, setSettings] = useState({});
  const [cupones, setCupones] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showWhatsappModal, setShowWhatsappModal] = useState(null);
  const [whatsappMode, setWhatsappMode] = useState('gracias');
  const [editingId, setEditingId] = useState(null);
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [productoModalIndex, setProductoModalIndex] = useState(null);
  const [clienteSearch, setClienteSearch] = useState('');
  const [showClientesDropdown, setShowClientesDropdown] = useState(false);
  const [showKitSelector, setShowKitSelector] = useState(false);

  const [cuponInput, setCuponInput] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState(null);
  const [errorCupon, setErrorCupon] = useState('');

  const [nuevoProducto, setNuevoProducto] = useState({
    plataforma: '', categoria: '', marca: '', precioMayor: 0, precioDetal: 0,
    precioBs: 0, cantidad: 1, tipo: 'fisico', metodoPago: 'efectivo', cartera: '',
  });

  const generarNumeroOrden = () => {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const ventasHoy = ventas.filter(v => v.fecha === hoy.toISOString().split('T')[0]);
    const consecutivo = String(ventasHoy.length + 1).padStart(3, '0');
    return `${dia}-${mes}-${consecutivo}`;
  };

  const [formData, setFormData] = useState({
    numeroOrden: generarNumeroOrden(),
    fecha: new Date().toISOString().split('T')[0],
    vendedor: '',
    cliente: '',
    telefono: '',
    productos: [{ 
      productoId: '', sku: '', categoria: '', marca: '', cantidad: 1, precioUnitario: 0,
      filtroCategoria: '', filtroMarca: '', esKit: false, productosIncluidos: []
    }],
    delivery: false, montoDelivery: 0, enCuotas: false, montoAbonado: 0, fechaPago: '',
    metodoPago: 'efectivo', carteraId: '', referencia: '',
  });

  useEffect(() => {
    const cargarDatos = async () => {
      let vts = [], prods = [], clts = [], eqp = [], crt = [], sttngs = {}, cpons = [], kts = [];
      
      if (supabase) {
        const [{ data: d1 }, { data: d2 }, { data: d3 }, { data: d4 }, { data: d5 }, { data: d6 }, { data: d7 }] = await Promise.all([
          supabase.from('ventas').select('*').order('fechaRegistro', { ascending: false }),
          supabase.from('productos').select('*'),
          supabase.from('clientes').select('*'),
          supabase.from('usuarios').select('*'),
          supabase.from('settings').select('clave, valor'),
          supabase.from('cupones').select('*'),
          supabase.from('kits').select('*').eq('activo', true)
        ]);
        if (d1) vts = d1;
        if (d2) prods = d2;
        if (d3) clts = d3;
        if (d4) eqp = d4;
        if (d5) {
          const tienda = d5.find(s => s.clave === 'tienda')?.valor || {};
          const pagos = d5.find(s => s.clave === 'pagos')?.valor || {};
          const carterasDb = d5.find(s => s.clave === 'carteras')?.valor || [];
          sttngs = { 
            tienda, 
            pagos, 
            carteras: carterasDb.length > 0 ? carterasDb : [], 
            tasaBCV: 36.5 
          };
        }
        if (d6) cpons = d6;
        if (d7) kts = d7;
      }

      if (vts.length === 0) vts = JSON.parse(localStorage.getItem('voltech_ventas') || '[]');
      if (prods.length === 0) prods = JSON.parse(localStorage.getItem('voltech_productos') || '[]');
      if (clts.length === 0) clts = JSON.parse(localStorage.getItem('voltech_clientes') || '[]');
      if (eqp.length === 0) eqp = JSON.parse(localStorage.getItem('voltech_equipo') || '[]');
      if (crt.length === 0) crt = JSON.parse(localStorage.getItem('voltech_carteras') || '[]');
      if (cpons.length === 0) cpons = JSON.parse(localStorage.getItem('voltech_cupones') || '[]');
      if (kts.length === 0) kts = JSON.parse(localStorage.getItem('voltech_kits') || '[]');
      
      const settingsLocales = JSON.parse(localStorage.getItem('voltech_settings') || '{}');
      const tasaLocales = JSON.parse(localStorage.getItem('voltech_tasa_bcv') || '{"tasa": 36.5}');
      
      if (!sttngs.tienda || Object.keys(sttngs.tienda).length === 0) {
        sttngs = { 
          pagos: settingsLocales.pagos || {}, 
          carteras: settingsLocales.carteras || crt, 
          tienda: settingsLocales.tienda || {}, 
          tasaBCV: tasaLocales.tasa || 36.5 
        };
      } else {
        if (!sttngs.carteras || sttngs.carteras.length === 0) {
          sttngs.carteras = settingsLocales.carteras || crt;
        }
      }

      if (esVendedor && usuarioActual?.nombre) {
        vts = vts.filter(v => v.vendedor?.toLowerCase() === usuarioActual.nombre.toLowerCase());
      }

      setVentas(vts);
      setProductos(prods);
      setClientes(clts);
      setEquipo(eqp);
      setCarteras(sttngs.carteras || []);
      setSettings(sttngs);
      setCupones(cpons);
      setKits(kts);
    };
    cargarDatos();
  }, [esVendedor, usuarioActual]);

  const tasaBCV = settings.tasaBCV || 36.5;
  const vendedores = equipo.filter(m => m.activo && (m.rol === 'vendedor' || m.rol === 'admin' || m.rol === 'Admin'));
  const productosDisponibles = productos.filter(p => p.cantidad > 0);
  const kitsDisponibles = kits.filter(k => k.activo !== false);

  const metodosPagoActivos = Object.entries(settings.pagos || {}).filter(([_, val]) => val && (val.activo === true || val === true));
  const carterasActivas = (settings.carteras || []).filter(c => c && c.activo === true);

  const clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()) || (c.telefono || '').includes(clienteSearch)
  );

  const handleClienteChange = (value) => {
    setClienteSearch(value);
    setFormData({ ...formData, cliente: value });
    const clienteEncontrado = clientes.find(c => c.nombre.toLowerCase() === value.toLowerCase() || c.telefono === value);
    if (clienteEncontrado) {
      setFormData(prev => ({ ...prev, cliente: clienteEncontrado.nombre, telefono: clienteEncontrado.telefono || prev.telefono }));
    }
  };

  // ✅ FILTRADO RELACIONAL: Producto, Marca, Categoría
  const actualizarCampoProducto = (index, field, value) => {
    const nuevosProductos = [...formData.productos];
    nuevosProductos[index][field] = value;
    
    if (field === 'productoId') {
      const producto = productos.find(p => String(p.id) === String(value));
      if (producto) {
        nuevosProductos[index].sku = producto.sku || '';
        nuevosProductos[index].categoria = producto.categoria || '';
        nuevosProductos[index].marca = producto.marca || '';
        nuevosProductos[index].precioUnitario = producto.precioDetal || producto.precioMayor || 0;
        nuevosProductos[index].filtroCategoria = producto.categoria || '';
        nuevosProductos[index].filtroMarca = producto.marca || '';
      }
    } else if (field === 'filtroCategoria') {
      // Si selecciona Categoría: mostrar productos de esa categoría y marcas disponibles
      nuevosProductos[index].filtroMarca = '';
      nuevosProductos[index].productoId = '';
      nuevosProductos[index].sku = '';
      nuevosProductos[index].categoria = value;
      nuevosProductos[index].marca = '';
      nuevosProductos[index].precioUnitario = 0;
    } else if (field === 'filtroMarca') {
      // Si selecciona Marca: mostrar productos de esa marca y categorías disponibles
      nuevosProductos[index].productoId = '';
      nuevosProductos[index].sku = '';
      nuevosProductos[index].categoria = '';
      nuevosProductos[index].marca = value;
      nuevosProductos[index].precioUnitario = 0;
    }
    
    setFormData({ ...formData, productos: nuevosProductos });
  };

  // ✅ Obtener marcas disponibles según filtro
  const getMarcasDisponibles = (producto) => {
    if (producto.filtroCategoria) {
      // Si hay categoría filtrada, mostrar marcas de esa categoría
      return [...new Set(
        productosDisponibles
          .filter(p => p.categoria === producto.filtroCategoria)
          .map(p => p.marca)
          .filter(Boolean)
      )];
    }
    // Si no, mostrar todas las marcas
    return [...new Set(productosDisponibles.map(p => p.marca).filter(Boolean))];
  };

  // ✅ Obtener categorías disponibles según filtro
  const getCategoriasDisponibles = (producto) => {
    if (producto.filtroMarca) {
      // Si hay marca filtrada, mostrar categorías de esa marca
      return [...new Set(
        productosDisponibles
          .filter(p => p.marca === producto.filtroMarca)
          .map(p => p.categoria)
          .filter(Boolean)
      )];
    }
    // Si no, mostrar todas las categorías
    return [...new Set(productosDisponibles.map(p => p.categoria).filter(Boolean))];
  };

  // ✅ Obtener productos disponibles según filtros (intersección estricta)
  const getProductosDisponibles = (producto) => {
    return productosDisponibles.filter(p => {
      // Si hay filtro de categoría Y marca, aplicar intersección estricta
      if (producto.filtroCategoria && producto.filtroMarca) {
        return p.categoria === producto.filtroCategoria && p.marca === producto.filtroMarca;
      }
      // Si solo hay filtro de categoría
      if (producto.filtroCategoria) {
        return p.categoria === producto.filtroCategoria;
      }
      // Si solo hay filtro de marca
      if (producto.filtroMarca) {
        return p.marca === producto.filtroMarca;
      }
      // Si no hay filtros, mostrar todos
      return true;
    });
  };

  const agregarKitAVenta = (kit) => {
    const primerProductoVacio = formData.productos.findIndex(p => !p.productoId);
    
    if (primerProductoVacio !== -1) {
      const nuevosProductos = [...formData.productos];
      nuevosProductos[primerProductoVacio] = {
        productoId: kit.id,
        sku: kit.sku || `KIT-${kit.nombre?.substring(0, 3).toUpperCase()}`,
        categoria: 'KIT',
        marca: kit.marca || 'Voltech',
        cantidad: 1,
        precioUnitario: kit.precio_kit || kit.precioCombo || 0,
        esKit: true,
        productosIncluidos: kit.productos_incluidos || [],
        filtroCategoria: '',
        filtroMarca: ''
      };
      setFormData({ ...formData, productos: nuevosProductos });
    } else {
      setFormData({
        ...formData,
        productos: [...formData.productos, { 
          productoId: kit.id,
          sku: kit.sku || `KIT-${kit.nombre?.substring(0, 3).toUpperCase()}`,
          categoria: 'KIT',
          marca: kit.marca || 'Voltech',
          cantidad: 1,
          precioUnitario: kit.precio_kit || kit.precioCombo || 0,
          esKit: true,
          productosIncluidos: kit.productos_incluidos || [],
          filtroCategoria: '',
          filtroMarca: ''
        }]
      });
    }
    
    setShowKitSelector(false);
    toast.success(`Kit "${kit.nombre}" agregado`);
  };

  const agregarProductoAVenta = () => {
    setFormData({
      ...formData,
      productos: [...formData.productos, { 
        productoId: '', sku: '', categoria: '', marca: '', cantidad: 1, precioUnitario: 0,
        filtroCategoria: '', filtroMarca: '', esKit: false, productosIncluidos: []
      }]
    });
  };

  const eliminarProductoVenta = (index) => {
    if (formData.productos.length > 1) {
      const nuevosProductos = formData.productos.filter((_, i) => i !== index);
      setFormData({ ...formData, productos: nuevosProductos });
    } else {
      toast.error('Debe haber al menos un producto');
    }
  };

  const abrirModalProductoNuevo = (index) => {
    setProductoModalIndex(index);
    setNuevoProducto({ plataforma: '', categoria: '', marca: '', precioMayor: 0, precioDetal: 0, precioBs: 0, cantidad: 1, tipo: 'fisico', metodoPago: 'efectivo', cartera: '' });
    setShowProductoModal(true);
  };

  useEffect(() => {
    if (nuevoProducto.precioDetal > 0) {
      setNuevoProducto(prev => ({ ...prev, precioBs: parseFloat((prev.precioDetal * tasaBCV).toFixed(2)) }));
    }
  }, [nuevoProducto.precioDetal, tasaBCV]);

  const guardarProductoYRedirigir = async () => {
    if (!nuevoProducto.plataforma || !nuevoProducto.categoria || !nuevoProducto.marca) {
      toast.error('Completa los campos obligatorios (Producto, Categoría, Marca)');
      return;
    }

    const productoExistente = productos.find(p => 
      p.plataforma?.toLowerCase() === nuevoProducto.plataforma.toLowerCase() &&
      p.categoria?.toLowerCase() === nuevoProducto.categoria.toLowerCase() &&
      p.marca?.toLowerCase() === nuevoProducto.marca.toLowerCase()
    );

    let productoFinal;
    if (productoExistente) {
      productoFinal = {
        ...productoExistente,
        cantidad: productoExistente.cantidad + nuevoProducto.cantidad,
        precioDetal: nuevoProducto.precioDetal || productoExistente.precioDetal,
        precioMayor: nuevoProducto.precioMayor || productoExistente.precioMayor,
        precioBs: nuevoProducto.precioBs || productoExistente.precioBs,
      };
    } else {
      const sku = `${nuevoProducto.plataforma.substring(0, 3).toUpperCase()}-${nuevoProducto.categoria.substring(0, 3).toUpperCase()}-${String(productos.length + 1).padStart(3, '0')}`;
      productoFinal = {
        id: Date.now().toString(),
        tipo: nuevoProducto.tipo, plataforma: nuevoProducto.plataforma, producto: nuevoProducto.plataforma,
        categoria: nuevoProducto.categoria, marca: nuevoProducto.marca, precioDetal: nuevoProducto.precioDetal,
        precioMayor: nuevoProducto.precioMayor, precioBs: nuevoProducto.precioBs, cantidad: nuevoProducto.cantidad,
        sku, publicado: false, estado: 'nuevo', fechaCreacion: new Date().toISOString(), fecha: new Date().toISOString().split('T')[0],
      };
    }

    if (supabase) {
      const { error } = await supabase.from('productos').upsert(productoFinal, { onConflict: 'id' });
      if (error) toast.error('Error al guardar en la nube: ' + error.message);
    }

    const productosActualizados = productoExistente 
      ? productos.map(p => String(p.id) === String(productoExistente.id) ? productoFinal : p)
      : [...productos, productoFinal];

    setProductos(productosActualizados);
    localStorage.setItem('voltech_productos', JSON.stringify(productosActualizados));
    
    if (productoModalIndex !== null) {
      actualizarCampoProducto(productoModalIndex, 'productoId', productoFinal.id);
    }
    
    setShowProductoModal(false);
    toast.success('Producto creado. Redirigiendo...');
    setTimeout(() => router.push('/panel/productos'), 1000);
  };

  const validarYAplicarCupon = () => {
    setErrorCupon('');
    setCuponAplicado(null);
    
    if (!cuponInput.trim()) return;

    const cupon = cupones.find(c => c.codigo.toUpperCase() === cuponInput.trim().toUpperCase() && c.estado === 'activo');
    
    if (!cupon) {
      setErrorCupon('Cupón no encontrado o inactivo');
      return;
    }

    const ahora = new Date();
    if (cupon.fecha_inicio && new Date(cupon.fecha_inicio) > ahora) {
      setErrorCupon('Este cupón aún no está activo');
      return;
    }
    if (cupon.fecha_vencimiento && new Date(cupon.fecha_vencimiento) < ahora) {
      setErrorCupon('Este cupón ha expirado');
      return;
    }

    if (cupon.limite_usos === 'limitado' && (cupon.usos || 0) >= (cupon.max_usos || 0)) {
      setErrorCupon('Este cupón ha alcanzado su límite de usos');
      return;
    }

    const productosEnVenta = formData.productos.map(p => p.productoId);
    let productosAplicables = [];

    if (cupon.tipo_aplicacion === 'todos') {
      productosAplicables = productosEnVenta;
    } else if (cupon.tipo_aplicacion === 'producto_especifico' || cupon.tipo_aplicacion === 'varios_productos' || cupon.tipo_aplicacion === 'producto_gratis') {
      const idsCupon = cupon.producto_ids || cupon.productos_especificos || [];
      productosAplicables = productosEnVenta.filter(id => idsCupon.includes(id));
    }

    if (productosAplicables.length === 0) {
      setErrorCupon('Este cupón no aplica a los productos en esta venta');
      return;
    }

    let descuento = 0;
    const subtotalAplicable = formData.productos
      .filter(p => productosAplicables.includes(p.productoId))
      .reduce((acc, p) => acc + (p.cantidad * p.precioUnitario), 0);

    if (cupon.tipo_descuento === 'gratis' || cupon.es_gratis) {
      descuento = subtotalAplicable;
    } else if (cupon.tipo_descuento === 'porcentaje') {
      descuento = subtotalAplicable * ((cupon.valor_descuento || cupon.valor || 0) / 100);
    } else if (cupon.tipo_descuento === 'monto_fijo') {
      descuento = Math.min(cupon.valor_descuento || cupon.valor || 0, subtotalAplicable);
    }

    setCuponAplicado({ ...cupon, descuentoCalculado: descuento });
  };

  const subtotal = formData.productos.reduce((acc, p) => acc + (p.cantidad * p.precioUnitario), 0);
  const descuentoAplicado = cuponAplicado ? cuponAplicado.descuentoCalculado : 0;
  const totalVenta = subtotal + (formData.delivery ? formData.montoDelivery : 0) - descuentoAplicado;
  const montoPendiente = formData.enCuotas ? totalVenta - formData.montoAbonado : 0;

  const registrarVenta = async () => {
    if (!formData.cliente || !formData.telefono || formData.productos.some(p => !p.productoId)) {
      toast.error('Completa los campos obligatorios (Cliente, Teléfono, Productos)');
      return;
    }

    // ✅ VALIDAR STOCK - Including kits
    for (const prod of formData.productos) {
      if (prod.esKit) {
        // Validar stock de cada producto en el kit
        for (const prodKit of prod.productosIncluidos || []) {
          const productoBase = productos.find(p => String(p.id) === String(prodKit.producto_id));
          const cantidadNecesaria = productoBase ? productoBase.cantidad * prod.cantidad : 0;
          if (!productoBase || productoBase.cantidad < prodKit.cantidad * prod.cantidad) {
            toast.error(`Stock insuficiente para ${productoBase?.plataforma || 'producto'} en el kit`);
            return;
          }
        }
      } else {
        const producto = productos.find(p => String(p.id) === String(prod.productoId));
        if (!producto || producto.cantidad < prod.cantidad) {
          toast.error(`Stock insuficiente para ${producto?.plataforma || 'producto'}`);
          return;
        }
      }
    }

    const clienteExistente = clientes.find(c => c.nombre.toLowerCase() === formData.cliente.toLowerCase() || c.telefono === formData.telefono);
    let clientesActualizados = [...clientes];
    const nuevoCliente = clienteExistente ? 
      { ...clienteExistente, nombre: formData.cliente, telefono: formData.telefono, ultimaCompra: new Date().toISOString() } :
      { id: Date.now().toString(), nombre: formData.cliente, telefono: formData.telefono, email: '', fechaRegistro: new Date().toISOString(), ultimaCompra: new Date().toISOString(), totalCompras: 0 };

    if (clienteExistente) {
      clientesActualizados = clientes.map(c => String(c.id) === String(clienteExistente.id) ? nuevoCliente : c);
    } else {
      clientesActualizados.push(nuevoCliente);
    }

    const nuevaVenta = {
      id: editingId || Date.now().toString(),
      numeroOrden: formData.numeroOrden || generarNumeroOrden(),
      fecha: formData.fecha, vendedor: formData.vendedor, cliente: formData.cliente, telefono: formData.telefono,
      productos: formData.productos.map(p => {
        const producto = productos.find(prod => String(prod.id) === String(p.productoId));
        return {
          productoId: p.productoId, sku: p.sku, nombre: producto?.plataforma || producto?.producto || 'Producto',
          categoria: p.categoria, marca: p.marca, cantidad: p.cantidad, precioUnitario: p.precioUnitario,
          total: p.cantidad * p.precioUnitario, tipo: producto?.tipo || 'fisico',
          esKit: p.esKit || false,
          productosIncluidos: p.productosIncluidos || []
        };
      }),
      subtotal, 
      delivery: formData.delivery, 
      montoDelivery: formData.delivery ? formData.montoDelivery : 0,
      cupon_aplicado: cuponAplicado ? cuponAplicado.codigo : null,
      descuento_aplicado: descuentoAplicado,
      total_con_descuento: totalVenta,
      total: totalVenta, 
      enCuotas: formData.enCuotas, 
      montoAbonado: formData.enCuotas ? formData.montoAbonado : totalVenta,
      montoPendiente: montoPendiente, 
      fechaPago: formData.fechaPago, 
      metodoPago: formData.metodoPago,
      carteraId: formData.carteraId, 
      referencia: formData.referencia,
      estado: formData.enCuotas && montoPendiente > 0 ? 'pendiente' : 'pagado',
      fechaRegistro: new Date().toISOString(),
    };

    // ✅ ACTUALIZAR INVENTARIO - Including kits
    let productosActualizados = [...productos];
    
    for (const prod of formData.productos) {
      if (prod.esKit && prod.productosIncluidos && prod.productosIncluidos.length > 0) {
        // Descontar cada producto individual del kit
        for (const prodKit of prod.productosIncluidos) {
          const index = productosActualizados.findIndex(p => String(p.id) === String(prodKit.producto_id));
          if (index !== -1) {
            productosActualizados[index] = {
              ...productosActualizados[index],
              cantidad: productosActualizados[index].cantidad - (prodKit.cantidad * prod.cantidad)
            };
          }
        }
      } else {
        // Producto normal
        const index = productosActualizados.findIndex(p => String(p.id) === String(prod.productoId));
        if (index !== -1) {
          productosActualizados[index] = {
            ...productosActualizados[index],
            cantidad: productosActualizados[index].cantidad - prod.cantidad
          };
        }
      }
    }

    const ventasActualizadas = editingId 
      ? ventas.map(v => String(v.id) === String(editingId) ? nuevaVenta : v)
      : [nuevaVenta, ...ventas];

    let cuponesActualizados = [...cupones];
    if (supabase && cuponAplicado) {
      await supabase.from('ventas').upsert(nuevaVenta, { onConflict: 'id' });
      await supabase.from('clientes').upsert(nuevoCliente, { onConflict: 'id' });
      
      // Actualizar inventario en Supabase
      for (const prodActualizado of productosActualizados) {
        await supabase.from('productos').update({ cantidad: prodActualizado.cantidad }).eq('id', prodActualizado.id);
      }
      
      await supabase.from('cupones').update({ 
        usos: (cuponAplicado.usos || 0) + 1,
        descuento_total: (cuponAplicado.descuento_total || 0) + descuentoAplicado
      }).eq('id', cuponAplicado.id);
    }

    if (cuponAplicado) {
      cuponesActualizados = cupones.map(c => 
        c.id === cuponAplicado.id 
          ? { ...c, usos: (c.usos || 0) + 1, descuento_total: (c.descuento_total || 0) + descuentoAplicado }
          : c
      );
      setCupones(cuponesActualizados);
      localStorage.setItem('voltech_cupones', JSON.stringify(cuponesActualizados));
    }

    setVentas(ventasActualizadas); 
    setProductos(productosActualizados); 
    setClientes(clientesActualizados);
    localStorage.setItem('voltech_ventas', JSON.stringify(ventasActualizadas));
    localStorage.setItem('voltech_productos', JSON.stringify(productosActualizados));
    localStorage.setItem('voltech_clientes', JSON.stringify(clientesActualizados));

    toast.success(editingId ? 'Venta actualizada correctamente' : 'Venta registrada exitosamente');
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      numeroOrden: generarNumeroOrden(), fecha: new Date().toISOString().split('T')[0],
      vendedor: esVendedor ? (usuarioActual?.nombre || '') : '',
      cliente: '', telefono: '',
      productos: [{ 
        productoId: '', sku: '', categoria: '', marca: '', cantidad: 1, precioUnitario: 0,
        filtroCategoria: '', filtroMarca: '', esKit: false, productosIncluidos: []
      }],
      delivery: false, montoDelivery: 0, enCuotas: false, montoAbonado: 0, fechaPago: '',
      metodoPago: 'efectivo', carteraId: '', referencia: '',
    });
    setClienteSearch(''); 
    setCuponInput('');
    setCuponAplicado(null);
    setErrorCupon('');
    setShowForm(false); 
    setEditingId(null);
    setShowKitSelector(false);
  };

  const marcarPagado = async (venta) => {
    const ventaActualizada = { ...venta, estado: 'pagado', montoPendiente: 0, montoAbonado: venta.total, fechaPago: new Date().toISOString().split('T')[0] };
    const ventasActualizadas = ventas.map(v => String(v.id) === String(venta.id) ? ventaActualizada : v);
    if (supabase) {
      await supabase.from('ventas').update({ estado: 'pagado', montoPendiente: 0, montoAbonado: venta.total, fechaPago: ventaActualizada.fechaPago }).eq('id', venta.id);
    }
    setVentas(ventasActualizadas);
    localStorage.setItem('voltech_ventas', JSON.stringify(ventasActualizadas));
    toast.success('Venta marcada como pagada');
  };

  const eliminarVenta = async (venta) => {
    if (!confirm('¿Estás seguro de eliminar esta venta? El stock será devuelto.')) return;
    
    let productosActualizados = [...productos];
    
    // Devolver stock de kits y productos normales
    for (const prod of venta.productos) {
      if (prod.esKit && prod.productosIncluidos && prod.productosIncluidos.length > 0) {
        // Devolver cada producto del kit
        for (const prodKit of prod.productosIncluidos) {
          const index = productosActualizados.findIndex(p => String(p.id) === String(prodKit.producto_id));
          if (index !== -1) {
            productosActualizados[index] = {
              ...productosActualizados[index],
              cantidad: productosActualizados[index].cantidad + (prodKit.cantidad * prod.cantidad)
            };
          }
        }
      } else {
        // Producto normal
        const index = productosActualizados.findIndex(p => String(p.id) === String(prod.productoId));
        if (index !== -1) {
          productosActualizados[index] = {
            ...productosActualizados[index],
            cantidad: productosActualizados[index].cantidad + prod.cantidad
          };
        }
      }
    }
    
    const ventasActualizadas = ventas.filter(v => String(v.id) !== String(venta.id));
    if (supabase) {
      await supabase.from('ventas').delete().eq('id', venta.id);
      for (const p of productosActualizados) await supabase.from('productos').update({ cantidad: p.cantidad }).eq('id', p.id);
    }
    setVentas(ventasActualizadas); setProductos(productosActualizados);
    localStorage.setItem('voltech_ventas', JSON.stringify(ventasActualizadas));
    localStorage.setItem('voltech_productos', JSON.stringify(productosActualizados));
    toast.success('Venta eliminada y stock devuelto');
  };

  const editarVenta = (venta) => {
    setEditingId(venta.id);
    setFormData({
      numeroOrden: venta.numeroOrden || generarNumeroOrden(), fecha: venta.fecha, vendedor: venta.vendedor,
      cliente: venta.cliente, telefono: venta.telefono,
      productos: venta.productos.map(p => ({ 
        productoId: p.productoId, sku: p.sku || '', categoria: p.categoria || '', marca: p.marca || '', 
        cantidad: p.cantidad, precioUnitario: p.precioUnitario, filtroCategoria: '', filtroMarca: '',
        esKit: p.esKit || false,
        productosIncluidos: p.productosIncluidos || []
      })),
      delivery: venta.delivery, montoDelivery: venta.montoDelivery, enCuotas: venta.enCuotas, montoAbonado: venta.montoAbonado,
      fechaPago: venta.fechaPago || '', metodoPago: venta.metodoPago, carteraId: venta.carteraId, referencia: venta.referencia,
    });
    setClienteSearch(venta.cliente); 
    setCuponInput(venta.cupon_aplicado || '');
    setShowForm(true);
  };

  const generarPDF = (venta) => {
    const doc = new jsPDF();
    const tienda = settings.tienda || { 
      nombre: 'VOLTECHSTORE.VE', 
      direccion: 'Caracas, Venezuela', 
      telefono: '04125378515', 
      instagram: '@VoltechStore.ve' 
    };

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(tienda.nombre.toUpperCase(), 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("TECNOLOGÍA A TU ALCANCE", 105, 20, { align: 'center' });
    doc.text(`${tienda.direccion} | Instagram: ${tienda.instagram} | WhatsApp: ${tienda.telefono}`, 105, 25, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("NOTA DE ENTREGA Y GARANTÍA", 105, 35, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let y = 45;
    
    doc.text(`N° ORDEN: #${venta.numeroOrden || 'N/A'}`, 14, y);
    doc.text(`CLIENTE: ${venta.cliente}`, 14, y + 6);
    doc.text(`TELÉFONO: ${venta.telefono}`, 14, y + 12);
    
    doc.text(`FECHA: ${venta.fecha}`, 140, y);
    doc.text(`VENDEDOR: ${venta.vendedor || 'N/A'}`, 140, y + 6);
    doc.text(`MÉTODO DE PAGO: ${(venta.metodoPago || 'N/A').replace('_', ' ').toUpperCase()}`, 140, y + 12);

    y += 20;

    const tableData = venta.productos.map(p => [
      `${p.nombre}${p.esKit ? ' (KIT)' : ''}`,
      p.cantidad.toString(),
      `$${p.precioUnitario.toFixed(2)}`,
      `$${p.total.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: y,
      head: [['DESCRIPCIÓN DEL PRODUCTO', 'CANT.', 'PRECIO U.', 'TOTAL']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 30, 46], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' }
      }
    });

    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : y + (tableData.length * 10) + 20;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    
    if (venta.descuento_aplicado > 0) {
      doc.text(`SUBTOTAL: $${venta.subtotal.toFixed(2)}`, 195, finalY, { align: 'right' });
      doc.setFontSize(10);
      doc.setTextColor(34, 197, 94);
      doc.text(`DESCUENTO: -$${venta.descuento_aplicado.toFixed(2)}`, 195, finalY + 6, { align: 'right' });
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`TOTAL: $${venta.total.toFixed(2)}`, 195, finalY + 12, { align: 'right' });
      finalY += 12;
    } else {
      doc.text(`TOTAL GENERAL: $${venta.total.toFixed(2)}`, 195, finalY, { align: 'right' });
    }
    
    if (venta.montoPendiente > 0) {
      doc.setFontSize(10);
      doc.setTextColor(220, 38, 38);
      doc.text(`PENDIENTE: $${venta.montoPendiente.toFixed(2)}`, 195, finalY + 6, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    }

    finalY += 15;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("POLÍTICAS DE VENTA Y GARANTÍA", 105, finalY, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const politicas = [
      "1. POLÍTICA DE PAGO ANTICIPADO: Para garantizar la disponibilidad de inventario y el procesamiento logístico con nuestros proveedores, todo despacho se gestionará exclusivamente previa recepción y conciliación del pago total.",
      "2. PRESENTACIÓN: Es obligatorio presentar este comprobante para cualquier reclamo.",
      "3. TIEMPO DE GARANTÍA: El producto tiene una garantía de 3 días continuos.",
      "4. EXCLUSIONES: No cubre daños físicos, humedad, sobrecargas o sellos removidos.",
      "5. EMPAQUE: Es obligatorio conservar la caja y accesorios originales en buen estado.",
      "6. GESTIÓN DE CAMBIOS: Sujeto a revisión técnica(24-48h). Es condición indispensable la entrega del producto defectuoso en su empaque original; no se entregará un reemplazo sin la verificación previa del equipo anterior.",
      "7. REEMBOLSOS Y CONFORMIDAD: Al recibir, el cliente acepta el estado del producto. Bajo ninguna circunstancia se realizará la devolución de dinero; se procederá exclusivamente al cambio por un producto igual o de similares características."
    ];

    let polY = finalY + 8;
    politicas.forEach(p => {
      const splitText = doc.splitTextToSize(p, 180);
      doc.text(splitText, 15, polY);
      polY += (splitText.length * 4) + 2;
    });

    doc.save(`Nota_Entrega_${venta.numeroOrden || 'Venta'}.pdf`);
    toast.success('PDF generado correctamente');
  };

  const calcularDiasAtraso = (venta) => {
    if (venta.estado !== 'pendiente' || !venta.fechaPago) return 0;
    return Math.floor((new Date() - new Date(venta.fechaPago)) / (1000 * 60 * 60 * 24));
  };

  const enviarWhatsapp = (venta) => {
    const totalBs = (venta.total * tasaBCV).toFixed(2);
    const productosTexto = venta.productos.map(p => `• ${p.nombre}${p.esKit ? ' (KIT)' : ''} x${p.cantidad} = $${p.total.toFixed(2)}`).join('\n');
    const mensaje = whatsappMode === 'gracias' 
      ? `Gracias por su compra ️\n\nRecuerda guardar nuestro WhatsApp así como seguirnos en las redes sociales para mantenerte al día sobre nuestros productos \n\n Instagram @Voltechstore.ve\n Titok @Voltechstore.ve\n\nNuestro Catálogo 👇\n${settings.tienda?.urlCatalogo || 'https://voltechstore.ve'}\n\nPor cada cliente que refieras tendrás descuentos exclusivos\n\n${productosTexto}\n\n Total: $${venta.total.toFixed(2)} (Bs ${totalBs})\n\n¡Gracias por tu compra!\n${settings.tienda?.nombre || 'VOLTECH STORE'}`
      : `¡Buen día, ${venta.cliente}!\n\nTe escribimos de parte de *${settings.tienda?.nombre || 'Voltechstore.ve'}* para recordarte que tu tienes un pago pendiente del producto \n\n${productosTexto}\nMonto: $${venta.montoPendiente.toFixed(2)}\n\nSi ya realizaste tu pago, ignora este mensaje y ¡gracias por tu puntualidad!\n\nQue tengas un excelente día,\nEl equipo de ${settings.tienda?.nombre || 'voltechstore.ve'}\n\n📸 Instagram @Voltechstore.ve\n🎵 Titok @Voltechstore.ve\n\nNuestro Catálogo 👇\n${settings.tienda?.urlCatalogo || 'https://voltechstore.ve'}\n\nPor cada cliente que refieras tendrás descuentos exclusivos`;
    const telefonoLimpio = venta.telefono.replace(/\D/g, '');
    window.open(`https://wa.me/58${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
    setShowWhatsappModal(null);
  };

  const ventasHoy = ventas.filter(v => v.fecha === new Date().toISOString().split('T')[0]);
  const totalIngresosHoy = ventasHoy.reduce((acc, v) => acc + v.montoAbonado, 0);
  const totalPendiente = ventas.reduce((acc, v) => acc + v.montoPendiente, 0);
  const totalProductosVendidos = ventas.reduce((acc, v) => acc + v.productos.reduce((a, p) => a + p.cantidad, 0), 0);
  const ventasFiltradas = ventas.filter(v => v.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || v.productos.some(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div className="space-y-6">
      <Toaster position="top-right" toastOptions={{ style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' }, success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } }, error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } } }} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ventas de Productos</h1>
          <p className="text-sm text-voltech-muted mt-1">{esVendedor ? 'Registra y gestiona tus ventas personales' : 'Registra ventas y descuenta inventario automáticamente'}</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Venta
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-voltech-cyan" />{editingId ? 'Editar Venta' : 'Registrar Nueva Venta'}</h3>
                <button onClick={resetForm} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-voltech-cyan mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Datos Generales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">N° Orden</label><input type="text" value={formData.numeroOrden} readOnly className="input-voltech w-full rounded-lg px-4 py-2 text-sm font-mono text-voltech-cyan bg-voltech-dark/50" /></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Fecha *</label><input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Vendedor *</label>
                    <select value={formData.vendedor} onChange={(e) => setFormData({ ...formData, vendedor: e.target.value })} disabled={esVendedor} className={`input-voltech w-full rounded-lg px-4 py-2 text-sm ${esVendedor ? 'bg-voltech-dark/50 cursor-not-allowed' : ''}`}>
                      <option value="">-- Selecciona --</option>
                      {vendedores.map(v => (<option key={v.id} value={v.nombre}>{v.nombre} ({v.rol})</option>))}
                    </select>
                  </div>
                  <div className="relative">
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Comprador *</label>
                    <input type="text" value={clienteSearch} onChange={(e) => handleClienteChange(e.target.value)} onFocus={() => setShowClientesDropdown(true)} onBlur={() => setTimeout(() => setShowClientesDropdown(false), 200)} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Buscar o escribir nombre..." />
                    {showClientesDropdown && clientesFiltrados.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-voltech-surface border border-voltech-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {clientesFiltrados.map(c => (<button key={c.id} onClick={() => { setClienteSearch(c.nombre); setFormData({ ...formData, cliente: c.nombre, telefono: c.telefono || '' }); setShowClientesDropdown(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-voltech-border flex items-center justify-between"><span>{c.nombre}</span><span className="text-xs text-voltech-muted">{c.telefono}</span></button>))}
                      </div>
                    )}
                  </div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Teléfono *</label><input type="tel" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="0412-1234567" /></div>
                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Método de Pago *</label>
                    <select value={formData.metodoPago} onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                      <option value="">-- Selecciona --</option>
                      {metodosPagoActivos.length > 0 ? metodosPagoActivos.map(([key, val]) => (<option key={key} value={key}>{val.nombre || key}</option>)) : <option disabled>No hay métodos configurados</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Cartera *</label>
                    <select value={formData.carteraId} onChange={(e) => setFormData({ ...formData, carteraId: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                      <option value="">-- Selecciona --</option>
                      {carterasActivas.length > 0 ? carterasActivas.map(c => (<option key={c.id} value={c.id}>{c.nombre}</option>)) : <option disabled>No hay carteras configuradas</option>}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-voltech-cyan flex items-center gap-2"><Package className="w-4 h-4" /> Productos</h4>
                  {kitsDisponibles.length > 0 && (
                    <button 
                      onClick={() => setShowKitSelector(!showKitSelector)}
                      className="px-3 py-1.5 bg-voltech-purple/20 text-voltech-purple rounded-lg text-xs hover:bg-voltech-purple/30 transition-colors flex items-center gap-1"
                    >
                      <Layers className="w-3 h-3" /> Agregar Kit
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {showKitSelector && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mb-4 bg-voltech-dark/50 border border-voltech-border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-bold text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-voltech-purple" />
                          Seleccionar Kit/Combo
                        </h5>
                        <button onClick={() => setShowKitSelector(false)} className="p-1 hover:bg-voltech-border rounded">
                          <X className="w-4 h-4 text-voltech-muted" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                        {kitsDisponibles.map(kit => (
                          <button
                            key={kit.id}
                            onClick={() => agregarKitAVenta(kit)}
                            className="p-3 bg-voltech-surface border border-voltech-border rounded-lg text-left hover:border-voltech-purple/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-bold text-white">{kit.nombre}</p>
                                <p className="text-xs text-voltech-muted">
                                  {kit.productos_incluidos?.length || 0} productos
                                </p>
                              </div>
                              <p className="text-sm font-bold text-voltech-success">
                                ${kit.precio_kit?.toFixed(2) || kit.precioCombo?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  {formData.productos.map((prod, index) => {
                    const marcasDisponibles = getMarcasDisponibles(prod);
                    const categoriasDisponibles = getCategoriasDisponibles(prod);
                    const productosParaSelect = getProductosDisponibles(prod);

                    return (
                      <div key={index} className={`bg-voltech-dark/50 border border-voltech-border rounded-lg p-4 ${prod.esKit ? 'border-voltech-purple/50 bg-voltech-purple/5' : ''}`}>
                        {prod.esKit && (
                          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-voltech-border">
                            <Layers className="w-4 h-4 text-voltech-purple" />
                            <span className="text-xs font-bold text-voltech-purple">KIT/COMBO</span>
                            {prod.productosIncluidos && prod.productosIncluidos.length > 0 && (
                              <span className="text-xs text-voltech-muted">
                                ({prod.productosIncluidos.length} productos incluidos)
                              </span>
                            )}
                          </div>
                        )}
                        <div className="grid grid-cols-12 gap-3 items-end">
                          <div className="col-span-12 md:col-span-2">
                            <label className="block text-xs text-voltech-muted mb-1 ml-1">SKU</label>
                            <input type="text" value={prod.sku} readOnly className="input-voltech w-full rounded-lg px-3 py-2 text-sm font-mono text-voltech-cyan bg-voltech-dark/50" placeholder="Auto" />
                          </div>

                          <div className="col-span-6 md:col-span-2">
                            <label className="block text-xs text-voltech-muted mb-1 ml-1">Filtrar Categoría</label>
                            <select
                              value={prod.filtroCategoria}
                              onChange={(e) => actualizarCampoProducto(index, 'filtroCategoria', e.target.value)}
                              className="input-voltech w-full rounded-lg px-3 py-2 text-sm"
                              disabled={prod.esKit}
                            >
                              <option value="">Todas</option>
                              {categoriasDisponibles.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>

                          <div className="col-span-6 md:col-span-2">
                            <label className="block text-xs text-voltech-muted mb-1 ml-1">Filtrar Marca</label>
                            <select
                              value={prod.filtroMarca}
                              onChange={(e) => actualizarCampoProducto(index, 'filtroMarca', e.target.value)}
                              className="input-voltech w-full rounded-lg px-3 py-2 text-sm"
                              disabled={prod.esKit}
                            >
                              <option value="">Todas</option>
                              {marcasDisponibles.map(marca => (
                                <option key={marca} value={marca}>{marca}</option>
                              ))}
                            </select>
                          </div>

                          <div className="col-span-12 md:col-span-4 relative">
                            <label className="block text-xs text-voltech-muted mb-1 ml-1">Producto *</label>
                            <div className="flex gap-2">
                              <select
                                value={prod.productoId}
                                onChange={(e) => actualizarCampoProducto(index, 'productoId', e.target.value)}
                                className="input-voltech flex-1 rounded-lg px-3 py-2 text-sm"
                                disabled={prod.esKit}
                              >
                                <option value="">-- Selecciona --</option>
                                {productosParaSelect.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.plataforma || p.producto} (Stock: {p.cantidad})
                                  </option>
                                ))}
                              </select>
                              {!prod.esKit && (
                                <button onClick={() => abrirModalProductoNuevo(index)} className="px-3 py-2 bg-voltech-purple/20 text-voltech-purple rounded-lg hover:bg-voltech-purple/30 transition-colors flex items-center gap-1" title="Crear nuevo"><Plus className="w-4 h-4" /></button>
                              )}
                            </div>
                          </div>

                          <div className="col-span-6 md:col-span-2">
                            <label className="block text-xs text-voltech-muted mb-1 ml-1">Categoría</label>
                            <input type="text" value={prod.categoria} readOnly className="input-voltech w-full rounded-lg px-3 py-2 text-sm bg-voltech-dark/50" placeholder="Auto" />
                          </div>
                          <div className="col-span-6 md:col-span-2">
                            <label className="block text-xs text-voltech-muted mb-1 ml-1">Marca</label>
                            <input type="text" value={prod.marca} readOnly className="input-voltech w-full rounded-lg px-3 py-2 text-sm bg-voltech-dark/50" placeholder="Auto" />
                          </div>
                          <div className="col-span-4 md:col-span-1">
                            <label className="block text-xs text-voltech-muted mb-1 ml-1">Cant.</label>
                            <input type="number" min="1" value={prod.cantidad} onChange={(e) => actualizarCampoProducto(index, 'cantidad', Number(e.target.value))} className="input-voltech w-full rounded-lg px-3 py-2 text-sm" />
                          </div>
                          <div className="col-span-4 md:col-span-1">
                            <label className="block text-xs text-voltech-muted mb-1 ml-1">P. Unit ($)</label>
                            <input type="number" step="0.01" value={prod.precioUnitario} onChange={(e) => actualizarCampoProducto(index, 'precioUnitario', Number(e.target.value))} className="input-voltech w-full rounded-lg px-3 py-2 text-sm" />
                          </div>
                          <div className="col-span-3 md:col-span-1">
                            <label className="block text-xs text-voltech-muted mb-1 ml-1">Total</label>
                            <div className="bg-voltech-dark border border-voltech-border rounded-lg px-3 py-2 text-sm font-bold text-voltech-success">${(prod.cantidad * prod.precioUnitario).toFixed(2)}</div>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            {formData.productos.length > 1 && (<button onClick={() => eliminarProductoVenta(index)} className="p-2 text-voltech-error hover:bg-voltech-error/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={agregarProductoAVenta} className="mt-3 px-4 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-cyan transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Agregar otro producto</button>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-voltech-cyan mb-3 flex items-center gap-2"><Tag className="w-4 h-4" /> Cupón de Descuento</h4>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={cuponInput} 
                    onChange={(e) => { setCuponInput(e.target.value.toUpperCase()); setErrorCupon(''); setCuponAplicado(null); }}
                    placeholder="Ingresa el código del cupón"
                    className="input-voltech flex-1 rounded-lg px-4 py-2 text-sm uppercase"
                    disabled={!!cuponAplicado}
                  />
                  <button 
                    onClick={validarYAplicarCupon}
                    disabled={!!cuponAplicado}
                    className="px-4 py-2 bg-voltech-purple/20 text-voltech-purple rounded-lg hover:bg-voltech-purple/30 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    Aplicar
                  </button>
                  {cuponAplicado && (
                    <button 
                      onClick={() => { setCuponInput(''); setCuponAplicado(null); setErrorCupon(''); }}
                      className="px-4 py-2 bg-voltech-error/20 text-voltech-error rounded-lg hover:bg-voltech-error/30 transition-colors text-sm"
                      title="Quitar cupón"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {errorCupon && <p className="text-xs text-voltech-error mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {errorCupon}</p>}
                {cuponAplicado && (
                  <p className="text-xs text-voltech-success mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> 
                    Cupón "{cuponAplicado.codigo}" aplicado: -$ {cuponAplicado.descuentoCalculado.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                  <label className="flex items-center gap-2 cursor-pointer mb-3"><input type="checkbox" checked={formData.delivery} onChange={(e) => setFormData({ ...formData, delivery: e.target.checked })} className="w-4 h-4 rounded border-voltech-border bg-voltech-dark text-voltech-cyan" /><Truck className="w-4 h-4 text-voltech-warning" /><span className="text-sm text-white">Incluir Delivery</span></label>
                  {formData.delivery && (<div><label className="block text-xs text-voltech-muted mb-1">Monto Delivery ($)</label><input type="number" step="0.01" value={formData.montoDelivery} onChange={(e) => setFormData({ ...formData, montoDelivery: Number(e.target.value) })} className="input-voltech w-full rounded-lg px-3 py-2 text-sm" /></div>)}
                </div>
                <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                  <label className="flex items-center gap-2 cursor-pointer mb-3"><input type="checkbox" checked={formData.enCuotas} onChange={(e) => setFormData({ ...formData, enCuotas: e.target.checked })} className="w-4 h-4 rounded border-voltech-border bg-voltech-dark text-voltech-cyan" /><CreditCard className="w-4 h-4 text-voltech-purple" /><span className="text-sm text-white">Pago en Cuotas</span></label>
                  {formData.enCuotas && (<div className="grid grid-cols-2 gap-2"><div><label className="block text-xs text-voltech-muted mb-1">Abonado ($)</label><input type="number" step="0.01" value={formData.montoAbonado} onChange={(e) => setFormData({ ...formData, montoAbonado: Number(e.target.value) })} className="input-voltech w-full rounded-lg px-3 py-2 text-sm" /></div><div><label className="block text-xs text-voltech-muted mb-1">Próx. Pago</label><input type="date" value={formData.fechaPago} onChange={(e) => setFormData({ ...formData, fechaPago: e.target.value })} className="input-voltech w-full rounded-lg px-3 py-2 text-sm" /></div></div>)}
                </div>
              </div>

              <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div><p className="text-xs text-voltech-muted">Subtotal</p><p className="text-xl font-bold text-white">${subtotal.toFixed(2)}</p></div>
                  <div><p className="text-xs text-voltech-muted">Descuento</p><p className="text-xl font-bold text-voltech-success">-${descuentoAplicado.toFixed(2)}</p></div>
                  <div><p className="text-xs text-voltech-muted">Total Venta</p><p className="text-2xl font-bold text-voltech-success">${totalVenta.toFixed(2)}</p></div>
                  <div><p className="text-xs text-voltech-muted">Pendiente</p><p className="text-xl font-bold text-voltech-error">${montoPendiente.toFixed(2)}</p></div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={registrarVenta} className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Save className="w-5 h-5" />{editingId ? 'Actualizar Venta' : 'Registrar Venta'}</button>
                <button onClick={resetForm} className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-error transition-all flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProductoModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-2xl w-full max-w-4xl my-8">
              <div className="border-b border-voltech-border p-4 flex items-center justify-between sticky top-0 bg-voltech-surface rounded-t-2xl z-10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-voltech-purple" /> Crear Nuevo Producto</h2>
                <button onClick={() => setShowProductoModal(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">SKU (automático)</label><input type="text" value={`${nuevoProducto.plataforma.substring(0, 3).toUpperCase()}-${nuevoProducto.categoria.substring(0, 3).toUpperCase()}-${String(productos.length + 1).padStart(3, '0')}`} readOnly className="input-voltech w-full rounded-lg px-4 py-2 text-sm font-mono text-voltech-cyan bg-voltech-dark/50" /></div>
                  <div className="lg:col-span-2"><label className="block text-xs text-voltech-muted mb-1 ml-1">Plataforma / Producto *</label><input type="text" value={nuevoProducto.plataforma} onChange={(e) => setNuevoProducto({ ...nuevoProducto, plataforma: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Ej: Audífonos JBL" /></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Categoría *</label><input type="text" value={nuevoProducto.categoria} onChange={(e) => setNuevoProducto({ ...nuevoProducto, categoria: e.target.value.toUpperCase() })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Ej: STREAMING" /></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Fecha</label><input type="date" value={new Date().toISOString().split('T')[0]} readOnly className="input-voltech w-full rounded-lg px-4 py-2 text-sm bg-voltech-dark/50" /></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Comprador (Equipo)</label><select className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="">-- Selecciona --</option>{equipo.map(e => (<option key={e.id} value={e.nombre}>{e.nombre} ({e.rol})</option>))}</select></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Marca *</label><input type="text" value={nuevoProducto.marca} onChange={(e) => setNuevoProducto({ ...nuevoProducto, marca: e.target.value.toUpperCase() })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" placeholder="Ej: JBL" /></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Cantidad</label><input type="number" value={nuevoProducto.cantidad} onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad: Number(e.target.value) })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Moneda de compra</label><select value={nuevoProducto.tipo === 'bs' ? 'bs' : 'usd'} onChange={(e) => setNuevoProducto({ ...nuevoProducto, tipo: e.target.value === 'bs' ? 'bs' : 'fisico' })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="usd">Dólares ($)</option><option value="bs">Bolívares (Bs)</option></select></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Precio Mayor ($) <span className="text-voltech-warning">(Tu costo)</span></label><input type="number" step="0.01" value={nuevoProducto.precioMayor} onChange={(e) => setNuevoProducto({ ...nuevoProducto, precioMayor: Number(e.target.value) })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Precio Detal ($) <span className="text-voltech-success">(Venta al público)</span></label><input type="number" step="0.01" value={nuevoProducto.precioDetal} onChange={(e) => setNuevoProducto({ ...nuevoProducto, precioDetal: Number(e.target.value) })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Precio (Bs)</label><input type="number" step="0.01" value={nuevoProducto.precioBs} onChange={(e) => setNuevoProducto({ ...nuevoProducto, precioBs: Number(e.target.value) })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm" /></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Total</label><div className="bg-voltech-dark border border-voltech-border rounded-lg px-4 py-2 text-sm font-bold text-voltech-success">${(nuevoProducto.precioMayor * nuevoProducto.cantidad).toFixed(2)}</div></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Método de Pago</label><select value={nuevoProducto.metodoPago} onChange={(e) => setNuevoProducto({ ...nuevoProducto, metodoPago: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="efectivo">Efectivo</option><option value="pago_movil">Pago Móvil</option><option value="transferencia">Transferencia</option><option value="zelle">Zelle</option><option value="binance">Binance</option></select></div>
                  <div><label className="block text-xs text-voltech-muted mb-1 ml-1">Cartera</label><select value={nuevoProducto.cartera} onChange={(e) => setNuevoProducto({ ...nuevoProducto, cartera: e.target.value })} className="input-voltech w-full rounded-lg px-4 py-2 text-sm"><option value="">-- Selecciona --</option>{carteras.map(c => (<option key={c.id} value={c.nombre}>{c.nombre}</option>))}</select></div>
                </div>
                {nuevoProducto.precioMayor > 0 && nuevoProducto.precioDetal > 0 && (<div className="bg-voltech-success/10 border border-voltech-success/30 rounded-lg p-3 text-sm text-voltech-success">Ganancia por unidad: ${(nuevoProducto.precioDetal - nuevoProducto.precioMayor).toFixed(2)} ({((nuevoProducto.precioDetal - nuevoProducto.precioMayor) / nuevoProducto.precioMayor * 100).toFixed(0)}%)</div>)}
              </div>
              <div className="border-t border-voltech-border p-4 flex gap-3 sticky bottom-0 bg-voltech-surface rounded-b-2xl">
                <button onClick={guardarProductoYRedirigir} className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><ExternalLink className="w-4 h-4" /> Guardar y Abrir en Productos</button>
                <button onClick={() => setShowProductoModal(false)} className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-error transition-all flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-cyan/20"><ShoppingCart className="w-5 h-5 text-voltech-cyan" /></div>
            <div><p className="text-xs text-voltech-muted">Ventas Hoy</p><p className="text-xl font-bold text-white">{ventasHoy.length}</p></div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-success/20"><DollarSign className="w-5 h-5 text-voltech-success" /></div>
            <div><p className="text-xs text-voltech-muted">Ingresos Hoy</p><p className="text-xl font-bold text-white">${totalIngresosHoy.toFixed(2)}</p></div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-error/20"><TrendingUp className="w-5 h-5 text-voltech-error" /></div>
            <div><p className="text-xs text-voltech-muted">Por Cobrar</p><p className="text-xl font-bold text-white">${totalPendiente.toFixed(2)}</p></div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-warning/20"><Users className="w-5 h-5 text-voltech-warning" /></div>
            <div><p className="text-xs text-voltech-muted">Productos Vendidos</p><p className="text-xl font-bold text-white">{totalProductosVendidos}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-voltech-border flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-white">Historial de Ventas</h3>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
            <input type="text" placeholder="Buscar por cliente o producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-voltech w-full rounded-lg pl-10 pr-4 py-2 text-sm" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-voltech-dark border-b border-voltech-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">N° Orden</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Productos</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Fecha Pago</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Días Atraso</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Método de Pago</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Cartera</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.length === 0 ? (
                <tr><td colSpan="11" className="text-center py-12 text-voltech-muted"><ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No hay ventas registradas aún</p></td></tr>
              ) : (
                ventasFiltradas.map((venta) => (
                  <>
                    <tr key={venta.id} className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-voltech-cyan">{venta.numeroOrden || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-voltech-muted flex items-center gap-2"><Calendar className="w-3 h-3" /> {venta.fecha}</td>
                      <td className="px-4 py-3"><p className="text-sm font-medium text-white">{venta.cliente}</p><p className="text-xs text-voltech-muted">{venta.telefono}</p></td>
                      <td className="px-4 py-3"><p className="text-sm text-white">{venta.productos[0]?.nombre}{venta.productos[0]?.esKit && <span className="text-xs text-voltech-purple ml-1">(KIT)</span>}{venta.productos.length > 1 && (<span className="text-xs text-voltech-muted ml-1">(+{venta.productos.length - 1} más)</span>)}</p><button onClick={() => setExpandedId(expandedId === venta.id ? null : venta.id)} className="text-xs text-voltech-cyan hover:underline flex items-center gap-1 mt-1"><ChevronDown className={`w-3 h-3 transition-transform ${expandedId === venta.id ? 'rotate-180' : ''}`} /> Ver detalle</button></td>
                      <td className="px-4 py-3 text-sm font-bold text-voltech-success">${venta.total.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-voltech-muted">{venta.fechaPago || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-voltech-warning">{calcularDiasAtraso(venta) > 0 ? `+${calcularDiasAtraso(venta)}` : '0'}</td>
                      <td className="px-4 py-3 text-sm text-voltech-muted">{venta.metodoPago.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-sm text-voltech-muted">{venta.carteraId || 'N/A'}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${venta.estado === 'pagado' ? 'bg-voltech-success/20 text-voltech-success' : 'bg-voltech-warning/20 text-voltech-warning'}`}>{venta.estado === 'pagado' ? 'Pagado' : 'Pendiente'}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setShowWhatsappModal(venta); setWhatsappMode('gracias'); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-success transition-colors" title="Enviar mensaje de gracias"><MessageCircle className="w-4 h-4" /></button>
                          <button onClick={() => { setShowWhatsappModal(venta); setWhatsappMode('recordatorio'); }} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-warning transition-colors" title="Enviar recordatorio de pago"><AlertTriangle className="w-4 h-4" /></button>
                          <button onClick={() => generarPDF(venta)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-purple transition-colors" title="Generar PDF"><FileText className="w-4 h-4" /></button>
                          <button onClick={() => editarVenta(venta)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors" title="Editar"><Edit3 className="w-4 h-4" /></button>
                          {venta.estado !== 'pagado' && (<button onClick={() => marcarPagado(venta)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-success transition-colors" title="Marcar pagado"><CheckCircle className="w-4 h-4" /></button>)}
                          <button onClick={() => eliminarVenta(venta)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                    
                    {expandedId === venta.id && (
                      <tr className="bg-voltech-dark/30">
                        <td colSpan="11" className="px-4 py-4">
                          <div className="bg-voltech-surface border border-voltech-border rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                              <Package className="w-4 h-4 text-voltech-cyan" />
                              Detalle de Productos - Orden #{venta.numeroOrden}
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-voltech-dark border-b border-voltech-border">
                                  <tr>
                                    <th className="text-left px-3 py-2 text-xs text-voltech-muted">SKU</th>
                                    <th className="text-left px-3 py-2 text-xs text-voltech-muted">Producto</th>
                                    <th className="text-left px-3 py-2 text-xs text-voltech-muted">Categoría</th>
                                    <th className="text-left px-3 py-2 text-xs text-voltech-muted">Marca</th>
                                    <th className="text-center px-3 py-2 text-xs text-voltech-muted">Cant.</th>
                                    <th className="text-right px-3 py-2 text-xs text-voltech-muted">Precio Unit.</th>
                                    <th className="text-right px-3 py-2 text-xs text-voltech-muted">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {venta.productos.map((prod, idx) => (
                                    <tr key={idx} className={`border-b border-voltech-border last:border-0 ${prod.esKit ? 'bg-voltech-purple/5' : ''}`}>
                                      <td className="px-3 py-2 text-xs font-mono text-voltech-cyan">{prod.sku || 'N/A'}</td>
                                      <td className="px-3 py-2 text-white">
                                        {prod.nombre}
                                        {prod.esKit && <span className="ml-2 text-xs text-voltech-purple">(KIT)</span>}
                                      </td>
                                      <td className="px-3 py-2 text-voltech-muted">{prod.categoria || 'N/A'}</td>
                                      <td className="px-3 py-2 text-voltech-muted">{prod.marca || 'N/A'}</td>
                                      <td className="px-3 py-2 text-center text-white">{prod.cantidad}</td>
                                      <td className="px-3 py-2 text-right text-voltech-muted">${prod.precioUnitario?.toFixed(2)}</td>
                                      <td className="px-3 py-2 text-right font-semibold text-voltech-success">${prod.total?.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-voltech-dark/50">
                                  <tr>
                                    <td colSpan="6" className="px-3 py-2 text-right font-bold text-white">SUBTOTAL:</td>
                                    <td className="px-3 py-2 text-right font-bold text-voltech-cyan">${venta.subtotal?.toFixed(2)}</td>
                                  </tr>
                                  {venta.descuento_aplicado > 0 && (
                                    <tr>
                                      <td colSpan="6" className="px-3 py-2 text-right text-voltech-muted">Descuento:</td>
                                      <td className="px-3 py-2 text-right text-voltech-success">-${venta.descuento_aplicado?.toFixed(2)}</td>
                                    </tr>
                                  )}
                                  {venta.delivery && venta.montoDelivery > 0 && (
                                    <tr>
                                      <td colSpan="6" className="px-3 py-2 text-right text-voltech-muted">Delivery:</td>
                                      <td className="px-3 py-2 text-right text-voltech-warning">${venta.montoDelivery?.toFixed(2)}</td>
                                    </tr>
                                  )}
                                  <tr>
                                    <td colSpan="6" className="px-3 py-2 text-right font-bold text-lg text-white">TOTAL:</td>
                                    <td className="px-3 py-2 text-right font-bold text-lg text-voltech-success">${venta.total?.toFixed(2)}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-voltech-border">
                              <div>
                                <p className="text-xs text-voltech-muted mb-1">Método de Pago:</p>
                                <p className="text-sm text-white font-medium">{(venta.metodoPago || 'N/A').replace('_', ' ').toUpperCase()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-voltech-muted mb-1">Cartera:</p>
                                <p className="text-sm text-white font-medium">{venta.carteraId || 'N/A'}</p>
                              </div>
                              {venta.referencia && (
                                <div>
                                  <p className="text-xs text-voltech-muted mb-1">Referencia:</p>
                                  <p className="text-sm text-white font-medium">{venta.referencia}</p>
                                </div>
                              )}
                              {venta.enCuotas && (
                                <>
                                  <div>
                                    <p className="text-xs text-voltech-muted mb-1">Monto Abonado:</p>
                                    <p className="text-sm text-voltech-success font-medium">${venta.montoAbonado?.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-voltech-muted mb-1">Monto Pendiente:</p>
                                    <p className="text-sm text-voltech-error font-medium">${venta.montoPendiente?.toFixed(2)}</p>
                                  </div>
                                  {venta.fechaPago && (
                                    <div>
                                      <p className="text-xs text-voltech-muted mb-1">Próximo Pago:</p>
                                      <p className="text-sm text-white font-medium">{venta.fechaPago}</p>
                                    </div>
                                  )}
                                </>
                              )}
                              {venta.cupon_aplicado && (
                                <div className="md:col-span-2">
                                  <p className="text-xs text-voltech-muted mb-1">Cupón Aplicado:</p>
                                  <p className="text-sm text-voltech-purple font-medium flex items-center gap-1">
                                    <Tag className="w-3 h-3" /> {venta.cupon_aplicado} (-${venta.descuento_aplicado?.toFixed(2)})
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showWhatsappModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-voltech-surface border border-voltech-border rounded-2xl w-full max-w-md">
              <div className="border-b border-voltech-border p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><MessageCircle className="w-5 h-5 text-voltech-success" />{whatsappMode === 'gracias' ? 'Mensaje de Gracias' : 'Recordatorio de Pago'}</h2>
                <button onClick={() => setShowWhatsappModal(null)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <p className="text-sm text-voltech-muted mb-4">Se enviará un mensaje a <strong className="text-white">{showWhatsappModal.telefono}</strong> con el detalle de la venta.</p>
                <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-3 mb-4 max-h-48 overflow-y-auto">
                  <p className="text-xs text-white whitespace-pre-wrap">
                    {whatsappMode === 'gracias' ? `Gracias por su compra ️\n\nRecuerda guardar nuestro WhatsApp así como seguirnos en las redes sociales para mantenerte al día sobre nuestros productos \n\n📸 Instagram @Voltechstore.ve\n🎵 Titok @Voltechstore.ve\n\nNuestro Catálogo 👇\n${settings.tienda?.urlCatalogo || 'https://voltechstore.ve'}\n\nPor cada cliente que refieras tendrás descuentos exclusivos\n\n${showWhatsappModal.productos.map(p => `• ${p.nombre}${p.esKit ? ' (KIT)' : ''} x${p.cantidad} = $${p.total.toFixed(2)}`).join('\n')}\n\n Total: $${showWhatsappModal.total.toFixed(2)} (Bs ${(showWhatsappModal.total * tasaBCV).toFixed(2)})\n\n¡Gracias por tu compra!\n${settings.tienda?.nombre || 'VOLTECH STORE'}` : `¡Buen día, ${showWhatsappModal.cliente}!\n\nTe escribimos de parte de *${settings.tienda?.nombre || 'Voltechstore.ve'}* para recordarte que tu tienes un pago pendiente del producto \n\n${showWhatsappModal.productos.map(p => `• ${p.nombre}${p.esKit ? ' (KIT)' : ''} x${p.cantidad} = $${p.total.toFixed(2)}`).join('\n')}\nMonto: $${showWhatsappModal.montoPendiente.toFixed(2)}\n\nSi ya realizaste tu pago, ignora este mensaje y ¡gracias por tu puntualidad!\n\nQue tengas un excelente día,\nEl equipo de ${settings.tienda?.nombre || 'voltechstore.ve'}\n\n📸 Instagram @Voltechstore.ve\n Titok @Voltechstore.ve\n\nNuestro Catálogo 👇\n${settings.tienda?.urlCatalogo || 'https://voltechstore.ve'}\n\nPor cada cliente que refieras tendrás descuentos exclusivos`}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <button onClick={() => setWhatsappMode('gracias')} className={`px-3 py-1 text-sm rounded-lg ${whatsappMode === 'gracias' ? 'bg-voltech-success/20 text-voltech-success' : 'bg-voltech-dark/50 text-voltech-muted'}`}>Gracias por su compra</button>
                    <button onClick={() => setWhatsappMode('recordatorio')} className={`px-3 py-1 text-sm rounded-lg ${whatsappMode === 'recordatorio' ? 'bg-voltech-warning/20 text-voltech-warning' : 'bg-voltech-dark/50 text-voltech-muted'}`}>Recordatorio de pago</button>
                  </div>
                  <button onClick={() => enviarWhatsapp(showWhatsappModal)} className="px-4 py-2 bg-voltech-success/20 text-voltech-success rounded-lg hover:bg-voltech-success/30 transition-colors flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Enviar mensaje</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}