# Decisiones de producto y arquitectura

Una línea por decisión, con fecha. Es la memoria del proyecto entre sesiones.

- **2026-07-13** — Stack inicial: Next.js (App Router) + Supabase (Postgres, Auth, RLS) + Vercel. CRM genérico (empresas, contactos, oportunidades) como base de partida.
- **2026-07-13** — Multiusuario con roles: `admin` ve y edita todos los datos; `user` solo ve lo que él mismo crea. El primer usuario registrado se vuelve admin automáticamente.
- **2026-07-13** — Pivote de producto: se detiene la adición de funciones de CRM genérico. El diferencial pasa a ser atribución de canal en lenguaje humano, cruce con gasto real de ads, recomendación activa de presupuesto y WhatsApp como canal de entrada de primera clase. Público objetivo: autónomo/pyme sin conocimiento técnico — toda función que añada configuración sin añadir claridad de "de dónde viene mi cliente" se descarta.
- **2026-07-13** — Auditoría confirma: no existe campo de canal/fuente de origen en `contacts`. Es la pieza fundacional; todo lo demás del plan depende de ella.
