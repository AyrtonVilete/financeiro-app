"use server";

import { randomUUID } from "crypto";
import { addMonths, format } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AddTransactionState {
  error: string | null;
}

interface ItemInput {
  name: string;
  quantity: number;
  unit_price: number;
}

export async function createTransaction(
  _prevState: AddTransactionState,
  formData: FormData
): Promise<AddTransactionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const kind = String(formData.get("kind") ?? "expense") as "expense" | "income";
  const mode = String(formData.get("mode") ?? "quick");
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const occurredAt = String(formData.get("occurredAt") ?? "") || new Date().toISOString().slice(0, 10);
  const isShared = formData.get("isShared") === "on";
  const householdId = String(formData.get("householdId") ?? "") || null;

  let amount = 0;
  let items: ItemInput[] = [];

  if (mode === "detailed") {
    const rawItems = String(formData.get("items") ?? "[]");
    try {
      const parsed = JSON.parse(rawItems) as ItemInput[];
      items = parsed
        .map((item) => ({
          name: String(item.name ?? "").trim(),
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
        }))
        .filter((item) => item.name && item.quantity > 0);
    } catch {
      return { error: "Não foi possível ler os itens informados." };
    }

    if (items.length === 0) {
      return { error: "Adicione pelo menos um item." };
    }

    amount = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  } else {
    amount = Number(formData.get("amount") ?? 0);
  }

  if (!amount || amount <= 0) {
    return { error: "Informe um valor maior que zero." };
  }

  const installmentTotal = mode === "quick" ? Number(formData.get("installments") ?? 0) : 0;

  if (installmentTotal >= 2) {
    const installmentGroupId = randomUUID();
    const baseDate = new Date(`${occurredAt}T00:00:00`);

    const rows = Array.from({ length: installmentTotal }, (_, i) => ({
      user_id: user.id,
      household_id: isShared ? householdId : null,
      category_id: categoryId,
      kind,
      amount,
      description,
      occurred_at: format(addMonths(baseDate, i), "yyyy-MM-dd"),
      is_shared: isShared && !!householdId,
      installment_group_id: installmentGroupId,
      installment_number: i + 1,
      installment_total: installmentTotal,
    }));

    const { error: insertError } = await supabase.from("fin_transactions").insert(rows);

    if (insertError) {
      console.error("createTransaction installments insert error", insertError);
      return { error: "Não foi possível salvar as parcelas. Tente novamente." };
    }

    revalidatePath("/");
    revalidatePath("/transactions");
    redirect("/transactions");
  }

  const { data: transaction, error: insertError } = await supabase
    .from("fin_transactions")
    .insert({
      user_id: user.id,
      household_id: isShared ? householdId : null,
      category_id: categoryId,
      kind,
      amount,
      description,
      occurred_at: occurredAt,
      is_shared: isShared && !!householdId,
    })
    .select("id")
    .single();

  if (insertError || !transaction) {
    console.error("createTransaction insert error", insertError);
    return { error: "Não foi possível salvar o lançamento. Tente novamente." };
  }

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from("fin_transaction_items").insert(
      items.map((item) => ({
        transaction_id: transaction.id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }))
    );

    if (itemsError) {
      console.error("createTransaction items error", itemsError);
      return { error: "Lançamento salvo, mas houve um erro ao salvar os itens." };
    }
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  redirect("/transactions");
}
