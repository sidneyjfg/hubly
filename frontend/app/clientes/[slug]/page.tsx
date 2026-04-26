"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, Lock, MapPin, ShieldCheck, Stethoscope } from "lucide-react";

import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { addDays, formatDateInput, formatTimeLabel } from "@/lib/utils";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default function CustomerBookingPage({ params }: PageProps) {
  const { slug } = use(params);

  const [providerId, setProviderId] = useState("");
  const [offeringId, setOfferingId] = useState("");
  const [date, setDate] = useState(formatDateInput(addDays(new Date(), 1)));
  const [selectedSlot, setSelectedSlot] = useState<{ startsAt: string; endsAt: string } | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const organizationQuery = useQuery({
    queryKey: ["public-organization", slug],
    queryFn: () => api.getPublicOrganization(slug),
    enabled: Boolean(slug)
  });

  const organization = organizationQuery.data;
  const providers = organization?.providers ?? [];
  const selectedProviderId = providerId || providers[0]?.id || "";
  const services = (organization?.serviceOfferings ?? []).filter((service) => service.providerId === selectedProviderId);
  const selectedOfferingId = offeringId || services[0]?.id || "";

  const availabilityQuery = useQuery({
    queryKey: ["public-availability", slug, selectedProviderId, selectedOfferingId, date],
    queryFn: () =>
      api.getPublicAvailability(slug, {
        providerId: selectedProviderId,
        date,
        offeringId: selectedOfferingId || null
      }),
    enabled: Boolean(slug && selectedProviderId && date)
  });

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedOfferingId) ?? null,
    [selectedOfferingId, services]
  );

  const bookingMutation = useMutation({
    mutationFn: () => {
      if (!selectedSlot) {
        throw new Error("Selecione um horário.");
      }

      return api.createPublicBooking(slug, {
        fullName,
        email: email || null,
        phone,
        password,
        providerId: selectedProviderId,
        offeringId: selectedOfferingId || null,
        startsAt: selectedSlot.startsAt,
        endsAt: selectedSlot.endsAt,
        notes: null,
        paymentType: "presential"
      });
    }
  });

  const canSubmit = Boolean(fullName && email && phone && password.length >= 8 && selectedSlot && selectedProviderId);

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-white/10 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-6 md:px-10">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <BrandLogo showSlogan size="sm" />
            <Link className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white" href="/clientes">
              <ArrowLeft className="h-4 w-4" />
              Voltar para estabelecimentos
            </Link>
          </header>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 md:px-10 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-panel/90">
            <div className="h-64 bg-slate-900">
              {organization?.coverImageUrl ? (
                <img alt={organization.tradeName} className="h-full w-full object-cover" src={organization.coverImageUrl} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Stethoscope className="h-10 w-10 text-slate-500" />
                </div>
              )}
            </div>
            <div className="p-6">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-300">Estabelecimento</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">{organization?.tradeName ?? "Carregando..."}</h1>
              <p className="mt-4 leading-7 text-slate-300">
                {organization?.publicDescription ?? "Escolha um profissional e horário disponível para concluir seu agendamento."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-sky-300" />
                  {[organization?.addressLine, organization?.addressNumber, organization?.city, organization?.state].filter(Boolean).join(", ") || "Endereço a confirmar"}
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Cadastro protegido no final
                </span>
              </div>
            </div>
          </div>

          <Card>
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-emerald-300" />
              <h2 className="text-lg font-semibold text-white">Segurança do cliente</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              A senha é enviada apenas no cadastro final e armazenada no backend como hash. Ela não aparece para a clínica nem retorna nas APIs públicas.
            </p>
          </Card>
        </div>

        <Card>
          {bookingMutation.isSuccess ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
              <h2 className="mt-5 text-2xl font-semibold text-white">Agendamento criado</h2>
              <p className="mt-3 text-slate-300">
                Seu horário foi registrado. A clínica poderá confirmar e enviar lembretes pelos canais disponíveis.
              </p>
              <Link className="mt-6 inline-flex text-sm font-medium text-sky-300 hover:text-sky-200" href="/clientes">
                Ver outros estabelecimentos
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-300">Agendamento</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Escolha seu horário</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-300">
                  Profissional
                  <select
                    className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-primary"
                    onChange={(event) => {
                      setProviderId(event.target.value);
                      setOfferingId("");
                      setSelectedSlot(null);
                    }}
                    value={selectedProviderId}
                  >
                    {providers.map((provider) => (
                      <option className="bg-slate-950" key={provider.id} value={provider.id}>
                        {provider.fullName}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  Serviço
                  <select
                    className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-primary"
                    onChange={(event) => {
                      setOfferingId(event.target.value);
                      setSelectedSlot(null);
                    }}
                    value={selectedOfferingId}
                  >
                    {services.map((service) => (
                      <option className="bg-slate-950" key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="space-y-2 text-sm text-slate-300">
                Data
                <Input
                  onChange={(event) => {
                    setDate(event.target.value);
                    setSelectedSlot(null);
                  }}
                  type="date"
                  value={date}
                />
              </label>

              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Clock className="h-4 w-4 text-sky-300" />
                  Horários disponíveis {selectedService ? `para ${selectedService.name}` : ""}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(availabilityQuery.data?.items ?? []).map((slot) => {
                    const isSelected = selectedSlot?.startsAt === slot.startsAt;

                    return (
                      <button
                        className={`h-11 rounded-lg border text-sm font-medium transition ${
                          isSelected
                            ? "border-sky-300 bg-sky-400/20 text-white"
                            : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                        key={slot.startsAt}
                        onClick={() => setSelectedSlot({ startsAt: slot.startsAt, endsAt: slot.endsAt })}
                        type="button"
                      >
                        {formatTimeLabel(slot.startsAt)}
                      </button>
                    );
                  })}
                </div>
                {availabilityQuery.data?.items.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    Nenhum horário disponível para esta data.
                  </p>
                ) : null}
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-sky-300" />
                  <p className="text-sm font-semibold text-white">Cadastro final do cliente</p>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Input onChange={(event) => setFullName(event.target.value)} placeholder="Nome completo" value={fullName} />
                  <Input onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" type="email" value={email} />
                  <Input onChange={(event) => setPhone(event.target.value)} placeholder="Telefone" value={phone} />
                  <Input onChange={(event) => setPassword(event.target.value)} placeholder="Senha" type="password" value={password} />
                </div>
              </div>

              <Button className="w-full" disabled={!canSubmit || bookingMutation.isPending} onClick={() => bookingMutation.mutate()}>
                Confirmar agendamento
              </Button>
              {bookingMutation.error ? <p className="text-sm text-rose-300">{bookingMutation.error.message}</p> : null}
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
