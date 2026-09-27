'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { ArrowLeft } from 'lucide-react';
import FormularioCemp from '@/components/FormularioCemp';
import { fichaDesdeDb, type Ficha } from '@/lib/ficha';

export default function EditarFichaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    fetch(`/api/colaboradores/${id}`).then((r) => r.json()).then((d) => {
      setNombre(d.nombre); setFicha(fichaDesdeDb(d));
    });
  }, [id]);

  async function guardar(f: Ficha) {
    const res = await fetch(`/api/colaboradores/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || 'No se pudo guardar');
    router.push(`/colaboradores/${id}`);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Link href={`/colaboradores/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium mb-2" style={{ color: '#1E3A8A' }}>
          <ArrowLeft size={16} /> Volver a la ficha
        </Link>
        <h1 className="text-xl font-bold mb-5" style={{ color: '#1F2937' }}>{nombre || 'Editar ficha'}</h1>
        {ficha
          ? <FormularioCemp inicial={ficha} modo="admin" onEnviar={guardar} textoEnviar="Guardar ficha" />
          : <p className="text-sm" style={{ color: '#6B7280' }}>Cargando…</p>}
      </main>
    </div>
  );
}
