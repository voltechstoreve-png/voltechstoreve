'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, ShieldCheck, X } from 'lucide-react';

const CLAVE_DEFAULT = 'VOLTECH-2026';

export default function ApkGate({ children }) {
  const [estado, setEstado] = useState('cargando'); // 'cargando' | 'libre' | 'bloqueado'
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [claveCorrecta, setClaveCorrecta] = useState(CLAVE_DEFAULT);

  useEffect(() => {
    const iniciar = async () => {
      try {
        // 1) Si entra con ?apk=1 (el APK siempre lo trae), marcamos modo APK
        const params = new URLSearchParams(window.location.search);
        if (params.has('apk')) localStorage.setItem('voltech_apk_mode', '1');
        const esApk = localStorage.getItem('voltech_apk_mode') === '1';
        if (!esApk) { setEstado('libre'); return; }   // ✅ Web pública: NO bloquear

        // 2) Clave remota (opcional) desde Ajustes/Supabase
        try {
          if (supabase) {
            const { data } = await supabase.from('settings').select('valor').eq('clave', 'tienda').maybeSingle();
            const val = data?.valor;
            const claveRemota = typeof val === 'string' ? (JSON.parse(val)?.clave_apk) : val?.clave_apk;
            if (claveRemota) setClaveCorrecta(String(claveRemota));
          }
        } catch (e) {}

        // 3) ¿Ya estaba activado en este dispositivo?
        if (localStorage.getItem('voltech_apk_activado') === '1') setEstado('libre');
        else setEstado('bloqueado');
      } catch (e) {
        setEstado('libre');
      }
    };
    iniciar();
  }, []);

  const validar = () => {
    if (clave.trim() === claveCorrecta.trim()) {
      localStorage.setItem('voltech_apk_activado', '1');
      setError('');
      setEstado('libre');
    } else {
      setError('Clave incorrecta. Solicita autorización al administrador.');
    }
  };

  if (estado === 'cargando') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 text-sm animate-pulse">Cargando…</div>
      </div>
    );
  }

  if (estado === 'libre') return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10"><Lock className="w-6 h-6 text-cyan-400" /></div>
          <div>
            <h1 className="text-white font-bold">Acceso restringido</h1>
            <p className="text-slate-400 text-xs">Esta app requiere clave de autorización</p>
          </div>
        </div>
        <input
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && validar()}
          placeholder="Ingresa la clave"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:border-cyan-400 focus:outline-none"
          autoFocus
        />
        {error && <p className="text-rose-400 text-xs flex items-center gap-1"><X className="w-3 h-3" /> {error}</p>}
        <button onClick={validar} className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Desbloquear
        </button>
      </div>
    </div>
  );
}