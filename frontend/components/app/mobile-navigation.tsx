"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  CalendarDays,
  CreditCard,
  Crown,
  HelpCircle,
  Home,
  Images,
  Menu,
  Settings,
  UserCircle2,
  UserRoundCog,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import type { UserRole } from "@/lib/types";
import { cn, getDefaultRouteForRole } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

type MobileNavigationItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
};

const allMobileNavigation: MobileNavigationItem[] = [
  { href: "/admin", label: "Admin", icon: Crown, roles: ["administrator"] },
  { href: "/dashboard", label: "Início", icon: Home, roles: ["administrator", "reception"] },
  { href: "/bookings", label: "Agenda", icon: CalendarDays, roles: ["administrator", "reception", "provider"] },
  { href: "/customers", label: "Clientes", icon: UsersRound, roles: ["administrator", "reception", "provider"] },
  { href: "/providers", label: "Equipe", icon: UserRoundCog, roles: ["administrator", "reception"] },
  { href: "/storefront", label: "Vitrine", icon: Images, roles: ["administrator", "reception", "provider"] },
  { href: "/automations", label: "Automações", icon: Bot, roles: ["administrator"] },
  { href: "/reports", label: "Relatórios", icon: BarChart3, roles: ["administrator", "reception"] },
  { href: "/payments", label: "Assinatura", icon: CreditCard, roles: ["administrator"] },
  { href: "/settings", label: "Configurações", icon: Settings, roles: ["administrator"] },
  { href: "/account", label: "Minha conta", icon: UserCircle2, roles: ["administrator", "reception", "provider"] },
  { href: "/help", label: "Ajuda", icon: HelpCircle, roles: ["administrator", "reception", "provider"] },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const role = useAppStore((state) => state.currentUser?.role) ?? "reception";
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const mappedItems = allMobileNavigation
    .filter((item) => item.roles.includes(role))
    .map((item) => item.label === "Início" ? { ...item, href: getDefaultRouteForRole(role) } : item);
  const visibleItems = mappedItems.filter(
    (item, index) => mappedItems.findIndex((candidate) => candidate.href === item.href) === index
  );
  const preferredLabels = role === "provider"
    ? ["Agenda", "Clientes", "Vitrine"]
    : role === "administrator"
      ? ["Admin", "Agenda", "Clientes"]
      : ["Início", "Agenda", "Clientes"];
  const primaryItems = preferredLabels
    .map((label) => visibleItems.find((item) => item.label === label))
    .filter((item): item is MobileNavigationItem => Boolean(item));

  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMoreOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMoreOpen]);

  return (
    <>
      {isMoreOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm xl:hidden" onClick={() => setIsMoreOpen(false)} />
      ) : null}

      {isMoreOpen ? (
        <section
          aria-label="Todos os módulos"
          className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 max-h-[70dvh] overflow-y-auto rounded-t-3xl border border-white/10 bg-slate-950 p-4 shadow-2xl xl:hidden"
        >
          <div className="mx-auto max-w-lg">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-white">Todos os módulos</p>
                <p className="mt-1 text-xs text-slate-400">Acesse e configure qualquer área do Hubly.</p>
              </div>
              <button
                aria-label="Fechar menu"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-slate-300"
                onClick={() => setIsMoreOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex min-h-16 items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium",
                      isActive
                        ? "border-primary/30 bg-primary/15 text-sky-100"
                        : "border-white/10 bg-white/5 text-slate-300 active:bg-white/10"
                    )}
                    href={item.href as Route}
                    key={item.href}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="min-w-0 break-words">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl xl:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium transition",
                  isActive ? "bg-primary/15 text-sky-200" : "text-slate-400 active:bg-white/5 active:text-white"
                )}
                href={item.href as Route}
                key={item.href}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}
          <button
            aria-expanded={isMoreOpen}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium transition",
              isMoreOpen ? "bg-primary/15 text-sky-200" : "text-slate-400 active:bg-white/5 active:text-white"
            )}
            onClick={() => setIsMoreOpen((current) => !current)}
            type="button"
          >
            <Menu className="h-5 w-5" />
            <span>Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}
