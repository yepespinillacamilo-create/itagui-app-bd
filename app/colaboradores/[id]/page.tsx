'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { ArrowLeft, Check, Copy, Pencil, User } from 'lucide-react';
import { SECCIONES, OTROS_CAMPOS } from '@/lib/etiquetas';
import { ESTADO_CEMP_INFO, estadoCemp, fechaCorta } from '@/lib/catalogos';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fila = Record<string, any>;

export default function FichaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [c, setC] = useState<Fila | null>(null);
  const [copiado, setCopiado] = useState('');
  const [registradoPor, setRegistradoPor] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch(`/api/colaboradores/${id}`).then((r) => r.json()).then(setC);
    try { setRegistradoPor(localStorage.getItem('cemp_registrado_por') || ''); } catch { /* sin almacenamiento */ }
  }, [id]);

  function copiar(clave: string, texto: string) {
    navigator.clipboard.writeText(texto);
    setCopiado(clave);
    setTimeout(() => setCopiado(''), 1500);
  }

  async function marcarCemp(accion: 'marcar_cemp' | 'desmarcar_cemp') {
    setGuardando(true);
    try { localStorage.setItem('cemp_registrado_por', registradoPor); } catch { /* sin almacenamiento */ }
    const res = await fetch(`/api/colaboradores/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion, registrado_por: registradoPor }),
    });
    if (res.ok) setC(await res.json());
    setGuardando(false);
  }

  if (!c) return (<div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}><Navbar /><p className="p-8 text-sm" style={{ color: '#6B7280' }}>Cargando…</p></div>);
  if (c.error) return (<div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}><Navbar /><p className="p-8 text-sm">No se encontró el colaborador.</p></div>);

  const estado = estadoCemp(c);
  const info = ESTADO_CEMP_INFO[estado];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Link href="/colaboradores" className="inline-flex items-center gap-1.5 text-sm font-medium mb-4" style={{ color: '#1E3A8A' }}>
          <ArrowLeft size={16} /> Colaboradores
        </Link>

        {/* Encabezado */}
        <div className="bg-white rounded-3xl border shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row gap-5 sm:items-center" style={{ borderColor: '#E5E7EB' }}>
          <div className="w-28 h-28 rounded-3xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F3F4F6' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {c.foto ? <img src={c.foto} alt={c.nombre} className="w-full h-full object-cover" /> : <User size={40} style={{ color: '#9CA3AF' }} />}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-tight" style={{ color: '#1F2937' }}>{c.nombre_preferencia || c.nombre}</h1>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
              {[c.cedula, c.celular, c.horario && `Culto ${c.horario}`].filter(Boolean).join(' · ')}
            </p>
            <Link href={`/colaboradores/${id}/editar`}
              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#1E3A8A' }}><Pencil size={15} /> Editar ficha completa</Link>
          </div>
        </div>

        {/* Estado CEMP */}
        <div className="mt-4 rounded-3xl border p-5" style={{ backgroundColor: info.bg, borderColor: info.color + '33' }}>
          <p className="font-bold" style={{ color: info.color }}>{info.label}</p>
          <p className="text-sm mt-1" style={{ color: '#374151' }}>
            {c.cemp_fecha_registro
              ? <>Último registro en CEMP: <b>{fechaCorta(c.cemp_fecha_registro)}</b>{c.cemp_registrado_por && <> por {c.cemp_registrado_por}</>}.</>
              : 'Aún no se ha registrado en el CEMP.'}
            {estado === 'desactualizado' && <> Sus datos cambiaron el {fechaCorta(c.datos_actualizados_en)}; hay que actualizarlos en el CEMP.</>}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <input value={registradoPor} onChange={(e) => setRegistradoPor(e.target.value)} placeholder="Registrado por (ej: Hno. Álvaro Martínez)"
              className="flex-1 border rounded-xl px-3 py-2 text-sm bg-white outline-none" style={{ borderColor: '#D1D5DB' }} />
            <button onClick={() => marcarCemp('marcar_cemp')} disabled={guardando}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: '#15803D' }}>
              <Check size={15} /> Ya lo registré en CEMP hoy
            </button>
            {c.cemp_fecha_registro && (
              <button onClick={() => marcarCemp('desmarcar_cemp')} disabled={guardando}
                className="px-4 py-2 rounded-xl text-sm font-semibold border bg-white" style={{ borderColor: '#D1D5DB', color: '#6B7280' }}>
                Quitar marca
              </button>
            )}
          </div>
        </div>

        <p className="text-sm mt-6 mb-3" style={{ color: '#6B7280' }}>
          Los datos siguen el orden de las pantallas del CEMP. Toca cualquier dato para copiarlo.
        </p>

        {SECCIONES.map((s, i) => (
          <section key={s.titulo} className="bg-white rounded-3xl border shadow-sm mb-4 overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
            <h2 className="flex items-center gap-3 px-5 py-3 border-b font-semibold" style={{ borderColor: '#F3F4F6', color: '#1E3A8A' }}>
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: '#1E3A8A' }}>{i + 1}</span>
              {s.titulo}
            </h2>
            <dl className="divide-y" style={{ borderColor: '#F3F4F6' }}>
              {s.campos.map((campo) => {
                const v = campo.valor(c);
                return (
                  <div key={campo.clave} className="grid grid-cols-[minmax(0,40%)_1fr] gap-3 px-5 py-2.5 items-start">
                    <dt className="text-sm" style={{ color: '#6B7280' }}>{campo.etiqueta}</dt>
                    <dd>
                      {v ? (
                        <button onClick={() => copiar(campo.clave, v)} className="group text-left text-sm font-medium inline-flex items-start gap-1.5" style={{ color: '#111827' }}>
                          <span>{v}</span>
                          {copiado === campo.clave
                            ? <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#16A34A' }} />
                            : <Copy size={13} className="mt-0.5 flex-shrink-0 opacity-30 group-hover:opacity-80" />}
                        </button>
                      ) : <span className="text-sm" style={{ color: '#D1D5DB' }}>—</span>}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}

        <section className="bg-white rounded-3xl border shadow-sm mb-4 overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
          <h2 className="px-5 py-3 border-b font-semibold" style={{ borderColor: '#F3F4F6', color: '#C8A24A' }}>Información interna de la sede</h2>
          <dl className="divide-y" style={{ borderColor: '#F3F4F6' }}>
            {OTROS_CAMPOS.map((campo) => (
              <div key={campo.clave} className="grid grid-cols-[minmax(0,40%)_1fr] gap-3 px-5 py-2.5">
                <dt className="text-sm" style={{ color: '#6B7280' }}>{campo.etiqueta}</dt>
                <dd className="text-sm font-medium" style={{ color: campo.valor(c) ? '#111827' : '#D1D5DB' }}>{campo.valor(c) || '—'}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  );
}
