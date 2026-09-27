'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from 'lucide-react';
import FotoInput from '@/components/FotoInput';
import {
  DONES, DONES_CEMP, LABORES_CEMP, LABORES_INTERNAS, HORARIOS,
  TIPOS_DOCUMENTO, NIVELES_EDUCATIVOS, NIVELES_IDIOMA,
} from '@/lib/catalogos';
import type { Ficha } from '@/lib/ficha';

const PASOS = [
  { titulo: 'Información personal', sub: 'Datos básicos' },
  { titulo: 'Ubicación y contacto', sub: 'Teléfono y correo' },
  { titulo: 'Información espiritual', sub: 'Dones y acontecimientos' },
  { titulo: 'Labores en la Iglesia', sub: 'Ofrenda, sonido, otros' },
  { titulo: 'Información educativa', sub: 'Estudios e idiomas' },
  { titulo: 'Información de salud', sub: 'Seguro médico' },
];

const inputCls = 'w-full border rounded-xl px-3 py-2.5 text-[15px] outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition';
const inputStyle = { borderColor: '#D1D5DB', color: '#111827' };

function Campo({ label, ayuda, children, requerido }: { label: string; ayuda?: string; children: React.ReactNode; requerido?: boolean }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
        {label}{requerido && <span style={{ color: '#DC2626' }}> *</span>}
      </span>
      {children}
      {ayuda && <span className="block text-xs mt-1 leading-relaxed" style={{ color: '#6B7280' }}>{ayuda}</span>}
    </label>
  );
}

function SiNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="inline-flex rounded-xl border overflow-hidden" style={{ borderColor: '#D1D5DB' }}>
      {[true, false].map((v) => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className="px-6 py-2 text-sm font-semibold transition-colors"
          style={value === v
            ? { backgroundColor: '#1E3A8A', color: '#fff' }
            : { backgroundColor: '#fff', color: '#6B7280' }}>
          {v ? 'Sí' : 'No'}
        </button>
      ))}
    </div>
  );
}

function Pregunta({ texto, children }: { texto: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" style={{ color: '#374151' }}>{texto}</p>
      {children}
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-base font-semibold pb-2 border-b" style={{ color: '#1E3A8A', borderColor: '#E5E7EB' }}>{titulo}</h3>
      {children}
    </section>
  );
}

