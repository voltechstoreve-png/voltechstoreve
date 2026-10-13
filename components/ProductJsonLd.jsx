// app/components/ProductJsonLd.jsx
export default function ProductJsonLd({ producto }) {
  if (!producto) return null;

  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: producto.plataforma || producto.producto,
    image: producto.imagen || (producto.imagenes?.[0] || ''),
    description: producto.descripcion_detallada || producto.descripcion || 'Producto tecnológico de Voltech Store',
    sku: producto.sku,
    brand: {
      '@type': 'Brand',
      name: producto.marca || 'Voltech'
    },
    offers: {
      '@type': 'Offer',
      url: `https://voltechstoreve.com/catalogo?producto=${producto.id}`,
      priceCurrency: 'USD',
      price: producto.precioOferta > 0 ? producto.precioOferta : (producto.precioDetal || 0),
      availability: producto.cantidad > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Voltech Store'
      }
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}