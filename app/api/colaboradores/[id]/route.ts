import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { fichaADb, type Ficha } from '@/lib/ficha';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { data, error } = await getSupabase().from('colaboradores').select('*').eq('id', Number(id)).single();
  if (error || !data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(data);
}

// Guardar la ficha completa desde la administración
export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const ficha = (await req.json()) as Ficha;
    const datos = fichaADb(ficha);
    if (!datos.nombre) return NextResponse.json({ error: 'Faltan nombres' }, { status: 400 });

    const sb = getSupabase();
    const { data, error } = await sb.from('colaboradores').update(datos).eq('id', Number(id)).select().single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Ya existe otro colaborador con ese documento' }, { status: 400 });
      throw error;
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 });
  }
}

// Marcar / desmarcar el registro en el CEMP
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { accion, registrado_por, fecha } = await req.json();
  const cambios = accion === 'desmarcar_cemp'
    ? { cemp_fecha_registro: null, cemp_registrado_por: null }
    : { cemp_fecha_registro: fecha ? new Date(fecha).toISOString() : new Date().toISOString(),
        cemp_registrado_por: registrado_por?.trim() || null };
  const { data, error } = await getSupabase().from('colaboradores').update(cambios).eq('id', Number(id)).select().single();
  if (error) return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 });
  return NextResponse.json(data);
}
