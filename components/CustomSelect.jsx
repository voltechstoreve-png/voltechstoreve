'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

// ✅ SELECT RESPONSIVO:
// - PC (≥768px): <select> NATIVO (no cambia nada de lo que ves en PC)
// - MÓVIL (<768px): desplegable personalizado Voltech, posicionado FIXED para que NUNCA se recorte
const CustomSelect = ({ label, value, onChange, options, placeholder = '-- Selecciona --', disabled = false, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [esMovil, setEsMovil] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, maxHeight: 240 });
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setEsMovil(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Cierra al hacer scroll (excepto si scrolleas dentro del propio menú)
  useEffect(() => {
    if (!isOpen) return;
    const cerrar = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setIsOpen(false);
    };
    window.addEventListener('scroll', cerrar, true);
    return () => window.removeEventListener('scroll', cerrar, true);
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const espacioAbajo = window.innerHeight - r.bottom - 8;
      if (espacioAbajo >= 200) {
        setPos({ top: r.bottom + 4, left: r.left, width: r.width, maxHeight: Math.min(240, espacioAbajo) });
      } else {
        const mh = Math.min(240, Math.max(120, r.top - 8));
        setPos({ top: Math.max(8, r.top - mh - 4), left: r.left, width: r.width, maxHeight: mh });
      }
    }
    setIsOpen(!isOpen);
  };

  // ✅ PC: select nativo (idéntico al actual)
  if (!esMovil) {
    return (
      <div className={`relative min-w-0 ${className}`} ref={ref}>
        {label && <label className="block text-xs text-voltech-muted mb-1 ml-1">{label}</label>}
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="input-voltech w-full rounded-lg px-4 py-2 text-sm"
        >
          {!options.some((opt) => opt.value === '') && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  // ✅ MÓVIL: desplegable personalizado Voltech (FIXED = nunca se recorta)
  return (
    <div className={`relative min-w-0 ${className}`} ref={ref}>
      {label && <label className="block text-xs text-voltech-muted mb-1 ml-1">{label}</label>}
      <div
        ref={triggerRef}
        onClick={toggleOpen}
        className={`w-full min-w-0 bg-voltech-dark border border-voltech-cyan/30 rounded-md px-3 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-voltech-cyan'
        }`}
      >
        <span className={`${selectedOption ? 'text-white' : 'text-slate-400'} truncate flex-1 min-w-0`}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-voltech-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && !disabled && (
        <div
          ref={menuRef}
          className="fixed bg-voltech-dark border border-voltech-cyan/30 rounded-md z-[999] overflow-y-auto shadow-xl"
          style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: pos.maxHeight }}
        >
          {options.length === 0 ? (
            <div className="px-4 py-2 text-sm text-voltech-muted">No hay opciones disponibles</div>
          ) : (
            options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                  value === opt.value ? 'bg-voltech-purple text-white' : 'bg-voltech-surface text-white hover:bg-voltech-purple'
                }`}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;