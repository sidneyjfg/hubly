"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { LockKeyhole } from "lucide-react";

import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { systemAdminApi } from "@/lib/system-admin-api";
import { useSystemAdminStore } from "@/store/system-admin-store";

export default function SystemAdminLoginPage() {
  const router = useRouter();
  const hasHydrated = useSystemAdminStore((state) => state.hasHydrated);
  const isAuthenticated = useSystemAdminStore((state) => state.isAuthenticated);
  const login = useSystemAdminStore((state) => state.login);
  const [email, setEmail] = useState("owner@hubly.local");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace("/dono");
    }
  }, [hasHydrated, isAuthenticated, router]);

  const mutation = useMutation({
    mutationFn: () => systemAdminApi.signIn({ email: email.trim(), password }),
    onSuccess: (session) => {
      login(session);
      router.replace("/dono");
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <Card className="w-full max-w-md">
        <BrandLogo className="mb-6" showSlogan size="sm" />
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-400/15 text-sky-200">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <p className="mt-5 text-sm font-medium uppercase tracking-[0.18em] text-sky-300">Dono do sistema</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Entrar no painel interno</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Este acesso usa token separado do painel dos negócios e não compartilha sessão com administradores de tenant.
        </p>

        <div className="mt-8 space-y-4">
          <Input onChange={(event) => setEmail(event.target.value)} placeholder="E-mail do dono" type="email" value={email} />
          <Input
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha"
            type="password"
            value={password}
          />
          <Button className="w-full" disabled={!email || !password || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Entrando..." : "Entrar como dono"}
          </Button>
          {mutation.error ? <p className="text-sm text-rose-300">{mutation.error.message}</p> : null}
          <p className="text-center text-sm text-slate-400">
            Voltar para{" "}
            <Link className="text-sky-300 hover:text-sky-200" href="/login">
              login do negócio
            </Link>
          </p>
        </div>
      </Card>
    </main>
  );
}
