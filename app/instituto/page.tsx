'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Navbar from '@/components/Navbar';
import {
  CheckCircle, XCircle, ChevronLeft, ChevronRight, User, RotateCcw,
  Download, Plus, Search, Edit2, Trash2, X, Camera, BookOpen, ChevronDown, ChevronUp, BarChart2, Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';

interface Asistencia {
  id: number;
  sesion_id: number;
  estudiante_id: number;
  asistio: number;
  nombre: string;
  cedula: string;
  celular: string;
  foto: string | null;
}

interface Sesion {
  id: number;
  fecha: string;
  descripcion?: string;
}

interface Estudiante {
  id: number;
  nombre: string;
  cedula: string;
  celular: string | null;
  foto: string | null;
  activo: number;
  total_asistencias: number;
  total_faltas: number;
  horario?: string;
}

interface FormEst {
  nombre: string;
  cedula: string;
  celular: string;
  foto: string;
}

interface RegistroAsistencia {
  id: number;
  asistio: number;
  fecha: string;
  descripcion?: string;
}

interface SesionHistorial {
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

const EMPTY_FORM: FormEst = { nombre: '', cedula: '', celular: '', foto: '' };
type Vista = 'config' | 'flujo' | 'resumen';
type SeccionTab = 'asistencia' | 'estudiantes' | 'historico';

export default function InstitutoPage() {
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [descripcion, setDescripcion] = useState('');
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [indice, setIndice] = useState(0);
  const [vista, setVista] = useState<Vista>('config');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [filtroHorario, setFiltroHorario] = useState('');
  const [buscar, setBuscar] = useState('');
  const [cargandoEst, setCargandoEst] = useState(true);
  const [modal, setModal] = useState<'nuevo' | 'editar' | null>(null);
  const [editando, setEditando] = useState<Estudiante | null>(null);
  const [form, setForm] = useState<FormEst>(EMPTY_FORM);
  const [guardandoEst, setGuardandoEst] = useState(false);
  const [errorEst, setErrorEst] = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState<number | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [detalleModal, setDetalleModal] = useState<{ estudiante: Estudiante; filtro: 'asistencias' | 'faltas' } | null>(null);
  const [registros, setRegistros] = useState<RegistroAsistencia[]>([]);
  const [cargandoRegistros, setCargandoRegistros] = useState(false);
  const [fotoVisor, setFotoVisor] = useState<{ src: string; nombre: string } | null>(null);

  const [seccionTab, setSeccionTab] = useState<SeccionTab>('asistencia');
  const [sesionesHist, setSesionesHist] = useState<SesionHistorial[]>([]);
  const [cargandoHist, setCargandoHist] = useState(false);
  const [expandida, setExpandida] = useState<number | null>(null);
  const [detallesHist, setDetallesHist] = useState<Record<number, AsistenciaDetalle[]>>({});
  const [cargandoDetalle, setCargandoDetalle] = useState<number | null>(null);
  const [confirmEliminarSesion, setConfirmEliminarSesion] = useState<SesionHistorial | null>(null);
  const [eliminandoSesion, setEliminandoSesion] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => { cargarEstudiantes(); }, []);

  async function cargarHistorial() {
    setCargandoHist(true);
    try {
      const res = await fetch('/api/asistencias');
      const data = await res.json();
      setSesionesHist(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setCargandoHist(false); }
  }

  async function toggleDetalleHist(sesion: SesionHistorial) {
    if (expandida === sesion.id) { setExpandida(null); return; }
    setExpandida(sesion.id);
    if (detallesHist[sesion.id]) return;
    setCargandoDetalle(sesion.id);
    try {
      const res = await fetch(`/api/asistencias?sesion_id=${sesion.id}`);
      const data: AsistenciaDetalle[] = await res.json();
      setDetallesHist((prev) => ({ ...prev, [sesion.id]: data }));
    } catch (e) { console.error(e); }
    finally { setCargandoDetalle(null); }
  }

  async function toggleAsistenciaHist(sesionId: number, asistencia: AsistenciaDetalle) {
    setToggling(asistencia.id);
    try {
      const res = await fetch(`/api/asistencias/${asistencia.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asistio: asistencia.asistio === 1 ? 0 : 1 }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDetallesHist((prev) => ({
          ...prev,
          [sesionId]: prev[sesionId].map((a) =>
            a.id === asistencia.id ? { ...a, asistio: updated.asistio } : a
          ),
        }));
        setSesionesHist((prev) =>
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

  async function eliminarSesionHist() {
    if (!confirmEliminarSesion) return;
    setEliminandoSesion(true);
    try {
      await fetch(`/api/asistencias?sesion_id=${confirmEliminarSesion.id}`, { method: 'DELETE' });
      setConfirmEliminarSesion(null);
      setExpandida(null);
      cargarHistorial();
    } catch (e) { console.error(e); }
    finally { setEliminandoSesion(false); }
  }

  async function cargarEstudiantes() {
    setCargandoEst(true);
    try {
      const res = await fetch('/api/estudiantes');
      const data = await res.json();
      setEstudiantes(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setCargandoEst(false); }
  }

  const iniciarSesion = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/asistencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, descripcion, horario_filtro: filtroHorario || null }),
      });
      const s: Sesion = await res.json();
      setSesion(s);
      const aRes = await fetch(`/api/asistencias?sesion_id=${s.id}`);
      const a: Asistencia[] = await aRes.json();
      setAsistencias(a);
      const primerPendiente = a.findIndex((x) => x.asistio === 0);
      setIndice(primerPendiente >= 0 ? primerPendiente : 0);
      setVista('flujo');
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }, [fecha, descripcion]);

  const registrar = useCallback(async (asistio: boolean) => {
    const actual = asistencias[indice];
    if (!actual || guardando) return;
    setGuardando(true);
    try {
      await fetch(`/api/asistencias/${actual.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asistio }),
      });
      setAsistencias((prev) =>
        prev.map((a, i) => (i === indice ? { ...a, asistio: asistio ? 1 : -1 } : a))
      );
      if (indice < asistencias.length - 1) setIndice((i) => i + 1);
      else setVista('resumen');
    } catch (e) { console.error(e); }
    finally { setGuardando(false); }
  }, [asistencias, indice, guardando]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (vista !== 'flujo') return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') registrar(true);
      if (e.key === 'ArrowLeft' || e.key === 'Backspace') registrar(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [vista, registrar]);

  const asistieron = asistencias.filter((a) => a.asistio === 1).length;
  const ausentes = asistencias.filter((a) => a.asistio === -1).length;
  const pendientes = asistencias.filter((a) => a.asistio === 0).length;
  const pct = asistencias.length > 0 ? Math.round((asistieron / asistencias.length) * 100) : 0;
  const actual = asistencias[indice];

  const filtrados = estudiantes.filter(
    (e) => e.nombre.toLowerCase().includes(buscar.toLowerCase()) || e.cedula.includes(buscar)
  );

  function abrirNuevo() { setForm(EMPTY_FORM); setErrorEst(''); setModal('nuevo'); }
  function abrirEditar(est: Estudiante) {
    setEditando(est);
    setForm({ nombre: est.nombre, cedula: est.cedula, celular: est.celular || '', foto: est.foto || '' });
    setErrorEst(''); setModal('editar');
  }
  function cerrarModal() { setModal(null); setEditando(null); setErrorEst(''); setSubiendoFoto(false); }

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const cedula = form.cedula.trim() || `temp_${Date.now()}`;
    const previewUrl = URL.createObjectURL(file);
    setForm((f) => ({ ...f, foto: previewUrl }));
    setSubiendoFoto(true);
    try {
      const fd = new FormData();
      fd.append('foto', file);
      fd.append('cedula', cedula.replace(/[^a-zA-Z0-9_-]/g, ''));
      const res = await fetch('/api/subir-foto', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) setForm((f) => ({ ...f, foto: data.url }));
      else setErrorEst(data.error || 'Error al subir foto');
    } catch { setErrorEst('Error de conexión al subir foto'); }
    finally { setSubiendoFoto(false); }
  }

  async function guardarEst() {
    if (!form.nombre.trim() || !form.cedula.trim()) { setErrorEst('Nombre y cédula son requeridos'); return; }
    setGuardandoEst(true); setErrorEst('');
    try {
      const url = modal === 'editar' ? `/api/estudiantes/${editando!.id}` : '/api/estudiantes';
      const res = await fetch(url, {
        method: modal === 'editar' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, activo: 1 }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorEst(data.error || 'Error al guardar'); return; }
      cerrarModal(); cargarEstudiantes();
    } catch { setErrorEst('Error de conexión'); }
    finally { setGuardandoEst(false); }
  }

  async function eliminar(id: number) {
    await fetch(`/api/estudiantes/${id}`, { method: 'DELETE' });
    setConfirmEliminar(null); cargarEstudiantes();
  }

  async function abrirDetalle(est: Estudiante, filtro: 'asistencias' | 'faltas') {
    setDetalleModal({ estudiante: est, filtro });
    setCargandoRegistros(true);
    try {
      const res = await fetch(`/api/asistencias?estudiante_id=${est.id}`);
      const data = await res.json();
      setRegistros(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setCargandoRegistros(false); }
  }

  const formatFecha = (f: string) => {
    try { return format(new Date(f + 'T00:00:00'), "d 'de' MMMM yyyy", { locale: es }); }
    catch { return f; }
  };

  const inputClass = "w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all";

  const totalSesiones = sesionesHist.length;
  const promedioAsistencia = sesionesHist.length > 0
    ? Math.round(sesionesHist.reduce((acc, s) => acc + (s.total_registros > 0 ? (s.total_asistieron / s.total_registros) * 100 : 0), 0) / sesionesHist.length)
    : 0;

  // ── SECCIÓN HISTÓRICO ────────────────────────────────────────
  const seccionHistorico = (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>{totalSesiones} sesiones registradas</p>
        </div>
        <a href="/api/exportar"
          className="flex items-center gap-2 bg-white border font-semibold px-4 py-2 rounded-full shadow-sm hover:shadow-md text-sm"
          style={{ borderColor: '#E5E7EB', color: '#1F2937' }}>
          <Download size={15} style={{ color: '#C8A24A' }} /> Exportar todo
        </a>
      </div>

      {!cargandoHist && sesionesHist.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { icon: BookOpen, valor: totalSesiones, label: 'Sesiones', iconBg: '#FEF9EC', iconColor: '#C8A24A' },
            { icon: BarChart2, valor: `${promedioAsistencia}%`, label: 'Promedio', iconBg: '#EFF6FF', iconColor: '#2563EB' },
            { icon: Users, valor: sesionesHist[0]?.total_registros || 0, label: 'Estudiantes', iconBg: '#F0FDF4', iconColor: '#16A34A' },
          ].map(({ icon: Icon, valor, label, iconBg, iconColor }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <div className="p-2 rounded-xl inline-flex mb-1.5" style={{ backgroundColor: iconBg }}>
                <Icon size={18} style={{ color: iconColor }} />
              </div>
              <div className="text-xl font-bold" style={{ color: '#1F2937' }}>{valor}</div>
              <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {cargandoHist ? (
        <div className="flex items-center justify-center py-16" style={{ color: '#9CA3AF' }}>Cargando...</div>
      ) : sesionesHist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16" style={{ color: '#9CA3AF' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#EFF6FF' }}>
            <BookOpen size={32} style={{ color: '#BFDBFE' }} />
          </div>
          <p className="text-sm">No hay sesiones registradas</p>
          <button onClick={() => setSeccionTab('asistencia')} className="mt-3 text-sm underline font-medium" style={{ color: '#2563EB' }}>
            Tomar primera asistencia
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sesionesHist.map((sesion) => {
            const pct = sesion.total_registros > 0
              ? Math.round((sesion.total_asistieron / sesion.total_registros) * 100) : 0;
            const ausentes = sesion.total_registros - sesion.total_asistieron;
            const estaExpandida = expandida === sesion.id;
            const barColor = pct >= 75 ? 'linear-gradient(90deg, #C8A24A, #F0DFA0)'
              : pct >= 50 ? 'linear-gradient(90deg, #2563EB, #60A5FA)'
              : 'linear-gradient(90deg, #DC2626, #FCA5A5)';
            const pctBg = pct >= 75 ? '#FEF9EC' : pct >= 50 ? '#EFF6FF' : '#FEF2F2';
            const pctColor = pct >= 75 ? '#C8A24A' : pct >= 50 ? '#2563EB' : '#DC2626';

            return (
              <div key={sesion.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-0.5" style={{ background: barColor }} />
                <button onClick={() => toggleDetalleHist(sesion)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-bold text-sm"
                    style={{ backgroundColor: pctBg, color: pctColor }}>
                    <span className="text-base leading-tight">{pct}</span>
                    <span className="text-xs leading-tight font-normal">%</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color: '#1F2937' }}>{formatFecha(sesion.fecha)}</div>
                    {sesion.descripcion && (
                      <div className="text-xs truncate mt-0.5" style={{ color: '#6B7280' }}>{sesion.descripcion}</div>
                    )}
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#16A34A' }}>
                        <CheckCircle size={11} /> {sesion.total_asistieron}
                      </span>
                      <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#DC2626' }}>
                        <XCircle size={11} /> {ausentes}
                      </span>
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>de {sesion.total_registros}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a href={`/api/exportar?fecha=${sesion.fecha}`} onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg hover:bg-blue-50 transition-colors" title="Exportar"
                      style={{ color: '#9CA3AF' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#2563EB')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}>
                      <Download size={15} />
                    </a>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmEliminarSesion(sesion); }}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="Eliminar sesión"
                      style={{ color: '#9CA3AF' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}>
                      <Trash2 size={15} />
                    </button>
                    {estaExpandida ? <ChevronUp size={16} style={{ color: '#9CA3AF' }} /> : <ChevronDown size={16} style={{ color: '#9CA3AF' }} />}
                  </div>
                </button>
                <div className="px-5 pb-3">
                  <div className="rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                </div>
                {estaExpandida && (
                  <div className="border-t border-gray-100 max-h-72 overflow-y-auto">
                    {cargandoDetalle === sesion.id ? (
                      <div className="py-6 text-center text-sm" style={{ color: '#9CA3AF' }}>Cargando...</div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {(detallesHist[sesion.id] || []).map((a) => (
                          <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                            <div className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: a.asistio === 1 ? '#16A34A' : '#DC2626' }} />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium" style={{ color: '#1F2937' }}>{a.nombre}</span>
                              <span className="text-xs ml-2" style={{ color: '#9CA3AF' }}>{a.cedula}</span>
                            </div>
                            <button onClick={() => toggleAsistenciaHist(sesion.id, a)} disabled={toggling === a.id}
                              title="Clic para cambiar" className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-all active:scale-95 disabled:opacity-50"
                              style={a.asistio === 1 ? { backgroundColor: '#DCFCE7', color: '#15803D' } : { backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                              {toggling === a.id
                                ? <RotateCcw size={11} className="animate-spin" />
                                : a.asistio === 1 ? <><CheckCircle size={11} /> Asistió</> : <><XCircle size={11} /> Ausente</>}
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

      {confirmEliminarSesion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4 mx-auto" style={{ backgroundColor: '#FEF2F2' }}>
              <Trash2 size={22} style={{ color: '#DC2626' }} />
            </div>
            <h3 className="text-lg font-bold text-center mb-1" style={{ color: '#1F2937' }}>¿Eliminar sesión?</h3>
            <p className="text-sm text-center mb-1 font-medium" style={{ color: '#2563EB' }}>{formatFecha(confirmEliminarSesion.fecha)}</p>
            <p className="text-sm text-center mb-6" style={{ color: '#6B7280' }}>
              Se eliminarán todos los registros de asistencia de esta sesión. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmEliminarSesion(null)} disabled={eliminandoSesion}
                className="flex-1 border font-semibold py-3 rounded-full disabled:opacity-50"
                style={{ borderColor: '#E5E7EB', color: '#1F2937' }}>Cancelar</button>
              <button onClick={eliminarSesionHist} disabled={eliminandoSesion}
                className="flex-1 text-white font-semibold py-3 rounded-full disabled:opacity-50"
                style={{ backgroundColor: '#DC2626' }}>
                {eliminandoSesion ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── MODALES ─────────────────────────────────────────────────
  const modales = (
    <>
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4"
              style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}>
              <h2 className="text-base font-bold text-white">
                {modal === 'nuevo' ? 'Nuevo estudiante' : 'Editar estudiante'}
              </h2>
              <button onClick={cerrarModal} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20">
                <X size={18} className="text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {([
                { label: 'Nombre completo *', key: 'nombre', placeholder: 'Ej: Juan Pérez' },
                { label: 'Cédula *', key: 'cedula', placeholder: 'Ej: 1234567' },
                { label: 'Celular', key: 'celular', placeholder: 'Ej: 3001234567' },
              ] as { label: string; key: keyof FormEst; placeholder: string }[]).map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1F2937' }}>{label}</label>
                  <input type="text" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder} className={inputClass}
                    style={{ borderColor: '#E5E7EB', color: '#1F2937' }}
                    onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1F2937' }}>Foto</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200"
                    style={{ backgroundColor: '#EFF6FF' }}>
                    {form.foto
                      ? <Image src={form.foto} alt="preview" width={64} height={64} className="object-cover w-full h-full" unoptimized />
                      : <User size={28} style={{ color: '#93C5FD' }} />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input ref={fileInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFotoChange} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={subiendoFoto}
                      className="w-full flex items-center justify-center gap-2 border rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
                      style={{ borderColor: '#2563EB', color: '#2563EB', backgroundColor: '#EFF6FF' }}>
                      <Camera size={16} />
                      {subiendoFoto ? 'Subiendo...' : 'Tomar foto / Elegir archivo'}
                    </button>
                    <input type="text" value={form.foto} onChange={(e) => setForm({ ...form, foto: e.target.value })}
                      placeholder="O pega una URL" className={inputClass}
                      style={{ borderColor: '#E5E7EB', color: '#1F2937', fontSize: '12px' }}
                      onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                      onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
                  </div>
                </div>
              </div>
              {errorEst && (
                <div className="text-sm px-4 py-3 rounded-xl" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>{errorEst}</div>
              )}
            </div>
            <div className="flex gap-3 px-6 pb-6 flex-shrink-0">
              <button onClick={cerrarModal} className="flex-1 border font-semibold py-3 rounded-full"
                style={{ borderColor: '#E5E7EB', color: '#1F2937' }}>Cancelar</button>
              <button onClick={guardarEst} disabled={guardandoEst}
                className="flex-1 text-white font-semibold py-3 rounded-full shadow-md disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}>
                {guardandoEst ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4 mx-auto" style={{ backgroundColor: '#FEF2F2' }}>
              <Trash2 size={22} style={{ color: '#DC2626' }} />
            </div>
            <h3 className="text-lg font-bold text-center mb-2" style={{ color: '#1F2937' }}>¿Eliminar estudiante?</h3>
            <p className="text-sm text-center mb-6" style={{ color: '#6B7280' }}>Sus registros de asistencia se conservarán.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmEliminar(null)} className="flex-1 border font-semibold py-3 rounded-full"
                style={{ borderColor: '#E5E7EB', color: '#1F2937' }}>Cancelar</button>
              <button onClick={() => eliminar(confirmEliminar)} className="flex-1 text-white font-semibold py-3 rounded-full"
                style={{ backgroundColor: '#DC2626' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {detalleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <button onClick={() => setDetalleModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: '#6B7280' }}>
                <ChevronLeft size={20} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: '#1F2937' }}>{detalleModal.estudiante.nombre}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>
                  {detalleModal.filtro === 'asistencias' ? 'Sesiones en que asistió' : 'Sesiones en que faltó'}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setDetalleModal({ ...detalleModal, filtro: 'asistencias' })}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full"
                  style={detalleModal.filtro === 'asistencias' ? { backgroundColor: '#DCFCE7', color: '#15803D' } : { backgroundColor: '#F3F4F6', color: '#9CA3AF' }}>
                  <CheckCircle size={12} /> {detalleModal.estudiante.total_asistencias}
                </button>
                <button onClick={() => setDetalleModal({ ...detalleModal, filtro: 'faltas' })}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full"
                  style={detalleModal.filtro === 'faltas' ? { backgroundColor: '#FEE2E2', color: '#DC2626' } : { backgroundColor: '#F3F4F6', color: '#9CA3AF' }}>
                  <XCircle size={12} /> {detalleModal.estudiante.total_faltas}
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {cargandoRegistros ? (
                <div className="py-10 text-center text-sm" style={{ color: '#9CA3AF' }}>Cargando...</div>
              ) : (() => {
                const filtrados2 = registros.filter((r) => detalleModal.filtro === 'asistencias' ? r.asistio === 1 : r.asistio === 0);
                return filtrados2.length === 0 ? (
                  <div className="py-10 text-center text-sm" style={{ color: '#9CA3AF' }}>
                    {detalleModal.filtro === 'asistencias' ? 'No ha asistido a ninguna sesión' : 'Sin faltas registradas'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {filtrados2.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 px-5 py-3.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: r.asistio === 1 ? '#16A34A' : '#DC2626' }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: '#1F2937' }}>{formatFecha(r.fecha)}</p>
                          {r.descripcion && <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{r.descripcion}</p>}
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={r.asistio === 1 ? { backgroundColor: '#DCFCE7', color: '#15803D' } : { backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                          {r.asistio === 1 ? 'Asistió' : 'Ausente'}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="px-5 py-4 border-t border-gray-100">
              <button onClick={() => setDetalleModal(null)} className="w-full border font-semibold py-3 rounded-full"
                style={{ borderColor: '#E5E7EB', color: '#1F2937' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {fotoVisor && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/90" onClick={() => setFotoVisor(null)}>
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <Image src={fotoVisor.src} alt={fotoVisor.nombre} width={500} height={500}
              className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl" unoptimized />
          </div>
          <div className="flex-shrink-0 px-6 pb-8 pt-3 flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-white font-semibold text-sm drop-shadow">{fotoVisor.nombre}</p>
            <button onClick={() => setFotoVisor(null)}
              className="flex items-center gap-2 font-semibold px-8 py-3 rounded-full shadow-lg text-sm"
              style={{ backgroundColor: '#1F2937', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
              <X size={16} /> Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );

  // ── SECCIÓN ESTUDIANTES ─────────────────────────────────────
  const seccionEstudiantes = (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#C8A24A' }} />
        <h2 className="text-lg font-bold" style={{ color: '#1F2937' }}>Estudiantes del Instituto</h2>
        <span className="ml-auto">
          <button onClick={abrirNuevo}
            className="flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-full shadow-md active:scale-95 transition-all text-sm"
            style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}>
            <Plus size={15} /> Nuevo
          </button>
        </span>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: '#9CA3AF' }} />
        <input type="text" value={buscar} onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar por nombre o cédula..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-full text-sm outline-none bg-white shadow-sm"
          onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
          onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
      </div>
      {cargandoEst ? (
        <div className="text-center py-10 text-sm" style={{ color: '#9CA3AF' }}>Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center py-12" style={{ color: '#9CA3AF' }}>
          <User size={40} style={{ color: '#BFDBFE' }} />
          <p className="text-sm mt-3">No hay estudiantes registrados</p>
          <button onClick={abrirNuevo} className="mt-3 text-sm underline font-medium" style={{ color: '#2563EB' }}>
            Agregar el primero
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #1E3A8A, #2563EB, #C8A24A)' }} />
          <div className="divide-y divide-gray-50">
            {filtrados.map((est) => (
              <div key={est.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                <button onClick={() => est.foto && setFotoVisor({ src: est.foto, nombre: est.nombre })}
                  className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: '#EFF6FF', cursor: est.foto ? 'zoom-in' : 'default' }}
                  tabIndex={est.foto ? 0 : -1}>
                  {est.foto
                    ? <Image src={est.foto} alt={est.nombre} width={44} height={44} className="object-cover w-full h-full" unoptimized />
                    : <User size={22} style={{ color: '#2563EB' }} />}
                </button>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm truncate block" style={{ color: '#1F2937' }}>{est.nombre}</span>
                  <div className="flex gap-3 text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    <span>CI: {est.cedula}</span>
                    {est.celular && <span>📱 {est.celular}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => abrirDetalle(est, 'asistencias')}
                    className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
                    <CheckCircle size={12} /> {est.total_asistencias}
                  </button>
                  <button onClick={() => abrirDetalle(est, 'faltas')}
                    className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                    <XCircle size={12} /> {est.total_faltas}
                  </button>
                  <button onClick={() => abrirEditar(est)}
                    className="p-2 rounded-lg hover:bg-blue-50 transition-colors" style={{ color: '#9CA3AF' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#2563EB')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}>
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => setConfirmEliminar(est.id)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors" style={{ color: '#9CA3AF' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── TABS ─────────────────────────────────────────────────────
  const tabs = (
    <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1 mb-6 gap-1">
      {([
        { key: 'asistencia', label: 'Asistencia', icon: CheckCircle },
        { key: 'estudiantes', label: 'Estudiantes', icon: Users },
        { key: 'historico', label: 'Histórico', icon: BookOpen },
      ] as { key: SeccionTab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
        <button key={key}
          onClick={() => {
            setSeccionTab(key);
            if (key === 'historico' && sesionesHist.length === 0) cargarHistorial();
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={seccionTab === key
            ? { background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: '#fff' }
            : { color: '#6B7280' }}>
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );

  // ── VISTA CONFIG ────────────────────────────────────────────
  if (vista === 'config') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold" style={{ color: '#1F2937' }}>Instituto Bíblico</h1>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Asistencia y gestión de estudiantes</p>
          </div>
          {tabs}
          {seccionTab === 'asistencia' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              {/* Selector de horario del culto */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#1F2937' }}>Culto</label>
                <div className="flex gap-2 p-1 rounded-xl" style={{ backgroundColor: '#F3F4F6' }}>
                  {[
                    { val: '',        label: 'Todos'    },
                    { val: '7:00 AM', label: '☀️ 7:00 AM' },
                    { val: '6:30 PM', label: '🌙 6:30 PM' },
                  ].map(({ val, label }) => (
                    <button key={val} type="button"
                      onClick={() => setFiltroHorario(val)}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                      style={filtroHorario === val
                        ? { backgroundColor: '#1E3A8A', color: '#fff' }
                        : { backgroundColor: 'transparent', color: '#6B7280' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#1F2937' }}>Fecha</label>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{ borderColor: '#E5E7EB' }}
                  onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#1F2937' }}>
                  Descripción <span className="font-normal" style={{ color: '#9CA3AF' }}>(opcional)</span>
                </label>
                <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Clase 1 — Introducción"
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{ borderColor: '#E5E7EB' }}
                  onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
              </div>
              <button onClick={iniciarSesion} disabled={cargando}
                className="w-full text-white font-semibold py-4 rounded-xl text-base transition-all active:scale-95 disabled:opacity-50 shadow-md"
                style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}>
                {cargando ? 'Cargando lista...' : 'Iniciar registro'}
              </button>
            </div>
          )}
          {seccionTab === 'estudiantes' && seccionEstudiantes}
          {seccionTab === 'historico' && seccionHistorico}
        </main>
        {modales}
      </div>
    );
  }

  // ── VISTA FLUJO ─────────────────────────────────────────────
  if (vista === 'flujo' && actual) {
    const progreso = (indice / asistencias.length) * 100;
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
        <Navbar />
        <div className="h-1" style={{ backgroundColor: '#E5E7EB' }}>
          <div className="h-full transition-all duration-500"
            style={{ width: `${progreso}%`, background: 'linear-gradient(90deg, #C8A24A, #F0DFA0)' }} />
        </div>
        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex flex-col items-center">

            <div className="text-sm font-medium mb-6 px-4 py-1.5 rounded-full"
              style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              {indice + 1} de {asistencias.length}
              {pendientes > 0 && <span style={{ color: '#9CA3AF' }}> · {pendientes} pendientes</span>}
            </div>
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border overflow-hidden mb-7"
              style={{ borderColor: '#E5E7EB' }}>
              <div className="relative flex items-center justify-center"
                style={{ height: 230, background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}>
                {actual.foto
                  ? <Image src={actual.foto} alt={actual.nombre} fill className="object-cover" unoptimized />
                  : <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: '#BFDBFE' }}>
                      <User size={48} style={{ color: '#2563EB' }} />
                    </div>}
                <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.9), transparent)' }} />
                {actual.asistio !== 0 && (
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow"
                    style={{ backgroundColor: actual.asistio === 1 ? '#16A34A' : '#DC2626' }}>
                    {actual.asistio === 1 ? '✓ Asistió' : '✗ Ausente'}
                  </div>
                )}
              </div>
              <div className="px-6 py-5">
                <h2 className="text-xl font-bold leading-snug mb-1" style={{ color: '#1F2937' }}>{actual.nombre}</h2>
                <div className="flex flex-wrap gap-3 text-sm" style={{ color: '#6B7280' }}>
                  <span>CI: {actual.cedula}</span>
                  {actual.celular && <span>📱 {actual.celular}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-3 w-full max-w-sm">
              <button onClick={() => registrar(false)} disabled={guardando}
                className="flex-1 flex flex-col items-center gap-2 text-white font-bold py-5 rounded-2xl transition-all active:scale-95 disabled:opacity-50 shadow-lg"
                style={{ backgroundColor: '#DC2626' }}>
                <XCircle size={30} />
                <span className="text-base">No asistió</span>
              </button>
              <button onClick={() => registrar(true)} disabled={guardando}
                className="flex-1 flex flex-col items-center gap-2 text-white font-bold py-5 rounded-2xl transition-all active:scale-95 disabled:opacity-50 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}>
                <CheckCircle size={30} />
                <span className="text-base">Asistió</span>
              </button>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <button onClick={() => setIndice((i) => Math.max(0, i - 1))} disabled={indice === 0}
                className="p-2 rounded-full disabled:opacity-30" style={{ color: '#6B7280' }}>
                <ChevronLeft size={22} />
              </button>
              <span className="text-xs" style={{ color: '#9CA3AF' }}>← → para navegar</span>
              <button onClick={() => setIndice((i) => Math.min(asistencias.length - 1, i + 1))} disabled={indice === asistencias.length - 1}
                className="p-2 rounded-full disabled:opacity-30" style={{ color: '#6B7280' }}>
                <ChevronRight size={22} />
              </button>
            </div>
            <button onClick={() => setVista('resumen')} className="mt-3 text-sm underline underline-offset-2" style={{ color: '#2563EB' }}>
              Ver resumen ({asistencias.length - pendientes} registrados)
            </button>
          </div>
          <div className="mt-8">
            {tabs}
            {seccionTab === 'estudiantes' && seccionEstudiantes}
            {seccionTab === 'historico' && seccionHistorico}
          </div>
        </main>
        {modales}
      </div>
    );
  }

  // ── VISTA RESUMEN ───────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-md"
            style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}>
            <CheckCircle size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1F2937' }}>Resumen de Asistencia</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            {sesion && formatFecha(sesion.fecha)}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: '#F0FDF4' }}>
            <div className="text-3xl font-bold" style={{ color: '#16A34A' }}>{asistieron}</div>
            <div className="text-sm font-medium mt-1" style={{ color: '#15803D' }}>Asistieron</div>
          </div>
          <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: '#FEF2F2' }}>
            <div className="text-3xl font-bold" style={{ color: '#DC2626' }}>{ausentes}</div>
            <div className="text-sm font-medium mt-1" style={{ color: '#B91C1C' }}>Ausentes</div>
          </div>
          <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: '#FEF9EC' }}>
            <div className="text-3xl font-bold" style={{ color: '#C8A24A' }}>{pct}%</div>
            <div className="text-sm font-medium mt-1" style={{ color: '#92620E' }}>Asistencia</div>
          </div>
        </div>
        {pendientes > 0 && (
          <div className="rounded-xl p-4 mb-5 text-sm border"
            style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D', color: '#92400E' }}>
            <strong>{pendientes} estudiante(s)</strong> aún sin registrar.
            <button onClick={() => { const idx = asistencias.findIndex((x) => x.asistio === 0); if (idx >= 0) { setIndice(idx); setVista('flujo'); } }}
              className="ml-2 underline font-semibold">Continuar registro</button>
          </div>
        )}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
          <div className="flex justify-between text-sm mb-2" style={{ color: '#6B7280' }}>
            <span>{asistieron} de {asistencias.length} asistieron</span>
            <span className="font-bold" style={{ color: '#C8A24A' }}>{pct}%</span>
          </div>
          <div className="rounded-full h-3 overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #C8A24A, #F0DFA0)' }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-5">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ backgroundColor: '#C8A24A' }} />
              <h3 className="font-semibold text-sm" style={{ color: '#1F2937' }}>Lista completa</h3>
            </div>
            <a href={`/api/exportar?fecha=${sesion?.fecha}`}
              className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#2563EB' }}>
              <Download size={15} /> Exportar Excel
            </a>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {asistencias.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: a.asistio === 1 ? '#16A34A' : a.asistio === -1 ? '#DC2626' : '#D1D5DB' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: '#1F2937' }}>{a.nombre}</div>
                  <div className="text-xs" style={{ color: '#9CA3AF' }}>{a.cedula}</div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={a.asistio === 1 ? { backgroundColor: '#DCFCE7', color: '#15803D' }
                    : a.asistio === -1 ? { backgroundColor: '#FEE2E2', color: '#DC2626' }
                    : { backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                  {a.asistio === 1 ? 'Asistió' : a.asistio === -1 ? 'Ausente' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => { setSesion(null); setAsistencias([]); setIndice(0); setVista('config'); setDescripcion(''); }}
            className="flex-1 flex items-center justify-center gap-2 font-semibold py-3 rounded-xl border"
            style={{ borderColor: '#E5E7EB', color: '#1F2937', backgroundColor: '#FFFFFF' }}>
            <RotateCcw size={17} /> Nueva sesión
          </button>
          <button onClick={() => { const idx = asistencias.findIndex((x) => x.asistio === 0); setIndice(idx >= 0 ? idx : 0); setVista('flujo'); }}
            className="flex-1 text-white font-semibold py-3 rounded-xl shadow-md"
            style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}>
            Editar registros
          </button>
        </div>
        <div className="mt-8">
          {tabs}
          {seccionTab === 'estudiantes' && seccionEstudiantes}
          {seccionTab === 'historico' && seccionHistorico}
        </div>
      </main>
      {modales}
    </div>
  );
}
