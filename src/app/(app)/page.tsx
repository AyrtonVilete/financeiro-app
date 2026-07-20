import Link from "next/link";
import { format, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getCurrentUser, getHousehold, getProfile, getTransactions } from "@/lib/data/queries";
import { getPeriodRange, formatBRL } from "@/lib/utils/date-range";
import { StatTile } from "@/components/stat-tile";
import { CategoryBarChart, TrendBarChart, type CategoryTotal, type MonthlyPoint } from "@/components/dashboard-charts";

const TOP_CATEGORIES = 6;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [profile, household] = await Promise.all([getProfile(user.id), getHousehold(user.id)]);

  const { from, to } = getPeriodRange("this-month");
  const monthTransactions = await getTransactions(user.id, { from, to, scope: "all" });

  const totalExpense = monthTransactions
    .filter((t) => t.kind === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = monthTransactions
    .filter((t) => t.kind === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const saldo = totalIncome - totalExpense;

  const sharedExpense = monthTransactions
    .filter((t) => t.kind === "expense" && t.is_shared)
    .reduce((sum, t) => sum + t.amount, 0);
  const mineExpense = totalExpense - sharedExpense;

  const categoryMap = new Map<string, CategoryTotal>();
  for (const t of monthTransactions) {
    if (t.kind !== "expense") continue;
    const name = t.category?.name ?? "Outros";
    const existing = categoryMap.get(name);
    if (existing) {
      existing.amount += t.amount;
    } else {
      categoryMap.set(name, { name, amount: t.amount, color: t.category?.color ?? "#6b7280" });
    }
  }

  const sortedCategories = Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount);
  const topCategories = sortedCategories.slice(0, TOP_CATEGORIES);
  const restTotal = sortedCategories.slice(TOP_CATEGORIES).reduce((sum, c) => sum + c.amount, 0);
  const categoryData: CategoryTotal[] =
    restTotal > 0 ? [...topCategories, { name: "Outros", amount: restTotal, color: "#c3c2b7", isOther: true }] : topCategories;

  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
  const trendTransactions = await getTransactions(user.id, {
    from: format(sixMonthsAgo, "yyyy-MM-dd"),
    kind: "expense",
    scope: "all",
  });

  const monthBuckets = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const key = format(startOfMonth(subMonths(new Date(), i)), "yyyy-MM");
    monthBuckets.set(key, 0);
  }
  for (const t of trendTransactions) {
    const key = t.occurred_at.slice(0, 7);
    if (monthBuckets.has(key)) {
      monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + t.amount);
    }
  }
  const trendData: MonthlyPoint[] = Array.from(monthBuckets.entries()).map(([key, amount]) => ({
    label: format(new Date(`${key}-01T00:00:00`), "MMM", { locale: ptBR }),
    amount,
  }));

  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const monthLabel = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-muted-foreground capitalize">{monthLabel}</p>
        <h1 className="text-xl font-semibold">Olá{firstName ? `, ${firstName}` : ""}</h1>
      </header>

      <section className="flex gap-3">
        <StatTile label="Gastos no mês" value={formatBRL(totalExpense)} tone="expense" />
        <StatTile label="Receitas" value={formatBRL(totalIncome)} tone="income" />
      </section>
      <section>
        <StatTile label="Saldo do mês" value={formatBRL(saldo)} tone={saldo >= 0 ? "income" : "expense"} />
      </section>

      {household && (
        <section className="flex gap-3">
          <StatTile label="Meus gastos" value={formatBRL(mineExpense)} />
          <StatTile label="Combinados" value={formatBRL(sharedExpense)} />
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Gastos por categoria</h2>
          <Link href="/transactions" className="text-xs text-primary">
            Ver extrato
          </Link>
        </div>
        <CategoryBarChart data={categoryData} />
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-medium">Últimos 6 meses</h2>
        <TrendBarChart data={trendData} />
      </section>

      <Link
        href="/add"
        className="rounded-xl bg-primary px-4 py-3.5 text-center text-base font-medium text-primary-foreground"
      >
        + Novo lançamento
      </Link>
    </div>
  );
}
