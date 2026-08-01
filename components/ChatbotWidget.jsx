'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, ExternalLink, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatbotWidget({ productos = [], whatsappNumber = '584121234567' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      type: 'text',
      text: '¡Hola! 👋 Soy el asistente virtual de Voltech Store. ¿En qué puedo ayudarte hoy?\n\nPuedes preguntarme por:\n• Detalles de un producto (ej: "batería del iPhone")\n• Precios y ofertas\n• O escribir "vendedor" para hablar con un humano.'
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const normalizeText = (text) => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      type: 'text',
      text: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    const query = normalizeText(inputValue);
    setInputValue('');
    setIsTyping(true);

    // Simular tiempo de "pensamiento" del bot
    setTimeout(() => {
      let botResponse = generateBotResponse(query, productos);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 800);
  };

  const generateBotResponse = (query, productos) => {
    // 1. Si el usuario pide hablar con un humano
    if (query.includes('vendedor') || query.includes('humano') || query.includes('ayuda') || query.includes('persona')) {
      return {
        id: Date.now() + 1,
        sender: 'bot',
        type: 'action',
        text: '¡Claro! Un asesor te atenderá con gusto. Haz clic abajo para abrir WhatsApp:',
        action: {
          type: 'whatsapp',
          label: 'Chatear con un Vendedor',
          url: `https://wa.me/${whatsappNumber}?text=Hola,%20necesito%20ayuda%20con%20un%20producto%20de%20la%20tienda.`
        }
      };
    }

    // 2. Búsqueda inteligente en productos (nombre, plataforma, categoría y descripción detallada)
    const matchedProducts = productos.filter(p => {
      const searchableText = normalizeText(
        `${p.plataforma || ''} ${p.nombre || ''} ${p.categoria || ''} ${p.descripcion_detallada || ''}`
      );
      // Dividir la consulta en palabras y verificar si al menos una palabra clave coincide
      const queryWords = query.split(' ').filter(w => w.length > 2);
      return queryWords.some(word => searchableText.includes(word));
    }).slice(0, 2); // Máximo 2 productos para no saturar

    if (matchedProducts.length > 0) {
      return {
        id: Date.now() + 1,
        sender: 'bot',
        type: 'products',
        text: `Encontré esto que podría interesarte sobre "${query}":`,
        products: matchedProducts
      };
    }

    // 3. Respuestas genéricas o fallback
    if (query.includes('precio') || query.includes('cuanto') || query.includes('cuesta')) {
      return {
        id: Date.now() + 1,
        sender: 'bot',
        type: 'text',
        text: 'Puedes ver todos nuestros precios actualizados en el catálogo. ¿Hay algún producto en específico que estés buscando?'
      };
    }

    if (query.includes('hola') || query.includes('buenas') || query.includes('hey')) {
      return {
        id: Date.now() + 1,
        sender: 'bot',
        type: 'text',
        text: '¡Hola! 👋 ¿En qué puedo ayudarte? Puedes preguntarme por detalles de productos o escribir "vendedor" para atención humana.'
      };
    }

    // Fallback final
    return {
      id: Date.now() + 1,
      sender: 'bot',
      type: 'action',
      text: 'No estoy seguro de entender tu pregunta. ¿Te gustaría que te comunique directamente con uno de nuestros vendedores?',
      action: {
        type: 'whatsapp',
        label: 'Hablar con un Asesor',
        url: `https://wa.me/${whatsappNumber}?text=Hola,%20tengo%20una%20consulta%20sobre%20un%20producto.`
      }
    };
  };

  const handleQuickAction = (action) => {
    if (action.type === 'whatsapp') {
      window.open(action.url, '_blank');
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-voltech-cyan to-voltech-purple rounded-full shadow-lg shadow-voltech-cyan/30 flex items-center justify-center text-white"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      {/* Ventana del Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-voltech-surface border border-voltech-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: '500px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-voltech-cyan to-voltech-purple p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Asistente Voltech</h3>
                <p className="text-white/80 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  En línea
                </p>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-voltech-dark/50" style={{ maxHeight: '350px' }}>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-voltech-cyan text-white rounded-br-none' 
                      : 'bg-voltech-surface border border-voltech-border text-voltech-muted rounded-bl-none'
                  }`}>
                    <p className="whitespace-pre-line">{msg.text}</p>
                    
                    {/* Renderizar Productos si el bot los recomienda */}
                    {msg.type === 'products' && msg.products && (
                      <div className="mt-3 space-y-2">
                        {msg.products.map((prod, idx) => (
                          <div key={idx} className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-2 flex gap-2">
                            {prod.imagen ? (
                              <img src={prod.imagen} alt={prod.plataforma} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded bg-voltech-border flex items-center justify-center flex-shrink-0">
                                <ShoppingCart className="w-5 h-5 text-voltech-muted" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-xs truncate">{prod.plataforma || prod.nombre}</p>
                              <p className="text-voltech-cyan font-bold text-xs">${Number(prod.precioDetal || prod.precioMayor || 0).toFixed(2)}</p>
                              {prod.descripcion_detallada && (
                                <p className="text-[10px] text-voltech-muted mt-1 line-clamp-2">{prod.descripcion_detallada}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Renderizar Acciones (Botón WhatsApp) */}
                    {msg.type === 'action' && msg.action && (
                      <button 
                        onClick={() => handleQuickAction(msg.action)}
                        className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {msg.action.label}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-voltech-surface border border-voltech-border rounded-2xl rounded-bl-none p-3 flex items-center gap-1">
                    <span className="w-2 h-2 bg-voltech-muted rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-voltech-muted rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2 h-2 bg-voltech-muted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-voltech-surface border-t border-voltech-border">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1 bg-voltech-dark border border-voltech-border rounded-full px-4 py-2 text-sm text-white placeholder-voltech-muted focus:outline-none focus:border-voltech-cyan transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="w-9 h-9 bg-voltech-cyan hover:bg-voltech-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}