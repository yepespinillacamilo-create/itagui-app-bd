import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const sb = getSupabase();
  const { searchParams } = new URL(req.url);
  const sesionId     = searchParams.get('sesion_id');
  const estudianteId = searchParams.get('estudiante_id');

  // ── Asistencias de una sesión (flujo + historial detalle) ──
  if (sesionId) {
    const { data, error } = await sb
      .from('asistencias')
      .select('id, sesion_id, estudiante_id, asistio, nota, estudiantes(nombre, cedula, celular, foto)')
      .eq('sesion_id', Number(sesionId))
      .order('id');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Aplanar el join para que el front reciba nombre/cedula/celular/foto directamente
    const flat = (data ?? []).map((a: any) => ({
      id:           a.id,
      sesion_id:    a.sesion_id,
      estudiante_id: a.estudiante_id,
      asistio:      a.asistio,
      nota:         a.nota,
      nombre:       a.estudiantes?.nombre  ?? '',
      cedula:       a.estudiantes?.cedula  ?? '',
      celular:      a.estudiantes?.celular ?? '',
      foto:         a.estudiantes?.foto    ?? null,
    }));
    return NextResponse.json(flat);
  }

  // ── Registros de un estudiante (detalle individual) ──────────
  if (estudianteId) {
    const { data } = await sb
      .from('asistencias')
      .select('id, asistio, sesiones(fecha, descripcion)')
      .eq('estudiante_id', Number(estudianteId))
      .order('id', { ascending: false });

    const flat = (data ?? []).map((a: any) => ({
      id:          a.id,
      asistio:     a.asistio,
      fecha:       a.sesiones?.fecha        ?? '',
      descripcion: a.sesiones?.descripcion  ?? '',
    }));
    return NextResponse.json(flat);
  }

  // ── Historial completo de sesiones con totales ───────────────
  const { data: sesiones } = await sb
    .from('sesiones').select('id, fecha, descripcion')
    .order('fecha', { ascending: false });

  if (!sesiones?.length) return NextResponse.json([]);

  const ids = sesiones.map((s: any) => s.id);
  const { data: asists } = await sb
    .from('asistencias').select('sesion_id, asistio').in('sesion_id', ids);

  const totales: Record<number, { total: number; asistieron: number }> = {};
  for (const a of asists ?? []) {
    if (!totales[a.sesion_id]) totales[a.sesion_id] = { total: 0, asistieron: 0 };
    totales[a.sesion_id].total++;
    if (a.asistio === 1) totales[a.sesion_id].asistieron++;
  }

  const result = sesiones.map((s: any) => ({
    id:               s.id,
    fecha:            s.fecha,
    descripcion:      s.descripcion ?? '',
    total_registros:  totales[s.id]?.total      ?? 0,
    total_asistieron: totales[s.id]?.asistieron ?? 0,
  }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const sb = getSupabase();
  const body = await req.json();

  // ── Crear sesión nueva + registrar todos los estudiantes activos ──
  if (body.fecha !== undefined && body.estudiante_id === undefined) {
    const { fecha, descripcion } = body;

    // 1. Crear la sesión
    const { data: sesion, error: e1 } = await sb
      .from('sesiones')
      .insert({ fecha, descripcion: descripcion || null })
      .select().single();
    if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

    // 2. Traer estudiantes activos (filtrar por horario si se especifica)
    const { horario_filtro } = body;
    let estudiantesQuery = sb.from('estudiantes').select('id').eq('activo', 1).order('orden').order('nombre');
    if (horario_filtro) estudiantesQuery = estudiantesQuery.eq('horario', horario_filtro);
    const { data: estudiantes } = await estudiantesQuery;

    // 3. Crear asistencia pendiente (0) para cada uno
    if (estudiantes?.length) {
      const registros = estudiantes.map((e: any) => ({
        sesion_id:     sesion.id,
        estudiante_id: e.id,
        asistio:       0,
      }));
      await sb.from('asistencias').insert(registros);
    }

    return NextResponse.json(sesion, { status: 201 });
  }

  // ── Actualizar/crear asistencia individual ────────────────────
  const { sesion_id, estudiante_id, asistio, nota } = body;
  const { data: existe } = await sb.from('asistencias')
    .select('id').eq('sesion_id', sesion_id).eq('estudiante_id', estudiante_id).maybeSingle();

  if (existe) {
    const { data } = await sb.from('asistencias')
      .update({ asistio, nota: nota || null }).eq('id', existe.id).select().single();
    return NextResponse.json(data);
  }
  const { data } = await sb.from('asistencias')
    .insert({ sesion_id, estudiante_id, asistio: asistio ?? 0, nota: nota || null })
    .select().single();
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const sb = getSupabase();
  const { searchParams } = new URL(req.url);
  const sesionId = searchParams.get('sesion_id');
  if (!sesionId) return NextResponse.json({ error: 'sesion_id requerido' }, { status: 400 });

  await sb.from('asistencias').delete().eq('sesion_id', Number(sesionId));
  await sb.from('sesiones').delete().eq('id', Number(sesionId));
  return NextResponse.json({ ok: true });
}
