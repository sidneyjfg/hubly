"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDisplayNameFromEmail } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

export default function LoginPage() {
  const router = useRouter();
  const login = useAppStore((state) => state.login);
  const [email, setEmail] = useState("admin@clinic.test");
  const [password, setPassword] = useState("password123");

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
      router.push("/dashboard");
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Acesso real</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Entrar no painel</h1>
        <p className="mt-3 text-slate-300">
          Conectado ao backend do Clinity. Use as credenciais seed locais para acessar a clínica de teste.
        </p>
        <div className="mt-8 space-y-4">
          <Input onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" type="email" value={email} />
          <Input
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha"
            type="password"
            value={password}
          />
          <Button className="w-full" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            Entrar no dashboard
          </Button>
          <p className="text-center text-sm text-slate-400">
            Ainda não tem conta?{" "}
            <Link className="text-sky-300 hover:text-sky-200" href="/signup">
              Criar clínica
            </Link>
          </p>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <p className="font-medium text-white">Credenciais seed</p>
            <p className="mt-2">E-mail: `admin@clinic.test`</p>
            <p>Senha: `password123`</p>
          </div>
          {mutation.error ? <p className="text-sm text-rose-300">{mutation.error.message}</p> : null}
        </div>
      </Card>
    </main>
  );
}
