'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Users, Calendar, UserCheck, UserCog, ArrowRight, BarChart2, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Sesion {
  id: number; fecha: string; descripcion?: string;
  total_registros: number; total_asistieron: number;
}
interface Stats {
  totalColaboradores: number; imposicionManos: number; profecia: number;
  enMira: number; enFimlm: number; ultimaSesion: Sesion | null; totalEstudiantes: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalColaboradores: 0, imposicionManos: 0, profecia: 0,
    enMira: 0, enFimlm: 0, ultimaSesion: null, totalEstudiantes: 0,
  });
  const [loading, setLoading]         = useState(true);
  const [filtroHorario, setFiltroHorario] = useState('');
  const [todos, setTodos]             = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => {
      setStats({
        totalColaboradores: d.totalColaboradores ?? 0,
        imposicionManos:    d.imposicionManos    ?? 0,
        profecia:           d.profecia           ?? 0,
        enMira:             d.enMira             ?? 0,
        enFimlm:            d.enFimlm            ?? 0,
        ultimaSesion:       d.ultimaSesion       ?? null,
        totalEstudiantes:   d.totalEstudiantes   ?? 0,
      });
    }).catch(console.error).finally(() => setLoading(false));

    // Cargar colaboradores para filtro por horario en dashboard
    fetch('/api/colaboradores').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setTodos(d);
    }).catch(console.error);
  }, []);

  // Calcular stats filtradas por horario
  const lista = filtroHorario ? todos.filter((c: any) => c.horario === filtroHorario) : todos;
  const total        = filtroHorario ? lista.length : stats.totalColaboradores;
  const imposicion   = filtroHorario ? lista.filter((c: any) => c.dones?.includes('Imposición de Manos')).length : stats.imposicionManos;
  const profeciaNum  = filtroHorario ? lista.filter((c: any) => c.dones?.includes('Profecía')).length            : stats.profecia;
  const miraNum      = filtroHorario ? lista.filter((c: any) => (c.mira?.length  ?? 0) > 0).length              : stats.enMira;
  const fimlmNum     = filtroHorario ? lista.filter((c: any) => (c.fimlm?.length ?? 0) > 0).length              : stats.enFimlm;

  const pct = stats.ultimaSesion && stats.ultimaSesion.total_registros > 0
    ? Math.round((stats.ultimaSesion.total_asistieron / stats.ultimaSesion.total_registros) * 100) : 0;

  const cards = [
    { icon: Users,     valor: total,       label: 'Colaboradores',        iconBg: '#EFF6FF', iconColor: '#2563EB', href: `/colaboradores` },
    { icon: UserCheck, valor: imposicion,  label: 'Imposición de manos',  iconBg: '#FEF9EC', iconColor: '#C8A24A', href: '/colaboradores' },
    { icon: UserCog,   valor: profeciaNum, label: 'Profecía',             iconBg: '#F0FDF4', iconColor: '#16A34A', href: '/colaboradores' },
    { icon: Shield,    valor: miraNum,     label: 'En MIRA',              iconBg: '#EFF6FF', iconColor: '#2563EB', href: '/colaboradores' },
    { icon: Shield,    valor: fimlmNum,    label: 'En FIMLM',             iconBg: '#F0FDF4', iconColor: '#16A34A', href: '/colaboradores' },
    { icon: BarChart2, valor: stats.totalEstudiantes, label: 'Estudiantes Instituto', iconBg: '#FFF7ED', iconColor: '#EA580C', href: '/instituto' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Hero */}
        <div className="rounded-2xl overflow-hidden mb-6 shadow-md"
          style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1e4db7 60%, #2563EB 100%)' }}>
          <div className="px-8 py-7">
            <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#C8A24A' }}>
              Itagüí · IDMJI
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              Gestión de Colaboradores
            </h1>
          </div>
        </div>

        {/* Selector de horario en dashboard */}
        <div className="flex gap-2 mb-6 p-1 rounded-2xl" style={{ backgroundColor: '#E5E7EB' }}>
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {cards.map(({ icon: Icon, valor, label, iconBg, iconColor, href }) => (
            <Link key={label} href={href}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl" style={{ backgroundColor: iconBg }}>
                  <Icon size={20} style={{ color: iconColor }} />
                </div>
              </div>
              {loading
                ? <div className="h-9 w-16 rounded-lg animate-pulse mb-1" style={{ backgroundColor: '#E5E7EB' }} />
                : <div className="text-3xl font-bold" style={{ color: '#1F2937' }}>{valor}</div>
              }
              <div className="text-sm mt-1" style={{ color: '#6B7280' }}>{label}</div>
            </Link>
          ))}
        </div>

        {/* Última sesión */}
        {!loading && stats.ultimaSesion && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#C8A24A' }} />
              <h3 className="font-semibold" style={{ color: '#1F2937' }}>Última sesión del Instituto</h3>
            </div>
            <div className="flex flex-wrap gap-4 items-start">
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold" style={{ color: '#1F2937' }}>
                  {format(new Date(stats.ultimaSesion.fecha + 'T00:00:00'), "d 'de' MMMM yyyy", { locale: es })}
                </div>
                {stats.ultimaSesion.descripcion && (
                  <div className="text-sm mt-0.5" style={{ color: '#6B7280' }}>{stats.ultimaSesion.descripcion}</div>
                )}
              </div>
              <div className="flex gap-5 text-center flex-shrink-0">
                <div><div className="text-2xl font-bold" style={{ color: '#16A34A' }}>{stats.ultimaSesion.total_asistieron}</div><div className="text-xs" style={{ color: '#6B7280' }}>Asistieron</div></div>
                <div><div className="text-2xl font-bold" style={{ color: '#DC2626' }}>{stats.ultimaSesion.total_registros - stats.ultimaSesion.total_asistieron}</div><div className="text-xs" style={{ color: '#6B7280' }}>Ausentes</div></div>
                <div><div className="text-2xl font-bold" style={{ color: '#2563EB' }}>{pct}%</div><div className="text-xs" style={{ color: '#6B7280' }}>Asistencia</div></div>
              </div>
            </div>
            <div className="mt-5 rounded-full h-2.5 overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: pct >= 75 ? 'linear-gradient(90deg,#C8A24A,#F0DFA0)' : pct >= 50 ? 'linear-gradient(90deg,#2563EB,#60A5FA)' : 'linear-gradient(90deg,#DC2626,#FCA5A5)' }} />
            </div>
          </div>
        )}

        {/* Accesos rápidos */}
        <div className="grid md:grid-cols-2 gap-5">
          <Link href="/instituto"
            className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-5">
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#FFF7ED' }}>
                <Calendar size={26} style={{ color: '#EA580C' }} />
              </div>
              <ArrowRight size={18} style={{ color: '#9CA3AF' }} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: '#1F2937' }}>Asistencia Instituto</h2>
            <p className="text-sm" style={{ color: '#6B7280' }}>Registrar asistencia del Instituto Bíblico</p>
          </Link>

          <Link href="/colaboradores"
            className="group rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>
            <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-10" style={{ background: '#C8A24A', transform: 'translate(30%,-30%)' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(200,162,74,0.25)' }}>
                  <Users size={26} style={{ color: '#F0DFA0' }} />
                </div>
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
              <h2 className="text-xl font-bold mb-1">Colaboradores</h2>
              <p className="text-sm" style={{ color: '#BFDBFE' }}>Ver y gestionar todos los colaboradores</p>
            </div>
          </Link>
        </div>

      </main>
    </div>
  );
}
