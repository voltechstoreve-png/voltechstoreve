'use client';
import { useEffect, useState } from 'react';
import { getUser } from '@/lib/session';
import { Download, ShieldCheck, X } from 'lucide-react';

export default function DescargarApk() {
  const [user, setUser] = useState(null);
  const [visible, setVisible] = useState(true);
  const [disponible, setDisponible] = useState(false);

  useEffect(() => {
    setUser(getUser());
    try {
      if (sessionStorage.getItem('voltech_apk_btn_oculto') === '1') setVisible(false);
    } catch (e) {}
    // ✅ Solo mostrar el botón si el APK realmente existe en el servidor
    fetch('/voltech.apk', { method: 'HEAD' })
      .then(r => setDisponible(r.ok))
      .catch(() => setDisponible(false));
  }, []);

  const ocultar = () => {
    setVisible(false);
    try { sessionStorage.setItem('voltech_apk_btn_oculto', '1'); } catch (e) {}
  };

  if (!user || !user.nombre || !visible || !disponible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
      <a
        href="/voltech.apk"
        download="voltech-store.apk"
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-bold rounded-full shadow-lg shadow-cyan-500/30 hover:scale-105 transition-transform"
        title="Solo equipo autorizado"
      >
        <Download className="w-4 h-4" />
        Descargar APK
        <ShieldCheck className="w-3.5 h-3.5" />
      </a>
      <button
        onClick={ocultar}
        className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        title="Ocultar botón"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}