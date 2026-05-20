"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, Crown, ExternalLink, Sparkles } from "lucide-react";

import { api } from "@/lib/api";
import type { BillingPlan, OrganizationSubscription } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const planFeatures: Record<BillingPlan["code"], string[]> = {
  free: [
    "1 profissional ativo",
    "50 clientes ativos",
    "30 agendamentos por mês",
    "Perfil público básico",
    "1 foto na vitrine",
    "Ideal para testar o Hubly antes de assinar"
  ],
  pro: [
    "Até 5 profissionais ativos",
    "Até 1.000 clientes ativos",
    "Agendamentos sem limite mensal",
    "Perfil público completo com galeria",
    "Lembretes por WhatsApp",
    "Clientes, histórico e métricas simples"
  ],
  premium: [
    "Tudo do Pro",
    "Até 15 profissionais ativos",
    "Clientes sem limite prático",
    "Configuração de promoções",
    "Programa de fidelidade por WhatsApp"
  ]
};

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const subscriptionQuery = useQuery({
    queryKey: ["organization-subscription"],
    queryFn: api.getOrganizationSubscription
  });

  const checkoutMutation = useMutation({
    mutationFn: api.createSubscriptionCheckout,
    meta: {
      errorMessage: "Plano não atualizado",
      successMessage: "Redirecionando para confirmação do plano"
    },
    onSuccess: async (response) => {
      if (response.checkoutUrl) {
        window.location.assign(response.checkoutUrl);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["organization-subscription"] });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: api.cancelOrganizationSubscription,
    meta: {
      errorMessage: "Assinatura não cancelada",
      successMessage: "Assinatura cancelada"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["organization-subscription"] });
    }
  });

  const customerPortalMutation = useMutation({
    mutationFn: api.createSubscriptionCustomerPortal,
    meta: {
      errorMessage: "Portal de assinatura não aberto",
      successMessage: "Redirecionando para o portal da assinatura"
    },
    onSuccess: (response) => {
      window.location.assign(response.portalUrl);
    }
  });

  const current = subscriptionQuery.data?.current ?? null;
  const plans = subscriptionQuery.data?.plans ?? [];
  const canUseCustomerPortal = Boolean(current?.stripeCustomerId);
  const isMutatingSubscription = checkoutMutation.isPending || cancelMutation.isPending || customerPortalMutation.isPending;
  const cancellationDate = current?.cancelAtPeriodEnd && current.currentPeriodEnd
    ? formatDate(current.currentPeriodEnd)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Assinatura</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Plano Hubly</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Controle o plano do negócio, veja o status da assinatura e evolua para mais recursos quando fizer sentido.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryTile icon={Crown} label="Plano atual" value={current?.plan.name ?? "..."} />
        <SummaryTile icon={CheckCircle2} label="Status" value={cancellationDate ? "Cancela no fim do ciclo" : current ? formatSubscriptionStatus(current.status) : "..."} />
        <SummaryTile icon={CreditCard} label="Cobrança" value={current?.plan.code === "free" ? "Sem cobrança" : "Mensal"} />
      </section>

      {current ? (
        <Card className="border-sky-400/20 bg-sky-400/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-200">Plano ativo</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {current.plan.name} por {formatCurrency(current.plan.amountCents, current.plan.currency)}/mês
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {cancellationDate
                  ? `Assinatura paga até ${cancellationDate}. Depois disso, o plano volta para o gratuito.`
                  : current.plan.code === "free"
                  ? "Plano gratuito sem cobrança recorrente."
                  : "Assinatura mensal recorrente."}
              </p>
            </div>
            <span className="rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300">
              {formatSubscriptionStatus(current.status)}
            </span>
            {canUseCustomerPortal ? (
              <Button disabled={customerPortalMutation.isPending} onClick={() => customerPortalMutation.mutate()} variant="secondary">
                <ExternalLink className="mr-2 h-4 w-4" />
                Gerenciar assinatura
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        {plans.map((plan) => {
          const isCurrent = current?.plan.code === plan.code;
          const isUpgrade = current ? plan.amountCents > current.plan.amountCents : false;
          const isScheduledFreeDowngrade = plan.code === "free" && Boolean(current?.cancelAtPeriodEnd);

          return (
            <Card className={isCurrent ? "border-sky-400/30 bg-sky-400/10" : undefined} key={plan.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-sky-300">{plan.code}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{plan.name}</h2>
                </div>
                {isCurrent ? (
                  <span className="rounded-full bg-sky-300 px-3 py-1 text-xs font-semibold text-slate-950">
                    Atual
                  </span>
                ) : null}
              </div>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-semibold text-white">{formatCurrency(plan.amountCents, plan.currency)}</span>
                <span className="pb-1 text-sm text-slate-400">/mês</span>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                {(planFeatures[plan.code] ?? []).map((feature) => (
                  <li className="flex gap-2" key={feature}>
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-6 w-full"
                disabled={isCurrent || isScheduledFreeDowngrade || isMutatingSubscription}
                onClick={() => {
                  if (plan.code === "free" && current?.plan.code !== "free") {
                    if (canUseCustomerPortal) {
                      customerPortalMutation.mutate();
                      return;
                    }

                    cancelMutation.mutate();
                    return;
                  }

                  checkoutMutation.mutate({ planCode: plan.code });
                }}
                variant={isCurrent ? "secondary" : "primary"}
              >
                {isCurrent ? "Plano atual" : isScheduledFreeDowngrade ? "Cancelamento agendado" : plan.code === "free" ? "Cancelar no portal" : isUpgrade ? "Assinar e evoluir" : "Alterar assinatura"}
                {!isCurrent ? plan.code === "free" && canUseCustomerPortal ? <ExternalLink className="ml-2 h-4 w-4" /> : <Sparkles className="ml-2 h-4 w-4" /> : null}
              </Button>
            </Card>
          );
        })}
      </section>

      {subscriptionQuery.error ? <p className="text-sm text-rose-300">{subscriptionQuery.error.message}</p> : null}
      {checkoutMutation.error ? <p className="text-sm text-rose-300">{checkoutMutation.error.message}</p> : null}
      {cancelMutation.error ? <p className="text-sm text-rose-300">{cancelMutation.error.message}</p> : null}
      {customerPortalMutation.error ? <p className="text-sm text-rose-300">{customerPortalMutation.error.message}</p> : null}
    </div>
  );
}

function SummaryTile({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-1 text-lg font-semibold text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function formatCurrency(cents = 0, currency = "brl"): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function formatSubscriptionStatus(status: OrganizationSubscription["status"]): string {
  const labels: Record<OrganizationSubscription["status"], string> = {
    active: "Ativa",
    canceled: "Cancelada",
    incomplete: "Pagamento pendente",
    incomplete_expired: "Checkout expirado",
    past_due: "Pagamento pendente",
    paused: "Pausada",
    trialing: "Teste grátis",
    unpaid: "Inadimplente"
  };

  return labels[status];
}
