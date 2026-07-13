# CRM

CRM construido con Next.js (App Router), Supabase y desplegado en Vercel.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Supabase**: base de datos Postgres, autenticación y Row Level Security
- **Vercel**: hosting y despliegue continuo desde GitHub

## Módulos incluidos

- Autenticación (email/contraseña) con Supabase Auth
- Empresas
- Contactos (vinculados a una empresa)
- Oportunidades (pipeline de ventas, vinculadas a una empresa)

Cada usuario solo ve sus propios datos (Row Level Security por `owner_id`).

## Configuración inicial

### 1. Crear el proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto nuevo.
2. En **SQL Editor**, ejecutá el contenido de [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) para crear las tablas y las políticas de seguridad.
3. En **Project Settings → API**, copiá la `Project URL` y la `anon public key`.
4. En **Authentication → URL Configuration**, agregá la URL de tu deploy de Vercel (y `http://localhost:3000` para desarrollo) como *Redirect URL* (`.../auth/callback`).

### 2. Variables de entorno

Copiá `.env.example` a `.env.local` y completá:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Desarrollo local

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

### 4. Deploy en Vercel

1. En [vercel.com](https://vercel.com), importá este repositorio de GitHub.
2. Agregá las mismas variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en **Settings → Environment Variables**.
3. Cada push a la rama configurada genera un deploy automático con su propia URL de vista previa.

## Flujo de trabajo

A partir de acá, el desarrollo continúa a base de prompts: cada cambio se commitea y pushea a la rama de trabajo, y Vercel genera una URL de preview para ver los avances.
