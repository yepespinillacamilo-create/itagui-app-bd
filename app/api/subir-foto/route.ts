import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSupabase } from '@/lib/supabase';

// Subida de fotos desde la administración (requiere ingreso).
export async function POST(req: NextRequest) {
  try {
    const sb = getSupabase();
    const formData = await req.formData();
    const file   = formData.get('foto')   as File   | null;
    const cedula = String(formData.get('cedula') || '').replace(/\D/g, '');

    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'La foto supera 8 MB' }, { status: 400 });

    const buffer   = Buffer.from(await file.arrayBuffer());
    const nombre   = cedula || randomUUID();
    const fileName = `colaboradores/${nombre}.jpg`;

    const { error } = await sb.storage.from('fotos')
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;

    const { data: { publicUrl } } = sb.storage.from('fotos').getPublicUrl(fileName);
    return NextResponse.json({ url: `${publicUrl}?t=${Date.now()}` });
  } catch (err) {
    console.error('Error subiendo foto:', err);
    return NextResponse.json({ error: 'Error al subir foto' }, { status: 500 });
  }
}
