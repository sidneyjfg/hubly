"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { HelpCircle, LogIn } from "lucide-react";

import { BackButton } from "@/components/app/back-button";
import { BrandLogo } from "@/components/app/brand-logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { saveCustomerSession } from "@/lib/customer-session";
import { HUBLY_SUPPORT_URL } from "@/lib/support";

function CustomerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/cliente";
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");

  const signInMutation = useMutation({
    mutationFn: () => api.signInPublicCustomer({ emailOrPhone, password }),
    onSuccess: (session) => {
      saveCustomerSession(session);
      router.push(nextPath);
    }
  });

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 md:px-10">
          <BrandLogo showSlogan size="sm" />
          <div className="flex flex-wrap items-center gap-3">
            <BackButton fallbackHref="/clientes" />
            <ButtonLink href={HUBLY_SUPPORT_URL} variant="ghost">
              <HelpCircle className="mr-2 h-4 w-4" />
              Ajuda
            </ButtonLink>
            <ButtonLink href="/login" variant="ghost">Acesso do negócio</ButtonLink>
            <ButtonLink href="/clientes" variant="secondary">Ver estabelecimentos</ButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-xl px-6 py-12 md:px-10">
        <Card>
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Acesso do cliente final</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Entrar para agendar serviços</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Use este acesso para encontrar clínicas, barbearias, salões e outros estabelecimentos, além de acompanhar
              seus agendamentos.
            </p>
          </div>
          <div className="space-y-4">
            <Input onChange={(event) => setEmailOrPhone(event.target.value)} placeholder="E-mail ou telefone" value={emailOrPhone} />
            <Input onChange={(event) => setPassword(event.target.value)} placeholder="Senha" type="password" value={password} />
          </div>
          <Button
            className="mt-6 w-full"
            disabled={!emailOrPhone || password.length < 8 || signInMutation.isPending}
            onClick={() => signInMutation.mutate()}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Entrar
          </Button>
          {signInMutation.error ? <p className="mt-4 text-sm text-rose-300">{signInMutation.error.message}</p> : null}
          <p className="mt-6 text-center text-sm text-slate-400">
            Ainda não tem conta?{" "}
            <Link className="font-medium text-sky-300 hover:text-sky-200" href="/cliente/criar-conta">
              Criar conta de cliente
            </Link>
          </p>
        </Card>
      </section>
    </main>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense>
      <CustomerLoginContent />
    </Suspense>
  );
}
