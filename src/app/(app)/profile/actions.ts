"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ProfileActionState {
  error: string | null;
  success?: string | null;
}

export async function createHousehold(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const name = String(formData.get("name") ?? "").trim() || "Nossa casa";

  const { data: household, error } = await supabase
    .from("fin_households")
    .insert({ name, created_by: user.id })
    .select("id")
    .single();

  if (error || !household) {
    console.error("createHousehold error", error);
    return { error: "Não foi possível criar o espaço compartilhado." };
  }

  const { error: memberError } = await supabase
    .from("fin_household_members")
    .insert({ household_id: household.id, user_id: user.id });

  if (memberError) {
    console.error("createHousehold member error", memberError);
    return { error: "Espaço criado, mas houve um erro ao vincular você a ele." };
  }

  revalidatePath("/profile");
  return { error: null, success: "Espaço compartilhado criado!" };
}

export async function joinHousehold(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const inviteCode = String(formData.get("inviteCode") ?? "").trim();

  if (!inviteCode) return { error: "Informe o código de convite." };

  const { error } = await supabase.rpc("fin_join_household", { p_invite_code: inviteCode });

  if (error) {
    return { error: error.message.includes("inválido") ? "Código de convite inválido." : error.message };
  }

  revalidatePath("/profile");
  return { error: null, success: "Você entrou no espaço compartilhado!" };
}

export async function leaveHousehold(householdId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("fin_household_members")
    .delete()
    .eq("household_id", householdId)
    .eq("user_id", user.id);

  revalidatePath("/profile");
}

export async function updateRiskProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const riskProfile = String(formData.get("riskProfile") ?? "");
  const monthlySurplusRaw = String(formData.get("monthlySurplus") ?? "");
  const monthlySurplus = monthlySurplusRaw ? Number(monthlySurplusRaw) : null;

  if (!["conservador", "moderado", "arrojado"].includes(riskProfile)) {
    return { error: "Selecione um perfil de risco." };
  }

  const { error } = await supabase
    .from("fin_profiles")
    .update({ risk_profile: riskProfile, monthly_surplus: monthlySurplus })
    .eq("id", user.id);

  if (error) {
    console.error("updateRiskProfile error", error);
    return { error: "Não foi possível salvar seu perfil." };
  }

  revalidatePath("/investments");
  revalidatePath("/profile");
  return { error: null, success: "Perfil atualizado!" };
}
