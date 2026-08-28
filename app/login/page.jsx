'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/portal');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-voltech-dark via-slate-900 to-voltech-dark flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            <span className="text-white">VOLTECH</span>{' '}
            <span className="text-voltech-purple">STORE</span>
            <span className="text-voltech-cyan">VE</span>
          </h1>
        </div>
        
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 blur-2xl opacity-40 bg-gradient-to-r from-voltech-purple to-voltech-cyan rounded-full"></div>
          <div className="relative w-16 h-16 border-4 border-voltech-cyan border-t-voltech-purple rounded-full animate-spin"></div>
        </div>
        
        <div>
          <p className="text-sm text-voltech-muted">Redirigiendo al portal...</p>
          <p className="text-xs text-slate-500 mt-1">Serás redirigido automáticamente</p>
        </div>
      </div>
    </div>
  );
}