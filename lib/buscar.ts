import type { SupabaseClient } from '@supabase/supabase-js';

// Busca un colaborador por cédula; si no la tiene registrada, por celular.
export async function buscarExistente(sb: SupabaseClient, cedula?: string | null, celular?: string | null) {
  if (cedula) {
    const { data } = await sb.from('colaboradores').select('*').eq('cedula', cedula).limit(1);
    if (data?.length) return data[0];
  }
  if (celular) {
    const { data } = await sb.from('colaboradores').select('*').eq('celular', celular).is('cedula', null).limit(1);
    if (data?.length) return data[0];
  }
  return null;
}
