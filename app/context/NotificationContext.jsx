'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // ✅ Ruta absoluta segura

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const getCurrentUser = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('voltech_user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  };

  useEffect(() => {
    const cargarNotificaciones = async () => {
      const user = getCurrentUser();
      
      if (supabase && user) {
        // ✅ Construir la condición OR de forma segura
        const userRol = user.rol || 'vendedor';
        let orCondition = `rol_destino.eq.${userRol},rol_destino.eq.todos`;
        
        // Solo agregar usuario_id si es un UUID válido (no es undefined, null, o "undefined")
        if (user.id && user.id !== 'undefined' && user.id !== 'local-1') {
          orCondition = `usuario_id.eq.${user.id},${orCondition}`;
        }

        const { data, error } = await supabase
          .from('notificaciones')
          .select('*')
          .or(orCondition)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setNotificaciones(data);
        } else {
          console.warn('Usando fallback local para notificaciones:', error?.message);
          const guardadas = localStorage.getItem('voltech_notificaciones');
          if (guardadas) setNotificaciones(JSON.parse(guardadas));
        }
      } else {
        const guardadas = localStorage.getItem('voltech_notificaciones');
        if (guardadas) {
          try { setNotificaciones(JSON.parse(guardadas)); } catch (e) { console.error(e); }
        }
      }
      setLoading(false);
    };

    cargarNotificaciones();

    // Escuchar notificaciones en tiempo real (solo si hay usuario válido)
    if (supabase) {
      const user = getCurrentUser();
      if (user && user.id && user.id !== 'undefined') {
        const channel = supabase
          .channel('notificaciones-channel')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones' }, (payload) => {
            const nueva = payload.new;
            const currentUser = getCurrentUser();
            if (currentUser && (nueva.usuario_id === currentUser.id || nueva.rol_destino === currentUser.rol || nueva.rol_destino === 'todos')) {
              setNotificaciones(prev => [nueva, ...prev]);
            }
          })
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      }
    }
  }, []);

  const agregarNotificacion = async (notificacion) => {
    const nueva = {
      ...notificacion,
      leida: false,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('notificaciones')
        .insert([nueva])
        .select()
        .single();

      if (!error && data) {
        setNotificaciones(prev => [data, ...prev]);
      } else {
        console.error('Error al guardar notificación:', error);
        const actualizadas = [nueva, ...notificaciones];
        setNotificaciones(actualizadas);
        localStorage.setItem('voltech_notificaciones', JSON.stringify(actualizadas));
      }
    } else {
      const actualizadas = [nueva, ...notificaciones];
      setNotificaciones(actualizadas);
      localStorage.setItem('voltech_notificaciones', JSON.stringify(actualizadas));
    }
  };

  const marcarLeida = async (id) => {
    if (supabase) {
      await supabase.from('notificaciones').update({ leida: true }).eq('id', id);
    }
    const actualizadas = notificaciones.map(n => n.id === id ? { ...n, leida: true } : n);
    setNotificaciones(actualizadas);
    localStorage.setItem('voltech_notificaciones', JSON.stringify(actualizadas));
  };

  const marcarTodasLeidas = async () => {
    const user = getCurrentUser();
    if (supabase && user && user.id && user.id !== 'undefined') {
      await supabase
        .from('notificaciones')
        .update({ leida: true })
        .or(`usuario_id.eq.${user.id},rol_destino.eq.${user.rol},rol_destino.eq.todos`);
    }
    const actualizadas = notificaciones.map(n => ({ ...n, leida: true }));
    setNotificaciones(actualizadas);
    localStorage.setItem('voltech_notificaciones', JSON.stringify(actualizadas));
  };

  const eliminarNotificacion = async (id) => {
    if (supabase) {
      await supabase.from('notificaciones').delete().eq('id', id);
    }
    const actualizadas = notificaciones.filter(n => n.id !== id);
    setNotificaciones(actualizadas);
    localStorage.setItem('voltech_notificaciones', JSON.stringify(actualizadas));
  };

  const limpiarTodas = async () => {
    const user = getCurrentUser();
    if (supabase && user && user.id && user.id !== 'undefined') {
      await supabase
        .from('notificaciones')
        .delete()
        .or(`usuario_id.eq.${user.id},rol_destino.eq.${user.rol},rol_destino.eq.todos`);
    }
    setNotificaciones([]);
    localStorage.setItem('voltech_notificaciones', JSON.stringify([]));
  };

  return (
    <NotificationContext.Provider value={{
      notificaciones,
      loading,
      agregarNotificacion,
      marcarLeida,
      marcarTodasLeidas,
      eliminarNotificacion,
      limpiarTodas,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificaciones() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificaciones debe usarse dentro de NotificationProvider');
  }
  return context;
}