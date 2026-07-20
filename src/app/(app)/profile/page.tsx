import { getCurrentUser, getHousehold, getProfile } from "@/lib/data/queries";
import { HouseholdPanel } from "@/components/household-panel";
import { logout } from "@/app/auth/actions";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [profile, householdInfo] = await Promise.all([getProfile(user.id), getHousehold(user.id)]);

  const household = householdInfo
    ? {
        id: householdInfo.household.id,
        inviteCode: householdInfo.household.invite_code,
        partnerName: householdInfo.partner?.full_name ?? null,
      }
    : null;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-semibold">Perfil</h1>
      </header>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
          {(profile?.full_name ?? user.email ?? "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{profile?.full_name ?? "Sem nome"}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <HouseholdPanel household={household} />

      <form action={logout}>
        <button type="submit" className="w-full rounded-xl border border-border py-3 text-sm font-medium text-expense">
          Sair da conta
        </button>
      </form>
    </div>
  );
}
