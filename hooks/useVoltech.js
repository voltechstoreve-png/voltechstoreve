// hooks/useVoltech.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // ✅ CAMBIADO: Ruta relativa infalible

// 1. Hook para Productos
export function useProductos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductos = async () => {
      if (supabase) {
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .eq('publicado', true)
          .order('creado_en', { ascending: false });

        if (!error && data && data.length > 0) {
          setProductos(data);
          localStorage.setItem('voltech_productos', JSON.stringify(data));
        } else {
          const cached = localStorage.getItem('voltech_productos');
          if (cached) setProductos(JSON.parse(cached).filter(p => p.publicado === true || p.publicado === undefined));
        }
      } else {
        const cached = localStorage.getItem('voltech_productos');
        if (cached) setProductos(JSON.parse(cached).filter(p => p.publicado === true || p.publicado === undefined));
      }
      setLoading(false);
    };
    fetchProductos();
  }, []);

  return { productos, loading };
}

// 2. Hook para Configuración (Settings)
export function useSettings() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const fetchSettings = async () => {
      if (supabase) {
        const { data, error } = await supabase.from('settings').select('clave, valor');
        if (!error && data && data.length > 0) {
          const settingsObj = {};
          data.forEach(item => { settingsObj[item.clave] = item.valor; });
          setSettings(settingsObj);
          localStorage.setItem('voltech_settings', JSON.stringify(settingsObj));
        } else {
          const cached = localStorage.getItem('voltech_settings');
          if (cached) setSettings(JSON.parse(cached));
        }
      } else {
        const cached = localStorage.getItem('voltech_settings');
        if (cached) setSettings(JSON.parse(cached));
      }
    };
    fetchSettings();
  }, []);

  return { settings };
}

// 3. Hook para Tasa BCV
export function useTasaBCV() {
  const [tasa, setTasa] = useState(36.5);
  useEffect(() => {
    const cached = localStorage.getItem('voltech_tasa_bcv');
    if (cached) setTasa(JSON.parse(cached).tasa || 36.5);
  }, []);
  const updateTasa = (nuevaTasa) => {
    setTasa(nuevaTasa);
    localStorage.setItem('voltech_tasa_bcv', JSON.stringify({ tasa: nuevaTasa }));
  };
  return { tasa, setTasa: updateTasa };
}

// 4. Hook para Usuario Logueado
export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    const userLogged = localStorage.getItem('voltech_user');
    if (userLogged) setCurrentUser(JSON.parse(userLogged));
  }, []);
  return { currentUser, setCurrentUser };
}