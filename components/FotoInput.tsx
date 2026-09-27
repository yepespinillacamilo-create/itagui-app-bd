'use client';

import { useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, User } from 'lucide-react';
import { prepararFoto } from '@/lib/foto';

interface Props {
  value: string;
  onChange: (url: string) => void;
  endpoint?: string;          // '/api/subir-foto' (admin) o '/api/registro/foto' (formulario público)
  cedula?: string;
}

// Foto sin fricción: tocar para elegir o tomar, arrastrar y soltar, o pegar (Ctrl+V).
export default function FotoInput({ value, onChange, endpoint = '/api/subir-foto', cedula }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [arrastrando, setArrastrando] = useState(false);

  async function subir(file: File | Blob | null | undefined) {
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) { setError('El archivo debe ser una imagen.'); return; }
    setSubiendo(true); setError('');
    try {
      const blob = await prepararFoto(file);
      const fd = new FormData();
      fd.append('foto', blob, 'foto.jpg');
      if (cedula) fd.append('cedula', cedula.replace(/\D/g, ''));
      const res = await fetch(endpoint, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo subir la foto');
      onChange(data.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div
      tabIndex={0}
      onPaste={(e) => {
        const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'));
        if (item) { e.preventDefault(); subir(item.getAsFile()); }
      }}
      onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(e) => { e.preventDefault(); setArrastrando(false); subir(e.dataTransfer.files?.[0]); }}
      className="flex items-center gap-4 p-3 rounded-2xl border-2 border-dashed outline-none transition-colors focus:border-blue-400"
      style={{ borderColor: arrastrando ? '#2563EB' : '#E5E7EB', backgroundColor: arrastrando ? '#EFF6FF' : '#FAFAFA' }}>
      <button type="button" onClick={() => inputRef.current?.click()}
        className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center border"
        style={{ borderColor: '#E5E7EB', backgroundColor: '#F3F4F6' }}>
        {value
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={value} alt="Foto" className="w-full h-full object-cover" />
          : <User size={34} style={{ color: '#9CA3AF' }} />}
        {subiendo && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: '#1E3A8A' }} />
          </div>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { subir(e.target.files?.[0]); e.target.value = ''; }} />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={subiendo}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: '#1E3A8A' }}>
          {value ? <Camera size={15} /> : <ImagePlus size={15} />}
          {subiendo ? 'Procesando…' : value ? 'Cambiar foto' : 'Subir o tomar foto'}
        </button>
        <p className="text-xs mt-2 leading-relaxed" style={{ color: '#6B7280' }}>
          También puedes arrastrarla aquí o pegarla (Ctrl+V). Se recorta y ajusta sola.
        </p>
        {error && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>{error}</p>}
      </div>
    </div>
  );
}
