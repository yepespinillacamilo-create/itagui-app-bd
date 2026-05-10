import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const sb = getSupabase();

    // Traer estudiantes
    const { data: estudiantes, error } = await sb
      .from('estudiantes').select('*')
      .order('orden', { ascending: true, nullsFirst: false })
      .order('nombre', { ascending: true });
    if (error) throw error;
    if (!estudiantes?.length) return NextResponse.json([]);

    // Contar asistencias por estudiante
    const ids = estudiantes.map((e: any) => e.id);
    const { data: asists } = await sb
      .from('asistencias').select('estudiante_id, asistio').in('estudiante_id', ids);

    const stats: Record<number, { asistencias: number; faltas: number }> = {};
    for (const a of asists ?? []) {
      if (!stats[a.estudiante_id]) stats[a.estudiante_id] = { asistencias: 0, faltas: 0 };
      if (a.asistio === 1)  stats[a.estudiante_id].asistencias++;
      if (a.asistio === -1) stats[a.estudiante_id].faltas++;
    }

    const result = estudiantes.map((e: any) => ({
      ...e,
      total_asistencias: stats[e.id]?.asistencias ?? 0,
      total_faltas:      stats[e.id]?.faltas      ?? 0,
    }));

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sb = getSupabase();
    const { nombre, cedula, celular, foto, activo } = await req.json();
    if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    const { data, error } = await sb.from('estudiantes')
      .insert({ nombre: nombre.trim(), cedula: cedula?.trim(), celular: celular?.trim() || null, foto: foto || null, activo: activo ?? 1 })
      .select().single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Ya existe un estudiante con esa cédula' }, { status: 400 });
      throw error;
    }
    return NextResponse.json({ ...data, total_asistencias: 0, total_faltas: 0 }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al crear' }, { status: 500 });
  }
}
