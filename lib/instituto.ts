import type { SupabaseClient } from '@supabase/supabase-js';

// Mantiene la lista de estudiantes del Instituto sincronizada con el don "Instituto Bíblico".
export async function sincronizarInstituto(
  sb: SupabaseClient,
  col: { nombre: string; cedula: string | null; celular: string | null; foto: string | null; dones: string[]; horario?: string | null }
) {
  if (!col.cedula) return;
  if (col.dones.includes('Instituto Bíblico')) {
    await sb.from('estudiantes').upsert(
      { nombre: col.nombre, cedula: col.cedula, celular: col.celular || null,
        foto: col.foto || null, activo: 1, horario: col.horario || '7:00 AM' },
      { onConflict: 'cedula' }
    );
  } else {
    await sb.from('estudiantes').update({ activo: 0 }).eq('cedula', col.cedula);
  }
}
