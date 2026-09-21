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
| Vicepresidente | — | Mismo nivel de acceso que presidencia |
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
   artículos). Cada artículo se vende 1:1 con bodega: o es individual
   (lata, botellín, paquete — cada consumo resta una unidad) o es
   compartido (una botella que se abre y se reparte entre varios socios,
   con el coste dividido y una sola unidad descontada de bodega). No hay
   artículos "por ración" ni "por copa" sueltos, porque no encajan en ese
   descuento 1:1. Pedir algo pide confirmación explícita (nombre, precio
   y reparto si es compartido) antes de registrarse, para evitar toques
   accidentales; una vez confirmado no se puede editar ni borrar — ni
   siquiera el propio socio —, solo "reportar incidencia" para que la
   directiva lo revise. Cualquier socio ve, como capa de transparencia,
   las últimas 20 consumiciones de todo el club (no solo las propias); el
   historial completo sin ese límite es cosa de admin, presidencia y
   tesorería. El precio de venta de cada artículo se calcula solo, a
   partir de su coste actual y un margen de venta global (editable en
   Inventario) — no se puede fijar a mano. Cualquier socio puede pulsar
   el icono de información de cada artículo para ver su coste, precio y
   margen actuales, y el historial de cambios de precio (para que se
   entienda por qué sube algo, ej. "subió porque el último pedido costó
   más"). Si con el coste nuevo el margen configurado no llegara al
   mínimo de seguridad, el artículo queda "pendiente de revisión" en vez
   de aplicar el precio automáticamente. **Modo invitados**: un botón
   "Llevo invitados" en la parte de arriba (preferencia de esa pantalla
   en ese momento, se pierde al recargar y no afecta a lo que ven otros
   socios) muestra, con cada artículo, también el precio de invitado
   (coste × (1 + margen de invitado), 50% por defecto, configurable en
   Inventario junto al margen de socio) y, al pedir, obliga a elegir si
   ese consumo es para el propio socio o para un invitado — cada línea
   del historial queda marcada como tal.
4. **Tesorería** (`/tesoreria`): saldo del club en tiempo real, desglose
   cuota fija vs. cargos de evento, saldo por socio y alta manual de
   movimientos. Como "Socio" la pantalla es propia: saldo de
   consumiciones (lo que debe por lo que ha tomado, sin contar la cuota)
   y el historial completo de todos sus cargos y pagos; la cuota mensual
   se muestra aparte, en su propio bloque, como pagada o pendiente —
   si está pendiente también aparece un aviso destacado en el Panel.
   Cualquier socio ve además, como capa de transparencia, la caja
   disponible del club (el saldo real, descontando fondos ya reservados
   o comprometidos, p. ej. el seguro de los próximos meses) y las
   últimas compras grandes. Tesorería gestiona ese importe reservado
   desde la propia pantalla.
5. **Inventario** (`/inventario`): por artículo, stock actual, coste
   actual (del último pedido) y precio de venta — visible solo para
   admin, presidencia, vicepresidencia y tesorería; el bodeguero no ve
   ese detalle, solo el formulario de reposición. Reponer (admin,
   presidencia, vicepresidencia, tesorería y bodeguero) permite vincular
   a un artículo existente o dar de alta uno nuevo (nombre, unidad,
   categoría, individual o a repartir y coste del primer pedido — crea a
   la vez el artículo de bodega y el de carta; el precio de venta se
   calcula solo, no se introduce a mano). Cada artículo tiene su propio
   umbral de aviso; cuando el stock baja de ahí salta un aviso en la
   propia pantalla y una insignia en el Panel. **Margen de venta**: un
   % global (30% por defecto) que fija el precio de cada artículo como
   coste × (1 + margen), editable por admin, presidencia, vicepresidencia
   y tesorería; tiene un margen mínimo de seguridad (15% por defecto) y,
   si el margen configurado no llega a ese mínimo, el artículo afectado
   queda "pendiente de revisión" en vez de aplicar el precio solo.
   **Conteo físico**
   (`/inventario/conteo`, admin, presidencia, vicepresidencia y
   bodeguero): se introduce la cantidad real de cada artículo y se
   compara con el stock teórico (para detectar mermas o consumos no
   apuntados); al guardar, el stock queda ajustado a lo contado.
   **Margen de invitado**: junto al margen de socio, un segundo % global
   (50% por defecto) que fija el precio de invitado de cada artículo,
   con el mismo margen mínimo de seguridad como salvaguarda.
6. **Calendario** (`/calendario`): eventos del club y reservas del local
   por días solicitadas por cualquier socio (quedan pendientes hasta que
   gestión las aprueba o rechaza), con quién abre y quién cierra cada
   jornada.
7. **Votaciones** (`/votaciones`): solo presidencia y secretaría crean
   votaciones nuevas (título, descripción, opciones, pública o anónima,
   tipo normal o **express** — para decisiones urgentes, con su propia
   etiqueta en el listado — y una fecha límite opcional); cada socio vota
   una vez; resultados en vivo. Con fecha límite, la votación se cierra
   sola al llegar esa fecha (no hay cron: se comprueba al entrar en el
   Panel o en Votaciones, así que puede tardar hasta la siguiente visita
   de alguien) y el resultado aparece destacado en el Panel de cualquier
   socio. Cerrar una votación a mano sigue abierto a toda la directiva.
   El resultado agregado de cualquier votación, sea o no anónima, es
   siempre visible para todos; en una anónima nunca se muestra quién
   votó qué.
8. **Incidencias** (`/incidencias`): visible y usable por cualquier
   socio, no solo gestión. Reportar una incidencia es libre — algo
   roto, falta de material, convivencia, un producto de inventario,
   el fichaje de una jornada, u "otro" — o vinculada a una consumición
   concreta (lo que ya hacía la Fase 1 desde el botón "Reportar
   incidencia" del historial). Cada una guarda automáticamente quién la
   reportó y cuándo. Solo presidencia, tesorería y bodeguero pueden
   cambiar el estado (pendiente / en revisión / resuelta); al resolver
   una incidencia vinculada a una consumición, aprobarla corrige el
   cargo original (queda marcado como corregido, con el precio anterior
   guardado, sin borrar la consumición) y rechazarla la deja igual. El
   listado, con filtro por estado y por categoría, es visible para todo
   el club como capa de transparencia.
9. **Fichaje** (`/fichaje`): un indicador claro (luz verde/roja, también
   en el Panel) de si el local está abierto o cerrado. El primer socio
   que llega pulsa "He abierto": abre el switch, se convierte en
   responsable de cierre y queda fichado. Cada socio que llega después
   marca su propia presencia ("Estoy en el local" / "Me voy"),
   independiente del switch general. Quién está dentro ahora mismo solo
   lo ve un socio si él mismo está fichado en ese momento (el dato
   queda igualmente registrado para que admin, presidencia y tesorería
   puedan auditarlo después). El responsable actual puede ceder la
   responsabilidad a otro socio presente — mientras esa persona no la
   acepte explícitamente (aviso en su Panel, con aceptar/rechazar), la
   responsabilidad sigue siendo de quien la cede — o cerrar el local
   directamente aunque queden socios dentro (intencional: si alguien
   quiere quedarse, que asuma la responsabilidad reabriendo). Mientras
   no ceda ni cierre, le aparece un aviso persistente en el Panel.
   Aperturas, cierres y cesiones (con fecha, quién y a quién, aceptada o
   no) quedan en un historial permanente, consultable por admin,
   presidencia y tesorería.
10. **Usuarios** (`/usuarios`, solo admin/presidencia): crear cuentas,
   asignar rol y vincularlas a un socio. También permite recuperar el
   acceso de alguien que ha perdido su contraseña: genera una nueva
   provisional (que también habrá que entregarle en mano) y le vuelve a
   exigir cambiarla al entrar.
11. **Documentación** (`/documentos`, admin/presidencia/secretaría):
   estatutos, actas y normativa del club, cada una con un enlace opcional
   (pensado para vincular más adelante al Drive del club).
12. **Auditoría** (`/auditoria`, admin/presidencia/tesorería): histórico
    de altas, bajas, movimientos de tesorería, inventario y consumiciones
    — todo lo que cambia en la app queda registrado con quién y cuándo,
    vía triggers a nivel de base de datos. Exportable a CSV.
13. **Mi perfil** (`/perfil`, cualquier cuenta): cada usuario edita su
    propio nombre visible y puede subir una foto de perfil (se guarda en
    Supabase Storage, bucket `avatars`, cada cuenta solo puede escribir
    dentro de su propia carpeta).

Admin, presidencia y tesorero pueden exportar a CSV (se abre directamente
en Excel) los movimientos de tesorería, el saldo por socio, el listado de
socios, el historial de consumiciones y las reposiciones de inventario — botón
"Exportar" en cada pantalla.

Fuera de alcance por ahora: cobros reales (pasarela de pago), gráficas de
tesorería, notificaciones push, límites de visitas de invitados, branding
final (logo/colores propios del club). La documentación del club sigue
enlazando a Drive en lugar de subir los archivos — el único uso de
Supabase Storage por ahora son las fotos de perfil.

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
