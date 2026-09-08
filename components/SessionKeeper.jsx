'use client';
import { useEffect } from 'react';
import { getUser, setUser, esApp } from '@/lib/session';

export default function SessionKeeper({ children }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Si la URL trae ?apk=1, marcar dispositivo como app DEFINITIVAMENTE
    const params = new URLSearchParams(window.location.search);
    if (params.get('apk') === '1') {
      try { localStorage.setItem('voltech_es_app_persistente', '1'); } catch (e) {}
    }

    // 2. Reforzar la sesión al cargar: guardarla en AMBAS claves
    const raw = getUser();
    if (raw && raw.nombre) {
      try {
        const dataStr = JSON.stringify(raw);
        localStorage.setItem('voltech_user', dataStr);
        localStorage.setItem('voltech_user_app', dataStr);
      } catch (e) {}
    }

    // 3. Listener: cuando la app entra en segundo plano, reforzar la sesión
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const user = getUser();
        if (user && user.nombre) {
          try {
            const dataStr = JSON.stringify(user);
            localStorage.setItem('voltech_user', dataStr);
            localStorage.setItem('voltech_user_app', dataStr);
          } catch (e) {}
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Listener: antes de cerrar la página, guardar la sesión
    const handleBeforeUnload = () => {
      const user = getUser();
      if (user && user.nombre) {
        try {
          const dataStr = JSON.stringify(user);
          localStorage.setItem('voltech_user', dataStr);
          localStorage.setItem('voltech_user_app', dataStr);
        } catch (e) {}
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 5. Si estamos en Capacitor, escuchar eventos nativos
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      const App = window.Capacitor.Plugins.App;
      if (App.addListener) {
        App.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) {
            // App entra en segundo plano: reforzar sesión
            const user = getUser();
            if (user && user.nombre) {
              try {
                const dataStr = JSON.stringify(user);
                localStorage.setItem('voltech_user', dataStr);
                localStorage.setItem('voltech_user_app', dataStr);
              } catch (e) {}
            }
          }
        });
      }
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return children;
}