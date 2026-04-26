"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Menu, Search } from "lucide-react";

import { api } from "@/lib/api";
import { AppVersion } from "@/components/app/app-version";
import { BrandLogo } from "@/components/app/brand-logo";
import { ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/app-store";
import { getDisplayNameFromEmail, getRoleLabel } from "@/lib/utils";

export function AppHeader() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const currentUser = useAppStore((state) => state.currentUser);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);

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
          <ButtonLink href="/account" size="sm" variant="ghost">
            Conta
          </ButtonLink>
          {currentUser?.role === "administrator" ? (
            <ButtonLink href="/admin" size="sm" variant="secondary">
              Admin
            </ButtonLink>
          ) : null}
          <ButtonLink href="/bookings" size="sm" variant="secondary">
            Ver agenda
          </ButtonLink>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-right">
            <p className="text-sm font-medium text-white">{currentUser?.displayName ?? "Usuário"}</p>
            <p className="text-xs text-slate-400">{currentUser ? getRoleLabel(currentUser.role) : "Perfil"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
