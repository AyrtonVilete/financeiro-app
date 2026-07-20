"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteTransaction(transactionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("fin_transactions").delete().eq("id", transactionId).eq("user_id", user.id);

  revalidatePath("/");
  revalidatePath("/transactions");
}
