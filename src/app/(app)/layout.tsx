import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/queries";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-4 pt-6">{children}</div>
      <BottomNav />
    </div>
  );
}
