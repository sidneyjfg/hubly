"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BriefcaseMedical, Camera, CheckCircle2, Eye, HelpCircle, ImagePlus, LockKeyhole, MapPin, Save, Store, Trash2, UploadCloud, UserRound } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { api } from "@/lib/api";
import type { BookingEventNotificationSettings } from "@/lib/types";
import { usePlanAccess } from "@/components/billing/plan-access-provider";

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
  galleryImageUrls: string[];
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
  galleryImageUrls: [],
  isStorefrontPublished: false
};

const toNullable = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const buildAddress = (form: StorefrontForm): string => {
  const street = [form.addressLine, form.addressNumber].filter(Boolean).join(", ");
  const location = [form.district, form.city, form.state].filter(Boolean).join(" - ");
  return [street, location].filter(Boolean).join(" · ");
};

type ReadinessItem = {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
  href?: string;
  targetStepId?: string;
};

type GuideStep = {
  id: string;
  title: string;
  clickTarget: string;
  outcome: string;
  href?: string;
};

type StorefrontImageSlot = "cover" | "logo" | "gallery";

const isBookingAutomationReady = (
  settings: BookingEventNotificationSettings | undefined,
  planCode: "free" | "pro" | "premium"
): boolean => {
  if (!settings?.isEnabled) {
    return false;
  }

  const enabledEvents = new Set(
    settings.events
      .filter((eventRule) => eventRule.isEnabled)
      .map((eventRule) => eventRule.event)
  );

  const requiredEvents = planCode === "free"
    ? ["created", "cancelled"] as const
    : ["created", "confirmed", "rescheduled", "cancelled"] as const;

  return requiredEvents.every((eventType) => enabledEvents.has(eventType));
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Não foi possível ler a imagem selecionada."));
    });
    reader.addEventListener("error", () => reject(new Error("Não foi possível ler a imagem selecionada.")));
    reader.readAsDataURL(file);
  });

