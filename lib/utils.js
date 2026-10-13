// lib/utils.js
export const generarSlug = (texto) => {
  if (!texto) return 'producto';
  return texto
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Reemplazar espacios con guiones
    .replace(/[^\w\-]+/g, '')    // Eliminar caracteres no alfanuméricos (tildes, signos)
    .replace(/\-\-+/g, '-')      // Reemplazar múltiples guiones con uno solo
    .replace(/^-+/, '')          // Eliminar guiones al inicio
    .replace(/-+$/, '');         // Eliminar guiones al final
};