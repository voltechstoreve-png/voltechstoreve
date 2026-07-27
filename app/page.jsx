'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente al catálogo
    router.push('/catalogo');
  }, [router]);

  return (
    <div className="min-h-screen bg-voltech-dark flex items-center justify-center">
      <div className="text-white text-xl font-bold animate-pulse">
        Cargando catálogo...
      </div>
    </div>
  );
}