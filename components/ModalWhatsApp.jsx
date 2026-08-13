'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, Pencil, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { resolverPlantillaWa, rellenarVariables } from '@/components/EmojiTextarea';

// ✅ Interpreta *negrita* y _cursiva_ como WhatsApp
function formatearWA(texto) {
  return (texto || '').split('\n').map((linea, i) => (
    <p key={i} className="min-h-[1em] whitespace-pre-wrap break-words">
      {linea.split(/(\*[^*]+\*|_[^_]+_)/g).map((seg, j) => {
        if (seg.length > 2 && seg.startsWith('*') && seg.endsWith('*')) return <strong key={j}>{seg.slice(1, -1)}</strong>;
        if (seg.length > 2 && seg.startsWith('_') && seg.endsWith('_')) return <em key={j}>{seg.slice(1, -1)}</em>;
        return seg;
      })}
    </p>
  ));
}

// ✅ Icono oficial de WhatsApp (SVG)
const WhatsAppIcon = ({ className = 'w-4 h-4 shrink-0' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.451-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function ModalWhatsApp({ abierto, clave, vars = {}, titulo, telefono, nombreCliente, textoFijo, onClose }) {
  const [texto, setTexto] = useState('');
  const [borrador, setBorrador] = useState('');
  const [editando, setEditando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const varsRef = useRef(vars);
  varsRef.current = vars;

  const horaActual = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!abierto) { setEditando(false); setCopiado(false); return; }
    let activo = true;
    (async () => {
      if (textoFijo) { if (activo) { setTexto(textoFijo); setBorrador(textoFijo); } return; }
      let store = {};
      try { store = JSON.parse(localStorage.getItem('voltech_plantillas_whatsapp') || '{}'); } catch {}
      const usuario = (() => { try { return JSON.parse(localStorage.getItem('voltech_user') || 'null'); } catch { return null; } })();
      const plantilla = resolverPlantillaWa(store, usuario, clave);
      const lleno = rellenarVariables(plantilla, varsRef.current);
      if (activo) { setTexto(lleno); setBorrador(lleno); }
    })();
    return () => { activo = false; };
  }, [abierto, clave, textoFijo]);

  const copiar = () => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    toast.success('Mensaje copiado');
    setTimeout(() => setCopiado(false), 2000);
  };

  const enviar = () => {
    const limpio = (telefono || '').replace(/\D/g, '');
    const cod = encodeURIComponent(texto);
    const esMovil = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
    const url = esMovil
      ? `https://wa.me/58${limpio}?text=${cod}`
      : `https://web.whatsapp.com/send?phone=58${limpio}&text=${cod}`;
    window.open(url, '_blank');
    toast.success('Abriendo WhatsApp...');
    onClose();
  };

  const guardarCambios = () => {
    setTexto(borrador);
    setEditando(false);
    toast.success('Vista previa actualizada');
  };

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-voltech-surface border border-voltech-border rounded-2xl w-[95%] sm:w-full sm:max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ===== HEADER ===== */}
            <div className="px-4 sm:px-5 py-4 border-b border-voltech-border bg-[#111827] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-full bg-[#25D366]/15 shrink-0"><MessageCircle className="w-5 h-5 text-[#25D366]" /></div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white truncate">{titulo || 'Mensaje de WhatsApp'}</h3>
                  <p className="text-xs text-voltech-muted truncate">{nombreCliente || 'Cliente'} • {telefono || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setEditando(!editando)} className={`p-2 rounded-lg transition-colors ${editando ? 'bg-voltech-cyan/20 text-voltech-cyan' : 'text-voltech-muted hover:text-white'}`} title="Editar"><Pencil className="w-4 h-4" /></button>
                <button onClick={onClose} className="p-2 rounded-lg text-voltech-muted hover:text-voltech-error transition-colors" title="Cerrar"><X className="w-5 h-5" /></button>
              </div>
            </div>

            {/* ===== CUERPO (scroll) ===== */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {editando ? (
                <div className="space-y-3">
                  <textarea
                    value={borrador}
                    onChange={(e) => setBorrador(e.target.value)}
                    rows={12}
                    className="input-voltech w-full rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-voltech-cyan"
                  />
                  <button onClick={guardarCambios} className="w-full h-12 bg-voltech-cyan/20 text-voltech-cyan rounded-xl text-sm font-medium hover:bg-voltech-cyan/30 transition-colors flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> Guardar Cambios
                  </button>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden border border-voltech-border">
                  {/* Barra de chat */}
                  <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-voltech-cyan to-voltech-purple flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {(nombreCliente || 'C').charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#25D366]">{nombreCliente || 'Cliente'}</p>
                      <p className="text-[10px] text-emerald-400">en línea</p>
                    </div>
                  </div>
                  {/* Burbuja enviada */}
                  <div className="bg-[#0b141a] p-4">
                    <div className="flex justify-end">
                      <div className="bg-[#005c4b] rounded-lg rounded-tr-none p-3 text-[13px] text-gray-100 shadow max-w-[88%] sm:max-w-[80%]">
                        {formatearWA(texto)}
                        <p className="text-[9px] text-gray-400 text-right mt-1 flex items-center justify-end gap-1">
                          {horaActual()} <span className="text-[#53bdeb]">{'\u2713\u2713'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ===== FOOTER ===== */}
            <div className="flex flex-col gap-2 w-full p-4 md:px-5 md:py-4 border-t border-voltech-border bg-voltech-dark/50 md:flex-row md:gap-3 shrink-0">
              <button
                onClick={copiar}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 md:h-12 md:px-5 md:bg-voltech-surface md:border-voltech-border md:text-sm md:text-voltech-muted md:hover:text-white md:hover:border-voltech-cyan transition-colors"
              >
                {copiado ? <Check className="w-4 h-4 text-voltech-success" /> : <Copy className="w-4 h-4" />}
                {copiado ? '¡Copiado!' : 'Copiar'}
              </button>
              <button
                onClick={enviar}
                className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 bg-emerald-500 text-white hover:bg-emerald-600 md:flex-1 md:h-12 md:px-5 md:text-sm md:font-bold md:shadow-lg md:shadow-emerald-500/20 transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Enviar por WhatsApp</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}