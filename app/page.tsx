'use client';

import { useEffect, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import * as XLSX from 'xlsx';
import Image from 'next/image';
import {
  User, UserPlus, Search, Edit2, Trash2, X, Camera,
  Shield, Heart, Music, ChevronDown, ChevronUp,
} from 'lucide-react';

// ── Constantes de categorías ─────────────────────────────────
const DONES = [
  'Imposición de Manos', 'Profecía', 'Pastorado',
  'Instituto Bíblico', 'Introducción', 'Predicación',
];
const LABORES = [
  'Sonido', 'Cámaras', 'Vigilancia', 'Baños',
  'Casilleros', 'Apoyo Ofrenda', 'Fundas',
  'Ofrenda Interno', 'Ofrenda Organización',
];
const MIRA_ROLES = [
  'Del. Político', 'Del. Comunicaciones', 'InfoMIRA',
  'Del. Electoral', 'Del. Ideológico',
];
const FIMLM_ROLES = [
  'Cord. Logística', 'Coord. Gestión', 'Cord. Adm y Fcro', 'Campus',
];

// ── Tipos ────────────────────────────────────────────────────
interface Colaborador {
  id: number;
  nombre: string;
  cedula: string | null;
  celular: string | null;
  email: string | null;
  horario: string | null;
  foto: string | null;
  dones: string[];
  labores: string[];
  mira: string[];
  fimlm: string[];
  fecha_inicio: string | null;
  fecha_espiritu: string | null;
  fecha_profecia: string | null;
  observaciones: string | null;
  dia_profecia: string[];
  activo: number;
}

const EMPTY_FORM = {
  nombre: '', cedula: '', celular: '', email: '', horario: '7:00 AM',
  foto: '',
  dones: [] as string[], labores: [] as string[],
  mira: [] as string[], fimlm: [] as string[],
  fecha_inicio: '', fecha_espiritu: '', fecha_profecia: '',
  observaciones: '',
  dia_profecia: [] as string[],
};

type FiltroTab = 'todos' | 'dones' | 'labores' | 'mira' | 'fimlm' | 'dias';

// ── Helpers ──────────────────────────────────────────────────
function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color + '22', color }}>
      {label}
    </span>
  );
}

