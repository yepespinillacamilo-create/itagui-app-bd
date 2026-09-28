// Catálogos compartidos por toda la app.
// Los marcados como CEMP coinciden exactamente con la app oficial de la Iglesia.

export const DONES_CEMP = ['Echar fuera demonios', 'Imposición de Manos', 'Profecía', 'Sanidad'];
export const DONES_INTERNOS = ['Pastorado', 'Introducción', 'Predicación'];
export const DONES = [...DONES_CEMP, ...DONES_INTERNOS];

export const LABORES_CEMP = [
  'Acomodación', 'Aseo', 'Baños', 'Biblias', 'Casilleros', 'Enfermería',
  'Interpretación (LDS o Idiomas)', 'Llaves de la iglesia', 'Llaves grupos municipales',
  'Logística (Vigilancia)', 'Micrófono', 'Ofrenda (Grupo 1 - Recolector)', 'Ofrenda (Grupo 2)',
  'Parqueaderos', 'Protocolo de matrimonios', 'Sonido', 'Traducciones', 'Video',
];
export const LABORES = LABORES_CEMP;

// Actividades históricas (labores y dones que ya no ejerce o que ejerció en otros templos), igual que en el CEMP.
// Según el grupo cambian las preguntas: dónde la realizó y quién la postuló.
export interface GrupoActividad { grupo: string; opciones: string[]; lugar: string; postula: string }
export const ACTIVIDADES_HISTORICAS: GrupoActividad[] = [
  { grupo: 'Púlpito', lugar: 'Zona (país)', postula: 'Nombre de quien lo postula',
    opciones: ['Celebra Matrimonios', 'Guiador o introductor de culto', 'Miembro de la junta directiva', 'Ministra Bautismos',
      'Pastor de apoyo', 'Pastor encargado', 'Pastor encargado de culto', 'Supervisor', 'Visitador'] },
  { grupo: 'Dones', lugar: 'Sitio labor', postula: 'Nombre del Pastor que le indicó iniciar',
    opciones: DONES_CEMP },
  { grupo: 'Materiales', lugar: 'Sitio labor', postula: 'Nombre del Pastor que le indicó iniciar la labor',
    opciones: LABORES_CEMP },
  { grupo: 'Administrativas', lugar: 'Zona (país)', postula: 'Nombre de quien lo postula',
    opciones: ['Equipo Administrativo Departamental', 'Equipo Administrativo Municipal'] },
];
export function grupoDeActividad(actividad: string): GrupoActividad | undefined {
  return ACTIVIDADES_HISTORICAS.find((g) => g.opciones.includes(actividad));
}

export const MIRA_ROLES = ['Del. Político', 'Del. Comunicaciones', 'InfoMIRA', 'Del. Electoral', 'Del. Ideológico'];
export const FIMLM_ROLES = ['Cord. Logística', 'Coord. Gestión', 'Cord. Adm y Fcro', 'Campus', 'Otra'];
export const DIAS_PROFECIA = ['Lunes', 'Miércoles', 'Viernes', 'Según disponibilidad'];
export const HORARIOS = ['7:00 AM', '6:30 PM'];

export const TIPOS_DOCUMENTO = ['Cédula de ciudadanía', 'Cédula de extranjería', 'Pasaporte', 'Tarjeta de identidad', 'PPT / PEP'];
export const NIVELES_EDUCATIVOS = ['Primaria', 'Bachillerato', 'Técnico', 'Tecnólogo', 'Profesional', 'Especialización', 'Maestría', 'Doctorado'];
export const NIVELES_IDIOMA = ['Nativo', 'Básico', 'Intermedio', 'Avanzado'];
export const IGLESIA_ITAGUI = 'IG68 · Itagüí · Calle 51 # 40 - 159 Barrio La Cruz';
export const COMUNAS_ITAGUI = ['Comuna 1', 'Comuna 2', 'Comuna 3', 'Comuna 4', 'Comuna 5', 'Comuna 6', 'Corregimiento El Manzanillo'];

// ── Estado frente al CEMP ────────────────────────────────────
export type EstadoCemp = 'sin' | 'aldia' | 'desactualizado';

export function estadoCemp(c: { cemp_fecha_registro?: string | null; datos_actualizados_en?: string | null }): EstadoCemp {
  if (!c.cemp_fecha_registro) return 'sin';
  if (c.datos_actualizados_en && new Date(c.datos_actualizados_en) > new Date(c.cemp_fecha_registro)) return 'desactualizado';
  return 'aldia';
}

export const ESTADO_CEMP_INFO: Record<EstadoCemp, { label: string; color: string; bg: string }> = {
  sin:            { label: 'Sin registrar en CEMP', color: '#B91C1C', bg: '#FEF2F2' },
  aldia:          { label: 'Al día en CEMP',        color: '#15803D', bg: '#F0FDF4' },
  desactualizado: { label: 'Actualizar en CEMP',    color: '#B45309', bg: '#FFFBEB' },
};

export function fechaCorta(v?: string | null) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}
