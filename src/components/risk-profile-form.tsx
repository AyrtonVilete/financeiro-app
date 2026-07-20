"use client";

import { useActionState, useState } from "react";
import { updateRiskProfile, type ProfileActionState } from "@/app/(app)/profile/actions";
import type { RiskProfile } from "@/lib/types/database";

const initialState: ProfileActionState = { error: null };

const OPTIONS: { value: RiskProfile; title: string; description: string }[] = [
  {
    value: "conservador",
    title: "Conservador",
    description: "Prefiro segurança, mesmo que o retorno seja menor.",
  },
  {
    value: "moderado",
    title: "Moderado",
    description: "Aceito alguma oscilação para buscar um retorno melhor.",
  },
  {
    value: "arrojado",
    title: "Arrojado",
    description: "Estou confortável com mais risco em busca de mais retorno.",
  },
];

export function RiskProfileForm({
  defaultRiskProfile,
  defaultMonthlySurplus,
}: {
  defaultRiskProfile?: RiskProfile | null;
  defaultMonthlySurplus?: number | null;
}) {
  const [state, formAction, pending] = useActionState(updateRiskProfile, initialState);
  const [selected, setSelected] = useState<RiskProfile | null>(defaultRiskProfile ?? null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="riskProfile" value={selected ?? ""} />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Qual seu perfil de risco?</span>
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSelected(opt.value)}
            className={`rounded-xl border p-3.5 text-left transition-colors ${
              selected === opt.value ? "border-primary bg-primary/5" : "border-border bg-surface"
            }`}
          >
            <p className="text-sm font-medium">{opt.title}</p>
            <p className="text-xs text-muted-foreground">{opt.description}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="monthlySurplus" className="text-sm font-medium">
          Quanto sobra por mês para investir? (opcional)
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3">
          <span className="text-muted-foreground">R$</span>
          <input
            id="monthlySurplus"
            name="monthlySurplus"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            defaultValue={defaultMonthlySurplus ?? ""}
            placeholder="0,00"
            className="w-full bg-transparent text-base outline-none"
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-expense">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || !selected}
        className="rounded-xl bg-primary px-4 py-3 text-base font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Ver sugestões"}
      </button>
    </form>
  );
}
