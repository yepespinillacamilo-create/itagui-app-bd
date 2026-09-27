import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// PATCH — actualizar asistio de un registro
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { asistio, nota } = await req.json();
  const { data, error } = await getSupabase()
    .from('asistencias')
    .update({ asistio, nota: nota ?? null })
    .eq('id', Number(id))
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PUT — alias de PATCH para compatibilidad
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(req, { params });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await getSupabase().from('asistencias').delete().eq('id', Number(id));
  return NextResponse.json({ ok: true });
}
