'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
        // ✅ MEJORA: Normalizar el rol a minúsculas para evitar fallos de coincidencia (ej. "Admin" vs "admin")
        const userRol = (user.rol || 'vendedor').toLowerCase();
        
        // ✅ MEJORA: Construir la condición OR de forma segura y optimizada
        let orCondition = `rol_destino.eq.${userRol},rol_destino.eq.todas,rol_destino.eq.todos`;
        
        // Solo agregar usuario_id si es un UUID válido
        if (user.id && user.id !== 'undefined' && user.id !== 'local-1' && user.id.length > 10) {
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
          if (guardadas) {
            try {
              // ✅ MEJORA: Filtrar también en el fallback local por rol
              const notificacionesLocales = JSON.parse(guardadas);
              const filtradas = notificacionesLocales.filter(n => 
                n.usuario_id === user.id || 
                (n.rol_destino || 'todos').toLowerCase() === userRol || 
                (n.rol_destino || 'todos').toLowerCase() === 'todos'
              );
              setNotificaciones(filtradas);
            } catch (e) { 
              console.error('Error al parsear notificaciones locales:', e); 
            }
          }
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

    // ✅ MEJORA: Escuchar notificaciones en tiempo real (Optimizado para PWA/Móvil)
    if (supabase) {
      const user = getCurrentUser();
      if (user && user.id && user.id !== 'undefined' && user.id.length > 10) {
        const userRol = (user.rol || 'vendedor').toLowerCase();
        
        const channel = supabase
          .channel('notificaciones-channel')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones' }, (payload) => {
            const nueva = payload.new;
            const currentUser = getCurrentUser();
            
            // ✅ MEJORA: Validación estricta de rol en minúsculas
            const rolDestino = (nueva.rol_destino || 'todos').toLowerCase();
            const esParaMi = nueva.usuario_id === currentUser?.id || 
                             rolDestino === userRol || 
                             rolDestino === 'todos' || 
                             rolDestino === 'todas';

            if (currentUser && esParaMi) {
              setNotifications(prev => {
                // Evitar duplicados si la notificación ya llegó por otro medio
                if (prev.some(n => n.id === nueva.id)) return prev;
                return [nueva, ...prev];
              });
            }
          })
          .subscribe((status) => {
            if (status === 'CHANNEL_ERROR') {
              console.warn('Error en el canal de notificaciones en tiempo real. Usando fallback.');
            }
          });

        return () => { 
          supabase.removeChannel(channel); 
        };
      }
    }
  }, []);

  const agregarNotificacion = async (notificacion) => {
    const user = getCurrentUser();
    const nueva = {
      ...notificacion,
      leida: false,
      // ✅ MEJORA: Asegurar que rol_destino esté en minúsculas si se proporciona
      rol_destino: notificacion.rol_destino ? notificacion.rol_destino.toLowerCase() : 'todos',
      created_at: new Date().toISOString(),
      hora: new Date().toISOString(),
    };

    if (supabase && user && user.id && user.id !== 'undefined' && user.id.length > 10) {
      // Si no se especifica usuario_id, intentar asignarlo si es una notificación personal
      if (!nueva.usuario_id && nueva.rol_destino === user.rol?.toLowerCase()) {
        nueva.usuario_id = user.id;
      }

      const { data, error } = await supabase
        .from('notificaciones')
        .insert([nueva])
        .select()
        .single();

      if (!error && data) {
        setNotificaciones(prev => {
          if (prev.some(n => n.id === data.id)) return prev;
          return [data, ...prev];
        });
      } else {
        console.error('Error al guardar notificación en Supabase:', error);
        fallbackLocal(nueva);
      }
    } else {
      fallbackLocal(nueva);
    }
  };

  // ✅ MEJORA: Función auxiliar para no repetir código de fallback
  const fallbackLocal = (nueva) => {
    const guardadas = localStorage.getItem('voltech_notificaciones');
    const actuales = guardadas ? JSON.parse(guardadas) : [];
    const actualizadas = [nueva, ...actuales];
    setNotificaciones(actualizadas);
    localStorage.setItem('voltech_notificaciones', JSON.stringify(actualizadas));
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
    if (supabase && user && user.id && user.id !== 'undefined' && user.id.length > 10) {
      const userRol = (user.rol || 'vendedor').toLowerCase();
      await supabase
        .from('notificaciones')
        .update({ leida: true })
        .or(`usuario_id.eq.${user.id},rol_destino.eq.${userRol},rol_destino.eq.todos,rol_destino.eq.todas`);
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
    if (supabase && user && user.id && user.id !== 'undefined' && user.id.length > 10) {
      const userRol = (user.rol || 'vendedor').toLowerCase();
      await supabase
        .from('notificaciones')
        .delete()
        .or(`usuario_id.eq.${user.id},rol_destino.eq.${userRol},rol_destino.eq.todos,rol_destino.eq.todas`);
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