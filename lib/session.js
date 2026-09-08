// ✅ Detecta si corre como app instalada (APK Capacitor / PWA / TWA)
export const esApp = () => {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('apk') === '1') {
      try { sessionStorage.setItem('voltech_es_app', '1'); } catch (e) {}
      return true;
    }
    if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) {
      try { sessionStorage.setItem('voltech_es_app', '1'); } catch (e) {}
      return true;
    }
    if (window.matchMedia?.('(display-mode: standalone)')?.matches) return true;
    if (window.matchMedia?.('(display-mode: fullscreen)')?.matches) return true;
    if (window.navigator?.standalone === true) return true;
    if (sessionStorage.getItem('voltech_es_app') === '1') return true;
  } catch (e) {}
  return false;
};

const KEY_APP = 'voltech_user_app';
const KEY_WEB = 'voltech_user';

export const sessionKey = () => (esApp() ? KEY_APP : KEY_WEB);

export const getUser = () => {
  try {
    if (esApp()) {
      let u = localStorage.getItem(KEY_APP);
      if (!u) {
        u = localStorage.getItem(KEY_WEB);
        if (u) localStorage.setItem(KEY_APP, u);
      }
      return u ? JSON.parse(u) : null;
    }
    const u = localStorage.getItem(KEY_WEB);
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

export const setUser = (usuario) => {
  const data = JSON.stringify(usuario);
  localStorage.setItem(sessionKey(), data);
  localStorage.setItem(sessionKey() === KEY_APP ? KEY_WEB : KEY_APP, data);
};

export const clearUser = () => {
  localStorage.removeItem(KEY_APP);
  localStorage.removeItem(KEY_WEB);
};