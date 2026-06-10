"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CalendarDays, ChevronDown, Crown, HelpCircle, LogOut, Menu, Search, Settings, UserCircle2 } from "lucide-react";

import { api } from "@/lib/api";
import { AppVersion } from "@/components/app/app-version";
import { BrandLogo } from "@/components/app/brand-logo";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/app-store";
import { cn, getDisplayNameFromEmail, getRoleLabel } from "@/lib/utils";
import { HUBLY_SUPPORT_URL } from "@/lib/support";

export function AppHeader() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const currentUser = useAppStore((state) => state.currentUser);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const logout = useAppStore((state) => state.logout);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: api.getMe,
    enabled: isAuthenticated
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    setCurrentUser({
      id: data.user.id,
      actorId: data.user.id,
      organizationId: data.user.organizationId,
      email: data.user.email,
      fullName: data.user.fullName,
      phone: data.user.phone,
      displayName: data.user.fullName || getDisplayNameFromEmail(data.user.email),
      role: data.user.role
    });
  }, [data, setCurrentUser]);

  useEffect(() => {
    function closeProfileMenu(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", closeProfileMenu);

    return () => {
      document.removeEventListener("mousedown", closeProfileMenu);
    };
  }, []);

  const isAdministrator = currentUser?.role === "administrator";

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/75 px-4 py-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-4">
        <Link className="flex items-center gap-3 xl:hidden" href="/">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-white">
            <Menu className="h-4 w-4" />
          </div>
          <BrandLogo compact size="sm" />
        </Link>
        <div className="relative hidden max-w-sm flex-1 md:block">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <Input className="pl-10" placeholder="Buscar paciente, consulta ou profissional" />
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden lg:block">
            <AppVersion />
          </div>
          <a
            className="hidden h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white sm:inline-flex"
            href={HUBLY_SUPPORT_URL}
            rel="noreferrer"
            target="_blank"
          >
            <HelpCircle className="h-4 w-4" />
            Ajuda
          </a>
          <div className="relative" ref={profileMenuRef}>
            <button
              aria-expanded={isProfileOpen}
              aria-haspopup="menu"
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10"
              onClick={() => setIsProfileOpen((current) => !current)}
              type="button"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
                <UserCircle2 className="h-5 w-5" />
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="max-w-40 truncate text-sm font-medium text-white">{currentUser?.displayName ?? "Usuário"}</p>
                <p className="text-xs text-slate-400">{currentUser ? getRoleLabel(currentUser.role) : "Perfil"}</p>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-slate-400 transition", isProfileOpen && "rotate-180")} />
            </button>

            {isProfileOpen ? (
              <div
                className="absolute right-0 mt-2 w-64 rounded-lg border border-white/10 bg-slate-950 p-2 shadow-2xl shadow-black/30"
                role="menu"
              >
                <div className="border-b border-white/10 px-3 py-3">
                  <p className="truncate text-sm font-medium text-white">{currentUser?.displayName ?? "Usuário"}</p>
                  <p className="truncate text-xs text-slate-400">{currentUser?.email ?? "Conta"}</p>
                </div>
                <ProfileMenuLink href="/account" icon={UserCircle2} label="Conta" />
                {isAdministrator ? <ProfileMenuLink href="/settings" icon={Settings} label="Configurações" /> : null}
                {isAdministrator ? <ProfileMenuLink href="/admin" icon={Crown} label="Admin" /> : null}
                <ProfileMenuLink href="/bookings" icon={CalendarDays} label="Agenda" />
                <a
                  className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                  href={HUBLY_SUPPORT_URL}
                  rel="noreferrer"
                  role="menuitem"
                  target="_blank"
                >
                  <HelpCircle className="h-4 w-4" />
                  Ajuda e suporte
                </a>
                <button
                  className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-400/10 hover:text-rose-100"
                  onClick={logout}
                  role="menuitem"
                  type="button"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function ProfileMenuLink({
  href,
  icon: Icon,
  label
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
      href={href}
      role="menuitem"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
