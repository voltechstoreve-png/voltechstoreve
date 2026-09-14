// middleware.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  const hostname = request.headers.get('host')
  
  // Lista de dominios permitidos
  const allowedHosts = [
    'voltechstoreve.com',
    'www.voltechstoreve.com',
    'localhost:3000'
  ]
  
  // Si NO es un dominio permitido, redirige
  if (!allowedHosts.includes(hostname)) {
    return NextResponse.redirect(
      `https://voltechstoreve.com${request.nextUrl.pathname}`,
      308
    )
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)']
}