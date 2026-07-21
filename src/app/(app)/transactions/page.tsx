import Link from "next/link";
import { Trash2 } from "lucide-react";
import { getCurrentUser, getHousehold, getTransactions } from "@/lib/data/queries";
import { getPeriodRange, formatBRL, type Period } from "@/lib/utils/date-range";
import { getCategoryIcon } from "@/lib/icon-map";
import { deleteTransaction } from "./actions";

function formatDateHeading(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; scope?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const period = (params.period as Period) ?? "this-month";
  const scope = (params.scope as "mine" | "shared" | "all") ?? "all";

  const [household, { from, to }] = [await getHousehold(user.id), getPeriodRange(period)];

  const transactions = await getTransactions(user.id, { from, to, scope: household ? scope : "mine" });

  const grouped = transactions.reduce<Record<string, typeof transactions>>((acc, tx) => {
    (acc[tx.occurred_at] ??= []).push(tx);
    return acc;
  }, {});

  const periods: { value: Period; label: string }[] = [
    { value: "this-month", label: "Este mês" },
    { value: "last-month", label: "Mês passado" },
    { value: "all", label: "Tudo" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-semibold">Extrato</h1>
      </header>

      <div className="flex gap-2 overflow-x-auto">
        {periods.map((p) => (
          <Link
            key={p.value}
            href={`/transactions?period=${p.value}&scope=${scope}`}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm ${
              period === p.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {household && (
        <div className="flex rounded-xl bg-surface-muted p-1 text-sm">
          {(
            [
              { value: "all", label: "Todas" },
              { value: "mine", label: "Minhas" },
              { value: "shared", label: "Combinadas" },
            ] as const
          ).map((s) => (
            <Link
              key={s.value}
              href={`/transactions?period=${period}&scope=${s.value}`}
              className={`flex-1 rounded-lg py-2 text-center transition-colors ${
                scope === s.value ? "bg-surface shadow-sm font-medium" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      )}

      {transactions.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Nenhum lançamento neste período.
        </p>
      )}

      <div className="flex flex-col gap-5">
        {Object.entries(grouped).map(([date, txs]) => (
          <div key={date} className="flex flex-col gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {formatDateHeading(date)}
            </h2>
            <div className="flex flex-col gap-2">
              {txs.map((tx) => {
                const Icon = getCategoryIcon(tx.category?.icon);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${tx.category?.color ?? "#6b7280"}22` }}
                    >
                      <Icon size={18} color={tx.category?.color ?? "#6b7280"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {tx.description || tx.category?.name || "Sem categoria"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {tx.category?.name}
                        {tx.is_shared ? " · Combinado" : ""}
                        {tx.items?.length ? ` · ${tx.items.length} itens` : ""}
                        {tx.installment_total ? ` · Parcela ${tx.installment_number}/${tx.installment_total}` : ""}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        tx.kind === "income" ? "text-income" : "text-expense"
                      }`}
                    >
                      {tx.kind === "income" ? "+" : "-"}
                      {formatBRL(tx.amount)}
                    </span>
                    {tx.user_id === user.id && (
                      <form action={deleteTransaction.bind(null, tx.id)}>
                        <button
                          type="submit"
                          aria-label="Excluir lançamento"
                          className="text-muted-foreground"
                        >
                          <Trash2 size={16} />
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
