"use client";

import { useRef, useState, type ReactNode } from "react";

const MIN_WIDTH = 60;

export function ResizableTh({
  tableId,
  columnKey,
  defaultWidth,
  className = "",
  children,
}: {
  tableId: string;
  columnKey: string;
  defaultWidth: number;
  className?: string;
  children: ReactNode;
}) {
  const storageKey = `col-width:${tableId}:${columnKey}`;
  // Lectura perezosa (no en un efecto) para que el ancho guardado se aplique
  // ya en el primer render del cliente, sin un "salto" visual posterior.
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return defaultWidth;
    const stored = Number(localStorage.getItem(storageKey));
    return stored && stored >= MIN_WIDTH ? stored : defaultWidth;
  });
  const thRef = useRef<HTMLTableCellElement>(null);

  function startResize(e: React.PointerEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = thRef.current?.getBoundingClientRect().width ?? width;

    function onMove(ev: PointerEvent) {
      setWidth(Math.max(MIN_WIDTH, Math.round(startWidth + (ev.clientX - startX))));
    }
    function onUp(ev: PointerEvent) {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      const next = Math.max(MIN_WIDTH, Math.round(startWidth + (ev.clientX - startX)));
      localStorage.setItem(storageKey, String(next));
    }
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  return (
    <th
      ref={thRef}
      suppressHydrationWarning
      style={{ width, minWidth: width, maxWidth: width }}
      className={`group relative overflow-hidden px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase ${className}`}
    >
      <span className="block truncate">{children}</span>
      <span
        onPointerDown={startResize}
        title="Arrastra para cambiar el ancho"
        className="absolute top-0 right-0 z-10 h-full w-3 cursor-col-resize touch-none select-none"
      >
        <span className="mx-auto block h-full w-px bg-border transition-colors group-hover:bg-border-strong" />
      </span>
    </th>
  );
}
