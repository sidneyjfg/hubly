"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BriefcaseMedical, CalendarClock, HelpCircle, Pencil, Plus, Power } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableRoot, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import type { Provider, ProviderAvailability, ServiceOffering } from "@/lib/types";

type ProviderFormState = {
  id?: string;
  fullName: string;
  specialty: string;
};

type ServiceFormState = {
  id?: string;
  providerId: string;
  name: string;
  durationMinutes: string;
  price: string;
};

type AvailabilityFormState = {
  weekday: number;
  workStart: string;
  workEnd: string;
  lunchStart: string;
  lunchEnd: string;
  isActive: boolean;
};

const emptyProviderForm: ProviderFormState = {
  fullName: "",
  specialty: ""
};

const emptyServiceForm: ServiceFormState = {
  providerId: "",
  name: "",
  durationMinutes: "60",
  price: ""
};

const PLAN_SERVICE_LIMITS = {
  free: 3,
  pro: 30,
  premium: 100
} as const;

const SERVICE_LIMIT_REGULARIZATION_DAYS = 7;

const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado"
];

const defaultAvailability = (): AvailabilityFormState[] =>
  WEEKDAYS.map((_, weekday) => ({
    weekday,
    workStart: "09:00",
    workEnd: "18:00",
    lunchStart: "",
    lunchEnd: "",
    isActive: weekday >= 1 && weekday <= 5
  }));

function centsFromPrice(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) {
    return null;
  }

  return Math.round(Number(normalized) * 100);
}

function priceFromCents(value?: number | null): string {
  if (value === null || value === undefined) {
    return "";
  }

  return (value / 100).toFixed(2);
}

