import { IGLESIA_ITAGUI, grupoDeActividad } from './catalogos';

// ── Ficha del colaborador, tal como la maneja el formulario ──
export interface Estudio { nivel: string; titulo: string; estado: string; anio: string }
export interface Idioma { idioma: string; nivel: string }
// Actividad histórica (labor o don que ya no ejerce). `detalle` guarda el texto libre de registros anteriores.
export interface LaborInactiva {
  grupo: string; labor: string; lugar: string;
  fecha_inicio: string; fecha_fin: string;          // 'AAAA-MM'
  postula_usted: boolean; postula_nombre: string;
  detalle: string;
}

export function inactivaVacia(): LaborInactiva {
  return { grupo: '', labor: '', lugar: '', fecha_inicio: '', fecha_fin: '', postula_usted: true, postula_nombre: '', detalle: '' };
}

export interface Ficha {
  // 1. Personal
  cedula: string; tipo_documento: string; pais_documento: string;
  primer_nombre: string; segundo_nombre: string; primer_apellido: string; segundo_apellido: string;
  genero: string; fecha_nacimiento: string;
  pais_nacimiento: string; depto_nacimiento: string; ciudad_nacimiento: string;
  nombre_preferencia: string; foto: string;
  // 2. Ubicación y contacto
  indicativo: string; celular: string; email: string;
  pais_residencia: string; ciudad_residencia: string; direccion: string; barrio: string; comuna: string;
  // 3. Espiritual
  fecha_inicio: string; iglesia_inicio: string;
  bautismo_es: boolean | null; fecha_espiritu: string;
  fecha_congrega_actual: string; iglesia_actual: string; horario: string;
  lecturas_biblia: string; lecturas_vivencias: string;
  instituto_participo: boolean | null;
  instituto_presencial: boolean; instituto_presencial_veces: string;
  instituto_audio: boolean; instituto_audio_veces: string;
  es_fimlm: boolean | null; es_mira: boolean | null;
  dones: string[]; fechas_dones: Record<string, string>;
  // 4. Labores
  labores: string[]; fechas_labores: Record<string, string>; labores_inactivas: LaborInactiva[];
  // 5. Educación
  estudios: Estudio[]; idiomas: Idioma[]; ocupacion: string;
  // 6. Salud
  salud_afiliado: boolean | null; salud_entidad: string;
  // Otros
  observaciones: string;
}

export function fichaVacia(): Ficha {
  return {
    cedula: '', tipo_documento: 'Cédula de ciudadanía', pais_documento: 'Colombia',
    primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '',
    genero: '', fecha_nacimiento: '',
    pais_nacimiento: 'Colombia', depto_nacimiento: 'Antioquia', ciudad_nacimiento: '',
    nombre_preferencia: '', foto: '',
    indicativo: '+57', celular: '', email: '',
    pais_residencia: 'Colombia', ciudad_residencia: 'Itagüí', direccion: '', barrio: '', comuna: '',
    fecha_inicio: '', iglesia_inicio: IGLESIA_ITAGUI,
    bautismo_es: null, fecha_espiritu: '',
    fecha_congrega_actual: '', iglesia_actual: IGLESIA_ITAGUI, horario: '',
    lecturas_biblia: '', lecturas_vivencias: '',
    instituto_participo: null,
    instituto_presencial: false, instituto_presencial_veces: '',
    instituto_audio: false, instituto_audio_veces: '',
    es_fimlm: null, es_mira: null,
    dones: [], fechas_dones: {},
    labores: [], fechas_labores: {}, labores_inactivas: [],
    estudios: [], idiomas: [], ocupacion: '',
    salud_afiliado: null, salud_entidad: '',
    observaciones: '',
  };
}

const txt = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const mes = (v: unknown) => txt(v).slice(0, 7);             // '2014-11-09' → '2014-11'
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const obj = (v: unknown): Record<string, string> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, string>) : {};

// Completa los campos que faltan (registros antiguos solo tenían labor + detalle)
export function normalizarInactiva(l: Partial<LaborInactiva>): LaborInactiva {
  const labor = txt(l.labor);
  return {
    grupo: txt(l.grupo) || grupoDeActividad(labor)?.grupo || '',
    labor, lugar: txt(l.lugar),
    fecha_inicio: mes(l.fecha_inicio), fecha_fin: mes(l.fecha_fin),
    postula_usted: l.postula_usted !== false, postula_nombre: txt(l.postula_nombre),
    detalle: txt(l.detalle),
  };
}

