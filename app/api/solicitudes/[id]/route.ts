import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { buscarExistente } from '@/lib/buscar';
import { fusionarFicha, type FichaDb } from '@/lib/ficha';

// Aprobar o rechazar una solicitud del formulario.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { accion } = await req.json();
    const sb = getSupabase();

    const { data: sol, error: e1 } = await sb.from('solicitudes').select('*').eq('id', Number(id)).single();
    if (e1 || !sol) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    if (sol.estado !== 'pendiente') return NextResponse.json({ error: 'Esta solicitud ya fue revisada' }, { status: 400 });

    if (accion === 'rechazar') {
      await sb.from('solicitudes').update({ estado: 'rechazada', revisado_en: new Date().toISOString() }).eq('id', sol.id);
      return NextResponse.json({ ok: true });
    }
    if (accion !== 'aprobar') return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });

    const datos = sol.datos as FichaDb & { consentimiento_datos?: boolean; consentimiento_fecha?: string };
    const existente = await buscarExistente(sb, datos.cedula, datos.celular);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let guardado: any;

    if (existente) {
      const cambios = fusionarFicha(existente, datos);
      const { data, error } = await sb.from('colaboradores').update(cambios).eq('id', existente.id).select().single();
      if (error) throw error;
      guardado = data;
    } else {
      const { data, error } = await sb.from('colaboradores').insert({
        ...datos,
        nombre: datos.nombre || `${datos.primer_nombre ?? ''} ${datos.primer_apellido ?? ''}`.trim(),
        horario: datos.horario || '7:00 AM',
        mira: [], fimlm: [], dia_profecia: [], activo: 1,
        datos_actualizados_en: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      guardado = data;
    }

    await sb.from('solicitudes').update({
      estado: 'aprobada', colaborador_id: guardado.id, revisado_en: new Date().toISOString(),
    }).eq('id', sol.id);

    return NextResponse.json({ ok: true, colaborador_id: guardado.id, nuevo: !existente });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'No se pudo procesar la solicitud' }, { status: 500 });
  }
}
