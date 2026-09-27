import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { leerTablaCemp } from '@/lib/cemp';

// Cruza la lista pegada desde el CEMP con la base de datos, por número de documento.
// Sin "aplicar": solo muestra el resumen. Con "aplicar": guarda los cambios.
export async function POST(req: NextRequest) {
  try {
    const { texto, aplicar, crearNuevos } = await req.json();
    const filas = leerTablaCemp(String(texto ?? ''));
    if (!filas.length) return NextResponse.json({ error: 'No se encontraron filas con número de documento.' }, { status: 400 });

    const sb = getSupabase();
    const { data: todos, error } = await sb.from('colaboradores')
      .select('id, nombre, cedula, celular, email, cemp_fecha_registro');
    if (error) throw error;
    const porCedula = new Map((todos ?? []).filter((c) => c.cedula).map((c) => [String(c.cedula).replace(/\D/g, ''), c]));

    const coinciden = [];
    const nuevos = [];
    for (const f of filas) {
      const c = porCedula.get(f.cedula);
      if (c) coinciden.push({ fila: f, colaborador: c });
      else nuevos.push(f);
    }

    let actualizados = 0, creados = 0;
    if (aplicar) {
      for (const { fila, colaborador } of coinciden) {
        const masNueva = fila.fecha && (!colaborador.cemp_fecha_registro || new Date(fila.fecha) > new Date(colaborador.cemp_fecha_registro));
        if (!masNueva) continue;
        await sb.from('colaboradores').update({
          cemp_fecha_registro: fila.fecha,
          cemp_registrado_por: fila.registrado_por,
          ...(colaborador.celular ? {} : fila.celular ? { celular: fila.celular } : {}),
          ...(colaborador.email ? {} : fila.email ? { email: fila.email } : {}),
        }).eq('id', colaborador.id);
        actualizados++;
      }
      if (crearNuevos) {
        for (const f of nuevos) {
          const { error: e } = await sb.from('colaboradores').insert({
            nombre: f.nombre || f.cedula, nombre_preferencia: f.nombre_preferencia || null,
            cedula: f.cedula, celular: f.celular, email: f.email, genero: f.genero,
            dones: [], labores: [], mira: [], fimlm: [], dia_profecia: [], activo: 1,
            cemp_fecha_registro: f.fecha, cemp_registrado_por: f.registrado_por,
          });
          if (!e) creados++;
        }
      }
    }

    return NextResponse.json({
      total: filas.length,
      coinciden: coinciden.map(({ fila, colaborador }) => ({
        id: colaborador.id, nombre: colaborador.nombre, cedula: fila.cedula,
        fecha: fila.fecha, registrado_por: fila.registrado_por,
        fecha_anterior: colaborador.cemp_fecha_registro,
      })),
      nuevos,
      actualizados, creados,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'No se pudo procesar la lista' }, { status: 500 });
  }
}
