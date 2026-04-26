"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Eye, ImagePlus, MapPin, Save, Store, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { api } from "@/lib/api";

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

export default function StorefrontPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<StorefrontForm>(emptyForm);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["storefront"],
    queryFn: api.getStorefront
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

  const gallery = useMemo(() => parseGallery(form.galleryImageUrls), [form.galleryImageUrls]);
  const previewImages = [form.coverImageUrl, ...gallery].filter((url) => url.trim().length > 0);
  const address = buildAddress(form);

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
