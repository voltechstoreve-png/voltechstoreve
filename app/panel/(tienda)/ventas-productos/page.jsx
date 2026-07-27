'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'default-no-store';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Plus, 
  X, 
  Save,
  Search,
  Calendar,
  CreditCard,
  Tag,
  MessageCircle,
  Edit3,
  Trash2,
  CheckCircle,
  Truck,
  ChevronDown,
  Package,
  ExternalLink,
  FileText,
  Bell,
  AlertTriangle,
  ArrowUpRight,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function VentasProductosPage() {
  const router = useRouter();
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [equipo, setEquipo] = useState([]);
  const [carteras, setCarteras] = useState([]);
  const [settings, setSettings] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showWhatsappModal, setShowWhatsappModal] = useState(null);
  const [whatsappMode, setWhatsappMode] = useState('gracias'); // ✅ NUEVO: Modo de WhatsApp
  const [editingId, setEditingId] = useState(null);
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [productoModalIndex, setProductoModalIndex] = useState(null);
  const [clienteSearch, setClienteSearch] = useState('');
  const [showClientesDropdown, setShowClientesDropdown] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(null); // ✅ NUEVO: Modal de referidos

  const [nuevoProducto, setNuevoProducto] = useState({
    plataforma: '',
    categoria: '',
    marca: '',
    precioMayor: 0,
    precioDetal: 0,
    precioBs: 0,
    cantidad: 1,
    tipo: 'fisico',
    metodoPago: 'efectivo',
    cartera: '',
  });

  // ✅ FUNCIÓN PARA GENERAR NÚMERO DE ORDEN (DD-MM-###)
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
      productoId: '',
      sku: '',
      categoria: '',
      marca: '',
      cantidad: 1,
      precioUnitario: 0,
    }],
    delivery: false,
    montoDelivery: 0,
    enCuotas: false,
    montoAbonado: 0,
    fechaPago: '',
    metodoPago: 'efectivo',
    carteraId: '',
    referencia: '',
  });

  useEffect(() => {
    const ventasGuardadas = localStorage.getItem('voltech_ventas');
    const productosGuardados = localStorage.getItem('voltech_productos');
    const clientesGuardados = localStorage.getItem('voltech_clientes');
    const equipoGuardado = localStorage.getItem('voltech_equipo');
    const carterasGuardadas = localStorage.getItem('voltech_carteras');
    const settingsGuardados = localStorage.getItem('voltech_settings');
    const tasaGuardada = localStorage.getItem('voltech_tasa_bcv');

    if (ventasGuardadas) setVentas(JSON.parse(ventasGuardadas));
    if (productosGuardados) setProductos(JSON.parse(productosGuardados));
    if (clientesGuardados) setClientes(JSON.parse(clientesGuardados));
    if (equipoGuardado) setEquipo(JSON.parse(equipoGuardado));
    if (carterasGuardadas) setCarteras(JSON.parse(carterasGuardadas));
    
    if (settingsGuardados) {
      const parsed = JSON.parse(settingsGuardados);
      setSettings({
        pagos: parsed.pagos || {},
        carteras: parsed.carteras || [],
        tienda: parsed.tienda || {},
        tasaBCV: parsed.tasaBCV || 36.5
      });
    }
    
    if (tasaGuardada) {
      const tasaData = JSON.parse(tasaGuardada);
      setSettings(prev => ({ ...prev, tasaBCV: tasaData.tasa || 36.5 }));
    }
  }, []);

  const tasaBCV = settings.tasaBCV || 36.5;
  const vendedores = equipo.filter(m => m.activo && (m.rol === 'vendedor' || m.rol === 'admin' || m.rol === 'Admin'));
  const productosDisponibles = productos.filter(p => p.cantidad > 0);

  // ✅ FILTRAR SOLO MÉTODOS DE PAGO Y CARTERAS ACTIVAS DESDE AJUSTES
  const metodosPagoActivos = Object.entries(settings.pagos || {}).filter(([_, val]) => val && val.activo);
  const carterasActivas = (settings.carteras || []).filter(c => c.activo);

  const clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()) ||
    (c.telefono || '').includes(clienteSearch)
  );

  const handleClienteChange = (value) => {
    setClienteSearch(value);
    setFormData({ ...formData, cliente: value });
    
    const clienteEncontrado = clientes.find(c => 
      c.nombre.toLowerCase() === value.toLowerCase() ||
      c.telefono === value
    );
    
    if (clienteEncontrado) {
      setFormData(prev => ({
        ...prev,
        cliente: clienteEncontrado.nombre,
        telefono: clienteEncontrado.telefono || prev.telefono,
      }));
    }
  };

  const actualizarProductoVenta = (index, field, value) => {
    const nuevosProductos = [...formData.productos];
    nuevosProductos[index][field] = value;
    
    if (field === 'productoId') {
      const producto = productos.find(p => p.id === Number(value));
      if (producto) {
        nuevosProductos[index].sku = producto.sku || '';
        nuevosProductos[index].categoria = producto.categoria || '';
        nuevosProductos[index].marca = producto.marca || '';
        nuevosProductos[index].precioUnitario = producto.precioDetal || producto.precioMayor || 0;
      }
    }
    
    setFormData({ ...formData, productos: nuevosProductos });
  };

  const agregarProductoAVenta = () => {
    setFormData({
      ...formData,
      productos: [...formData.productos, {
        productoId: '',
        sku: '',
        categoria: '',
        marca: '',
        cantidad: 1,
        precioUnitario: 0,
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
    setNuevoProducto({
      plataforma: '',
      categoria: '',
      marca: '',
      precioMayor: 0,
      precioDetal: 0,
      precioBs: 0,
      cantidad: 1,
      tipo: 'fisico',
      metodoPago: 'efectivo',
      cartera: '',
    });
    setShowProductoModal(true);
  };

  useEffect(() => {
    if (nuevoProducto.precioDetal > 0) {
      setNuevoProducto(prev => ({
        ...prev,
        precioBs: parseFloat((prev.precioDetal * tasaBCV).toFixed(2))
      }));
    }
  }, [nuevoProducto.precioDetal, tasaBCV]);

  const guardarProductoYRedirigir = () => {
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
        id: Date.now(),
        tipo: nuevoProducto.tipo,
        plataforma: nuevoProducto.plataforma,
        producto: nuevoProducto.plataforma,
        categoria: nuevoProducto.categoria,
        marca: nuevoProducto.marca,
        precioDetal: nuevoProducto.precioDetal,
        precioMayor: nuevoProducto.precioMayor,
        precioBs: nuevoProducto.precioBs,
        cantidad: nuevoProducto.cantidad,
        sku,
        publicado: false,
        estado: 'nuevo',
        fechaCreacion: new Date().toISOString(),
        fecha: new Date().toISOString().split('T')[0],
      };
    }

    const productosActualizados = productoExistente 
      ? productos.map(p => p.id === productoExistente.id ? productoFinal : p)
      : [...productos, productoFinal];

    setProductos(productosActualizados);
    localStorage.setItem('voltech_productos', JSON.stringify(productosActualizados));
    
    if (productoModalIndex !== null) {
      actualizarProductoVenta(productoModalIndex, 'productoId', productoFinal.id);
    }
    
    setShowProductoModal(false);
    toast.success('Producto creado. Redirigiendo a Productos para editar...');
    
    setTimeout(() => {
      router.push('/panel/productos');
    }, 1000);
  };

  const subtotal = formData.productos.reduce((acc, p) => acc + (p.cantidad * p.precioUnitario), 0);
  const totalVenta = subtotal + (formData.delivery ? formData.montoDelivery : 0);
  const montoPendiente = formData.enCuotas ? totalVenta - formData.montoAbonado : 0;

  const registrarVenta = () => {
    if (!formData.cliente || !formData.telefono || formData.productos.some(p => !p.productoId)) {
      toast.error('Completa los campos obligatorios (Cliente, Teléfono, Productos)');
      return;
    }

    for (const prod of formData.productos) {
      const producto = productos.find(p => p.id === Number(prod.productoId));
      if (!producto || producto.cantidad < prod.cantidad) {
        toast.error(`Stock insuficiente para ${producto?.plataforma || 'producto'}`);
        return;
      }
    }

    const clienteExistente = clientes.find(c => 
      c.nombre.toLowerCase() === formData.cliente.toLowerCase() ||
      c.telefono === formData.telefono
    );

    let clientesActualizados = [...clientes];
    if (clienteExistente) {
      clientesActualizados = clientes.map(c => 
        c.id === clienteExistente.id 
          ? { ...c, nombre: formData.cliente, telefono: formData.telefono, ultimaCompra: new Date().toISOString() }
          : c
      );
    } else {
      clientesActualizados.push({
        id: Date.now(),
        nombre: formData.cliente,
        telefono: formData.telefono,
        email: '',
        fechaRegistro: new Date().toISOString(),
        ultimaCompra: new Date().toISOString(),
        totalCompras: 0,
      });
    }

    const nuevaVenta = {
      id: editingId || Date.now(),
      numeroOrden: formData.numeroOrden || generarNumeroOrden(),
      fecha: formData.fecha,
      vendedor: formData.vendedor,
      cliente: formData.cliente,
      telefono: formData.telefono,
      productos: formData.productos.map(p => {
        const producto = productos.find(prod => prod.id === Number(p.productoId));
        return {
          productoId: p.productoId,
          sku: p.sku,
          nombre: producto?.plataforma || producto?.producto || 'Producto',
          categoria: p.categoria,
          marca: p.marca,
          cantidad: p.cantidad,
          precioUnitario: p.precioUnitario,
          total: p.cantidad * p.precioUnitario,
          tipo: producto?.tipo || 'fisico',
        };
      }),
      subtotal,
      delivery: formData.delivery,
      montoDelivery: formData.delivery ? formData.montoDelivery : 0,
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

    const productosActualizados = productos.map(p => {
      const prodEnVenta = formData.productos.find(vp => Number(vp.productoId) === p.id);
      if (prodEnVenta) {
        return { ...p, cantidad: p.cantidad - prodEnVenta.cantidad };
      }
      return p;
    });

    const ventasActualizadas = editingId 
      ? ventas.map(v => v.id === editingId ? nuevaVenta : v)
      : [nuevaVenta, ...ventas];

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
      numeroOrden: generarNumeroOrden(),
      fecha: new Date().toISOString().split('T')[0],
      vendedor: '',
      cliente: '',
      telefono: '',
      productos: [{ productoId: '', sku: '', categoria: '', marca: '', cantidad: 1, precioUnitario: 0 }],
      delivery: false,
      montoDelivery: 0,
      enCuotas: false,
      montoAbonado: 0,
      fechaPago: '',
      metodoPago: 'efectivo',
      carteraId: '',
      referencia: '',
    });
    setClienteSearch('');
    setShowForm(false);
    setEditingId(null);
  };

  const marcarPagado = (venta) => {
    const ventasActualizadas = ventas.map(v => 
      v.id === venta.id 
        ? { ...v, estado: 'pagado', montoPendiente: 0, montoAbonado: v.total, fechaPago: new Date().toISOString().split('T')[0] }
        : v
    );
    setVentas(ventasActualizadas);
    localStorage.setItem('voltech_ventas', JSON.stringify(ventasActualizadas));
    toast.success('Venta marcada como pagada');
  };

  const eliminarVenta = (venta) => {
    if (!confirm('¿Estás seguro de eliminar esta venta? El stock será devuelto.')) return;

    const productosActualizados = productos.map(p => {
      const prodEnVenta = venta.productos.find(vp => vp.productoId === p.id);
      if (prodEnVenta) {
        return { ...p, cantidad: p.cantidad + prodEnVenta.cantidad };
      }
      return p;
    });

    const ventasActualizadas = ventas.filter(v => v.id !== venta.id);
    setVentas(ventasActualizadas);
    setProductos(productosActualizados);
    localStorage.setItem('voltech_ventas', JSON.stringify(ventasActualizadas));
    localStorage.setItem('voltech_productos', JSON.stringify(productosActualizados));
    toast.success('Venta eliminada y stock devuelto');
  };

  const editarVenta = (venta) => {
    setEditingId(venta.id);
    setFormData({
      numeroOrden: venta.numeroOrden || generarNumeroOrden(),
      fecha: venta.fecha,
      vendedor: venta.vendedor,
      cliente: venta.cliente,
      telefono: venta.telefono,
      productos: venta.productos.map(p => ({
        productoId: p.productoId,
        sku: p.sku || '',
        categoria: p.categoria || '',
        marca: p.marca || '',
        cantidad: p.cantidad,
        precioUnitario: p.precioUnitario,
      })),
      delivery: venta.delivery,
      montoDelivery: venta.montoDelivery,
      enCuotas: venta.enCuotas,
      montoAbonado: venta.montoAbonado,
      fechaPago: venta.fechaPago || '',
      metodoPago: venta.metodoPago,
      carteraId: venta.carteraId,
      referencia: venta.referencia,
    });
    setClienteSearch(venta.cliente);
    setShowForm(true);
  };

  // ✅ FUNCIÓN PARA GENERAR PDF (NOTA DE ENTREGA) BASADA EN TU ARCHIVO
  const generarPDF = (venta) => {
    const doc = new jsPDF();
    const tienda = settings.tienda || { nombre: 'VOLTECHSTORE.VE', direccion: 'Caracas, Venezuela', telefono: '04125378515', instagram: '@VoltechStore.ve' };
    
    // Encabezado
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(tienda.nombre, 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("TECNOLOGÍA A TU ALCANCE", 105, 20, { align: 'center' });
    doc.text(`${tienda.direccion} | Instagram: ${tienda.instagram} | WhatsApp: ${tienda.telefono}`, 105, 25, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("NOTA DE ENTREGA Y GARANTÍA", 105, 35, { align: 'center' });

    // Datos de la venta
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let y = 45;
    doc.text(`N° ORDEN: #${venta.numeroOrden || 'N/A'}`, 14, y);
    doc.text(`FECHA: ${venta.fecha}`, 140, y); y += 6;
    doc.text(`CLIENTE: ${venta.cliente}`, 14, y);
    doc.text(`TELÉFONO: ${venta.telefono}`, 140, y); y += 6;
    doc.text(`VENDEDOR: ${venta.vendedor}`, 14, y);
    doc.text(`METODO DE PAGO: ${(venta.metodoPago || 'N/A').replace('_', ' ').toUpperCase()}`, 140, y); y += 10;

    // Tabla de productos
    const tableData = venta.productos.map(p => [
      p.nombre,
      p.cantidad.toString(),
      `$${p.precioUnitario.toFixed(2)}`,
      `$${p.total.toFixed(2)}`
    ]);

    doc.autoTable({
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

    let finalY = doc.lastAutoTable.finalY + 10;
    
    // Total General
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL GENERAL: $${venta.total.toFixed(2)}`, 195, finalY, { align: 'right' });
    if (venta.montoPendiente > 0) {
      doc.setFontSize(10);
      doc.setTextColor(220, 38, 38); // Rojo
      doc.text(`PENDIENTE: $${venta.montoPendiente.toFixed(2)}`, 195, finalY + 6, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    }

    // Políticas de Venta y Garantía (Exactas de tu archivo)
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

  // ✅ FUNCIÓN PARA CALCULAR DÍAS DE ATRASO
  const calcularDiasAtraso = (venta) => {
    if (venta.estado !== 'pendiente' || !venta.fechaPago) return 0;
    
    const fechaPago = new Date(venta.fechaPago);
    const hoy = new Date();
    const diferencia = hoy - fechaPago;
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
  };

  const enviarWhatsapp = (venta) => {
    const totalBs = (venta.total * tasaBCV).toFixed(2);
    const pendienteBs = (venta.montoPendiente * tasaBCV).toFixed(2);
    
    // ✅ MENSAJE DE "GRACIAS POR SU COMPRA"
    if (whatsappMode === 'gracias') {
      const productosTexto = venta.productos.map(p => `• ${p.nombre} x${p.cantidad} = $${p.total.toFixed(2)}`).join('\n');
      
      const mensaje = `Gracias por su compra 🛍️

Recuerda guardar nuestro WhatsApp así como seguirnos en las redes sociales para mantenerte al día sobre nuestros productos 

📸 Instagram @Voltechstore.ve
🎵 Titok @Voltechstore.ve

Nuestro Catálogo 👇🏽
${settings.tienda?.urlCatalogo || 'https://voltechstore.ve'}

Por cada cliente que refieras tendrás descuentos exclusivos

${productosTexto}

💰 Total: $${venta.total.toFixed(2)} (Bs ${totalBs})

¡Gracias por tu compra!
${settings.tienda?.nombre || 'VOLTECH STORE'}`;

      const telefonoLimpio = venta.telefono.replace(/\D/g, '');
      const url = `https://wa.me/58${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, '_blank');
      setShowWhatsappModal(null);
    } 
    // ✅ MENSAJE DE "RECORDATORIO DE PAGO"
    else {
      const productosTexto = venta.productos.map(p => `• ${p.nombre} x${p.cantidad} = $${p.total.toFixed(2)}`).join('\n');
      
      const mensaje = `¡Buen día, ${venta.cliente}!

Te escribimos de parte de *${settings.tienda?.nombre || 'Voltechstore.ve'}* para recordarte que tu tienes un pago pendiente del producto 

${productosTexto}
Monto: $${venta.montoPendiente.toFixed(2)}

Si ya realizaste tu pago, ignora este mensaje y ¡gracias por tu puntualidad!

Que tengas un excelente día,
El equipo de ${settings.tienda?.nombre || 'voltechstore.ve'}

📸 Instagram @Voltechstore.ve
🎵 Titok @Voltechstore.ve

Nuestro Catálogo 👇🏽
${settings.tienda?.urlCatalogo || 'https://voltechstore.ve'}

Por cada cliente que refieras tendrás descuentos exclusivos`;

      const telefonoLimpio = venta.telefono.replace(/\D/g, '');
      const url = `https://wa.me/58${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, '_blank');
      setShowWhatsappModal(null);
    }
  };

  const ventasHoy = ventas.filter(v => v.fecha === new Date().toISOString().split('T')[0]);
  const totalIngresosHoy = ventasHoy.reduce((acc, v) => acc + v.montoAbonado, 0);
  const totalPendiente = ventas.reduce((acc, v) => acc + v.montoPendiente, 0);
  const totalProductosVendidos = ventas.reduce((acc, v) => acc + v.productos.reduce((a, p) => a + p.cantidad, 0), 0);

  const ventasFiltradas = ventas.filter(v => 
    v.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.productos.some(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' },
        success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } },
      }} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ventas de Productos</h1>
          <p className="text-sm text-voltech-muted mt-1">Registra ventas y descuenta inventario automáticamente</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Venta
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-voltech-cyan" />
                  {editingId ? 'Editar Venta' : 'Registrar Nueva Venta'}
                </h3>
                <button onClick={resetForm} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-voltech-cyan mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Datos Generales
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">N° Orden</label>
                    <input
                      type="text"
                      value={formData.numeroOrden}
                      readOnly
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm font-mono text-voltech-cyan bg-voltech-dark/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Fecha *</label>
                    <input
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Vendedor *</label>
                    <select
                      value={formData.vendedor}
                      onChange={(e) => setFormData({ ...formData, vendedor: e.target.value })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                    >
                      <option value="">-- Selecciona --</option>
                      {vendedores.map(v => (
                        <option key={v.id} value={v.nombre}>{v.nombre} ({v.rol})</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Comprador *</label>
                    <input
                      type="text"
                      value={clienteSearch}
                      onChange={(e) => handleClienteChange(e.target.value)}
                      onFocus={() => setShowClientesDropdown(true)}
                      onBlur={() => setTimeout(() => setShowClientesDropdown(false), 200)}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                      placeholder="Buscar o escribir nombre..."
                    />
                    {showClientesDropdown && clientesFiltrados.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-voltech-surface border border-voltech-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {clientesFiltrados.map(c => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setClienteSearch(c.nombre);
                              setFormData({ ...formData, cliente: c.nombre, telefono: c.telefono || '' });
                              setShowClientesDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-voltech-border flex items-center justify-between"
                          >
                            <span>{c.nombre}</span>
                            <span className="text-xs text-voltech-muted">{c.telefono}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Teléfono *</label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                      placeholder="0412-1234567"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Método de Pago *</label>
                    <select
                      value={formData.metodoPago}
                      onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                    >
                      {metodosPagoActivos.map(([key, val]) => (
                        <option key={key} value={key}>{val.nombre || key}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Cartera *</label>
                    <select
                      value={formData.carteraId}
                      onChange={(e) => setFormData({ ...formData, carteraId: e.target.value })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                    >
                      <option value="">-- Selecciona --</option>
                      {carterasActivas.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-voltech-cyan mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Productos
                </h4>
                <div className="space-y-3">
                  {formData.productos.map((prod, index) => (
                    <div key={index} className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                      <div className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-12 md:col-span-2">
                          <label className="block text-xs text-voltech-muted mb-1 ml-1">SKU (automático)</label>
                          <input
                            type="text"
                            value={prod.sku}
                            readOnly
                            className="input-voltech w-full rounded-lg px-3 py-2 text-sm font-mono text-voltech-cyan bg-voltech-dark/50"
                            placeholder="Auto"
                          />
                        </div>
                        <div className="col-span-12 md:col-span-4 relative">
                          <label className="block text-xs text-voltech-muted mb-1 ml-1">Producto *</label>
                          <div className="flex gap-2">
                            <select
                              value={prod.productoId}
                              onChange={(e) => actualizarProductoVenta(index, 'productoId', e.target.value)}
                              className="input-voltech flex-1 rounded-lg px-3 py-2 text-sm"
                            >
                              <option value="">-- Selecciona producto --</option>
                              {productosDisponibles.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.plataforma || p.producto} (Stock: {p.cantidad})
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => abrirModalProductoNuevo(index)}
                              className="px-3 py-2 bg-voltech-purple/20 text-voltech-purple rounded-lg hover:bg-voltech-purple/30 transition-colors flex items-center gap-1"
                              title="Producto no existe? Créalo aquí"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="col-span-6 md:col-span-2">
                          <label className="block text-xs text-voltech-muted mb-1 ml-1">Categoría</label>
                          <input
                            type="text"
                            value={prod.categoria}
                            readOnly
                            className="input-voltech w-full rounded-lg px-3 py-2 text-sm bg-voltech-dark/50"
                            placeholder="Auto"
                          />
                        </div>
                        <div className="col-span-6 md:col-span-2">
                          <label className="block text-xs text-voltech-muted mb-1 ml-1">Marca</label>
                          <input
                            type="text"
                            value={prod.marca}
                            readOnly
                            className="input-voltech w-full rounded-lg px-3 py-2 text-sm bg-voltech-dark/50"
                            placeholder="Auto"
                          />
                        </div>
                        <div className="col-span-4 md:col-span-1">
                          <label className="block text-xs text-voltech-muted mb-1 ml-1">Cant.</label>
                          <input
                            type="number"
                            min="1"
                            value={prod.cantidad}
                            onChange={(e) => actualizarProductoVenta(index, 'cantidad', Number(e.target.value))}
                            className="input-voltech w-full rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="col-span-4 md:col-span-1">
                          <label className="block text-xs text-voltech-muted mb-1 ml-1">P. Unit ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={prod.precioUnitario}
                            onChange={(e) => actualizarProductoVenta(index, 'precioUnitario', Number(e.target.value))}
                            className="input-voltech w-full rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="col-span-3 md:col-span-1">
                          <label className="block text-xs text-voltech-muted mb-1 ml-1">Total</label>
                          <div className="bg-voltech-dark border border-voltech-border rounded-lg px-3 py-2 text-sm font-bold text-voltech-success">
                            ${(prod.cantidad * prod.precioUnitario).toFixed(2)}
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          {formData.productos.length > 1 && (
                            <button
                              onClick={() => eliminarProductoVenta(index)}
                              className="p-2 text-voltech-error hover:bg-voltech-error/10 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={agregarProductoAVenta}
                  className="mt-3 px-4 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-cyan transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar otro producto
                </button>
              </div>

              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={formData.delivery}
                      onChange={(e) => setFormData({ ...formData, delivery: e.target.checked })}
                      className="w-4 h-4 rounded border-voltech-border bg-voltech-dark text-voltech-cyan"
                    />
                    <Truck className="w-4 h-4 text-voltech-warning" />
                    <span className="text-sm text-white">Incluir Delivery</span>
                  </label>
                  {formData.delivery && (
                    <div>
                      <label className="block text-xs text-voltech-muted mb-1">Monto Delivery ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.montoDelivery}
                        onChange={(e) => setFormData({ ...formData, montoDelivery: Number(e.target.value) })}
                        className="input-voltech w-full rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  )}
                </div>
                <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4">
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={formData.enCuotas}
                      onChange={(e) => setFormData({ ...formData, enCuotas: e.target.checked })}
                      className="w-4 h-4 rounded border-voltech-border bg-voltech-dark text-voltech-cyan"
                    />
                    <CreditCard className="w-4 h-4 text-voltech-purple" />
                    <span className="text-sm text-white">Pago en Cuotas</span>
                  </label>
                  {formData.enCuotas && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-voltech-muted mb-1">Abonado ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.montoAbonado}
                          onChange={(e) => setFormData({ ...formData, montoAbonado: Number(e.target.value) })}
                          className="input-voltech w-full rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-voltech-muted mb-1">Próx. Pago</label>
                        <input
                          type="date"
                          value={formData.fechaPago}
                          onChange={(e) => setFormData({ ...formData, fechaPago: e.target.value })}
                          className="input-voltech w-full rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-voltech-muted">Subtotal</p>
                    <p className="text-xl font-bold text-white">${subtotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-voltech-muted">Delivery</p>
                    <p className="text-xl font-bold text-voltech-warning">${formData.delivery ? formData.montoDelivery.toFixed(2) : '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-voltech-muted">Total Venta</p>
                    <p className="text-2xl font-bold text-voltech-success">${totalVenta.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-voltech-muted">Pendiente</p>
                    <p className="text-xl font-bold text-voltech-error">${montoPendiente.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={registrarVenta}
                  className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'Actualizar Venta' : 'Registrar Venta'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-error transition-all flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ MODAL DE CREAR PRODUCTO (INTACTO, SIN CAMBIOS) */}
      <AnimatePresence>
        {showProductoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-voltech-surface border border-voltech-border rounded-2xl w-full max-w-4xl my-8"
            >
              <div className="border-b border-voltech-border p-4 flex items-center justify-between sticky top-0 bg-voltech-surface rounded-t-2xl z-10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-voltech-purple" />
                  Crear Nuevo Producto
                </h2>
                <button onClick={() => setShowProductoModal(false)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">SKU (automático)</label>
                    <input
                      type="text"
                      value={`${nuevoProducto.plataforma.substring(0, 3).toUpperCase()}-${nuevoProducto.categoria.substring(0, 3).toUpperCase()}-${String(productos.length + 1).padStart(3, '0')}`}
                      readOnly
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm font-mono text-voltech-cyan bg-voltech-dark/50"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Plataforma / Producto *</label>
                    <input
                      type="text"
                      value={nuevoProducto.plataforma}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, plataforma: e.target.value })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                      placeholder="Ej: Audífonos JBL"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Categoría *</label>
                    <input
                      type="text"
                      value={nuevoProducto.categoria}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, categoria: e.target.value.toUpperCase() })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                      placeholder="Ej: STREAMING"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Fecha</label>
                    <input
                      type="date"
                      value={new Date().toISOString().split('T')[0]}
                      readOnly
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm bg-voltech-dark/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Comprador (Equipo)</label>
                    <select className="input-voltech w-full rounded-lg px-4 py-2 text-sm">
                      <option value="">-- Selecciona --</option>
                      {equipo.map(e => (
                        <option key={e.id} value={e.nombre}>{e.nombre} ({e.rol})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Marca *</label>
                    <input
                      type="text"
                      value={nuevoProducto.marca}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, marca: e.target.value.toUpperCase() })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                      placeholder="Ej: JBL"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Cantidad</label>
                    <input
                      type="number"
                      value={nuevoProducto.cantidad}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad: Number(e.target.value) })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Moneda de compra</label>
                    <select
                      value={nuevoProducto.tipo === 'bs' ? 'bs' : 'usd'}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, tipo: e.target.value === 'bs' ? 'bs' : 'fisico' })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                    >
                      <option value="usd">Dólares ($)</option>
                      <option value="bs">Bolívares (Bs)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">
                      Precio Mayor ($) <span className="text-voltech-warning">(Tu costo)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={nuevoProducto.precioMayor}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, precioMayor: Number(e.target.value) })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">
                      Precio Detal ($) <span className="text-voltech-success">(Venta al público)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={nuevoProducto.precioDetal}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, precioDetal: Number(e.target.value) })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Precio (Bs)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={nuevoProducto.precioBs}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, precioBs: Number(e.target.value) })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Total</label>
                    <div className="bg-voltech-dark border border-voltech-border rounded-lg px-4 py-2 text-sm font-bold text-voltech-success">
                      ${(nuevoProducto.precioMayor * nuevoProducto.cantidad).toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Método de Pago</label>
                    <select
                      value={nuevoProducto.metodoPago}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, metodoPago: e.target.value })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="pago_movil">Pago Móvil</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="zelle">Zelle</option>
                      <option value="binance">Binance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-voltech-muted mb-1 ml-1">Cartera</label>
                    <select
                      value={nuevoProducto.cartera}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, cartera: e.target.value })}
                      className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
                    >
                      <option value="">-- Selecciona --</option>
                      {carteras.map(c => (
                        <option key={c.id} value={c.nombre}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {nuevoProducto.precioMayor > 0 && nuevoProducto.precioDetal > 0 && (
                  <div className="bg-voltech-success/10 border border-voltech-success/30 rounded-lg p-3 text-sm text-voltech-success">
                    Ganancia por unidad: ${(nuevoProducto.precioDetal - nuevoProducto.precioMayor).toFixed(2)} 
                    ({((nuevoProducto.precioDetal - nuevoProducto.precioMayor) / nuevoProducto.precioMayor * 100).toFixed(0)}%)
                  </div>
                )}
              </div>

              <div className="border-t border-voltech-border p-4 flex gap-3 sticky bottom-0 bg-voltech-surface rounded-b-2xl">
                <button
                  onClick={guardarProductoYRedirigir}
                  className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Guardar y Abrir en Productos
                </button>
                <button
                  onClick={() => setShowProductoModal(false)}
                  className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-error transition-all flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-cyan/20">
              <ShoppingCart className="w-5 h-5 text-voltech-cyan" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Ventas Hoy</p>
              <p className="text-xl font-bold text-white">{ventasHoy.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-success/20">
              <DollarSign className="w-5 h-5 text-voltech-success" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Ingresos Hoy</p>
              <p className="text-xl font-bold text-white">${totalIngresosHoy.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-error/20">
              <TrendingUp className="w-5 h-5 text-voltech-error" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Por Cobrar</p>
              <p className="text-xl font-bold text-white">${totalPendiente.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-warning/20">
              <Users className="w-5 h-5 text-voltech-warning" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Productos Vendidos</p>
              <p className="text-xl font-bold text-white">{totalProductosVendidos}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-voltech-border flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-white">Historial de Ventas</h3>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por cliente o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-voltech w-full rounded-lg pl-10 pr-4 py-2 text-sm"
            />
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
                <tr>
                  <td colSpan="11" className="text-center py-12 text-voltech-muted">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay ventas registradas aún</p>
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((venta) => (
                  <tr key={venta.id} className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-voltech-cyan">{venta.numeroOrden || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-voltech-muted flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> {venta.fecha}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">{venta.cliente}</p>
                      <p className="text-xs text-voltech-muted">{venta.telefono}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-white">
                        {venta.productos[0]?.nombre}
                        {venta.productos.length > 1 && (
                          <span className="text-xs text-voltech-muted ml-1">(+{venta.productos.length - 1} más)</span>
                        )}
                      </p>
                      <button
                        onClick={() => setExpandedId(expandedId === venta.id ? null : venta.id)}
                        className="text-xs text-voltech-cyan hover:underline flex items-center gap-1 mt-1"
                      >
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedId === venta.id ? 'rotate-180' : ''}`} />
                        Ver detalle
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-voltech-success">${venta.total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-voltech-muted">{venta.fechaPago || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-voltech-warning">
                      {calcularDiasAtraso(venta) > 0 ? `+${calcularDiasAtraso(venta)}` : '0'}
                    </td>
                    <td className="px-4 py-3 text-sm text-voltech-muted">{venta.metodoPago.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-sm text-voltech-muted">{venta.carteraId || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        venta.estado === 'pagado' ? 'bg-voltech-success/20 text-voltech-success' : 'bg-voltech-warning/20 text-voltech-warning'
                      }`}>
                        {venta.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setShowWhatsappModal(venta);
                            setWhatsappMode('gracias');
                          }}
                          className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-success transition-colors"
                          title="Enviar mensaje de gracias"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setShowWhatsappModal(venta);
                            setWhatsappMode('recordatorio');
                          }}
                          className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-warning transition-colors"
                          title="Enviar recordatorio de pago"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generarPDF(venta)}
                          className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-purple transition-colors"
                          title="Generar PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => editarVenta(venta)}
                          className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {venta.estado !== 'pagado' && (
                          <button
                            onClick={() => marcarPagado(venta)}
                            className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-success transition-colors"
                            title="Marcar pagado"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => eliminarVenta(venta)}
                          className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ MODAL DE WHATSAPP CON DOS MÓDOS */}
      <AnimatePresence>
        {showWhatsappModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-voltech-surface border border-voltech-border rounded-2xl w-full max-w-md"
            >
              <div className="border-b border-voltech-border p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-voltech-success" />
                  {whatsappMode === 'gracias' ? 'Mensaje de Gracias' : 'Recordatorio de Pago'}
                </h2>
                <button onClick={() => setShowWhatsappModal(null)} className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-voltech-muted mb-4">
                  Se enviará un mensaje a <strong className="text-white">{showWhatsappModal.telefono}</strong> con el detalle de la venta.
                </p>
                <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-3 mb-4 max-h-48 overflow-y-auto">
                  <p className="text-xs text-white whitespace-pre-wrap">
                    {whatsappMode === 'gracias' ? `Gracias por su compra 🛍️

Recuerda guardar nuestro WhatsApp así como seguirnos en las redes sociales para mantenerte al día sobre nuestros productos 

📸 Instagram @Voltechstore.ve
🎵 Titok @Voltechstore.ve

Nuestro Catálogo 👇🏽
${settings.tienda?.urlCatalogo || 'https://voltechstore.ve'}

Por cada cliente que refieras tendrás descuentos exclusivos

${showWhatsappModal.productos.map(p => `• ${p.nombre} x${p.cantidad} = $${p.total.toFixed(2)}`).join('\n')}

💰 Total: $${showWhatsappModal.total.toFixed(2)} (Bs ${(showWhatsappModal.total * tasaBCV).toFixed(2)})

¡Gracias por tu compra!
${settings.tienda?.nombre || 'VOLTECH STORE'}` : `¡Buen día, ${showWhatsappModal.cliente}!

Te escribimos de parte de *${settings.tienda?.nombre || 'Voltechstore.ve'}* para recordarte que tu tienes un pago pendiente del producto 

${showWhatsappModal.productos.map(p => `• ${p.nombre} x${p.cantidad} = $${p.total.toFixed(2)}`).join('\n')}
Monto: $${showWhatsappModal.montoPendiente.toFixed(2)}

Si ya realizaste tu pago, ignora este mensaje y ¡gracias por tu puntualidad!

Que tengas un excelente día,
El equipo de ${settings.tienda?.nombre || 'voltechstore.ve'}

📸 Instagram @Voltechstore.ve
🎵 Titok @Voltechstore.ve

Nuestro Catálogo 👇🏽
${settings.tienda?.urlCatalogo || 'https://voltechstore.ve'}

Por cada cliente que refieras tendrás descuentos exclusivos`}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWhatsappMode('gracias')}
                      className={`px-3 py-1 text-sm rounded-lg ${whatsappMode === 'gracias' ? 'bg-voltech-success/20 text-voltech-success' : 'bg-voltech-dark/50 text-voltech-muted'}`}
                    >
                      Gracias por su compra
                    </button>
                    <button
                      onClick={() => setWhatsappMode('recordatorio')}
                      className={`px-3 py-1 text-sm rounded-lg ${whatsappMode === 'recordatorio' ? 'bg-voltech-warning/20 text-voltech-warning' : 'bg-voltech-dark/50 text-voltech-muted'}`}
                    >
                      Recordatorio de pago
                    </button>
                  </div>
                  <button
                    onClick={() => enviarWhatsapp(showWhatsappModal)}
                    className="px-4 py-2 bg-voltech-success/20 text-voltech-success rounded-lg hover:bg-voltech-success/30 transition-colors flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Enviar mensaje
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