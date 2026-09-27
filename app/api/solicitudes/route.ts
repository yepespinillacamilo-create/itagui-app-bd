import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { buscarExistente } from '@/lib/buscar';

// Solicitudes pendientes, cada una con la ficha actual (si la persona ya existe) para comparar.
export async function GET() {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.from('solicitudes').select('*')
      .eq('estado', 'pendiente').order('creado_en', { ascending: true });
    if (error) throw error;
    const lista = await Promise.all((data ?? []).map(async (s) => ({
      ...s,
      existente: await buscarExistente(sb, s.datos?.cedula, s.datos?.celular),
    })));
    return NextResponse.json(lista);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al cargar solicitudes' }, { status: 500 });
  }
}
