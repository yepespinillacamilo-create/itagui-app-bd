'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Lock } from 'lucide-react';

function Formulario() {
  const params = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true); setError('');
    const res = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const destino = params.get('next') || '/';
      window.location.href = destino.startsWith('/') ? destino : '/';
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'No se pudo ingresar');
      setCargando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: '#1E3A8A' }}>
        <Lock size={22} className="text-white" />
      </div>
      <h1 className="text-xl font-bold" style={{ color: '#1F2937' }}>Itagüí · BD Colaboradores</h1>
      <p className="text-sm mt-1 mb-6" style={{ color: '#6B7280' }}>Ingresa la contraseña de administración.</p>
      <input type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2"
        style={{ borderColor: '#E5E7EB' }} />
      {error && <p className="text-sm mt-3" style={{ color: '#DC2626' }}>{error}</p>}
      <button disabled={cargando || !password}
        className="w-full mt-5 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
        style={{ backgroundColor: '#1E3A8A' }}>
        {cargando ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #1E3A8A 0%, #172554 100%)' }}>
      <Suspense><Formulario /></Suspense>
    </div>
  );
}
