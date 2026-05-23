"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";

import { BrandLogo } from "@/components/app/brand-logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { saveCustomerSession } from "@/lib/customer-session";
import { formatBrazilianWhatsAppPhone, isValidBrazilianWhatsAppPhone } from "@/lib/phone";

export default function CustomerSignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("estabelecimento") ?? "";
  const [slug, setSlug] = useState(initialSlug);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const organizationsQuery = useQuery({
    queryKey: ["public-organizations"],
    queryFn: api.listPublicOrganizations
  });

  const organizations = useMemo(() => organizationsQuery.data?.items ?? [], [organizationsQuery.data?.items]);
  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.bookingPageSlug === slug) ?? null,
    [organizations, slug]
  );

  const signUpMutation = useMutation({
    mutationFn: () => api.signUpPublicCustomer({
      slug,
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
    slug
      && fullName.length >= 3
      && email
      && isValidBrazilianWhatsAppPhone(phone)
      && password.length >= 8,
  );

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 md:px-10">
          <BrandLogo showSlogan size="sm" />
          <ButtonLink href="/cliente/login" variant="ghost">Já tenho conta</ButtonLink>
        </div>
      </section>

      <section className="mx-auto max-w-xl px-6 py-12 md:px-10">
        <Card>
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Cliente</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Criar conta</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Sua conta é vinculada ao estabelecimento escolhido e passa a aparecer no painel da organização.
            </p>
          </div>

          <label className="space-y-2 text-sm text-slate-300">
            Estabelecimento
            <select
              className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-primary"
              onChange={(event) => setSlug(event.target.value)}
              value={slug}
            >
              <option className="bg-slate-950" value="">Selecione</option>
              {organizations.map((organization) => (
                <option className="bg-slate-950" key={organization.organizationId} value={organization.bookingPageSlug}>
                  {organization.tradeName}
                </option>
              ))}
            </select>
          </label>

          {selectedOrganization ? (
            <p className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
              Conta vinculada a {selectedOrganization.tradeName}. Depois você poderá ver este local no seu histórico.
            </p>
          ) : null}

          <div className="mt-5 space-y-4">
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
