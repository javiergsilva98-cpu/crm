# CLUB 26

App interna de **CLUB 26**, asociación gastronómica y cultural en Maello
(Ávila). No es un SaaS multi-cliente: es la herramienta de gestión de un
único club de socios.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Supabase**: base de datos Postgres, autenticación y Row Level Security
- **Vercel**: hosting y despliegue continuo desde GitHub

## Roles del club

| Rol | Persona | Se encarga de |
|---|---|---|
| Presidente | Marco | Gestión general |
| Secretario | Pablo | Ficha de socios, actas, documentación |
| Tesorero | Marlon | Cuenta bancaria, cobros, precios, balances |
| Bodeguero | Charly (apoyo Chervo) | Compras, reposición de inventario |
| Socio | — | Consumo propio, balance, votar |

Esta primera fase es una **demo con datos de ejemplo**: un único usuario
demo puede entrar y cambiar de rol desde la interfaz (arriba a la
derecha) para ver qué pantallas y datos ve cada uno. El cambio de rol es
solo un filtro visual — no vuelve a autenticar — porque el usuario demo
tiene acceso completo (rol `presidente`) a nivel de base de datos. El
Row Level Security (RLS) ya está definido por rol real para cuando cada
socio tenga su propio login.

## Pantallas del MVP

1. **Panel** (`/`): resumen y accesos según el rol elegido.
2. **Socios** (`/socios`): ficha de socios (nombre, rol, estado, cuota, nº
   de llave). Como "Socio" solo se ve la ficha propia.
3. **Consumos** (`/consumos`): carta de bebidas/aperitivos, marcar un
   consumo e historial personal. Los demás roles ven el registro
   completo de la barra.
4. **Tesorería** (`/tesoreria`): saldo del club en tiempo real, desglose
   cuota fija vs. cargos de evento, y saldo por socio (positivo = a
   favor, negativo = debe).
5. **Inventario** (`/inventario`): stock de la bodega y registro de
   reposiciones (actualiza el stock automáticamente).

Fuera de alcance en esta fase (el modelo de datos ya lo contempla, pero
no está construido): cobros reales, votaciones/encuestas, documentación
tipo drive, notificaciones, calendario de turnos, límites de visitas de
invitados, exportación a Excel.

## Configuración inicial

### 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto nuevo.
2. En **SQL Editor**, ejecuta el contenido de
   [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql)
   para crear las tablas, los triggers y las políticas de RLS.
3. Ejecuta también [`supabase/seed.sql`](./supabase/seed.sql) para cargar
   los datos de demo (socios, menú, tesorería, inventario, eventos y
   documentos de ejemplo).
4. En **Project Settings → API**, copia la `Project URL` y la
   `anon public key`.
5. En **Authentication → URL Configuration**, agrega la URL de tu deploy
   de Vercel (y `http://localhost:3000` para desarrollo) como
   *Redirect URL* (`.../auth/callback`).

### 2. Usuario de demo

El `seed.sql` **no** crea el usuario de autenticación (crear usuarios de
Supabase Auth por SQL es frágil entre versiones). Para tener un login de
demo:

1. En **Authentication → Users** del panel de Supabase, pulsa
   *Add user* y crea uno (ej. `demo@club26.es` + una contraseña).
   Un trigger (`on_auth_user_created`) le crea automáticamente su fila en
   `profiles` con rol `socio`.
2. En **SQL Editor**, súbele el rol a `presidente` para que vea todo en
   la demo:
   ```sql
   update public.profiles set role = 'presidente' where email = 'demo@club26.es';
   ```
3. Entra con ese email/contraseña en `/login`.

### 3. Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 4. Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### 5. Deploy en Vercel

1. En [vercel.com](https://vercel.com), importa este repositorio de
   GitHub.
2. Agrega las mismas variables de entorno
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en
   **Settings → Environment Variables**.
3. Cada push a la rama configurada genera un deploy automático con su
   propia URL de vista previa.

## Flujo de trabajo

Las migraciones se versionan en `supabase/migrations/`, nunca se editan
tablas a mano en el editor de Supabase. A partir de aquí, el desarrollo
continúa a base de prompts: cada cambio se commitea y pushea a la rama
de trabajo, y Vercel genera una URL de preview para ver los avances.
