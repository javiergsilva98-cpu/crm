import { createClient } from "@supabase/supabase-js";

// Cliente con la service role key: solo se usa en Server Actions para
// crear/gestionar cuentas de Supabase Auth (auth.admin.*). Nunca se
// importa desde un componente cliente ni se expone al navegador.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
