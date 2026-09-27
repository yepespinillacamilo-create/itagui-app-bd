import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { COOKIE_SESION, tokenSesion } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const esperado = process.env.ADMIN_PASSWORD;
  if (!esperado) {
    return NextResponse.json({ error: 'Falta configurar ADMIN_PASSWORD en Vercel.' }, { status: 500 });
  }
  const { password } = await req.json().catch(() => ({ password: '' }));
  const a = Buffer.from(String(password ?? ''));
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESION, tokenSesion()!, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 180,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESION, '', { path: '/', maxAge: 0 });
  return res;
}
