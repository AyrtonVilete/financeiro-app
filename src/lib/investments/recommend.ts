import type { RiskProfile } from "@/lib/types/database";

export interface AllocationSlice {
  label: string;
  percentage: number;
  description: string;
}

export interface RiskProfileInfo {
  title: string;
  summary: string;
  illustrativeRateRange: string;
  allocation: AllocationSlice[];
}

// Alocações e faixas de retorno são sugestões educativas genéricas baseadas em
// práticas comuns de planejamento financeiro pessoal — não consideram o cenário
// de mercado atual nem substituem uma consultoria de investimentos licenciada.
export const RISK_PROFILES: Record<RiskProfile, RiskProfileInfo> = {
  conservador: {
    title: "Conservador",
    summary: "Prioriza proteger o dinheiro e manter liquidez, aceitando menor rentabilidade.",
    illustrativeRateRange: "≈ 9% a 11% ao ano (faixa histórica aproximada)",
    allocation: [
      {
        label: "Reserva de emergência",
        percentage: 40,
        description: "Tesouro Selic ou CDB com liquidez diária — resgate rápido, risco muito baixo.",
      },
      {
        label: "Renda fixa pós-fixada",
        percentage: 35,
        description: "CDBs, LCIs/LCAs atrelados ao CDI — bom equilíbrio entre segurança e retorno.",
      },
      {
        label: "Renda fixa IPCA+",
        percentage: 20,
        description: "Tesouro IPCA+ — protege o poder de compra no longo prazo.",
      },
      {
        label: "Fundos multimercado (baixo risco)",
        percentage: 5,
        description: "Pequena exposição a estratégias diversificadas, com volatilidade controlada.",
      },
    ],
  },
  moderado: {
    title: "Moderado",
    summary: "Busca equilíbrio entre segurança e crescimento, tolerando alguma oscilação.",
    illustrativeRateRange: "≈ 10% a 13% ao ano (faixa histórica aproximada)",
    allocation: [
      {
        label: "Reserva de emergência",
        percentage: 20,
        description: "Tesouro Selic ou CDB com liquidez diária.",
      },
      {
        label: "Renda fixa pós-fixada",
        percentage: 30,
        description: "CDBs e LCIs/LCAs atrelados ao CDI.",
      },
      {
        label: "Renda fixa IPCA+/prefixada",
        percentage: 20,
        description: "Tesouro IPCA+ e prefixado para diversificar prazos e indexadores.",
      },
      {
        label: "Fundos multimercado",
        percentage: 15,
        description: "Estratégias diversificadas com gestão ativa.",
      },
      {
        label: "Ações e ETFs",
        percentage: 15,
        description: "Exposição à renda variável para buscar crescimento no longo prazo.",
      },
    ],
  },
  arrojado: {
    title: "Arrojado",
    summary: "Aceita maior volatilidade em troca de potencial de retorno mais alto no longo prazo.",
    illustrativeRateRange: "≈ 11% a 16% ao ano, com maior oscilação (faixa histórica aproximada)",
    allocation: [
      {
        label: "Reserva de emergência",
        percentage: 15,
        description: "Tesouro Selic ou CDB com liquidez diária.",
      },
      {
        label: "Renda fixa (pós e IPCA+)",
        percentage: 20,
        description: "Base de segurança mesmo em um perfil mais arrojado.",
      },
      {
        label: "Ações e ETFs (Brasil e exterior)",
        percentage: 30,
        description: "Maior exposição à renda variável, com diversificação geográfica.",
      },
      {
        label: "Fundos multimercado / FIIs",
        percentage: 20,
        description: "Diversificação em fundos imobiliários e estratégias ativas.",
      },
      {
        label: "Alternativos (ex: cripto)",
        percentage: 15,
        description: "Parcela pequena para ativos de maior risco e volatilidade.",
      },
    ],
  },
};

export function projectFutureValue(monthlyAmount: number, annualRatePct: number, months: number) {
  const monthlyRate = Math.pow(1 + annualRatePct / 100, 1 / 12) - 1;
  let total = 0;
  for (let i = 0; i < months; i++) {
    total = (total + monthlyAmount) * (1 + monthlyRate);
  }
  return total;
}
