"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBRL } from "@/lib/utils/date-range";

export interface CategoryTotal {
  name: string;
  amount: number;
  color: string;
  isOther?: boolean;
}

export interface MonthlyPoint {
  label: string;
  amount: number;
}

function CategoryTooltip({ active, payload }: { active?: boolean; payload?: { payload: CategoryTotal }[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{item.name}</p>
      <p className="text-muted-foreground">{formatBRL(item.amount)}</p>
    </div>
  );
}

export function CategoryBarChart({ data }: { data: CategoryTotal[] }) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sem gastos registrados neste período.
      </p>
    );
  }

  const height = Math.max(data.length * 40, 120);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }} barCategoryGap={10}>
        <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={92}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
        />
        <Tooltip content={<CategoryTooltip />} cursor={{ fill: "var(--chart-grid)", opacity: 0.4 }} />
        <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.isOther ? "var(--chart-other)" : "var(--chart-series-1)"} />
          ))}
          <LabelList
            dataKey="amount"
            position="right"
            formatter={(value) => formatBRL(Number(value ?? 0))}
            style={{ fill: "var(--foreground)", fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload: MonthlyPoint }[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-medium capitalize">{item.label}</p>
      <p className="text-muted-foreground">{formatBRL(item.amount)}</p>
    </div>
  );
}

export function TrendBarChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barCategoryGap={16}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={{ stroke: "var(--chart-grid)" }}
          tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
        />
        <YAxis hide />
        <Tooltip content={<TrendTooltip />} cursor={{ fill: "var(--chart-grid)", opacity: 0.4 }} />
        <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={24} fill="var(--chart-series-1)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
