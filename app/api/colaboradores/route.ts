import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const sb = getSupabase();
    const { searchParams } = new URL(req.url);
    const buscar  = searchParams.get('buscar')  || '';
    const don     = searchParams.get('don')     || '';
    const labor   = searchParams.get('labor')   || '';
    const mira    = searchParams.get('mira')    || '';
    const fimlm   = searchParams.get('fimlm')   || '';
    const horario = searchParams.get('horario') || '';

    let query = sb.from('colaboradores').select('*').order('nombre', { ascending: true });

    if (buscar)  query = query.or(`nombre.ilike.%${buscar}%,cedula.ilike.%${buscar}%,celular.ilike.%${buscar}%`);
    if (don)     query = query.contains('dones',   [don]);
    if (labor)   query = query.contains('labores', [labor]);
    if (mira)    query = query.contains('mira',    [mira]);
    if (fimlm)   query = query.contains('fimlm',   [fimlm]);
    if (horario) query = query.eq('horario', horario);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener colaboradores' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sb = getSupabase();
    const body = await req.json();
    const { nombre, cedula, celular, email, horario, foto, dones, labores, mira, fimlm,
            fecha_inicio, fecha_espiritu, fecha_profecia, observaciones, dia_profecia } = body;

    if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

    const donesArr = Array.isArray(dones) ? dones : [];

    const { data, error } = await sb.from('colaboradores').insert({
      nombre: nombre.trim(),
      cedula: cedula?.trim() || null,
      celular: celular?.trim() || null,
      email: email?.trim() || null,
      horario: horario?.trim() || null,
      foto: foto || null,
      dones:   donesArr,
      labores: Array.isArray(labores) ? labores : [],
      mira:    Array.isArray(mira)    ? mira    : [],
      fimlm:   Array.isArray(fimlm)   ? fimlm   : [],
      fecha_inicio: fecha_inicio || null,
      fecha_espiritu: fecha_espiritu || null,
      fecha_profecia: fecha_profecia || null,
      observaciones: observaciones?.trim() || null,
      dia_profecia: Array.isArray(dia_profecia) ? dia_profecia : [],
    }).select().single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al crear colaborador' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sb = getSupabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const body = await req.json();
    const { nombre, cedula, celular, email, horario, foto, dones, labores, mira, fimlm,
            fecha_inicio, fecha_espiritu, fecha_profecia, observaciones, activo, dia_profecia } = body;

    if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

    const donesArr = Array.isArray(dones) ? dones : [];

    const { data, error } = await sb.from('colaboradores').update({
      nombre: nombre.trim(),
      cedula: cedula?.trim() || null,
      celular: celular?.trim() || null,
      email: email?.trim() || null,
      horario: horario?.trim() || null,
      foto: foto || null,
      dones:   donesArr,
      labores: Array.isArray(labores) ? labores : [],
      mira:    Array.isArray(mira)    ? mira    : [],
      fimlm:   Array.isArray(fimlm)   ? fimlm   : [],
      fecha_inicio: fecha_inicio || null,
      fecha_espiritu: fecha_espiritu || null,
      fecha_profecia: fecha_profecia || null,
      observaciones: observaciones?.trim() || null,
      dia_profecia: Array.isArray(dia_profecia) ? dia_profecia : [],
      activo: activo !== undefined ? activo : 1,
    }).eq('id', Number(id)).select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sb = getSupabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const { error } = await sb.from('colaboradores').delete().eq('id', Number(id));
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