// Lista de opciones con fecha "desde" para las que estén marcadas (dones y labores)
function OpcionesConFecha({ opciones, seleccion, fechas, onToggle, onFecha }: {
  opciones: string[]; seleccion: string[]; fechas: Record<string, string>;
  onToggle: (o: string) => void; onFecha: (o: string, v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {opciones.map((o) => {
        const activo = seleccion.includes(o);
        return (
          <div key={o} className="rounded-xl border transition-colors"
            style={{ borderColor: activo ? '#1E3A8A' : '#E5E7EB', backgroundColor: activo ? '#EFF6FF' : '#fff' }}>
            <button type="button" onClick={() => onToggle(o)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left">
              <span className="w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0"
                style={activo ? { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' } : { borderColor: '#9CA3AF' }}>
                {activo && <Check size={13} className="text-white" />}
              </span>
              <span className="text-[15px]" style={{ color: '#111827' }}>{o}</span>
            </button>
            {activo && (
              <div className="px-3 pb-3 pl-11">
                <span className="block text-xs mb-1" style={{ color: '#6B7280' }}>¿Desde cuándo? (año y mes, aproximado)</span>
                <input type="month" value={fechas[o] || ''} onChange={(e) => onFecha(o, e.target.value)}
                  className={inputCls} style={{ ...inputStyle, maxWidth: 220 }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface Props {
  inicial: Ficha;
  modo: 'publico' | 'admin';
  onEnviar: (f: Ficha) => Promise<void>;
  textoEnviar?: string;
}

export default function FormularioCemp({ inicial, modo, onEnviar, textoEnviar = 'Enviar' }: Props) {
  const [f, setF] = useState<Ficha>(inicial);
  const [paso, setPaso] = useState(0);
  const [maxPaso, setMaxPaso] = useState(modo === 'admin' ? PASOS.length - 1 : 0);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const set = <K extends keyof Ficha>(k: K, v: Ficha[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const toggle = (k: 'dones' | 'labores', v: string) =>
    setF((prev) => ({ ...prev, [k]: prev[k].includes(v) ? prev[k].filter((x) => x !== v) : [...prev[k], v] }));

  const sugerido = [f.genero === 'Femenino' ? 'Hna.' : f.genero === 'Masculino' ? 'Hno.' : '', f.primer_nombre.trim(), f.primer_apellido.trim()]
    .filter(Boolean).join(' ');

  function validar(p: number): string {
    if (p === 0) {
      if (!f.cedula.replace(/\D/g, '')) return 'Escribe el número de documento.';
      if (!f.primer_nombre.trim() || !f.primer_apellido.trim()) return 'Escribe al menos el primer nombre y el primer apellido.';
      if (modo === 'publico' && !f.genero) return 'Selecciona el género.';
    }
    if (p === 1 && modo === 'publico' && !f.celular.replace(/\D/g, '')) return 'Escribe el número de celular.';
    if (p === 2 && modo === 'publico' && !f.horario) return 'Selecciona el culto al que asistes normalmente.';
    return '';
  }

  function ir(destino: number) {
    if (destino > paso) {
      for (let p = paso; p < destino; p++) {
        const e = validar(p);
        if (e) { setError(e); setPaso(p); return; }
      }
    }
    setError('');
    setPaso(destino);
    setMaxPaso((m) => Math.max(m, destino));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function enviar() {
    for (let p = 0; p < PASOS.length; p++) {
      const e = validar(p);
      if (e) { setError(e); setPaso(p); return; }
    }
    setEnviando(true); setError('');
    try {
      await onEnviar({ ...f, nombre_preferencia: f.nombre_preferencia.trim() || sugerido });
    } catch (e) {
      setError((e as Error).message || 'No se pudo guardar');
    } finally {
      setEnviando(false);
    }
  }

  const donesVisibles = modo === 'admin' ? DONES : DONES_CEMP;
  const ultimo = paso === PASOS.length - 1;

  return (
    <div className="md:grid md:grid-cols-[220px_1fr] md:gap-8">
      {/* Pasos */}
      <nav className="mb-5 md:mb-0">
        <div className="flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0 md:sticky md:top-4">
          {PASOS.map((p, i) => {
            const activo = i === paso;
            const habilitado = i <= maxPaso;
            return (
              <button key={p.titulo} type="button" disabled={!habilitado} onClick={() => ir(i)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left flex-shrink-0 transition-colors disabled:opacity-40"
                style={{ backgroundColor: activo ? '#1E3A8A' : 'transparent' }}>
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={activo ? { backgroundColor: '#C8A24A', color: '#fff' }
                    : i < maxPaso || (modo === 'admin' && !activo) ? { backgroundColor: '#DBEAFE', color: '#1E3A8A' }
                    : { backgroundColor: '#E5E7EB', color: '#6B7280' }}>
                  {i + 1}
                </span>
                <span className="hidden md:block">
                  <span className="block text-sm font-semibold leading-tight" style={{ color: activo ? '#fff' : '#1F2937' }}>{p.titulo}</span>
                  <span className="block text-xs" style={{ color: activo ? '#BFDBFE' : '#6B7280' }}>{p.sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Contenido del paso */}
      <div className="bg-white rounded-3xl shadow-sm border p-5 sm:p-7" style={{ borderColor: '#E5E7EB' }}>
        <p className="text-xs font-medium mb-1" style={{ color: '#C8A24A' }}>Paso {paso + 1} de {PASOS.length}</p>
        <h2 className="text-xl font-bold mb-6" style={{ color: '#1F2937' }}>{PASOS[paso].titulo}</h2>

        <div className="space-y-8">
          {paso === 0 && (
            <>
              <Bloque titulo="Documento de identidad">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Campo label="Número de documento" requerido>
                    <input inputMode="numeric" className={inputCls} style={inputStyle} value={f.cedula}
                      onChange={(e) => set('cedula', e.target.value)} />
                  </Campo>
                  <Campo label="Tipo de documento">
                    <select className={inputCls} style={inputStyle} value={f.tipo_documento}
                      onChange={(e) => set('tipo_documento', e.target.value)}>
                      {TIPOS_DOCUMENTO.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </Campo>
                  <Campo label="País de expedición">
                    <input className={inputCls} style={inputStyle} value={f.pais_documento}
                      onChange={(e) => set('pais_documento', e.target.value)} />
                  </Campo>
                </div>
              </Bloque>
              <Bloque titulo="Foto">
                <FotoInput value={f.foto} onChange={(url) => set('foto', url)}
                  endpoint={modo === 'publico' ? '/api/registro/foto' : '/api/subir-foto'}
                  cedula={modo === 'admin' ? f.cedula : undefined} />
              </Bloque>
              <Bloque titulo="Nombres">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Campo label="Primer nombre" requerido>
                    <input className={inputCls} style={inputStyle} value={f.primer_nombre} onChange={(e) => set('primer_nombre', e.target.value)} />
                  </Campo>
                  <Campo label="Segundo nombre">
                    <input className={inputCls} style={inputStyle} value={f.segundo_nombre} onChange={(e) => set('segundo_nombre', e.target.value)} />
                  </Campo>
                  <Campo label="Primer apellido" requerido>
                    <input className={inputCls} style={inputStyle} value={f.primer_apellido} onChange={(e) => set('primer_apellido', e.target.value)} />
                  </Campo>
                  <Campo label="Segundo apellido">
                    <input className={inputCls} style={inputStyle} value={f.segundo_apellido} onChange={(e) => set('segundo_apellido', e.target.value)} />
                  </Campo>
                </div>
                <Pregunta texto="Género">
                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    {['Masculino', 'Femenino'].map((g) => (
                      <button key={g} type="button" onClick={() => set('genero', g)}
                        className="py-3 rounded-xl border text-sm font-semibold transition-colors"
                        style={f.genero === g ? { borderColor: '#1E3A8A', backgroundColor: '#EFF6FF', color: '#1E3A8A' }
                          : { borderColor: '#D1D5DB', color: '#4B5563' }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </Pregunta>
                <Campo label="Nombre de preferencia" ayuda="Así aparecerá en el CEMP. Si lo dejas vacío usamos el sugerido.">
                  <input className={inputCls} style={inputStyle} value={f.nombre_preferencia} placeholder={sugerido}
                    onChange={(e) => set('nombre_preferencia', e.target.value)} />
                </Campo>
              </Bloque>
              <Bloque titulo="Nacimiento">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Campo label="Fecha de nacimiento">
                    <input type="date" className={inputCls} style={inputStyle} value={f.fecha_nacimiento}
                      onChange={(e) => set('fecha_nacimiento', e.target.value)} />
                  </Campo>
                  <Campo label="País de nacimiento">
                    <input className={inputCls} style={inputStyle} value={f.pais_nacimiento} onChange={(e) => set('pais_nacimiento', e.target.value)} />
                  </Campo>
                  <Campo label="Departamento de nacimiento">
                    <input className={inputCls} style={inputStyle} value={f.depto_nacimiento} onChange={(e) => set('depto_nacimiento', e.target.value)} />
                  </Campo>
                  <Campo label="Ciudad de nacimiento">
                    <input className={inputCls} style={inputStyle} value={f.ciudad_nacimiento} onChange={(e) => set('ciudad_nacimiento', e.target.value)} />
                  </Campo>
                </div>
              </Bloque>
            </>
          )}

          {paso === 1 && (
            <>
              <Bloque titulo="Contacto">
                <div className="grid grid-cols-[110px_1fr] gap-3">
                  <Campo label="Indicativo">
                    <input className={inputCls} style={inputStyle} value={f.indicativo} onChange={(e) => set('indicativo', e.target.value)} />
                  </Campo>
                  <Campo label="Número de celular" requerido={modo === 'publico'}>
                    <input inputMode="tel" className={inputCls} style={inputStyle} value={f.celular} onChange={(e) => set('celular', e.target.value)} />
                  </Campo>
                </div>
                <Campo label="Correo electrónico">
                  <input type="email" inputMode="email" className={inputCls} style={inputStyle} value={f.email}
                    onChange={(e) => set('email', e.target.value)} />
                </Campo>
              </Bloque>
              <Bloque titulo="Lugar de residencia">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Campo label="País">
                    <input className={inputCls} style={inputStyle} value={f.pais_residencia} onChange={(e) => set('pais_residencia', e.target.value)} />
                  </Campo>
                  <Campo label="Ciudad o municipio">
                    <input className={inputCls} style={inputStyle} value={f.ciudad_residencia} onChange={(e) => set('ciudad_residencia', e.target.value)} />
                  </Campo>
                </div>
                <Campo label="Dirección">
                  <input className={inputCls} style={inputStyle} value={f.direccion} onChange={(e) => set('direccion', e.target.value)} />
                </Campo>
              </Bloque>
            </>
          )}

          {paso === 2 && (
            <>
              <Bloque titulo="Inicios en la Iglesia">
                <Campo label="¿Cuándo llegó a la Iglesia por primera vez?" ayuda="Año y mes. Si no lo recuerda, la fecha más aproximada posible.">
                  <input type="month" className={inputCls} style={{ ...inputStyle, maxWidth: 220 }} value={f.fecha_inicio}
                    onChange={(e) => set('fecha_inicio', e.target.value)} />
                </Campo>
                <Campo label="Iglesia donde empezó a congregarse">
                  <input className={inputCls} style={inputStyle} value={f.iglesia_inicio} onChange={(e) => set('iglesia_inicio', e.target.value)} />
                </Campo>
                <Pregunta texto="¿Tiene el bautismo con el Espíritu Santo?">
                  <SiNo value={f.bautismo_es} onChange={(v) => set('bautismo_es', v)} />
                </Pregunta>
                {f.bautismo_es && (
                  <Campo label="¿Cuándo lo recibió?" ayuda="Año y mes aproximado.">
                    <input type="month" className={inputCls} style={{ ...inputStyle, maxWidth: 220 }} value={f.fecha_espiritu}
                      onChange={(e) => set('fecha_espiritu', e.target.value)} />
                  </Campo>
                )}
              </Bloque>

              <Bloque titulo="Congregación actual">
                <Campo label="¿Desde cuándo se congrega en esta Iglesia?">
                  <input type="month" className={inputCls} style={{ ...inputStyle, maxWidth: 220 }} value={f.fecha_congrega_actual}
                    onChange={(e) => set('fecha_congrega_actual', e.target.value)} />
                </Campo>
                <Campo label="Iglesia donde se congrega actualmente">
                  <input className={inputCls} style={inputStyle} value={f.iglesia_actual} onChange={(e) => set('iglesia_actual', e.target.value)} />
                </Campo>
                <Pregunta texto={`Culto al que asiste normalmente${modo === 'publico' ? ' *' : ''}`}>
                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    {HORARIOS.map((h) => (
                      <button key={h} type="button" onClick={() => set('horario', h)}
                        className="py-3 rounded-xl border text-sm font-semibold transition-colors"
                        style={f.horario === h ? { borderColor: '#1E3A8A', backgroundColor: '#EFF6FF', color: '#1E3A8A' }
                          : { borderColor: '#D1D5DB', color: '#4B5563' }}>
                        {h === '7:00 AM' ? '☀️ 7:00 AM' : '🌙 6:30 PM'}
                      </button>
                    ))}
                  </div>
                </Pregunta>
              </Bloque>

              <Bloque titulo="Lecturas">
                <div className="grid grid-cols-2 gap-4">
                  <Campo label="Veces que ha leído la Biblia">
                    <input inputMode="numeric" className={inputCls} style={inputStyle} value={f.lecturas_biblia}
                      onChange={(e) => set('lecturas_biblia', e.target.value)} />
                  </Campo>
                  <Campo label="Veces que ha leído Vivencias">
                    <input inputMode="numeric" className={inputCls} style={inputStyle} value={f.lecturas_vivencias}
                      onChange={(e) => set('lecturas_vivencias', e.target.value)} />
                  </Campo>
                </div>
                <p className="text-xs" style={{ color: '#6B7280' }}>Si no lo recuerda, escriba un número aproximado.</p>
              </Bloque>

              <Bloque titulo="Instituto Bíblico">
                <Pregunta texto="¿Ha participado en el Instituto Bíblico?">
                  <SiNo value={f.instituto_participo} onChange={(v) => set('instituto_participo', v)} />
                </Pregunta>
                {f.instituto_participo && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {([
                      ['instituto_presencial', 'instituto_presencial_veces', 'Presencial'],
                      ['instituto_audio', 'instituto_audio_veces', 'Por audio'],
                    ] as const).map(([k, kv, label]) => (
                      <div key={k} className="rounded-xl border p-3 space-y-2" style={{ borderColor: f[k] ? '#1E3A8A' : '#E5E7EB' }}>
                        <button type="button" onClick={() => set(k, !f[k])} className="flex items-center gap-2 text-[15px]">
                          <span className="w-5 h-5 rounded-md border flex items-center justify-center"
                            style={f[k] ? { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' } : { borderColor: '#9CA3AF' }}>
                            {f[k] && <Check size={13} className="text-white" />}
                          </span>
                          {label}
                        </button>
                        {f[k] && (
                          <input inputMode="numeric" placeholder="¿Cuántas veces?" className={inputCls} style={inputStyle}
                            value={f[kv]} onChange={(e) => set(kv, e.target.value)} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Bloque>

              <Bloque titulo="Voluntariado">
                <div className="grid sm:grid-cols-2 gap-5">
                  <Pregunta texto="¿Es voluntario de la FIMLM?">
                    <SiNo value={f.es_fimlm} onChange={(v) => set('es_fimlm', v)} />
                  </Pregunta>
                  <Pregunta texto="¿Es voluntario de MIRA?">
                    <SiNo value={f.es_mira} onChange={(v) => set('es_mira', v)} />
                  </Pregunta>
                </div>
              </Bloque>

              <Bloque titulo="Dones">
                <p className="text-sm -mt-1" style={{ color: '#6B7280' }}>Marque los dones que ministra actualmente en esta Iglesia.</p>
                <OpcionesConFecha opciones={donesVisibles} seleccion={f.dones} fechas={f.fechas_dones}
                  onToggle={(o) => toggle('dones', o)}
                  onFecha={(o, v) => set('fechas_dones', { ...f.fechas_dones, [o]: v })} />
              </Bloque>
            </>
          )}

          {paso === 3 && (
            <>
              <Bloque titulo="Labores activas">
                <p className="text-sm -mt-1" style={{ color: '#6B7280' }}>Solo las que realiza actualmente en la Iglesia donde se congrega.</p>
                <OpcionesConFecha opciones={LABORES_CEMP} seleccion={f.labores} fechas={f.fechas_labores}
                  onToggle={(o) => toggle('labores', o)}
                  onFecha={(o, v) => set('fechas_labores', { ...f.fechas_labores, [o]: v })} />
                <p className="text-sm font-medium pt-2" style={{ color: '#374151' }}>Otras labores de esta sede</p>
                <OpcionesConFecha opciones={LABORES_INTERNAS} seleccion={f.labores} fechas={f.fechas_labores}
                  onToggle={(o) => toggle('labores', o)}
                  onFecha={(o, v) => set('fechas_labores', { ...f.fechas_labores, [o]: v })} />
              </Bloque>
              <Bloque titulo="Labores inactivas">
                <p className="text-sm -mt-1" style={{ color: '#6B7280' }}>Labores que realizó en otras sedes o que ya no ejerce.</p>
                {f.labores_inactivas.map((l, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                    <select className={inputCls} style={inputStyle} value={l.labor}
                      onChange={(e) => set('labores_inactivas', f.labores_inactivas.map((x, j) => j === i ? { ...x, labor: e.target.value } : x))}>
                      <option value="">Labor…</option>
                      {[...LABORES_CEMP, ...DONES_CEMP].map((o) => <option key={o}>{o}</option>)}
                    </select>
                    <input className={inputCls} style={inputStyle} placeholder="Dónde / hasta cuándo" value={l.detalle}
                      onChange={(e) => set('labores_inactivas', f.labores_inactivas.map((x, j) => j === i ? { ...x, detalle: e.target.value } : x))} />
                    <button type="button" onClick={() => set('labores_inactivas', f.labores_inactivas.filter((_, j) => j !== i))}
                      className="p-2.5 rounded-xl hover:bg-red-50"><Trash2 size={18} style={{ color: '#DC2626' }} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => set('labores_inactivas', [...f.labores_inactivas, { labor: '', detalle: '' }])}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#1E3A8A' }}>
                  <Plus size={16} /> Agregar labor inactiva
                </button>
              </Bloque>
            </>
          )}

          {paso === 4 && (
            <>
              <Bloque titulo="Estudios">
                {f.estudios.map((e, i) => (
                  <div key={i} className="rounded-2xl border p-3 space-y-3" style={{ borderColor: '#E5E7EB' }}>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <select className={inputCls} style={inputStyle} value={e.nivel}
                        onChange={(ev) => set('estudios', f.estudios.map((x, j) => j === i ? { ...x, nivel: ev.target.value } : x))}>
                        <option value="">Nivel educativo…</option>
                        {NIVELES_EDUCATIVOS.map((n) => <option key={n}>{n}</option>)}
                      </select>
                      <input className={inputCls} style={inputStyle} placeholder="Título obtenido" value={e.titulo}
                        onChange={(ev) => set('estudios', f.estudios.map((x, j) => j === i ? { ...x, titulo: ev.target.value } : x))} />
                      <select className={inputCls} style={inputStyle} value={e.estado}
                        onChange={(ev) => set('estudios', f.estudios.map((x, j) => j === i ? { ...x, estado: ev.target.value } : x))}>
                        <option>Terminado</option><option>En formación</option>
                      </select>
                      <input inputMode="numeric" className={inputCls} style={inputStyle} placeholder="Año" value={e.anio}
                        onChange={(ev) => set('estudios', f.estudios.map((x, j) => j === i ? { ...x, anio: ev.target.value } : x))} />
                    </div>
                    <button type="button" onClick={() => set('estudios', f.estudios.filter((_, j) => j !== i))}
                      className="text-sm inline-flex items-center gap-1" style={{ color: '#DC2626' }}><Trash2 size={14} /> Quitar</button>
                  </div>
                ))}
                <button type="button" onClick={() => set('estudios', [...f.estudios, { nivel: '', titulo: '', estado: 'Terminado', anio: '' }])}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#1E3A8A' }}>
                  <Plus size={16} /> Agregar estudio
                </button>
              </Bloque>
              <Bloque titulo="Idiomas">
                {f.idiomas.map((it, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <input className={inputCls} style={inputStyle} placeholder="Idioma" value={it.idioma}
                      onChange={(e) => set('idiomas', f.idiomas.map((x, j) => j === i ? { ...x, idioma: e.target.value } : x))} />
                    <select className={inputCls} style={inputStyle} value={it.nivel}
                      onChange={(e) => set('idiomas', f.idiomas.map((x, j) => j === i ? { ...x, nivel: e.target.value } : x))}>
                      {NIVELES_IDIOMA.map((n) => <option key={n}>{n}</option>)}
                    </select>
                    <button type="button" onClick={() => set('idiomas', f.idiomas.filter((_, j) => j !== i))}
                      className="p-2.5 rounded-xl hover:bg-red-50"><Trash2 size={18} style={{ color: '#DC2626' }} /></button>
                  </div>
                ))}
                <button type="button"
                  onClick={() => set('idiomas', [...f.idiomas, f.idiomas.length === 0 ? { idioma: 'Español', nivel: 'Nativo' } : { idioma: '', nivel: 'Básico' }])}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#1E3A8A' }}>
                  <Plus size={16} /> Agregar idioma
                </button>
              </Bloque>
              <Bloque titulo="Ocupación actual">
                <textarea rows={2} className={inputCls} style={inputStyle} value={f.ocupacion} placeholder="Ej: Ama de casa, contador, estudiante…"
                  onChange={(e) => set('ocupacion', e.target.value)} />
              </Bloque>
            </>
          )}

          {paso === 5 && (
            <>
              <Bloque titulo="Seguridad social">
                <Pregunta texto="¿Está afiliado a algún sistema de salud o cuenta con seguro médico?">
                  <SiNo value={f.salud_afiliado} onChange={(v) => set('salud_afiliado', v)} />
                </Pregunta>
                {f.salud_afiliado && (
                  <Campo label="Nombre de la entidad o aseguradora">
                    <input className={inputCls} style={inputStyle} value={f.salud_entidad} onChange={(e) => set('salud_entidad', e.target.value)} />
                  </Campo>
                )}
              </Bloque>
              <Bloque titulo="Comentarios">
                <Campo label={modo === 'admin' ? 'Observaciones' : '¿Algo más que debamos saber?'}>
                  <textarea rows={3} className={inputCls} style={inputStyle} value={f.observaciones}
                    onChange={(e) => set('observaciones', e.target.value)} />
                </Campo>
              </Bloque>
            </>
          )}
        </div>

        {error && (
          <p className="mt-6 text-sm font-medium px-4 py-3 rounded-xl" style={{ backgroundColor: '#FEF2F2', color: '#B91C1C' }}>{error}</p>
        )}

        <div className="flex items-center justify-between gap-3 mt-8 pt-5 border-t" style={{ borderColor: '#F3F4F6' }}>
          <button type="button" onClick={() => ir(paso - 1)} disabled={paso === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold disabled:invisible"
            style={{ borderColor: '#D1D5DB', color: '#374151' }}>
            <ArrowLeft size={16} /> Atrás
          </button>
          <div className="flex gap-2">
            {modo === 'admin' && !ultimo && (
              <button type="button" onClick={enviar} disabled={enviando}
                className="px-4 py-2.5 rounded-xl border text-sm font-semibold" style={{ borderColor: '#1E3A8A', color: '#1E3A8A' }}>
                Guardar
              </button>
            )}
            {ultimo ? (
              <button type="button" onClick={enviar} disabled={enviando}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: '#C8A24A' }}>
                {enviando ? 'Guardando…' : textoEnviar} <Check size={16} />
              </button>
            ) : (
              <button type="button" onClick={() => ir(paso + 1)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: '#1E3A8A' }}>
                Siguiente <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
