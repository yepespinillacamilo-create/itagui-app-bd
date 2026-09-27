import { createHash } from 'crypto';

export const COOKIE_SESION = 'itg_sesion';

// Token de sesión derivado de la contraseña de administrador (variable ADMIN_PASSWORD en Vercel).
// Si la contraseña cambia, todas las sesiones anteriores quedan cerradas.
export function tokenSesion(): string | null {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return null;
  return createHash('sha256').update(`itagui-bd:${pass}`).digest('hex');
}
