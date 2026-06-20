"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Images, UserRoundCog, UsersRound } from "lucide-react";

import type { UserRole } from "@/lib/types";
import { cn, getDefaultRouteForRole } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

type MobileNavigationItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
};

const mobileNavigation: MobileNavigationItem[] = [
  { href: "/dashboard", label: "Início", icon: Home, roles: ["administrator", "reception"] },
  { href: "/bookings", label: "Agenda", icon: CalendarDays, roles: ["administrator", "reception", "provider"] },
  { href: "/customers", label: "Clientes", icon: UsersRound, roles: ["administrator", "reception", "provider"] },
  { href: "/providers", label: "Equipe", icon: UserRoundCog, roles: ["administrator", "reception"] },
  { href: "/storefront", label: "Vitrine", icon: Images, roles: ["provider"] },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const role = useAppStore((state) => state.currentUser?.role);
  const fallbackRole: UserRole = role ?? "reception";
  const items = mobileNavigation
    .filter((item) => item.roles.includes(fallbackRole))
    .map((item) => item.label === "Início" ? { ...item, href: getDefaultRouteForRole(fallbackRole) } : item);

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl xl:hidden"
    >
      <div className={cn("mx-auto grid max-w-lg gap-1", items.length === 3 ? "grid-cols-3" : "grid-cols-4")}>
        {items.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-medium transition",
                isActive ? "bg-primary/15 text-sky-200" : "text-slate-400 active:bg-white/5 active:text-white"
              )}
              href={item.href as Route}
              key={item.href}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
