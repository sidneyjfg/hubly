"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: api.getMe
  });

  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [timezone, setTimezone] = useState("");

  useEffect(() => {
    if (!data) {
      return;
    }

    setLegalName(data.organization.legalName);
    setTradeName(data.organization.tradeName);
    setTimezone(data.organization.timezone);
  }, [data]);

  const isAdministrator = data?.user.role === "administrator";

  const paymentSettingsQuery = useQuery({
    queryKey: ["organization-payment-settings"],
    queryFn: api.getOrganizationPaymentSettings,
    enabled: Boolean(isAdministrator)
  });

  const hasPaymentAccount = Boolean(paymentSettingsQuery.data?.stripeAccountId);

  const paymentStatusQuery = useQuery({
    queryKey: ["organization-stripe-status", paymentSettingsQuery.data?.stripeAccountId],
    queryFn: api.getOrganizationStripeAccountStatus,
    enabled: Boolean(isAdministrator && hasPaymentAccount)
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.updateOrganization(data!.organization.id, {
        legalName,
        tradeName,
        timezone
      }),
    meta: {
      errorMessage: "Configurações não salvas",
      successMessage: "Configurações salvas com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    }
  });

  const identityVerificationMutation = useMutation({
    mutationFn: () => api.createOrganizationStripeOnboardingLink({
      returnUrl: `${window.location.origin}/settings?payments=return`,
      refreshUrl: `${window.location.origin}/settings?payments=refresh`
    }),
    meta: {
      errorMessage: "Verificação de identidade não iniciada"
    },
    onSuccess: (result) => {
      window.location.href = result.onboardingUrl;
    }
  });

  const refreshPaymentStatusMutation = useMutation({
    mutationFn: api.getOrganizationStripeAccountStatus,
    meta: {
      errorMessage: "Status de pagamentos não atualizado",
      successMessage: "Status de pagamentos atualizado"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["organization-payment-settings"] });
      await queryClient.invalidateQueries({ queryKey: ["organization-stripe-status"] });
    }
  });

  const paymentStatus = paymentStatusQuery.data?.status ?? paymentSettingsQuery.data?.stripeAccountStatus ?? "pending";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Configurações</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Dados do negócio</h1>
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            disabled={!isAdministrator}
            onChange={(event) => setTradeName(event.target.value)}
            placeholder="Nome do negócio"
            value={tradeName}
          />
          <Input
            disabled={!isAdministrator}
            onChange={(event) => setLegalName(event.target.value)}
            placeholder="Razão social"
            value={legalName}
          />
          <Input
            className="md:col-span-2"
            disabled={!isAdministrator}
            onChange={(event) => setTimezone(event.target.value)}
            placeholder="Timezone"
            value={timezone}
          />
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button disabled={!isAdministrator || mutation.isPending} onClick={() => mutation.mutate()}>
            Salvar configurações
          </Button>
          {!isAdministrator ? <p className="text-sm text-amber-300">Somente administradores podem editar.</p> : null}
          {mutation.error ? <p className="text-sm text-rose-300">{mutation.error.message}</p> : null}
        </div>
      </Card>

      {isAdministrator ? (
        <Card>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-white">Verificação de identidade</p>
              <p className="text-sm text-slate-400">A verificação abre uma página segura do provedor de pagamentos, cria ou recupera a conta da organização e atualiza pendências.</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button disabled={identityVerificationMutation.isPending} onClick={() => identityVerificationMutation.mutate()} variant="secondary">
              <ExternalLink className="mr-2 h-4 w-4" />
              Verificar identidade
            </Button>
            <Button disabled={!hasPaymentAccount || refreshPaymentStatusMutation.isPending} onClick={() => refreshPaymentStatusMutation.mutate()} variant="ghost">
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar status
            </Button>
          </div>
          {identityVerificationMutation.error ? (
            <div className="mt-4 rounded-lg border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-100">
              {identityVerificationMutation.error.message}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <InfoTile label="Identidade" value={hasPaymentAccount ? "Verificação iniciada" : "Não iniciada"} />
            <InfoTile label="Status" value={formatPaymentStatus(paymentStatus)} />
            <InfoTile label="Pagamentos online" value={paymentStatusQuery.data?.canReceivePayments ? "Ativos" : "Bloqueados"} />
          </div>

          {paymentStatusQuery.data?.blockedReasons.length ? (
            <PendingReasons reasons={paymentStatusQuery.data.blockedReasons} />
          ) : hasPaymentAccount && paymentStatus === "verified" ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
              Conta verificada e apta para receber pagamentos online.
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

function formatPaymentStatus(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pendente",
    restricted: "Com pendências",
    verified: "Verificada"
  };

  return labels[status] ?? status;
}

function formatPendingReason(reason: string): string {
  const labels: Record<string, string> = {
    charges_not_enabled: "Recebimento por cartão ainda não liberado.",
    kyc_details_missing: "Dados de identidade ou negócio incompletos.",
    payouts_not_enabled: "Saques ainda não liberados.",
    requirements_past_due: "Há informações obrigatórias vencidas."
  };

  return labels[reason] ?? reason;
}

function PendingReasons({ reasons }: { reasons: string[] }) {
  return (
    <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
      <div className="flex items-center gap-2 font-medium">
        <AlertCircle className="h-4 w-4" />
        Pendências para ativar pagamentos
      </div>
      <ul className="mt-3 space-y-2">
        {reasons.map((reason) => (
          <li key={reason}>{formatPendingReason(reason)}</li>
        ))}
      </ul>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 break-all text-sm font-medium text-white">{value ?? "-"}</p>
    </div>
  );
}
