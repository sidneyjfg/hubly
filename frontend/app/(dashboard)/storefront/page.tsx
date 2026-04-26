"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BriefcaseMedical, Camera, CheckCircle2, CreditCard, Eye, ImagePlus, MapPin, Save, Store, UploadCloud, UserRound } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";

type StorefrontForm = {
  tradeName: string;
  bookingPageSlug: string;
  publicDescription: string;
  publicPhone: string;
  publicEmail: string;
  addressLine: string;
  addressNumber: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  coverImageUrl: string;
  logoImageUrl: string;
  galleryImageUrls: string;
  isStorefrontPublished: boolean;
};

const emptyForm: StorefrontForm = {
  tradeName: "",
  bookingPageSlug: "",
  publicDescription: "",
  publicPhone: "",
  publicEmail: "",
  addressLine: "",
  addressNumber: "",
  district: "",
  city: "",
  state: "",
  postalCode: "",
  coverImageUrl: "",
  logoImageUrl: "",
  galleryImageUrls: "",
  isStorefrontPublished: false
};

const toNullable = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseGallery = (value: string): string[] =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const buildAddress = (form: StorefrontForm): string => {
  const street = [form.addressLine, form.addressNumber].filter(Boolean).join(", ");
  const location = [form.district, form.city, form.state].filter(Boolean).join(" - ");
  return [street, location].filter(Boolean).join(" · ");
};

const bpsFromPercent = (value: string): number => {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) {
    return 0;
  }

  return Math.round(Number(normalized) * 100);
};

const percentFromBps = (value: number): string => (value / 100).toFixed(2);

type ReadinessItem = {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
  href: string;
};

