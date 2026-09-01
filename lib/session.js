// ✅ Detecta si corre como app instalada (PWA/TWA) o en pestaña de navegador
export const esApp = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.matchMedia?.('(display-mode: fullscreen)')?.matches ||
    window.navigator.standalone === true);

const KEY_APP = 'voltech_user_app';
const KEY_WEB = 'voltech_user';

export const sessionKey = () => (esApp() ? KEY_APP : KEY_WEB);

// ✅ Leer usuario del contexto actual (la app migra su propia copia la primera vez)
export const getUser = () => {
  try {
    if (esApp()) {
      let u = localStorage.getItem(KEY_APP);
      if (!u) {
        u = localStorage.getItem(KEY_WEB);
        if (u) localStorage.setItem(KEY_APP, u); // la app guarda su propia copia
      }
      return u ? JSON.parse(u) : null;
    }
    const u = localStorage.getItem(KEY_WEB);
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

// ✅ Guardar sesión solo en el contexto actual
export const setUser = (usuario) => {
  localStorage.setItem(sessionKey(), JSON.stringify(usuario));
};

// ✅ Cerrar sesión SOLO del contexto actual (no afecta al otro)
export const clearUser = () => {
  localStorage.removeItem(sessionKey());
};