'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Check, ChevronDown, ChevronUp, Copy, Inbox, Share2, User, UserPlus, X } from 'lucide-react';
import { SECCIONES, OTROS_CAMPOS } from '@/lib/etiquetas';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fila = Record<string, any>;
interface Solicitud { id: number; cedula: string; datos: Fila; creado_en: string; existente: Fila | null }

const CAMPOS = [...SECCIONES.flatMap((s) => s.campos), ...OTROS_CAMPOS.filter((c) => ['horario', 'observaciones'].includes(c.clave))];

export default function SolicitudesPage() {
  const [lista, setLista] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abierta, setAbierta] = useState<number | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => { setLink(`${window.location.origin}/registro`); cargar(); }, []);

  async function cargar() {
    setCargando(true);
    const res = await fetch('/api/solicitudes');
    const d = await res.json().catch(() => []);
    setLista(Array.isArray(d) ? d : []);
    setCargando(false);
  }

  function aviso(t: string) { setToast(t); setTimeout(() => setToast(''), 3000); }

  async function procesar(s: Solicitud, accion: 'aprobar' | 'rechazar') {
    if (accion === 'rechazar' && !confirm(`¿Descartar la solicitud de ${s.datos.nombre}?`)) return;
    setProcesando(s.id);
    const res = await fetch(`/api/solicitudes/${s.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion }),
    });
    const d = await res.json().catch(() => ({}));
    setProcesando(null);
    if (!res.ok) { aviso(d.error || 'Error'); return; }
    aviso(accion === 'rechazar' ? 'Solicitud descartada' : d.nuevo ? 'Colaborador creado ✓' : 'Ficha actualizada ✓');
    setLista((l) => l.filter((x) => x.id !== s.id));
  }

  const mensajeWhatsApp = encodeURIComponent(
    `Hola 🙌 Estamos actualizando la información de los colaboradores de la Iglesia Itagüí. Por favor diligencia este formulario (toma unos 5 minutos): ${link}`
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
      <Navbar />
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: '#1E3A8A' }}>{toast}</div>
      )}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold" style={{ color: '#1F2937' }}>Solicitudes del formulario</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
          Lo que llega del formulario se revisa aquí antes de guardarse. Al aprobar se completan los datos vacíos,
          se suman dones y labores y las observaciones se agregan sin reemplazar las anteriores.
        </p>

        {/* Link para compartir */}
        <div className="mt-5 bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#1F2937' }}>Link del formulario</p>
            <p className="text-sm truncate" style={{ color: '#2563EB' }}>{link}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { navigator.clipboard.writeText(link); aviso('Link copiado'); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold"
              style={{ borderColor: '#D1D5DB', color: '#374151' }}><Copy size={15} /> Copiar</button>
            <a href={`https://wa.me/?text=${mensajeWhatsApp}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#16A34A' }}><Share2 size={15} /> WhatsApp</a>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {cargando ? (
            <p className="text-sm" style={{ color: '#6B7280' }}>Cargando…</p>
          ) : lista.length === 0 ? (
            <div className="text-center py-16" style={{ color: '#9CA3AF' }}>
              <Inbox size={40} className="mx-auto mb-3 opacity-50" />
              <p className="font-medium">No hay solicitudes pendientes</p>
            </div>
          ) : lista.map((s) => {
            const d = s.datos; const ex = s.existente;
            const abierto = abierta === s.id;
            const cambios = CAMPOS.filter((c) => {
              const nuevo = c.valor(d);
              return nuevo && (!ex || c.valor(ex) !== nuevo);
            });
            return (
              <div key={s.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-center gap-3 p-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F3F4F6' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {d.foto ? <img src={d.foto} alt="" className="w-full h-full object-cover" /> : <User size={24} style={{ color: '#9CA3AF' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" style={{ color: '#1F2937' }}>{d.nombre}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>
                      {d.cedula} · enviado {new Date(s.creado_en).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={ex ? { backgroundColor: '#EFF6FF', color: '#1D4ED8' } : { backgroundColor: '#F0FDF4', color: '#15803D' }}>
                      {ex ? `Actualiza la ficha de ${ex.nombre} · ${cambios.length} cambio${cambios.length === 1 ? '' : 's'}` : <><UserPlus size={12} /> Colaborador nuevo</>}
                    </span>
                  </div>
                  <button onClick={() => setAbierta(abierto ? null : s.id)} className="p-2 rounded-lg hover:bg-gray-50">
                    {abierto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {abierto && (
                  <div className="px-4 pb-2 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ color: '#6B7280' }}>
                          <th className="text-left font-medium py-2 pr-3">Campo</th>
                          {ex && <th className="text-left font-medium py-2 pr-3">Actual</th>}
                          <th className="text-left font-medium py-2">{ex ? 'Nuevo' : 'Dato'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cambios.map((c) => (
                          <tr key={c.clave} className="border-t align-top" style={{ borderColor: '#F3F4F6' }}>
                            <td className="py-2 pr-3" style={{ color: '#4B5563' }}>{c.etiqueta}</td>
                            {ex && <td className="py-2 pr-3" style={{ color: '#9CA3AF' }}>{c.valor(ex) || '—'}</td>}
                            <td className="py-2 font-medium" style={{ color: '#111827' }}>{c.valor(d)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {cambios.length === 0 && <p className="text-sm py-2" style={{ color: '#6B7280' }}>No trae datos distintos a los que ya están.</p>}
                  </div>
                )}

                <div className="flex gap-2 px-4 py-3 border-t" style={{ borderColor: '#F3F4F6', backgroundColor: '#FAFAFA' }}>
                  <button onClick={() => procesar(s, 'rechazar')} disabled={procesando === s.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold"
                    style={{ borderColor: '#FCA5A5', color: '#B91C1C' }}><X size={15} /> Descartar</button>
                  <button onClick={() => procesar(s, 'aprobar')} disabled={procesando === s.id}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                    style={{ backgroundColor: '#1E3A8A' }}>
                    <Check size={15} /> {procesando === s.id ? 'Guardando…' : ex ? 'Aprobar y actualizar' : 'Aprobar y crear'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
