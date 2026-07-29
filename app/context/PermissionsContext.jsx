'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const PermissionsContext = createContext();

// ✅ Definición de permisos por rol
const PERMISOS_POR_ROL = {
  admin: {
    puedeVerTodo: true,
    puedeCrearUsuarios: true,
    puedeEliminarUsuarios: true,
    puedeEditarUsuarios: true,
    puedeVerFinanzas: true,
    puedeVerReportes: true,
    puedeAprobarVentas: true,
    puedeVerConfiguracion: true,
    puedeVerTodosLosClientes: true,
    puedeVerInventarioCompleto: true,
    puedeVerComisionesTodos: true,
    recibeNotificacionesDeTodo: true,
  },
  socio: {
    puedeVerTodo: true,
    puedeCrearUsuarios: false,
    puedeEliminarUsuarios: false,
    puedeEditarUsuarios: false,
    puedeVerFinanzas: true,
    puedeVerReportes: true,
    puedeAprobarVentas: true,
    puedeVerConfiguracion: false,
    puedeVerTodosLosClientes: true,
    puedeVerInventarioCompleto: true,
    puedeVerComisionesTodos: true,
    recibeNotificacionesDeTodo: true,
  },
  vendedor: {
    puedeVerTodo: false,
    puedeCrearUsuarios: false,
    puedeEliminarUsuarios: false,
    puedeEditarUsuarios: false,
    puedeVerFinanzas: false,
    puedeVerReportes: false,
    puedeAprobarVentas: false,
    puedeVerConfiguracion: false,
    puedeVerTodosLosClientes: false, // Solo los suyos
    puedeVerInventarioCompleto: false, // Solo ver, no editar
    puedeVerComisionesTodos: false, // Solo las suyas
    recibeNotificacionesDeTodo: false,
  },
  logistica: {
    puedeVerTodo: false,
    puedeVerFinanzas: false,
    puedeVerReportes: false,
    puedeVerConfiguracion: false,
  },
  marketing: {
    puedeVerTodo: false,
    puedeVerFinanzas: false,
    puedeVerReportes: false,
    puedeVerConfiguracion: false,
  },
};

export function PermissionsProvider({ children }) {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [permisos, setPermisos] = useState({});

  useEffect(() => {
    const userStr = localStorage.getItem('voltech_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUsuarioActual(user);
      setPermisos(PERMISOS_POR_ROL[user.rol?.toLowerCase()] || PERMISOS_POR_ROL.vendedor);
    }
  }, []);

  const tienePermiso = (permiso) => {
    return permisos[permiso] === true;
  };

  const esAdmin = usuarioActual?.rol?.toLowerCase() === 'admin';
  const esSocio = usuarioActual?.rol?.toLowerCase() === 'socio';
  const esVendedor = usuarioActual?.rol?.toLowerCase() === 'vendedor';

  return (
    <PermissionsContext.Provider
      value={{
        usuarioActual,
        permisos,
        tienePermiso,
        esAdmin,
        esSocio,
        esVendedor,
        PERMISOS_POR_ROL,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions debe usarse dentro de PermissionsProvider');
  }
  return context;
}