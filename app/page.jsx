import { redirect } from 'next/navigation';

export default function HomePage() {
  // ✅ Redirección del lado del servidor: es instantánea y no muestra el texto de "Cargando..."
  redirect('/catalogo');
}