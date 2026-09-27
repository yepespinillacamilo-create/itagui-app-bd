// Lee el texto copiado de la tabla de colaboradores del CEMP (seleccionar filas → Ctrl+C → pegar).
// Funciona tanto si llega separado por tabulaciones como en varias líneas por fila.

export interface FilaCemp {
  cedula: string;
  nombre: string;             // sin "Hno./Hna."
  nombre_preferencia: string; // tal como aparece en el CEMP
  genero: string | null;
  celular: string | null;
  email: string | null;
  registrado_por: string | null;
  fecha: string | null;       // ISO
}

export function leerTablaCemp(texto: string): FilaCemp[] {
  const lineas = texto.replace(/\r/g, '').split('\n');
  const bloques: string[] = [];
  for (const l of lineas) {
    if (/^\s*\d{5,12}(\s|\t|$)/.test(l)) bloques.push(l);
    else if (bloques.length && l.trim()) bloques[bloques.length - 1] += '\t' + l;
  }

  const filas: FilaCemp[] = [];
  const vistos = new Set<string>();
  for (const b of bloques) {
    const cedula = b.trim().match(/^\d{5,12}/)![0];
    if (vistos.has(cedula)) continue;
    vistos.add(cedula);

    const celdas = b.split('\t').map((x) => x.trim()).filter(Boolean);
    const personas = celdas.flatMap((x) => x.match(/\b(Hno|Hna)\.\s*[^\t]+/g) ?? []).map((x) => x.trim());
    const pref = personas[0] ?? '';
    const registrado = personas.length > 1 ? personas[personas.length - 1] : null;

    const fechas = [...b.matchAll(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/g)];
    const f = fechas[fechas.length - 1];
    const fecha = f
      ? new Date(`${f[3]}-${f[2].padStart(2, '0')}-${f[1].padStart(2, '0')}T${(f[4] ?? '12').padStart(2, '0')}:${f[5] ?? '00'}:00-05:00`).toISOString()
      : null;

    const email = b.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/)?.[0] ?? null;
    const tel = b.replace(cedula, '').match(/(?:\+?57[\s-]*)?(3[\d\s-]{9,12})/);
    const celular = tel ? tel[1].replace(/\D/g, '').slice(0, 10) : null;

    filas.push({
      cedula,
      nombre: pref.replace(/^(Hno|Hna)\.\s*/, '').trim(),
      nombre_preferencia: pref,
      genero: pref.startsWith('Hna') ? 'Femenino' : pref.startsWith('Hno') ? 'Masculino' : null,
      celular: celular && celular.length === 10 ? celular : null,
      email,
      registrado_por: registrado,
      fecha,
    });
  }
  return filas;
}
