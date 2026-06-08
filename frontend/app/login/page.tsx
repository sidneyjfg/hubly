"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";

import { api } from "@/lib/api";
import { BackButton } from "@/components/app/back-button";
import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDefaultRouteForRole, getDisplayNameFromEmail } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

export default function LoginPage() {
  const router = useRouter();
  const login = useAppStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.signIn({
        email,
        password
      }),
    meta: {
      errorMessage: "Login não realizado",
      successMessage: "Login realizado com sucesso"
    },
    onSuccess: (session) => {
      login(session, email);
      useAppStore.setState((state) => ({
        currentUser: state.currentUser
          ? {
              ...state.currentUser,
              displayName: getDisplayNameFromEmail(email)
            }
          : null
      }));
      router.push(getDefaultRouteForRole(session.role));
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <BackButton className="mb-5 -ml-3" fallbackHref="/" />
        <BrandLogo className="mb-6" showSlogan size="sm" />
        <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Acesso do negócio</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Entrar no painel da empresa</h1>
        <p className="mt-3 text-slate-300">
          Para clínicas, barbearias, salões, estética, studios e profissionais que gerenciam agenda, equipe,
          serviços e presença digital.
        </p>
        <div className="mt-8 space-y-4">
          <Input onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" type="email" value={email} />
          <Input
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha"
            type="password"
            value={password}
          />
          <Button className="w-full" disabled={!email || !password || mutation.isPending} onClick={() => mutation.mutate()}>
            Entrar como negócio
          </Button>
          <p className="text-center text-sm text-slate-400">
            Para clínica, barbearia ou outro negócio local.{" "}
            <Link className="text-sky-300 hover:text-sky-200" href="/signup">
              Criar conta do negócio
            </Link>
          </p>
          <p className="text-center text-sm text-slate-400">
            Quer agendar um serviço?{" "}
            <Link className="text-sky-300 hover:text-sky-200" href="/cliente/login">
              Entrar como cliente final
            </Link>
          </p>
          {mutation.error ? <p className="text-sm text-rose-300">{mutation.error.message}</p> : null}
        </div>
      </Card>
    </main>
  );
}
