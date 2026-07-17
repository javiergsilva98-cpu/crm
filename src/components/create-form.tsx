"use client";

import { useRef, useState, type ReactNode } from "react";
import { useDisclosureClose } from "./add-disclosure";

type ActionResult = { error?: string; warning?: string } | void;

export function CreateForm({
  action,
  onSuccess,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  onSuccess?: () => void;
  className?: string;
  children: ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const closeDisclosure = useDisclosureClose();

  return (
    <form
      ref={formRef}
      className={className}
      action={async (formData) => {
        setPending(true);
        setError(null);
        setWarning(null);
        let result: ActionResult;
        try {
          result = await action(formData);
        } catch {
          setPending(false);
          setError("Hubo un error al guardar. Comprueba tu conexión e inténtalo de nuevo.");
          return;
        }
        setPending(false);
        if (result && "error" in result && result.error) {
          setError(result.error);
          return;
        }
        formRef.current?.reset();
        if (result && "warning" in result && result.warning) {
          setWarning(result.warning);
          return;
        }
        onSuccess?.();
        closeDisclosure?.();
      }}
    >
      {children}
      {pending && <p className="mt-2 w-full text-xs text-ink-mute">Guardando...</p>}
      {error && <p className="mt-2 w-full text-sm text-danger">{error}</p>}
      {warning && <p className="mt-2 w-full text-sm text-signal">{warning}</p>}
    </form>
  );
}