export default function StorefrontPage() {
  const queryClient = useQueryClient();
  const role = useAppStore((state) => state.currentUser?.role);
  const isAdministrator = role === "administrator";
  const [form, setForm] = useState<StorefrontForm>(emptyForm);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [commissionRate, setCommissionRate] = useState("10.00");
  const [onlineDiscount, setOnlineDiscount] = useState("5.00");
  const [absorbsProcessingFee, setAbsorbsProcessingFee] = useState(true);

  const { data } = useQuery({
    queryKey: ["storefront"],
    queryFn: api.getStorefront
  });

  const providersQuery = useQuery({
    queryKey: ["providers-readiness"],
    queryFn: () => api.getProviders({ page: 1, limit: 100 })
  });

  const servicesQuery = useQuery({
    queryKey: ["services-readiness"],
    queryFn: () => api.getServiceOfferings({ page: 1, limit: 100 })
  });

  const paymentSettingsQuery = useQuery({
    queryKey: ["organization-payment-settings"],
    queryFn: api.getOrganizationPaymentSettings,
    enabled: isAdministrator
  });

  const providerIds = useMemo(
    () => (providersQuery.data?.items ?? []).filter((provider) => provider.isActive).map((provider) => provider.id),
    [providersQuery.data?.items]
  );

  const readinessQuery = useQuery({
    queryKey: ["storefront-readiness-details", providerIds],
    queryFn: async () => {
      const details = await Promise.all(
        providerIds.map(async (providerId) => {
          const availability = await api.getProviderAvailability(providerId);

          return {
            providerId,
            availability
          };
        })
      );

      return details;
    },
    enabled: providerIds.length > 0
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    setForm({
      tradeName: data.tradeName,
      bookingPageSlug: data.bookingPageSlug,
      publicDescription: data.publicDescription ?? "",
      publicPhone: data.publicPhone ?? "",
      publicEmail: data.publicEmail ?? "",
      addressLine: data.addressLine ?? "",
      addressNumber: data.addressNumber ?? "",
      district: data.district ?? "",
      city: data.city ?? "",
      state: data.state ?? "",
      postalCode: data.postalCode ?? "",
      coverImageUrl: data.coverImageUrl ?? "",
      logoImageUrl: data.logoImageUrl ?? "",
      galleryImageUrls: (data.galleryImageUrls ?? []).join("\n"),
      isStorefrontPublished: data.isStorefrontPublished
    });
  }, [data]);

  useEffect(() => {
    if (!paymentSettingsQuery.data) {
      return;
    }

    setCommissionRate(percentFromBps(paymentSettingsQuery.data.commissionRateBps));
    setOnlineDiscount(percentFromBps(paymentSettingsQuery.data.onlineDiscountBps));
    setAbsorbsProcessingFee(paymentSettingsQuery.data.absorbsProcessingFee);
  }, [paymentSettingsQuery.data]);

  const gallery = useMemo(() => parseGallery(form.galleryImageUrls), [form.galleryImageUrls]);
  const previewImages = [form.coverImageUrl, ...gallery].filter((url) => url.trim().length > 0);
  const address = buildAddress(form);
  const activeProviders = providersQuery.data?.items.filter((provider) => provider.isActive) ?? [];
  const activePricedServices = servicesQuery.data?.items.filter((service) => service.isActive && (service.priceCents ?? 0) > 0) ?? [];
  const hasPaymentAccount = Boolean(
    isAdministrator && paymentSettingsQuery.data?.mercadoPagoConnected && paymentSettingsQuery.data.mercadoPagoAccessToken
  );
  const schedulableProviderIds = new Set(
    (readinessQuery.data ?? [])
      .filter((item) => item.availability.some((availability) => availability.isActive))
      .map((item) => item.providerId)
  );
  const readyProviderIds = new Set(
    activeProviders
      .filter((provider) =>
        activePricedServices.some((service) => service.providerId === provider.id)
          && hasPaymentAccount
          && schedulableProviderIds.has(provider.id)
      )
      .map((provider) => provider.id)
  );
  const hasMinimumPublicProfile = Boolean(
    form.tradeName.trim()
      && form.publicDescription.trim()
      && (form.publicPhone.trim() || form.publicEmail.trim())
      && form.addressLine.trim()
      && form.city.trim()
      && form.state.trim()
      && form.coverImageUrl.trim()
  );
  const checklist: ReadinessItem[] = [
    {
      id: "profile",
      label: "Perfil público completo",
      description: "Nome, descrição, contato, endereço e foto de capa preenchidos.",
      isComplete: hasMinimumPublicProfile,
      href: "/storefront"
    },
    {
      id: "publish",
      label: "Vitrine publicada",
      description: "O seletor de publicação precisa estar ativo.",
      isComplete: form.isStorefrontPublished,
      href: "/storefront"
    },
    {
      id: "providers",
      label: "Profissional ativo",
      description: "Cadastre e mantenha pelo menos um profissional ativo.",
      isComplete: activeProviders.length > 0,
      href: "/providers"
    },
    {
      id: "services",
      label: "Serviço com preço",
      description: "O serviço precisa estar ativo e ter preço para gerar pagamento.",
      isComplete: activePricedServices.length > 0,
      href: "/providers"
    },
    {
      id: "payments",
      label: "Mercado Pago conectado",
      description: isAdministrator
        ? "Conecte a conta Mercado Pago da clínica ou barbearia."
        : "Somente administrador configura a conta Mercado Pago.",
      isComplete: hasPaymentAccount,
      href: "/storefront"
    },
    {
      id: "availability",
      label: "Agenda disponível",
      description: "O profissional precisa ter disponibilidade ativa para aceitar horários.",
      isComplete: schedulableProviderIds.size > 0,
      href: "/providers"
    },
    {
      id: "ready",
      label: "Conta pronta para venda",
      description: "A conta precisa ter serviço com preço, agenda e Mercado Pago conectado.",
      isComplete: readyProviderIds.size > 0,
      href: "/providers"
    }
  ];
  const completedChecklistCount = checklist.filter((item) => item.isComplete).length;

  const updateField = (field: keyof StorefrontForm, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const mutation = useMutation({
    mutationFn: () =>
      api.updateStorefront({
        tradeName: form.tradeName,
        bookingPageSlug: form.bookingPageSlug,
        publicDescription: toNullable(form.publicDescription),
        publicPhone: toNullable(form.publicPhone),
        publicEmail: toNullable(form.publicEmail),
        addressLine: toNullable(form.addressLine),
        addressNumber: toNullable(form.addressNumber),
        district: toNullable(form.district),
        city: toNullable(form.city),
        state: toNullable(form.state.toUpperCase()),
        postalCode: toNullable(form.postalCode),
        coverImageUrl: toNullable(form.coverImageUrl),
        logoImageUrl: toNullable(form.logoImageUrl),
        galleryImageUrls: gallery,
        isStorefrontPublished: form.isStorefrontPublished
      }),
    meta: {
      errorMessage: "Vitrine não salva",
      successMessage: "Vitrine salva com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["storefront"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    }
  });

  const paymentSettingsMutation = useMutation({
    mutationFn: () =>
      api.updateOrganizationPaymentSettings({
        commissionRateBps: bpsFromPercent(commissionRate),
        onlineDiscountBps: bpsFromPercent(onlineDiscount),
        absorbsProcessingFee
      }),
    meta: {
      errorMessage: "Configuração de pagamento não salva",
      successMessage: "Configuração de pagamento salva com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["organization-payment-settings"] });
    }
  });

  const mercadoPagoConnectMutation = useMutation({
    mutationFn: api.createOrganizationMercadoPagoConnectUrl,
    meta: {
      errorMessage: "Conexão Mercado Pago não iniciada",
      successMessage: "Abrindo autorização do Mercado Pago"
    },
    onSuccess: (result) => {
      window.location.href = result.authorizationUrl;
    }
  });

  const selectedPhotoUrl = selectedPhoto ?? previewImages[0] ?? "";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Vitrine</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Perfil público da empresa</h1>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-sm text-slate-300">{form.isStorefrontPublished ? "Publicado" : "Rascunho"}</span>
            <Toggle checked={form.isStorefrontPublished} onChange={() => updateField("isStorefrontPublished", !form.isStorefrontPublished)} />
          </div>
        </div>

        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Checklist de publicação</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Pronto para aparecer para clientes</h2>
              <p className="mt-2 text-sm text-slate-300">
                Só aparece em /clientes quando o negócio consegue receber pagamento e aceitar agendamentos.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              {completedChecklistCount}/{checklist.length} concluídos
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {checklist.map((item) => (
              <Link
                className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
                href={item.href}
                key={item.id}
              >
                {item.isComplete ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                )}
                <span>
                  <span className="block text-sm font-semibold text-white">{item.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">{item.description}</span>
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink href="/providers" variant="secondary">
              <UserRound className="mr-2 h-4 w-4" />
              Configurar profissionais
            </ButtonLink>
            <ButtonLink href="/providers" variant="secondary">
              <BriefcaseMedical className="mr-2 h-4 w-4" />
              Configurar serviços
            </ButtonLink>
          </div>
        </Card>

        {isAdministrator ? (
        <Card>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-white">Conta de pagamento</p>
              <p className="text-sm text-slate-400">
                Conexão Mercado Pago da clínica ou barbearia. Todos os pagamentos online usam esta conta.
              </p>
            </div>
          </div>
          <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            Mercado Pago: {hasPaymentAccount ? "conectado" : "não conectado"}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              onChange={(event) => setCommissionRate(event.target.value)}
              placeholder="Comissão da plataforma em %, ex: 10"
              value={commissionRate}
            />
            <Input
              onChange={(event) => setOnlineDiscount(event.target.value)}
              placeholder="Desconto online em %, ex: 5"
              value={onlineDiscount}
            />
          </div>
          <label className="mt-4 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
            <input
              checked={absorbsProcessingFee}
              className="h-4 w-4"
              onChange={(event) => setAbsorbsProcessingFee(event.target.checked)}
              type="checkbox"
            />
            A conta absorve a taxa de processamento
          </label>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button disabled={paymentSettingsMutation.isPending} onClick={() => paymentSettingsMutation.mutate()}>
              <Save className="mr-2 h-4 w-4" />
              Salvar pagamentos
            </Button>
            <Button
              disabled={mercadoPagoConnectMutation.isPending}
              onClick={() => mercadoPagoConnectMutation.mutate()}
              variant="secondary"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Conectar Mercado Pago
            </Button>
            {paymentSettingsMutation.error ? <p className="text-sm text-rose-300">{paymentSettingsMutation.error.message}</p> : null}
            {mercadoPagoConnectMutation.error ? <p className="text-sm text-rose-300">{mercadoPagoConnectMutation.error.message}</p> : null}
          </div>
        </Card>
        ) : null}

        <Card>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-white">Informações principais</p>
              <p className="text-sm text-slate-400">Nome, descrição e contato que aparecem para clientes.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input onChange={(event) => updateField("tradeName", event.target.value)} placeholder="Nome público" value={form.tradeName} />
            <Input onChange={(event) => updateField("bookingPageSlug", event.target.value)} placeholder="Link da vitrine" value={form.bookingPageSlug} />
            <Input onChange={(event) => updateField("publicPhone", event.target.value)} placeholder="Telefone público" value={form.publicPhone} />
            <Input onChange={(event) => updateField("publicEmail", event.target.value)} placeholder="E-mail público" value={form.publicEmail} />
            <textarea
              className="min-h-28 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-primary/60 focus:bg-white/8 md:col-span-2"
              maxLength={500}
              onChange={(event) => updateField("publicDescription", event.target.value)}
              placeholder="Descrição curta do negócio, diferenciais e experiência oferecida"
              value={form.publicDescription}
            />
          </div>
        </Card>

        <Card>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-white">Endereço</p>
              <p className="text-sm text-slate-400">Localização usada para confiança e decisão do cliente.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_120px]">
            <Input onChange={(event) => updateField("addressLine", event.target.value)} placeholder="Rua ou avenida" value={form.addressLine} />
            <Input onChange={(event) => updateField("addressNumber", event.target.value)} placeholder="Número" value={form.addressNumber} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <Input onChange={(event) => updateField("district", event.target.value)} placeholder="Bairro" value={form.district} />
            <Input className="md:col-span-2" onChange={(event) => updateField("city", event.target.value)} placeholder="Cidade" value={form.city} />
            <Input maxLength={2} onChange={(event) => updateField("state", event.target.value.toUpperCase())} placeholder="UF" value={form.state} />
            <Input className="md:col-span-4" onChange={(event) => updateField("postalCode", event.target.value)} placeholder="CEP" value={form.postalCode} />
          </div>
        </Card>

        <Card>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-white">Fotos da vitrine</p>
              <p className="text-sm text-slate-400">Use imagens reais do espaço, equipe, fachada e resultados visuais.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input onChange={(event) => updateField("coverImageUrl", event.target.value)} placeholder="URL da foto de capa" value={form.coverImageUrl} />
            <Input onChange={(event) => updateField("logoImageUrl", event.target.value)} placeholder="URL do logo ou avatar" value={form.logoImageUrl} />
            <textarea
              className="min-h-36 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-primary/60 focus:bg-white/8 md:col-span-2"
              onChange={(event) => updateField("galleryImageUrls", event.target.value)}
              placeholder="URLs da galeria, uma por linha"
              value={form.galleryImageUrls}
            />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
              <Save className="mr-2 h-4 w-4" />
              Salvar vitrine
            </Button>
            {mutation.error ? <p className="text-sm text-rose-300">{mutation.error.message}</p> : null}
          </div>
        </Card>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
        <Card className="overflow-hidden p-0">
          <div className="relative h-44 bg-white/5">
            {form.coverImageUrl ? (
              <div
                aria-label="Capa da vitrine"
                className="h-full w-full bg-cover bg-center"
                role="img"
                style={{ backgroundImage: `url(${form.coverImageUrl})` }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">
                <UploadCloud className="h-8 w-8" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/15 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-end gap-3">
              <div className="flex h-16 w-16 overflow-hidden rounded-lg border border-white/20 bg-slate-900">
                {form.logoImageUrl ? (
                  <div
                    aria-label="Logo da vitrine"
                    className="h-full w-full bg-cover bg-center"
                    role="img"
                    style={{ backgroundImage: `url(${form.logoImageUrl})` }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sky-300">
                    <Store className="h-7 w-7" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{form.tradeName || "Nome da empresa"}</p>
                <p className="text-sm text-slate-300">{form.city || "Cidade"}{form.state ? `, ${form.state}` : ""}</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs text-sky-200">
              <Eye className="h-3.5 w-3.5" />
              Primeira impressão
            </div>
            <p className="text-sm leading-6 text-slate-300">
              {form.publicDescription || "Descrição curta para mostrar ao cliente por que escolher este profissional."}
            </p>
            {address ? <p className="mt-4 text-sm text-slate-400">{address}</p> : null}
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-slate-400">Telefone</p>
                <p className="mt-1 truncate text-white">{form.publicPhone || "Não informado"}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-slate-400">Status</p>
                <p className="mt-1 text-white">{form.isStorefrontPublished ? "Visível" : "Rascunho"}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-sky-300" />
            <p className="font-semibold text-white">Galeria aberta</p>
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-white/5">
            {selectedPhotoUrl ? (
              <div
                aria-label="Foto selecionada da vitrine"
                className="h-full w-full bg-cover bg-center"
                role="img"
                style={{ backgroundImage: `url(${selectedPhotoUrl})` }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Sem fotos</div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {previewImages.slice(0, 8).map((url) => (
              <button
                className="aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5"
                key={url}
                onClick={() => setSelectedPhoto(url)}
                type="button"
              >
                <span
                  aria-label="Miniatura da vitrine"
                  className="block h-full w-full bg-cover bg-center"
                  role="img"
                  style={{ backgroundImage: `url(${url})` }}
                />
              </button>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}
