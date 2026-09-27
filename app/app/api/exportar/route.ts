import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const sb = getSupabase();
    const { searchParams } = new URL(req.url);
    const fecha = searchParams.get('fecha');

    if (fecha) {
      const { data: sesiones } = await sb.from('sesiones').select('*').eq('fecha', fecha);
      if (!sesiones?.length) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
      const sesion = sesiones[0];

      const { data: rows } = await sb.from('asistencias')
        .select('asistio, registrado_en, estudiantes(nombre, cedula, celular)')
        .eq('sesion_id', sesion.id);

      const wb = XLSX.utils.book_new();
      const wsData = [
        ['Nombre', 'Cédula', 'Celular', 'Asistencia', 'Registrado'],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(rows ?? []).map((r: any) => [
          r.estudiantes?.nombre ?? '',
          r.estudiantes?.cedula ?? '',
          r.estudiantes?.celular ?? '',
          r.asistio === 1 ? 'Asistió' : 'No asistió',
          r.registrado_en ?? '',
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, `Asistencia ${fecha}`);
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="asistencia-${fecha}.xlsx"`,
        },
      });
    }

    const { data: sesionesData } = await sb.from('sesiones').select('id, fecha, descripcion').order('fecha', { ascending: false });
    const sesionIds = (sesionesData ?? []).map((s: any) => s.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const asistMap: Record<number, { total: number; asistieron: number }> = {};
    if (sesionIds.length > 0) {
      const { data: asistencias } = await sb.from('asistencias').select('sesion_id, asistio').in('sesion_id', sesionIds);
      for (const a of asistencias ?? []) {
        if (!asistMap[a.sesion_id]) asistMap[a.sesion_id] = { total: 0, asistieron: 0 };
        asistMap[a.sesion_id].total++;
        if (a.asistio === 1) asistMap[a.sesion_id].asistieron++;
      }
    }

    const wb = XLSX.utils.book_new();
    const wsData = [
      ['Fecha', 'Descripción', 'Total', 'Asistieron', 'Ausentes', '% Asistencia'],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(sesionesData ?? []).map((s: any) => {
        const m = asistMap[s.id] ?? { total: 0, asistieron: 0 };
        return [s.fecha, s.descripcion ?? '', m.total, m.asistieron, m.total - m.asistieron,
          m.total > 0 ? `${Math.round((m.asistieron / m.total) * 100)}%` : '0%'];
      }),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Historial');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="historial-asistencias.xlsx"',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al exportar' }, { status: 500 });
  }
}
