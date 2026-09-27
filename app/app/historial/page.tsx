'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Calendar, Download, ChevronDown, ChevronUp, Users, CheckCircle, XCircle, BarChart2, Trash2, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface Sesion {
  id: number;
  fecha: string;
  descripcion?: string;
  total_registros: number;
  total_asistieron: number;
}

interface AsistenciaDetalle {
  id: number;
  nombre: string;
  cedula: string;
  asistio: number;
}

export default function HistorialPage() {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [expandida, setExpandida] = useState<number | null>(null);
  const [detalles, setDetalles] = useState<Record<number, AsistenciaDetalle[]>>({});
  const [cargandoDetalle, setCargandoDetalle] = useState<number | null>(null);
  const [confirmEliminar, setConfirmEliminar] = useState<Sesion | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const res = await fetch('/api/asistencias');
      const data = await res.json();
      setSesiones(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }

  async function eliminarSesion() {
    if (!confirmEliminar) return;
    setEliminando(true);
    try {
      await fetch(`/api/asistencias?sesion_id=${confirmEliminar.id}`, { method: 'DELETE' });
      setConfirmEliminar(null);
      setExpandida(null);
      cargar();
    } catch (e) { console.error(e); }
    finally { setEliminando(false); }
  }

  async function toggleAsistencia(sesionId: number, asistencia: AsistenciaDetalle) {
    setToggling(asistencia.id);
    try {
      const res = await fetch(`/api/asistencias/${asistencia.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asistio: asistencia.asistio === 1 ? 0 : 1 }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDetalles((prev) => ({
          ...prev,
          [sesionId]: prev[sesionId].map((a) =>
            a.id === asistencia.id ? { ...a, asistio: updated.asistio } : a
          ),
        }));
        setSesiones((prev) =>
          prev.map((s) => {
            if (s.id !== sesionId) return s;
            const delta = updated.asistio === 1 ? 1 : -1;
            return { ...s, total_asistieron: s.total_asistieron + delta };
          })
        );
      }
    } catch (e) { console.error(e); }
    finally { setToggling(null); }
  }

  async function toggleDetalle(sesion: Sesion) {
    if (expandida === sesion.id) { setExpandida(null); return; }
    setExpandida(sesion.id);
    if (detalles[sesion.id]) return;
    setCargandoDetalle(sesion.id);
    try {
      const res = await fetch(`/api/asistencias?sesion_id=${sesion.id}`);
      const data: AsistenciaDetalle[] = await res.json();
      setDetalles((prev) => ({ ...prev, [sesion.id]: data }));
    } catch (e) { console.error(e); }
    finally { setCargandoDetalle(null); }
  }

  const totalSesiones = sesiones.length;
  const promedioAsistencia = sesiones.length > 0
    ? Math.round(sesiones.reduce((acc, s) => {
        return acc + (s.total_registros > 0 ? (s.total_asistieron / s.total_registros) * 100 : 0);
      }, 0) / sesiones.length)
    : 0;

  const formatFecha = (fecha: string) => {
    try { return format(new Date(fecha + 'T00:00:00'), "d 'de' MMMM yyyy", { locale: es }); }
    catch { return fecha; }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1F2937' }}>Historial de Asistencia</h1>
            <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>{totalSesiones} sesiones registradas</p>
          </div>
          <a
            href="/api/exportar"
            className="flex items-center gap-2 bg-white border font-semibold px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md"
            style={{ borderColor: '#E5E7EB', color: '#1F2937' }}
          >
            <Download size={17} style={{ color: '#C8A24A' }} />
            Exportar todo
          </a>
        </div>

        {/* Stats globales */}
        {!cargando && sesiones.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { icon: Calendar, valor: totalSesiones, label: 'Sesiones', iconBg: '#FEF9EC', iconColor: '#C8A24A' },
              { icon: BarChart2, valor: `${promedioAsistencia}%`, label: 'Promedio', iconBg: '#EFF6FF', iconColor: '#2563EB' },
              { icon: Users, valor: sesiones[0]?.total_registros || 0, label: 'Estudiantes', iconBg: '#F0FDF4', iconColor: '#16A34A' },
            ].map(({ icon: Icon, valor, label, iconBg, iconColor }) => (
              <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
                <div className="p-2 rounded-xl inline-flex mb-2" style={{ backgroundColor: iconBg }}>
                  <Icon size={20} style={{ color: iconColor }} />
                </div>
                <div className="text-2xl font-bold" style={{ color: '#1F2937' }}>{valor}</div>
                <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Lista */}
        {cargando ? (
          <div className="flex items-center justify-center py-16" style={{ color: '#9CA3AF' }}>Cargando...</div>
        ) : sesiones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: '#9CA3AF' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: '#EFF6FF' }}>
              <Calendar size={40} style={{ color: '#BFDBFE' }} />
            </div>
            <p className="text-sm">No hay sesiones registradas</p>
            <Link href="/asistencia" className="mt-4 text-sm underline font-medium" style={{ color: '#2563EB' }}>
              Tomar primera asistencia
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sesiones.map((sesion) => {
              const pct = sesion.total_registros > 0
                ? Math.round((sesion.total_asistieron / sesion.total_registros) * 100)
                : 0;
              const ausentes = sesion.total_registros - sesion.total_asistieron;
              const estaExpandida = expandida === sesion.id;

              const barColor = pct >= 75
                ? 'linear-gradient(90deg, #C8A24A, #F0DFA0)'
                : pct >= 50
                ? 'linear-gradient(90deg, #2563EB, #60A5FA)'
                : 'linear-gradient(90deg, #DC2626, #FCA5A5)';

              const pctBg = pct >= 75 ? '#FEF9EC' : pct >= 50 ? '#EFF6FF' : '#FEF2F2';
              const pctColor = pct >= 75 ? '#C8A24A' : pct >= 50 ? '#2563EB' : '#DC2626';

              return (
                <div key={sesion.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Borde superior de color */}
                  <div className="h-0.5" style={{ background: barColor }} />

                  <button
                    onClick={() => toggleDetalle(sesion)}
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    {/* Badge % */}
                    <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-bold text-sm"
                      style={{ backgroundColor: pctBg, color: pctColor }}>
                      <span className="text-lg leading-tight">{pct}</span>
                      <span className="text-xs leading-tight font-normal">%</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold" style={{ color: '#1F2937' }}>{formatFecha(sesion.fecha)}</div>
                      {sesion.descripcion && (
                        <div className="text-sm truncate mt-0.5" style={{ color: '#6B7280' }}>{sesion.descripcion}</div>
                      )}
                      <div className="flex gap-4 mt-1.5">
                        <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#16A34A' }}>
                          <CheckCircle size={12} /> {sesion.total_asistieron}
                        </span>
                        <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#DC2626' }}>
                          <XCircle size={12} /> {ausentes}
                        </span>
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>de {sesion.total_registros}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <a
                        href={`/api/exportar?fecha=${sesion.fecha}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg transition-colors hover:bg-blue-50"
                        title="Exportar Excel"
                        style={{ color: '#9CA3AF' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#2563EB')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
                      >
                        <Download size={16} />
                      </a>
                      <Link
                        href={`/asistencia?fecha=${sesion.fecha}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg transition-colors hover:bg-blue-50"
                        title="Editar sesión"
                        style={{ color: '#9CA3AF' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#2563EB')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
                      >
                        <Calendar size={16} />
                      </Link>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmEliminar(sesion); }}
                        className="p-2 rounded-lg transition-colors hover:bg-red-50"
                        title="Eliminar sesión"
                        style={{ color: '#9CA3AF' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
                      >
                        <Trash2 size={16} />
                      </button>
                      {estaExpandida
                        ? <ChevronUp size={18} style={{ color: '#9CA3AF' }} />
                        : <ChevronDown size={18} style={{ color: '#9CA3AF' }} />}
                    </div>
                  </button>

                  {/* Barra de progreso */}
                  <div className="px-5 pb-3">
                    <div className="rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: barColor }}
                      />
                    </div>
                  </div>

                  {/* Detalle expandido */}
                  {estaExpandida && (
                    <div className="border-t border-gray-100 max-h-72 overflow-y-auto">
                      {cargandoDetalle === sesion.id ? (
                        <div className="py-6 text-center text-sm" style={{ color: '#9CA3AF' }}>Cargando detalle...</div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {(detalles[sesion.id] || []).map((a) => (
                            <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                              <div className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: a.asistio === 1 ? '#16A34A' : '#DC2626' }} />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium" style={{ color: '#1F2937' }}>{a.nombre}</span>
                                <span className="text-xs ml-2" style={{ color: '#9CA3AF' }}>{a.cedula}</span>
                              </div>
                              <button
                                onClick={() => toggleAsistencia(sesion.id, a)}
                                disabled={toggling === a.id}
                                title="Clic para cambiar asistencia"
                                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all active:scale-95 disabled:opacity-50"
                                style={
                                  a.asistio === 1
                                    ? { backgroundColor: '#DCFCE7', color: '#15803D' }
                                    : { backgroundColor: '#FEE2E2', color: '#DC2626' }
                                }
                              >
                                {toggling === a.id
                                  ? <RotateCcw size={11} className="animate-spin" />
                                  : a.asistio === 1
                                    ? <><CheckCircle size={11} /> Asistió</>
                                    : <><XCircle size={11} /> Ausente</>
                                }
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Confirmar eliminar sesión */}
      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4 mx-auto"
              style={{ backgroundColor: '#FEF2F2' }}>
              <Trash2 size={22} style={{ color: '#DC2626' }} />
            </div>
            <h3 className="text-lg font-bold text-center mb-1" style={{ color: '#1F2937' }}>¿Eliminar sesión?</h3>
            <p className="text-sm text-center mb-1 font-medium" style={{ color: '#2563EB' }}>
              {formatFecha(confirmEliminar.fecha)}
            </p>
            <p className="text-sm text-center mb-6" style={{ color: '#6B7280' }}>
              Se eliminarán todos los registros de asistencia de esta sesión. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmEliminar(null)}
                disabled={eliminando}
                className="flex-1 border font-semibold py-3 rounded-full transition-all disabled:opacity-50"
                style={{ borderColor: '#E5E7EB', color: '#1F2937' }}
              >
                Cancelar
              </button>
              <button
                onClick={eliminarSesion}
                disabled={eliminando}
                className="flex-1 text-white font-semibold py-3 rounded-full transition-all disabled:opacity-50"
                style={{ backgroundColor: '#DC2626' }}
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
