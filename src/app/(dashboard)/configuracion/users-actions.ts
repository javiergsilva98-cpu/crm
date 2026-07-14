"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/profile";

export async function updateUserRole(formData: FormData) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return;

  const supabase = await createClient();
  const id = String(formData.get("id"));
  const role = String(formData.get("role"));
  if (role !== "admin" && role !== "user") return;

  await supabase.from("profiles").update({ role }).eq("id", id);
  revalidatePath("/configuracion");
}

export async function createInvite(formData: FormData) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const role = String(formData.get("role") ?? "user");
  if (role !== "admin" && role !== "user") return;

  const email = String(formData.get("email") ?? "").trim() || null;

  const { data: invite, error } = await supabase
    .from("invites")
    .insert({ role, created_by: user.id, email })
    .select("id")
    .single();

  if (!error && invite && email) {
    await sendInviteEmail(invite.id, email);
  }

  revalidatePath("/configuracion");
}

async function sendInviteEmail(inviteId: string, email: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://crm-jgs.vercel.app";
  const inviteUrl = `${siteUrl}/login?invite=${inviteId}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
      to: email,
      subject: "Te han invitado al CRM",
      html: `<p>Te han invitado a unirte al CRM.</p><p><a href="${inviteUrl}">Haz clic aquí para entrar</a></p>`,
    }),
  });

  if (res.ok) {
    await supabase.from("invites").update({ sent_at: new Date().toISOString() }).eq("id", inviteId);
  }
}

export async function deleteInvite(formData: FormData) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return;

  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("invites").delete().eq("id", id);
  revalidatePath("/configuracion");
}
