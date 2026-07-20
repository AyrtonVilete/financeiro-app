"use client";

import { useState } from "react";
import { RiskProfileForm } from "@/components/risk-profile-form";
import { AllocationChart } from "@/components/allocation-chart";
import { RISK_PROFILES, projectFutureValue } from "@/lib/investments/recommend";
import { formatBRL } from "@/lib/utils/date-range";
import type { RiskProfile } from "@/lib/types/database";

export function InvestmentsPanel({
  riskProfile,
  monthlySurplus,
}: {
  riskProfile: RiskProfile | null;
  monthlySurplus: number | null;
}) {
  const [editing, setEditing] = useState(!riskProfile);

  if (editing || !riskProfile) {
    return (
      <div className="flex flex-col gap-4">
        <RiskProfileForm defaultRiskProfile={riskProfile} defaultMonthlySurplus={monthlySurplus} />
      </div>
    );
  }

  const info = RISK_PROFILES[riskProfile];
  const surplus = monthlySurplus ?? 0;
  const midRate =
    riskProfile === "conservador" ? 10 : riskProfile === "moderado" ? 11.5 : 13.5;
  const projected12m = surplus > 0 ? projectFutureValue(surplus, midRate, 12) : 0;
  const invested12m = surplus * 12;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Seu perfil</p>
            <h2 className="text-lg font-semibold">{info.title}</h2>
          </div>
          <button type="button" onClick={() => setEditing(true)} className="text-sm text-primary">
            Alterar
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{info.summary}</p>
        <p className="mt-2 text-xs text-muted-foreground">{info.illustrativeRateRange}</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-medium">Sugestão de alocação</h3>
        <AllocationChart allocation={info.allocation} />
      </div>

      {surplus > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-sm font-medium">Se você investir {formatBRL(surplus)}/mês por 12 meses</h3>
          <div className="mt-3 flex gap-3">
            <div className="flex-1 rounded-lg bg-surface-muted p-3">
              <p className="text-xs text-muted-foreground">Total investido</p>
              <p className="text-base font-semibold">{formatBRL(invested12m)}</p>
            </div>
            <div className="flex-1 rounded-lg bg-surface-muted p-3">
              <p className="text-xs text-muted-foreground">Estimativa com rendimento</p>
              <p className="text-base font-semibold text-income">{formatBRL(projected12m)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Estimativa ilustrativa usando uma taxa média de {midRate}% ao ano. Rentabilidade passada não
            garante resultados futuros.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
        Este conteúdo é educativo e não constitui recomendação de investimento personalizada, consultoria
        financeira licenciada ou promessa de rentabilidade. Antes de investir, avalie sua reserva de
        emergência, seus objetivos e, se necessário, consulte um profissional certificado.
      </div>
    </div>
  );
}
