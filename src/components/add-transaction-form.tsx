"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createTransaction, type AddTransactionState } from "@/app/(app)/add/actions";
import type { Category } from "@/lib/types/database";

const initialState: AddTransactionState = { error: null };

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface ItemRow {
  name: string;
  quantity: string;
  unit_price: string;
}

const emptyRow: ItemRow = { name: "", quantity: "1", unit_price: "" };

export function AddTransactionForm({
  categories,
  household,
}: {
  categories: Category[];
  household: { id: string; partnerName: string | null } | null;
}) {
  const [state, formAction, pending] = useActionState(createTransaction, initialState);
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [mode, setMode] = useState<"quick" | "detailed">("quick");
  const [items, setItems] = useState<ItemRow[]>([{ ...emptyRow }]);
  const [isShared, setIsShared] = useState(false);

  const filteredCategories = categories.filter((c) => c.kind === kind);

  const itemsPayload = useMemo(
    () =>
      items.map((item) => ({
        name: item.name,
        quantity: Number(item.quantity.replace(",", ".")) || 0,
        unit_price: Number(item.unit_price.replace(",", ".")) || 0,
      })),
    [items]
  );

  const detailedTotal = itemsPayload.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setItems((prev) => [...prev, { ...emptyRow }]);
  }

  function removeRow(index: number) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-col gap-5 pb-6">
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="kind" value={kind} />
      {mode === "detailed" && <input type="hidden" name="items" value={JSON.stringify(itemsPayload)} readOnly />}
      {household && <input type="hidden" name="householdId" value={household.id} />}

      {/* Tipo: gasto ou receita */}
      <div className="flex rounded-xl bg-surface-muted p-1">
        {(["expense", "income"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              kind === k ? "bg-surface shadow-sm" : "text-muted-foreground"
            }`}
          >
            {k === "expense" ? "Gasto" : "Receita"}
          </button>
        ))}
      </div>

      {/* Modo: rápido ou detalhado (só para gastos) */}
      {kind === "expense" && (
        <div className="flex rounded-xl bg-surface-muted p-1">
          {(["quick", "detailed"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                mode === m ? "bg-surface shadow-sm" : "text-muted-foreground"
              }`}
            >
              {m === "quick" ? "Valor total" : "Item a item"}
            </button>
          ))}
        </div>
      )}

      {mode === "quick" || kind === "income" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="amount" className="text-sm font-medium">
            Valor
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3">
            <span className="text-muted-foreground">R$</span>
            <input
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              placeholder="0,00"
              className="w-full bg-transparent text-lg outline-none"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Itens</span>
            <span className="text-sm text-muted-foreground">Total: {formatBRL(detailedTotal)}</span>
          </div>

          <div className="flex flex-col gap-3">
            {items.map((item, index) => (
              <div key={index} className="rounded-xl border border-border bg-surface p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nome do item"
                    value={item.name}
                    onChange={(e) => updateItem(index, { name: e.target.value })}
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="text-muted-foreground"
                    aria-label="Remover item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    placeholder="Qtd"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: e.target.value })}
                    className="w-16 rounded-lg border border-border bg-surface-muted px-2 py-1.5 text-sm outline-none"
                  />
                  <span className="text-muted-foreground">×</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="Preço unit."
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, { unit_price: e.target.value })}
                    className="flex-1 rounded-lg border border-border bg-surface-muted px-2 py-1.5 text-sm outline-none"
                  />
                  <span className="w-20 shrink-0 text-right text-sm text-muted-foreground">
                    {formatBRL((Number(item.quantity.replace(",", ".")) || 0) * (Number(item.unit_price.replace(",", ".")) || 0))}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-sm text-primary"
          >
            <Plus size={16} /> Adicionar item
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoryId" className="text-sm font-medium">
          Categoria
        </label>
        <select
          id="categoryId"
          name="categoryId"
          required
          className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none"
        >
          {filteredCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Descrição (opcional)
        </label>
        <input
          id="description"
          name="description"
          type="text"
          placeholder="Ex: Mercado do mês"
          className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="occurredAt" className="text-sm font-medium">
          Data
        </label>
        <input
          id="occurredAt"
          name="occurredAt"
          type="date"
          defaultValue={today}
          max={today}
          required
          className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none"
        />
      </div>

      {household && (
        <label className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <input
            type="checkbox"
            name="isShared"
            checked={isShared}
            onChange={(e) => setIsShared(e.target.checked)}
            className="h-5 w-5 accent-[var(--primary)]"
          />
          <span className="text-sm">
            Compartilhar com {household.partnerName ?? "parceiro(a)"} na visão combinada
          </span>
        </label>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-expense">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-primary px-4 py-3.5 text-base font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar lançamento"}
      </button>
    </form>
  );
}
