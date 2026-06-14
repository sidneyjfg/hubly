"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck2, Gift, HelpCircle, Plus, RefreshCw, Send, Trash2 } from "lucide-react";

import { api } from "@/lib/api";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

type WhatsAppStatusView = {
  tone: "success" | "warning" | "danger" | "neutral";
  title: string;
  description: string;
  isConnected: boolean;
};

type AutomationTab = "reminders" | "booking-events" | "relationship";

type CampaignType = "promotion" | "loyalty";

type CampaignChannel = "whatsapp";

type BookingEventNotificationType = "created" | "confirmed" | "rescheduled" | "cancelled";

type BookingEventNotificationRule = {
  event: BookingEventNotificationType;
  isEnabled: boolean;
};

type RelationshipCampaign = {
  id: string;
  title: string;
  type: CampaignType;
  audience: string;
  triggerDaysAfterLastBooking: number;
  message: string;
  channels: CampaignChannel[];
  isEnabled: boolean;
};

type CampaignDraft = Omit<RelationshipCampaign, "id" | "isEnabled">;

function getWhatsAppStatusView(input: {
  backendEnabled?: boolean;
  state?: string | null;
  statusChecked: boolean;
}): WhatsAppStatusView {
  if (input.backendEnabled === false) {
    return {
      tone: "danger",
      title: "WhatsApp desativado",
      description: "A integração está desligada nas configurações do backend.",
      isConnected: false
    };
  }

  if (!input.statusChecked) {
    return {
      tone: "warning",
      title: "Não foi possível verificar",
      description: "Não conseguimos confirmar agora se o WhatsApp está funcionando.",
      isConnected: false
    };
  }

  const state = input.state?.toLowerCase();

  if (state === "open" || state === "connected") {
    return {
      tone: "success",
      title: "Conectado e funcionando",
      description: "O WhatsApp está conectado e pronto para enviar lembretes.",
      isConnected: true
    };
  }

  if (state === "connecting") {
    return {
      tone: "warning",
      title: "Conectando",
      description: "A conexão está em andamento. Aguarde alguns instantes e verifique novamente.",
      isConnected: false
    };
  }

  if (state === "close" || state === "closed" || state === "disconnected") {
    return {
      tone: "danger",
      title: "Desconectado",
      description: "O WhatsApp não está conectado. Gere um código e faça o pareamento novamente.",
      isConnected: false
    };
  }

  return {
    tone: "neutral",
    title: "Status pendente",
    description: "Ainda não há uma conexão ativa confirmada para o WhatsApp.",
    isConnected: false
  };
}

function getStatusClasses(tone: WhatsAppStatusView["tone"]): string {
  const classes = {
    success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    warning: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    danger: "border-rose-400/25 bg-rose-400/10 text-rose-200",
    neutral: "border-white/10 bg-white/5 text-slate-300"
  };

  return classes[tone];
}

