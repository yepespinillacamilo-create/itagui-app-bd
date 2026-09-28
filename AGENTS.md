<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Itagüí · BD Colaboradores — guía para agentes

App interna de la Iglesia Itagüí (IDMJI) para gestionar colaboradores y su registro en el CEMP.
La parte de asistencia del Instituto Bíblico se retiró (sept. 2026): las tablas `estudiantes`, `sesiones` y
`asistencias` siguen en Supabase con su historial, pero la app ya no las usa. Producción: `itagui-app.vercel.app` (Vercel publica cada push a `main`).

> `PARA_CLAUDE.md` y `SETUP.md` son documentos históricos (hablan de Turso, Cloudinary, Render y "San Diego").
> **Este archivo es la referencia vigente.**

## Stack (no cambiar)

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · lucide-react.
- Supabase: Postgres (datos) + Storage (bucket público `fotos`).
- Otras librerías ya presentes: `xlsx`, `jspdf`, `jspdf-autotable`, `date-fns`.
- Variables de entorno (en Vercel, nunca en el código): `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`.

## Autenticación

- `proxy.ts` (el antiguo middleware en Next 16) protege todo excepto las rutas públicas:
  `/registro`, `/login`, `/api/login`, `/api/registro` (y sus subrutas).
- `/api/login` compara la contraseña con `ADMIN_PASSWORD` (`timingSafeEqual`) y deja la cookie
  `itg_sesion` (httpOnly, 180 días). El valor es `sha256("itagui-bd:" + ADMIN_PASSWORD)` (`lib/auth.ts`):
  cambiar la contraseña en Vercel cierra todas las sesiones.
- Sin sesión: las páginas redirigen a `/login?next=…` y las APIs responden 401.
- Si falta `ADMIN_PASSWORD`, nadie puede ingresar.

## Rutas

Páginas:

| Ruta | Acceso | Qué hace |
|---|---|---|
| `/` | admin | Dashboard: estadísticas (`/api/stats`), estado CEMP y solicitudes por revisar |
| `/colaboradores` | admin | Lista, filtros, exportar, botón **CEMP** (pegar tabla del CEMP) |
| `/colaboradores/[id]` | admin | Ficha completa en el orden del CEMP + estado CEMP + marcar/desmarcar registro |
| `/colaboradores/[id]/editar` | admin | Edición con `FormularioCemp` en modo `admin` |
| `/solicitudes` | admin | Bandeja de solicitudes pendientes del formulario público (aprobar / rechazar) |
| `/registro` | **pública** | Formulario para que el colaborador llene su ficha (`FormularioCemp` modo `publico`) |
| `/login` | **pública** | Contraseña de administración |

APIs (Route Handlers en `app/api/`, todas usan `getSupabase()` en servidor):

- `colaboradores` (GET/POST/PUT/DELETE) y `colaboradores/[id]` (GET, PUT = guardar ficha completa, PATCH = marcar/desmarcar CEMP).
- `registro` (POST público → crea solicitud) y `registro/foto` (POST público → `fotos/solicitudes/<uuid>.jpg`, máx. 3 MB).
- `solicitudes` (GET pendientes + ficha existente para comparar) y `solicitudes/[id]` (POST `{accion: 'aprobar'|'rechazar'}`).
- `cemp/importar` (POST: cruza la tabla pegada del CEMP por cédula; sin `aplicar` solo previsualiza).
- `subir-foto` (admin → `fotos/colaboradores/<cedula>.jpg`, upsert, máx. 8 MB).
- `stats`, `login`.

## Base de datos (Supabase)

- `colaboradores`: tabla principal. Columnas base en `supabase/schema.sql`; las de la ficha CEMP
  (nombres separados, ubicación, espiritual, labores con fechas, educación, salud, consentimiento, control CEMP)
  vienen de `supabase/migracion_cemp.sql`. Listas y detalles se guardan en JSONB
  (`dones`, `labores`, `mira`, `fimlm`, `dia_profecia`, `fechas_dones`, `fechas_labores`, `labores_inactivas`, `estudios`, `idiomas`).
- `solicitudes`: `cedula`, `datos` (JSONB con la ficha ya convertida por `fichaADb`), `estado` (`pendiente|aprobada|rechazada`), `colaborador_id`, `creado_en`, `revisado_en`.
- `labores_inactivas` (JSONB): actividades históricas `{grupo, labor, lugar, fecha_inicio, fecha_fin, postula_usted, postula_nombre, detalle}`.
  Grupos y preguntas en `ACTIVIDADES_HISTORICAS` (`lib/catalogos.ts`): Púlpito, Dones, Materiales, Administrativas.
  Los registros antiguos solo tienen `labor` + `detalle`; `normalizarInactiva` (lib/ficha.ts) los completa.
- `barrio`, `comuna`: residencia (no existen en el CEMP; el trigger los ignora). Migración: `supabase/migracion_barrio_labores.sql`.
- `estudiantes`, `sesiones`, `asistencias`: del Instituto retirado; se conservan pero no se usan.
- Trigger `trg_datos_actualizados`: en cada UPDATE de `colaboradores`, si cambia un campo que también
  existe en el CEMP, pone `datos_actualizados_en = NOW()`. Ignora campos internos (`mira`, `fimlm`,
  `dia_profecia`, `horario`, `observaciones`, `activo`, `barrio`, `comuna`, consentimiento y los propios del control CEMP).
  Si en la misma operación cambia `cemp_fecha_registro`, no marca.
- Nota: `schema.sql` no está al día con todas las columnas reales (p. ej. `dia_profecia`, `estudiantes.horario`).
  La base en producción es la fuente de verdad.

