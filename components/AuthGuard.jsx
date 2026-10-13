'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/app/context/PermissionsContext';
import toast from 'react-hot-toast';

export default function AuthGuard({ children, requiredPermission }) {
  const router = useRouter();
  const { tienePermiso, usuarioActual } = usePermissions();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Pequeño delay para asegurar que el contexto se hidrató correctamente desde localStorage
    const timer = setTimeout(() => {
      if (!usuarioActual) {
        router.push('/login');
      } else if (requiredPermission && !tienePermiso(requiredPermission)) {
        toast.error('⛔ Acceso denegado: No tienes permisos para ver esta sección');
        router.push('/panel/dashboard');
      }
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [requiredPermission, tienePermiso, usuarioActual, router]);

  // 1. Estado de carga mientras verifica
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-voltech-dark">
        <div className="animate-pulse text-voltech-muted font-medium">Verificando permisos...</div>
      </div>
    );
  }

  // 2. Pantalla de bloqueo por si logra renderizar antes del redirect
  if (requiredPermission && !tienePermiso(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-voltech-dark p-4">
        <div className="text-center p-8 bg-voltech-surface border border-voltech-border rounded-2xl shadow-2xl max-w-md w-full">
          <div className="w-16 h-16 bg-voltech-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-voltech-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h1>
          <p className="text-voltech-muted mb-6">No tienes los permisos necesarios para acceder a esta sección.</p>
          <button 
            onClick={() => router.push('/panel/dashboard')}
            className="w-full px-4 py-3 bg-voltech-cyan text-white font-bold rounded-lg hover:bg-voltech-cyan/80 transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 3. Si todo está bien, muestra el contenido protegido
  return <>{children}</>;
}