function normalizePhoneNumber(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizeQrCodeImage(value?: string): string | null {
  if (!value) {
    return null;
  }

  if (value.startsWith("data:image/")) {
    return value;
  }

  return `data:image/png;base64,${value}`;
}

export default function AutomationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AutomationTab>("reminders");
  const [helpOpen, setHelpOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("5511999999999");
  const [newReminderHours, setNewReminderHours] = useState("24");
  const [campaignDraft, setCampaignDraft] = useState<CampaignDraft>({
    title: "Retorno de consulta",
    type: "promotion",
    audience: "Todos os clientes ativos",
    triggerDaysAfterLastBooking: 30,
    message: "Ola, faz um tempo desde seu ultimo atendimento. Temos horarios disponiveis para remarcar sua consulta.",
    channels: ["whatsapp"]
  });
  const [relationshipEnabled, setRelationshipEnabled] = useState(true);
  const [campaigns, setCampaigns] = useState<RelationshipCampaign[]>([
    {
      id: crypto.randomUUID(),
      title: "Lembrete de retorno",
      type: "promotion",
      audience: "Clientes sem retorno marcado",
      triggerDaysAfterLastBooking: 30,
      message: "Ola, podemos te ajudar a remarcar seu proximo atendimento?",
      channels: ["whatsapp"],
      isEnabled: true
    }
  ]);
  const [localState, setLocalState] = useState({
    isEnabled: false,
    reminders: [] as number[]
  });
  const [bookingEventState, setBookingEventState] = useState({
    isEnabled: false,
    events: [
      { event: "created", isEnabled: true },
      { event: "confirmed", isEnabled: true },
      { event: "rescheduled", isEnabled: true },
      { event: "cancelled", isEnabled: true }
    ] as BookingEventNotificationRule[]
  });

  const { data, refetch: refetchAutomationSettings, isFetching: isFetchingAutomationSettings } = useQuery({
    queryKey: ["automation-settings"],
    queryFn: async () => {
      const [settings, bookingEventSettings, relationshipSettings, integrations, status] = await Promise.all([
        api.getWhatsAppSettings(),
        api.getBookingEventSettings(),
        api.getRelationshipSettings(),
        api.listIntegrations(),
        api.getWhatsAppStatus().catch(() => null)
      ]);

      return {
        settings,
        bookingEventSettings,
        relationshipSettings,
        integrations: integrations.items,
        status
      };
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      return api.updateWhatsAppSettings({
        isEnabled: localState.isEnabled,
        reminders: localState.reminders
          .slice()
          .sort((left, right) => right - left)
          .map((hoursBefore) => ({ hoursBefore }))
      });
    },
    meta: {
      errorMessage: "Regras não salvas",
      successMessage: "Regras salvas com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["automation-settings"] });
    }
  });

  const saveBookingEventMutation = useMutation({
    mutationFn: () => api.updateBookingEventSettings({
      organizationId: data?.bookingEventSettings.organizationId ?? "",
      channel: "booking_events",
      isEnabled: bookingEventState.isEnabled,
      events: bookingEventState.events
    }),
    meta: {
      errorMessage: "Notificações de agendamento não salvas",
      successMessage: "Notificações de agendamento salvas com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["automation-settings"] });
    }
  });


  const sessionMutation = useMutation({
    mutationFn: () => api.startWhatsAppSession(normalizePhoneNumber(phoneNumber)),
    meta: {
      errorMessage: "Código não gerado",
      successMessage: "Código gerado com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["automation-settings"] });
    }
  });

  const regenerateCodeMutation = useMutation({
    mutationFn: () => api.regenerateWhatsAppCode(normalizePhoneNumber(phoneNumber)),
    meta: {
      errorMessage: "Código não regenerado",
      successMessage: "Novo código gerado com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["automation-settings"] });
    }
  });

  const processMutation = useMutation({
    mutationFn: () => api.processDueWhatsApp(25),
    meta: {
      errorMessage: "Lembretes não processados",
      successMessage: "Lembretes processados com sucesso"
    }
  });

  const saveRelationshipMutation = useMutation({
    mutationFn: () => api.updateRelationshipSettings({
      isEnabled: relationshipEnabled,
      campaigns
    }),
    meta: {
      errorMessage: "Automações de relacionamento não salvas",
      successMessage: "Automações de relacionamento salvas com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["automation-settings"] });
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: api.disconnectWhatsApp,
    meta: {
      errorMessage: "WhatsApp não desconectado",
      successMessage: "WhatsApp desconectado com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["automation-settings"] });
    }
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    const reminderHours = new Set(data.settings.reminders.map((item) => item.hoursBefore));
    setLocalState({
      isEnabled: data.settings.isEnabled,
      reminders: Array.from(reminderHours).sort((left, right) => right - left)
    });
    setRelationshipEnabled(data.relationshipSettings.isEnabled);
    setBookingEventState({
      isEnabled: data.bookingEventSettings.isEnabled,
      events: data.bookingEventSettings.events
    });
    if (data.relationshipSettings.campaigns.length > 0) {
      setCampaigns(data.relationshipSettings.campaigns);
    }
  }, [data]);

  function addReminderRule(): void {
    const hoursBefore = Number(newReminderHours);

    if (!Number.isInteger(hoursBefore) || hoursBefore < 1 || hoursBefore > 720) {
      return;
    }

    setLocalState((state) => ({
      ...state,
      reminders: Array.from(new Set([...state.reminders, hoursBefore])).sort((left, right) => right - left)
    }));
    setNewReminderHours("");
  }

  function removeReminderRule(hoursBefore: number): void {
    setLocalState((state) => ({
      ...state,
      reminders: state.reminders.filter((item) => item !== hoursBefore)
    }));
  }

  function toggleBookingEvent(eventType: BookingEventNotificationType): void {
    setBookingEventState((state) => ({
      ...state,
      events: state.events.map((item) => (
        item.event === eventType ? { ...item, isEnabled: !item.isEnabled } : item
      ))
    }));
  }

  function createCampaign(): void {
    if (!campaignDraft.title.trim() || !campaignDraft.message.trim() || campaignDraft.channels.length === 0) {
      return;
    }

    setCampaigns((items) => [
      {
        ...campaignDraft,
        id: crypto.randomUUID(),
        isEnabled: true,
        title: campaignDraft.title.trim(),
        message: campaignDraft.message.trim()
      },
      ...items
    ]);
  }

  function toggleCampaignChannel(channel: CampaignChannel): void {
    setCampaignDraft((draft) => {
      const channels = draft.channels.includes(channel)
        ? draft.channels.filter((item) => item !== channel)
        : [...draft.channels, channel];

      return {
        ...draft,
        channels
      };
    });
  }

  function toggleCampaignStatus(campaignId: string): void {
    setCampaigns((items) =>
      items.map((item) => item.id === campaignId ? { ...item, isEnabled: !item.isEnabled } : item)
    );
  }

  function removeCampaign(campaignId: string): void {
    setCampaigns((items) => items.filter((item) => item.id !== campaignId));
  }

  const integration = data?.integrations[0];
  const latestSessionResult = regenerateCodeMutation.data ?? sessionMutation.data;
  const qrCodeImage = normalizeQrCodeImage(latestSessionResult?.qrCode);
  const isCodeRequestPending = sessionMutation.isPending || regenerateCodeMutation.isPending;
  const connectedPhoneNumber = data?.status?.phoneNumber ?? integration?.phoneNumber ?? latestSessionResult?.phoneNumber;
  const statusView = getWhatsAppStatusView({
    backendEnabled: integration?.enabled,
    state: data?.status?.state ?? integration?.status,
    statusChecked: Boolean(data?.status)
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Automações</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Playbooks operacionais</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Configure mensagens automáticas para reduzir faltas, lembrar clientes e estimular retorno sem adicionar tarefas manuais à recepção.
          </p>
        </div>
        <Button onClick={() => setHelpOpen(true)} variant="secondary">
          <HelpCircle className="mr-2 h-4 w-4" />
          Ajuda
        </Button>
      </div>

      <Modal onClose={() => setHelpOpen(false)} open={helpOpen} title="Como funcionam as automações">
        <div className="space-y-5 text-sm leading-6 text-slate-300">
          <div>
            <p className="font-semibold text-white">Lembretes de agendamento</p>
            <p className="mt-2">
              São disparos antes do horário marcado. Cada regra define quantas horas antes o WhatsApp deve avisar o cliente, por exemplo 24h e 2h antes.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Automações de relacionamento</p>
            <p className="mt-2">
              São campanhas baseadas no histórico do cliente. O gatilho atual usa dias após o último agendamento para chamar clientes de volta, divulgar promoções ou reforçar fidelidade.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Criação e salvamento</p>
            <p className="mt-2">
              Primeiro você preenche a campanha e clica em Criar automação. Depois revise a lista, ative ou pause campanhas e clique em Salvar relacionamento para persistir as regras.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Pré-requisitos</p>
            <p className="mt-2">
              O WhatsApp precisa estar conectado e o plano precisa permitir o recurso. As mensagens só são enviadas para clientes elegíveis conforme o público e o gatilho configurados.
            </p>
          </div>
        </div>
      </Modal>

      <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
        {[
          { label: "Lembretes", value: "reminders" },
          { label: "Agendamentos", value: "booking-events" },
          { label: "Relacionamento", value: "relationship" }
        ].map((item) => (
          <button
            className={`rounded-lg px-4 py-2 text-sm transition ${
              activeTab === item.value ? "bg-primary text-white" : "text-slate-300 hover:bg-white/8"
            }`}
            key={item.value}
            onClick={() => setActiveTab(item.value as AutomationTab)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeTab === "reminders" ? (
        <>
      <Card>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xl font-semibold text-white">Lembretes WhatsApp</p>
            <p className="mt-3 text-slate-300">
              Ative esta chave para permitir que o Hubly agende mensagens antes dos atendimentos. As regras abaixo definem os momentos de envio.
            </p>
          </div>
          <Toggle
            checked={localState.isEnabled}
            onChange={() =>
              setLocalState((state) => ({
                ...state,
                isEnabled: !state.isEnabled
              }))
            }
          />
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xl font-semibold text-white">Quando notificar</p>
            <p className="mt-3 text-slate-300">
              Configure quantas horas antes do agendamento cada lembrete deve ser enviado. O mesmo agendamento pode receber mais de um aviso, respeitando até 10 regras.
            </p>
            <p className="mt-2 text-sm text-slate-400">Exemplos: 2 horas, 6 horas, 24 horas ou 72 horas antes.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:max-w-sm">
            <div className="flex gap-2">
              <Input
                min={1}
                max={720}
                onChange={(event) => setNewReminderHours(event.target.value)}
                placeholder="Horas antes"
                type="number"
                value={newReminderHours}
              />
              <Button disabled={localState.reminders.length >= 10} onClick={addReminderRule} type="button">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-400">Valor permitido: 1 a 720 horas antes.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {localState.reminders.map((hoursBefore) => (
            <div
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              key={hoursBefore}
            >
              <div>
                <p className="font-medium text-white">{hoursBefore}h antes</p>
                <p className="text-sm text-slate-400">Enviar lembrete antes do horário marcado</p>
              </div>
              <button
                aria-label={`Remover lembrete de ${hoursBefore} horas`}
                className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-rose-500/10 hover:text-rose-200"
                onClick={() => removeReminderRule(hoursBefore)}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {localState.reminders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
              Nenhuma regra configurada. Adicione pelo menos uma regra para enviar lembretes.
            </div>
          ) : null}
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Integração WhatsApp</p>
            <div className={`mt-4 inline-flex rounded-lg border px-3 py-2 text-sm font-semibold ${getStatusClasses(statusView.tone)}`}>
              {statusView.title}
            </div>
            <p className="mt-3 text-sm text-slate-300">{statusView.description}</p>
            {connectedPhoneNumber ? (
              <p className="mt-2 text-sm text-slate-400">
                Número usado na conexão: <span className="font-medium text-slate-200">{connectedPhoneNumber}</span>
              </p>
            ) : null}
          </div>
          {statusView.isConnected ? (
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={isFetchingAutomationSettings}
                onClick={() => {
                  void refetchAutomationSettings();
                }}
                variant="secondary"
              >
                Verificar status
              </Button>
              <Button disabled={disconnectMutation.isPending} onClick={() => disconnectMutation.mutate()} variant="secondary">
                Desconectar WhatsApp
              </Button>
            </div>
          ) : (
            <>
              <div className="w-full max-w-sm">
                <p className="mb-2 text-sm text-slate-400">Número para pareamento</p>
                <Input onChange={(event) => setPhoneNumber(event.target.value)} value={phoneNumber} />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button disabled={isCodeRequestPending} onClick={() => sessionMutation.mutate()}>
                  Gerar código
                </Button>
                <Button disabled={isCodeRequestPending} onClick={() => regenerateCodeMutation.mutate()} variant="secondary">
                  <RefreshCw className="h-4 w-4" />
                  Regerar código
                </Button>
              </div>
            </>
          )}
        </div>
        {!statusView.isConnected && latestSessionResult ? (
          <div className="mt-6 rounded-xl border border-sky-400/20 bg-sky-400/10 p-4">
            <p className="text-sm text-slate-300">Conexão WhatsApp</p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              {qrCodeImage ? (
                <img
                  alt="QR Code de conexão do WhatsApp"
                  className="h-44 w-44 rounded-lg border border-white/10 bg-white p-2"
                  src={qrCodeImage}
                />
              ) : null}
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Código de pareamento</p>
                <p className="mt-2 text-2xl font-semibold tracking-[0.2em] text-white">
                  {latestSessionResult.pairingCode ?? latestSessionResult.code ?? "Aguardando retorno"}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Use o QR code quando aparecer. O código continua disponível como alternativa.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          Salvar regras
        </Button>
        <Button disabled={processMutation.isPending} onClick={() => processMutation.mutate()} variant="secondary">
          Processar lembretes pendentes
        </Button>
      </div>
      {saveMutation.error ? <p className="text-sm text-rose-300">{saveMutation.error.message}</p> : null}
      {sessionMutation.error ? <p className="text-sm text-rose-300">{sessionMutation.error.message}</p> : null}
      {regenerateCodeMutation.error ? <p className="text-sm text-rose-300">{regenerateCodeMutation.error.message}</p> : null}
      {processMutation.error ? <p className="text-sm text-rose-300">{processMutation.error.message}</p> : null}
      {disconnectMutation.error ? <p className="text-sm text-rose-300">{disconnectMutation.error.message}</p> : null}

      {processMutation.data ? (
        <Card>
          <p className="text-sm text-slate-400">Processamento mais recente</p>
          <p className="mt-3 text-lg text-white">
            {processMutation.data.processedCount} processados, {processMutation.data.sentCount} enviados,{" "}
            {processMutation.data.failedCount} falharam.
          </p>
        </Card>
      ) : null}
        </>
      ) : activeTab === "booking-events" ? (
        <BookingEventNotificationsPanel
          events={bookingEventState.events}
          isEnabled={bookingEventState.isEnabled}
          onSaveSettings={() => saveBookingEventMutation.mutate()}
          onToggleEvent={toggleBookingEvent}
          saveError={saveBookingEventMutation.error?.message}
          savePending={saveBookingEventMutation.isPending}
          setIsEnabled={(value) => setBookingEventState((state) => ({ ...state, isEnabled: value }))}
        />
      ) : (
        <RelationshipAutomationPanel
          campaignDraft={campaignDraft}
          campaigns={campaigns}
          isEnabled={relationshipEnabled}
          onCreateCampaign={createCampaign}
          onRemoveCampaign={removeCampaign}
          onSaveSettings={() => saveRelationshipMutation.mutate()}
          onToggleCampaignChannel={toggleCampaignChannel}
          onToggleCampaignStatus={toggleCampaignStatus}
          saveError={saveRelationshipMutation.error?.message}
          savePending={saveRelationshipMutation.isPending}
          setCampaignDraft={setCampaignDraft}
          setIsEnabled={setRelationshipEnabled}
        />
      )}
    </div>
  );
}

const bookingEventLabels: Record<BookingEventNotificationType, { title: string; description: string }> = {
  created: {
    title: "Agendamento criado",
    description: "Avisa o cliente quando um novo horário é criado pela equipe ou pela vitrine.",
  },
  confirmed: {
    title: "Agendamento confirmado",
    description: "Avisa o cliente quando a equipe confirma o atendimento.",
  },
  rescheduled: {
    title: "Agendamento reagendado",
    description: "Avisa o cliente quando o horário muda.",
  },
  cancelled: {
    title: "Agendamento cancelado",
    description: "Avisa o cliente quando a equipe cancela o atendimento.",
  },
};

function BookingEventNotificationsPanel({
  events,
  isEnabled,
  onSaveSettings,
  onToggleEvent,
  saveError,
  savePending,
  setIsEnabled
}: {
  events: BookingEventNotificationRule[];
  isEnabled: boolean;
  onSaveSettings: () => void;
  onToggleEvent: (eventType: BookingEventNotificationType) => void;
  saveError?: string;
  savePending: boolean;
  setIsEnabled: (value: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xl font-semibold text-white">Notificações de agendamento</p>
            <p className="mt-3 max-w-2xl text-slate-300">
              Envie mensagens imediatas por WhatsApp quando o agendamento for criado, confirmado, reagendado ou cancelado.
            </p>
          </div>
          <Toggle checked={isEnabled} onChange={() => setIsEnabled(!isEnabled)} />
        </div>
      </Card>

      <Card>
        <div className="grid gap-3 md:grid-cols-2">
          {events.map((item) => {
            const label = bookingEventLabels[item.event];

            return (
              <div
                className={`rounded-lg border p-4 text-left transition ${
                  item.isEnabled
                    ? "border-sky-400/30 bg-sky-400/10"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/5"
                }`}
                key={item.event}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{label.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{label.description}</p>
                  </div>
                  <Toggle checked={item.isEnabled} onChange={() => onToggleEvent(item.event)} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={savePending} onClick={onSaveSettings}>
          <CalendarCheck2 className="mr-2 h-4 w-4" />
          Salvar notificações
        </Button>
        <p className="text-sm text-slate-400">
          O WhatsApp precisa estar conectado. Falhas de envio não bloqueiam a operação da agenda.
        </p>
      </div>
      {saveError ? <p className="text-sm text-rose-300">{saveError}</p> : null}
    </div>
  );
}

function RelationshipAutomationPanel({
  campaignDraft,
  campaigns,
  isEnabled,
  onCreateCampaign,
  onRemoveCampaign,
  onSaveSettings,
  onToggleCampaignChannel,
  onToggleCampaignStatus,
  saveError,
  savePending,
  setIsEnabled,
  setCampaignDraft
}: {
  campaignDraft: CampaignDraft;
  campaigns: RelationshipCampaign[];
  isEnabled: boolean;
  onCreateCampaign: () => void;
  onRemoveCampaign: (campaignId: string) => void;
  onSaveSettings: () => void;
  onToggleCampaignChannel: (channel: CampaignChannel) => void;
  onToggleCampaignStatus: (campaignId: string) => void;
  saveError?: string;
  savePending: boolean;
  setCampaignDraft: React.Dispatch<React.SetStateAction<CampaignDraft>>;
  setIsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xl font-semibold text-white">Promoções e fidelidade</p>
            <p className="mt-3 text-slate-300">
              Configure campanhas automáticas por WhatsApp para trazer clientes de volta depois do último atendimento. Cada campanha combina público, gatilho em dias, mensagem e status ativo ou pausado.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-lg border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-sm text-sky-100">
              <Send className="h-4 w-4" />
              Envio automático
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-white">Relacionamento ativo</p>
                <p className="text-xs text-slate-400">Desligado pausa todos os envios desta aba.</p>
              </div>
              <Toggle checked={isEnabled} onChange={() => setIsEnabled((current) => !current)} />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
          Exemplo: uma campanha chamada Retorno de consulta, com gatilho de 30 dias, envia a mensagem para clientes elegíveis 30 dias depois do último atendimento.
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <FieldHelp
            description="Nome usado só dentro do painel para sua equipe identificar esta regra."
            label="Nome interno da automação"
          >
            <Input
              onChange={(event) => setCampaignDraft((draft) => ({ ...draft, title: event.target.value }))}
              placeholder="Ex: Retorno de consulta"
              value={campaignDraft.title}
            />
          </FieldHelp>

          <FieldHelp
            description="Classifica o objetivo da mensagem. Isso ajuda a organizar campanhas de desconto, retorno ou fidelização."
            label="Tipo de automação"
          >
            <select
              className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-sky-300"
              onChange={(event) =>
                setCampaignDraft((draft) => ({ ...draft, type: event.target.value as CampaignType }))
              }
              value={campaignDraft.type}
            >
              <option className="bg-slate-950" value="promotion">Promoção</option>
              <option className="bg-slate-950" value="loyalty">Programa de fidelidade</option>
            </select>
          </FieldHelp>

          <FieldHelp
            description="Descreve quem deve receber. Exemplo: clientes ativos, clientes sem retorno marcado ou clientes de um serviço específico."
            label="Público alvo"
          >
            <Input
              onChange={(event) => setCampaignDraft((draft) => ({ ...draft, audience: event.target.value }))}
              placeholder="Ex: Clientes sem retorno marcado"
              value={campaignDraft.audience}
            />
          </FieldHelp>

          <FieldHelp
            description="Quantidade de dias após o último atendimento para o cliente entrar na campanha."
            label="Gatilho após último atendimento"
          >
            <Input
              min={1}
              max={365}
              onChange={(event) =>
                setCampaignDraft((draft) => ({
                  ...draft,
                  triggerDaysAfterLastBooking: Number(event.target.value)
                }))
              }
              placeholder="Ex: 30"
              type="number"
              value={campaignDraft.triggerDaysAfterLastBooking}
            />
          </FieldHelp>

          <FieldHelp
            className="lg:col-span-2"
            description="Texto que o cliente recebe no WhatsApp quando atingir o gatilho configurado."
            label="Mensagem enviada"
          >
            <textarea
              className="min-h-28 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300"
              onChange={(event) => setCampaignDraft((draft) => ({ ...draft, message: event.target.value }))}
              placeholder="Ex: Ola, faz um tempo desde seu ultimo atendimento. Temos horarios disponiveis para remarcar."
              value={campaignDraft.message}
            />
          </FieldHelp>
        </div>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white">Canal de envio</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Nesta fase a automação de relacionamento envia pelo WhatsApp conectado.</p>
            <div className="mt-3 flex flex-wrap gap-3">
            {(["whatsapp"] as const).map((channel) => (
              <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200" key={channel}>
                <input
                  checked={campaignDraft.channels.includes(channel)}
                  onChange={() => onToggleCampaignChannel(channel)}
                  type="checkbox"
                />
                WhatsApp
              </label>
            ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Button onClick={onCreateCampaign} type="button">
              <Plus className="mr-2 h-4 w-4" />
              Criar automação
            </Button>
            <p className="max-w-xs text-xs leading-5 text-slate-400 sm:text-right">
              Este botão adiciona a campanha na lista abaixo. Para gravar de verdade, clique em Salvar relacionamento.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {campaigns.map((campaign) => (
          <Card className="bg-panelAlt/80" key={campaign.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-sky-200">
                  <Gift className="h-4 w-4" />
                  {campaign.type === "promotion" ? "Promoção" : "Fidelidade"}
                </div>
                <p className="text-lg font-semibold text-white">{campaign.title}</p>
                <p className="mt-2 text-sm text-slate-300">{campaign.message}</p>
              </div>
              <Toggle checked={campaign.isEnabled} onChange={() => onToggleCampaignStatus(campaign.id)} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <CampaignInfo label="Público" value={campaign.audience} />
              <CampaignInfo label="Disparo" value={`${campaign.triggerDaysAfterLastBooking} dias`} />
              <CampaignInfo label="Canais" value={campaign.channels.map(formatCampaignChannel).join(" + ")} />
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => onRemoveCampaign(campaign.id)} size="sm" variant="ghost">
                <Trash2 className="mr-2 h-4 w-4" />
                Remover
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={savePending} onClick={onSaveSettings} type="button">
          Salvar relacionamento
        </Button>
        {saveError ? <p className="text-sm text-rose-300">{saveError}</p> : null}
      </div>
    </div>
  );
}

function FieldHelp({
  children,
  className = "",
  description,
  label
}: {
  children: React.ReactNode;
  className?: string;
  description: string;
  label: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-white">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-slate-400">{description}</span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function CampaignInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function formatCampaignChannel(channel: CampaignChannel): string {
  return channel === "whatsapp" ? "WhatsApp" : channel;
}
