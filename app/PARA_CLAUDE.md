# Contexto del proyecto — App de Gestión y Asistencia

Hola Claude. Voy a trabajar contigo en una aplicación web que ya existe y fue desarrollada previamente. Este documento te da todo el contexto para que me puedas ayudar igual que le ayudaste al desarrollador original.

---

## ¿Qué es esta app?

Una aplicación web para gestionar colaboradores de una iglesia y tomar asistencia del Instituto Bíblico. Reemplaza el uso de hojas de Excel.

Está desarrollada con:
- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **Turso** (SQLite en la nube) como base de datos
- **Cloudinary** para almacenar fotos de colaboradores y estudiantes
- Desplegada en **Render** (plan gratuito)

---

## Estructura de la app

```
asistencia-app/
├── app/
│   ├── page.tsx                  ← Dashboard / Inicio
│   ├── colaboradores/page.tsx    ← Lista y gestión de colaboradores
│   ├── instituto/page.tsx        ← Asistencia + estudiantes + histórico (todo unificado)
│   ├── historial/page.tsx        ← Historial de sesiones (ya integrado en instituto)
│   └── api/
│       ├── stats/route.ts        ← Estadísticas del dashboard
│       ├── colaboradores/route.ts
│       ├── estudiantes/route.ts
│       ├── estudiantes/[id]/route.ts
│       ├── asistencias/route.ts
│       ├── asistencias/[id]/route.ts
│       ├── subir-foto/route.ts   ← Subida a Cloudinary
│       └── exportar/route.ts     ← Exportar Excel
├── components/
│   └── Navbar.tsx
├── lib/
│   └── db.ts                     ← Cliente Turso con keep-alive
└── instrumentation.ts            ← Pre-calienta la DB al arrancar el servidor
```

---

## Base de datos (Turso / SQLite)

### Tablas

```sql
CREATE TABLE colaboradores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  cedula TEXT,
  celular TEXT,
  horario TEXT,
  foto TEXT,
  colabora TEXT,
  creado_en TEXT DEFAULT (datetime('now'))
);

CREATE TABLE estudiantes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  cedula TEXT NOT NULL UNIQUE,
  celular TEXT,
  foto TEXT,
  activo INTEGER DEFAULT 1,
  orden INTEGER,
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT DEFAULT (datetime('now'))
);

CREATE TABLE sesiones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  descripcion TEXT,
  creado_en TEXT DEFAULT (datetime('now'))
);

CREATE TABLE asistencias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sesion_id INTEGER NOT NULL REFERENCES sesiones(id),
  estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id),
  asistio INTEGER DEFAULT 0,
  nota TEXT,
  registrado_en TEXT DEFAULT (datetime('now'))
);
```

### Notas importantes sobre los datos
- `colabora`: texto libre que describe la labor del colaborador. Ejemplos: `"Imposición de manos"`, `"Profecía"`, `"Sonido"`, `"Ofrenda"`. Los filtros usan LIKE con palabras clave (`imposic`, `profec`, `sonido`, `ofrend`).
- El conteo de **imposición de manos excluye** a quienes también tienen profecía (son grupos separados).
- `asistio` en la tabla asistencias: `1` = asistió, `0` = pendiente/no registrado, `-1` = ausente.

---

## Variables de entorno necesarias

Crear un archivo `.env.local` en la raíz de `asistencia-app/` con:

```
TURSO_DATABASE_URL=libsql://nombre-de-tu-db.turso.io
TURSO_AUTH_TOKEN=tu-token-de-turso
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

### Cómo crear la base de datos en Turso
1. Crear cuenta en https://turso.tech (plan gratuito)
2. Instalar CLI: `npm install -g @turso/cli`
3. `turso auth login`
4. `turso db create nombre-de-tu-db`
5. `turso db show nombre-de-tu-db` → copiar la URL
6. `turso db tokens create nombre-de-tu-db` → copiar el token
7. Ejecutar las sentencias CREATE TABLE de arriba en la consola de Turso o con un script

### Cómo crear cuenta en Cloudinary
1. Crear cuenta gratuita en https://cloudinary.com
2. En el dashboard copiar: Cloud name, API Key, API Secret

---

## Cómo correr el proyecto localmente

```bash
git clone https://github.com/centrisdata-lab/asistencia-instituto.git
cd asistencia-instituto/asistencia-app
npm install
# Crear el archivo .env.local con las variables de arriba
npm run dev
```

Abrir http://localhost:3000

---

## Cómo hacer el deploy en Render

1. Crear cuenta en https://render.com
2. New → Web Service → conectar el repositorio de GitHub
3. Configurar:
   - **Build command:** `cd asistencia-app && npm install && npm run build`
   - **Start command:** `cd asistencia-app && npm start`
   - **Root directory:** dejar vacío (o `.`)
4. En **Environment Variables** agregar las 5 variables del `.env.local`
5. Deploy

> Render en plan gratuito duerme tras 15 minutos de inactividad. La app tiene mecanismos internos para reducir el cold start (keep-alive en db.ts e instrumentation.ts). Se recomienda configurar UptimeRobot para hacer ping cada 5 minutos a la URL del deploy.

---

## Funcionalidades principales

### Dashboard (`/`)
- Tarjetas de estadísticas clickeables: total colaboradores, imposición de manos, profecía, estudiantes instituto
- Muestra la última sesión del instituto con % de asistencia
- Accesos rápidos a Instituto y Colaboradores

### Colaboradores (`/colaboradores`)
- Lista con foto, nombre, cédula, celular, labor
- Filtros por labor (Profecía, Imposición de manos, Ofrenda, Sonido) y por foto
- Añadir / editar / eliminar colaborador
- Subida de foto con cámara o archivo (va a Cloudinary)
- Al entrar con `?labor=imposic` o `?labor=profec` pre-filtra la lista

### Instituto (`/instituto`)
Tres pestañas unificadas:
1. **Asistencia** — Seleccionar fecha, iniciar sesión, pasar lista con cards (foto + nombre), registrar asistió / no asistió con botones o teclas de flecha
2. **Estudiantes** — Lista de estudiantes, añadir / editar / eliminar, ver historial de asistencias y faltas por estudiante
3. **Histórico** — Todas las sesiones registradas, expandir para ver detalle, cambiar asistencia individual, exportar Excel, eliminar sesión

### Navbar
- Logo + nombre a la izquierda
- En móvil: flecha `←` para volver atrás cuando se está en una sección (no en inicio), y menú hamburguesa a la derecha
- En escritorio: links de navegación a la derecha

---

## Decisiones de diseño importantes
- Colores principales: azul `#1E3A8A` / `#2563EB`, dorado `#C8A24A`
- Sin librerías de UI (solo Tailwind + lucide-react para iconos)
- Todos los estilos inline con `style={}` en lugar de clases Tailwind donde hay colores exactos
- El visor de fotos ocupa pantalla completa con botón "Cerrar" fijo en la parte inferior
- Skeleton loading en el dashboard para evitar mostrar ceros mientras carga
- Scripts de administración de DB en `scripts/*.mjs` (uso con `node scripts/nombre.mjs`)

---

## Lo que yo necesito hacer

> **Reemplaza esta sección con lo que necesitas.** Ejemplos:
> - "Quiero adaptar esta app para mi iglesia, cambiar los nombres y colores"
> - "Quiero agregar una nueva sección para registrar reuniones de célula"
> - "Quiero importar datos desde un Excel que tengo"
> - "Tengo un error al hacer el deploy en Render"