function addDays(value: string, days: number): string {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function isAvailabilityFormValid(items: AvailabilityFormState[]): boolean {
  return items.some((item) => item.isActive)
    && items.every((item) => {
      if (!item.isActive) return true;
      const hasValidWorkWindow = isValidTime(item.workStart) && isValidTime(item.workEnd) && item.workStart < item.workEnd;
      const hasEmptyLunch = !item.lunchStart && !item.lunchEnd;
      const hasCompleteLunch = Boolean(item.lunchStart && item.lunchEnd)
        && isValidTime(item.lunchStart)
        && isValidTime(item.lunchEnd)
        && item.lunchStart < item.lunchEnd
        && item.workStart <= item.lunchStart
        && item.lunchEnd <= item.workEnd;

      return hasValidWorkWindow && (hasEmptyLunch || hasCompleteLunch);
    });
}

function isValidTime(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function TimeField({
  disabled,
  includeEmpty = false,
  label,
  onChange,
  value
}: {
  disabled?: boolean;
  includeEmpty?: boolean;
  label: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  value: string;
}) {
  return (
    <label className="block text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
      {label}
      <input
        className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm font-semibold text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-45 focus:border-sky-300"
        disabled={disabled}
        inputMode="numeric"
        maxLength={5}
        onChange={onChange}
        placeholder={includeEmpty ? "Opcional" : "09:00"}
        value={value}
      />
      <span className="mt-1 block text-[11px] normal-case tracking-normal text-slate-500">
        {includeEmpty ? "Use HH:MM ou deixe vazio" : "Formato HH:MM"}
      </span>
    </label>
  );
}

export default function ProvidersPage() {
  const [providerPage, setProviderPage] = useState(1);
  const [servicePage, setServicePage] = useState(1);
  const [providerForm, setProviderForm] = useState<ProviderFormState | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceFormState | null>(null);
  const [availabilityProvider, setAvailabilityProvider] = useState<Provider | null>(null);
  const [availabilityForm, setAvailabilityForm] = useState<AvailabilityFormState[]>(defaultAvailability);
  const queryClient = useQueryClient();
  const limit = 10;

  const providersQuery = useQuery({
    queryKey: ["providers-table", providerPage, limit],
    queryFn: () => api.getProviders({ page: providerPage, limit })
  });

  const servicesQuery = useQuery({
    queryKey: ["service-offerings-table", servicePage, limit],
    queryFn: () => api.getServiceOfferings({ page: servicePage, limit })
  });

  const serviceLimitQuery = useQuery({
    queryKey: ["service-offerings-limit-status"],
    queryFn: () => api.getServiceOfferings({ page: 1, limit: 100 })
  });

  const subscriptionQuery = useQuery({
    queryKey: ["organization-subscription"],
    queryFn: api.getOrganizationSubscription
  });

  const availabilityQuery = useQuery({
    enabled: Boolean(availabilityProvider),
    queryKey: ["provider-availability", availabilityProvider?.id],
    queryFn: () => api.getProviderAvailability(availabilityProvider?.id ?? "")
  });

  const providers = providersQuery.data?.items ?? [];
  const services = servicesQuery.data?.items ?? [];
  const activeServiceCount = serviceLimitQuery.data?.items.filter((service) => service.isActive).length ?? 0;
  const currentPlanCode = subscriptionQuery.data?.current.plan.code ?? "free";
  const maxActiveServices = PLAN_SERVICE_LIMITS[currentPlanCode];
  const excessActiveServices = Math.max(0, activeServiceCount - maxActiveServices);
  const serviceLimitRegularizationDate = subscriptionQuery.data?.current.updatedAt
    ? addDays(subscriptionQuery.data.current.updatedAt, SERVICE_LIMIT_REGULARIZATION_DAYS)
    : null;
  const isServiceLimitExceeded = excessActiveServices > 0;
  const isServiceLimitGraceExpired = Boolean(
    isServiceLimitExceeded
    && serviceLimitRegularizationDate
    && new Date(serviceLimitRegularizationDate).getTime() <= Date.now(),
  );

  const providerMutation = useMutation({
    mutationFn: (input: ProviderFormState) => {
      const payload = {
        fullName: input.fullName,
        specialty: input.specialty
      };

      return input.id ? api.updateProvider(input.id, payload) : api.createProvider(payload);
    },
    meta: {
      errorMessage: "Profissional não salvo",
      successMessage: "Profissional salvo com sucesso"
    },
    onSuccess: async () => {
      setProviderForm(null);
      await queryClient.invalidateQueries({ queryKey: ["providers-table"] });
      await queryClient.invalidateQueries({ queryKey: ["schedule"] });
    }
  });

  const providerStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.setProviderStatus(id, isActive),
    meta: {
      errorMessage: "Status do profissional não atualizado",
      successMessage: "Status do profissional atualizado com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["providers-table"] });
    }
  });

  const serviceMutation = useMutation({
    mutationFn: (input: ServiceFormState) => {
      const payload = {
        providerId: input.providerId,
        name: input.name,
        durationMinutes: Number(input.durationMinutes),
        priceCents: centsFromPrice(input.price)
      };

      return input.id ? api.updateServiceOffering(input.id, payload) : api.createServiceOffering(payload);
    },
    meta: {
      errorMessage: "Serviço não salvo",
      successMessage: "Serviço salvo com sucesso"
    },
    onSuccess: async () => {
      setServiceForm(null);
      await queryClient.invalidateQueries({ queryKey: ["service-offerings-table"] });
      await queryClient.invalidateQueries({ queryKey: ["service-offerings-limit-status"] });
      await queryClient.invalidateQueries({ queryKey: ["schedule"] });
    }
  });

  const serviceStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.setServiceOfferingStatus(id, isActive),
    meta: {
      errorMessage: "Status do serviço não atualizado",
      successMessage: "Status do serviço atualizado com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["service-offerings-table"] });
      await queryClient.invalidateQueries({ queryKey: ["service-offerings-limit-status"] });
    }
  });

  const availabilityMutation = useMutation({
    mutationFn: (input: AvailabilityFormState[]) =>
      api.replaceProviderAvailability(
        availabilityProvider?.id ?? "",
        input
          .filter((item) => item.isActive)
          .map((item) => ({
            weekday: item.weekday,
            workStart: item.workStart,
            workEnd: item.workEnd,
            lunchStart: item.lunchStart.trim() || null,
            lunchEnd: item.lunchEnd.trim() || null,
            isActive: item.isActive
          })),
      ),
    meta: {
      errorMessage: "Carga horária não salva",
      successMessage: "Carga horária salva com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["provider-availability"] });
      await queryClient.invalidateQueries({ queryKey: ["storefront-readiness-details"] });
      setAvailabilityProvider(null);
    }
  });

  const openProviderEdit = (provider: Provider) => {
    setProviderForm({
      id: provider.id,
      fullName: provider.fullName,
      specialty: provider.specialty
    });
  };

  const openServiceEdit = (service: ServiceOffering) => {
    setServiceForm({
      id: service.id,
      providerId: service.providerId,
      name: service.name,
      durationMinutes: service.durationMinutes.toString(),
      price: priceFromCents(service.priceCents)
    });
  };

  const openAvailability = (provider: Provider) => {
    setAvailabilityProvider(provider);
    setAvailabilityForm(defaultAvailability());
  };

  const applyAvailability = (items: ProviderAvailability[]) => {
    const byWeekday = new Map(items.map((item) => [item.weekday, item]));
    setAvailabilityForm(
      defaultAvailability().map((item) => {
        const saved = byWeekday.get(item.weekday);
        return saved
          ? {
            weekday: item.weekday,
            workStart: saved.workStart,
            workEnd: saved.workEnd,
            lunchStart: saved.lunchStart ?? "",
            lunchEnd: saved.lunchEnd ?? "",
            isActive: saved.isActive
          }
          : { ...item, isActive: false };
      }),
    );
  };

  useEffect(() => {
    if (availabilityQuery.data) {
      applyAvailability(availabilityQuery.data);
    }
  }, [availabilityProvider?.id, availabilityQuery.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Profissionais</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Equipe e serviços da agenda</h1>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setProviderForm(emptyProviderForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo profissional
          </Button>
          <Button disabled={isServiceLimitExceeded} onClick={() => setServiceForm({ ...emptyServiceForm, providerId: providers[0]?.id ?? "" })} variant="secondary">
            <BriefcaseMedical className="mr-2 h-4 w-4" />
            Novo serviço
          </Button>
        </div>
      </div>

      <Card className="border-sky-300/20 bg-sky-400/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-3">
            <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-sky-200" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-100">Ajuda rapida</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Profissional, servico ou horario nao aparece para o cliente?</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Para liberar agendamento publico, o profissional precisa estar ativo, ter horario salvo e possuir pelo menos um servico ativo com preco.
              </p>
            </div>
          </div>
          <ButtonLink href="/help#providers" variant="secondary">Ver checklist</ButtonLink>
        </div>
      </Card>

      {isServiceLimitExceeded ? (
        <Card className={isServiceLimitGraceExpired ? "border-rose-400/30 bg-rose-400/10" : "border-amber-300/30 bg-amber-300/10"}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-3">
              <div className={isServiceLimitGraceExpired ? "text-rose-300" : "text-amber-200"}>
                <AlertTriangle className="mt-1 h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white">Limite do plano excedido</p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Escolha quais serviços continuam ativos no plano {subscriptionQuery.data?.current.plan.name ?? "atual"}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
                  Seu plano permite {maxActiveServices} serviços ativos e hoje existem {activeServiceCount}. Inative {excessActiveServices} serviço{excessActiveServices === 1 ? "" : "s"} para regularizar. Tudo continua visível no painel, mas novos serviços e reativações ficam bloqueados enquanto a conta estiver acima do limite.
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                  Priorize manter ativos serviços com agendamentos futuros, maior uso ou maior importância na operação.
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                  {isServiceLimitGraceExpired
                    ? "O prazo de regularização venceu. A vitrine não aparece para clientes finais e não recebe agendamentos até você regularizar os serviços ou reativar um plano compatível."
                    : `Se não regularizar até ${serviceLimitRegularizationDate ? formatDateTime(serviceLimitRegularizationDate) : "o fim do prazo"}, a conta ficará inativa para clientes finais: não aparecerá na vitrine pública e não será possível agendar.`}
                </p>
              </div>
            </div>
            <Button onClick={() => setServicePage(1)} variant="secondary">
              Revisar serviços
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="p-0" id="providers-list">
        <Table>
          <TableRoot>
            <TableHead>
              <TableRow>
                <TableCell>Profissional</TableCell>
                <TableCell>Especialidade</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium text-white">{provider.fullName}</TableCell>
                  <TableCell>{provider.specialty}</TableCell>
                  <TableCell>{provider.isActive ? "Ativo" : "Inativo"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => openProviderEdit(provider)} size="sm" variant="secondary">
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button onClick={() => openAvailability(provider)} size="sm" variant="secondary">
                        <CalendarClock className="mr-2 h-4 w-4" />
                        Horários
                      </Button>
                      <Button
                        disabled={providerStatusMutation.isPending}
                        onClick={() => providerStatusMutation.mutate({ id: provider.id, isActive: !provider.isActive })}
                        size="sm"
                        variant="ghost"
                      >
                        <Power className="mr-2 h-4 w-4" />
                        {provider.isActive ? "Inativar" : "Ativar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
        </Table>
      </Card>

      <div className="flex flex-col gap-3 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
        <p>
          Página {providersQuery.data?.page ?? providerPage} de {providersQuery.data?.totalPages ?? 1} - {providersQuery.data?.total ?? 0} profissionais
        </p>
        <div className="flex gap-2">
          <Button disabled={providerPage <= 1} onClick={() => setProviderPage((current) => Math.max(1, current - 1))} variant="secondary">
            Anterior
          </Button>
          <Button disabled={!providersQuery.data || providerPage >= providersQuery.data.totalPages} onClick={() => setProviderPage((current) => current + 1)} variant="secondary">
            Próxima
          </Button>
        </div>
      </div>

      <Card className="p-0" id="services-list">
        <div className="border-b border-white/10 p-5">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Serviços oferecidos</p>
        </div>
        <Table>
          <TableRoot>
            <TableHead>
              <TableRow>
                <TableCell>Serviço</TableCell>
                <TableCell>Profissional</TableCell>
                <TableCell>Duração</TableCell>
                <TableCell>Preço</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium text-white">{service.name}</TableCell>
                  <TableCell>{service.providerName ?? "Profissional"}</TableCell>
                  <TableCell>{service.durationMinutes} min</TableCell>
                  <TableCell>{service.priceCents ? `R$ ${priceFromCents(service.priceCents).replace(".", ",")}` : "Não informado"}</TableCell>
                  <TableCell>{service.isActive ? "Ativo" : "Inativo"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => openServiceEdit(service)} size="sm" variant="secondary">
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        disabled={serviceStatusMutation.isPending}
                        onClick={() => serviceStatusMutation.mutate({ id: service.id, isActive: !service.isActive })}
                        size="sm"
                        variant="ghost"
                      >
                        <Power className="mr-2 h-4 w-4" />
                        {service.isActive ? "Inativar" : "Ativar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
        </Table>
      </Card>

      <div className="flex flex-col gap-3 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
        <p>
          Página {servicesQuery.data?.page ?? servicePage} de {servicesQuery.data?.totalPages ?? 1} - {servicesQuery.data?.total ?? 0} serviços
        </p>
        <div className="flex gap-2">
          <Button disabled={servicePage <= 1} onClick={() => setServicePage((current) => Math.max(1, current - 1))} variant="secondary">
            Anterior
          </Button>
          <Button disabled={!servicesQuery.data || servicePage >= servicesQuery.data.totalPages} onClick={() => setServicePage((current) => current + 1)} variant="secondary">
            Próxima
          </Button>
        </div>
      </div>

      <Modal onClose={() => setProviderForm(null)} open={Boolean(providerForm)} title={providerForm?.id ? "Editar profissional" : "Novo profissional"}>
        {providerForm ? (
          <div className="space-y-4">
            <Input onChange={(event) => setProviderForm({ ...providerForm, fullName: event.target.value })} placeholder="Nome completo" value={providerForm.fullName} />
            <Input onChange={(event) => setProviderForm({ ...providerForm, specialty: event.target.value })} placeholder="Especialidade" value={providerForm.specialty} />
            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={() => setProviderForm(null)} type="button" variant="ghost">Cancelar</Button>
              <Button disabled={!providerForm.fullName || !providerForm.specialty || providerMutation.isPending} onClick={() => providerMutation.mutate(providerForm)} type="button">
                Salvar profissional
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        className="max-h-[90vh] max-w-6xl overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
        onClose={() => setAvailabilityProvider(null)}
        open={Boolean(availabilityProvider)}
        title={`Carga horária${availabilityProvider ? ` - ${availabilityProvider.fullName}` : ""}`}
      >
        {availabilityProvider ? (
          <div className="w-full space-y-6">

            {/* HEADER */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-sky-300">
                    Configuração de agenda
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Horários de atendimento
                  </h2>

                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                    Ative os dias em que o profissional atende e configure
                    expediente e intervalo de almoço.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Dias ativos
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-white">
                      {availabilityForm.filter((item) => item.isActive).length}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Intervalos
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-white">
                      {
                        availabilityForm.filter(
                          (item) =>
                            item.isActive &&
                            item.lunchStart &&
                            item.lunchEnd
                        ).length
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Status
                    </p>

                    <p className="mt-2 text-sm font-semibold text-emerald-300">
                      Agenda ativa
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* DAYS */}
            <div className="space-y-4">
              {availabilityForm.map((item, index) => (
                <div
                  key={item.weekday}
                  className={`rounded-2xl border p-5 transition-all duration-200 ${item.isActive
                      ? "border-white/10 bg-slate-900/70"
                      : "border-white/5 bg-slate-950/40 opacity-60"
                    }`}
                >
                  {/* TOP */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex items-center gap-4">
                      <input
                        checked={item.isActive}
                        className="h-5 w-5 rounded border-white/20 bg-slate-950"
                        onChange={(event) =>
                          setAvailabilityForm((current) =>
                            current.map((availability, currentIndex) =>
                              currentIndex === index
                                ? {
                                  ...availability,
                                  isActive: event.target.checked
                                }
                                : availability
                            )
                          )
                        }
                        type="checkbox"
                      />

                      <div>
                        <p className="text-lg font-semibold text-white">
                          {WEEKDAYS[item.weekday]}
                        </p>

                        <p className="text-sm text-slate-400">
                          {item.isActive
                            ? "Atendimento habilitado"
                            : "Sem atendimento"}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${item.isActive
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-slate-700/40 text-slate-400"
                        }`}
                    >
                      {item.isActive ? "Ativo" : "Inativo"}
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="mt-6 grid gap-6 xl:grid-cols-2">

                    {/* EXPEDIENTE */}
                    <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
                        Expediente
                      </p>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <TimeField
                          disabled={!item.isActive}
                          label="Início"
                          onChange={(event) =>
                            setAvailabilityForm((current) =>
                              current.map((availability, currentIndex) =>
                                currentIndex === index
                                  ? {
                                    ...availability,
                                    workStart: event.target.value
                                  }
                                  : availability
                              )
                            )
                          }
                          value={item.workStart}
                        />

                        <TimeField
                          disabled={!item.isActive}
                          label="Fim"
                          onChange={(event) =>
                            setAvailabilityForm((current) =>
                              current.map((availability, currentIndex) =>
                                currentIndex === index
                                  ? {
                                    ...availability,
                                    workEnd: event.target.value
                                  }
                                  : availability
                              )
                            )
                          }
                          value={item.workEnd}
                        />
                      </div>
                    </div>

                    {/* ALMOÇO */}
                    <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                        Intervalo / almoço
                      </p>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <TimeField
                          disabled={!item.isActive}
                          includeEmpty
                          label="Início"
                          onChange={(event) =>
                            setAvailabilityForm((current) =>
                              current.map((availability, currentIndex) =>
                                currentIndex === index
                                  ? {
                                    ...availability,
                                    lunchStart: event.target.value
                                  }
                                  : availability
                              )
                            )
                          }
                          value={item.lunchStart}
                        />

                        <TimeField
                          disabled={!item.isActive}
                          includeEmpty
                          label="Fim"
                          onChange={(event) =>
                            setAvailabilityForm((current) =>
                              current.map((availability, currentIndex) =>
                                currentIndex === index
                                  ? {
                                    ...availability,
                                    lunchEnd: event.target.value
                                  }
                                  : availability
                              )
                            )
                          }
                          value={item.lunchEnd}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* FOOTER */}
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-white/10 bg-panel/95 pt-5 backdrop-blur">
              <Button
                onClick={() => setAvailabilityProvider(null)}
                type="button"
                variant="ghost"
              >
                Cancelar
              </Button>

              <Button
                disabled={
                  availabilityMutation.isPending ||
                  !isAvailabilityFormValid(availabilityForm)
                }
                onClick={() => availabilityMutation.mutate(availabilityForm)}
                type="button"
              >
                Salvar carga horária
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal onClose={() => setServiceForm(null)} open={Boolean(serviceForm)} title={serviceForm?.id ? "Editar serviço" : "Novo serviço"}>
        {serviceForm ? (
          <div className="space-y-4">
            <label className="block text-sm text-slate-300">
              Profissional
              <select
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-sky-300"
                onChange={(event) => setServiceForm({ ...serviceForm, providerId: event.target.value })}
                value={serviceForm.providerId}
              >
                <option className="bg-slate-950" value="">Selecione</option>
                {providers.filter((provider) => provider.isActive).map((provider) => (
                  <option className="bg-slate-950" key={provider.id} value={provider.id}>{provider.fullName}</option>
                ))}
              </select>
            </label>
            <Input onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })} placeholder="Nome do serviço, ex: Consulta inicial" value={serviceForm.name} />
            <Input min={5} onChange={(event) => setServiceForm({ ...serviceForm, durationMinutes: event.target.value })} placeholder="Duração em minutos" type="number" value={serviceForm.durationMinutes} />
            <Input onChange={(event) => setServiceForm({ ...serviceForm, price: event.target.value })} placeholder="Preço opcional, ex: 180,00" value={serviceForm.price} />
            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={() => setServiceForm(null)} type="button" variant="ghost">Cancelar</Button>
              <Button disabled={!serviceForm.providerId || !serviceForm.name || !serviceForm.durationMinutes || serviceMutation.isPending} onClick={() => serviceMutation.mutate(serviceForm)} type="button">
                Salvar serviço
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
