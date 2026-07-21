import { notFound } from "next/navigation";
import { getCategories, getCurrentUser, getHousehold, getTransactionById } from "@/lib/data/queries";
import { AddTransactionForm } from "@/components/add-transaction-form";

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const transaction = await getTransactionById(user.id, id);
  if (!transaction) notFound();

  const [categories, householdInfo] = await Promise.all([getCategories(user.id), getHousehold(user.id)]);

  const household = householdInfo
    ? { id: householdInfo.household.id, partnerName: householdInfo.partner?.full_name ?? null }
    : null;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-semibold">Editar lançamento</h1>
      </header>

      <AddTransactionForm
        categories={categories}
        household={household}
        editing={{
          id: transaction.id,
          kind: transaction.kind,
          amount: transaction.amount,
          categoryId: transaction.category_id,
          description: transaction.description,
          occurredAt: transaction.occurred_at,
          isShared: transaction.is_shared,
          items: transaction.items?.length
            ? transaction.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                unit_price: item.unit_price,
              }))
            : null,
        }}
      />
    </div>
  );
}
