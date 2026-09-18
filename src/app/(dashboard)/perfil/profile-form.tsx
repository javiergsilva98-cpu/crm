"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CameraIcon } from "@/components/icons";
import { updateOwnProfile } from "./actions";

export function ProfileForm({
  userId,
  fullName,
  avatarUrl,
}: {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
}) {
  const [name, setName] = useState(fullName);
  const [avatar, setAvatar] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Elige un archivo de imagen.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("La imagen no puede superar 4 MB.");
      return;
    }

    setUploading(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    setUploading(false);

    if (uploadError) {
      setError("No se pudo subir la foto: " + uploadError.message);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatar(data.publicUrl);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);

    const fd = new FormData();
    fd.set("full_name", name);
    fd.set("avatar_url", avatar ?? "");
    const result = await updateOwnProfile(fd);

    setPending(false);
    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  const initial = (name || "?").charAt(0).toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="rounded-[18px] border border-border bg-card p-5">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 flex-shrink-0">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="Foto de perfil" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-soft text-2xl font-extrabold text-accent">
              {initial}
            </div>
          )}
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Cambiar foto"
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[0_6px_14px_-6px_var(--color-accent)] disabled:opacity-50"
          >
            <CameraIcon className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-muted">Nombre completo</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>
      </div>

      {uploading && <p className="mt-3 text-xs text-muted">Subiendo foto...</p>}
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      {saved && !error && <p className="mt-3 text-xs font-semibold text-accent">Perfil actualizado.</p>}

      <button
        type="submit"
        disabled={pending || uploading}
        className="mt-4 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
