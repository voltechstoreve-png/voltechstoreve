'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
    const guardadas = localStorage.getItem('voltech_notificaciones');
    if (guardadas) {
      try {
        setNotificaciones(JSON.parse(guardadas));
      } catch (e) {
        console.error('Error al cargar notificaciones:', e);
      }
    }
  }, []);

  const agregarNotificacion = (notificacion) => {
    const nueva = {
      id: Date.now(),
      ...notificacion,
      hora: new Date().toISOString(),
      leida: false,
    };
    const actualizadas = [nueva, ...notificaciones];
    setNotificaciones(actualizadas);
    localStorage.setItem('voltech_notificaciones', JSON.stringify(actualizadas));
  };

  const marcarLeida = (id) => {
    const actualizadas = notificaciones.map(n => 
      n.id === id ? { ...n, leida: true } : n
    );
    setNotificaciones(actualizadas);
    localStorage.setItem('voltech_notificaciones', JSON.stringify(actualizadas));
  };

  const marcarTodasLeidas = () => {
    const actualizadas = notificaciones.map(n => ({ ...n, leida: true }));
    setNotificaciones(actualizadas);
    localStorage.setItem('voltech_notificaciones', JSON.stringify(actualizadas));
  };

  const eliminarNotificacion = (id) => {
    const actualizadas = notificaciones.filter(n => n.id !== id);
    setNotificaciones(actualizadas);
    localStorage.setItem('voltech_notificaciones', JSON.stringify(actualizadas));
  };

  const limpiarTodas = () => {
    setNotificaciones([]);
    localStorage.setItem('voltech_notificaciones', JSON.stringify([]));
  };

  return (
    <NotificationContext.Provider value={{
      notificaciones,
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