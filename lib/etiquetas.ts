// Etiquetas y formato de cada campo, agrupados en el mismo orden que las pantallas del CEMP.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fila = Record<string, any>;

const siNo = (v: unknown) => (v === true ? 'Sí' : v === false ? 'No' : '');
const lista = (v: unknown) => (Array.isArray(v) ? v.filter(Boolean).join(', ') : '');
const mes = (v: unknown) => {
  const s = String(v ?? '');
  const m = s.match(/^(\d{4})-(\d{2})/);
  if (!m) return s;
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${meses[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
};
const conFechas = (items: unknown, fechas: unknown) =>
  Array.isArray(items)
    ? items.map((x: string) => {
        const f = fechas && typeof fechas === 'object' ? (fechas as Record<string, string>)[x] : '';
        return f ? `${x} (desde ${mes(f)})` : x;
      }).join(' · ')
    : '';

export interface CampoVista { clave: string; etiqueta: string; valor: (r: Fila) => string }
export interface SeccionVista { titulo: string; campos: CampoVista[] }

const c = (clave: string, etiqueta: string, valor?: (r: Fila) => string): CampoVista =>
  ({ clave, etiqueta, valor: valor ?? ((r) => (r[clave] === null || r[clave] === undefined ? '' : String(r[clave]))) });

export const SECCIONES: SeccionVista[] = [
  { titulo: 'Información personal', campos: [
    c('primer_nombre', 'Primer nombre'), c('segundo_nombre', 'Segundo nombre'),
    c('primer_apellido', 'Primer apellido'), c('segundo_apellido', 'Segundo apellido'),
    c('pais_nacimiento', 'País de nacimiento'), c('depto_nacimiento', 'Departamento de nacimiento'),
    c('ciudad_nacimiento', 'Ciudad de nacimiento'), c('fecha_nacimiento', 'Fecha de nacimiento'),
    c('pais_documento', 'País de expedición del documento'), c('tipo_documento', 'Tipo de documento'),
    c('cedula', 'Documento de identidad'), c('genero', 'Género'), c('nombre_preferencia', 'Nombre de preferencia'),
  ]},
  { titulo: 'Ubicación y contacto', campos: [
    c('pais_residencia', 'País de residencia'), c('ciudad_residencia', 'Ciudad de residencia'), c('direccion', 'Dirección'),
    c('indicativo', 'Indicativo'), c('celular', 'Número de teléfono'), c('email', 'Correo electrónico'),
  ]},
  { titulo: 'Información espiritual', campos: [
    c('fecha_inicio', 'Llegó a la Iglesia por primera vez', (r) => mes(r.fecha_inicio)),
    c('iglesia_inicio', 'Iglesia donde empezó a congregarse'),
    c('bautismo_es', 'Bautismo con el Espíritu Santo', (r) => siNo(r.bautismo_es)),
    c('fecha_espiritu', 'Fecha del bautismo con el Espíritu Santo', (r) => mes(r.fecha_espiritu)),
    c('fecha_congrega_actual', 'Se congrega en la Iglesia actual desde', (r) => mes(r.fecha_congrega_actual)),
    c('iglesia_actual', 'Iglesia actual'),
    c('lecturas_biblia', 'Veces que ha leído la Biblia'), c('lecturas_vivencias', 'Veces que ha leído Vivencias'),
    c('instituto_participo', 'Ha participado en el Instituto Bíblico', (r) => siNo(r.instituto_participo)),
    c('instituto_presencial_veces', 'Instituto presencial (veces)', (r) => r.instituto_presencial ? String(r.instituto_presencial_veces ?? 'Sí') : ''),
    c('instituto_audio_veces', 'Instituto por audio (veces)', (r) => r.instituto_audio ? String(r.instituto_audio_veces ?? 'Sí') : ''),
    c('es_fimlm', 'Voluntario de la FIMLM', (r) => siNo(r.es_fimlm)),
    c('es_mira', 'Voluntario de MIRA', (r) => siNo(r.es_mira)),
    c('dones', 'Dones', (r) => conFechas(r.dones, r.fechas_dones)),
  ]},
  { titulo: 'Labores en la Iglesia', campos: [
    c('labores', 'Labores activas', (r) => conFechas(r.labores, r.fechas_labores)),
    c('labores_inactivas', 'Labores inactivas', (r) => Array.isArray(r.labores_inactivas)
      ? r.labores_inactivas.map((l: Fila) => [l.labor, l.detalle].filter(Boolean).join(' — ')).join(' · ') : ''),
  ]},
  { titulo: 'Información educativa', campos: [
    c('estudios', 'Estudios', (r) => Array.isArray(r.estudios)
      ? r.estudios.map((e: Fila) => [e.nivel, e.titulo, e.estado, e.anio].filter(Boolean).join(', ')).join(' · ') : ''),
    c('idiomas', 'Idiomas', (r) => Array.isArray(r.idiomas)
      ? r.idiomas.map((i: Fila) => `${i.idioma}${i.nivel ? ` (${i.nivel})` : ''}`).join(' · ') : ''),
    c('ocupacion', 'Ocupación actual'),
  ]},
  { titulo: 'Información de salud', campos: [
    c('salud_afiliado', 'Afiliado a salud o seguro médico', (r) => siNo(r.salud_afiliado)),
    c('salud_entidad', 'Entidad o aseguradora'),
  ]},
];

export const OTROS_CAMPOS: CampoVista[] = [
  c('horario', 'Culto al que asiste'), c('observaciones', 'Observaciones'),
  c('mira', 'Roles en MIRA', (r) => lista(r.mira)), c('fimlm', 'Roles en FIMLM', (r) => lista(r.fimlm)),
  c('dia_profecia', 'Días de profecía', (r) => lista(r.dia_profecia)),
];
