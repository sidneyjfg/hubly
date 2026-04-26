"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  CalendarDays,
  Crown,
  Images,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserCircle2,
  UserRoundCog,
  UsersRound
} from "lucide-react";
import { useState } from "react";

import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const navigation: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}> = [
  { href: "/admin", label: "Admin", icon: Crown, roles: ["administrator"] },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["administrator", "reception"] },
  { href: "/customers", label: "Clientes", icon: UsersRound, roles: ["administrator", "reception", "provider"] },
  { href: "/providers", label: "Profissionais", icon: UserRoundCog, roles: ["administrator", "reception"] },
  { href: "/storefront", label: "Vitrine", icon: Images, roles: ["administrator", "reception", "provider"] },
  { href: "/bookings", label: "Agenda", icon: CalendarDays, roles: ["administrator", "reception", "provider"] },
  { href: "/automations", label: "Automações", icon: Bot, roles: ["administrator"] },
  { href: "/reports", label: "Relatórios", icon: BarChart3, roles: ["administrator", "reception"] },
  { href: "/account", label: "Conta", icon: UserCircle2, roles: ["administrator", "reception", "provider"] },
  { href: "/settings", label: "Configurações", icon: Settings, roles: ["administrator"] }
];

export function AppSidebar() {
  const pathname = usePathname();
  const logout = useAppStore((state) => state.logout);
  const role = useAppStore((state) => state.currentUser?.role);
  const [isExpanded, setIsExpanded] = useState(true);
  const ToggleIcon = isExpanded ? PanelLeftClose : PanelLeftOpen;
  const visibleNavigation = role ? navigation.filter((item) => item.roles.includes(role)) : navigation;

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/10 bg-slate-950/90 px-3 py-5 backdrop-blur transition-[width] duration-300 xl:flex",
        isExpanded ? "w-64" : "w-20"
      )}
    >
      <div className={cn("mb-8 flex gap-2", isExpanded ? "items-center justify-between" : "flex-col items-center")}>
        <Link className={cn("flex min-w-0 items-center gap-3", !isExpanded && "justify-center")} href="/">
          <BrandLogo compact={!isExpanded} size="sm" />
        </Link>
        <button
          aria-label={isExpanded ? "Recolher barra lateral" : "Expandir barra lateral"}
          className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        >
          <ToggleIcon className="h-4 w-4" />
        </button>
      </div>

      <nav className="space-y-1.5">
        {visibleNavigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition",
                !isExpanded && "justify-center px-0",
                isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
              href={item.href as Route}
              key={item.href}
              title={isExpanded ? undefined : item.label}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {isExpanded ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      {isExpanded ? (
        <div className="mt-8 rounded-xl border border-sky-400/20 bg-sky-400/10 p-4">
          <p className="text-sm font-medium text-white">No-show sob controle</p>
          <p className="mt-2 text-sm text-slate-300">Fluxos ativos em WhatsApp e e-mail cobrindo os próximos 7 dias.</p>
        </div>
      ) : null}

      <Button
        aria-label="Sair"
        className={cn("mt-auto", isExpanded ? "w-full" : "h-10 w-full px-0")}
        onClick={logout}
        title="Sair"
        variant="secondary"
      >
        <LogOut className={cn("h-4 w-4", isExpanded && "mr-2")} />
        {isExpanded ? "Sair" : null}
      </Button>
    </aside>
  );
}
