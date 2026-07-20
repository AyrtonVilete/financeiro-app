import { getCategories, getCurrentUser, getHousehold } from "@/lib/data/queries";
import { AddTransactionForm } from "@/components/add-transaction-form";

export default async function AddPage() {
  const user = await getCurrentUser();
  const [categories, householdInfo] = await Promise.all([
    getCategories(),
    user ? getHousehold(user.id) : null,
  ]);

  const household = householdInfo
    ? { id: householdInfo.household.id, partnerName: householdInfo.partner?.full_name ?? null }
    : null;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-semibold">Novo lançamento</h1>
        <p className="text-sm text-muted-foreground">Registre um gasto rápido ou detalhado por item.</p>
      </header>

      <AddTransactionForm categories={categories} household={household} />
    </div>
  );
}
