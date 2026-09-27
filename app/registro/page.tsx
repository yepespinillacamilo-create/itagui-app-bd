'use client';

import { useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import FormularioCemp from '@/components/FormularioCemp';
import { fichaVacia, type Ficha } from '@/lib/ficha';

export default function RegistroPage() {
  const [acepto, setAcepto] = useState(false);
  const [empezo, setEmpezo] = useState(false);
  const [enviado, setEnviado] = useState<string | null>(null);

  async function enviar(f: Ficha) {
    const res = await fetch('/api/registro', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ficha: f, consentimiento: acepto }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || 'No se pudo enviar el formulario');
    setEnviado(f.nombre_preferencia || f.primer_nombre);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
      <header style={{ background: 'linear-gradient(160deg, #1E3A8A 0%, #172554 100%)' }}>
        <div className="max-w-4xl mx-auto px-5 pt-8 pb-10">
          <p className="text-sm font-semibold" style={{ color: '#C8A24A' }}>Iglesia Itagüí · IDMJI</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Registro de colaboradores</h1>
          <p className="text-[15px] mt-2 max-w-xl leading-relaxed" style={{ color: '#BFDBFE' }}>
            Con esta información mantenemos al día tu ficha de colaborador. Toma unos 5 minutos.
          </p>
        </div>
        <div style={{ height: 3, background: 'linear-gradient(90deg, #C8A24A, #F0DFA0, #C8A24A)' }} />
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 -mt-4">
        {enviado ? (
          <div className="bg-white rounded-3xl shadow-sm border p-8 text-center" style={{ borderColor: '#E5E7EB' }}>
            <CheckCircle2 size={52} className="mx-auto" style={{ color: '#16A34A' }} />
            <h2 className="text-xl font-bold mt-4" style={{ color: '#1F2937' }}>¡Gracias, {enviado}!</h2>
            <p className="text-[15px] mt-2 max-w-md mx-auto leading-relaxed" style={{ color: '#4B5563' }}>
              Recibimos tu información. El equipo de la Iglesia la revisará y actualizará tu ficha.
            </p>
          </div>
        ) : !empezo ? (
          <div className="bg-white rounded-3xl shadow-sm border p-6 sm:p-8" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex items-start gap-3">
              <ShieldCheck size={26} className="flex-shrink-0 mt-0.5" style={{ color: '#1E3A8A' }} />
              <div>
                <h2 className="text-lg font-bold" style={{ color: '#1F2937' }}>Autorización de tratamiento de datos</h2>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: '#4B5563' }}>
                  La Iglesia Itagüí (IDMJI) usará los datos que registres, incluidos los de contacto, formación y salud,
                  únicamente para la organización interna de colaboradores y su registro en los sistemas oficiales de la Iglesia.
                  No serán compartidos con terceros. Puedes consultar, corregir o pedir la eliminación de tus datos en
                  cualquier momento a través de la administración de la Iglesia, conforme a la Ley 1581 de 2012.
                </p>
              </div>
            </div>
            <label className="flex items-start gap-3 mt-6 p-4 rounded-2xl cursor-pointer" style={{ backgroundColor: '#F9FAFB' }}>
              <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)}
                className="mt-0.5 w-5 h-5 accent-blue-900" />
              <span className="text-sm leading-relaxed" style={{ color: '#1F2937' }}>
                Autorizo el tratamiento de mis datos personales para los fines descritos.
              </span>
            </label>
            <button disabled={!acepto} onClick={() => setEmpezo(true)}
              className="w-full sm:w-auto mt-6 px-8 py-3 rounded-xl text-white font-semibold disabled:opacity-40"
              style={{ backgroundColor: '#1E3A8A' }}>
              Comenzar
            </button>
          </div>
        ) : (
          <FormularioCemp inicial={fichaVacia()} modo="publico" onEnviar={enviar} textoEnviar="Enviar mi información" />
        )}
      </main>
    </div>
  );
}
