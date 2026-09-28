import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const sb = getSupabase();

    // Traer todos los colaboradores y contar en código (evita problemas JSONB)
    const { data: colaboradores } = await sb
      .from('colaboradores').select('dones, mira, fimlm');

    const totalColaboradores = colaboradores?.length ?? 0;
    let imposicionManos = 0, profecia = 0, enMira = 0, enFimlm = 0;

    for (const c of colaboradores ?? []) {
      const dones  = Array.isArray(c.dones)  ? c.dones  : [];
      const mira   = Array.isArray(c.mira)   ? c.mira   : [];
      const fimlm  = Array.isArray(c.fimlm)  ? c.fimlm  : [];
      if (dones.includes('Imposición de Manos')) imposicionManos++;
      if (dones.includes('Profecía'))            profecia++;
      if (mira.length  > 0)                      enMira++;
      if (fimlm.length > 0)                      enFimlm++;
    }

    return NextResponse.json({
      totalColaboradores,
      imposicionManos,
      profecia,
      enMira,
      enFimlm,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
