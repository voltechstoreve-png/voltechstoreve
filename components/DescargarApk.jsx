'use client';
import { useEffect, useState } from 'react';
import { getUser } from '@/lib/session';
import { Download, ShieldCheck } from 'lucide-react';

export default function DescargarApk() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getUser()); // ✅ Solo si hay sesión iniciada
  }, []);

  // ✅ Si no está logueado, NO se muestra nada
  if (!user || !user.nombre) return null;

  return (
    <a
      href="/voltech.apk"
      download="voltech-store.apk"
      className="fixed bottom-20 left-4 z-40 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-bold rounded-full shadow-lg shadow-cyan-500/30 hover:scale-105 transition-transform"
      title="Solo equipo autorizado"
    >
      <Download className="w-4 h-4" />
      Descargar APK
      <ShieldCheck className="w-3.5 h-3.5" />
    </a>
  );
}