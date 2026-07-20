import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  Household,
  HouseholdMember,
  Profile,
  TransactionWithRelations,
} from "@/lib/types/database";

// cache() dedupe: layout + página chamam getCurrentUser() de forma independente;
// sem isso cada chamada é um round-trip real ao servidor de Auth do Supabase.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("fin_profiles").select("*").eq("id", userId).single();
  return (data as Profile) ?? null;
}

export interface HouseholdInfo {
  household: Household;
  members: (HouseholdMember & { profile: Profile | null })[];
  partner: Profile | null;
}

export async function getHousehold(userId: string): Promise<HouseholdInfo | null> {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("fin_household_members")
    .select("household_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) return null;

  const { data: household } = await supabase
    .from("fin_households")
    .select("*")
    .eq("id", membership.household_id)
    .single();

  if (!household) return null;

  const { data: members } = await supabase
    .from("fin_household_members")
    .select("*, profile:fin_profiles(*)")
    .eq("household_id", household.id);

  const memberList = (members as (HouseholdMember & { profile: Profile | null })[]) ?? [];
  const partner = memberList.find((m) => m.user_id !== userId)?.profile ?? null;

  return { household: household as Household, members: memberList, partner };
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("fin_categories").select("*").order("name");
  return (data as Category[]) ?? [];
}

export interface TransactionFilters {
  from?: string;
  to?: string;
  scope?: "mine" | "shared" | "all";
  categoryId?: string;
  kind?: "expense" | "income";
  limit?: number;
}

export async function getTransactions(
  userId: string,
  filters: TransactionFilters = {}
): Promise<TransactionWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from("fin_transactions")
    .select("*, category:fin_categories(*), items:fin_transaction_items(*)")
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.from) query = query.gte("occurred_at", filters.from);
  if (filters.to) query = query.lte("occurred_at", filters.to);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.kind) query = query.eq("kind", filters.kind);
  if (filters.scope === "mine") query = query.eq("user_id", userId);
  if (filters.scope === "shared") query = query.eq("is_shared", true);
  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) {
    console.error("getTransactions error", error);
    return [];
  }
  return (data as TransactionWithRelations[]) ?? [];
}
