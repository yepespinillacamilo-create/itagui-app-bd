import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { fichaADb, type Ficha } from '@/lib/ficha';

// Recibe el formulario público y lo deja en la bandeja de "Pendientes por revisar".
// Nada se escribe en la ficha del colaborador hasta que un administrador lo apruebe.
export async function POST(req: NextRequest) {
  try {
    const { ficha, consentimiento } = await req.json() as { ficha: Ficha; consentimiento: boolean };
    if (!consentimiento) return NextResponse.json({ error: 'Debes autorizar el tratamiento de datos.' }, { status: 400 });

    const datos = fichaADb(ficha);
    if (!datos.cedula || datos.cedula.length < 5 || datos.cedula.length > 12) {
      return NextResponse.json({ error: 'Número de documento inválido.' }, { status: 400 });
    }
    if (!datos.primer_nombre || !datos.primer_apellido) {
      return NextResponse.json({ error: 'Faltan nombres o apellidos.' }, { status: 400 });
    }
    // Solo se aceptan fotos subidas por el propio formulario
    if (datos.foto && !datos.foto.includes('/storage/v1/object/public/fotos/solicitudes/')) datos.foto = null;
    // Los dones internos (Pastorado, Predicación…) no se auto-declaran
    const permitidos = ['Echar fuera demonios', 'Imposición de Manos', 'Profecía', 'Sanidad'];
    datos.dones = datos.dones.filter((d) => permitidos.includes(d));

    const sb = getSupabase();
    const { error } = await sb.from('solicitudes').insert({
      cedula: datos.cedula,
      datos: { ...datos, consentimiento_datos: true, consentimiento_fecha: new Date().toISOString() },
    });
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'No se pudo enviar. Intenta de nuevo.' }, { status: 500 });
  }
}
