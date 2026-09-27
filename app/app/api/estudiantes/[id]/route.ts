import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = getSupabase();
  const { data: est, error: e1 } = await sb.from('estudiantes').select('*').eq('id', Number(id)).single();
  if (e1) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const { data: asist } = await sb.from('asistencias').select('asistio, sesion_id, sesiones(fecha, descripcion)').eq('estudiante_id', Number(id));
  return NextResponse.json({ estudiante: est, asistencias: asist ?? [] });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { nombre, cedula, celular, foto, activo, orden } = await req.json();
  const { data, error } = await getSupabase().from('estudiantes')
    .update({ nombre: nombre?.trim(), cedula: cedula?.trim(), celular: celular?.trim() || null, foto: foto || null, activo: activo ?? 1, orden: orden ?? null, actualizado_en: new Date().toISOString() })
    .eq('id', Number(id)).select().single();
  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await getSupabase().from('estudiantes').delete().eq('id', Number(id));
  return NextResponse.json({ ok: true });
}
