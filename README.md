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
| Admin | Javier | Acceso total, incluida la gestión de cuentas |
| Presidente | Marco | Gestión general, también gestiona cuentas |
| Secretario | Pablo | Ficha de socios, actas, documentación |
| Tesorero | Marlon | Cuenta bancaria, cobros, precios, balances |
| Bodeguero | Charly (apoyo Chervo) | Compras, reposición de inventario |
| Socio | — | Consumiciones propias, balance, calendario, votar |

Esta primera fase incluye una **demo con datos de ejemplo**: las cuentas
de admin/presidencia pueden cambiar de vista desde la interfaz (arriba a
la derecha, "Viendo como") para ver qué pantallas y datos ve cada rol.
El cambio de vista es solo un filtro visual — no vuelve a autenticar —
porque esas cuentas tienen acceso completo a nivel de base de datos. El
Row Level Security (RLS) ya está definido por rol real para cuando cada
socio tenga su propio login real (no demo).

**El registro libre está desactivado.** Nadie puede crear su propia
cuenta desde `/login`: las cuentas las crea admin o presidencia desde
`/usuarios`.

## Pantallas

1. **Panel** (`/`): resumen y accesos según el rol.
2. **Socios** (`/socios`): ficha de socios (nombre, rol, estado, cuota
   del mes, nº de llave) y baja. Como "Socio" solo se ve la ficha propia.
   Admin y presidencia dan de alta socios nuevos directamente con su
   cuenta de acceso: nombre, email, rol, número de socio (se sugiere el
   siguiente disponible) y una contraseña provisional generada ahí
   mismo — se le entrega a la persona y tendrá que cambiarla la primera
   vez que entre, antes de poder usar el resto de la app.
3. **Consumiciones** (`/consumos`): carta de bebidas/aperitivos, marcar
   una consumición e historial personal. Gestión ve el registro completo
   de la barra y administra la carta (crear, editar y activar/desactivar
   artículos).
4. **Tesorería** (`/tesoreria`): saldo del club en tiempo real, desglose
   cuota fija vs. cargos de evento, saldo por socio y alta manual de
   movimientos.
5. **Inventario** (`/inventario`): stock de la bodega y registro de
   reposiciones (actualiza el stock automáticamente). Cada artículo
   tiene su propio umbral de aviso (editable por admin, presidencia y
   bodeguero); cuando el stock baja de ahí salta un aviso en la propia
   pantalla y una insignia en el acceso rápido del Panel, visible para
   admin, presidencia, tesorería y bodeguero.
6. **Calendario** (`/calendario`): eventos del club y reservas del local
   por días solicitadas por cualquier socio (quedan pendientes hasta que
   gestión las aprueba o rechaza), con quién abre y quién cierra cada
   jornada.
7. **Votaciones** (`/votaciones`): la directiva crea votaciones públicas
   o anónimas; cada socio vota una vez; resultados en vivo.
8. **Usuarios** (`/usuarios`, solo admin/presidencia): crear cuentas,
   asignar rol y vincularlas a un socio. También permite recuperar el
   acceso de alguien que ha perdido su contraseña: genera una nueva
   provisional (que también habrá que entregarle en mano) y le vuelve a
   exigir cambiarla al entrar.
9. **Documentación** (`/documentos`, admin/presidencia/secretaría):
   estatutos, actas y normativa del club, cada una con un enlace opcional
   (pensado para vincular más adelante al Drive del club).

Admin, presidencia y tesorero pueden exportar a CSV (se abre directamente
en Excel) los movimientos de tesorería, el saldo por socio, el listado de
socios, el historial de consumiciones y las reposiciones de inventario — botón
"Exportar" en cada pantalla.

Fuera de alcance por ahora: cobros reales (pasarela de pago),
almacenamiento propio de ficheros (la documentación enlaza a Drive, no
sube archivos), notificaciones push, límites de visitas de invitados,
branding final (logo/colores propios del club).

## Configuración inicial

### 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto nuevo.
2. En **SQL Editor**, ejecuta en orden todos los archivos de
   [`supabase/migrations/`](./supabase/migrations/) (`0001` → el más
   alto), y después [`supabase/seed.sql`](./supabase/seed.sql) para
   cargar datos de ejemplo.
3. En **Project Settings → API**, copia la `Project URL`, la
   `anon public key` y la `service_role key`.
4. En **Authentication → Providers → Email**, desactiva **"Allow new
   users to sign up"**. Aunque la app ya no muestra un formulario de
   registro, este interruptor es la barrera real a nivel de Supabase:
   sin él, alguien podría crear una cuenta llamando directamente a la
   API de Supabase.
5. En **Authentication → URL Configuration**, agrega la URL de tu deploy
   de Vercel (y `http://localhost:3000` para desarrollo) como
   *Redirect URL* (`.../auth/callback`).

### 2. Primera cuenta de admin

Como el registro libre está desactivado, la primerísima cuenta hay que
crearla a mano (las siguientes ya se crean desde `/usuarios`):

1. En **Authentication → Users** del panel de Supabase, pulsa *Add
   user* y crea una (email + contraseña, con "Auto Confirm User"
   marcado). El trigger `on_auth_user_created` le crea su fila en
   `profiles` con rol `socio`.
2. En **SQL Editor**, súbele el rol a `admin`:
   ```sql
   update public.profiles set role = 'admin' where email = 'tu-email@ejemplo.com';
   ```
3. Entra con ese email/contraseña en `/login`. Desde ahí, en
   `/usuarios`, ya puedes crear el resto de cuentas (junta directiva y
   socios) sin volver a tocar el panel de Supabase.

### 3. Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` es solo para el servidor (la usa
`/usuarios` para crear cuentas) — nunca lleva el prefijo
`NEXT_PUBLIC_` y nunca se expone al navegador.

### 4. Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### 5. Deploy en Vercel

1. En [vercel.com](https://vercel.com), importa este repositorio de
   GitHub.
2. Agrega las mismas variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) en
   **Settings → Environment Variables**.
3. Cada push a la rama configurada genera un deploy automático.

## Flujo de trabajo

Las migraciones se versionan en `supabase/migrations/`, nunca se editan
tablas a mano en el editor de Supabase. A partir de aquí, el desarrollo
continúa a base de prompts: cada cambio se commitea y pushea a la rama
de trabajo, y Vercel genera una URL de preview para ver los avances.
