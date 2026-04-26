"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDisplayNameFromEmail } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

export default function SignUpPage() {
  const router = useRouter();
  const login = useAppStore((state) => state.login);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");

  const mutation = useMutation({
    mutationFn: () =>
      api.signUp({
        fullName,
        email,
        phone,
        password,
        organization: {
          legalName,
          tradeName,
          timezone
        }
      }),
    meta: {
      errorMessage: "Cadastro não concluído",
      successMessage: "Clínica criada com sucesso"
    },
    onSuccess: (session) => {
      login(session, email);
      setCurrentUser({
        id: session.actorId,
        actorId: session.actorId,
        organizationId: session.organizationId,
        email,
        fullName,
        phone,
        displayName: fullName || getDisplayNameFromEmail(email),
        role: session.role
      });
      router.push("/dashboard");
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-2xl">
        <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Cadastro completo</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Criar conta e clínica</h1>
        <p className="mt-3 text-slate-300">
          O cadastro já cria a clínica, o primeiro administrador e a sessão autenticada.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Input onChange={(event) => setFullName(event.target.value)} placeholder="Nome completo" value={fullName} />
          <Input onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" type="email" value={email} />
          <Input onChange={(event) => setPhone(event.target.value)} placeholder="Telefone" value={phone} />
          <Input
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha"
            type="password"
            value={password}
          />
          <Input onChange={(event) => setTradeName(event.target.value)} placeholder="Nome da clínica" value={tradeName} />
          <Input onChange={(event) => setLegalName(event.target.value)} placeholder="Razão social" value={legalName} />
          <Input
            className="md:col-span-2"
            onChange={(event) => setTimezone(event.target.value)}
            placeholder="Timezone"
            value={timezone}
          />
        </div>
        <div className="mt-8 flex flex-col gap-4">
          <Button
            className="w-full"
            disabled={!fullName || !email || !phone || !password || !tradeName || !legalName || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Criar clínica
          </Button>
          <p className="text-center text-sm text-slate-400">
            Já possui acesso?{" "}
            <Link className="text-sky-300 hover:text-sky-200" href="/login">
              Entrar
            </Link>
          </p>
          {mutation.error ? <p className="text-sm text-rose-300">{mutation.error.message}</p> : null}
        </div>
      </Card>
    </main>
  );
}