export default function StorefrontPage() {
  const { currentPlan, requestUpgrade } = usePlanAccess();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<StorefrontForm>(emptyForm);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activeGuideStep, setActiveGuideStep] = useState("profile");
  const [uploadingSlot, setUploadingSlot] = useState<StorefrontImageSlot | null>(null);
  const [pendingDeleteUrls, setPendingDeleteUrls] = useState<string[]>([]);

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

  const bookingAutomationQuery = useQuery({
    queryKey: ["storefront-booking-automation"],
    queryFn: api.getBookingEventSettings
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
      galleryImageUrls: data.galleryImageUrls ?? [],
      isStorefrontPublished: data.isStorefrontPublished
    });
  }, [data]);

  const gallery = form.galleryImageUrls;
  const galleryLimit = currentPlan === "free" ? 1 : 12;
  const isGalleryUploadBlocked = gallery.length >= galleryLimit;
  const previewImages = [form.coverImageUrl, ...gallery].filter((url) => url.trim().length > 0);
  const address = buildAddress(form);
  const activeProviders = providersQuery.data?.items.filter((provider) => provider.isActive) ?? [];
  const activePricedServices = servicesQuery.data?.items.filter((service) => service.isActive && (service.priceCents ?? 0) > 0) ?? [];
  const schedulableProviderIds = new Set(
    (readinessQuery.data ?? [])
      .filter((item) => item.availability.some((availability) => availability.isActive))
      .map((item) => item.providerId)
  );
  const readyProviderIds = new Set(
    activeProviders
      .filter((provider) =>
        activePricedServices.some((service) => service.providerId === provider.id)
          && schedulableProviderIds.has(provider.id)
      )
      .map((provider) => provider.id)
  );
  const hasBookingAutomation = isBookingAutomationReady(bookingAutomationQuery.data, currentPlan);
  const hasPublicProfileInfo = Boolean(
    form.tradeName.trim()
      && form.publicDescription.trim()
      && (form.publicPhone.trim() || form.publicEmail.trim())
  );
  const hasPublicAddress = Boolean(form.addressLine.trim() && form.city.trim() && form.state.trim());
  const hasStorefrontPhoto = Boolean(form.coverImageUrl.trim());
  const hasMinimumPublicProfile = hasPublicProfileInfo && hasPublicAddress && hasStorefrontPhoto;
  const canPublishStorefront = hasMinimumPublicProfile
    && activeProviders.length > 0
    && activePricedServices.length > 0
    && schedulableProviderIds.size > 0
    && readyProviderIds.size > 0
    && hasBookingAutomation;
  const checklist: ReadinessItem[] = [
    {
      id: "profile",
      label: "Perfil público completo",
      description: "Nome, descrição e contato preenchidos.",
      isComplete: hasPublicProfileInfo,
      targetStepId: "profile"
    },
    {
      id: "address",
      label: "Endereço completo",
      description: "Rua, cidade e UF preenchidos para descoberta local.",
      isComplete: hasPublicAddress,
      targetStepId: "address"
    },
    {
      id: "photos",
      label: "Foto de capa",
      description: "Inclua capa e, se possível, galeria com imagens reais.",
      isComplete: hasStorefrontPhoto,
      targetStepId: "photos"
    },
    {
      id: "providers",
      label: "Profissional ativo",
      description: "Cadastre e mantenha pelo menos um profissional ativo.",
      isComplete: activeProviders.length > 0,
      href: "/providers#providers-list"
    },
    {
      id: "services",
      label: "Serviço com preço",
      description: "O serviço precisa estar ativo e ter preço para aparecer no perfil público.",
      isComplete: activePricedServices.length > 0,
      href: "/providers#services-list"
    },
    {
      id: "availability",
      label: "Agenda disponível",
      description: "O profissional precisa ter disponibilidade ativa para aceitar horários.",
      isComplete: schedulableProviderIds.size > 0,
      href: "/providers#providers-list"
    },
    {
      id: "ready",
      label: "Perfil pronto para agendamento",
      description: "O perfil precisa ter serviço com preço, profissional ativo e agenda disponível.",
      isComplete: readyProviderIds.size > 0,
      href: "/providers#providers-list"
    },
    {
      id: "automations",
      label: "Automações de agendamento",
      description: "Ative notificações de criação, confirmação, reagendamento e cancelamento.",
      isComplete: hasBookingAutomation,
      href: "/automations"
    },
    {
      id: "publish",
      label: "Vitrine publicada",
      description: "Ative Publicado e salve quando os passos anteriores estiverem completos.",
      isComplete: form.isStorefrontPublished && canPublishStorefront,
      targetStepId: "publish"
    }
  ];
  const completedChecklistCount = checklist.filter((item) => item.isComplete).length;

  const updateField = (field: keyof StorefrontForm, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const updateGallery = (galleryImageUrls: string[]) => {
    setForm((current) => ({
      ...current,
      galleryImageUrls
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
        isStorefrontPublished: canPublishStorefront ? form.isStorefrontPublished : false
      }),
    meta: {
      errorMessage: "Vitrine não salva",
      successMessage: "Vitrine salva com sucesso"
    },
    onSuccess: async () => {
      const urlsToDelete = pendingDeleteUrls;
      setPendingDeleteUrls([]);
      await queryClient.invalidateQueries({ queryKey: ["storefront"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });

      if (urlsToDelete.length > 0) {
        await Promise.allSettled(urlsToDelete.map((url) => api.deleteStorefrontImage(url)));
      }
    }
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ file, slot }: { file: File; slot: StorefrontImageSlot }) => {
      setUploadingSlot(slot);
      const dataUrl = await readFileAsDataUrl(file);
      return api.uploadStorefrontImage({
        slot,
        fileName: file.name,
        contentType: file.type,
        data: dataUrl
      });
    },
    meta: {
      errorMessage: "Imagem não enviada",
      successMessage: "Imagem adicionada à vitrine"
    },
    onSuccess: (result, variables) => {
      if (variables.slot === "cover") {
        updateField("coverImageUrl", result.url);
        return;
      }

      if (variables.slot === "logo") {
        updateField("logoImageUrl", result.url);
        return;
      }

      updateGallery([...gallery, result.url]);
      setSelectedPhoto(result.url);
    },
    onSettled: () => setUploadingSlot(null)
  });

  const handleImageUpload = (slot: StorefrontImageSlot, file: File | undefined) => {
    if (!file) {
      return;
    }

    uploadImageMutation.mutate({ file, slot });
  };

  const removeImage = (slot: StorefrontImageSlot, url: string) => {
    if (slot === "cover") {
      updateField("coverImageUrl", "");
    } else if (slot === "logo") {
      updateField("logoImageUrl", "");
    } else {
      updateGallery(gallery.filter((item) => item !== url));
    }

    if (selectedPhoto === url) {
      setSelectedPhoto(null);
    }

    setPendingDeleteUrls((current) => (current.includes(url) ? current : [...current, url]));
  };

  const selectedPhotoUrl = selectedPhoto ?? previewImages[0] ?? "";
  const isVisiblyPublished = form.isStorefrontPublished && canPublishStorefront;
  const guideSteps: GuideStep[] = [
    {
      id: "profile",
      title: "Complete o perfil público",
      clickTarget: "Clique no bloco Informações principais e preencha nome, link, contato e descrição.",
      outcome: "Esses dados formam o texto inicial que o cliente vê antes de escolher um serviço."
    },
    {
      id: "address",
      title: "Informe a localização",
      clickTarget: "Clique no bloco Endereço e preencha rua, número, bairro, cidade, UF e CEP.",
      outcome: "A vitrine ganha contexto local e passa a aparecer corretamente na descoberta por região."
    },
    {
      id: "photos",
      title: "Adicione fotos reais",
      clickTarget: "Clique em Fotos da vitrine e envie capa, logo e pelo menos uma foto de galeria.",
      outcome: "A página pública só é liberada quando há imagens suficientes para não ficar incompleta."
    },
    {
      id: "team",
      title: "Configure equipe, serviços e agenda",
      clickTarget: "Clique em Configurar profissionais e cadastre profissional ativo, serviço com preço e disponibilidade.",
      outcome: "Somente profissionais prontos aparecem para o cliente escolher horário.",
      href: "/providers#providers-list"
    },
    {
      id: "automations",
      title: "Ative automações de agendamento",
      clickTarget: "Clique em Configurar automações e habilite criado, confirmado, reagendado e cancelado.",
      outcome: "A vitrine só fica disponível quando o cliente recebe avisos essenciais do agendamento.",
      href: "/automations"
    },
    {
      id: "publish",
      title: "Publique a vitrine",
      clickTarget: "Volte para esta tela, ative Publicado no topo e clique em Salvar vitrine.",
      outcome: "Se todos os passos estiverem completos, a empresa aparece em /clientes e recebe agendamentos."
    }
  ];

  const focusStorefrontStep = (stepId: string) => {
    setActiveGuideStep(stepId);
    document.getElementById(`storefront-step-${stepId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  };

  const focusGuideStep = (step: GuideStep) => focusStorefrontStep(step.id);

  const focusClass = (stepId: string): string =>
    activeGuideStep === stepId ? "ring-2 ring-sky-300/70 ring-offset-2 ring-offset-background" : "";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Vitrine</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Perfil público da empresa</h1>
          </div>
          <div
            className={`flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 ${focusClass("publish")}`}
            id="storefront-step-publish"
          >
            <span className="text-sm text-slate-300">{isVisiblyPublished ? "Publicado" : "Rascunho"}</span>
            <span className={!canPublishStorefront ? "opacity-50" : undefined}>
              <Toggle
                checked={isVisiblyPublished}
                onChange={() => {
                  if (canPublishStorefront) {
                    updateField("isStorefrontPublished", !form.isStorefrontPublished);
                  }
                }}
              />
            </span>
          </div>
        </div>
        <Card className="border-sky-300/20 bg-sky-400/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-sky-200" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-100">Ajuda rapida</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Vitrine nao publica ou nao aparece em /clientes?</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                  A vitrine so fica publica quando perfil, endereco, foto de capa, profissional, servico com preco, agenda e automacoes estao completos.
                </p>
              </div>
            </div>
            <ButtonLink href="/help#storefront" variant="secondary">Ver checklist</ButtonLink>
          </div>
        </Card>

        {!canPublishStorefront ? (
          <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
            A vitrine fica bloqueada para clientes até perfil, profissionais, serviços, agenda e automações estarem configurados corretamente.
          </div>
        ) : null}

        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Passo a passo</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Configure na ordem certa</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Clique em um passo para destacar onde preencher e entender o que muda para o cliente final.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              Vitrine: {isVisiblyPublished ? "visível" : "bloqueada"}
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {guideSteps.map((step, index) => {
              const content = (
                <>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-400/15 text-sm font-semibold text-sky-100">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{step.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-400">{step.clickTarget}</span>
                    <span className="mt-1 block text-xs leading-5 text-emerald-200">{step.outcome}</span>
                  </span>
                </>
              );

              return step.href ? (
                <Link
                  className={`flex gap-3 rounded-lg border p-4 text-left transition ${
                    activeGuideStep === step.id ? "border-sky-300 bg-sky-400/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                  href={step.href}
                  key={step.id}
                  onClick={() => setActiveGuideStep(step.id)}
                >
                  {content}
                </Link>
              ) : (
                <button
                  className={`flex gap-3 rounded-lg border p-4 text-left transition ${
                    activeGuideStep === step.id ? "border-sky-300 bg-sky-400/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                  key={step.id}
                  onClick={() => focusGuideStep(step)}
                  type="button"
                >
                  {content}
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Checklist de publicação</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Pronto para aparecer para clientes</h2>
              <p className="mt-2 text-sm text-slate-300">
                Só aparece em /clientes quando o negócio consegue apresentar seus serviços e aceitar agendamentos.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              {completedChecklistCount}/{checklist.length} concluídos
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {checklist.map((item, index) => {
              const content = (
                <>
                  <span className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-semibold text-slate-200">
                      {index + 1}
                    </span>
                    {item.isComplete ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                    )}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{item.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-400">{item.description}</span>
                  </span>
                </>
              );

              return item.href ? (
                <Link
                  className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-left transition hover:bg-white/[0.06]"
                  href={item.href}
                  key={item.id}
                >
                  {content}
                </Link>
              ) : (
                <button
                  className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-left transition hover:bg-white/[0.06]"
                  key={item.id}
                  onClick={() => focusStorefrontStep(item.targetStepId ?? item.id)}
                  type="button"
                >
                  {content}
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink href="/providers#providers-list" variant="secondary">
              <UserRound className="mr-2 h-4 w-4" />
              Configurar profissionais
            </ButtonLink>
            <ButtonLink href="/providers#services-list" variant="secondary">
              <BriefcaseMedical className="mr-2 h-4 w-4" />
              Configurar serviços
            </ButtonLink>
            <ButtonLink href="/automations" variant="secondary">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Configurar automações
            </ButtonLink>
          </div>
        </Card>

        <Card id="storefront-step-profile" className={focusClass("profile")}>
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

        <Card id="storefront-step-address" className={focusClass("address")}>
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

        <Card id="storefront-step-photos" className={focusClass("photos")}>
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
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-white">Foto de capa</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Imagem principal exibida no topo da vitrine.</p>
              {form.coverImageUrl ? (
                <div className="mt-4 aspect-[16/9] overflow-hidden rounded-lg border border-white/10 bg-white/5">
                  <div
                    aria-label="Foto de capa atual"
                    className="h-full w-full bg-cover bg-center"
                    role="img"
                    style={{ backgroundImage: `url(${form.coverImageUrl})` }}
                  />
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {uploadingSlot === "cover" ? "Enviando..." : "Enviar capa"}
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploadImageMutation.isPending}
                    onChange={(event) => {
                      handleImageUpload("cover", event.target.files?.[0]);
                      event.target.value = "";
                    }}
                    type="file"
                  />
                </label>
                {form.coverImageUrl ? (
                  <Button disabled={mutation.isPending} onClick={() => removeImage("cover", form.coverImageUrl)} type="button" variant="secondary">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-white">Logo ou avatar</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Imagem quadrada usada ao lado do nome público.</p>
              {form.logoImageUrl ? (
                <div className="mt-4 h-28 w-28 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                  <div
                    aria-label="Logo atual"
                    className="h-full w-full bg-cover bg-center"
                    role="img"
                    style={{ backgroundImage: `url(${form.logoImageUrl})` }}
                  />
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {uploadingSlot === "logo" ? "Enviando..." : "Enviar logo"}
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploadImageMutation.isPending}
                    onChange={(event) => {
                      handleImageUpload("logo", event.target.files?.[0]);
                      event.target.value = "";
                    }}
                    type="file"
                  />
                </label>
                {form.logoImageUrl ? (
                  <Button disabled={mutation.isPending} onClick={() => removeImage("logo", form.logoImageUrl)} type="button" variant="secondary">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Galeria</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Fotos complementares do espaço, equipe, fachada e resultados visuais.</p>
                </div>
                {isGalleryUploadBlocked ? (
                  <button
                    className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 opacity-70"
                    onClick={() => requestUpgrade({ feature: `Mais de ${galleryLimit} fotos na galeria`, requiredPlan: currentPlan === "free" ? "pro" : "premium" })}
                    type="button"
                  >
                    <LockKeyhole className="mr-2 h-4 w-4" />Adicionar foto
                  </button>
                ) : (
                <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                  <ImagePlus className="mr-2 h-4 w-4" />
                  {uploadingSlot === "gallery" ? "Enviando..." : "Adicionar foto"}
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploadImageMutation.isPending}
                    onChange={(event) => {
                      handleImageUpload("gallery", event.target.files?.[0]);
                      event.target.value = "";
                    }}
                    type="file"
                  />
                </label>
                )}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {gallery.map((url) => (
                  <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5" key={url}>
                    <button className="block aspect-[4/3] w-full" onClick={() => setSelectedPhoto(url)} type="button">
                      <span
                        aria-label="Foto da galeria"
                        className="block h-full w-full bg-cover bg-center"
                        role="img"
                        style={{ backgroundImage: `url(${url})` }}
                      />
                    </button>
                    <div className="flex items-center justify-between gap-2 p-2">
                      <span className="truncate text-xs text-slate-400">{url}</span>
                      <Button disabled={mutation.isPending} onClick={() => removeImage("gallery", url)} size="sm" type="button" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {gallery.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/10 p-6 text-sm text-slate-400">
                    Nenhuma foto de galeria adicionada.
                  </div>
                ) : null}
              </div>
            </div>
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
                <p className="mt-1 text-white">{isVisiblyPublished ? "Visível" : "Rascunho"}</p>
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
