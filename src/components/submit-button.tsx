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
  confirmMessage,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  // Si se indica, pide confirmación antes de enviar — para acciones que
  // no se pueden deshacer (borrar cuenta, borrar artículo...).
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      aria-disabled={pending}
      className={className}
      onClick={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
