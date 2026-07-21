import { cache } from "react";
import { headers } from "next/headers";
import { unstable_cache, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  Household,
  HouseholdMember,
  Profile,
  TransactionWithRelations,
} from "@/lib/types/database";

export interface CurrentUser {
  id: string;
  email: string | null;
}

// O middleware já valida o JWT em todo request (proxy.ts) e repassa a
// identidade via header. Evita um segundo round-trip de rede ao Supabase
// Auth (auth.getUser()) a cada navegação. cache() ainda dedupe dentro do
// mesmo request (layout + página chamam isso de forma independente).
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const headerList = await headers();
  const id = headerList.get("x-supabase-user-id");
  if (id) {
    return { id, email: headerList.get("x-supabase-user-email") || null };
  }

  // Fallback para rotas que não passam pelo matcher do middleware.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? null } : null;
});

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();

  const fetchProfile = unstable_cache(
    async () => {
      const { data } = await supabase.from("fin_profiles").select("*").eq("id", userId).single();
      return (data as Profile) ?? null;
    },
    ["profile", userId],
    { tags: [`profile-${userId}`], revalidate: 300 }
  );

  return fetchProfile();
}

export interface HouseholdInfo {
  household: Household;
  members: (HouseholdMember & { profile: Profile | null })[];
  partner: Profile | null;
}

export async function getHousehold(userId: string): Promise<HouseholdInfo | null> {
  const supabase = await createClient();

  const fetchHousehold = unstable_cache(
    async () => {
      const { data: membership } = await supabase
        .from("fin_household_members")
        .select("household_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!membership) return null;

      const [{ data: household }, { data: members }] = await Promise.all([
        supabase.from("fin_households").select("*").eq("id", membership.household_id).single(),
        supabase
          .from("fin_household_members")
          .select("*, profile:fin_profiles(*)")
          .eq("household_id", membership.household_id),
      ]);

      if (!household) return null;

      const memberList = (members as (HouseholdMember & { profile: Profile | null })[]) ?? [];
      const partner = memberList.find((m) => m.user_id !== userId)?.profile ?? null;

      return { household: household as Household, members: memberList, partner };
    },
    ["household", userId],
    { tags: [`household-${userId}`], revalidate: 60 }
  );

  return fetchHousehold();
}

// Chame após qualquer mutação em fin_households/fin_household_members para que
// todos os integrantes (não só quem disparou a ação) vejam o estado novo na
// próxima navegação, em vez de esperar o cache de 60s expirar sozinho.
export async function revalidateHouseholdForMembers(householdId: string) {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("fin_household_members")
    .select("user_id")
    .eq("household_id", householdId);

  for (const member of members ?? []) {
    updateTag(`household-${member.user_id}`);
  }
}

export async function getCategories(userId: string): Promise<Category[]> {
  const supabase = await createClient();

  const fetchCategories = unstable_cache(
    async () => {
      const { data } = await supabase.from("fin_categories").select("*").order("name");
      return (data as Category[]) ?? [];
    },
    ["categories", userId],
    { tags: ["categories"], revalidate: 3600 }
  );

  return fetchCategories();
}

export interface TransactionFilters {
  from?: string;
  to?: string;
  scope?: "mine" | "shared" | "all";
  categoryId?: string;
  kind?: "expense" | "income";
  limit?: number;
}

export async function getTransactionById(
  userId: string,
  transactionId: string
): Promise<TransactionWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fin_transactions")
    .select("*, category:fin_categories(*), items:fin_transaction_items(*)")
    .eq("id", transactionId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data as TransactionWithRelations) ?? null;
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
