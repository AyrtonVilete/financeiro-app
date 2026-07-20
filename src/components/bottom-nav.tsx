"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, Receipt, TrendingUp, User } from "lucide-react";

const items = [
  { href: "/", label: "Início", icon: LayoutDashboard },
  { href: "/transactions", label: "Extrato", icon: Receipt },
  { href: "/add", label: "Adicionar", icon: PlusCircle },
  { href: "/investments", label: "Investir", icon: TrendingUp },
  { href: "/profile", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <ul className="mx-auto flex w-full max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const isAdd = href === "/add";

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon
                  size={isAdd ? 30 : 22}
                  strokeWidth={active ? 2.5 : 2}
                  className={isAdd ? "text-primary" : ""}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
