"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { BackButton } from "@/components/app/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatBrazilianWhatsAppPhone, isValidBrazilianWhatsAppPhone } from "@/lib/phone";
import { getDefaultRouteForRole, getDisplayNameFromEmail } from "@/lib/utils";
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
      successMessage: "Negócio criado com sucesso"
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
      router.push(getDefaultRouteForRole(session.role));
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-2xl">
        <BackButton className="mb-5 -ml-3" fallbackHref="/" />
        <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Acesso do negócio</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Criar conta para clínica, barbearia ou serviço local</h1>
        <p className="mt-3 text-slate-300">
          O cadastro cria o negócio local, o primeiro administrador e o acesso ao painel de agenda, equipe e clientes.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Input onChange={(event) => setFullName(event.target.value)} placeholder="Nome completo" value={fullName} />
          <Input onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" type="email" value={email} />
          <Input
            inputMode="tel"
            maxLength={19}
            onChange={(event) => setPhone(formatBrazilianWhatsAppPhone(event.target.value))}
            placeholder="+55 (11) 90000-0000"
            value={phone}
          />
          <Input
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha"
            type="password"
            value={password}
          />
          <Input onChange={(event) => setTradeName(event.target.value)} placeholder="Nome do negócio" value={tradeName} />
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
            disabled={!fullName || !email || !isValidBrazilianWhatsAppPhone(phone) || !password || !tradeName || !legalName || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Criar negócio
          </Button>
          <p className="text-center text-sm text-slate-400">
            Já possui acesso do negócio?{" "}
            <Link className="text-sky-300 hover:text-sky-200" href="/login">
              Entrar
            </Link>
          </p>
          <p className="text-center text-sm text-slate-400">
            Quer agendar como cliente final?{" "}
            <Link className="text-sky-300 hover:text-sky-200" href="/clientes">
              Ver estabelecimentos
            </Link>
          </p>
          {mutation.error ? <p className="text-sm text-rose-300">{mutation.error.message}</p> : null}
        </div>
      </Card>
    </main>
  );
}
