// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const host = request.headers.get('host') || '';
  
  // Si el dominio contiene 'vercel.app' y NO es tu dominio oficial
  if (host.includes('vercel.app') && !host.includes('voltechstoreve.com')) {
    const url = new URL(request.url);
    url.protocol = 'https';
    url.host = 'voltechstoreve.com';
    url.port = ''; // Eliminar cualquier puerto por seguridad
    
    // 308 = Redirect Permanente (mejor para SEO y caché)
    return NextResponse.redirect(url.toString(), 308);
  }

  return NextResponse.next();
}

// Aplicar a todas las rutas
export const config = {
  matcher: '/:path*',
};