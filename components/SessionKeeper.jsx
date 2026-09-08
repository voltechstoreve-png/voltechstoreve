'use client';
import { useEffect } from 'react';
import { getUser, setUser } from '@/lib/session';

export default function SessionKeeper({ children }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // 1. Si la URL trae ?apk=1, marcar dispositivo como app definitivamente
    const params = new URLSearchParams(window.location.search);
    if (params.get('apk') === '1') {
      try { sessionStorage.setItem('voltech_es_app', '1'); } catch (e) {}
    }
    // 2. Reforzar la sesión: volver a guardarla en AMBAS claves para que nunca se pierda
    const raw = getUser();
    if (raw && raw.nombre) {
      try {
        const dataStr = JSON.stringify(raw);
        localStorage.setItem('voltech_user', dataStr);
        localStorage.setItem('voltech_user_app', dataStr);
      } catch (e) {}
    }
  }, []);
  return children;
}