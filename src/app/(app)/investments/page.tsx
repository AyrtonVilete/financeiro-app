import { getCurrentUser, getProfile } from "@/lib/data/queries";
import { InvestmentsPanel } from "@/components/investments-panel";

export default async function InvestmentsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await getProfile(user.id);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-semibold">Investimentos</h1>
        <p className="text-sm text-muted-foreground">Sugestões educativas com base no seu perfil de risco.</p>
      </header>

      <InvestmentsPanel riskProfile={profile?.risk_profile ?? null} monthlySurplus={profile?.monthly_surplus ?? null} />
    </div>
  );
}
