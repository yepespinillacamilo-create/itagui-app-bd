# Guía de configuración — San Diego 5 PM App

## Paso 1 — Crear cuenta en Supabase (base de datos + fotos)

1. Ve a https://supabase.com y crea una cuenta con Google
2. Crea un nuevo proyecto:
   - Name: `sandiego-app`
   - Database Password: elige una contraseña segura (guárdala)
   - Region: `South America (São Paulo)` — la más cercana a Colombia
3. Espera ~2 minutos a que el proyecto esté listo

### Crear las tablas
4. En el menú izquierdo, abre **SQL Editor**
5. Copia y pega el contenido del archivo `supabase/schema.sql`
6. Haz clic en **Run**

### Crear el bucket de fotos
7. En el menú izquierdo, abre **Storage**
8. Haz clic en **New bucket**
9. Nombre: `fotos`, activa **Public bucket**
10. Haz clic en **Create bucket**

### Obtener las credenciales
11. Ve a **Project Settings → API**
12. Copia:
    - `Project URL` → este es el `NEXT_PUBLIC_SUPABASE_URL`
    - `service_role` secret → este es el `SUPABASE_SERVICE_ROLE_KEY`

---

## Paso 2 — Crear cuenta en Vercel (hosting gratuito)

1. Ve a https://vercel.com y crea una cuenta con Google
2. Sube el código a GitHub primero (ver abajo) o usa Vercel CLI

### Subir a GitHub
1. Ve a https://github.com y crea un repositorio nuevo
2. Sube los archivos de esta carpeta

### Conectar con Vercel
1. En Vercel: **Add New Project → Import Git Repository**
2. Selecciona tu repositorio de GitHub
3. En **Environment Variables** agrega:
   - `NEXT_PUBLIC_SUPABASE_URL` = (la URL de Supabase del paso 1)
   - `SUPABASE_SERVICE_ROLE_KEY` = (el service_role key del paso 1)
4. Haz clic en **Deploy**

¡Listo! En ~3 minutos tendrás la app corriendo en una URL como `sandiego-app.vercel.app`

---

## Paso 3 — Importar colaboradores del Google Sheet (opcional)

Si deseas importar los datos del Sheet existente, avísale a Claude y
lo hacemos con un script de importación.

---

## Variables de entorno (.env.example)

```
NEXT_PUBLIC_SUPABASE_URL=https://TUPROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```
