export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "income" | "expense";
}) {
  const toneClass = tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "text-foreground";

  return (
    <div className="flex flex-1 flex-col gap-1 rounded-xl border border-border bg-surface p-3.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-lg font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}
