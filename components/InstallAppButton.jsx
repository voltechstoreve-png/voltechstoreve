'use client';
import { useEffect, useState } from 'react';
import { Download, Share, Plus, X } from 'lucide-react';

export default function InstallAppButton() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone);
    if (standalone) setInstalled(true);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || (!deferred && !isIOS)) return null;

  return (
    <>
      <button
        onClick={() => { if (deferred) { deferred.prompt(); } else { setShowHelp(true); } }}
        className="fixed bottom-5 left-5 z-[80] flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white text-xs font-bold shadow-lg shadow-voltech-cyan/40 hover:scale-105 transition-transform"
      >
        <Download className="w-4 h-4" /> Descargar la App
      </button>

      {showHelp && (
        <div className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-voltech-surface border border-voltech-border rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">Instalar en iPhone/iPad</h3>
              <button onClick={() => setShowHelp(false)} className="text-voltech-muted"><X className="w-5 h-5" /></button>
            </div>
            <ol className="text-sm text-voltech-muted space-y-3 list-decimal list-inside">
              <li>Abre esta página en <b>Safari</b>.</li>
              <li>Toca el botón <b>Compartir</b> <Share className="w-4 h-4 inline" />.</li>
              <li>Elige <b>"Agregar a pantalla de inicio"</b> <Plus className="w-4 h-4 inline" />.</li>
              <li>Listo: la app aparecerá en tu pantalla de inicio.</li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}