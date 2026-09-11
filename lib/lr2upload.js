// ✅ Sube una imagen DIRECTO a Cloudflare R2 y devuelve su URL pública
export async function subirImagenAR2(file) {
  const res = await fetch('/api/imagen-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name || 'imagen.jpg', contentType: file.type || 'image/jpeg' }),
  });
  if (!res.ok) throw new Error('No se pudo obtener URL de subida');
  const { uploadUrl, publicUrl } = await res.json();

  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'image/jpeg' },
    body: file,
  });
  if (!put.ok) throw new Error('Falló la subida a R2');
  return publicUrl;
}