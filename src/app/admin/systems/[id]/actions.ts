"use server";

import { supabaseServer } from "../../../../lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleSystemActive(
  systemId: string,
  nextValue: boolean
) {
  const supabase = supabaseServer();

  const { error } = await supabase
    .from("system_catalog")
    .update({ is_active: nextValue })
    .eq("id", systemId);

  if (error) {
    console.error(error);
    throw new Error("Failed to update system status");
  }

  revalidatePath("/admin/systems");
  revalidatePath(`/admin/systems/${systemId}`);
}

