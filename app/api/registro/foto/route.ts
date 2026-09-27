import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSupabase } from '@/lib/supabase';

// Subida de foto desde el formulario público.
// Se guarda con un nombre aleatorio: nunca reemplaza la foto de otra persona.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('foto') as File | null;
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 });
    if (file.size > 3 * 1024 * 1024) return NextResponse.json({ error: 'La foto es muy pesada' }, { status: 400 });

    const sb = getSupabase();
    const fileName = `solicitudes/${randomUUID()}.jpg`;
    const { error } = await sb.storage.from('fotos')
      .upload(fileName, Buffer.from(await file.arrayBuffer()), { contentType: 'image/jpeg' });
    if (error) throw error;

    const { data: { publicUrl } } = sb.storage.from('fotos').getPublicUrl(fileName);
    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('Error subiendo foto (registro):', err);
    return NextResponse.json({ error: 'No se pudo subir la foto' }, { status: 500 });
  }
}
