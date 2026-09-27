'use client';

import { useEffect, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Plus, Search, Edit2, Trash2, X, User, Camera, CheckCircle, XCircle, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Estudiante {
  id: number;
  nombre: string;
  cedula: string;
  celular: string | null;
  foto: string | null;
  activo: number;
  creado_en: string;
  total_asistencias: number;
  total_faltas: number;
}

interface FormData {
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

interface DetalleModal {
  estudiante: Estudiante;
  filtro: 'asistencias' | 'faltas';
}

const EMPTY_FORM: FormData = { nombre: '', cedula: '', celular: '', foto: '' };

export default function EstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [buscar, setBuscar] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState<'nuevo' | 'editar' | null>(null);
  const [editando, setEditando] = useState<Estudiante | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState<number | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [detalleModal, setDetalleModal] = useState<DetalleModal | null>(null);
  const [registros, setRegistros] = useState<RegistroAsistencia[]>([]);
  const [cargandoRegistros, setCargandoRegistros] = useState(false);
  const [fotoVisor, setFotoVisor] = useState<{ src: string; nombre: string } | null>(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const res = await fetch('/api/estudiantes');
      const data = await res.json();
      setEstudiantes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }

  const filtrados = estudiantes.filter(
    (e) => e.nombre.toLowerCase().includes(buscar.toLowerCase()) || e.cedula.includes(buscar)
  );

  function abrirNuevo() { setForm(EMPTY_FORM); setError(''); setModal('nuevo'); }

  function abrirEditar(est: Estudiante) {
    setEditando(est);
    setForm({ nombre: est.nombre, cedula: est.cedula, celular: est.celular || '', foto: est.foto || '' });
    setError(''); setModal('editar');
  }

  function cerrarModal() { setModal(null); setEditando(null); setError(''); setSubiendoFoto(false); }

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const cedula = form.cedula.trim() || `temp_${Date.now()}`;

    // Preview local inmediato mientras sube
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
      else setError(data.error || 'Error al subir foto');
    } catch { setError('Error de conexión al subir foto'); }
    finally { setSubiendoFoto(false); }
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.cedula.trim()) { setError('Nombre y cédula son requeridos'); return; }
    setGuardando(true); setError('');
    try {
      const url = modal === 'editar' ? `/api/estudiantes/${editando!.id}` : '/api/estudiantes';
      const res = await fetch(url, {
        method: modal === 'editar' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, activo: 1 }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al guardar'); return; }
      cerrarModal(); cargar();
    } catch { setError('Error de conexión'); }
    finally { setGuardando(false); }
  }

  async function eliminar(id: number) {
    await fetch(`/api/estudiantes/${id}`, { method: 'DELETE' });
    setConfirmEliminar(null); cargar();
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

  const formatFecha = (fecha: string) => {
    try { return format(new Date(fecha + 'T00:00:00'), "d 'de' MMMM yyyy", { locale: es }); }
    catch { return fecha; }
  };

  const inputClass = "w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all";

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1F2937' }}>Estudiantes</h1>
            <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>{filtrados.length} registros</p>
          </div>
          <button
            onClick={abrirNuevo}
            className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-full transition-all active:scale-95 shadow-md"
            style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}
          >
            <Plus size={18} />
            Nuevo estudiante
          </button>
        </div>

        {/* Búsqueda */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: '#9CA3AF' }} />
          <input
            type="text"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar por nombre o cédula..."
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-full text-sm outline-none bg-white shadow-sm transition-all"
            onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
            onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
          />
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="flex items-center justify-center py-16" style={{ color: '#9CA3AF' }}>Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: '#9CA3AF' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: '#EFF6FF' }}>
              <User size={40} style={{ color: '#BFDBFE' }} />
            </div>
            <p className="text-sm">No hay estudiantes registrados</p>
            <button onClick={abrirNuevo} className="mt-4 text-sm underline font-medium" style={{ color: '#2563EB' }}>
              Agregar el primero
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Borde dorado superior */}
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #1E3A8A, #2563EB, #C8A24A)' }} />
            <div className="divide-y divide-gray-50">
              {filtrados.map((est) => (
                <div key={est.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  {/* Avatar */}
                  <button
                    onClick={() => est.foto && setFotoVisor({ src: est.foto, nombre: est.nombre })}
                    className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center transition-opacity"
                    style={{ backgroundColor: '#EFF6FF', cursor: est.foto ? 'zoom-in' : 'default' }}
                    tabIndex={est.foto ? 0 : -1}
                    aria-label={est.foto ? `Ver foto de ${est.nombre}` : undefined}
                  >
                    {est.foto ? (
                      <Image src={est.foto} alt={est.nombre} width={48} height={48} className="object-cover w-full h-full" unoptimized />
                    ) : (
                      <User size={24} style={{ color: '#2563EB' }} />
                    )}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold truncate block" style={{ color: '#1F2937' }}>{est.nombre}</span>
                    <div className="flex gap-3 text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#C8A24A' }} />
                        CI: {est.cedula}
                      </span>
                      {est.celular && <span>📱 {est.celular}</span>}
                    </div>
                  </div>

                  {/* Asistencias / Faltas */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => abrirDetalle(est, 'asistencias')}
                      className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full transition-all hover:opacity-80 active:scale-95"
                      style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}
                      title="Ver sesiones en que asistió"
                    >
                      <CheckCircle size={13} />
                      {est.total_asistencias}
                    </button>
                    <button
                      onClick={() => abrirDetalle(est, 'faltas')}
                      className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full transition-all hover:opacity-80 active:scale-95"
                      style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
                      title="Ver sesiones en que faltó"
                    >
                      <XCircle size={13} />
                      {est.total_faltas}
                    </button>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => abrirEditar(est)}
                      className="p-2 rounded-lg transition-colors hover:bg-blue-50"
                      style={{ color: '#9CA3AF' }}
                      title="Editar"
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#2563EB')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
                    >
                      <Edit2 size={17} />
                    </button>
                    <button
                      onClick={() => setConfirmEliminar(est.id)}
                      className="p-2 rounded-lg transition-colors hover:bg-red-50"
                      style={{ color: '#9CA3AF' }}
                      title="Eliminar"
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal nuevo/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header modal con gradiente */}
            <div className="flex items-center justify-between px-6 py-5"
              style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}>
              <h2 className="text-base font-bold text-white">
                {modal === 'nuevo' ? 'Nuevo estudiante' : 'Editar estudiante'}
              </h2>
              <button onClick={cerrarModal} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <X size={18} className="text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {[
                { label: 'Nombre completo *', key: 'nombre', placeholder: 'Ej: Juan Pérez' },
                { label: 'Cédula *', key: 'cedula', placeholder: 'Ej: 1234567' },
                { label: 'Celular', key: 'celular', placeholder: 'Ej: 0414-1234567' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1F2937' }}>{label}</label>
                  <input
                    type="text"
                    value={form[key as keyof FormData]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className={inputClass}
                    style={{ borderColor: '#E5E7EB', color: '#1F2937' }}
                    onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>
              ))}

              {/* Foto */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1F2937' }}>Foto</label>
                <div className="flex items-center gap-3">
                  {/* Preview */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200"
                    style={{ backgroundColor: '#EFF6FF' }}>
                    {form.foto ? (
                      <Image src={form.foto} alt="preview" width={64} height={64}
                        className="object-cover w-full h-full" unoptimized />
                    ) : (
                      <User size={28} style={{ color: '#93C5FD' }} />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    {/* Camera / file button */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="hidden"
                      onChange={handleFotoChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={subiendoFoto}
                      className="w-full flex items-center justify-center gap-2 border rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-50"
                      style={{ borderColor: '#2563EB', color: '#2563EB', backgroundColor: '#EFF6FF' }}
                    >
                      <Camera size={16} />
                      {subiendoFoto ? 'Subiendo...' : 'Tomar foto / Elegir archivo'}
                    </button>
                    {/* URL manual fallback */}
                    <input
                      type="text"
                      value={form.foto}
                      onChange={(e) => setForm({ ...form, foto: e.target.value })}
                      placeholder="O pega una URL de imagen"
                      className={inputClass}
                      style={{ borderColor: '#E5E7EB', color: '#1F2937', fontSize: '12px' }}
                      onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                      onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-sm px-4 py-3 rounded-xl" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={cerrarModal}
                className="flex-1 border font-semibold py-3 rounded-full transition-all"
                style={{ borderColor: '#E5E7EB', color: '#1F2937' }}
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando}
                className="flex-1 text-white font-semibold py-3 rounded-full transition-all disabled:opacity-50 shadow-md"
                style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle asistencias/faltas */}
      {detalleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <button
                onClick={() => setDetalleModal(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: '#6B7280' }}
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: '#1F2937' }}>
                  {detalleModal.estudiante.nombre}
                </p>
                <p className="text-xs" style={{ color: '#6B7280' }}>
                  {detalleModal.filtro === 'asistencias' ? 'Sesiones en que asistió' : 'Sesiones en que faltó'}
                </p>
              </div>
              {/* Tabs */}
              <div className="flex gap-1">
                <button
                  onClick={() => setDetalleModal({ ...detalleModal, filtro: 'asistencias' })}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-all"
                  style={detalleModal.filtro === 'asistencias'
                    ? { backgroundColor: '#DCFCE7', color: '#15803D' }
                    : { backgroundColor: '#F3F4F6', color: '#9CA3AF' }}
                >
                  <CheckCircle size={12} />
                  {detalleModal.estudiante.total_asistencias}
                </button>
                <button
                  onClick={() => setDetalleModal({ ...detalleModal, filtro: 'faltas' })}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-all"
                  style={detalleModal.filtro === 'faltas'
                    ? { backgroundColor: '#FEE2E2', color: '#DC2626' }
                    : { backgroundColor: '#F3F4F6', color: '#9CA3AF' }}
                >
                  <XCircle size={12} />
                  {detalleModal.estudiante.total_faltas}
                </button>
              </div>
            </div>

            {/* Lista */}
            <div className="overflow-y-auto flex-1">
              {cargandoRegistros ? (
                <div className="py-10 text-center text-sm" style={{ color: '#9CA3AF' }}>Cargando...</div>
              ) : (() => {
                const filtrados2 = registros.filter((r) =>
                  detalleModal.filtro === 'asistencias' ? r.asistio === 1 : r.asistio === 0
                );
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
                          {r.descripcion && (
                            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{r.descripcion}</p>
                          )}
                        </div>
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={r.asistio === 1
                            ? { backgroundColor: '#DCFCE7', color: '#15803D' }
                            : { backgroundColor: '#FEE2E2', color: '#DC2626' }}
                        >
                          {r.asistio === 1 ? 'Asistió' : 'Ausente'}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="px-5 py-4 border-t border-gray-100">
              <button
                onClick={() => setDetalleModal(null)}
                className="w-full border font-semibold py-3 rounded-full"
                style={{ borderColor: '#E5E7EB', color: '#1F2937' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visor de foto */}
      {fotoVisor && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/90" onClick={() => setFotoVisor(null)}>
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <Image
              src={fotoVisor.src}
              alt={fotoVisor.nombre}
              width={500}
              height={500}
              className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
              unoptimized
            />
          </div>
          <div className="flex-shrink-0 px-6 pb-8 pt-3 flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-white font-semibold text-sm drop-shadow">{fotoVisor.nombre}</p>
            <button
              onClick={() => setFotoVisor(null)}
              className="flex items-center gap-2 font-semibold px-8 py-3 rounded-full shadow-lg text-sm"
              style={{ backgroundColor: '#1F2937', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <X size={16} /> Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Confirmar eliminar */}
      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4 mx-auto"
              style={{ backgroundColor: '#FEF2F2' }}>
              <Trash2 size={22} style={{ color: '#DC2626' }} />
            </div>
            <h3 className="text-lg font-bold text-center mb-2" style={{ color: '#1F2937' }}>¿Eliminar estudiante?</h3>
            <p className="text-sm text-center mb-6" style={{ color: '#6B7280' }}>
              El estudiante será eliminado del Instituto. Sus registros de asistencia se conservarán.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmEliminar(null)}
                className="flex-1 border font-semibold py-3 rounded-full"
                style={{ borderColor: '#E5E7EB', color: '#1F2937' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminar(confirmEliminar)}
                className="flex-1 text-white font-semibold py-3 rounded-full"
                style={{ backgroundColor: '#DC2626' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
