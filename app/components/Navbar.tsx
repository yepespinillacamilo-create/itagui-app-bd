'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Users, Calendar, BarChart2, Menu, X, Heart, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

const links = [
  { href: '/',              label: 'Inicio',        icon: BarChart2 },
  { href: '/colaboradores', label: 'Colaboradores', icon: Heart     },
  { href: '/instituto',     label: 'Instituto',     icon: Calendar  },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);
  const isHome = pathname === '/';

  return (
    <nav style={{ backgroundColor: '#1E3A8A' }} className="text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Flecha atrás (solo en secciones, solo en móvil) */}
          {!isHome && (
            <button
              onClick={() => router.back()}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/10 transition-colors mr-1 flex-shrink-0"
              aria-label="Volver atrás">
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-3 font-bold flex-1 md:flex-none">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
              style={{ backgroundColor: '#C8A24A' }}>
              <BookOpen size={18} className="text-white" />
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-bold text-white tracking-wide">Colaboradores Itagüí</div>
              <div className="text-xs font-normal" style={{ color: '#C8A24A' }}>IDMJI · Gestión</div>
            </div>
            <div className="sm:hidden text-sm font-bold">Itagüí</div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  pathname === href
                    ? 'text-white font-semibold'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
                style={pathname === href ? { backgroundColor: '#2563EB' } : {}}>
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 pt-1 flex flex-col gap-1 border-t border-white/10 mt-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === href
                    ? 'text-white'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
                style={pathname === href ? { backgroundColor: '#2563EB' } : {}}>
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #C8A24A, #F0DFA0, #C8A24A)' }} />
    </nav>
  );
}
