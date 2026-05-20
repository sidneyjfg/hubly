"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BriefcaseMedical, Pencil, Plus, Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableRoot, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import type { Provider, ServiceOffering } from "@/lib/types";

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

export default function ProvidersPage() {
  const [providerPage, setProviderPage] = useState(1);
  const [servicePage, setServicePage] = useState(1);
  const [providerForm, setProviderForm] = useState<ProviderFormState | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceFormState | null>(null);
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

  const providers = providersQuery.data?.items ?? [];
  const services = servicesQuery.data?.items ?? [];

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
          <Button onClick={() => setServiceForm({ ...emptyServiceForm, providerId: providers[0]?.id ?? "" })} variant="secondary">
            <BriefcaseMedical className="mr-2 h-4 w-4" />
            Novo serviço
          </Button>
        </div>
      </div>

      <Card className="p-0">
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

      <Card className="p-0">
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
