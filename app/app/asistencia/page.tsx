'use client';

import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, User, RotateCcw, Download } from 'lucide-react';
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

type Vista = 'config' | 'flujo' | 'resumen';

export default function AsistenciaPage() {
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [descripcion, setDescripcion] = useState('');
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [indice, setIndice] = useState(0);
  const [vista, setVista] = useState<Vista>('config');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const iniciarSesion = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/asistencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, descripcion }),
      });
      const s: Sesion = await res.json();
      setSesion(s);
      const aRes = await fetch(`/api/asistencias?sesion_id=${s.id}`);
      const a: Asistencia[] = await aRes.json();
      setAsistencias(a);
      const primerPendiente = a.findIndex((x) => x.asistio === 0);
      setIndice(primerPendiente >= 0 ? primerPendiente : 0);
      setVista('flujo');
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
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
      if (indice < asistencias.length - 1) {
        setIndice((i) => i + 1);
      } else {
        setVista('resumen');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
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

  /* ─── CONFIG ─── */
  if (vista === 'config') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
        <Navbar />
        <main className="max-w-lg mx-auto px-4 py-10">
          {/* Título */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-md"
              style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}>
              <CheckCircle size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#1F2937' }}>Tomar Asistencia</h1>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Selecciona la fecha y comienza el registro</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1F2937' }}>Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ borderColor: '#E5E7EB' }}
                onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1F2937' }}>
                Descripción <span className="font-normal" style={{ color: '#9CA3AF' }}>(opcional)</span>
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Clase 1 — Introducción"
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ borderColor: '#E5E7EB' }}
                onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>
            <button
              onClick={iniciarSesion}
              disabled={cargando}
              className="w-full text-white font-semibold py-4 rounded-xl text-base transition-all active:scale-95 disabled:opacity-50 shadow-md"
              style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}
            >
              {cargando ? 'Cargando lista...' : 'Iniciar registro'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* ─── FLUJO ─── */
  if (vista === 'flujo' && actual) {
    const progreso = (indice / asistencias.length) * 100;

    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F3F4F6' }}>
        <Navbar />

        {/* Barra de progreso dorada */}
        <div className="h-1" style={{ backgroundColor: '#E5E7EB' }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${progreso}%`,
              background: 'linear-gradient(90deg, #C8A24A, #F0DFA0)',
            }}
          />
        </div>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          {/* Contador */}
          <div className="text-sm font-medium mb-6 px-4 py-1.5 rounded-full"
            style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
            {indice + 1} de {asistencias.length}
            {pendientes > 0 && <span style={{ color: '#9CA3AF' }}> · {pendientes} pendientes</span>}
          </div>

          {/* Tarjeta estudiante */}
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border overflow-hidden mb-7"
            style={{ borderColor: '#E5E7EB' }}>
            {/* Foto */}
            <div className="relative flex items-center justify-center"
              style={{ height: 230, background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}>
              {actual.foto ? (
                <Image
                  src={actual.foto}
                  alt={actual.nombre}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#BFDBFE' }}>
                    <User size={48} style={{ color: '#2563EB' }} />
                  </div>
                </div>
              )}

              {/* Overlay degradado inferior */}
              <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.9), transparent)' }} />

              {/* Badge estado si ya marcado */}
              {actual.asistio !== 0 && (
                <div
                  className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow"
                  style={{ backgroundColor: actual.asistio === 1 ? '#16A34A' : '#DC2626' }}
                >
                  {actual.asistio === 1 ? '✓ Asistió' : '✗ Ausente'}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="px-6 py-5">
              <h2 className="text-xl font-bold leading-snug mb-1" style={{ color: '#1F2937' }}>
                {actual.nombre}
              </h2>
              <div className="flex flex-wrap gap-3 text-sm" style={{ color: '#6B7280' }}>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#C8A24A' }} />
                  CI: {actual.cedula}
                </span>
                {actual.celular && (
                  <span>📱 {actual.celular}</span>
                )}
              </div>
            </div>
          </div>

          {/* Botones acción */}
          <div className="flex gap-3 w-full max-w-sm">
            <button
              onClick={() => registrar(false)}
              disabled={guardando}
              className="flex-1 flex flex-col items-center gap-2 text-white font-bold py-5 rounded-2xl transition-all active:scale-95 disabled:opacity-50 shadow-lg"
              style={{ backgroundColor: '#DC2626' }}
            >
              <XCircle size={30} />
              <span className="text-base">No asistió</span>
            </button>
            <button
              onClick={() => registrar(true)}
              disabled={guardando}
              className="flex-1 flex flex-col items-center gap-2 text-white font-bold py-5 rounded-2xl transition-all active:scale-95 disabled:opacity-50 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}
            >
              <CheckCircle size={30} />
              <span className="text-base">Asistió</span>
            </button>
          </div>

          {/* Navegación */}
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => setIndice((i) => Math.max(0, i - 1))}
              disabled={indice === 0}
              className="p-2 rounded-full transition-colors disabled:opacity-30"
              style={{ color: '#6B7280' }}
            >
              <ChevronLeft size={22} />
            </button>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>
              ← → para navegar · Enter / ← para registrar
            </span>
            <button
              onClick={() => setIndice((i) => Math.min(asistencias.length - 1, i + 1))}
              disabled={indice === asistencias.length - 1}
              className="p-2 rounded-full transition-colors disabled:opacity-30"
              style={{ color: '#6B7280' }}
            >
              <ChevronRight size={22} />
            </button>
          </div>

          <button
            onClick={() => setVista('resumen')}
            className="mt-3 text-sm underline underline-offset-2 transition-colors"
            style={{ color: '#2563EB' }}
          >
            Ver resumen ({asistencias.length - pendientes} registrados)
          </button>
        </main>
      </div>
    );
  }

  /* ─── RESUMEN ─── */
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-md"
            style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}>
            <CheckCircle size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1F2937' }}>Resumen de Asistencia</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            {sesion && format(new Date(sesion.fecha + 'T00:00:00'), "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>

        {/* Stat cards con acento dorado */}
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

        {/* Aviso pendientes */}
        {pendientes > 0 && (
          <div className="rounded-xl p-4 mb-5 text-sm border"
            style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D', color: '#92400E' }}>
            <strong>{pendientes} estudiante(s)</strong> aún sin registrar.
            <button
              onClick={() => {
                const idx = asistencias.findIndex((x) => x.asistio === 0);
                if (idx >= 0) { setIndice(idx); setVista('flujo'); }
              }}
              className="ml-2 underline font-semibold"
            >
              Continuar registro
            </button>
          </div>
        )}

        {/* Barra de progreso */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
          <div className="flex justify-between text-sm mb-2" style={{ color: '#6B7280' }}>
            <span>{asistieron} de {asistencias.length} asistieron</span>
            <span className="font-bold" style={{ color: '#C8A24A' }}>{pct}%</span>
          </div>
          <div className="rounded-full h-3 overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #C8A24A, #F0DFA0)',
              }}
            />
          </div>
        </div>

        {/* Lista completa */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-5">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ backgroundColor: '#C8A24A' }} />
              <h3 className="font-semibold text-sm" style={{ color: '#1F2937' }}>Lista completa</h3>
            </div>
            <a
              href={`/api/exportar?fecha=${sesion?.fecha}`}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: '#2563EB' }}
            >
              <Download size={15} />
              Exportar Excel
            </a>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {asistencias.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: a.asistio === 1 ? '#16A34A' : a.asistio === -1 ? '#DC2626' : '#D1D5DB',
                  }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: '#1F2937' }}>{a.nombre}</div>
                  <div className="text-xs" style={{ color: '#9CA3AF' }}>{a.cedula}</div>
                </div>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={
                    a.asistio === 1
                      ? { backgroundColor: '#DCFCE7', color: '#15803D' }
                      : a.asistio === -1
                      ? { backgroundColor: '#FEE2E2', color: '#DC2626' }
                      : { backgroundColor: '#F3F4F6', color: '#6B7280' }
                  }
                >
                  {a.asistio === 1 ? 'Asistió' : a.asistio === -1 ? 'Ausente' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              setSesion(null); setAsistencias([]); setIndice(0);
              setVista('config'); setDescripcion('');
            }}
            className="flex-1 flex items-center justify-center gap-2 font-semibold py-3 rounded-xl border transition-all"
            style={{ borderColor: '#E5E7EB', color: '#1F2937', backgroundColor: '#FFFFFF' }}
          >
            <RotateCcw size={17} />
            Nueva sesión
          </button>
          <button
            onClick={() => {
              const idx = asistencias.findIndex((x) => x.asistio === 0);
              setIndice(idx >= 0 ? idx : 0);
              setVista('flujo');
            }}
            className="flex-1 text-white font-semibold py-3 rounded-xl transition-all shadow-md"
            style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}
          >
            Editar registros
          </button>
        </div>
      </main>
    </div>
  );
}
