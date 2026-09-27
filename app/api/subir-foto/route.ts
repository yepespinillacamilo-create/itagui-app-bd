import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const sb = getSupabase();
    const formData = await req.formData();
    const file    = formData.get('foto')   as File   | null;
    const cedula  = formData.get('cedula') as string | null;

    if (!file)   return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });
    if (!cedula || !/^[\w-]+$/.test(cedula)) {
      return NextResponse.json({ error: 'Cédula inválida' }, { status: 400 });
    }

    const buffer    = Buffer.from(await file.arrayBuffer());
    const mimeType  = file.type || 'image/jpeg';
    const extension = mimeType.includes('png') ? 'png' : 'jpg';
    const fileName  = `colaboradores/${cedula}.${extension}`;

    // Subir a Supabase Storage (bucket: fotos)
    const { error: uploadError } = await sb.storage
      .from('fotos')
      .upload(fileName, buffer, { contentType: mimeType, upsert: true });

    if (uploadError) throw uploadError;

    // Obtener URL pública
    const { data: { publicUrl } } = sb.storage.from('fotos').getPublicUrl(fileName);

    // Agregar timestamp para evitar caché del navegador
    const url = `${publicUrl}?t=${Date.now()}`;

    return NextResponse.json({ url });
  } catch (err) {
    console.error('Error subiendo foto:', err);
    return NextResponse.json({ error: 'Error al subir foto' }, { status: 500 });
  }
}
