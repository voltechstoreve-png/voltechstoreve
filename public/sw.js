// ✅ 1. Importar Firebase (versión compat para Service Workers)
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// ✅ 2. Tu configuración de Firebase (⚠️ REEMPLAZA con tus datos reales de Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyDn_AMsOc8_J2Id0BkoZ4AQyHP_mLE_LgI",
  authDomain: "voltech-push.firebaseapp.com",
  projectId: "voltech-push",
  storageBucket: "voltech-push.firebasestorage.app",
  messagingSenderId: "25006705164",
  appId: "1:25006705164:android:28e6dcc5c9897999ee3c29"
};

// Inicializar Firebase solo si no está inicializado
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const messaging = firebase.messaging();

// ✅ 3. Manejar notificaciones en SEGUNDO PLANO (app cerrada o en background)
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Mensaje recibido en background:', payload);
  
  const notificationTitle = payload.notification?.title || 'Voltech Store';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes una nueva actualización',
    icon: '/voltechstore.png',
    badge: '/voltechstore.png',
    data: payload.data // Para que al hacer clic abra una URL específica si quieres
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ✅ 4. Kamikaze controlado: Limpiar cachés viejas de Next.js/PWA 
self.addEventListener('install', () => {
  console.log('[sw.js] Instalado, forzando actualización');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => {
        console.log('[sw.js] Cachés antiguas eliminadas. SW activo para recibir notificaciones.');
        // ⚠️ NO desregistres el SW aquí, o las notificaciones de fondo dejarán de funcionar.
      })
  );
});

// ✅ 5. No interceptar fetch: dejar que Next.js maneje la red normalmente
self.addEventListener('fetch', (event) => {
  // No hacer nada, el navegador irá directamente a la red (sin caché stale)
});
