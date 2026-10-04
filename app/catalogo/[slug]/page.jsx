// app/catalogo/[slug]/page.jsx
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { generarSlug } from '@/lib/utils';

// ✅ 1. Generación Dinámica de Metadatos (Open Graph para WhatsApp/Facebook)
export async function generateMetadata({ params }) {
  // Buscamos todos los productos publicados (idealmente aquí usarías .eq('slug', params.slug) si ya tienes la columna)
  const { data: productos, error } = await supabase
    .from('productos')
    .select('id, plataforma, producto, precioDetal, precioMayor, descripcion, descripcion_detallada, imagen, imagenes, slug')
    .eq('publicado', true);

  if (error || !productos) return { title: 'Producto no encontrado | Voltech Store' };

  // Buscamos por slug exacto, o hacemos fallback a comparar el slug generado
  const producto = productos.find(p => 
    (p.slug && p.slug === params.slug) || generarSlug(p.plataforma || p.producto) === params.slug
  );

  if (!producto) return notFound();

  const nombre = producto.plataforma || producto.producto;
  const precio = Number(producto.precioDetal || producto.precioMayor || 0).toFixed(2);
  const descripcion = producto.descripcion_detallada || producto.descripcion || `Disponible en Voltech Store por $${precio}`;
  
  // Obtener la primera imagen válida (asegúrate de que sea una URL absoluta o relativa válida)
  const imagenBase = producto.imagen || (Array.isArray(producto.imagenes) ? producto.imagenes[0] : null);
  const imagen = imagenBase ? (imagenBase.startsWith('http') ? imagenBase : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://voltechstoreve.com'}${imagenBase}`) : 'https://voltechstoreve.com/voltechstore.png';

  const tituloSEO = `${nombre} - $${precio} | Voltech Store`;
  const urlProducto = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://voltechstoreve.com'}/catalogo/${params.slug}`;

  return {
    title: tituloSEO,
    description: descripcion,
    openGraph: {
      title: tituloSEO,
      description: descripcion,
      url: urlProducto,
      images: [{ 
        url: imagen, 
        width: 800, 
        height: 600, 
        alt: nombre 
      }],
      type: 'product',
      siteName: 'Voltech Store',
    },
    twitter: {
      card: 'summary_large_image',
      title: tituloSEO,
      description: descripcion,
      images: [imagen],
    },
  };
}

// ✅ 2. Componente de la Página (Redirige al catálogo principal con el slug como filtro o muestra el detalle)
export default function ProductoSlugPage({ params }) {
  // Aquí puedes renderizar tu componente de detalle de producto o redirigir:
  // Ejemplo de redirección suave si tu catálogo maneja la vista por parámetro:
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-voltech-muted">Cargando producto: {params.slug}...</p>
      {/* Nota: Idealmente aquí importarías tu componente de vista de producto detallada */}
    </div>
  );
}