import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

// ✅ Devuelve una URL firmada para subir la imagen DIRECTO a R2
export async function POST(req) {
  try {
    const { filename, contentType } = await req.json();
    if (!filename) return NextResponse.json({ error: 'filename requerido' }, { status: 400 });

    const limpio = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `productos/${Date.now()}-${limpio}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: contentType || 'image/jpeg',
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (e) {
    console.error('Error URL firmada R2:', e);
    return NextResponse.json({ error: e.message || 'Error R2' }, { status: 500 });
  }
}