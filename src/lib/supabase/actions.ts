"use server";

import { redirect } from "next/navigation";
import { createClient } from "./server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function getOrganization() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", user.user_metadata.org_id ?? user.id)
    .single();

  return data;
}
