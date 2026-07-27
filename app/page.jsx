'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'default-no-store';

import { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext'; // ✅ AGREGADO
import { ShoppingCart, Search, MessageCircle, X, Plus, Minus, Trash2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function HomePage() {
  const { darkMode } = useTheme(); // ✅ AGREGADO
  const [activeSection, setActiveSection] = useState('inicio');
  const [productos, setProductos] = useState([]);
  const [settings, setSettings] = useState({});
  const [tasaBCV, setTasaBCV] = useState(36.5);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const productosGuardados = localStorage.getItem('voltech_productos');
    const settingsGuardados = localStorage.getItem('voltech_settings');
    const tasaGuardada = localStorage.getItem('voltech_tasa_bcv');
    const cartGuardado = localStorage.getItem('voltech_cart');

    if (productosGuardados) setProductos(JSON.parse(productosGuardados).filter(p => p.publicado));
    if (settingsGuardados) setSettings(JSON.parse(settingsGuardados));
    if (tasaGuardada) setTasaBCV(JSON.parse(tasaGuardada).tasa || 36.5);
    if (cartGuardado) setCart(JSON.parse(cartGuardado));
  }, []);

  const calcularPrecioBs = (precio) => (precio * tasaBCV).toFixed(2);

  const addToCart = (producto) => {
    setCart([...cart, { ...producto, cantidad: 1 }]);
    toast.success('Agregado al carrito');
  };

  return (
    // ✅ ACTUALIZADO: Fondo dinámico según el modo oscuro global
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
      <Toaster position="top-right" />
      
      <header className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm sticky top-0 z-40 border-b`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">VOLTECH STORE</h1>
            <nav className="flex gap-6">
              <button onClick={() => setActiveSection('inicio')} className="hover:text-purple-500 transition-colors">Inicio</button>
              <button onClick={() => setActiveSection('productos')} className="hover:text-purple-500 transition-colors">Productos</button>
              <button onClick={() => setActiveSection('streaming')} className="hover:text-purple-500 transition-colors">Streaming</button>
              <button onClick={() => setActiveSection('ofertas')} className="hover:text-purple-500 transition-colors">Ofertas</button>
            </nav>
            <button onClick={() => setShowCart(true)} className="relative p-2">
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{cart.length}</span>}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeSection === 'inicio' && (
          <div className="text-center py-20">
            <h2 className="text-4xl font-bold mb-4">Bienvenido a Voltech Store</h2>
            <p className={`text-xl mb-8 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Los mejores productos y servicios</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setActiveSection('productos')} className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">Ver Productos</button>
              <button onClick={() => setActiveSection('streaming')} className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors">Ver Streaming</button>
            </div>
          </div>
        )}

        {activeSection === 'productos' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Productos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {productos.filter(p => p.tipo === 'fisico').map(producto => (
                <div key={producto.id} className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white'} rounded-lg shadow p-4 border`}>
                  <h3 className="font-bold">{producto.producto}</h3>
                  <p className={darkMode ? 'text-slate-400' : 'text-gray-600'}>${producto.precioDetal} / Bs {calcularPrecioBs(producto.precioDetal)}</p>
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-colors">WhatsApp</button>
                    <button onClick={() => addToCart(producto)} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors">Carrito</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}