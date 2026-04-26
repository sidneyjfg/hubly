"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { UserRole } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-slate-300">
        Validando acesso...
      </div>
    );
  }

  return <>{children}</>;
}

export function RoleGuard({
  allowedRoles,
  children,
  fallbackPath = "/dashboard"
}: {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackPath?: string;
}) {
  const router = useRouter();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const currentUser = useAppStore((state) => state.currentUser);
  const role = currentUser?.role;
  const isAllowed = Boolean(role && allowedRoles.includes(role));

  useEffect(() => {
    if (hasHydrated && role && !isAllowed) {
      router.replace(fallbackPath);
    }
  }, [fallbackPath, hasHydrated, isAllowed, role, router]);

  if (!hasHydrated || !role || !isAllowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-300">
        Validando permissões...
      </div>
    );
  }

  return <>{children}</>;
}
