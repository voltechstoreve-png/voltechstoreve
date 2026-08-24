'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/portal');
  }, [router]);

  return (
    <div className="min-h-screen bg-voltech-dark flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-voltech-cyan border-t-transparent rounded-full animate-spin" />
    </div>
  );
}