function CheckGroup({
  title, items, selected, onChange,
}: {
  title: string; items: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = selected.includes(item);
          return (
            <button key={item} type="button"
              onClick={() => onChange(toggle(selected, item))}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={active
                ? { backgroundColor: '#1E3A8A', color: '#fff', borderColor: '#1E3A8A' }
                : { backgroundColor: '#fff', color: '#374151', borderColor: '#D1D5DB' }}>
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function ColaboradoresPage() {
  const [todos, setTodos]       = useState<Colaborador[]>([]);
  const [cargando, setCargando] = useState(true);
  const [buscar, setBuscar]     = useState('');
  const [filtroHorario, setFiltroHorario] = useState('');
  const [filtroTab, setFiltroTab]         = useState<FiltroTab>('todos');
  const [filtroValor, setFiltroValor]     = useState('');

  const [modal, setModal]         = useState<'nuevo' | 'editar' | null>(null);
  const [editando, setEditando]   = useState<Colaborador | null>(null);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [confirmEliminar, setConfirmEliminar] = useState<Colaborador | null>(null);
  const [eliminando, setEliminando]           = useState(false);
  const [fotoVisor, setFotoVisor] = useState<{ src: string; nombre: string } | null>(null);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  // Cargar TODOS los colaboradores una sola vez
  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const res  = await fetch('/api/colaboradores');
      const data = await res.json();
      setTodos(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }

  // Filtrado local — instantáneo, sin consultas al servidor
  const colaboradores = (() => {
    let lista = todos;
    // Filtro principal por horario del culto
    if (filtroHorario) lista = lista.filter((c) => c.horario === filtroHorario);
    if (buscar.trim()) {
      const b = buscar.toLowerCase();
      lista = lista.filter((c) =>
        c.nombre.toLowerCase().includes(b) ||
        (c.cedula  ?? '').includes(b)       ||
        (c.celular ?? '').includes(b)
      );
    }
    if (filtroValor) {
      if (filtroTab === 'dones')   lista = lista.filter((c) => c.dones?.includes(filtroValor));
      if (filtroTab === 'labores') lista = lista.filter((c) => c.labores?.includes(filtroValor));
      if (filtroTab === 'mira')    lista = lista.filter((c) => c.mira?.includes(filtroValor));
      if (filtroTab === 'fimlm')   lista = lista.filter((c) => c.fimlm?.includes(filtroValor));
      if (filtroTab === 'dias')    lista = lista.filter((c) => c.dia_profecia?.includes(filtroValor));
    } else {
      if (filtroTab === 'mira')  lista = lista.filter((c) => (c.mira?.length  ?? 0) > 0);
      if (filtroTab === 'fimlm') lista = lista.filter((c) => (c.fimlm?.length ?? 0) > 0);
    }
    return lista;
  })();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  // ── Abrir modal ──────────────────────────────────────────
  function abrirNuevo() {
    setEditando(null);
    setForm({ ...EMPTY_FORM });
    setErrorModal('');
    setModal('nuevo');
  }

  function abrirEditar(col: Colaborador) {
    setEditando(col);
    setForm({
      nombre:         col.nombre          || '',
      cedula:         col.cedula          || '',
      celular:        col.celular         || '',
      email:          col.email           || '',
      horario:        col.horario         || '7:00 AM',
      foto:           col.foto            || '',
      dones:          Array.isArray(col.dones)   ? col.dones   : [],
      labores:        Array.isArray(col.labores) ? col.labores : [],
      mira:           Array.isArray(col.mira)    ? col.mira    : [],
      fimlm:          Array.isArray(col.fimlm)   ? col.fimlm   : [],
      fecha_inicio:   col.fecha_inicio    || '',
      fecha_espiritu: col.fecha_espiritu  || '',
      fecha_profecia: col.fecha_profecia  || '',
      observaciones:  col.observaciones   || '',
      dia_profecia:   Array.isArray(col.dia_profecia) ? col.dia_profecia : [],
    });
    setErrorModal('');
    setModal('editar');
  }

  // ── Subir foto ───────────────────────────────────────────
  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!form.cedula.trim()) {
      setErrorModal('Ingresa la cédula antes de subir la foto.');
      return;
    }
    setSubiendoFoto(true);
    try {
      const fd = new FormData();
      fd.append('foto', file);
      fd.append('cedula', form.cedula.trim());
      const res = await fetch('/api/subir-foto', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir foto');
      setForm((f) => ({ ...f, foto: data.url }));
    } catch (err: unknown) {
      setErrorModal((err as Error).message);
    } finally {
      setSubiendoFoto(false);
    }
  }

  // ── Guardar ──────────────────────────────────────────────
  async function handleGuardar() {
    if (!form.nombre.trim()) { setErrorModal('El nombre es requerido.'); return; }
    setGuardando(true);
    setErrorModal('');
    try {
      const url    = modal === 'editar' ? `/api/colaboradores?id=${editando!.id}` : '/api/colaboradores';
      const method = modal === 'editar' ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Error al guardar');
      }
      setModal(null);
      showToast(modal === 'editar' ? 'Colaborador actualizado ✓' : 'Colaborador creado ✓');
      cargar();
    } catch (err: unknown) {
      setErrorModal((err as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  // ── Eliminar ─────────────────────────────────────────────
  async function handleEliminar() {
    if (!confirmEliminar) return;
    setEliminando(true);
    try {
      await fetch(`/api/colaboradores?id=${confirmEliminar.id}`, { method: 'DELETE' });
      setConfirmEliminar(null);
      showToast('Colaborador eliminado');
      cargar();
    } catch { showToast('Error al eliminar'); }
    finally { setEliminando(false); }
  }

  // ── Sub-filtros según tab activo ─────────────────────────
  // ── Exportar a Excel ────────────────────────────────────────
  function exportarExcel() {
    const titulo = filtroHorario ? `Colaboradores ${filtroHorario}` : 'Todos los Colaboradores';
    const rows = colaboradores.map((c) => ({
      'Nombre':            c.nombre,
      'Cédula':            c.cedula            || '',
      'Celular':           c.celular           || '',
      'Email':             c.email             || '',
      'Horario Culto':     c.horario           || '',
      'Dones':             c.dones?.join(', ')        || '',
      'Labores':           c.labores?.join(', ')      || '',
      'Días Profecía':     c.dia_profecia?.join(', ') || '',
      'MIRA':              c.mira?.join(', ')         || '',
      'FIMLM':             c.fimlm?.join(', ')        || '',
      'Fecha Inicio':      c.fecha_inicio      || '',
      'Bautismo Espíritu': c.fecha_espiritu    || '',
      'Autorización Profecía': c.fecha_profecia || '',
      'Observaciones':     c.observaciones     || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    // Ancho de columnas automático
    const cols = Object.keys(rows[0] || {}).map((k) => ({ wch: Math.max(k.length, 14) }));
    ws['!cols'] = cols;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, titulo.slice(0, 31));
    const fecha = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
    XLSX.writeFile(wb, `colaboradores-itagui-${fecha}.xlsx`);
  }

  const filtrosDisponibles: string[] =
    filtroTab === 'dones'   ? DONES    :
    filtroTab === 'labores' ? LABORES  :
    filtroTab === 'mira'    ? MIRA_ROLES :
    filtroTab === 'fimlm'   ? FIMLM_ROLES :
    filtroTab === 'dias' ? ['Lunes', 'Miércoles', 'Viernes'] : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: '#1E3A8A' }}>
          {toast}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6">

        {/* Selector principal de horario */}
        <div className="flex gap-2 mb-4 p-1 rounded-2xl" style={{ backgroundColor: '#E5E7EB' }}>
          {[
            { val: '',        label: 'Todos los cultos' },
            { val: '7:00 AM', label: '☀️  7:00 AM' },
            { val: '6:30 PM', label: '🌙  6:30 PM' },
          ].map(({ val, label }) => (
            <button key={val}
              onClick={() => setFiltroHorario(val)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={filtroHorario === val
                ? { backgroundColor: '#1E3A8A', color: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }
                : { backgroundColor: 'transparent', color: '#6B7280' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1F2937' }}>Colaboradores</h1>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              {cargando ? '...' : `${colaboradores.length} resultado${colaboradores.length !== 1 ? 's' : ''}`}
              {filtroHorario && <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>Culto {filtroHorario}</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportarExcel}
              disabled={colaboradores.length === 0}
              title="Descargar Excel"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors"
              style={{ borderColor: '#D1D5DB', color: '#374151', backgroundColor: '#fff' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/>
              </svg>
              Excel
            </button>
            <button onClick={abrirNuevo}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm"
              style={{ backgroundColor: '#1E3A8A' }}>
              <UserPlus size={16} /> Nuevo
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none bg-white"
            style={{ borderColor: '#E5E7EB' }}
            placeholder="Buscar por nombre, cédula o teléfono…"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />
        </div>

        {/* Tabs de filtro */}
        <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
          {([
            { key: 'todos',   label: 'Todos'   },
            { key: 'dones',   label: 'Dones'   },
            { key: 'labores', label: 'Labores' },
            { key: 'mira',    label: 'MIRA'    },
            { key: 'fimlm',   label: 'FIMLM'   },
            { key: 'dias',    label: '📅 Días'  },
          ] as { key: FiltroTab; label: string }[]).map(({ key, label }) => (
            <button key={key}
              onClick={() => { setFiltroTab(key); setFiltroValor(''); }}
              className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all"
              style={filtroTab === key
                ? { backgroundColor: '#1E3A8A', color: '#fff', borderColor: '#1E3A8A' }
                : { backgroundColor: '#fff', color: '#374151', borderColor: '#D1D5DB' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Sub-filtros */}
        {filtrosDisponibles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filtrosDisponibles.map((f) => (
              <button key={f}
                onClick={() => setFiltroValor(filtroValor === f ? '' : f)}
                className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                style={filtroValor === f
                  ? { backgroundColor: '#C8A24A', color: '#fff', borderColor: '#C8A24A' }
                  : { backgroundColor: '#fff', color: '#6B7280', borderColor: '#E5E7EB' }}>
                {f}
              </button>
            ))}
          </div>
        )}

        {/* Lista */}
        {cargando ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse flex gap-3">
                <div className="w-14 h-14 rounded-full flex-shrink-0" style={{ backgroundColor: '#E5E7EB' }} />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 w-2/3 rounded" style={{ backgroundColor: '#E5E7EB' }} />
                  <div className="h-3 w-1/2 rounded" style={{ backgroundColor: '#E5E7EB' }} />
                </div>
              </div>
            ))}
          </div>
        ) : colaboradores.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#9CA3AF' }}>
            <User size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No hay colaboradores{buscar || filtroValor ? ' con ese filtro' : ''}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {colaboradores.map((col) => {
              const abierto = expandido === col.id;
              const tieneMira  = col.mira?.length  > 0;
              const tieneFimlm = col.fimlm?.length > 0;

              return (
                <div key={col.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden"
                  style={{ borderColor: '#F3F4F6' }}>

                  {/* Fila principal */}
                  <div className="flex items-center gap-3 p-4">
                    {/* Foto */}
                    <button
                      onClick={() => col.foto && setFotoVisor({ src: col.foto, nombre: col.nombre })}
                      className="flex-shrink-0 w-14 h-14 rounded-full overflow-hidden border-2 flex items-center justify-center"
                      style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                      {col.foto
                        ? <Image src={col.foto} alt={col.nombre} width={128} height={128} className="object-cover w-full h-full" unoptimized />
                        : <User size={24} style={{ color: '#9CA3AF' }} />
                      }
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: '#1F2937' }}>{col.nombre}</p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>
                        {col.cedula && <span>{col.cedula}</span>}
                        {col.cedula && col.celular && <span className="mx-1">·</span>}
                        {col.celular && <span>{col.celular}</span>}
                      </p>
                      {/* Badges por categoría con colores */}
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {col.dones?.slice(0,2).map((d) => <Badge key={d} label={d} color="#C8A24A" />)}
                        {col.dones?.includes('Profecía') && (col.dia_profecia?.length ?? 0) > 0 && (
                          <Badge label={col.dia_profecia.map((d: string) => d.slice(0,3)).join(' · ')} color="#7C3AED" />
                        )}
                        {col.labores?.slice(0,2).map((l) => <Badge key={l} label={l} color="#7C3AED" />)}
                        {(col.labores?.length ?? 0) > 2 && (
                          <Badge label={`+${col.labores.length - 2} labores`} color="#7C3AED" />
                        )}
                        {tieneMira  && <Badge label="MIRA"  color="#2563EB" />}
                        {tieneFimlm && <Badge label="FIMLM" color="#16A34A" />}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setExpandido(abierto ? null : col.id)}
                        className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        {abierto ? <ChevronUp size={16} style={{ color: '#6B7280' }} /> : <ChevronDown size={16} style={{ color: '#6B7280' }} />}
                      </button>
                      <button onClick={() => abrirEditar(col)}
                        className="p-2 rounded-lg hover:bg-blue-50 transition-colors">
                        <Edit2 size={16} style={{ color: '#2563EB' }} />
                      </button>
                      <button onClick={() => setConfirmEliminar(col)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={16} style={{ color: '#EF4444' }} />
                      </button>
                    </div>
                  </div>

                  {/* Panel expandido */}
                  {abierto && (
                    <div className="px-4 pb-4 pt-0 border-t" style={{ borderColor: '#F3F4F6' }}>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-3 text-xs">
                        {col.email && (
                          <div>
                            <span className="font-semibold" style={{ color: '#6B7280' }}>Email: </span>
                            <span style={{ color: '#374151' }}>{col.email}</span>
                          </div>
                        )}
                        {col.fecha_inicio && (
                          <div>
                            <span className="font-semibold" style={{ color: '#6B7280' }}>Inicio: </span>
                            <span style={{ color: '#374151' }}>{col.fecha_inicio}</span>
                          </div>
                        )}
                        {col.fecha_espiritu && (
                          <div>
                            <span className="font-semibold" style={{ color: '#6B7280' }}>Bautismo Espíritu: </span>
                            <span style={{ color: '#374151' }}>{col.fecha_espiritu}</span>
                          </div>
                        )}
                        {col.fecha_profecia && (
                          <div>
                            <span className="font-semibold" style={{ color: '#6B7280' }}>Profecía: </span>
                            <span style={{ color: '#374151' }}>{col.fecha_profecia}</span>
                          </div>
                        )}
                      </div>

                      {/* Categorías expandidas con color de fondo por categoría */}
                      {[
                        { label: 'Dones',          items: col.dones,   color: '#C8A24A', bg: '#FEF9EC' },
                        { label: 'Labores Iglesia', items: col.labores, color: '#7C3AED', bg: '#F5F3FF' },
                        { label: 'MIRA',            items: col.mira,    color: '#2563EB', bg: '#EFF6FF' },
                        { label: 'FIMLM',           items: col.fimlm,   color: '#16A34A', bg: '#F0FDF4' },
                      ].filter(({ items }) => items?.length > 0).map(({ label, items, color, bg }) => (
                        <div key={label} className="mt-2 p-2 rounded-xl" style={{ backgroundColor: bg }}>
                          <p className="text-xs font-bold mb-1.5" style={{ color }}>{label}</p>
                          <div className="flex flex-wrap gap-1">
                            {items.map((item: string) => <Badge key={item} label={item} color={color} />)}
                          </div>
                        </div>
                      ))}
                      {col.dones?.includes('Profecía') && (col.dia_profecia?.length ?? 0) > 0 && (
                        <div className="mt-2 p-2 rounded-xl" style={{ backgroundColor: '#F5F3FF' }}>
                          <p className="text-xs font-bold mb-1.5" style={{ color: '#7C3AED' }}>📅 Días que profetiza</p>
                          <div className="flex gap-2">
                            {['Lunes','Miércoles','Viernes'].map((dia) => (
                              <span key={dia}
                                className="px-3 py-1 rounded-full text-xs font-semibold"
                                style={col.dia_profecia?.includes(dia)
                                  ? { backgroundColor: '#7C3AED', color: '#fff' }
                                  : { backgroundColor: '#E9D5FF', color: '#6D28D9' }}>
                                {dia}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {col.observaciones && (
                        <div className="mt-3 p-2 rounded-lg text-xs" style={{ backgroundColor: '#FEF9EC', color: '#92400E' }}>
                          <strong>Obs:</strong> {col.observaciones}
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

      {/* ── Modal crear / editar ── */}
      {modal && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-xl flex flex-col"
            style={{ maxHeight: '92dvh' }}>

            {/* Header modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#F3F4F6' }}>
              <h2 className="font-bold text-base" style={{ color: '#1F2937' }}>
                {modal === 'nuevo' ? 'Nuevo colaborador' : 'Editar colaborador'}
              </h2>
              <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={20} style={{ color: '#6B7280' }} />
              </button>
            </div>

            {/* Cuerpo scrollable */}
            <div className="overflow-y-auto px-5 py-4 space-y-5 flex-1">

              {/* Info personal */}
              <section>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#1E3A8A' }}>Información Personal</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Nombre *</label>
                    <input className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                      style={{ borderColor: '#E5E7EB' }}
                      value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Cédula</label>
                      <input className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                        style={{ borderColor: '#E5E7EB' }}
                        value={form.cedula} onChange={(e) => setForm((f) => ({ ...f, cedula: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Celular</label>
                      <input className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                        style={{ borderColor: '#E5E7EB' }}
                        value={form.celular} onChange={(e) => setForm((f) => ({ ...f, celular: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Email</label>
                    <input type="email" className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                      style={{ borderColor: '#E5E7EB' }}
                      value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Culto al que asiste</label>
                    <select className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white"
                      style={{ borderColor: '#E5E7EB' }}
                      value={form.horario}
                      onChange={(e) => setForm((f) => ({ ...f, horario: e.target.value }))}>
                      <option value="7:00 AM">7:00 AM — Mañana</option>
                      <option value="6:30 PM">6:30 PM — Tarde/Noche</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Foto */}
              <section>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#1E3A8A' }}>Foto</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                    {form.foto
                      ? <Image src={form.foto} alt="foto" width={128} height={128} className="object-cover w-full h-full" unoptimized />
                      : <User size={24} style={{ color: '#9CA3AF' }} />
                    }
                  </div>
                  <div className="flex-1">
                    <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
                      className="hidden" onChange={handleFoto} />
                    <button type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={subiendoFoto}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors"
                      style={{ borderColor: '#D1D5DB', color: '#374151' }}>
                      <Camera size={15} />
                      {subiendoFoto ? 'Subiendo…' : 'Seleccionar foto'}
                    </button>
                    {!form.cedula && (
                      <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Ingresa la cédula primero</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Fechas espirituales */}
              <section>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#1E3A8A' }}>Fechas Espirituales</p>
                <div className="space-y-3">
                  {[
                    { label: 'Fecha de inicio en la iglesia', key: 'fecha_inicio' },
                    { label: 'Bautismo del Espíritu Santo',   key: 'fecha_espiritu' },
                    { label: 'Autorización Profecía',         key: 'fecha_profecia' },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>{label}</label>
                      <input type="date" className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                        style={{ borderColor: '#E5E7EB' }}
                        value={form[key as keyof typeof form] as string}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Dones */}
              <section>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#1E3A8A' }}>
                  <Heart size={12} className="inline mr-1" />Dones
                </p>
                <CheckGroup title="" items={DONES} selected={form.dones}
                  onChange={(v) => setForm((f) => ({ ...f, dones: v }))} />
              </section>

              {/* Días de profecía — solo si tiene el don */}
              {form.dones.includes('Profecía') && (
                <section>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#7C3AED' }}>
                    📅 Días que profetiza
                  </p>
                  <div className="flex gap-3">
                    {['Lunes', 'Miércoles', 'Viernes'].map((dia) => {
                      const activo = form.dia_profecia.includes(dia);
                      return (
                        <button key={dia} type="button"
                          onClick={() => setForm((f) => ({
                            ...f,
                            dia_profecia: activo
                              ? f.dia_profecia.filter((d) => d !== dia)
                              : [...f.dia_profecia, dia],
                          }))}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold border transition-all"
                          style={activo
                            ? { backgroundColor: '#7C3AED', color: '#fff', borderColor: '#7C3AED' }
                            : { backgroundColor: '#fff', color: '#6B7280', borderColor: '#E5E7EB' }}>
                          {dia}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Labores */}
              <section>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#1E3A8A' }}>
                  <Music size={12} className="inline mr-1" />Labores Iglesia
                </p>
                <CheckGroup title="" items={LABORES} selected={form.labores}
                  onChange={(v) => setForm((f) => ({ ...f, labores: v }))} />
              </section>

              {/* MIRA */}
              <section>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#2563EB' }}>
                  <Shield size={12} className="inline mr-1" />MIRA — Partido Político
                </p>
                <CheckGroup title="" items={MIRA_ROLES} selected={form.mira}
                  onChange={(v) => setForm((f) => ({ ...f, mira: v }))} />
              </section>

              {/* FIMLM */}
              <section>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#16A34A' }}>
                  <Shield size={12} className="inline mr-1" />FIMLM — Fundación
                </p>
                <CheckGroup title="" items={FIMLM_ROLES} selected={form.fimlm}
                  onChange={(v) => setForm((f) => ({ ...f, fimlm: v }))} />
              </section>

              {/* Observaciones */}
              <section>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#1E3A8A' }}>Observaciones</p>
                <textarea rows={3} className="w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none"
                  style={{ borderColor: '#E5E7EB' }}
                  value={form.observaciones}
                  onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))} />
              </section>

              {errorModal && (
                <p className="text-xs font-medium px-3 py-2 rounded-xl" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                  {errorModal}
                </p>
              )}
            </div>

            {/* Footer modal */}
            <div className="px-5 py-4 border-t flex gap-3" style={{ borderColor: '#F3F4F6' }}>
              <button onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
                style={{ borderColor: '#D1D5DB', color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={handleGuardar} disabled={guardando}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: guardando ? '#93C5FD' : '#1E3A8A' }}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmar eliminar ── */}
      {confirmEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-base mb-2" style={{ color: '#1F2937' }}>¿Eliminar colaborador?</h3>
            <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
              Se eliminará <strong>{confirmEliminar.nombre}</strong> permanentemente.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmEliminar(null)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
                style={{ borderColor: '#D1D5DB', color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={handleEliminar} disabled={eliminando}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: eliminando ? '#FCA5A5' : '#EF4444' }}>
                {eliminando ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Visor foto ── */}
      {fotoVisor && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          onClick={() => setFotoVisor(null)}>
          <div className="relative max-w-md w-full px-4" onClick={(e) => e.stopPropagation()}>
            <Image src={fotoVisor.src} alt={fotoVisor.nombre} width={800} height={1000}
              className="w-full rounded-2xl object-contain" style={{ maxHeight: '75dvh' }} unoptimized />
            <p className="text-white text-center font-semibold mt-3">{fotoVisor.nombre}</p>
          </div>
          <button onClick={() => setFotoVisor(null)}
            className="mt-6 px-6 py-2.5 rounded-full text-sm font-semibold text-white border border-white/30">
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