## Flujo formulario → solicitudes → aprobación

1. La persona abre `/registro` (sin contraseña) y llena `FormularioCemp` por pasos (las 6 secciones del CEMP).
   Debe aceptar el tratamiento de datos (Ley 1581). En modo público solo ve los dones del CEMP.
2. `POST /api/registro` valida (documento de 5–12 dígitos, nombre y apellido), convierte con `fichaADb`,
   descarta fotos que no vengan de `fotos/solicitudes/` y dones internos, y guarda **solo** en `solicitudes`.
   Nada toca `colaboradores` en este punto.
3. En `/solicitudes` el admin ve cada solicitud junto a la ficha existente (`lib/buscar.ts`: por cédula; si no, por celular sin cédula).
4. **Aprobar**:
   - Si existe: `fusionarFicha` (lib/ficha.ts). Lo nuevo lleno reemplaza, lo vacío nunca borra,
     dones/labores/estudios/idiomas se suman, observaciones se agregan al final.
   - Si no existe: inserta un colaborador nuevo.
   - La solicitud queda `aprobada` con `colaborador_id`.
5. **Rechazar**: solo cambia el estado a `rechazada`.

## Control CEMP

- Estado por colaborador (`estadoCemp` en `lib/catalogos.ts`):
  - `sin`: sin `cemp_fecha_registro` → "Sin registrar en CEMP" (rojo).
  - `aldia`: registrado y sin cambios posteriores → "Al día en CEMP" (verde).
  - `desactualizado`: `datos_actualizados_en` > `cemp_fecha_registro` → "Actualizar en CEMP" (ámbar).
- Marcar manualmente desde la ficha: `PATCH /api/colaboradores/[id]` (`registrado_por`, `fecha`; o `accion: 'desmarcar_cemp'`).
- Marcar en lote: botón **CEMP** en `/colaboradores` → pegar filas copiadas de la tabla del CEMP
  → `lib/cemp.ts` (`leerTablaCemp`) extrae cédula, nombre, género (Hno./Hna.), celular, email, registrado por y fecha
  → `/api/cemp/importar` previsualiza y, al aplicar, actualiza solo si la fecha es más reciente;
  completa celular/email vacíos y opcionalmente crea los que no existen.

## Mapa de `lib/` y `components/`

- `lib/supabase.ts`: cliente único con service role. **Solo en servidor** (Route Handlers). Nunca importarlo en un componente `'use client'`.
- `lib/auth.ts`: cookie y token de sesión.
- `lib/catalogos.ts`: dones, labores (todas del CEMP; "Testimonio" se unificó en Micrófono y "Fundas" se retiró),
  actividades históricas, comunas de Itagüí, roles MIRA/FIMLM, horarios, documentos, niveles, estado CEMP y `fechaCorta`.
- `lib/ficha.ts`: tipo `Ficha`, `fichaVacia`, `fichaDesdeDb`, `fichaADb`, `fusionarFicha`, `nombreCompleto`, `normalizarInactiva`.
- `lib/etiquetas.ts`: `SECCIONES` / `OTROS_CAMPOS` con las etiquetas y el formato para mostrar la ficha.
- `lib/cemp.ts`: parser de la tabla pegada del CEMP.
- `lib/buscar.ts`: búsqueda de colaborador existente.
- `lib/foto.ts`: recorte cuadrado y compresión a JPG 800×800 en el navegador.
- `components/FormularioCemp.tsx`: formulario por pasos, modos `publico` y `admin`. Incluye `ActividadHistorica`
  (se elige la actividad y aparecen lugar, fechas inicio/fin y quién la postuló, según el grupo).
- `components/FotoInput.tsx`: captura y subida de fotos.
- `components/Navbar.tsx`: navegación, contador de solicitudes pendientes, salir.

## Convenciones para mejoras

- **Idioma**: UI, comentarios, nombres de variables y mensajes de error en español.
- **Diseño**: azul `#1E3A8A` (acento `#2563EB`), dorado `#C8A24A`. Solo Tailwind + lucide-react, sin librerías de UI.
  Los colores exactos van con `style={{}}`. Todo debe verse bien en móvil.
- **Datos**: todo acceso a Supabase pasa por un Route Handler en `app/api/` con `getSupabase()`.
  Las páginas son `'use client'` y usan `fetch('/api/...')`.
- **Rutas públicas**: si una ruta nueva debe verse sin contraseña, agregarla a `PUBLICAS` en `proxy.ts`
  y validar todo en el servidor (nunca confiar en el cliente).
- **Campos nuevos de la ficha**: actualizar en conjunto `Ficha` + `fichaVacia` + `fichaDesdeDb` + `fichaADb`
  (y `fusionarFicha` si es lista), `SECCIONES` en `lib/etiquetas.ts`, `FormularioCemp` y el SQL.
  Si el campo es interno (no está en el CEMP), añadirlo a `ignorar` en la función del trigger.
- **Catálogos**: agregar valores en `lib/catalogos.ts`. Los marcados CEMP deben coincidir textualmente con la app oficial.
- **Cambios de base de datos**: nuevo archivo en `supabase/` (idempotente: `IF NOT EXISTS`, sin borrar datos) con instrucciones.
  El usuario lo ejecuta en Supabase → SQL Editor. **No subir código que dependa del SQL hasta que confirme que lo ejecutó.**
- **Antes de cada commit**: `npm run build` sin errores.
  Luego mostrar un resumen de cambios y hacer commit/push a `main` **solo** cuando el usuario lo confirme.
- **Nunca** subir `node_modules`, `.next` ni `.env*` (ver `.gitignore`), ni escribir credenciales en el código.