// Fila de la base de datos → ficha para el formulario
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fichaDesdeDb(r: any): Ficha {
  const base = fichaVacia();
  return {
    ...base,
    cedula: txt(r.cedula), tipo_documento: txt(r.tipo_documento) || base.tipo_documento,
    pais_documento: txt(r.pais_documento) || base.pais_documento,
    primer_nombre: txt(r.primer_nombre), segundo_nombre: txt(r.segundo_nombre),
    primer_apellido: txt(r.primer_apellido), segundo_apellido: txt(r.segundo_apellido),
    genero: txt(r.genero), fecha_nacimiento: txt(r.fecha_nacimiento),
    pais_nacimiento: txt(r.pais_nacimiento) || base.pais_nacimiento,
    depto_nacimiento: txt(r.depto_nacimiento) || base.depto_nacimiento,
    ciudad_nacimiento: txt(r.ciudad_nacimiento),
    nombre_preferencia: txt(r.nombre_preferencia), foto: txt(r.foto),
    indicativo: txt(r.indicativo) || '+57', celular: txt(r.celular), email: txt(r.email),
    pais_residencia: txt(r.pais_residencia) || base.pais_residencia,
    ciudad_residencia: txt(r.ciudad_residencia) || base.ciudad_residencia,
    direccion: txt(r.direccion), barrio: txt(r.barrio), comuna: txt(r.comuna),
    fecha_inicio: mes(r.fecha_inicio), iglesia_inicio: txt(r.iglesia_inicio) || base.iglesia_inicio,
    bautismo_es: r.bautismo_es ?? (r.fecha_espiritu ? true : null), fecha_espiritu: mes(r.fecha_espiritu),
    fecha_congrega_actual: mes(r.fecha_congrega_actual),
    iglesia_actual: txt(r.iglesia_actual) || base.iglesia_actual, horario: txt(r.horario),
    lecturas_biblia: txt(r.lecturas_biblia), lecturas_vivencias: txt(r.lecturas_vivencias),
    instituto_participo: r.instituto_participo ?? null,
    instituto_presencial: !!r.instituto_presencial, instituto_presencial_veces: txt(r.instituto_presencial_veces),
    instituto_audio: !!r.instituto_audio, instituto_audio_veces: txt(r.instituto_audio_veces),
    es_fimlm: r.es_fimlm ?? (arr(r.fimlm).length ? true : null),
    es_mira: r.es_mira ?? (arr(r.mira).length ? true : null),
    dones: arr<string>(r.dones),
    fechas_dones: { ...(r.fecha_profecia ? { 'Profecía': mes(r.fecha_profecia) } : {}), ...obj(r.fechas_dones) },
    labores: arr<string>(r.labores), fechas_labores: obj(r.fechas_labores),
    labores_inactivas: arr<Partial<LaborInactiva>>(r.labores_inactivas).map(normalizarInactiva),
    estudios: arr<Estudio>(r.estudios), idiomas: arr<Idioma>(r.idiomas), ocupacion: txt(r.ocupacion),
    salud_afiliado: r.salud_afiliado ?? null, salud_entidad: txt(r.salud_entidad),
    observaciones: txt(r.observaciones),
  };
}

const limpio = (v: string) => (v?.trim() ? v.trim() : null);
const numero = (v: string) => {
  const n = parseInt(String(v ?? '').replace(/\D/g, ''), 10);
  return isNaN(n) ? null : n;
};

export function nombreCompleto(f: Pick<Ficha, 'primer_nombre' | 'segundo_nombre' | 'primer_apellido' | 'segundo_apellido'>) {
  return [f.primer_nombre, f.segundo_nombre, f.primer_apellido, f.segundo_apellido]
    .map((x) => (x || '').trim()).filter(Boolean).join(' ');
}

export function soloDigitos(v: string | null | undefined) {
  return String(v ?? '').replace(/\D/g, '');
}

