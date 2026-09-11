import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const esBase64 = (s) => typeof s === 'string' && s.startsWith('data:image');

const extDeContentType = (ct) => {
  if (ct.includes('png')) return 'png';
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('gif')) return 'gif';
  return 'jpg';
};

async function subirBase64AR2(dataUrl, keyBase) {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) return null;
  const contentType = match[1] || 'image/jpeg';
  const buffer = Buffer.from(match[2], 'base64');
  const key = `${keyBase}.${extDeContentType(contentType)}`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export async function GET(req) {
  const url = new URL(req.url);
  const lote = Math.min(parseInt(url.searchParams.get('lote') || '2', 10), 5);

  try {
    // 1. Buscar productos que aún tengan base64 (portada o array)
    const { data: productos, error } = await supabase
      .from('productos')
      .select('id, imagen, imagenes')
      .or('imagen.like.data:%,imagenes.cs.["data:"]')
      .limit(lote);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!productos || productos.length === 0) {
      return NextResponse.json({ mensaje: '✅ No quedan imágenes base64 por migrar', procesados: 0, restantes: 0 });
    }

    let procesados = 0;
    const detalles = [];

    for (const p of productos) {
      try {
        let nuevaImagen = p.imagen;
        let nuevasImagenes = Array.isArray(p.imagenes) ? [...p.imagenes] : [];

        // Migrar portada
        if (esBase64(p.imagen)) {
          nuevaImagen = await subirBase64AR2(p.imagen, `migrados/${p.id}-portada`);
        }

        // Migrar array de imágenes
        for (let i = 0; i < nuevasImagenes.length; i++) {
          if (esBase64(nuevasImagenes[i])) {
            nuevasImagenes[i] = await subirBase64AR2(nuevasImagenes[i], `migrados/${p.id}-img${i}`);
          }
        }

        // Asegurar que la portada esté en el array
        if (nuevaImagen && !nuevasImagenes.includes(nuevaImagen)) {
          nuevasImagenes.unshift(nuevaImagen);
        }

        const { error: upErr } = await supabase
          .from('productos')
          .update({ imagen: nuevaImagen, imagenes: nuevasImagenes })
          .eq('id', p.id);

        if (upErr) {
          detalles.push({ id: p.id, ok: false, error: upErr.message });
        } else {
          procesados++;
          detalles.push({ id: p.id, ok: true });
        }
      } catch (e) {
        detalles.push({ id: p.id, ok: false, error: e.message });
      }
    }

    // Contar restantes
    const { count } = await supabase
      .from('productos')
      .select('id', { count: 'exact', head: true })
      .or('imagen.like.data:%,imagenes.cs.["data:"]');

    return NextResponse.json({ procesados, restantes: count || 0, detalles });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}