'use client';

import { useEffect } from 'react';

export default function ClearSW() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Desregistrar Service Workers corruptos
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
            console.log('✅ Service Worker desregistrado');
          });
        });
      }
      
      // 2. Limpiar todas las cachés del navegador
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
            console.log('🗑️ Caché eliminada:', name);
          });
        });
      }
    }
  }, []);

  return null;
}