// Ficha del formulario → columnas de la base de datos (sin campos internos como MIRA roles u horario de profecía)
export function fichaADb(f: Ficha) {
  const fechasDones = Object.fromEntries(Object.entries(f.fechas_dones || {}).filter(([k, v]) => v && f.dones.includes(k)));
  const fechasLabores = Object.fromEntries(Object.entries(f.fechas_labores || {}).filter(([k, v]) => v && f.labores.includes(k)));
  return {
    cedula: soloDigitos(f.cedula) || null,
    tipo_documento: limpio(f.tipo_documento), pais_documento: limpio(f.pais_documento),
    primer_nombre: limpio(f.primer_nombre), segundo_nombre: limpio(f.segundo_nombre),
    primer_apellido: limpio(f.primer_apellido), segundo_apellido: limpio(f.segundo_apellido),
    nombre: nombreCompleto(f) || null,
    genero: limpio(f.genero), fecha_nacimiento: limpio(f.fecha_nacimiento),
    pais_nacimiento: limpio(f.pais_nacimiento), depto_nacimiento: limpio(f.depto_nacimiento),
    ciudad_nacimiento: limpio(f.ciudad_nacimiento), nombre_preferencia: limpio(f.nombre_preferencia),
    foto: limpio(f.foto),
    indicativo: limpio(f.indicativo), celular: soloDigitos(f.celular) || null, email: limpio(f.email),
    pais_residencia: limpio(f.pais_residencia), ciudad_residencia: limpio(f.ciudad_residencia),
    direccion: limpio(f.direccion), barrio: limpio(f.barrio), comuna: limpio(f.comuna),
    fecha_inicio: limpio(f.fecha_inicio), iglesia_inicio: limpio(f.iglesia_inicio),
    bautismo_es: f.bautismo_es, fecha_espiritu: f.bautismo_es === false ? null : limpio(f.fecha_espiritu),
    fecha_congrega_actual: limpio(f.fecha_congrega_actual), iglesia_actual: limpio(f.iglesia_actual),
    horario: limpio(f.horario),
    lecturas_biblia: numero(f.lecturas_biblia), lecturas_vivencias: numero(f.lecturas_vivencias),
    instituto_participo: f.instituto_participo,
    instituto_presencial: f.instituto_participo ? f.instituto_presencial : f.instituto_participo === false ? false : null,
    instituto_presencial_veces: f.instituto_participo && f.instituto_presencial ? numero(f.instituto_presencial_veces) : null,
    instituto_audio: f.instituto_participo ? f.instituto_audio : f.instituto_participo === false ? false : null,
    instituto_audio_veces: f.instituto_participo && f.instituto_audio ? numero(f.instituto_audio_veces) : null,
    es_fimlm: f.es_fimlm, es_mira: f.es_mira,
    dones: f.dones, fechas_dones: fechasDones,
    fecha_profecia: fechasDones['Profecía'] || null,
    labores: f.labores, fechas_labores: fechasLabores,
    labores_inactivas: (f.labores_inactivas || []).filter((l) => l.labor?.trim()).map((l) => {
      const n = normalizarInactiva(l);
      return { ...n, grupo: grupoDeActividad(n.labor)?.grupo || n.grupo, postula_nombre: n.postula_usted ? '' : n.postula_nombre.trim() };
    }),
    estudios: (f.estudios || []).filter((e) => e.nivel || e.titulo),
    idiomas: (f.idiomas || []).filter((i) => i.idioma?.trim()),
    ocupacion: limpio(f.ocupacion),
    salud_afiliado: f.salud_afiliado, salud_entidad: f.salud_afiliado === false ? null : limpio(f.salud_entidad),
    observaciones: limpio(f.observaciones),
  };
}

export type FichaDb = ReturnType<typeof fichaADb>;

// ── Fusión de una actualización con la ficha existente ───────
// Reglas: lo nuevo que venga lleno reemplaza; lo vacío nunca borra;
// dones y labores se suman; observaciones se agregan al final, nunca se reemplazan.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fusionarFicha(existente: any, nueva: FichaDb) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: Record<string, any> = {};
  const unir = (a: unknown, b: unknown) => Array.from(new Set([...arr<string>(a), ...arr<string>(b)]));
  const unirObjs = <T,>(a: unknown, b: unknown, clave: (x: T) => string) => {
    const mapa = new Map<string, T>();
    [...arr<T>(a), ...arr<T>(b)].forEach((x) => mapa.set(clave(x).toLowerCase(), x));
    return Array.from(mapa.values());
  };

  for (const [k, v] of Object.entries(nueva)) {
    if (k === 'dones' || k === 'labores') { out[k] = unir(existente[k], v); continue; }
    if (k === 'fechas_dones' || k === 'fechas_labores') { out[k] = { ...obj(existente[k]), ...obj(v) }; continue; }
    if (k === 'labores_inactivas') { out[k] = unirObjs<LaborInactiva>(existente[k], v, (x) => `${x.labor}|${x.fecha_inicio ?? ''}`); continue; }
    if (k === 'estudios') { out[k] = unirObjs<Estudio>(existente[k], v, (x) => `${x.nivel}|${x.titulo}`); continue; }
    if (k === 'idiomas') { out[k] = unirObjs<Idioma>(existente[k], v, (x) => x.idioma); continue; }
    if (k === 'observaciones') {
      const antes = txt(existente.observaciones).trim();
      const nuevo = txt(v).trim();
      out[k] = !nuevo ? (antes || null) : !antes ? nuevo : antes.includes(nuevo) ? antes : `${antes}; ${nuevo}`;
      continue;
    }
    if (v === null || v === undefined || v === '') continue;   // vacío no borra
    out[k] = v;
  }
  if (!out.nombre) delete out.nombre;
  return out;
}
