"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, MapPin, Search, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";

import { BackButton } from "@/components/app/back-button";
import { BrandLogo } from "@/components/app/brand-logo";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { getCustomerSession } from "@/lib/customer-session";

function normalizeSearchValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function CustomerDiscoveryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    const session = getCustomerSession();
    setCustomerName(session?.customer.fullName ?? "");
  }, []);
  const organizationsQuery = useQuery({
    queryKey: ["public-organizations"],
    queryFn: api.listPublicOrganizations
  });

  const organizations = organizationsQuery.data?.items ?? [];
  const normalizedSearchTerm = normalizeSearchValue(searchTerm);
  const filteredOrganizations = normalizedSearchTerm
    ? organizations.filter((organization) => {
        const searchableText = normalizeSearchValue([
          organization.tradeName,
          organization.publicDescription,
          organization.city,
          organization.district,
          organization.state,
          ...organization.providers.map((provider) => provider.specialty),
          ...organization.serviceOfferings.map((service) => service.name)
        ].filter(Boolean).join(" "));

        return searchableText.includes(normalizedSearchTerm);
      })
    : organizations;

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-white/10 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-6 md:px-10">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <BrandLogo showSlogan size="sm" />
            <div className="flex flex-wrap gap-3">
              <BackButton fallbackHref="/" />
              <ButtonLink href="/signup" variant="secondary">
                Sou clínica ou barbearia
              </ButtonLink>
              {customerName ? (
                <ButtonLink href="/cliente">
                  Minha conta
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink href="/cliente/login" variant="secondary">
                    Conectar conta
                  </ButtonLink>
                  <ButtonLink href="/cliente/criar-conta">
                    Criar conta
                  </ButtonLink>
                </>
              )}
            </div>
          </header>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:px-10 xl:grid-cols-[0.9fr_1.4fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-300">Acesso do cliente final</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Encontre um estabelecimento e agende com segurança.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            Escolha o negócio, profissional, serviço e horário. Ao entrar como cliente, seus dados de perfil são reaproveitados no agendamento e no histórico.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {customerName ? (
              <ButtonLink href="/cliente">Abrir perfil de {customerName}</ButtonLink>
            ) : (
              <>
                <ButtonLink href="/cliente/criar-conta">Criar conta de cliente</ButtonLink>
                <ButtonLink href="/cliente/login" variant="secondary">Já tenho conta</ButtonLink>
              </>
            )}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <Search className="h-5 w-5 text-sky-300" />
              <p className="mt-3 text-sm font-medium text-white">Buscar</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <CalendarDays className="h-5 w-5 text-sky-300" />
              <p className="mt-3 text-sm font-medium text-white">Agendar</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              <p className="mt-3 text-sm font-medium text-white">Cadastrar</p>
            </div>
          </div>
        </div>

        <Card className="h-fit">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-sky-300" />
            <h2 className="text-xl font-semibold text-white">Estabelecimentos disponíveis</h2>
          </div>
          <Input
            className="mt-5"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por negócio, cidade ou serviço"
            value={searchTerm}
          />
          <div className="mt-5 grid gap-4">
            {filteredOrganizations.map((organization) => (
              <Link
                className="grid overflow-hidden rounded-lg border border-white/10 bg-white/5 transition hover:border-sky-300/40 hover:bg-white/8 md:grid-cols-[180px_1fr]"
                href={`/clientes/${organization.bookingPageSlug}`}
                key={organization.organizationId}
              >
                <div className="h-44 bg-slate-900 md:h-full">
                  {organization.coverImageUrl ? (
                    <img
                      alt={organization.tradeName}
                      className="h-full w-full object-cover"
                      src={organization.coverImageUrl}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Stethoscope className="h-8 w-8 text-slate-500" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">{organization.tradeName}</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                        {organization.publicDescription ?? "Estabelecimento com agenda online pela Hubly."}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-sky-300" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-sky-300" />
                      {[organization.city, organization.state].filter(Boolean).join(" - ") || "Local a confirmar"}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-sky-300" />
                      {organization.providers.length} profissionais
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {organizations.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                Nenhum estabelecimento publicado no momento.
              </div>
            ) : null}
            {organizations.length > 0 && filteredOrganizations.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                Nenhum estabelecimento encontrado para essa busca.
              </div>
            ) : null}
          </div>
        </Card>
      </section>
    </main>
  );
}
