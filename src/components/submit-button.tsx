"use client";

import { useFormStatus } from "react-dom";

// Se apoya en el estado del <form> padre (useFormStatus) para
// deshabilitarse mientras la Server Action está en curso, evitando
// dobles envíos por doble clic o conexión lenta sin tener que gestionar
// estado "pending" a mano en cada formulario.
export function SubmitButton({
  children,
  pendingLabel,
  className,
  formAction,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" formAction={formAction} disabled={pending} aria-disabled={pending} className={className}>
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
