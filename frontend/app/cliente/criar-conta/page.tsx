"use client";

import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { HelpCircle, UserPlus } from "lucide-react";

import { BackButton } from "@/components/app/back-button";
import { BrandLogo } from "@/components/app/brand-logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { saveCustomerSession } from "@/lib/customer-session";
import { formatBrazilianWhatsAppPhone, isValidBrazilianWhatsAppPhone } from "@/lib/phone";
import { HUBLY_SUPPORT_URL } from "@/lib/support";

function CustomerSignUpContent() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const signUpMutation = useMutation({
    mutationFn: () => api.signUpPublicCustomer({
      fullName,
      email: email || null,
      phone,
      password
    }),
    onSuccess: (session) => {
      saveCustomerSession(session);
      router.push("/cliente");
    }
  });

  const canSubmit = Boolean(
    fullName.length >= 3
      && email
      && isValidBrazilianWhatsAppPhone(phone)
      && password.length >= 8,
  );

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
            <ButtonLink href="/cliente/login" variant="secondary">Já tenho conta</ButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-xl px-6 py-12 md:px-10">
        <Card>
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Acesso do cliente final</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Criar conta para agendar</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Esta conta é para clientes finais acompanharem agenda, histórico e avaliações.
            </p>
          </div>

          <div className="space-y-4">
            <Input onChange={(event) => setFullName(event.target.value)} placeholder="Nome completo" value={fullName} />
            <Input onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" type="email" value={email} />
            <Input
              inputMode="tel"
              maxLength={19}
              onChange={(event) => setPhone(formatBrazilianWhatsAppPhone(event.target.value))}
              placeholder="+55 (11) 90000-0000"
              value={phone}
            />
            <Input onChange={(event) => setPassword(event.target.value)} placeholder="Senha" type="password" value={password} />
          </div>

          <Button className="mt-6 w-full" disabled={!canSubmit || signUpMutation.isPending} onClick={() => signUpMutation.mutate()}>
            <UserPlus className="mr-2 h-4 w-4" />
            Criar conta
          </Button>
          {signUpMutation.error ? <p className="mt-4 text-sm text-rose-300">{signUpMutation.error.message}</p> : null}
        </Card>
      </section>
    </main>
  );
}

export default function CustomerSignUpPage() {
  return (
    <Suspense>
      <CustomerSignUpContent />
    </Suspense>
  );
}
